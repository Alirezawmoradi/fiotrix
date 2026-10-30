/*
 * Search normalization.
 *
 * CRITICAL: normalization is LENGTH-PRESERVING. Every UTF-16 code unit of the
 * input maps to exactly one code unit of the output, so `normalizeText(text)`
 * has the same length as `text` and every offset in it points at the same
 * character in the original. Matches found in the normalized text can therefore
 * be used directly to highlight the original text, with no offset mapping.
 *
 * To keep that guarantee we:
 * - never remove characters (no diacritic stripping), and
 * - keep the original character when its lowercase form has a different
 *   length (e.g. 'İ'.toLowerCase() is two code units).
 */

const PERSIAN_DIGIT_ZERO = 0x06f0 // '۰'
const ARABIC_DIGIT_ZERO = 0x0660 // '٠'

/** One-to-one replacements that make Arabic-script variants searchable as one. */
const CHAR_MAP: ReadonlyMap<string, string> = new Map([
  ['ي', 'ی'], // Arabic yeh -> Persian yeh
  ['ك', 'ک'], // Arabic kaf -> Persian keheh
  ...Array.from({ length: 10 }, (_, digit): [string, string] => [
    String.fromCharCode(PERSIAN_DIGIT_ZERO + digit),
    String(digit),
  ]),
  ...Array.from({ length: 10 }, (_, digit): [string, string] => [
    String.fromCharCode(ARABIC_DIGIT_ZERO + digit),
    String(digit),
  ]),
])

/** Normalizes a single UTF-16 code unit. Always returns exactly one code unit. */
export function normalizeChar(ch: string, caseSensitive: boolean): string {
  const mapped = CHAR_MAP.get(ch)
  if (mapped !== undefined) return mapped
  if (caseSensitive) return ch

  const lower = ch.toLowerCase()
  return lower.length === 1 ? lower : ch
}

/** Normalizes text for searching. The result always has the same length as the input. */
export function normalizeText(text: string, caseSensitive: boolean): string {
  // Texts use a small alphabet, so caching per character avoids most
  // `toLowerCase` calls (~40% faster on large texts).
  const cache = new Map<string, string>()
  let result = ''

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i)
    let normalized = cache.get(ch)
    if (normalized === undefined) {
      normalized = normalizeChar(ch, caseSensitive)
      cache.set(ch, normalized)
    }
    result += normalized
  }

  return result
}
