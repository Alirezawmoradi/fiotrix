import type { MatchRange, Segment } from '@/types'

/**
 * Splits text into alternating plain-text and match segments for rendering.
 * `matches` must be sorted and non-overlapping (as returned by `findMatches`).
 * Joining all segment texts reproduces `text` exactly.
 *
 * To render one paragraph of a larger text, pass the paragraph's offset as
 * `offset` (matches keep their offsets in the full text) and the global index
 * of its first match as `firstMatchIndex`, so each segment gets its global
 * `matchIndex`.
 */
export function buildSegments(
  text: string,
  matches: readonly MatchRange[],
  offset = 0,
  firstMatchIndex = 0,
): Segment[] {
  const segments: Segment[] = []
  let cursor = 0

  matches.forEach((match, i) => {
    const start = match.start - offset
    const end = match.end - offset
    if (start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, start) })
    segments.push({ kind: 'match', text: text.slice(start, end), matchIndex: firstMatchIndex + i })
    cursor = end
  })

  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) })

  return segments
}
