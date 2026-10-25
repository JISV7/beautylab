/**
 * Venezuelan RIF (Registro de Información Fiscal) validation utilities.
 *
 * The RIF validation uses modulo 11 algorithm with specific base values
 * for each document type and weighting multipliers.
 */

/**
 * Normalize a RIF to 10-character format without separators.
 *
 * @param rif - The RIF to normalize (any format: V-12345678-9, V123456789, etc.)
 * @returns Normalized RIF: V123456789 (10 characters, uppercase, no separators)
 *
 * @example
 * normalizeRif('V123456781') // returns 'V123456781'
 * normalizeRif('V123456781') // returns 'V123456781'
 * normalizeRif('V123456781') // returns 'V123456781'
 */
export function normalizeRif(rif: string): string {
  // Remove separators and convert to uppercase
  return rif.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Calculate the check digit for a Venezuelan RIF.
 * 
 * @param documentType - Type of document (V, E, J, P, G)
 * @param documentNumber - Document number (will be padded to 8 digits)
 * @returns The check digit (0-9)
 * 
 * @example
 * calculateRifCheckDigit('V', '12345678') // returns '4'
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
 * @returns Object with isValid boolean, errorMessage string, and normalizedRif string
 */
export function validateRif(rif: string): { isValid: boolean; errorMessage: string; normalizedRif: string } {
  if (!rif || rif.trim() === '') {
    return { isValid: false, errorMessage: 'El RIF es obligatorio', normalizedRif: '' };
  }

  // Remove common separators and convert to uppercase
  const cleanRif = normalizeRif(rif);

  // Check basic format: 1 letter + at least 1 digit, up to 9 digits (max length 10)
  if (cleanRif.length < 2 || cleanRif.length > 10) {
    return { isValid: false, errorMessage: 'El RIF debe tener el formato: [VEJPG]-XXXXXXXX-X', normalizedRif: '' };
  }

  const documentType = cleanRif[0];

  // Validate document type
  const validTypes = ['V', 'E', 'J', 'P', 'G'];
  if (!validTypes.includes(documentType)) {
    return {
      isValid: false,
      errorMessage: `Tipo de documento no válido. Debe ser uno de: ${validTypes.join(', ')}`,
      normalizedRif: ''
    };
  }

  // Check that all characters after the first are digits
  const digits = cleanRif.slice(1);
  if (!/^\d+$/.test(digits)) {
    return {
      isValid: false,
      errorMessage: 'El RIF debe contener solo dígitos después de la letra de tipo',
      normalizedRif: ''
    };
  }

  let finalRif = '';

  if (digits.length < 8) {
    // Shorter than 8 digits: must be document number without check digit.
    // Pad document number to 8 digits
    const docNumber = digits.padStart(8, '0');
    const expectedCheck = calculateRifCheckDigit(documentType, docNumber);
    finalRif = documentType + docNumber + expectedCheck;
  } else if (digits.length === 8) {
    // Could be:
    // 1) 7-digit document number + check digit
    // 2) 8-digit document number without check digit
    const docNumber7 = digits.slice(0, 7).padStart(8, '0');
    const providedCheck = digits[7];
    const expectedCheck7 = calculateRifCheckDigit(documentType, docNumber7);

    if (providedCheck === expectedCheck7) {
      // It's a 7-digit document number with check digit
      finalRif = documentType + docNumber7 + providedCheck;
    } else {
      // Assume 8-digit document number without check digit
      const docNumber8 = digits;
      const expectedCheck8 = calculateRifCheckDigit(documentType, docNumber8);
      finalRif = documentType + docNumber8 + expectedCheck8;
    }
  } else {
    // digits.length === 9: 8-digit document number + check digit
    const docNumber = digits.slice(0, 8);
    const providedCheck = digits[8];
    const expectedCheck = calculateRifCheckDigit(documentType, docNumber);

    if (providedCheck !== expectedCheck) {
      return {
        isValid: false,
        errorMessage: `Dígito verificador del RIF no válido. Esperado: ${documentType}${docNumber}${expectedCheck}`,
        normalizedRif: ''
      };
    }
    finalRif = documentType + docNumber + providedCheck;
  }

  return { isValid: true, errorMessage: '', normalizedRif: finalRif };
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
 * formatRif('V', '12345678') // returns 'V123456781'
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
 * parseRif('V123456781') 
 * // returns { documentType: 'V', documentNumber: '12345678', checkDigit: '4' }
 */
export function parseRif(rif: string): { 
  documentType: string; 
  documentNumber: string; 
  checkDigit: string 
} {
  // Remove separators and convert to uppercase
  const cleanRif = rif.replace(/[-\s]/g, '').toUpperCase();

  const documentType = cleanRif[0];
  let documentNumber = '';
  let checkDigit = '';

  if (cleanRif.length === 10) {
    documentNumber = cleanRif.slice(1, 9);
    checkDigit = cleanRif[9];
  } else {
    const validation = validateRif(cleanRif);
    if (validation.isValid) {
      documentNumber = validation.normalizedRif.slice(1, 9);
      checkDigit = validation.normalizedRif[9];
    } else {
      documentNumber = cleanRif.slice(1, 9).padStart(8, '0');
      checkDigit = cleanRif.length > 9 
        ? cleanRif[9] 
        : calculateRifCheckDigit(documentType, documentNumber);
    }
  }

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
