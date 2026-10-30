import { normalizeText } from '@/lib/normalize'
import { tokenize } from '@/lib/tokenize'

/**
 * Word index used for autocomplete. Keys are case-insensitively normalized
 * words; suggestions ignore the case-sensitive search option on purpose.
 */
export interface SearchIndex {
  /** Unique normalized words, sorted by UTF-16 code unit (default `sort()` order). */
  words: string[]
  /** Occurrences per normalized word. */
  counts: Map<string, number>
  /** Most frequent original spelling per normalized word, for display. */
  display: Map<string, string>
}

/** Builds the index once per text. Do not call this per keystroke. */
export function buildIndex(text: string): SearchIndex {
  // Count exact spellings first: texts repeat words heavily, so normalizing
  // each distinct spelling once is far cheaper than normalizing every token.
  const spellingCounts = new Map<string, number>()
  for (const { word } of tokenize(text)) {
    spellingCounts.set(word, (spellingCounts.get(word) ?? 0) + 1)
  }

  const counts = new Map<string, number>()
  const display = new Map<string, string>()
  const displayCount = new Map<string, number>()

  // Map iteration follows first-seen order, so on a tie the first seen spelling wins.
  for (const [spelling, count] of spellingCounts) {
    const key = normalizeText(spelling, false)
    counts.set(key, (counts.get(key) ?? 0) + count)
    if (count > (displayCount.get(key) ?? 0)) {
      display.set(key, spelling)
      displayCount.set(key, count)
    }
  }

  return { words: [...counts.keys()].sort(), counts, display }
}
