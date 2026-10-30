import type { MatchRange, Segment } from '@/types'

/**
 * Splits text into alternating plain-text and match segments for rendering.
 * `matches` must be sorted and non-overlapping (as returned by `findMatches`);
 * each match segment carries its index in `matches`. Joining all segment
 * texts reproduces `text` exactly.
 */
export function buildSegments(text: string, matches: readonly MatchRange[]): Segment[] {
  const segments: Segment[] = []
  let cursor = 0

  matches.forEach(({ start, end }, matchIndex) => {
    if (start > cursor) segments.push({ kind: 'text', text: text.slice(cursor, start) })
    segments.push({ kind: 'match', text: text.slice(start, end), matchIndex })
    cursor = end
  })

  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) })

  return segments
}
