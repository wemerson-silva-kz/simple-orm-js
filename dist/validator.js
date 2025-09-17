"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
class Validator {
    static validate(data, fields, isUpdate = false) {
        const errors = [];
        for (const [fieldName, fieldDef] of Object.entries(fields)) {
            const value = data[fieldName];
            const validation = this.getValidationRule(fieldDef);
            if (!validation)
                continue;
            // For updates, only validate fields that are actually being updated
            if (isUpdate && value === undefined) {
                continue;
            }
            const fieldErrors = this.validateField(fieldName, value, validation);
            errors.push(...fieldErrors);
        }
        return errors;
    }
    static getValidationRule(fieldDef) {
        if (typeof fieldDef === 'string')
            return null;
        return fieldDef.validate || null;
    }
    static validateField(fieldName, value, rule) {
        const errors = [];
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
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    static isValidJson(json) {
        try {
            JSON.parse(json);
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map