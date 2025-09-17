"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeConverter = void 0;
const cassandra_driver_1 = require("cassandra-driver");
const nanoid_1 = require("nanoid");
class TypeConverter {
    static convert(value, type) {
        const converter = this.converters.get(type);
        return converter ? converter(value) : value;
    }
    static convertObject(data, fields) {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            const fieldDef = fields[key];
            const type = this.getFieldType(fieldDef);
            if (type) {
                result[key] = this.convert(value, type);
            }
            else {
                result[key] = value;
            }
        }
        for (const [fieldName, fieldDef] of Object.entries(fields)) {
            if (!result[fieldName]) {
                const type = this.getFieldType(fieldDef);
                if (type === 'uuid' || type === 'nanoid' || type === 'timeuuid') {
                    result[fieldName] = this.convert(undefined, type);
                }
            }
            if (typeof fieldDef === 'object' && fieldDef.default !== undefined && result[fieldName] === undefined) {
                result[fieldName] = typeof fieldDef.default === 'function' ? fieldDef.default() : fieldDef.default;
            }
        }
        return result;
    }
    static getFieldType(fieldDef) {
        if (typeof fieldDef === 'string') {
            return fieldDef;
        }
        return fieldDef.type;
    }
    static getCassandraType(type) {
        const typeMap = {
            'uuid': 'uuid',
            'timeuuid': 'timeuuid',
            'nanoid': 'text',
            'text': 'text',
            'ascii': 'ascii',
            'varchar': 'varchar',
            'int': 'int',
            'bigint': 'bigint',
            'smallint': 'smallint',
            'tinyint': 'tinyint',
            'varint': 'varint',
            'counter': 'counter',
            'float': 'float',
            'double': 'double',
            'decimal': 'decimal',
            'boolean': 'boolean',
            'timestamp': 'timestamp',
            'date': 'date',
            'time': 'time',
            'duration': 'duration',
            'blob': 'blob',
            'inet': 'inet',
            'set<text>': 'set<text>',
            'set<int>': 'set<int>',
            'set<uuid>': 'set<uuid>',
            'set<timestamp>': 'set<timestamp>',
            'list<text>': 'list<text>',
            'list<int>': 'list<int>',
            'list<uuid>': 'list<uuid>',
            'list<timestamp>': 'list<timestamp>',
            'map<text,text>': 'map<text,text>',
            'map<text,int>': 'map<text,int>',
            'map<int,text>': 'map<int,text>',
            'map<uuid,text>': 'map<uuid,text>',
            'tuple<text,int>': 'tuple<text,int>',
            'tuple<uuid,text>': 'tuple<uuid,text>',
            'tuple<text,text,int>': 'tuple<text,text,int>',
            'json': 'text'
        };
        return typeMap[type] || 'text';
    }
}
exports.TypeConverter = TypeConverter;
TypeConverter.converters = new Map([
    ['uuid', (v) => v || cassandra_driver_1.types.Uuid.random()],
    ['timeuuid', (v) => v || cassandra_driver_1.types.TimeUuid.now()],
    ['nanoid', (v) => v || (0, nanoid_1.nanoid)()],
    ['text', (v) => String(v)],
    ['ascii', (v) => String(v)],
    ['varchar', (v) => String(v)],
    ['int', (v) => parseInt(v, 10)],
    ['bigint', (v) => cassandra_driver_1.types.Long.fromValue(v)],
    ['smallint', (v) => parseInt(v, 10)],
    ['tinyint', (v) => parseInt(v, 10)],
    ['varint', (v) => cassandra_driver_1.types.Integer.fromString(String(v))],
    ['counter', (v) => cassandra_driver_1.types.Long.fromValue(v)],
    ['float', (v) => parseFloat(v)],
    ['double', (v) => parseFloat(v)],
    ['decimal', (v) => typeof v === 'number' ? v.toString() : String(v)],
    ['boolean', (v) => Boolean(v)],
    ['timestamp', (v) => v instanceof Date ? v : new Date(v)],
    ['date', (v) => v instanceof Date ? v : new Date(v)],
    ['time', (v) => v instanceof Date ? v : new Date(v)],
    ['duration', (v) => String(v)],
    ['blob', (v) => Buffer.from(v)],
    ['inet', (v) => cassandra_driver_1.types.InetAddress.fromString(String(v))],
    ['set<text>', (v) => Array.isArray(v) ? v : v instanceof Set ? Array.from(v) : [v]],
    ['list<text>', (v) => Array.isArray(v) ? v : [v]],
    ['map<text,text>', (v) => v || {}],
    ['set<int>', (v) => Array.isArray(v) ? v.map(x => parseInt(x, 10)) : [parseInt(v, 10)]],
    ['list<int>', (v) => Array.isArray(v) ? v.map(x => parseInt(x, 10)) : [parseInt(v, 10)]],
    ['map<text,int>', (v) => {
            if (!v)
                return {};
            const result = {};
            for (const [key, val] of Object.entries(v)) {
                result[key] = parseInt(val, 10);
            }
            return result;
        }],
    ['map<int,text>', (v) => {
            if (!v)
                return {};
            const result = {};
            for (const [key, val] of Object.entries(v)) {
                result[parseInt(key, 10)] = String(val);
            }
            return result;
        }],
    ['set<uuid>', (v) => Array.isArray(v) ? v : [v]],
    ['list<uuid>', (v) => Array.isArray(v) ? v : [v]],
    ['map<uuid,text>', (v) => v || {}],
    ['set<timestamp>', (v) => Array.isArray(v) ? v.map(x => x instanceof Date ? x : new Date(x)) : [v instanceof Date ? v : new Date(v)]],
    ['list<timestamp>', (v) => Array.isArray(v) ? v.map(x => x instanceof Date ? x : new Date(x)) : [v instanceof Date ? v : new Date(v)]],
    ['tuple<text,int>', (v) => Array.isArray(v) ? cassandra_driver_1.types.Tuple.fromArray([String(v[0]), parseInt(v[1], 10)]) : v],
    ['tuple<uuid,text>', (v) => Array.isArray(v) ? cassandra_driver_1.types.Tuple.fromArray([v[0], String(v[1])]) : v],
    ['tuple<text,text,int>', (v) => Array.isArray(v) ? cassandra_driver_1.types.Tuple.fromArray([String(v[0]), String(v[1]), parseInt(v[2], 10)]) : v],
    ['json', (v) => typeof v === 'string' ? v : JSON.stringify(v)]
]);
//# sourceMappingURL=converter.js.map