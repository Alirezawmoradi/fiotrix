import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useSearch } from '@/hooks/useSearch'

const TEXT = 'React and react. Reactive React!'

describe('useSearch', () => {
  it('starts with no query and no matches', () => {
    const { result } = renderHook(() => useSearch(TEXT))
    expect(result.current.query).toBe('')
    expect(result.current.total).toBe(0)
    expect(result.current.isStale).toBe(false)
  })

  it('finds matches for the query', () => {
    const { result } = renderHook(() => useSearch(TEXT))
    act(() => result.current.setQuery('react'))

    expect(result.current.searchedQuery).toBe('react')
    expect(result.current.total).toBe(4)
    expect(result.current.matches[0]).toEqual({ start: 0, end: 5 })
  })

  it('applies search options', () => {
    const { result } = renderHook(() => useSearch(TEXT))
    act(() => result.current.setQuery('React'))
    act(() => result.current.setOptions({ caseSensitive: true, wholeWord: true }))

    expect(result.current.total).toBe(2)
  })

  it('resets the active match when the query changes', () => {
    const { result } = renderHook(() => useSearch(TEXT))
    act(() => result.current.setQuery('react'))
    act(() => result.current.setActiveIndex(2))
    expect(result.current.activeIndex).toBe(2)

    act(() => result.current.setQuery('reac'))
    expect(result.current.activeIndex).toBe(0)
  })

  it('resets the active match when options change', () => {
    const { result } = renderHook(() => useSearch(TEXT))
    act(() => result.current.setQuery('react'))
    act(() => result.current.setActiveIndex(3))

    act(() => result.current.setOptions({ caseSensitive: false, wholeWord: true }))
    expect(result.current.activeIndex).toBe(0)
  })

  it('resets the active match when the text changes', () => {
    const { result, rerender } = renderHook(({ text }) => useSearch(text), {
      initialProps: { text: TEXT },
    })
    act(() => result.current.setQuery('react'))
    act(() => result.current.setActiveIndex(1))

    rerender({ text: 'react react' })
    expect(result.current.total).toBe(2)
    expect(result.current.activeIndex).toBe(0)
  })

  it('changes the search key for a new query or new options', () => {
    const { result } = renderHook(() => useSearch(TEXT))
    act(() => result.current.setQuery('react'))
    const byQuery = result.current.searchKey

    act(() => result.current.setActiveIndex(1))
    expect(result.current.searchKey).toBe(byQuery)

    act(() => result.current.setOptions({ caseSensitive: true, wholeWord: false }))
    expect(result.current.searchKey).not.toBe(byQuery)
  })
})
