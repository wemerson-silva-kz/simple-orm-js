# Changelog

All notable changes to Simple ORM JS will be documented in this file.

## [1.0.0] - 2025-01-17

### Added
- 🎉 Initial release of Simple ORM JS
- ✅ Complete Cassandra type support (35+ types)
- ✅ TypeScript native with full type inference
- ✅ Data validation system with custom rules
- ✅ Unique constraints (field and schema level)
- ✅ Multiple ID types (UUID, TimeUUID, NanoID)
- ✅ Collection types (Sets, Lists, Maps, Tuples)
- ✅ JSON type with validation
- ✅ Default values (static and function)
- ✅ Performance optimized with prepared statements
- ✅ Connection pooling
- ✅ Ultra-lightweight bundle (~112KB)
- ✅ 100% test coverage
- ✅ Complete documentation

### Features
- **String Types**: text, ascii, varchar
- **Numeric Types**: int, bigint, smallint, tinyint, varint, float, double, decimal, counter
- **ID Types**: uuid, timeuuid, nanoid (all auto-generated)
- **Date/Time Types**: timestamp, date, time, duration
- **Collection Types**: set<T>, list<T>, map<K,V>, tuple<T1,T2,...>
- **Other Types**: boolean, blob, inet, json
- **Validation**: required, minLength, maxLength, min, max, pattern, isEmail, isUrl, isJson, custom
- **Unique Constraints**: Field-level and schema-level unique enforcement
- **Default Values**: Static values and function-based defaults
- **Performance**: Prepared statements, connection pooling, optimized type conversion

### Technical Details
- Built with TypeScript 5.0+
- Uses cassandra-driver 4.7.2
- Uses nanoid 5.1.5 for URL-safe IDs
- Supports Node.js 16+
- Bundle size: ~112KB
- Zero dependencies except cassandra-driver and nanoid
