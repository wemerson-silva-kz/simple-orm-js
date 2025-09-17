"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CassandraORM = void 0;
const cassandra_driver_1 = require("cassandra-driver");
const converter_1 = require("./converter");
const validator_1 = require("./validator");
const errors_1 = require("./errors");
class CassandraORM {
    constructor(config) {
        this.config = config;
        this.connected = false;
        this.models = new Map();
        this.client = new cassandra_driver_1.Client(config.clientOptions);
        this.keyspace = config.clientOptions.keyspace || 'app';
    }
    async connect() {
        if (this.connected)
            return;
        try {
            const tempClient = new cassandra_driver_1.Client({
                ...this.config.clientOptions,
                keyspace: undefined
            });
            await tempClient.connect();
            if (this.config.ormOptions?.createKeyspace) {
                await this.createKeyspaceWithClient(tempClient);
            }
            await tempClient.shutdown();
            await this.client.connect();
            this.connected = true;
        }
        catch (error) {
            throw new errors_1.ConnectionError(`Failed to connect: ${error.message}`);
        }
    }
    async executeWithPrepared(query, values) {
        return await this.client.execute(query, values, { prepare: true });
    }
    async loadSchema(tableName, schema) {
        if (!this.connected)
            await this.connect();
        let model = this.models.get(tableName);
        if (!model) {
            await this.createTable(tableName, schema);
            model = new CassandraModel(this.client, this.keyspace, tableName, schema, this);
            this.models.set(tableName, model);
        }
        return model;
    }
    async disconnect() {
        if (this.connected) {
            await this.client.shutdown();
            this.connected = false;
        }
    }
    async createKeyspaceWithClient(client) {
        const query = `CREATE KEYSPACE IF NOT EXISTS ${this.keyspace} 
                   WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`;
        await client.execute(query);
    }
    async createTable(tableName, schema) {
        const columns = Object.entries(schema.fields)
            .map(([name, fieldDef]) => {
            const type = this.getFieldType(fieldDef);
            return `${name} ${converter_1.TypeConverter.getCassandraType(type)}`;
        })
            .join(', ');
        const primaryKey = schema.key.join(', ');
        const query = `CREATE TABLE IF NOT EXISTS ${this.keyspace}.${tableName} 
                   (${columns}, PRIMARY KEY (${primaryKey}))`;
        await this.client.execute(query);
        if (schema.indexes) {
            for (const field of schema.indexes) {
                const indexQuery = `CREATE INDEX IF NOT EXISTS idx_${tableName}_${field} 
                           ON ${this.keyspace}.${tableName} (${field})`;
                await this.client.execute(indexQuery);
            }
        }
        const uniqueFields = this.getUniqueFieldsFromSchema(schema);
        for (const field of uniqueFields) {
            if (!schema.indexes?.includes(field)) {
                const indexQuery = `CREATE INDEX IF NOT EXISTS idx_${tableName}_${field}_unique 
                           ON ${this.keyspace}.${tableName} (${field})`;
                await this.client.execute(indexQuery);
            }
        }
    }
    getUniqueFieldsFromSchema(schema) {
        const uniqueFields = [];
        if (schema.unique) {
            uniqueFields.push(...schema.unique);
        }
        for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
            if (typeof fieldDef === 'object' && fieldDef.unique) {
                uniqueFields.push(fieldName);
            }
        }
        return [...new Set(uniqueFields)];
    }
    getFieldType(fieldDef) {
        return typeof fieldDef === 'string' ? fieldDef : fieldDef.type;
    }
}
exports.CassandraORM = CassandraORM;
class CassandraModel {
    constructor(client, keyspace, tableName, schema, orm) {
        this.client = client;
        this.keyspace = keyspace;
        this.tableName = tableName;
        this.schema = schema;
        this.orm = orm;
    }
    validate(data, isUpdate = false) {
        return validator_1.Validator.validate(data, this.schema.fields, isUpdate);
    }
    async create(data) {
        const errors = this.validate(data, false);
        if (errors.length > 0) {
            throw new errors_1.ValidationError(`Validation failed: ${errors.join(', ')}`);
        }
        await this.checkUniqueConstraints(data);
        const converted = converter_1.TypeConverter.convertObject(data, this.schema.fields);
        const fields = Object.keys(converted);
        const values = Object.values(converted);
        const placeholders = fields.map(() => '?').join(', ');
        const query = `INSERT INTO ${this.keyspace}.${this.tableName} 
                   (${fields.join(', ')}) VALUES (${placeholders})`;
        await this.orm.executeWithPrepared(query, values);
        return converted;
    }
    async find(where) {
        let query = `SELECT * FROM ${this.keyspace}.${this.tableName}`;
        let values = [];
        if (where) {
            const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
            query += ` WHERE ${conditions}`;
            values = Object.values(where);
        }
        const result = await this.orm.executeWithPrepared(query, values);
        return result.rows;
    }
    async findOne(where) {
        const results = await this.find(where);
        return results[0] || null;
    }
    async update(data, where) {
        const errors = this.validate(data, true);
        if (errors.length > 0) {
            throw new errors_1.ValidationError(`Validation failed: ${errors.join(', ')}`);
        }
        const currentRecord = await this.findOne(where);
        if (currentRecord) {
            await this.checkUniqueConstraints(data, currentRecord.id);
        }
        const converted = converter_1.TypeConverter.convertObject(data, this.schema.fields);
        const updateData = {};
        for (const [key, value] of Object.entries(converted)) {
            if (!this.schema.key.includes(key)) {
                updateData[key] = value;
            }
        }
        const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        const query = `UPDATE ${this.keyspace}.${this.tableName} 
                   SET ${setClause} WHERE ${whereClause}`;
        const values = [...Object.values(updateData), ...Object.values(where)];
        await this.client.execute(query, values, { prepare: true });
    }
    async delete(where) {
        const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
        const query = `DELETE FROM ${this.keyspace}.${this.tableName} WHERE ${whereClause}`;
        await this.client.execute(query, Object.values(where), { prepare: true });
    }
    async count(where) {
        let query = `SELECT COUNT(*) as count FROM ${this.keyspace}.${this.tableName}`;
        let values = [];
        if (where) {
            const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
            query += ` WHERE ${conditions}`;
            values = Object.values(where);
        }
        const result = await this.client.execute(query, values, { prepare: true });
        return parseInt(result.rows[0].count);
    }
    async checkUniqueConstraints(data, excludeId) {
        const uniqueFields = this.getUniqueFields();
        for (const field of uniqueFields) {
            if (data[field] !== undefined) {
                const existing = await this.findByUniqueField(field, data[field]);
                if (existing && (!excludeId || existing.id !== excludeId)) {
                    throw new Error(`${field} '${data[field]}' already exists`);
                }
            }
        }
    }
    getUniqueFields() {
        const uniqueFields = [];
        if (this.schema.unique) {
            uniqueFields.push(...this.schema.unique);
        }
        for (const [fieldName, fieldDef] of Object.entries(this.schema.fields)) {
            if (typeof fieldDef === 'object' && fieldDef.unique) {
                uniqueFields.push(fieldName);
            }
        }
        return [...new Set(uniqueFields)];
    }
    async findByUniqueField(field, value) {
        try {
            const query = `SELECT * FROM ${this.keyspace}.${this.tableName} WHERE ${field} = ? LIMIT 1`;
            const result = await this.client.execute(query, [value], { prepare: true });
            return result.rows[0] || null;
        }
        catch (error) {
            const query = `SELECT * FROM ${this.keyspace}.${this.tableName} WHERE ${field} = ? ALLOW FILTERING LIMIT 1`;
            const result = await this.client.execute(query, [value], { prepare: true });
            return result.rows[0] || null;
        }
    }
}
//# sourceMappingURL=client.js.map