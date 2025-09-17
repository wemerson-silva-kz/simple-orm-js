import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createClient, ValidationError, UniqueConstraintError } from '../src';

const client = createClient({
  clientOptions: {
    contactPoints: ['127.0.0.1'],
    localDataCenter: 'datacenter1',
    keyspace: 'test_edge_cases'
  },
  ormOptions: {
    createKeyspace: true
  }
});

beforeAll(async () => {
  await client.connect();
});

afterAll(async () => {
  await client.disconnect();
});

describe('Edge Cases Tests', () => {
  test('should handle null and undefined values correctly', async () => {
    const User = await client.loadSchema('users_null', {
      fields: {
        id: 'uuid',
        name: { type: 'text', validate: { required: true } },
        optional_field: 'text'
      },
      key: ['id']
    });

    // Should reject null required field
    expect(async () => {
      await User.create({ name: null });
    }).toThrow();

    // Should accept undefined optional field
    const user = await User.create({ name: 'John' });
    expect(user.name).toBe('John');
  });

  test('should handle empty collections', async () => {
    const Post = await client.loadSchema('posts_empty', {
      fields: {
        id: 'uuid',
        tags: 'set<text>',
        comments: 'list<text>',
        metadata: 'map<text,text>'
      },
      key: ['id']
    });

    const post = await Post.create({
      tags: [],
      comments: [],
      metadata: {}
    });

    expect(Array.isArray(post.tags)).toBe(true);
    expect(Array.isArray(post.comments)).toBe(true);
    expect(typeof post.metadata).toBe('object');
  });

  test('should handle large numbers correctly', async () => {
    const Numbers = await client.loadSchema('numbers_large', {
      fields: {
        id: 'uuid',
        big_int: 'bigint',
        decimal_val: 'decimal'
      },
      key: ['id']
    });

    const record = await Numbers.create({
      big_int: '9223372036854775807', // Max bigint
      decimal_val: '999999999999999999.99'
    });

    expect(record.big_int).toBeDefined();
    expect(record.decimal_val).toBeDefined();
  });

  test('should handle special characters in text fields', async () => {
    const Special = await client.loadSchema('special_chars', {
      fields: {
        id: 'uuid',
        text_field: 'text'
      },
      key: ['id']
    });

    const specialText = "Special chars: àáâãäåæçèéêë ñ 中文 🚀 \"quotes\" 'apostrophes'";
    const record = await Special.create({ text_field: specialText });
    
    expect(record.text_field).toBe(specialText);
  });

  test('should handle concurrent unique constraint checks', async () => {
    const Concurrent = await client.loadSchema('concurrent_unique', {
      fields: {
        id: 'uuid',
        email: { type: 'text', unique: true }
      },
      key: ['id']
    });

    // First creation should succeed
    await Concurrent.create({ email: 'test@concurrent.com' });

    // Multiple concurrent attempts should fail
    const promises = Array(5).fill(0).map(() => 
      Concurrent.create({ email: 'test@concurrent.com' })
    );

    let errorCount = 0;
    await Promise.allSettled(promises).then(results => {
      results.forEach(result => {
        if (result.status === 'rejected') errorCount++;
      });
    });

    expect(errorCount).toBeGreaterThan(0);
  });

  test('should validate complex nested JSON', async () => {
    const JsonTest = await client.loadSchema('json_complex', {
      fields: {
        id: 'uuid',
        config: {
          type: 'json',
          validate: {
            isJson: true,
            custom: (value) => {
              const parsed = JSON.parse(value);
              return parsed.version && parsed.settings ? 
                true : 'JSON must have version and settings';
            }
          }
        }
      },
      key: ['id']
    });

    // Valid JSON
    const validConfig = JSON.stringify({
      version: '1.0',
      settings: { theme: 'dark' }
    });
    
    const record = await JsonTest.create({ config: validConfig });
    expect(record.config).toBe(validConfig);

    // Invalid JSON structure
    expect(async () => {
      await JsonTest.create({ 
        config: JSON.stringify({ version: '1.0' }) // Missing settings
      });
    }).toThrow();
  });

  test('should handle batch operations efficiently', async () => {
    const Batch = await client.loadSchema('batch_test', {
      fields: {
        id: 'uuid',
        name: 'text',
        value: 'int'
      },
      key: ['id']
    });

    const startTime = Date.now();
    
    // Create 100 records
    const promises = Array(100).fill(0).map((_, i) => 
      Batch.create({ name: `User ${i}`, value: i })
    );
    
    await Promise.all(promises);
    const endTime = Date.now();
    
    // Should complete in reasonable time (less than 5 seconds)
    expect(endTime - startTime).toBeLessThan(5000);
    
    // Verify count
    const count = await Batch.count();
    expect(count).toBe(100);
  });

  test('should handle malformed data gracefully', async () => {
    const Malformed = await client.loadSchema('malformed_test', {
      fields: {
        id: 'uuid',
        email: { type: 'text', validate: { isEmail: true } },
        age: { type: 'int', validate: { min: 0, max: 150 } }
      },
      key: ['id']
    });

    // Test various malformed inputs
    const malformedInputs = [
      { email: 'not-an-email', age: 25 },
      { email: 'test@test.com', age: -5 },
      { email: 'test@test.com', age: 200 },
      { email: '', age: 25 },
      { email: 'test@test.com', age: 'not-a-number' }
    ];

    for (const input of malformedInputs) {
      expect(async () => {
        await Malformed.create(input);
      }).toThrow();
    }
  });
});
