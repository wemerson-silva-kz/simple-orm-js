import { describe, test, expect } from 'bun:test';
import { Validator } from '../src/validator';
import { TypeConverter } from '../src/converter';
import { uuid, nanoid } from '../src';

describe('Unit Tests (No Cassandra Required)', () => {
  describe('Validator', () => {
    test('should validate required fields', () => {
      const fields = {
        name: { type: 'text' as const, validate: { required: true } },
        email: { type: 'text' as const, validate: { required: true, isEmail: true } }
      };

      const errors = Validator.validate({}, fields);
      expect(errors).toContain('name is required');
      expect(errors).toContain('email is required');
    });

    test('should validate email format', () => {
      const fields = {
        email: { type: 'text' as const, validate: { isEmail: true } }
      };

      const errors = Validator.validate({ email: 'invalid-email' }, fields);
      expect(errors).toContain('email must be a valid email');

      const validErrors = Validator.validate({ email: 'test@example.com' }, fields);
      expect(validErrors).toHaveLength(0);
    });

    test('should validate string length', () => {
      const fields = {
        name: { type: 'text' as const, validate: { minLength: 2, maxLength: 10 } }
      };

      const shortErrors = Validator.validate({ name: 'J' }, fields);
      expect(shortErrors).toContain('name must be at least 2 characters');

      const longErrors = Validator.validate({ name: 'Very long name' }, fields);
      expect(longErrors).toContain('name must be at most 10 characters');

      const validErrors = Validator.validate({ name: 'John' }, fields);
      expect(validErrors).toHaveLength(0);
    });

    test('should validate number ranges', () => {
      const fields = {
        age: { type: 'int' as const, validate: { min: 0, max: 150 } }
      };

      const lowErrors = Validator.validate({ age: -1 }, fields);
      expect(lowErrors).toContain('age must be at least 0');

      const highErrors = Validator.validate({ age: 200 }, fields);
      expect(highErrors).toContain('age must be at most 150');

      const validErrors = Validator.validate({ age: 25 }, fields);
      expect(validErrors).toHaveLength(0);
    });

    test('should validate custom rules', () => {
      const fields = {
        password: {
          type: 'text' as const,
          validate: {
            custom: (value: string) => {
              return value.length >= 8 ? true : 'Password must be at least 8 characters';
            }
          }
        }
      };

      const errors = Validator.validate({ password: '123' }, fields);
      expect(errors).toContain('Password must be at least 8 characters');

      const validErrors = Validator.validate({ password: 'password123' }, fields);
      expect(validErrors).toHaveLength(0);
    });

    test('should validate JSON format', () => {
      const fields = {
        config: { type: 'json' as const, validate: { isJson: true } }
      };

      const errors = Validator.validate({ config: 'invalid json' }, fields);
      expect(errors).toContain('config must be valid JSON');

      const validErrors = Validator.validate({ config: '{"key": "value"}' }, fields);
      expect(validErrors).toHaveLength(0);
    });

    test('should validate URL format', () => {
      const fields = {
        website: { type: 'text' as const, validate: { isUrl: true } }
      };

      const errors = Validator.validate({ website: 'not-a-url' }, fields);
      expect(errors).toContain('website must be a valid URL');

      const validErrors = Validator.validate({ website: 'https://example.com' }, fields);
      expect(validErrors).toHaveLength(0);
    });
  });

  describe('TypeConverter', () => {
    test('should get correct Cassandra types', () => {
      expect(TypeConverter.getCassandraType('text')).toBe('text');
      expect(TypeConverter.getCassandraType('int')).toBe('int');
      expect(TypeConverter.getCassandraType('uuid')).toBe('uuid');
      expect(TypeConverter.getCassandraType('set<text>')).toBe('set<text>');
      expect(TypeConverter.getCassandraType('map<text,int>')).toBe('map<text,int>');
      expect(TypeConverter.getCassandraType('nanoid')).toBe('text'); // nanoid maps to text
      expect(TypeConverter.getCassandraType('json')).toBe('text'); // json maps to text
    });

    test('should convert object with defaults', () => {
      const fields = {
        id: 'uuid' as const,
        name: 'text' as const,
        active: { type: 'boolean' as const, default: true },
        created_at: { type: 'timestamp' as const, default: () => new Date() }
      };

      const converted = TypeConverter.convertObject({ name: 'John' }, fields);
      
      expect(converted.name).toBe('John');
      expect(converted.active).toBe(true);
      expect(converted.created_at).toBeInstanceOf(Date);
      expect(converted.id).toBeDefined(); // UUID should be generated
    });

    test('should handle collection types', () => {
      const fields = {
        tags: 'set<text>' as const,
        scores: 'list<int>' as const,
        metadata: 'map<text,text>' as const
      };

      const data = {
        tags: ['tag1', 'tag2'],
        scores: [85, 92, 78],
        metadata: { key1: 'value1', key2: 'value2' }
      };

      const converted = TypeConverter.convertObject(data, fields);
      
      expect(converted.tags).toEqual(['tag1', 'tag2']);
      expect(converted.scores).toEqual([85, 92, 78]);
      expect(converted.metadata).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });

  describe('ID Generation', () => {
    test('should generate different UUID types', () => {
      const standardUuid = uuid();
      const nanoId = nanoid();
      const customNanoId = nanoid(10);

      expect(typeof standardUuid).toBe('object'); // Cassandra UUID object
      expect(typeof nanoId).toBe('string');
      expect(typeof customNanoId).toBe('string');
      expect(customNanoId.length).toBe(10);
      expect(nanoId).not.toBe(customNanoId);
    });

    test('should generate unique IDs', () => {
      const ids = Array(100).fill(0).map(() => nanoid());
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(100); // All IDs should be unique
    });
  });

  describe('Error Classes', () => {
    test('should create proper error instances', async () => {
      const { ValidationError, UniqueConstraintError, ConnectionError } = await import('../src/errors');
      
      const validationError = new ValidationError('Validation failed', 'email');
      expect(validationError.name).toBe('ValidationError');
      expect(validationError.message).toBe('Validation failed');
      expect(validationError.field).toBe('email');

      const uniqueError = new UniqueConstraintError('email', 'test@test.com');
      expect(uniqueError.name).toBe('UniqueConstraintError');
      expect(uniqueError.message).toBe("email 'test@test.com' already exists");

      const connectionError = new ConnectionError('Connection failed');
      expect(connectionError.name).toBe('ConnectionError');
      expect(connectionError.message).toBe('Connection failed');
    });
  });

  describe('Complex Validation Scenarios', () => {
    test('should handle nested validation rules', () => {
      const fields = {
        user: {
          type: 'json' as const,
          validate: {
            isJson: true,
            custom: (value: string) => {
              try {
                const parsed = JSON.parse(value);
                return parsed.name && parsed.email ? true : 'User must have name and email';
              } catch {
                return 'Invalid JSON format';
              }
            }
          }
        }
      };

      const invalidJson = Validator.validate({ user: 'invalid' }, fields);
      expect(invalidJson).toContain('user must be valid JSON');

      const incompleteUser = Validator.validate({ 
        user: JSON.stringify({ name: 'John' }) 
      }, fields);
      expect(incompleteUser).toContain('User must have name and email');

      const validUser = Validator.validate({ 
        user: JSON.stringify({ name: 'John', email: 'john@test.com' }) 
      }, fields);
      expect(validUser).toHaveLength(0);
    });

    test('should validate update scenarios', () => {
      const fields = {
        name: { type: 'text' as const, validate: { required: true } },
        email: { type: 'text' as const, validate: { required: true, isEmail: true } },
        age: { type: 'int' as const, validate: { min: 0 } }
      };

      // For updates, only validate provided fields
      const updateErrors = Validator.validate({ age: 25 }, fields, true);
      expect(updateErrors).toHaveLength(0); // name and email not required for updates

      const invalidUpdateErrors = Validator.validate({ age: -5 }, fields, true);
      expect(invalidUpdateErrors).toContain('age must be at least 0');
    });
  });
});
