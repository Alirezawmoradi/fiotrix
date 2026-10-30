/**
 * Characters that make up a word: Unicode letters, combining marks (so Persian
 * diacritics and decomposed accents stay attached to their letter), numbers and
 * underscore. Everything else, including the Persian zero-width non-joiner
 * (U+200C), separates words.
 */
const WORD_CHAR_CLASS = '[\\p{L}\\p{M}\\p{N}_]'

const WORD_CHAR = new RegExp(WORD_CHAR_CLASS, 'u')
const WORD = new RegExp(`${WORD_CHAR_CLASS}+`, 'gu')
const TRAILING_WORD = new RegExp(`${WORD_CHAR_CLASS}+$`, 'u')

export interface Token {
  word: string
  /** Offset of the word's first character in the text. */
  start: number
}

export function isWordChar(ch: string): boolean {
  return WORD_CHAR.test(ch)
}

/** Splits text into words, keeping each word's offset. */
export function tokenize(text: string): Token[] {
  return Array.from(text.matchAll(WORD), (match) => ({ word: match[0], start: match.index }))
}

/** Returns the word at the very end of the text, or `null` if the text ends with a separator. */
export function trailingWord(text: string): Token | null {
  const match = TRAILING_WORD.exec(text)
  return match ? { word: match[0], start: match.index } : null
}
