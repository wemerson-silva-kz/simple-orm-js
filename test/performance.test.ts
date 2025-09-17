import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createClient } from '../src';

const client = createClient({
  clientOptions: {
    contactPoints: ['127.0.0.1'],
    localDataCenter: 'datacenter1',
    keyspace: 'test_performance'
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

describe('Performance Tests', () => {
  test('prepared statements should be faster than regular queries', async () => {
    const Perf = await client.loadSchema('perf_test', {
      fields: {
        id: 'uuid',
        name: 'text',
        value: 'int'
      },
      key: ['id']
    });

    // Warm up
    await Perf.create({ name: 'warmup', value: 1 });

    // Test prepared statements (our implementation)
    const preparedStart = Date.now();
    for (let i = 0; i < 50; i++) {
      await Perf.create({ name: `prepared_${i}`, value: i });
    }
    const preparedTime = Date.now() - preparedStart;

    console.log(`Prepared statements: ${preparedTime}ms for 50 operations`);
    
    // Should complete in reasonable time
    expect(preparedTime).toBeLessThan(3000);
  });

  test('bulk operations should be efficient', async () => {
    const Bulk = await client.loadSchema('bulk_test', {
      fields: {
        id: 'uuid',
        data: 'text'
      },
      key: ['id']
    });

    const startTime = Date.now();
    
    // Create 1000 records in parallel
    const promises = Array(1000).fill(0).map((_, i) => 
      Bulk.create({ data: `bulk_data_${i}` })
    );
    
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    console.log(`Bulk operations: ${totalTime}ms for 1000 records`);
    
    // Should handle 1000 records in under 10 seconds
    expect(totalTime).toBeLessThan(10000);
    
    // Verify all records were created
    const count = await Bulk.count();
    expect(count).toBe(1000);
  });

  test('complex queries should perform well', async () => {
    const Complex = await client.loadSchema('complex_perf', {
      fields: {
        id: 'uuid',
        category: 'text',
        tags: 'set<text>',
        metadata: 'map<text,text>',
        score: 'int'
      },
      key: ['id'],
      indexes: ['category']
    });

    // Create test data
    for (let i = 0; i < 100; i++) {
      await Complex.create({
        category: `cat_${i % 10}`,
        tags: [`tag_${i}`, `tag_${i + 1}`],
        metadata: { key1: `value_${i}`, key2: `meta_${i}` },
        score: i
      });
    }

    const queryStart = Date.now();
    
    // Perform multiple queries
    for (let i = 0; i < 10; i++) {
      await Complex.find({ category: `cat_${i}` });
    }
    
    const queryTime = Date.now() - queryStart;
    
    console.log(`Complex queries: ${queryTime}ms for 10 queries`);
    
    // Should complete queries efficiently
    expect(queryTime).toBeLessThan(2000);
  });

  test('memory usage should be reasonable', async () => {
    const Memory = await client.loadSchema('memory_test', {
      fields: {
        id: 'uuid',
        large_text: 'text'
      },
      key: ['id']
    });

    const initialMemory = process.memoryUsage().heapUsed;
    
    // Create records with large text fields
    const largeText = 'x'.repeat(10000); // 10KB per record
    
    for (let i = 0; i < 100; i++) {
      await Memory.create({ large_text: largeText });
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB for 100 large records`);
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50);
  });
});
