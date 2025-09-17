import { ValidationRule, FieldDefinition, CassandraType } from './types';

export class Validator {
  static validate(data: any, fields: { [key: string]: CassandraType | FieldDefinition }, isUpdate: boolean = false): string[] {
    const errors: string[] = [];

    for (const [fieldName, fieldDef] of Object.entries(fields)) {
      const rule = this.getValidationRule(fieldDef);
      if (!rule) continue;

      const value = data[fieldName];

      // For updates, only validate fields that are being updated
      if (isUpdate && value === undefined) continue;

      const fieldErrors = this.validateField(fieldName, value, rule);
      errors.push(...fieldErrors);
    }

    return errors;
  }

  private static getValidationRule(fieldDef: CassandraType | FieldDefinition): ValidationRule | null {
    if (typeof fieldDef === 'string') return null;
    return fieldDef.validate || null;
  }

  private static validateField(fieldName: string, value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return errors;
    }

    if (value === undefined || value === null || value === '') {
      return errors;
    }

    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldName} must be at most ${rule.maxLength} characters`);
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }

      if (rule.isEmail && !this.isValidEmail(value)) {
        errors.push(`${fieldName} must be a valid email`);
      }

      if (rule.isUrl && !this.isValidUrl(value)) {
        errors.push(`${fieldName} must be a valid URL`);
      }

      if (rule.isJson && !this.isValidJson(value)) {
        errors.push(`${fieldName} must be valid JSON`);
      }
    }

    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${fieldName} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${fieldName} must be at most ${rule.max}`);
      }
    }

    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push(typeof result === 'string' ? result : `${fieldName} is invalid`);
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
