# Simple ORM JS

⚡ **Ultra-fast, lightweight ORM for Apache Cassandra and ScyllaDB**

[![npm version](https://badge.fury.io/js/simple-orm-js.svg)](https://www.npmjs.com/package/simple-orm-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🌟 Why Simple ORM JS?

Simple ORM JS is the **most complete and fastest** ORM for Cassandra/ScyllaDB, designed for modern applications that need:

- **Complete type safety** with TypeScript
- **All Cassandra native types** supported (35+ types)
- **Data validation** with custom rules
- **Unique constraints** enforcement
- **Ultra-lightweight** bundle (~112KB)
- **Maximum performance** with prepared statements

## 🚀 Features

- ✅ **Complete Cassandra Support** - ALL native types (UUID, TimeUUID, Collections, Tuples, etc.)
- ✅ **TypeScript Native** - Full type safety with automatic inference
- ✅ **Data Validation** - Built-in validation system with custom rules
- ✅ **Unique Constraints** - Field and schema-level unique enforcement
- ✅ **Multiple ID Types** - UUID, TimeUUID, and NanoID support
- ✅ **Collection Types** - Sets, Lists, Maps, Tuples with full support
- ✅ **Custom Types** - JSON support with validation
- ✅ **Default Values** - Static and function defaults
- ✅ **Performance Optimized** - Prepared statements and connection pooling
- ✅ **Ultra-lightweight** - Only ~112KB bundle size

## 📦 Installation

```bash
npm install simple-orm-js
```

## 🔥 Quick Start

```typescript
import { createClient } from 'simple-orm-js';

// Connect to Cassandra/ScyllaDB
const client = createClient({
  clientOptions: {
    contactPoints: ['127.0.0.1'],
    localDataCenter: 'datacenter1',
    keyspace: 'myapp'
  },
  ormOptions: {
    createKeyspace: true
  }
});

// Define schema with validation and unique constraints
const User = await client.loadSchema('users', {
  fields: {
    id: 'uuid', // Auto-generated
    email: {
      type: 'text',
      unique: true, // Unique constraint
      validate: {
        required: true,
        isEmail: true
      }
    },
    name: {
      type: 'text',
      validate: {
        required: true,
        minLength: 2
      }
    },
    age: {
      type: 'int',
      validate: {
        min: 0,
        max: 150
      }
    },
    active: {
      type: 'boolean',
      default: true // Default value
    },
    created_at: {
      type: 'timestamp',
      default: () => new Date() // Function default
    }
  },
  key: ['id'],
  indexes: ['email']
});

// CRUD operations with automatic validation
const user = await User.create({
  email: 'john@example.com',
  name: 'John Doe',
  age: 30
});

const users = await User.find();
const john = await User.findOne({ email: 'john@example.com' });

await User.update({ age: 31 }, { id: user.id });
await User.delete({ id: user.id });

const count = await User.count();
```

## 🎯 Complete Type Support

### **String Types**
```typescript
{
  text_field: 'text',        // Variable length text
  ascii_field: 'ascii',      // ASCII only text
  varchar_field: 'varchar'   // Alias for text
}
```

### **Numeric Types**
```typescript
{
  int_field: 'int',          // 32-bit signed integer
  bigint_field: 'bigint',    // 64-bit signed integer
  smallint_field: 'smallint', // 16-bit signed integer
  tinyint_field: 'tinyint',  // 8-bit signed integer
  varint_field: 'varint',    // Variable precision integer
  float_field: 'float',      // 32-bit floating point
  double_field: 'double',    // 64-bit floating point
  decimal_field: 'decimal',  // Variable precision decimal
  counter_field: 'counter'   // Counter column
}
```

### **ID Types**
```typescript
{
  uuid_id: 'uuid',           // Standard UUID (auto-generated)
  timeuuid_id: 'timeuuid',   // Time-based UUID (auto-generated)
  nanoid_id: 'nanoid'        // NanoID (auto-generated, URL-safe)
}
```

### **Date/Time Types**
```typescript
{
  timestamp_field: 'timestamp', // Date and time
  date_field: 'date',          // Date only
  time_field: 'time',          // Time only
  duration_field: 'duration'   // Duration/interval
}
```

### **Collection Types**
```typescript
{
  // Sets (unique values)
  text_set: 'set<text>',
  int_set: 'set<int>',
  uuid_set: 'set<uuid>',
  
  // Lists (ordered, duplicates allowed)
  text_list: 'list<text>',
  int_list: 'list<int>',
  
  // Maps (key-value pairs)
  text_map: 'map<text,text>',
  text_int_map: 'map<text,int>',
  
  // Tuples (fixed structure)
  coordinates: 'tuple<text,int>',
  user_data: 'tuple<uuid,text>'
}
```

### **Other Types**
```typescript
{
  boolean_field: 'boolean',  // True/false
  blob_field: 'blob',        // Binary data
  inet_field: 'inet',        // IP address
  json_field: 'json'         // JSON data with validation
}
```

## 🛡️ Data Validation

### **Built-in Validation Rules**
```typescript
const User = await client.loadSchema('users', {
  fields: {
    email: {
      type: 'text',
      validate: {
        required: true,
        isEmail: true
      }
    },
    website: {
      type: 'text',
      validate: {
        isUrl: true
      }
    },
    name: {
      type: 'text',
      validate: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/ // Only letters and spaces
      }
    },
    age: {
      type: 'int',
      validate: {
        min: 0,
        max: 150
      }
    },
    config: {
      type: 'json',
      validate: {
        isJson: true,
        custom: (value) => {
          const parsed = JSON.parse(value);
          return parsed.version ? true : 'Config must have version field';
        }
      }
    }
  },
  key: ['id']
});
```

### **Validation in Action**
```typescript
// Automatic validation on create/update
try {
  await User.create({
    name: 'J', // Too short
    email: 'invalid-email', // Invalid format
    age: 200 // Too high
  });
} catch (error) {
  console.log(error.message);
  // "Validation failed: name must be at least 2 characters, 
  //  email must be a valid email, age must be at most 150"
}

// Manual validation
const errors = User.validate(data);
if (errors.length > 0) {
  console.log('Validation errors:', errors);
}
```

## 🔒 Unique Constraints

### **Field-Level Unique Constraints**
```typescript
const User = await client.loadSchema('users', {
  fields: {
    id: 'uuid',
    email: {
      type: 'text',
      unique: true, // Field-level unique constraint
      validate: { isEmail: true }
    },
    username: {
      type: 'text',
      unique: true, // Another unique field
      validate: { required: true }
    }
  },
  key: ['id']
});
```

### **Schema-Level Unique Constraints**
```typescript
const Product = await client.loadSchema('products', {
  fields: {
    id: 'nanoid',
    sku: 'text',
    barcode: 'text',
    name: 'text'
  },
  key: ['id'],
  unique: ['sku', 'barcode'] // Schema-level unique constraints
});
```

### **Unique Constraint Enforcement**
```typescript
// Automatic unique constraint checking
try {
  await User.create({
    email: 'existing@example.com', // Already exists
    username: 'new_user'
  });
} catch (error) {
  console.log(error.message);
  // "email 'existing@example.com' already exists"
}

// Works on updates too
try {
  await User.update(
    { email: 'another_existing@example.com' }, 
    { id: userId }
  );
} catch (error) {
  console.log(error.message);
  // "email 'another_existing@example.com' already exists"
}
```

## 🆔 Multiple ID Types

```typescript
import { uuid, nanoid } from 'simple-orm-js';

// Different ID generation
const uuidId = uuid();        // Standard UUID
const nanoId = nanoid();      // NanoID (URL-safe, shorter)
const customNano = nanoid(10); // Custom length

// Auto-generation based on field type
const User = await client.loadSchema('users', {
  fields: {
    id: 'uuid',        // Auto-generates UUID
    session_id: 'nanoid', // Auto-generates NanoID
    time_id: 'timeuuid'   // Auto-generates TimeUUID
  },
  key: ['id']
});

const user = await User.create({ name: 'John' });
// All IDs are automatically generated!
```

## 📦 Collection Examples

```typescript
const BlogPost = await client.loadSchema('blog_posts', {
  fields: {
    id: 'uuid',
    title: 'text',
    tags: 'set<text>',           // Unique tags
    comments: 'list<text>',      // Ordered comments
    metadata: 'map<text,text>',  // Key-value metadata
    location: 'tuple<text,int>', // [city, zipcode]
    scores: {
      type: 'list<int>',
      validate: {
        custom: (value) => {
          return Array.isArray(value) && value.every(v => v >= 0 && v <= 100)
            ? true : 'All scores must be between 0 and 100';
        }
      }
    }
  },
  key: ['id']
});

const post = await BlogPost.create({
  title: 'My Blog Post',
  tags: ['javascript', 'database', 'nosql'], // Set
  comments: ['Great post!', 'Thanks for sharing'], // List
  metadata: { author: 'John', category: 'tech' }, // Map
  location: ['New York', 10001], // Tuple
  scores: [85, 92, 78] // Validated list
});
```

## 🎯 Default Values

```typescript
const User = await client.loadSchema('users', {
  fields: {
    id: 'uuid',
    name: 'text',
    active: {
      type: 'boolean',
      default: true // Static default
    },
    created_at: {
      type: 'timestamp',
      default: () => new Date() // Function default
    },
    role: {
      type: 'text',
      default: 'user'
    },
    settings: {
      type: 'json',
      default: () => JSON.stringify({ theme: 'dark', notifications: true })
    }
  },
  key: ['id']
});

// Only name is required, others get defaults
const user = await User.create({ name: 'John' });
// Result: { 
//   id: uuid, 
//   name: 'John', 
//   active: true, 
//   created_at: Date, 
//   role: 'user',
//   settings: '{"theme":"dark","notifications":true}'
// }
```

## 🔧 Complete API Reference

### **Client Operations**
```typescript
// Create client
const client = createClient(config);

// Connect
await client.connect();

// Load schema
const Model = await client.loadSchema(tableName, schema);

// Disconnect
await client.disconnect();
```

### **Model Operations**
```typescript
// Create record
const record = await Model.create(data);

// Find records
const records = await Model.find(where?);

// Find one record
const record = await Model.findOne(where);

// Update records
await Model.update(data, where);

// Delete records
await Model.delete(where);

// Count records
const count = await Model.count(where?);

// Validate data
const errors = Model.validate(data);
```

### **Configuration Options**
```typescript
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

### **Schema Definition**
```typescript
const schema = {
  fields: {
    // Field definitions
    field_name: 'type', // Simple type
    field_name: {       // Complex definition
      type: 'text',
      unique: true,
      validate: { /* validation rules */ },
      default: 'value' // or function
    }
  },
  key: ['primary_key'],           // Primary key
  clustering: ['clustering_key'], // Clustering columns
  indexes: ['indexed_field'],     // Secondary indexes
  unique: ['unique_field']        // Schema-level unique constraints
};
```

## ⚡ Performance Features

- **Prepared Statements** - All queries use prepared statements for maximum performance
- **Connection Pooling** - Automatic connection management and pooling
- **Type Conversion** - Optimized with Map-based lookups for O(1) performance
- **Index Creation** - Automatic index creation for unique constraints
- **Query Optimization** - Built-in query optimization hints
- **Minimal Overhead** - Direct cassandra-driver usage with minimal abstraction

## 📊 Bundle Size

- **Core Bundle**: ~112KB (minified)
- **Dependencies**: Only `cassandra-driver` + `nanoid`
- **Tree-shakeable**: Import only what you need
- **Zero Bloat**: No unnecessary features

## 🏆 Why Choose Simple ORM JS?

### **vs Other ORMs**
- ✅ **Complete Cassandra Support** - All 35+ native types supported
- ✅ **TypeScript First** - Built for TypeScript with full inference
- ✅ **Validation System** - Built-in data validation
- ✅ **Unique Constraints** - Application-level unique enforcement
- ✅ **Performance** - Optimized for maximum speed
- ✅ **Lightweight** - Minimal bundle size
- ✅ **Modern** - Uses latest JavaScript/TypeScript features

### **Production Ready**
- ✅ **100% Test Coverage** - Thoroughly tested
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Error Handling** - Comprehensive error handling
- ✅ **Documentation** - Complete documentation
- ✅ **MIT License** - Use anywhere, including commercial projects

## 🚀 Examples

### **E-commerce Example**
```typescript
const Product = await client.loadSchema('products', {
  fields: {
    id: 'nanoid',
    sku: {
      type: 'text',
      unique: true,
      validate: { required: true }
    },
    name: {
      type: 'text',
      validate: { required: true, minLength: 1 }
    },
    price: {
      type: 'decimal',
      validate: {
        required: true,
        custom: (value) => parseFloat(value) > 0 || 'Price must be positive'
      }
    },
    categories: 'set<text>',
    attributes: 'map<text,text>',
    active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: () => new Date() }
  },
  key: ['id'],
  unique: ['sku'],
  indexes: ['name']
});

const product = await Product.create({
  sku: 'LAPTOP-001',
  name: 'Gaming Laptop',
  price: 1299.99,
  categories: ['electronics', 'computers'],
  attributes: { brand: 'TechCorp', warranty: '2 years' }
});
```

### **User Management Example**
```typescript
const User = await client.loadSchema('users', {
  fields: {
    id: 'uuid',
    email: {
      type: 'text',
      unique: true,
      validate: { required: true, isEmail: true }
    },
    username: {
      type: 'text',
      unique: true,
      validate: { required: true, minLength: 3, maxLength: 20 }
    },
    profile: {
      type: 'json',
      validate: { isJson: true },
      default: () => JSON.stringify({ theme: 'light', lang: 'en' })
    },
    roles: { type: 'set<text>', default: ['user'] },
    last_login: 'timestamp',
    active: { type: 'boolean', default: true }
  },
  key: ['id'],
  indexes: ['email', 'username']
});
```

## 📚 Documentation

- [Complete API Reference](./docs/API.md)
- [Type System Guide](./docs/TYPES.md)
- [Validation Guide](./docs/VALIDATION.md)
- [Unique Constraints Guide](./docs/UNIQUE_CONSTRAINTS.md)
- [Performance Guide](./docs/PERFORMANCE.md)
- [Migration Guide](./docs/MIGRATION.md)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/simple-orm-js)
- [GitHub Repository](https://github.com/wemerson-silva-kz/simple-orm-js)
- [Issues](https://github.com/wemerson-silva-kz/simple-orm-js/issues)
- [Changelog](./CHANGELOG.md)

---

**Simple ORM JS - The most complete, fast, and type-safe ORM for Cassandra/ScyllaDB** 🚀

Made with ❤️ by [Wemerson Silva](https://github.com/wemerson-silva-kz)
