"""Venezuelan RIF (Registro de Información Fiscal) validation utilities.

The RIF validation uses modulo 11 algorithm with specific base values
for each document type and weighting multipliers.
"""


def normalize_rif(rif: str) -> str:
    """Normalize a RIF to 10-character format without separators.

    Args:
        rif: The RIF to normalize (any format: V-12345678-9, V123456789, etc.)

    Returns:
        Normalized RIF: V123456789 (10 characters, uppercase, no separators)

    Examples:
        >>> normalize_rif('V123456781')
        'V123456781'
        >>> normalize_rif('V123456781')
        'V123456781'
        >>> normalize_rif('V123456781')
        'V123456781'
    """
    # Remove separators and convert to uppercase
    return rif.replace("-", "").replace(" ", "").upper()


def calculate_rif_check_digit(document_type: str, document_number: str) -> str:
    """Calculate the check digit for a Venezuelan RIF.

    Args:
        document_type: Type of document (V, E, J, P, G)
        document_number: Document number (will be padded to 8 digits)

    Returns:
        The check digit (0-9)

    Examples:
        >>> calculate_rif_check_digit('V', '12345678')
        '4'
        >>> calculate_rif_check_digit('V', '9444510')
        '4'
    """
    # Base values for each document type
    base_values = {
        "V": 4,  # Venezuelan
        "E": 8,  # Extranjero (Foreigner)
        "J": 12,  # Jurídico (Legal Entity)
        "P": 16,  # Pasaporte (Passport)
        "G": 20,  # Gobierno (Government)
    }

    # Multipliers for each position (index 0 is for base value, unused)
    multipliers = [0, 3, 2, 7, 6, 5, 4, 3, 2]

    # Normalize document type to uppercase
    doc_type = document_type.upper()

    # Pad document number to 8 digits
    padded_number = document_number.zfill(8)

    # Build the RIF string (type + padded number, max 9 characters)
    rif_base = f"{doc_type}{padded_number}"[:9]

    # Calculate the sum
    total = 0
    for i in range(len(rif_base)):
        if i == 0:
            # First position: add base value for document type
            total += base_values.get(doc_type, 0)
        else:
            # Remaining positions: multiply digit by corresponding multiplier
            digit = int(rif_base[i])
            total += digit * multipliers[i]

    # Calculate check digit: 11 - (sum % 11), if >= 10 then 0
    remainder = total % 11
    check_digit = 11 - remainder
    if check_digit >= 10:
        check_digit = 0

    return str(check_digit)


def validate_rif(rif: str) -> tuple[bool, str, str]:
    """Validate a Venezuelan RIF format and check digit.

    Args:
        rif: The RIF to validate (formats: V-12345678-9, V123456789, etc.)

    Returns:
        Tuple of (is_valid, error_message, normalized_rif)
    """
    if not rif:
        return False, "RIF is required", ""

    # Remove common separators and convert to uppercase
    clean_rif = normalize_rif(rif)

    # Check basic format: 1 letter + at least 1 digit, up to 9 digits (max length 10)
    if len(clean_rif) < 2 or len(clean_rif) > 10:
        return False, "RIF must have format: [VEJPG]-XXXXXXXX-X", ""

    document_type = clean_rif[0]

    # Validate document type
    valid_types = ["V", "E", "J", "P", "G"]
    if document_type not in valid_types:
        return False, f"Invalid document type: {', '.join(valid_types)}", ""

    # Check that all characters after the first are digits
    digits = clean_rif[1:]
    if not digits.isdigit():
        return False, "RIF must contain only digits after the type letter", ""

    # Process and normalize RIF
    if len(digits) < 8:
        # Shorter than 8 digits: must be document number without check digit.
        # Pad document number to 8 digits
        doc_number = digits.zfill(8)
        expected_check = calculate_rif_check_digit(document_type, doc_number)
        final_rif = f"{document_type}{doc_number}{expected_check}"
    elif len(digits) == 8:
        # Could be:
        # 1) 7-digit document number + check digit
        # 2) 8-digit document number without check digit
        doc_number7 = digits[0:7].zfill(8)
        provided_check = digits[7]
        expected_check7 = calculate_rif_check_digit(document_type, doc_number7)

        if provided_check == expected_check7:
            # It's a 7-digit document number with check digit
            final_rif = f"{document_type}{doc_number7}{provided_check}"
        else:
            # Assume 8-digit document number without check digit
            doc_number8 = digits
            expected_check8 = calculate_rif_check_digit(document_type, doc_number8)
            final_rif = f"{document_type}{doc_number8}{expected_check8}"
    else:
        # len(digits) == 9: 8-digit document number + check digit
        doc_number = digits[0:8]
        provided_check = digits[8]
        expected_check = calculate_rif_check_digit(document_type, doc_number)

        if provided_check != expected_check:
            return False, f"Invalid RIF check digit. Expected: {document_type}{doc_number}{expected_check}", ""
        final_rif = f"{document_type}{doc_number}{provided_check}"

    return True, "", final_rif


def format_rif(document_type: str, document_number: str, check_digit: str | None = None) -> str:
    """Format a RIF in standard format with separators.

    Args:
        document_type: Type of document (V, E, J, P, G)
        document_number: Document number
        check_digit: Optional check digit

    Returns:
        Formatted RIF: V-XXXXXXXX-X

    Examples:
        >>> format_rif('V', '12345678')
        'V123456781'
        >>> format_rif('V', '9444510')
        'V-09444510-4'
    """
    # Normalize document type to uppercase
    doc_type = document_type.upper()

    # Pad document number to 8 digits
    padded_number = document_number.zfill(8)

    # Calculate check digit if not provided
    if check_digit is None:
        check_digit = calculate_rif_check_digit(doc_type, document_number)

    return f"{doc_type}-{padded_number}-{check_digit}"


def parse_rif(rif: str) -> dict[str, str]:
    """Parse a RIF string into its components.

    Args:
        rif: The RIF to parse (any format)

    Returns:
        Dictionary with document_type, document_number, and check_digit

    Examples:
        >>> parse_rif('V123456781')
        {'document_type': 'V', 'document_number': '12345678', 'check_digit': '4'}
    """
    # Remove separators and convert to uppercase
    clean_rif = rif.replace("-", "").replace(" ", "").upper()

    document_type = clean_rif[0]
    document_number = ""
    check_digit = ""

    if len(clean_rif) == 10:
        document_number = clean_rif[1:9]
        check_digit = clean_rif[9]
    else:
        is_valid, _, normalized = validate_rif(clean_rif)
        if is_valid:
            document_number = normalized[1:9]
            check_digit = normalized[9]
        else:
            document_number = clean_rif[1:9].zfill(8)
            check_digit = (
                clean_rif[9]
                if len(clean_rif) > 9
                else calculate_rif_check_digit(document_type, document_number)
            )

    return {
        "document_type": document_type,
        "document_number": document_number,
        "check_digit": check_digit,
    }
