import { Client } from 'cassandra-driver';
import { Config, ModelSchema, Model, ValidationError, FieldDefinition, CassandraType } from './types';
import { TypeConverter } from './converter';
import { Validator } from './validator';

export class CassandraORM {
  private client: Client;
  private keyspace: string;
  private connected = false;
  private models = new Map<string, CassandraModel>();

  constructor(private config: Config) {
    this.client = new Client(config.clientOptions);
    this.keyspace = config.clientOptions.keyspace || 'app';
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    
    // Connect without keyspace first
    const tempClient = new Client({
      ...this.config.clientOptions,
      keyspace: undefined
    });
    
    await tempClient.connect();
    
    if (this.config.ormOptions?.createKeyspace) {
      await this.createKeyspaceWithClient(tempClient);
    }
    
    await tempClient.shutdown();
    
    // Now connect with keyspace
    await this.client.connect();
    this.connected = true;
  }

  async loadSchema<T extends ModelSchema>(tableName: string, schema: T): Promise<Model<any>> {
    if (!this.connected) await this.connect();
    
    let model = this.models.get(tableName);
    if (!model) {
      await this.createTable(tableName, schema);
      model = new CassandraModel(this.client, this.keyspace, tableName, schema);
      this.models.set(tableName, model);
    }
    
    return model;
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.shutdown();
      this.connected = false;
    }
  }

  private async createKeyspaceWithClient(client: Client): Promise<void> {
    const query = `CREATE KEYSPACE IF NOT EXISTS ${this.keyspace} 
                   WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`;
    await client.execute(query);
  }

  private async createKeyspace(): Promise<void> {
    const query = `CREATE KEYSPACE IF NOT EXISTS ${this.keyspace} 
                   WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`;
    await this.client.execute(query);
  }

  private async createTable(tableName: string, schema: ModelSchema): Promise<void> {
    const columns = Object.entries(schema.fields)
      .map(([name, fieldDef]) => {
        const type = this.getFieldType(fieldDef);
        return `${name} ${TypeConverter.getCassandraType(type)}`;
      })
      .join(', ');
    
    const primaryKey = schema.key.join(', ');
    
    const query = `CREATE TABLE IF NOT EXISTS ${this.keyspace}.${tableName} 
                   (${columns}, PRIMARY KEY (${primaryKey}))`;
    
    await this.client.execute(query);
    
    // Create regular indexes
    if (schema.indexes) {
      for (const field of schema.indexes) {
        const indexQuery = `CREATE INDEX IF NOT EXISTS idx_${tableName}_${field} 
                           ON ${this.keyspace}.${tableName} (${field})`;
        await this.client.execute(indexQuery);
      }
    }

    // Create indexes for unique fields (required for unique constraint checking)
    const uniqueFields = this.getUniqueFieldsFromSchema(schema);
    for (const field of uniqueFields) {
      // Only create index if not already in regular indexes
      if (!schema.indexes?.includes(field)) {
        const indexQuery = `CREATE INDEX IF NOT EXISTS idx_${tableName}_${field}_unique 
                           ON ${this.keyspace}.${tableName} (${field})`;
        await this.client.execute(indexQuery);
      }
    }
  }

  private getUniqueFieldsFromSchema(schema: ModelSchema): string[] {
    const uniqueFields: string[] = [];
    
    // From schema.unique array
    if (schema.unique) {
      uniqueFields.push(...schema.unique);
    }
    
    // From field definitions with unique: true
    for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
      if (typeof fieldDef === 'object' && fieldDef.unique) {
        uniqueFields.push(fieldName);
      }
    }
    
    return [...new Set(uniqueFields)]; // Remove duplicates
  }

  private getFieldType(fieldDef: CassandraType | FieldDefinition): CassandraType {
    return typeof fieldDef === 'string' ? fieldDef : fieldDef.type;
  }
}

class CassandraModel implements Model {
  constructor(
    private client: Client,
    private keyspace: string,
    private tableName: string,
    private schema: ModelSchema
  ) {}

  validate(data: any, isUpdate: boolean = false): ValidationError[] {
    return Validator.validate(data, this.schema.fields, isUpdate);
  }

  async create(data: any): Promise<any> {
    // Validate data
    const errors = this.validate(data, false);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Check unique constraints
    await this.checkUniqueConstraints(data);

    const converted = TypeConverter.convertObject(data, this.schema.fields);
    const fields = Object.keys(converted);
    const values = Object.values(converted);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${this.keyspace}.${this.tableName} 
                   (${fields.join(', ')}) VALUES (${placeholders})`;
    
    await this.client.execute(query, values, { prepare: true });
    return converted;
  }

  async find(where?: any): Promise<any[]> {
    let query = `SELECT * FROM ${this.keyspace}.${this.tableName}`;
    let values: any[] = [];
    
    if (where) {
      const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      query += ` WHERE ${conditions}`;
      values = Object.values(where);
    }
    
    const result = await this.client.execute(query, values, { prepare: true });
    return result.rows;
  }

  async findOne(where: any): Promise<any> {
    const results = await this.find(where);
    return results[0] || null;
  }

  async update(data: any, where: any): Promise<void> {
    // Validate data (only fields being updated)
    const errors = this.validate(data, true);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Check unique constraints (excluding current record)
    const currentRecord = await this.findOne(where);
    if (currentRecord) {
      await this.checkUniqueConstraints(data, currentRecord.id);
    }

    const converted = TypeConverter.convertObject(data, this.schema.fields);
    
    // Remove primary key fields from update data
    const updateData: any = {};
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

  async delete(where: any): Promise<void> {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const query = `DELETE FROM ${this.keyspace}.${this.tableName} WHERE ${whereClause}`;
    
    await this.client.execute(query, Object.values(where), { prepare: true });
  }

  async count(where?: any): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${this.keyspace}.${this.tableName}`;
    let values: any[] = [];
    
    if (where) {
      const conditions = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      query += ` WHERE ${conditions}`;
      values = Object.values(where);
    }
    
    const result = await this.client.execute(query, values, { prepare: true });
    return parseInt(result.rows[0].count);
  }

  private async checkUniqueConstraints(data: any, excludeId?: any): Promise<void> {
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

  private getUniqueFields(): string[] {
    const uniqueFields: string[] = [];
    
    // From schema.unique array
    if (this.schema.unique) {
      uniqueFields.push(...this.schema.unique);
    }
    
    // From field definitions with unique: true
    for (const [fieldName, fieldDef] of Object.entries(this.schema.fields)) {
      if (typeof fieldDef === 'object' && fieldDef.unique) {
        uniqueFields.push(fieldName);
      }
    }
    
    return [...new Set(uniqueFields)]; // Remove duplicates
  }

  private async findByUniqueField(field: string, value: any): Promise<any> {
    try {
      // Try to find using index if available
      const query = `SELECT * FROM ${this.keyspace}.${this.tableName} WHERE ${field} = ? LIMIT 1`;
      const result = await this.client.execute(query, [value], { prepare: true });
      return result.rows[0] || null;
    } catch (error) {
      // If no index exists, we need to scan (not recommended for production)
      // This is a fallback - indexes should be created for unique fields
      const query = `SELECT * FROM ${this.keyspace}.${this.tableName} WHERE ${field} = ? ALLOW FILTERING LIMIT 1`;
      const result = await this.client.execute(query, [value], { prepare: true });
      return result.rows[0] || null;
    }
  }
}
