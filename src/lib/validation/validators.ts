/**
 * GLOBAL VALIDATION LAYER
 * 
 * Reusable validation functions for consistent error handling across the ERP system.
 * These validators provide standardized error messages and type checking.
 * 
 * ARCHITECTURAL INTENT:
 * - Eliminate duplicate validation logic
 * - Provide consistent error messages
 * - Enable easy maintenance and updates
 * - Support future validation enhancements
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates that a value is not null, undefined, or empty string
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

/**
 * Validates that a number is positive (> 0)
 */
export function validatePositiveNumber(value: number, fieldName: string): void {
  validateRequired(value, fieldName);
  
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be greater than 0`);
  }
}

/**
 * Validates that a number is non-negative (>= 0)
 */
export function validateNonNegativeNumber(value: number, fieldName: string): void {
  validateRequired(value, fieldName);
  
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  
  if (value < 0) {
    throw new ValidationError(`${fieldName} cannot be negative`);
  }
}

/**
 * Validates that a date is in the future
 */
export function validateFutureDate(date: string | Date, fieldName: string): void {
  validateRequired(date, fieldName);
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  if (dateObj < now) {
    throw new ValidationError(`${fieldName} must be in the future`);
  }
}

/**
 * Validates that a value is one of the allowed enum values
 */
export function validateEnum<T>(value: T, allowedValues: T[], fieldName: string): void {
  validateRequired(value, fieldName);
  
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
}

/**
 * Validates that an ID is a positive integer
 */
export function validateId(value: number, fieldName: string): void {
  validateRequired(value, fieldName);
  
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`);
  }
}

/**
 * Validates that a status transition is allowed
 * 
 * @param currentStatus - The current status
 * @param nextStatus - The desired next status
 * @param allowedTransitions - Map of current status to allowed next statuses
 */
export function validateStatusTransition(
  currentStatus: string,
  nextStatus: string,
  allowedTransitions: Record<string, string[]>
): void {
  validateRequired(currentStatus, 'Current status');
  validateRequired(nextStatus, 'Next status');
  
  const allowed = allowedTransitions[currentStatus];
  
  if (!allowed) {
    throw new ValidationError(`Invalid current status: ${currentStatus}`);
  }
  
  if (!allowed.includes(nextStatus)) {
    throw new ValidationError(
      `Cannot transition from ${currentStatus} to ${nextStatus}. Allowed transitions: ${allowed.join(', ')}`
    );
  }
}

/**
 * Validates that a date range is valid (start <= end)
 */
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date,
  startFieldName: string = 'Start date',
  endFieldName: string = 'End date'
): void {
  validateRequired(startDate, startFieldName);
  validateRequired(endDate, endFieldName);
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (isNaN(start.getTime())) {
    throw new ValidationError(`${startFieldName} must be a valid date`);
  }
  
  if (isNaN(end.getTime())) {
    throw new ValidationError(`${endFieldName} must be a valid date`);
  }
  
  if (start > end) {
    throw new ValidationError(`${startFieldName} must be before or equal to ${endFieldName}`);
  }
}

/**
 * Validates that a string matches a pattern
 */
export function validatePattern(
  value: string,
  pattern: RegExp,
  fieldName: string,
  patternDescription: string
): void {
  validateRequired(value, fieldName);
  
  if (!pattern.test(value)) {
    throw new ValidationError(`${fieldName} must match pattern: ${patternDescription}`);
  }
}

/**
 * Validates that a string length is within bounds
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): void {
  validateRequired(value, fieldName);
  
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  
  if (value.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (value.length > maxLength) {
    throw new ValidationError(`${fieldName} must not exceed ${maxLength} characters`);
  }
}

/**
 * Validates that an array is not empty
 */
export function validateNonEmptyArray(value: any[], fieldName: string): void {
  validateRequired(value, fieldName);
  
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }
  
  if (value.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
}
