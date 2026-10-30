import { describe, expect, it } from 'vitest'
import { findMatches } from '@/lib/findMatches'
import { buildSegments } from '@/lib/segments'
import type { Segment } from '@/types'

function join(segments: Segment[]): string {
  return segments.map((segment) => segment.text).join('')
}

describe('buildSegments', () => {
  it('returns a single text segment when there are no matches', () => {
    expect(buildSegments('plain text', [])).toEqual([{ kind: 'text', text: 'plain text' }])
  })

  it('returns no segments for empty text', () => {
    expect(buildSegments('', [])).toEqual([])
  })

  it('alternates text and match segments with match indexes', () => {
    expect(
      buildSegments('a cat and a cat', [
        { start: 2, end: 5 },
        { start: 12, end: 15 },
      ]),
    ).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'match', text: 'cat', matchIndex: 0 },
      { kind: 'text', text: ' and a ' },
      { kind: 'match', text: 'cat', matchIndex: 1 },
    ])
  })

  it('handles adjacent matches and matches at both ends', () => {
    expect(
      buildSegments('aaaa', [
        { start: 0, end: 2 },
        { start: 2, end: 4 },
      ]),
    ).toEqual([
      { kind: 'match', text: 'aa', matchIndex: 0 },
      { kind: 'match', text: 'aa', matchIndex: 1 },
    ])
  })

  it('renders one paragraph using full-text offsets and global match indexes', () => {
    // Paragraph "a cat" starts at offset 10 and its match is the 4th overall.
    expect(buildSegments('a cat', [{ start: 12, end: 15 }], 10, 3)).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'match', text: 'cat', matchIndex: 3 },
    ])
  })

  it('reconstructs the original text exactly', () => {
    const text = 'React and react — كتاب و کتاب ۱۴۰۳ İİ react.'
    for (const query of ['react', 'کتاب', '1403', 'a', 'zzz']) {
      const matches = findMatches(text, query, { caseSensitive: false, wholeWord: false })
      expect(join(buildSegments(text, matches))).toBe(text)
    }
  })
})
