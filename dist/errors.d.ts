export declare class ValidationError extends Error {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class UniqueConstraintError extends Error {
    constructor(field: string, value: any);
}
export declare class ConnectionError extends Error {
    constructor(message: string);
}
export declare class SchemaError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map