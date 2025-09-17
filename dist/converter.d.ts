import { CassandraType, FieldDefinition } from './types';
export declare class TypeConverter {
    private static readonly converters;
    static convert(value: any, type: CassandraType): any;
    static convertObject(data: any, fields: {
        [key: string]: CassandraType | FieldDefinition;
    }): any;
    private static getFieldType;
    static getCassandraType(type: CassandraType): string;
}
//# sourceMappingURL=converter.d.ts.map