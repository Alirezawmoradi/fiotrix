import { describe, expect, it } from 'vitest'
import { findMatches } from '@/lib/findMatches'
import { groupMatchesByParagraph, splitParagraphs } from '@/lib/paragraphs'

describe('splitParagraphs', () => {
  it('splits on newlines and records offsets', () => {
    expect(splitParagraphs('ab\ncde\n\nf')).toEqual([
      { text: 'ab', start: 0 },
      { text: 'cde', start: 3 },
      { text: '', start: 7 },
      { text: 'f', start: 8 },
    ])
  })

  it('returns one empty paragraph for empty text', () => {
    expect(splitParagraphs('')).toEqual([{ text: '', start: 0 }])
  })
})

describe('groupMatchesByParagraph', () => {
  it('assigns each match to the paragraph it is in', () => {
    const text = 'cat dog\nno pets\ncat cat'
    const paragraphs = splitParagraphs(text)
    const matches = findMatches(text, 'cat', { caseSensitive: false, wholeWord: false })

    expect(groupMatchesByParagraph(paragraphs, matches)).toEqual([
      { first: 0, end: 1 },
      { first: 1, end: 1 },
      { first: 1, end: 3 },
    ])
  })

  it('handles a match at the very end of a paragraph', () => {
    const text = 'a cat\ncat'
    const paragraphs = splitParagraphs(text)
    const matches = findMatches(text, 'cat', { caseSensitive: false, wholeWord: false })

    expect(groupMatchesByParagraph(paragraphs, matches)).toEqual([
      { first: 0, end: 1 },
      { first: 1, end: 2 },
    ])
  })

  it('returns empty spans when there are no matches', () => {
    expect(groupMatchesByParagraph(splitParagraphs('a\nb'), [])).toEqual([
      { first: 0, end: 0 },
      { first: 0, end: 0 },
    ])
  })
})
