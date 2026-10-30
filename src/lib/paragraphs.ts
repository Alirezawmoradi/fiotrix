import type { MatchRange } from '@/types'

export interface Paragraph {
  text: string
  /** Offset of the paragraph's first character in the full text. */
  start: number
}

/** Half-open range `[first, end)` of indexes into the matches array. */
export interface MatchSpan {
  first: number
  end: number
}

/** Splits text into paragraphs on `\n`, keeping each paragraph's offset. */
export function splitParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  let start = 0

  for (const line of text.split('\n')) {
    paragraphs.push({ text: line, start })
    start += line.length + 1
  }

  return paragraphs
}

/**
 * Assigns each match to the paragraph it starts in, in one linear pass.
 * Both inputs must be sorted by offset (as produced by `splitParagraphs` and
 * `findMatches`). Queries never contain newlines, so matches do not cross
 * paragraph boundaries.
 */
export function groupMatchesByParagraph(
  paragraphs: readonly Paragraph[],
  matches: readonly MatchRange[],
): MatchSpan[] {
  let next = 0

  return paragraphs.map(({ text, start }) => {
    const first = next
    const paragraphEnd = start + text.length
    while (next < matches.length && (matches[next]?.start ?? Infinity) <= paragraphEnd) next++
    return { first, end: next }
  })
}
