import { describe, expect, it } from 'vitest'
import { buildIndex } from '@/lib/searchIndex'
import { getLastWord, replaceLastWord, suggest } from '@/lib/suggest'

const index = buildIndex(
  [
    'apple banana cache cached cache caching cat',
    'react React reactive reactive reactive react render',
    'service serve server zebra',
    'جستجو جستجو جستجوگر جهان کتاب',
  ].join('\n'),
)

describe('suggest', () => {
  it('returns no suggestions for an empty prefix', () => {
    expect(suggest(index, '')).toEqual([])
  })

  it('returns no suggestions when nothing starts with the prefix', () => {
    expect(suggest(index, 'xyz')).toEqual([])
  })

  it('finds words for a prefix in the middle of the sorted list', () => {
    expect(suggest(index, 'ser').map((s) => s.word)).toEqual(['serve', 'server', 'service'])
  })

  it('ranks by count, then shorter, then alphabetical', () => {
    expect(suggest(index, 'ca')).toEqual([
      { word: 'cache', count: 2 },
      { word: 'cat', count: 1 },
      { word: 'cached', count: 1 },
      { word: 'caching', count: 1 },
    ])
  })

  it('breaks count and length ties alphabetically', () => {
    const tied = buildIndex('bat bag bad')
    expect(suggest(tied, 'ba').map((s) => s.word)).toEqual(['bad', 'bag', 'bat'])
  })

  it('includes an exact match and shows the display form', () => {
    expect(suggest(index, 'react')).toEqual([
      { word: 'react', count: 3 },
      { word: 'reactive', count: 3 },
    ])
  })

  it('is case-insensitive', () => {
    expect(suggest(index, 'REA').map((s) => s.word)).toEqual(['react', 'reactive'])
  })

  it('respects the limit', () => {
    expect(suggest(index, 'c', 2)).toHaveLength(2)
  })

  it('handles the last word in the index', () => {
    expect(suggest(index, 'zeb').map((s) => s.word)).toEqual(['zebra'])
  })

  it('works with Persian prefixes and Arabic letter variants', () => {
    expect(suggest(index, 'جست')).toEqual([
      { word: 'جستجو', count: 2 },
      { word: 'جستجوگر', count: 1 },
    ])
    expect(suggest(index, 'ك').map((s) => s.word)).toEqual(['کتاب'])
  })
})

describe('getLastWord', () => {
  it('returns the trailing word and its start offset', () => {
    expect(getLastWord('react ho')).toEqual({ word: 'ho', start: 6 })
  })

  it('returns an empty word when the query ends with a separator', () => {
    expect(getLastWord('react ')).toEqual({ word: '', start: 6 })
    expect(getLastWord('')).toEqual({ word: '', start: 0 })
  })

  it('handles Persian', () => {
    expect(getLastWord('برنامه جست')).toEqual({ word: 'جست', start: 7 })
  })
})

describe('replaceLastWord', () => {
  it('replaces only the last word', () => {
    expect(replaceLastWord('react ho', 'hooks')).toBe('react hooks')
  })

  it('appends when the query ends with a separator', () => {
    expect(replaceLastWord('react ', 'hooks')).toBe('react hooks')
  })
})
