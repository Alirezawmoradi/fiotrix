import { normalizeText } from '@/lib/normalize'
import type { SearchIndex } from '@/lib/searchIndex'
import { trailingWord } from '@/lib/tokenize'
import type { Suggestion } from '@/types'

/*
 * All comparisons here use plain UTF-16 code-unit order (`<`), the same order
 * as the default `Array#sort` used to build the index. `localeCompare` would
 * be slower and its order is not guaranteed to keep words that share a prefix
 * next to each other, which the prefix walk below relies on.
 */

/**
 * Returns up to `limit` words starting with `prefix`, ranked by occurrence
 * count (desc), then length (shorter first), then alphabetically.
 *
 * Binary search finds the first candidate in O(log n); the walk then visits
 * every word sharing the prefix (they are contiguous in sorted order), since
 * ranking by count needs all of them.
 */
export function suggest(index: SearchIndex, prefix: string, limit = 8): Suggestion[] {
  const needle = normalizeText(prefix.trim(), false)
  if (needle === '') return []

  const { words, counts, display } = index
  const candidates: string[] = []

  for (let i = lowerBound(words, needle); i < words.length; i++) {
    const word = words[i]
    if (word === undefined || !word.startsWith(needle)) break
    candidates.push(word)
  }

  const countOf = (word: string): number => counts.get(word) ?? 0

  // Candidates are collected in alphabetical order and `Array#sort` is stable,
  // so remaining ties stay alphabetical without an explicit comparison.
  return candidates
    .sort((a, b) => countOf(b) - countOf(a) || a.length - b.length)
    .slice(0, limit)
    .map((word) => ({ word: display.get(word) ?? word, count: countOf(word) }))
}

/** Index of the first element `>= target` in an ascending array. */
function lowerBound(sorted: readonly string[], target: string): number {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const mid = (low + high) >>> 1
    if ((sorted[mid] ?? '') < target) low = mid + 1
    else high = mid
  }
  return low
}

/**
 * The word being typed at the end of the query (the autocomplete prefix).
 * `word` is empty when the query ends with a space or punctuation.
 */
export function getLastWord(query: string): { word: string; start: number } {
  return trailingWord(query) ?? { word: '', start: query.length }
}

/** Replaces the word being typed with `replacement`, keeping the rest of the query. */
export function replaceLastWord(query: string, replacement: string): string {
  return query.slice(0, getLastWord(query).start) + replacement
}
