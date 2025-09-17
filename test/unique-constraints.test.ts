import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createClient } from '../src/index';

describe('Unique Constraints', () => {
  let client: any;

  beforeAll(async () => {
    client = createClient({
      clientOptions: {
        contactPoints: ['127.0.0.1'],
        localDataCenter: 'datacenter1',
        keyspace: 'test_unique'
      },
      ormOptions: {
        createKeyspace: true
      }
    });
  });

  afterAll(async () => {
    await client.disconnect();
  });

  describe('Field-level unique constraints', () => {
    let User: any;

    beforeAll(async () => {
      User = await client.loadSchema('users_unique_field_v2', {
        fields: {
          id: 'uuid',
          email: {
            type: 'text',
            unique: true, // Field-level unique constraint
            validate: {
              required: true,
              isEmail: true
            }
          },
          username: {
            type: 'text',
            unique: true, // Field-level unique constraint
            validate: {
              required: true,
              minLength: 3
            }
          },
          name: 'text'
        },
        key: ['id']
      });
    });

    it('should create user with unique fields', async () => {
      const user = await User.create({
        email: 'unique1@example.com',
        username: 'unique_user1',
        name: 'Unique User 1'
      });

      expect(user.email).toBe('unique1@example.com');
      expect(user.username).toBe('unique_user1');
      expect(user.name).toBe('Unique User 1');
      expect(user.id).toBeDefined();
    });

    it('should prevent duplicate email', async () => {
      try {
        await User.create({
          email: 'unique1@example.com', // Duplicate email
          username: 'different_user',
          name: 'Different User'
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("email 'unique1@example.com' already exists");
      }
    });

    it('should prevent duplicate username', async () => {
      try {
        await User.create({
          email: 'different@example.com',
          username: 'unique_user1', // Duplicate username
          name: 'Different User'
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("username 'unique_user1' already exists");
      }
    });

    it('should allow update with same unique value', async () => {
      const users = await User.find();
      const user = users[0];

      // Update with same email should work
      await User.update({ name: 'User Updated' }, { id: user.id });

      const updated = await User.findOne({ id: user.id });
      expect(updated.name).toBe('User Updated');
      expect(updated.email).toBe('unique1@example.com'); // Same email
    });

    it('should prevent update to duplicate unique value', async () => {
      // Create another user first
      const user2 = await User.create({
        email: 'unique2@example.com',
        username: 'unique_user2',
        name: 'Unique User 2'
      });

      const users = await User.find();
      const user1 = users.find(u => u.email === 'unique1@example.com');

      try {
        // Try to update user1 to have same email as user2
        await User.update({ email: 'unique2@example.com' }, { id: user1.id });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("email 'unique2@example.com' already exists");
      }
    });
  });

  describe('Schema-level unique constraints', () => {
    let Product: any;

    beforeAll(async () => {
      Product = await client.loadSchema('products_unique_schema_v2', {
        fields: {
          id: 'nanoid',
          sku: 'text',
          barcode: 'text',
          name: 'text',
          price: 'decimal'
        },
        key: ['id'],
        unique: ['sku', 'barcode'], // Schema-level unique constraints
        indexes: ['name'] // Regular index
      });
    });

    it('should create product with unique SKU and barcode', async () => {
      const product = await Product.create({
        sku: 'UNIQUE-LAPTOP-001',
        barcode: '1111111111111',
        name: 'Gaming Laptop',
        price: 1299.99
      });

      expect(product.sku).toBe('UNIQUE-LAPTOP-001');
      expect(product.barcode).toBe('1111111111111');
      expect(product.name).toBe('Gaming Laptop');
      expect(product.id).toBeDefined();
    });

    it('should prevent duplicate SKU', async () => {
      try {
        await Product.create({
          sku: 'UNIQUE-LAPTOP-001', // Duplicate SKU
          barcode: '2222222222222',
          name: 'Different Laptop',
          price: 999.99
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("sku 'UNIQUE-LAPTOP-001' already exists");
      }
    });

    it('should prevent duplicate barcode', async () => {
      try {
        await Product.create({
          sku: 'UNIQUE-LAPTOP-002',
          barcode: '1111111111111', // Duplicate barcode
          name: 'Another Laptop',
          price: 1499.99
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain("barcode '1111111111111' already exists");
      }
    });

    it('should allow same name (not unique)', async () => {
      const product = await Product.create({
        sku: 'UNIQUE-LAPTOP-003',
        barcode: '3333333333333',
        name: 'Gaming Laptop', // Same name as first product
        price: 1599.99
      });

      expect(product.name).toBe('Gaming Laptop');
      expect(product.sku).toBe('UNIQUE-LAPTOP-003');
    });
  });

  describe('Mixed unique constraints', () => {
    let Account: any;

    beforeAll(async () => {
      Account = await client.loadSchema('accounts_mixed_unique_v2', {
        fields: {
          id: 'timeuuid',
          email: {
            type: 'text',
            unique: true, // Field-level unique
            validate: { isEmail: true }
          },
          phone: 'text',
          account_number: 'text',
          name: 'text'
        },
        key: ['id'],
        unique: ['phone', 'account_number'], // Schema-level unique
        indexes: ['email'] // Index already exists for email
      });
    });

    it('should enforce all unique constraints', async () => {
      const account = await Account.create({
        email: 'unique_user@example.com',
        phone: '+1111111111',
        account_number: 'UNIQUE-ACC-001',
        name: 'Unique Test User'
      });

      expect(account.email).toBe('unique_user@example.com');
      expect(account.phone).toBe('+1111111111');
      expect(account.account_number).toBe('UNIQUE-ACC-001');
    });

    it('should prevent duplicate email (field-level)', async () => {
      try {
        await Account.create({
          email: 'unique_user@example.com', // Duplicate
          phone: '+2222222222',
          account_number: 'UNIQUE-ACC-002',
          name: 'Another User'
        });
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toContain("email 'unique_user@example.com' already exists");
      }
    });

    it('should prevent duplicate phone (schema-level)', async () => {
      try {
        await Account.create({
          email: 'another_unique@example.com',
          phone: '+1111111111', // Duplicate
          account_number: 'UNIQUE-ACC-003',
          name: 'Another User'
        });
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toContain("phone '+1111111111' already exists");
      }
    });

    it('should prevent duplicate account_number (schema-level)', async () => {
      try {
        await Account.create({
          email: 'third_unique@example.com',
          phone: '+3333333333',
          account_number: 'UNIQUE-ACC-001', // Duplicate
          name: 'Third User'
        });
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toContain("account_number 'UNIQUE-ACC-001' already exists");
      }
    });
  });
});
