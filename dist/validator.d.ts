import { FieldDefinition, CassandraType } from './types';
export declare class Validator {
    static validate(data: any, fields: {
        [key: string]: CassandraType | FieldDefinition;
    }, isUpdate?: boolean): string[];
    private static getValidationRule;
    private static validateField;
    private static isValidEmail;
    private static isValidUrl;
    private static isValidJson;
}
//# sourceMappingURL=validator.d.ts.map