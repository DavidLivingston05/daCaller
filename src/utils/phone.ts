/**
 * Normalizes and validates an Indian phone number to ensure it has exactly 10 local digits.
 * Standardizes to the +91 XXXXX XXXXX format.
 */
export function validateAndFormatIndianPhone(rawPhone: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  // Strip all whitespace & common dividers for regex checking
  const cleaned = rawPhone.replace(/[\s-()]/g, "");

  // Regex to match optional Indian prefixes (+91, 91, 0) followed by exactly 10 digits starting with 6, 7, 8, or 9.
  const indianMobileRegex = /^(?:\+?91|0)?([6-9]\d{9})$/;
  const match = cleaned.match(indianMobileRegex);

  if (!match) {
    return {
      isValid: false,
      formatted: rawPhone,
      error: "Phone must be a valid 10-digit Indian number (starts with 6, 7, 8, or 9)."
    };
  }

  // Group 1 isolates the exact 10 digit local part
  const localPart = match[1];
  const formatted = `+91 ${localPart.slice(0, 5)} ${localPart.slice(5)}`;

  return {
    isValid: true,
    formatted
  };
}

/**
 * Extracts the 10-digit local part of an Indian phone number.
 * Useful for duplicate checks regardless of how they are written (+91, 0, or raw 10 digits).
 */
export function getIndianPhoneCoreDigits(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  // Return the last 10 digits as the unique local identifier
  return cleaned.slice(-10);
}

