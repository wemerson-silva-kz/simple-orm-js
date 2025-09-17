# API Reference

Complete API reference for Simple ORM JS.

## Client

### `createClient(config)`

Creates a new ORM client instance.

**Parameters:**
- `config` (Object): Configuration object
  - `clientOptions` (Object): Cassandra driver options
    - `contactPoints` (Array): Array of contact points
    - `localDataCenter` (String): Local data center name
    - `keyspace` (String): Keyspace name
  - `ormOptions` (Object): ORM-specific options
    - `createKeyspace` (Boolean): Auto-create keyspace if not exists
    - `migration` (String): Migration strategy ('safe' | 'drop')
    - `idGenerator` (String): Default ID generator ('uuid' | 'nanoid' | 'timeuuid')

**Returns:** `CassandraORM` instance

**Example:**
```typescript
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
```

### `client.connect()`

Connects to the Cassandra cluster.

**Returns:** `Promise<void>`

### `client.loadSchema(tableName, schema)`

Loads a schema and returns a model instance.

**Parameters:**
- `tableName` (String): Name of the table
- `schema` (Object): Schema definition

**Returns:** `Promise<Model>`

### `client.disconnect()`

Disconnects from the Cassandra cluster.

**Returns:** `Promise<void>`

## Model

### `Model.create(data)`

Creates a new record.

**Parameters:**
- `data` (Object): Data to insert

**Returns:** `Promise<Object>` - Created record with generated fields

**Example:**
```typescript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com'
});
```

### `Model.find(where?)`

Finds multiple records.

**Parameters:**
- `where` (Object, optional): Query conditions

**Returns:** `Promise<Array>` - Array of matching records

**Example:**
```typescript
const users = await User.find();
const activeUsers = await User.find({ active: true });
```

### `Model.findOne(where)`

Finds a single record.

**Parameters:**
- `where` (Object): Query conditions

**Returns:** `Promise<Object|null>` - Matching record or null

**Example:**
```typescript
const user = await User.findOne({ id: userId });
```

### `Model.update(data, where)`

Updates records.

**Parameters:**
- `data` (Object): Data to update
- `where` (Object): Query conditions

**Returns:** `Promise<void>`

**Example:**
```typescript
await User.update({ name: 'Jane Doe' }, { id: userId });
```

### `Model.delete(where)`

Deletes records.

**Parameters:**
- `where` (Object): Query conditions

**Returns:** `Promise<void>`

**Example:**
```typescript
await User.delete({ id: userId });
```

### `Model.count(where?)`

Counts records.

**Parameters:**
- `where` (Object, optional): Query conditions

**Returns:** `Promise<number>` - Count of matching records

**Example:**
```typescript
const totalUsers = await User.count();
const activeUsers = await User.count({ active: true });
```

### `Model.validate(data, isUpdate?)`

Validates data against schema.

**Parameters:**
- `data` (Object): Data to validate
- `isUpdate` (Boolean, optional): Whether this is an update operation

**Returns:** `Array<ValidationError>` - Array of validation errors

**Example:**
```typescript
const errors = User.validate({
  name: 'J', // Too short
  email: 'invalid' // Invalid email
});

if (errors.length > 0) {
  console.log('Validation errors:', errors);
}
```

## Schema Definition

### Field Types

#### Simple Types
```typescript
{
  field_name: 'type'
}
```

#### Complex Types
```typescript
{
  field_name: {
    type: 'text',
    unique: true,
    validate: {
      required: true,
      minLength: 2
    },
    default: 'default_value'
  }
}
```

### Supported Types

#### String Types
- `text` - Variable length text
- `ascii` - ASCII only text
- `varchar` - Alias for text

#### Numeric Types
- `int` - 32-bit signed integer
- `bigint` - 64-bit signed integer
- `smallint` - 16-bit signed integer
- `tinyint` - 8-bit signed integer
- `varint` - Variable precision integer
- `float` - 32-bit floating point
- `double` - 64-bit floating point
- `decimal` - Variable precision decimal
- `counter` - Counter column

#### ID Types
- `uuid` - Standard UUID (auto-generated)
- `timeuuid` - Time-based UUID (auto-generated)
- `nanoid` - NanoID (auto-generated, URL-safe)

#### Date/Time Types
- `timestamp` - Date and time
- `date` - Date only
- `time` - Time only
- `duration` - Duration/interval

#### Collection Types
- `set<type>` - Set of values
- `list<type>` - List of values
- `map<keyType,valueType>` - Map of key-value pairs
- `tuple<type1,type2,...>` - Tuple with fixed structure

#### Other Types
- `boolean` - True/false
- `blob` - Binary data
- `inet` - IP address
- `json` - JSON data (stored as text)

### Validation Rules

#### String Validation
```typescript
{
  required: true,
  minLength: 2,
  maxLength: 50,
  pattern: /^[a-zA-Z]+$/,
  isEmail: true,
  isUrl: true
}
```

#### Number Validation
```typescript
{
  required: true,
  min: 0,
  max: 100
}
```

#### JSON Validation
```typescript
{
  isJson: true
}
```

#### Custom Validation
```typescript
{
  custom: (value) => {
    return value.length >= 8 || 'Must be at least 8 characters';
  }
}
```

### Unique Constraints

#### Field-Level
```typescript
{
  email: {
    type: 'text',
    unique: true
  }
}
```

#### Schema-Level
```typescript
{
  fields: { /* ... */ },
  key: ['id'],
  unique: ['field1', 'field2']
}
```

### Default Values

#### Static Default
```typescript
{
  active: {
    type: 'boolean',
    default: true
  }
}
```

#### Function Default
```typescript
{
  created_at: {
    type: 'timestamp',
    default: () => new Date()
  }
}
```

## Utilities

### ID Generation

```typescript
import { uuid, nanoid } from 'simple-orm-js';

const uuidId = uuid();        // Standard UUID
const nanoId = nanoid();      // NanoID (21 chars)
const customNano = nanoid(10); // Custom length NanoID
```

### Type Conversion

```typescript
import { CassandraTypes } from 'simple-orm-js';

const longValue = CassandraTypes.Long.fromString('123456789');
const inetAddr = CassandraTypes.InetAddress.fromString('192.168.1.1');
```

## Error Handling

### Validation Errors
```typescript
try {
  await User.create(invalidData);
} catch (error) {
  if (error.message.includes('Validation failed')) {
    // Handle validation error
  }
}
```

### Unique Constraint Errors
```typescript
try {
  await User.create({ email: 'existing@example.com' });
} catch (error) {
  if (error.message.includes('already exists')) {
    // Handle unique constraint violation
  }
}
```

### Connection Errors
```typescript
try {
  await client.connect();
} catch (error) {
  // Handle connection error
}
```
