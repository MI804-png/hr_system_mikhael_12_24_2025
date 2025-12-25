/**
 * Input and Email Validators for HR System
 * Provides utility functions for form validation
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates an email address format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates that a string is not empty
 * @param value - String to validate
 * @returns true if not empty, false otherwise
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Validates that a string has minimum length
 * @param value - String to validate
 * @param minLength - Minimum required length
 * @returns true if meets minimum length, false otherwise
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

/**
 * Validates that a string has maximum length
 * @param value - String to validate
 * @param maxLength - Maximum allowed length
 * @returns true if within maximum length, false otherwise
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

/**
 * Validates that a number is positive
 * @param value - Number to validate
 * @returns true if positive, false otherwise
 */
export const isPositiveNumber = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Validates that a number is within a range
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if within range, false otherwise
 */
export const isInRange = (
  value: number | string,
  min: number,
  max: number
): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validates phone number format (basic validation)
 * @param phone - Phone number to validate
 * @returns true if valid format, false otherwise
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates employee form data
 * @param data - Employee form data
 * @returns Array of validation errors
 */
export const validateEmployeeForm = (data: {
  name?: string;
  position?: string;
  department?: string;
  email?: string;
  salaryType?: 'monthly' | 'hourly';
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isNotEmpty(data.name || '')) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (!hasMinLength(data.name || '', 2)) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
  } else if (!hasMaxLength(data.name || '', 100)) {
    errors.push({ field: 'name', message: 'Name must not exceed 100 characters' });
  }

  if (!isNotEmpty(data.position || '')) {
    errors.push({ field: 'position', message: 'Position is required' });
  } else if (!hasMinLength(data.position || '', 2)) {
    errors.push({ field: 'position', message: 'Position must be at least 2 characters' });
  }

  if (!isNotEmpty(data.department || '')) {
    errors.push({ field: 'department', message: 'Department is required' });
  }

  if (!isNotEmpty(data.email || '')) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email || '')) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  return errors;
};

/**
 * Validates salary form data
 * @param data - Salary form data
 * @returns Array of validation errors
 */
export const validateSalaryForm = (data: {
  employeeName?: string;
  baseSalary?: string | number;
  position?: string;
  department?: string;
  bonus?: string | number;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isNotEmpty(data.employeeName || '')) {
    errors.push({ field: 'employeeName', message: 'Employee name is required' });
  }

  if (!isNotEmpty(data.baseSalary?.toString() || '')) {
    errors.push({ field: 'baseSalary', message: 'Base salary is required' });
  } else if (!isPositiveNumber(data.baseSalary || 0)) {
    errors.push({ field: 'baseSalary', message: 'Base salary must be a positive number' });
  }

  if (!isNotEmpty(data.position || '')) {
    errors.push({ field: 'position', message: 'Position is required' });
  }

  if (!isNotEmpty(data.department || '')) {
    errors.push({ field: 'department', message: 'Department is required' });
  }

  if (data.bonus && !isPositiveNumber(data.bonus)) {
    errors.push({ field: 'bonus', message: 'Bonus must be a positive number' });
  }

  return errors;
};

/**
 * Validates recruitment form data
 * @param data - Recruitment form data
 * @returns Array of validation errors
 */
export const validateRecruitmentForm = (data: {
  title?: string;
  description?: string;
  salary?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isNotEmpty(data.title || '')) {
    errors.push({ field: 'title', message: 'Job title is required' });
  } else if (!hasMinLength(data.title || '', 3)) {
    errors.push({ field: 'title', message: 'Job title must be at least 3 characters' });
  }

  if (!isNotEmpty(data.description || '')) {
    errors.push({ field: 'description', message: 'Job description is required' });
  } else if (!hasMinLength(data.description || '', 10)) {
    errors.push({ field: 'description', message: 'Description must be at least 10 characters' });
  }

  if (!isNotEmpty(data.salary || '')) {
    errors.push({ field: 'salary', message: 'Salary range is required' });
  }

  return errors;
};

/**
 * Validates performance review form data
 * @param data - Performance review form data
 * @returns Array of validation errors
 */
export const validatePerformanceForm = (data: {
  name?: string;
  rating?: string | number;
  feedback?: string;
}): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!isNotEmpty(data.name || '')) {
    errors.push({ field: 'name', message: 'Employee name is required' });
  }

  if (!isNotEmpty(data.rating?.toString() || '')) {
    errors.push({ field: 'rating', message: 'Rating is required' });
  } else if (!isInRange(data.rating || 0, 1, 5)) {
    errors.push({ field: 'rating', message: 'Rating must be between 1 and 5' });
  }

  if (!isNotEmpty(data.feedback || '')) {
    errors.push({ field: 'feedback', message: 'Feedback is required' });
  } else if (!hasMinLength(data.feedback || '', 10)) {
    errors.push({ field: 'feedback', message: 'Feedback must be at least 10 characters' });
  }

  return errors;
};

/**
 * Gets the first error message for a specific field
 * @param errors - Array of validation errors
 * @param field - Field name to find error for
 * @returns Error message or undefined
 */
export const getFieldError = (
  errors: ValidationError[],
  field: string
): string | undefined => {
  return errors.find((e) => e.field === field)?.message;
};

/**
 * Checks if form has any errors for a specific field
 * @param errors - Array of validation errors
 * @param field - Field name to check
 * @returns true if field has errors, false otherwise
 */
export const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some((e) => e.field === field);
};
