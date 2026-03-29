"""Venezuelan phone number validation and normalization utilities.

Handles Venezuelan phone numbers in various formats and normalizes them
to international format: +58XXXXXXXXXX (12 characters).

Supported formats:
- Mobile: 0412-1234567, 0412 1234567, +58 412 1234567, 412 1234567
- Landline: 0212-1234567, 0212 1234567, +58 212 1234567, 212 1234567
"""

import re


def normalize_phone(phone: str) -> str:
    """Normalize a Venezuelan phone number to international format.

    Args:
        phone: The phone number to normalize (various formats accepted)

    Returns:
        Normalized phone: +58XXXXXXXXXX (12 characters)

    Examples:
        >>> normalize_phone('0412-1234567')
        '+584121234567'
        >>> normalize_phone('+58 412 1234567')
        '+584121234567'
        >>> normalize_phone('412 1234567')
        '+584121234567'
        >>> normalize_phone('0212-1234567')
        '+582121234567'
    """
    # Remove all non-digit characters except +
    clean_phone = re.sub(r"[^\d+]", "", phone)

    # Remove leading + if present (we'll add it back)
    if clean_phone.startswith("+"):
        clean_phone = clean_phone[1:]

    # Remove leading 0 if present (Venezuelan trunk prefix)
    if clean_phone.startswith("0"):
        clean_phone = clean_phone[1:]

    # Remove country code 58 if present at the start (we'll add it back)
    if clean_phone.startswith("58"):
        clean_phone = clean_phone[2:]

    # Now clean_phone should be just the area code + number (10 digits)
    # Add country code back
    return f"+58{clean_phone}"


def validate_phone(phone: str) -> tuple[bool, str, str]:
    """Validate a Venezuelan phone number format.

    Args:
        phone: The phone number to validate (various formats accepted)

    Returns:
        Tuple of (is_valid, error_message, normalized_phone)

    Examples:
        >>> validate_phone('0412-1234567')
        (True, '', '+584121234567')
        >>> validate_phone('invalid')
        (False, 'Invalid phone number format', '')
    """
    if not phone or phone.strip() == "":
        return False, "Phone number is required", ""

    # Normalize the phone number
    normalized = normalize_phone(phone)

    # Remove + for validation
    digits_only = normalized[1:]  # Remove the +

    # Check if it starts with 58 (country code)
    if not digits_only.startswith("58"):
        return False, "Phone number must be Venezuelan (+58)", ""

    # Get the local part (without country code)
    local_part = digits_only[2:]

    # Venezuelan phone numbers are 10 digits (area code + number)
    # Mobile: 4XX-XXXXXXX (starts with 4)
    # Landline: 2XX-XXXXXXX (starts with 2)
    if len(local_part) != 10:
        return False, "Phone number must have 10 digits after country code", ""

    # Check if it's a valid Venezuelan number (starts with 2 or 4)
    if not local_part.startswith(("2", "4")):
        return False, "Invalid phone number", ""

    # Additional check for mobile numbers (412, 414, 416, 424, 426, etc.)
    if local_part.startswith("4"):
        valid_mobile_prefixes = [
            "412",
            "414",
            "416",
            "424",
            "426",
            "413",
            "415",
            "417",
            "418",
            "419",
        ]
        if local_part[:3] not in valid_mobile_prefixes:
            return (
                False,
                f"Invalid mobile prefix. Valid prefixes: {', '.join(valid_mobile_prefixes)}",
                "",
            )

    return True, "", normalized
