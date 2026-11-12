/**
 * Security & Sanitization Utilities
 */

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS)
 */
export const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates that input is a non-empty string and not an injected object
 */
export const sanitizeString = (input, maxLen = 500) => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLen);
};

/**
 * Password Complexity Validator
 * Requires: Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character
 */
export const validatePasswordStrength = (password) => {
  if (typeof password !== 'string') {
    return { isValid: false, message: 'Password must be a string' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, message: 'Password cannot exceed 128 characters' };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    };
  }

  return { isValid: true };
};

