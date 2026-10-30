import { describe, expect, it } from 'vitest'
import { findMatches } from '@/lib/findMatches'
import { normalizeText } from '@/lib/normalize'
import type { MatchRange, SearchOptions } from '@/types'

const defaults: SearchOptions = { caseSensitive: false, wholeWord: false }

/** Returns the original substrings covered by each match. */
function matchedTexts(text: string, matches: MatchRange[]): string[] {
  return matches.map(({ start, end }) => text.slice(start, end))
}

describe('findMatches', () => {
  it('returns no matches for an empty or whitespace-only query', () => {
    expect(findMatches('some text', '', defaults)).toEqual([])
    expect(findMatches('some text', '   ', defaults)).toEqual([])
  })

  it('returns no matches when the query is absent', () => {
    expect(findMatches('some text', 'missing', defaults)).toEqual([])
  })

  it('finds every occurrence with exact offsets', () => {
    expect(findMatches('cat dog cat bird cat', 'cat', defaults)).toEqual([
      { start: 0, end: 3 },
      { start: 8, end: 11 },
      { start: 17, end: 20 },
    ])
  })

  it('trims the query', () => {
    expect(findMatches('a cat here', '  cat ', defaults)).toEqual([{ start: 2, end: 5 }])
  })

  it('ignores case by default', () => {
    const text = 'React react REACT'
    expect(matchedTexts(text, findMatches(text, 'react', defaults))).toEqual([
      'React',
      'react',
      'REACT',
    ])
  })

  it('respects case when case-sensitive', () => {
    const text = 'React react REACT'
    const options = { ...defaults, caseSensitive: true }
    expect(findMatches(text, 'React', options)).toEqual([{ start: 0, end: 5 }])
  })

  it('matches inside words unless whole-word is on', () => {
    const text = 'react reactive overreact react.'
    expect(findMatches(text, 'react', defaults)).toHaveLength(4)

    const wholeWord = findMatches(text, 'react', { ...defaults, wholeWord: true })
    expect(wholeWord).toEqual([
      { start: 0, end: 5 },
      { start: 25, end: 30 },
    ])
  })

  it('treats underscores and digits as word characters for whole-word', () => {
    const options = { ...defaults, wholeWord: true }
    expect(findMatches('my_var var var2', 'var', options)).toEqual([{ start: 7, end: 10 }])
  })

  it('finds Persian text and unifies Arabic letters and digits', () => {
    const text = 'كتاب خوب و کتاب‌ها در سال ۱۴۰۳'
    expect(matchedTexts(text, findMatches(text, 'کتاب', defaults))).toEqual(['كتاب', 'کتاب'])
    expect(matchedTexts(text, findMatches(text, '1403', defaults))).toEqual(['۱۴۰۳'])
  })

  it('applies whole-word to Persian text', () => {
    const text = 'جستجو جستجوگر جستجو'
    const options = { ...defaults, wholeWord: true }
    expect(findMatches(text, 'جستجو', options)).toEqual([
      { start: 0, end: 5 },
      { start: 14, end: 19 },
    ])
  })

  it('matches multi-word phrases', () => {
    const text = 'a service worker and another Service Worker'
    expect(matchedTexts(text, findMatches(text, 'service worker', defaults))).toEqual([
      'service worker',
      'Service Worker',
    ])
  })

  it('matches at the very start and end of the text', () => {
    expect(findMatches('end to end', 'end', { ...defaults, wholeWord: true })).toEqual([
      { start: 0, end: 3 },
      { start: 7, end: 10 },
    ])
  })

  it('returns non-overlapping matches', () => {
    expect(findMatches('aaaa', 'aa', defaults)).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ])
    expect(findMatches('aaa', 'aa', defaults)).toEqual([{ start: 0, end: 2 }])
  })

  it('keeps offsets aligned to the original text around length-changing chars', () => {
    const text = 'İİ cat'
    expect(findMatches(text, 'cat', defaults)).toEqual([{ start: 3, end: 6 }])
  })

  it('uses a pre-normalized text when given one', () => {
    const text = 'Cat cat'
    const normalized = normalizeText(text, false)
    expect(findMatches(text, 'CAT', defaults, normalized)).toEqual(
      findMatches(text, 'CAT', defaults),
    )
  })

  it('does not treat regex characters in the query specially', () => {
    const text = 'a+b (a+b) [x] .* a.b'
    expect(matchedTexts(text, findMatches(text, 'a+b', defaults))).toEqual(['a+b', 'a+b'])
    expect(findMatches(text, '.*', defaults)).toEqual([{ start: 14, end: 16 }])
  })
})
