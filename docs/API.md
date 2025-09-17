# 📚 Simple ORM JS - Complete API Reference

## 🏗️ Client Creation

### `createClient(config: Config)`

Creates a new ORM client instance.

```typescript
import { createClient } from 'simple-orm-js';

const client = createClient({
  clientOptions: {
    contactPoints: ['127.0.0.1'],
    localDataCenter: 'datacenter1',
    keyspace: 'myapp',
    // ... other cassandra-driver options
  },
  ormOptions: {
    createKeyspace: true,        // Auto-create keyspace
    migration: 'safe',           // Migration strategy
    idGenerator: 'uuid'          // Default ID generator
  }
});
```

## 🔌 Connection Management

### `client.connect(): Promise<void>`

Establishes connection to Cassandra/ScyllaDB.

```typescript
await client.connect();
```

### `client.disconnect(): Promise<void>`

Closes the connection.

```typescript
await client.disconnect();
```

## 📋 Schema Loading

### `client.loadSchema<T>(tableName: string, schema: ModelSchema): Promise<Model<T>>`

Loads and creates a model from schema definition.

```typescript
const User = await client.loadSchema('users', {
  fields: {
    id: 'uuid',
    email: {
      type: 'text',
      unique: true,
      validate: { required: true, isEmail: true }
    },
    name: {
      type: 'text',
      validate: { required: true, minLength: 2 }
    }
  },
  key: ['id'],
  indexes: ['email']
});
```

## 🎯 Model Operations

### `Model.create(data: any): Promise<any>`

Creates a new record with validation and unique constraint checking.

```typescript
const user = await User.create({
  email: 'john@example.com',
  name: 'John Doe'
});
```

**Throws:**
- `ValidationError` - When validation fails
- `UniqueConstraintError` - When unique constraint is violated

### `Model.find(where?: any): Promise<any[]>`

Finds records matching the criteria.

```typescript
// Find all users
const allUsers = await User.find();

// Find with conditions
const activeUsers = await User.find({ active: true });

// Find by multiple conditions
const users = await User.find({ 
  active: true, 
  role: 'admin' 
});
```

### `Model.findOne(where: any): Promise<any | null>`

Finds a single record matching the criteria.

```typescript
const user = await User.findOne({ email: 'john@example.com' });
if (user) {
  console.log('User found:', user.name);
} else {
  console.log('User not found');
}
```

### `Model.update(data: any, where: any): Promise<void>`

Updates records matching the criteria.

```typescript
await User.update(
  { name: 'John Smith', active: false },
  { id: userId }
);
```

**Throws:**
- `ValidationError` - When validation fails
- `UniqueConstraintError` - When unique constraint is violated

### `Model.delete(where: any): Promise<void>`

Deletes records matching the criteria.

```typescript
await User.delete({ id: userId });
```

### `Model.count(where?: any): Promise<number>`

Counts records matching the criteria.

```typescript
const totalUsers = await User.count();
const activeUsers = await User.count({ active: true });
```

### `Model.validate(data: any, isUpdate?: boolean): ValidationError[]`

Validates data without persisting.

```typescript
const errors = User.validate({
  email: 'invalid-email',
  name: 'J'
});

if (errors.length > 0) {
  console.log('Validation errors:', errors.map(e => e.message));
}
```

## 🏗️ Schema Definition

### Field Types

#### Basic Types
```typescript
{
  text_field: 'text',        // Variable length text
  ascii_field: 'ascii',      // ASCII only text
  varchar_field: 'varchar',  // Alias for text
  int_field: 'int',          // 32-bit signed integer
  bigint_field: 'bigint',    // 64-bit signed integer
  float_field: 'float',      // 32-bit floating point
  double_field: 'double',    // 64-bit floating point
  boolean_field: 'boolean',  // True/false
  timestamp_field: 'timestamp', // Date and time
  uuid_field: 'uuid',        // UUID (auto-generated)
  blob_field: 'blob'         // Binary data
}
```

#### Collection Types
```typescript
{
  text_set: 'set<text>',           // Unique text values
  int_list: 'list<int>',           // Ordered integers
  text_map: 'map<text,text>',      // Key-value pairs
  coordinates: 'tuple<text,int>'   // Fixed structure
}
```

#### Custom Types
```typescript
{
  nanoid_field: 'nanoid',    // NanoID (auto-generated)
  json_field: 'json'         // JSON data with validation
}
```

### Field Definition Options

```typescript
interface FieldDefinition {
  type: CassandraType;       // Field type
  validate?: ValidationRule; // Validation rules
  default?: any;             // Default value or function
  unique?: boolean;          // Unique constraint
  frozen?: boolean;          // For collections
}
```

### Validation Rules

