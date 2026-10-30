import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useRecentSearches } from '@/hooks/useRecentSearches'

afterEach(() => {
  window.localStorage.clear()
})

describe('useRecentSearches', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useRecentSearches())
    expect(result.current.recent).toEqual([])
  })

  it('remembers searches newest first, across launches', () => {
    const first = renderHook(() => useRecentSearches())
    act(() => first.result.current.addRecent('react'))
    act(() => first.result.current.addRecent('جستجو'))
    expect(first.result.current.recent).toEqual(['جستجو', 'react'])

    const second = renderHook(() => useRecentSearches())
    expect(second.result.current.recent).toEqual(['جستجو', 'react'])
  })

  it('ignores corrupted stored data', () => {
    window.localStorage.setItem('smart-search-reader:recent-searches', '{not json')
    const { result } = renderHook(() => useRecentSearches())
    expect(result.current.recent).toEqual([])
  })
})
