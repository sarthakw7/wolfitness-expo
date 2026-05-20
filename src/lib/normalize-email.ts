// Normalize user-entered email text from mobile keyboards/autofill.
// We defensively strip common invisible characters and accidental wrapping quotes.
export function normalizeEmail(input: string): string {
  const trimmed = (input ?? "").trim();
  // Remove zero-width and directionality characters that sometimes appear from copy/paste.
  const withoutInvisibles = trimmed.replace(/[\u200B-\u200D\uFEFF\u2060\u200E\u200F]/g, "");
  // Strip wrapping single/double quotes.
  const withoutQuotes = withoutInvisibles.replace(/^['"]+|['"]+$/g, "");
  return withoutQuotes.trim().toLowerCase();
}