```typescript
interface ValidationRule {
  required?: boolean;                    // Field is required
  minLength?: number;                    // Minimum string length
  maxLength?: number;                    // Maximum string length
  min?: number;                          // Minimum numeric value
  max?: number;                          // Maximum numeric value
  pattern?: RegExp;                      // Regex pattern
  isEmail?: boolean;                     // Email validation
  isUrl?: boolean;                       // URL validation
  isJson?: boolean;                      // JSON validation
  custom?: (value: any) => boolean | string; // Custom validation
}
```

### Schema Options

```typescript
interface ModelSchema {
  fields: {
    [key: string]: CassandraType | FieldDefinition;
  };
  key: string[];              // Primary key columns
  clustering?: string[];      // Clustering columns
  indexes?: string[];         // Secondary indexes
  unique?: string[];          // Schema-level unique constraints
}
```

## 🛡️ Error Handling

### Error Types

```typescript
import { 
  ValidationError, 
  UniqueConstraintError, 
  ConnectionError, 
  SchemaError 
} from 'simple-orm-js';

try {
  await User.create(invalidData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
  } else if (error instanceof UniqueConstraintError) {
    console.log('Unique constraint violated:', error.message);
  } else if (error instanceof ConnectionError) {
    console.log('Connection failed:', error.message);
  } else if (error instanceof SchemaError) {
    console.log('Schema error:', error.message);
  }
}
```

## 🆔 ID Utilities

### UUID Generation

```typescript
import { uuid, nanoid, CassandraTypes } from 'simple-orm-js';

// Generate UUIDs
const standardUuid = uuid();
const timeUuid = CassandraTypes.TimeUuid.now();
const nanoId = nanoid();
const customNanoId = nanoid(10); // Custom length
```

## ⚡ Performance Features

### Prepared Statements

All queries automatically use prepared statements for optimal performance.

### Connection Pooling

Automatic connection management and pooling through cassandra-driver.

### Type Conversion Optimization

Efficient type conversion using Map-based lookups for O(1) performance.

### Index Management

Automatic index creation for unique constraints and specified indexes.

## 🔧 Advanced Configuration

### Client Options

All cassandra-driver options are supported:

```typescript
const client = createClient({
  clientOptions: {
    contactPoints: ['127.0.0.1', '127.0.0.2'],
    localDataCenter: 'datacenter1',
    keyspace: 'myapp',
    credentials: {
      username: 'cassandra',
      password: 'cassandra'
    },
    pooling: {
      maxRequestsPerConnection: 32768
    },
    socketOptions: {
      connectTimeout: 30000,
      readTimeout: 30000
    }
  }
});
```

### ORM Options

```typescript
interface ORMOptions {
  createKeyspace?: boolean;   // Auto-create keyspace
  migration?: 'safe' | 'force'; // Migration strategy
  idGenerator?: 'uuid' | 'nanoid'; // Default ID type
}
```

## 📊 Type Conversion

### Automatic Conversion

The ORM automatically converts between JavaScript and Cassandra types:

```typescript
// JavaScript -> Cassandra
const data = {
  id: uuid(),                    // UUID
  name: 'John',                  // text
  age: 30,                       // int
  active: true,                  // boolean
  created_at: new Date(),        // timestamp
  tags: ['tag1', 'tag2'],        // set<text>
  scores: [85, 92, 78],          // list<int>
  metadata: { key: 'value' },    // map<text,text>
  location: ['NYC', 10001]       // tuple<text,int>
};

await Model.create(data);
```

### Custom JSON Handling

```typescript
const schema = {
  fields: {
    config: {
      type: 'json',
      validate: {
        isJson: true,
        custom: (value) => {
          const parsed = JSON.parse(value);
          return parsed.version ? true : 'Config must have version';
        }
      }
    }
  }
};
```

## 🎯 Best Practices

### Schema Design

1. **Use appropriate types** for your data
2. **Add validation rules** to ensure data integrity
3. **Create indexes** for frequently queried fields
4. **Use unique constraints** where needed

### Performance

1. **Use prepared statements** (automatic)
2. **Batch operations** when possible
3. **Limit result sets** with appropriate WHERE clauses
4. **Use clustering columns** for time-series data

### Error Handling

1. **Catch specific error types**
2. **Validate data** before operations
3. **Handle unique constraint violations**
4. **Implement retry logic** for transient errors

## 📈 Monitoring

### Performance Metrics

```typescript
// Monitor query performance
const startTime = Date.now();
const results = await Model.find(criteria);
const queryTime = Date.now() - startTime;
console.log(`Query took ${queryTime}ms`);

// Monitor memory usage
const memUsage = process.memoryUsage();
console.log(`Heap used: ${memUsage.heapUsed / 1024 / 1024}MB`);
```

### Connection Health

```typescript
// Check connection status
if (client.connected) {
  console.log('Connected to Cassandra');
} else {
  console.log('Not connected');
}
```

---

This API reference covers all features of Simple ORM JS. For more examples and guides, see the main [README](../README.md).
