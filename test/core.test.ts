import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createClient, uuid } from '../src/index';

describe('Cassandra ORM Core', () => {
  let client: any;
  let User: any;

  beforeAll(async () => {
    client = createClient({
      clientOptions: {
        contactPoints: ['127.0.0.1'],
        localDataCenter: 'datacenter1',
        keyspace: 'test_core'
      },
      ormOptions: {
        createKeyspace: true
      }
    });

    User = await client.loadSchema('users', {
      fields: {
        id: 'uuid',
        name: 'text',
        email: 'text',
        age: 'int',
        balance: 'decimal',
        active: 'boolean',
        created_at: 'timestamp'
      },
      key: ['id'],
      indexes: ['email']
    });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  it('should create user', async () => {
    const user = await User.create({
      name: 'John Doe',
      email: 'john@test.com',
      age: 30,
      balance: 1000.50,
      active: true,
      created_at: new Date()
    });

    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@test.com');
    expect(user.age).toBe(30);
    expect(user.balance).toBe('1000.5');
    expect(user.active).toBe(true);
    expect(user.id).toBeDefined();
  });

  it('should find users', async () => {
    const users = await User.find();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  it('should find one user', async () => {
    const users = await User.find();
    const user = await User.findOne({ id: users[0].id });
    expect(user).toBeDefined();
    expect(user.id.toString()).toBe(users[0].id.toString());
  });

  it('should update user', async () => {
    const users = await User.find();
    await User.update({ age: 31 }, { id: users[0].id });
    
    const updated = await User.findOne({ id: users[0].id });
    expect(updated.age).toBe(31);
  });

  it('should count users', async () => {
    const count = await User.count();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThan(0);
  });

  it('should delete user', async () => {
    const users = await User.find();
    const initialCount = users.length;
    
    await User.delete({ id: users[0].id });
    
    const newCount = await User.count();
    expect(newCount).toBe(initialCount - 1);
  });

  it('should generate UUID', () => {
    const id = uuid();
    expect(id).toBeDefined();
    expect(typeof id.toString()).toBe('string');
  });

  it('should handle decimal types', async () => {
    const user = await User.create({
      name: 'Decimal Test',
      email: 'decimal@test.com',
      age: 25,
      balance: 999.99,
      active: true,
      created_at: new Date()
    });

    expect(user.balance).toBe('999.99');
  });

  it('should handle boolean types', async () => {
    const user = await User.create({
      name: 'Bool Test',
      email: 'bool@test.com',
      age: 25,
      balance: 100,
      active: false,
      created_at: new Date()
    });

    expect(user.active).toBe(false);
  });
});
