import { ValidationRule, ValidationError, FieldDefinition, CassandraType } from './types';

export class Validator {
  static validate(data: any, fields: { [key: string]: CassandraType | FieldDefinition }, isUpdate: boolean = false): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      const value = data[fieldName];
      const validation = this.getValidationRule(fieldDef);
      
      if (!validation) continue;

      // For updates, only validate fields that are actually being updated
      if (isUpdate && value === undefined) {
        continue;
      }

      const fieldErrors = this.validateField(fieldName, value, validation);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  private static getValidationRule(fieldDef: CassandraType | FieldDefinition): ValidationRule | null {
    if (typeof fieldDef === 'string') return null;
    return fieldDef.validate || null;
  }

  private static validateField(fieldName: string, value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        value
      });
      return errors; // Stop validation if required field is missing
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return errors;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.minLength} characters`,
          value
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${rule.maxLength} characters`,
          value
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} format is invalid`,
          value
        });
      }

      if (rule.isEmail && !this.isValidEmail(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid email`,
          value
        });
      }

      if (rule.isUrl && !this.isValidUrl(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid URL`,
          value
        });
      }

      if (rule.isJson && !this.isValidJson(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be valid JSON`,
          value
        });
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.min}`,
          value
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${rule.max}`,
          value
        });
      }
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push({
          field: fieldName,
          message: typeof result === 'string' ? result : `${fieldName} is invalid`,
          value
        });
      }
    }

    return errors;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidJson(json: string): boolean {
    try {
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }
}
