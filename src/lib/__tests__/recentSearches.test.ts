import { describe, expect, it } from 'vitest'
import { addRecentSearch, parseRecentSearches } from '@/lib/recentSearches'

describe('addRecentSearch', () => {
  it('adds the newest search first', () => {
    expect(addRecentSearch(['b', 'a'], 'c')).toEqual(['c', 'b', 'a'])
  })

  it('trims the query and ignores empty ones', () => {
    const recent = ['a']
    expect(addRecentSearch(recent, '  b  ')).toEqual(['b', 'a'])
    expect(addRecentSearch(recent, '   ')).toBe(recent)
  })

  it('moves an existing search to the front instead of duplicating it', () => {
    expect(addRecentSearch(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
  })

  it('returns the same list when the search is already the newest', () => {
    const recent = ['a', 'b']
    expect(addRecentSearch(recent, 'a')).toBe(recent)
  })

  it('keeps at most five entries', () => {
    expect(addRecentSearch(['5', '4', '3', '2', '1'], '6')).toEqual(['6', '5', '4', '3', '2'])
  })
})

describe('parseRecentSearches', () => {
  it('reads a stored list', () => {
    expect(parseRecentSearches('["react","جستجو"]')).toEqual(['react', 'جستجو'])
  })

  it.each([
    ['missing', null],
    ['invalid JSON', '{oops'],
    ['not an array', '{"a":1}'],
    ['non-string entries', '["a", 2]'],
  ])('returns an empty list for %s data', (_, raw) => {
    expect(parseRecentSearches(raw)).toEqual([])
  })

  it('caps an oversized stored list', () => {
    expect(parseRecentSearches(JSON.stringify(['1', '2', '3', '4', '5', '6']))).toHaveLength(5)
  })
})
