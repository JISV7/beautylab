/**
 * Venezuelan phone number validation and normalization utilities.
 *
 * Handles Venezuelan phone numbers in various formats and normalizes them
 * to international format: +58XXXXXXXXXX (12 characters).
 *
 * Supported formats:
 * - Mobile: 0412-1234567, 0412 1234567, +58 412 1234567, 412 1234567
 * - Landline: 0212-1234567, 0212 1234567, +58 212 1234567, 212 1234567
 */

/**
 * Normalize a Venezuelan phone number to international format.
 *
 * @param phone - The phone number to normalize (various formats accepted)
 * @returns Normalized phone: +58XXXXXXXXXX (12 characters)
 *
 * @example
 * normalizePhone('0412-1234567') // returns '+584121234567'
 * normalizePhone('+58 412 1234567') // returns '+584121234567'
 * normalizePhone('412 1234567') // returns '+584121234567'
 * normalizePhone('0212-1234567') // returns '+582121234567'
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleanPhone = phone.replace(/[^\d+]/g, '');

  // Remove leading + if present (we'll add it back)
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.slice(1);
  }

  // Remove leading 0 if present (Venezuelan trunk prefix)
  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.slice(1);
  }

  // Remove country code 58 if present at the start (we'll add it back)
  if (cleanPhone.startsWith('58')) {
    cleanPhone = cleanPhone.slice(2);
  }

  // Now cleanPhone should be just the area code + number (10 digits)
  // Add country code back
  return `+58${cleanPhone}`;
}

/**
 * Validate a Venezuelan phone number format.
 *
 * @param phone - The phone number to validate (various formats accepted)
 * @returns Object with isValid boolean, errorMessage string, and normalizedPhone string
 *
 * @example
 * validatePhone('0412-1234567') // returns { isValid: true, errorMessage: '', normalizedPhone: '+584121234567' }
 * validatePhone('invalid') // returns { isValid: false, errorMessage: '...', normalizedPhone: '' }
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  errorMessage: string;
  normalizedPhone: string;
} {
  if (!phone || phone.trim() === '') {
    return { isValid: false, errorMessage: 'Phone number is required', normalizedPhone: '' };
  }

  // Normalize the phone number
  const normalized = normalizePhone(phone);

  // Remove + for validation
  const digitsOnly = normalized.slice(1); // Remove the +

  // Check if it starts with 58 (country code)
  if (!digitsOnly.startsWith('58')) {
    return { isValid: false, errorMessage: 'Phone number must be Venezuelan (+58)', normalizedPhone: '' };
  }

  // Get the local part (without country code)
  const localPart = digitsOnly.slice(2);

  // Venezuelan phone numbers are 10 digits (area code + number)
  // Mobile: 4XX-XXXXXXX (starts with 4)
  // Landline: 2XX-XXXXXXX (starts with 2)
  if (localPart.length !== 10) {
    return {
      isValid: false,
      errorMessage: 'Phone number must have 10 digits after country code',
      normalizedPhone: ''
    };
  }

  // Check if it's a valid Venezuelan number (starts with 2 or 4)
  if (!localPart.startsWith('2') && !localPart.startsWith('4')) {
    return {
      isValid: false,
      errorMessage: 'Invalid Venezuelan phone number (must start with 2 or 4)',
      normalizedPhone: ''
    };
  }

  // Additional check for mobile numbers (412, 414, 416, 424, 426, etc.)
  if (localPart.startsWith('4')) {
    const validMobilePrefixes = ['412', '414', '416', '424', '426', '413', '415', '417', '418', '419'];
    if (!validMobilePrefixes.includes(localPart.slice(0, 3))) {
      return {
        isValid: false,
        errorMessage: `Invalid mobile prefix. Valid prefixes: ${validMobilePrefixes.join(', ')}`,
        normalizedPhone: ''
      };
    }
  }

  return { isValid: true, errorMessage: '', normalizedPhone: normalized };
}
