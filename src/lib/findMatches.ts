import { normalizeText } from '@/lib/normalize'
import { isWordChar } from '@/lib/tokenize'
import type { MatchRange, SearchOptions } from '@/types'

/**
 * Finds every non-overlapping occurrence of `query` in `text`.
 *
 * Uses a plain `indexOf` scan over the normalized text instead of building a
 * RegExp from user input: it is O(n), needs no escaping and cannot be abused
 * for catastrophic backtracking (ReDoS). Because normalization is
 * length-preserving, offsets in the normalized text are valid in `text`.
 *
 * @param normalizedText `normalizeText(text, options.caseSensitive)`. Pass it in
 *   when it is already cached so only the query is normalized per call.
 */
export function findMatches(
  text: string,
  query: string,
  options: SearchOptions,
  normalizedText: string = normalizeText(text, options.caseSensitive),
): MatchRange[] {
  const needle = normalizeText(query.trim(), options.caseSensitive)
  if (needle === '') return []

  const matches: MatchRange[] = []
  let start = normalizedText.indexOf(needle)

  while (start !== -1) {
    const end = start + needle.length

    if (options.wholeWord && !isWholeWord(text, start, end)) {
      // Not a whole word here, but a match may still begin inside this range.
      start = normalizedText.indexOf(needle, start + 1)
      continue
    }

    matches.push({ start, end })
    start = normalizedText.indexOf(needle, end)
  }

  return matches
}

/** True when the range is not directly preceded or followed by a word character. */
function isWholeWord(text: string, start: number, end: number): boolean {
  return !isWordChar(text.charAt(start - 1)) && !isWordChar(text.charAt(end))
}
