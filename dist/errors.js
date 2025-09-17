"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaError = exports.ConnectionError = exports.UniqueConstraintError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.field = field;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class UniqueConstraintError extends Error {
    constructor(field, value) {
        super(`${field} '${value}' already exists`);
        this.name = 'UniqueConstraintError';
    }
}
exports.UniqueConstraintError = UniqueConstraintError;
class ConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConnectionError';
    }
}
exports.ConnectionError = ConnectionError;
class SchemaError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SchemaError';
    }
}
exports.SchemaError = SchemaError;
//# sourceMappingURL=errors.js.map