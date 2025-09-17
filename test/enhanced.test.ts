import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createClient, uuid, nanoid } from '../src/index';

describe('Cassandra ORM Core Enhanced', () => {
  let client: any;
  let User: any;
  let Product: any;

  beforeAll(async () => {
    client = createClient({
      clientOptions: {
        contactPoints: ['127.0.0.1'],
        localDataCenter: 'datacenter1',
        keyspace: 'test_enhanced'
      },
      ormOptions: {
        createKeyspace: true
      }
    });

    // User with validation
    User = await client.loadSchema('users_enhanced', {
      fields: {
        id: 'uuid',
        name: {
          type: 'text',
          validate: {
            required: true,
            minLength: 2,
            maxLength: 50
          }
        },
        email: {
          type: 'text',
          validate: {
            required: true,
            isEmail: true
          }
        },
        age: {
          type: 'int',
          validate: {
            min: 0,
            max: 150
          }
        },
        balance: 'decimal',
        active: {
          type: 'boolean',
          default: true
        },
        created_at: {
          type: 'timestamp',
          default: () => new Date()
        }
      },
      key: ['id'],
      indexes: ['email']
    });

    // Product with nanoid
    Product = await client.loadSchema('products_enhanced', {
      fields: {
        id: 'nanoid',
        name: {
          type: 'text',
          validate: {
            required: true,
            minLength: 1
          }
        },
        price: {
          type: 'decimal',
          validate: {
            required: true,
            custom: (value) => {
              const num = parseFloat(value);
              return num > 0 || 'Price must be positive';
            }
          }
        },
        category: 'text'
      },
      key: ['id']
    });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  describe('Validation System', () => {
    it('should validate required fields', async () => {
      try {
        await User.create({
          age: 25
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('name is required');
        expect(error.message).toContain('email is required');
      }
    });

    it('should validate email format', async () => {
      try {
        await User.create({
          name: 'John',
          email: 'invalid-email',
          age: 25
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('email must be a valid email');
      }
    });

    it('should validate string length', async () => {
      try {
        await User.create({
          name: 'J', // Too short
          email: 'john@test.com',
          age: 25
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('name must be at least 2 characters');
      }
    });

    it('should validate number ranges', async () => {
      try {
        await User.create({
          name: 'John',
          email: 'john@test.com',
          age: 200 // Too high
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('age must be at most 150');
      }
    });

    it('should validate custom rules', async () => {
      try {
        await Product.create({
          name: 'Test Product',
          price: -10 // Negative price
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Price must be positive');
      }
    });
  });

  describe('Enhanced Features', () => {
    it('should create user with validation and defaults', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@test.com',
        age: 30,
        balance: 1000.50
      });

      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@test.com');
      expect(user.age).toBe(30);
      expect(user.balance).toBe('1000.5');
      expect(user.active).toBe(true); // Default value
      expect(user.created_at).toBeInstanceOf(Date); // Default function
      expect(user.id).toBeDefined();
    });

    it('should create product with nanoid', async () => {
      const product = await Product.create({
        name: 'Laptop Computer',
        price: 999.99,
        category: 'Electronics'
      });

      expect(product.name).toBe('Laptop Computer');
      expect(product.price).toBe('999.99');
      expect(product.category).toBe('Electronics');
      expect(product.id).toBeDefined();
      expect(typeof product.id).toBe('string');
      expect(product.id.length).toBeGreaterThan(10); // nanoid is longer than 10 chars
    });

    it('should validate data before update', async () => {
      const user = await User.create({
        name: 'Jane Doe',
        email: 'jane@test.com',
        age: 25
      });

      try {
        await User.update({ email: 'invalid-email' }, { id: user.id });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('email must be a valid email');
      }
    });

    it('should generate different ID types', () => {
      const uuidId = uuid();
      const nanoidId = nanoid();

      expect(uuidId).toBeDefined();
      expect(nanoidId).toBeDefined();
      expect(typeof uuidId.toString()).toBe('string');
      expect(typeof nanoidId).toBe('string');
      expect(uuidId.toString()).not.toBe(nanoidId);
    });

    it('should handle field definitions vs simple types', async () => {
      const users = await User.find();
      expect(Array.isArray(users)).toBe(true);
      
      if (users.length > 0) {
        const user = users[0];
        expect(user.active).toBeDefined(); // Field with default
        expect(user.created_at).toBeDefined(); // Field with default function
      }
    });

    it('should validate using direct validate method', () => {
      const errors = User.validate({
        name: 'J', // Too short
        email: 'invalid', // Invalid email
        age: 200 // Too high
      });

      expect(errors.length).toBe(3);
      expect(errors.some(e => e.field === 'name')).toBe(true);
      expect(errors.some(e => e.field === 'email')).toBe(true);
      expect(errors.some(e => e.field === 'age')).toBe(true);
    });

    it('should pass validation with valid data', () => {
      const errors = User.validate({
        name: 'John Doe',
        email: 'john@test.com',
        age: 30
      });

      expect(errors.length).toBe(0);
    });
  });
});
