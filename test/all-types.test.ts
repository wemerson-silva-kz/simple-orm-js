import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createClient, uuid, nanoid } from '../src/index';

describe('All Cassandra Types Support', () => {
  let client: any;

  beforeAll(async () => {
    client = createClient({
      clientOptions: {
        contactPoints: ['127.0.0.1'],
        localDataCenter: 'datacenter1',
        keyspace: 'test_all_types'
      },
      ormOptions: {
        createKeyspace: true
      }
    });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  describe('Basic Types', () => {
    let BasicTypes: any;

    beforeAll(async () => {
      BasicTypes = await client.loadSchema('basic_types', {
        fields: {
          id: 'uuid',
          // String types
          text_field: 'text',
          ascii_field: 'ascii',
          varchar_field: 'varchar',
          // Integer types
          int_field: 'int',
          bigint_field: 'bigint',
          smallint_field: 'smallint',
          tinyint_field: 'tinyint',
          // Float types
          float_field: 'float',
          double_field: 'double',
          decimal_field: 'decimal',
          // Boolean
          boolean_field: 'boolean',
          // Date/Time
          timestamp_field: 'timestamp',
          date_field: 'date',
          time_field: 'time',
          // Binary
          blob_field: 'blob',
          inet_field: 'inet'
        },
        key: ['id']
      });
    });

    it('should handle all basic types', async () => {
      const record = await BasicTypes.create({
        text_field: 'Hello World',
        ascii_field: 'ASCII Text',
        varchar_field: 'Variable Char',
        int_field: 42,
        bigint_field: 9223372036854775807,
        smallint_field: 32767,
        tinyint_field: 127,
        float_field: 3.14,
        double_field: 2.718281828,
        decimal_field: 999.99,
        boolean_field: true,
        timestamp_field: new Date(),
        blob_field: Buffer.from('binary data'),
        inet_field: '192.168.1.1'
      });

      expect(record.text_field).toBe('Hello World');
      expect(record.ascii_field).toBe('ASCII Text');
      expect(record.varchar_field).toBe('Variable Char');
      expect(record.int_field).toBe(42);
      expect(record.smallint_field).toBe(32767);
      expect(record.tinyint_field).toBe(127);
      expect(record.float_field).toBe(3.14);
      expect(record.double_field).toBe(2.718281828);
      expect(record.decimal_field).toBe('999.99');
      expect(record.boolean_field).toBe(true);
      expect(record.timestamp_field).toBeInstanceOf(Date);
      expect(Buffer.isBuffer(record.blob_field)).toBe(true);
      expect(record.id).toBeDefined();
    });
  });

  describe('ID Types', () => {
    let IdTypes: any;

    beforeAll(async () => {
      IdTypes = await client.loadSchema('id_types_test', {
        fields: {
          id: 'uuid', // Primary key
          timeuuid_field: 'timeuuid',
          nanoid_field: 'nanoid',
          name: 'text'
        },
        key: ['id']
      });
    });

    it('should handle different ID types', async () => {
      const record = await IdTypes.create({
        name: 'ID Test'
      });

      expect(record.id).toBeDefined(); // Auto-generated UUID
      expect(record.timeuuid_field).toBeDefined(); // Auto-generated TimeUUID
      expect(record.nanoid_field).toBeDefined(); // Auto-generated NanoID
      expect(typeof record.nanoid_field).toBe('string');
      expect(record.nanoid_field.length).toBeGreaterThan(10);
      expect(record.name).toBe('ID Test');
    });
  });

  describe('Collection Types', () => {
    let Collections: any;

    beforeAll(async () => {
      Collections = await client.loadSchema('collections', {
        fields: {
          id: 'uuid',
          // Sets
          text_set: 'set<text>',
          int_set: 'set<int>',
          uuid_set: 'set<uuid>',
          // Lists
          text_list: 'list<text>',
          int_list: 'list<int>',
          timestamp_list: 'list<timestamp>',
          // Maps
          text_map: 'map<text,text>',
          text_int_map: 'map<text,int>',
          int_text_map: 'map<int,text>'
        },
        key: ['id']
      });
    });

    it('should handle collection types', async () => {
      const record = await Collections.create({
        text_set: ['apple', 'banana', 'cherry'],
        int_set: [1, 2, 3, 4, 5],
        uuid_set: [uuid(), uuid()],
        text_list: ['first', 'second', 'third'],
        int_list: [10, 20, 30],
        timestamp_list: [new Date(), new Date()],
        text_map: { key1: 'value1', key2: 'value2' },
        text_int_map: { count: 42, total: 100 },
        int_text_map: { 1: 'one', 2: 'two' }
      });

      expect(Array.isArray(record.text_set)).toBe(true);
      expect(record.text_set).toContain('apple');
      expect(Array.isArray(record.int_set)).toBe(true);
      expect(record.int_set).toContain(1);
      expect(Array.isArray(record.uuid_set)).toBe(true);
      expect(Array.isArray(record.text_list)).toBe(true);
      expect(record.text_list[0]).toBe('first');
      expect(Array.isArray(record.int_list)).toBe(true);
      expect(record.int_list[0]).toBe(10);
      expect(typeof record.text_map).toBe('object');
      expect(record.text_map.key1).toBe('value1');
      expect(record.id).toBeDefined();
    });
  });

  describe('Custom Types', () => {
    let CustomTypes: any;

    beforeAll(async () => {
      CustomTypes = await client.loadSchema('custom_types', {
        fields: {
          id: 'nanoid',
          json_data: {
            type: 'json',
            validate: {
              isJson: true
            }
          },
          metadata: {
            type: 'json',
            default: () => JSON.stringify({ created: new Date().toISOString() })
          }
        },
        key: ['id']
      });
    });

    it('should handle JSON type', async () => {
      const testData = { name: 'John', age: 30, active: true };
      
      const record = await CustomTypes.create({
        json_data: testData
      });

      expect(record.id).toBeDefined();
      expect(typeof record.id).toBe('string');
      expect(record.json_data).toBeDefined();
      expect(record.metadata).toBeDefined(); // Default value
    });

    it('should validate JSON format', async () => {
      try {
        await CustomTypes.create({
          json_data: 'invalid json {'
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('must be valid JSON');
      }
    });
  });

  describe('Advanced Features with Types', () => {
    let AdvancedTypes: any;

    beforeAll(async () => {
      AdvancedTypes = await client.loadSchema('advanced_types', {
        fields: {
          id: 'timeuuid',
          name: {
            type: 'text',
            validate: {
              required: true,
              minLength: 2
            }
          },
          tags: {
            type: 'set<text>',
            default: () => ['default']
          },
          scores: {
            type: 'list<int>',
            validate: {
              custom: (value) => {
                if (!Array.isArray(value)) return 'Scores must be an array';
                return value.every(v => v >= 0 && v <= 100) || 'All scores must be between 0 and 100';
              }
            }
          },
          config: {
            type: 'map<text,text>',
            default: { theme: 'dark', lang: 'en' }
          }
        },
        key: ['id']
      });
    });

    it('should handle advanced types with validation and defaults', async () => {
      const record = await AdvancedTypes.create({
        name: 'Advanced Test',
        scores: [85, 92, 78, 95]
      });

      expect(record.name).toBe('Advanced Test');
      expect(Array.isArray(record.tags)).toBe(true);
      expect(record.tags).toContain('default'); // Default value
      expect(Array.isArray(record.scores)).toBe(true);
      expect(record.scores).toContain(85);
      expect(typeof record.config).toBe('object');
      expect(record.config.theme).toBe('dark'); // Default value
      expect(record.id).toBeDefined();
    });

    it('should validate collection content', async () => {
      try {
        await AdvancedTypes.create({
          name: 'Invalid Scores',
          scores: [85, 150, 78] // 150 is > 100
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('All scores must be between 0 and 100');
      }
    });
  });

  describe('Type Utilities', () => {
    it('should generate different ID types', () => {
      const uuidId = uuid();
      const nanoId = nanoid();
      const customNano = nanoid(10);

      expect(uuidId).toBeDefined();
      expect(nanoId).toBeDefined();
      expect(customNano).toBeDefined();
      expect(typeof uuidId.toString()).toBe('string');
      expect(typeof nanoId).toBe('string');
      expect(typeof customNano).toBe('string');
      expect(customNano.length).toBe(10);
      expect(nanoId.length).toBe(21); // Default nanoid length
    });
  });
});
