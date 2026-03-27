/**
 * Venezuelan RIF (Registro de Información Fiscal) validation utilities.
 * 
 * The RIF validation uses modulo 11 algorithm with specific base values
 * for each document type and weighting multipliers.
 */

/**
 * Calculate the check digit for a Venezuelan RIF.
 * 
 * @param documentType - Type of document (V, E, J, P, G)
 * @param documentNumber - Document number (will be padded to 8 digits)
 * @returns The check digit (0-9)
 * 
 * @example
 * calculateRifCheckDigit('V', '30958324') // returns '4'
 * calculateRifCheckDigit('V', '9444510') // returns '4'
 */
export function calculateRifCheckDigit(documentType: string, documentNumber: string): string {
  // Base values for each document type
  const baseValues: Record<string, number> = {
    V: 4,   // Venezuelan
    E: 8,   // Extranjero (Foreigner)
    J: 12,  // Jurídico (Legal Entity)
    P: 16,  // Pasaporte (Passport)
    G: 20,  // Gobierno (Government)
  };

  // Multipliers for each position (index 0 is for base value, unused)
  const multipliers = [0, 3, 2, 7, 6, 5, 4, 3, 2];

  // Normalize document type to uppercase
  const docType = documentType.toUpperCase().trim();

  // Pad document number to 8 digits
  const paddedNumber = documentNumber.padStart(8, '0');

  // Build the RIF string (type + padded number, max 9 characters)
  const rifBase = (docType + paddedNumber).slice(0, 9);

  // Calculate the sum
  let total = 0;
  for (let i = 0; i < rifBase.length; i++) {
    if (i === 0) {
      // First position: add base value for document type
      total += baseValues[docType] || 0;
    } else {
      // Remaining positions: multiply digit by corresponding multiplier
      const digit = parseInt(rifBase[i], 10);
      total += digit * multipliers[i];
    }
  }

  // Calculate check digit: 11 - (sum % 11), if >= 10 then 0
  const remainder = total % 11;
  let checkDigit = 11 - remainder;
  if (checkDigit >= 10) {
    checkDigit = 0;
  }

  return checkDigit.toString();
}

/**
 * Validate a Venezuelan RIF format and check digit.
 * 
 * @param rif - The RIF to validate (formats: V-12345678-9, V123456789, V-123456789, etc.)
 * @returns Object with isValid boolean and errorMessage string
 */
export function validateRif(rif: string): { isValid: boolean; errorMessage: string } {
  if (!rif || rif.trim() === '') {
    return { isValid: false, errorMessage: 'RIF is required' };
  }

  // Remove common separators and convert to uppercase
  const cleanRif = rif.replace(/[-\s]/g, '').toUpperCase();

  // Check basic format: 1 letter + 8-9 digits
  if (cleanRif.length < 9 || cleanRif.length > 10) {
    return { isValid: false, errorMessage: 'RIF must have format: [VEJPG]-XXXXXXXX-X' };
  }

  const documentType = cleanRif[0];

  // Validate document type
  const validTypes = ['V', 'E', 'J', 'P', 'G'];
  if (!validTypes.includes(documentType)) {
    return { 
      isValid: false, 
      errorMessage: `Invalid document type. Must be one of: ${validTypes.join(', ')}` 
    };
  }

  // Extract document number (positions 1-8, padded if needed)
  const docNumber = cleanRif.slice(1, 9);

  // If RIF has 10 characters, validate the check digit
  if (cleanRif.length === 10) {
    const providedCheck = cleanRif[9];
    const expectedCheck = calculateRifCheckDigit(documentType, docNumber);

    if (providedCheck !== expectedCheck) {
      return { 
        isValid: false, 
        errorMessage: `Invalid RIF check digit. Expected: ${documentType}-${docNumber}-${expectedCheck}` 
      };
    }
  }

  return { isValid: true, errorMessage: '' };
}

/**
 * Format a RIF in standard format with separators.
 * 
 * @param documentType - Type of document (V, E, J, P, G)
 * @param documentNumber - Document number
 * @param checkDigit - Optional check digit (if not provided, will be calculated)
 * @returns Formatted RIF: V-XXXXXXXX-X
 * 
 * @example
 * formatRif('V', '30958324') // returns 'V-30958324-4'
 * formatRif('V', '9444510') // returns 'V-09444510-4'
 */
export function formatRif(
  documentType: string, 
  documentNumber: string, 
  checkDigit?: string
): string {
  // Normalize document type to uppercase
  const docType = documentType.toUpperCase().trim();

  // Pad document number to 8 digits
  const paddedNumber = documentNumber.padStart(8, '0');

  // Calculate check digit if not provided
  const check = checkDigit ?? calculateRifCheckDigit(docType, documentNumber);

  return `${docType}-${paddedNumber}-${check}`;
}

/**
 * Parse a RIF string into its components.
 * 
 * @param rif - The RIF to parse (any format)
 * @returns Object with documentType, documentNumber, and checkDigit
 * 
 * @example
 * parseRif('V-30958324-4') 
 * // returns { documentType: 'V', documentNumber: '30958324', checkDigit: '4' }
 */
export function parseRif(rif: string): { 
  documentType: string; 
  documentNumber: string; 
  checkDigit: string 
} {
  // Remove separators and convert to uppercase
  const cleanRif = rif.replace(/[-\s]/g, '').toUpperCase();

  const documentType = cleanRif[0];
  const documentNumber = cleanRif.slice(1, 9);
  const checkDigit = cleanRif.length > 9 
    ? cleanRif[9] 
    : calculateRifCheckDigit(documentType, documentNumber);

  return {
    documentType,
    documentNumber,
    checkDigit,
  };
}

/**
 * Get the expected RIF for a given document type and number.
 * This is useful for showing users what their RIF should be.
 * 
 * @param documentType - Type of document (V, E, J, P, G)
 * @param documentNumber - Document number
 * @returns The complete formatted RIF
 */
export function getExpectedRif(documentType: string, documentNumber: string): string {
  return formatRif(documentType, documentNumber);
}
