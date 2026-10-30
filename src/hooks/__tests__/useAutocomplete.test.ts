import { act, renderHook } from '@testing-library/react'
import type { FocusEvent, KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { optionId, useAutocomplete } from '@/hooks/useAutocomplete'

const TEXT = 'react React hooks hook hooks render reducer جستجو جستجوگر'

function setup(initialQuery: string, recentSearches: string[] = []) {
  const setQuery = vi.fn()
  const onSelect = vi.fn()
  const hook = renderHook(
    ({ query }) => useAutocomplete({ text: TEXT, query, setQuery, recentSearches, onSelect }),
    { initialProps: { query: initialQuery } },
  )
  const focus = (): void =>
    act(() => hook.result.current.inputProps.onFocus?.({} as FocusEvent<HTMLInputElement>))
  return { ...hook, setQuery, onSelect, focus }
}

/** Sends a key to the hook and returns whether it handled it. */
function press(
  result: { current: ReturnType<typeof useAutocomplete> },
  key: string,
  isComposing = false,
): { handled: boolean; event: KeyboardEvent<HTMLInputElement> } {
  const event = {
    key,
    nativeEvent: { isComposing },
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLInputElement>
  let handled = false
  act(() => {
    handled = result.current.handleKeyDown(event)
  })
  return { handled, event }
}

describe('useAutocomplete', () => {
  it('suggests completions for the last word, with counts', () => {
    const { result } = setup('state ho')
    expect(result.current.items).toEqual([
      { kind: 'suggestion', word: 'hooks', count: 2 },
      { kind: 'suggestion', word: 'hook', count: 1 },
    ])
    expect(result.current.prefixLength).toBe(2)
  })

  it('suggests Persian words', () => {
    const { result } = setup('جست')
    expect(result.current.items.map((item) => item.kind === 'suggestion' && item.word)).toEqual([
      'جستجو',
      'جستجوگر',
    ])
  })

  it('stays closed until the input is focused', () => {
    const { result, focus } = setup('ho')
    expect(result.current.isOpen).toBe(false)

    focus()
    expect(result.current.isOpen).toBe(true)
    expect(result.current.inputProps['aria-expanded']).toBe(true)
  })

  it('closes on blur', () => {
    const { result, focus } = setup('ho')
    focus()
    act(() => result.current.inputProps.onBlur?.({} as FocusEvent<HTMLInputElement>))
    expect(result.current.isOpen).toBe(false)
  })

  it('shows recent searches while the input is empty', () => {
    const { result, focus } = setup('', ['react hooks', 'جستجو'])
    focus()
    expect(result.current.items).toEqual([
      { kind: 'recent', query: 'react hooks' },
      { kind: 'recent', query: 'جستجو' },
    ])
    expect(result.current.isOpen).toBe(true)
  })

  it('stays closed when there is nothing to show', () => {
    const { result, focus } = setup('zzz')
    focus()
    expect(result.current.isOpen).toBe(false)
  })

  it('moves the highlight with the arrow keys and wraps around', () => {
    const { result, focus } = setup('ho')
    focus()
    expect(result.current.highlightedIndex).toBe(-1)

    expect(press(result, 'ArrowDown').handled).toBe(true)
    expect(result.current.highlightedIndex).toBe(0)
    expect(result.current.inputProps['aria-activedescendant']).toBe(
      optionId(result.current.listboxId, 0),
    )

    press(result, 'ArrowDown')
    press(result, 'ArrowDown')
    expect(result.current.highlightedIndex).toBe(0)

    press(result, 'ArrowUp')
    expect(result.current.highlightedIndex).toBe(1)
  })

  it('highlights the last item on ArrowUp from no highlight', () => {
    const { result, focus } = setup('ho')
    focus()
    press(result, 'ArrowUp')
    expect(result.current.highlightedIndex).toBe(1)
  })

  it('replaces only the last word when selecting with Enter', () => {
    const { result, focus, setQuery, onSelect } = setup('state ho')
    focus()
    press(result, 'ArrowDown')
    const { handled, event } = press(result, 'Enter')

    expect(handled).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(setQuery).toHaveBeenCalledWith('state hooks')
    expect(onSelect).toHaveBeenCalledWith('state hooks')
  })

  it('selects with Tab too', () => {
    const { result, focus, setQuery } = setup('ho')
    focus()
    press(result, 'ArrowDown')
    press(result, 'ArrowDown')
    expect(press(result, 'Tab').handled).toBe(true)
    expect(setQuery).toHaveBeenCalledWith('hook')
  })

  it('selects a recent search as the whole query', () => {
    const { result, focus, setQuery } = setup('', ['react hooks'])
    focus()
    act(() => result.current.select(0))
    expect(setQuery).toHaveBeenCalledWith('react hooks')
  })

  it('closes after selecting and reopens when the user types again', () => {
    const { result, rerender, focus } = setup('ho')
    focus()
    act(() => result.current.select(0))

    rerender({ query: 'hooks' }) // the parent applies the selected query
    expect(result.current.isOpen).toBe(false)

    rerender({ query: 'hooks r' })
    rerender({ query: 'hooks re' })
    expect(result.current.isOpen).toBe(true)
  })

  it('leaves Enter and Tab alone when nothing is highlighted', () => {
    const { result, focus } = setup('ho')
    focus()
    expect(press(result, 'Enter').handled).toBe(false)
    expect(press(result, 'Tab').handled).toBe(false)
  })

  it('closes on Escape and reopens with the arrow keys', () => {
    const { result, focus } = setup('ho')
    focus()
    const { handled, event } = press(result, 'Escape')
    expect(handled).toBe(true)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(result.current.isOpen).toBe(false)

    expect(press(result, 'Escape').handled).toBe(false)

    press(result, 'ArrowDown')
    expect(result.current.isOpen).toBe(true)
  })

  it('reopens on focus after being dismissed', () => {
    const { result, focus } = setup('ho')
    focus()
    press(result, 'Escape')
    focus()
    expect(result.current.isOpen).toBe(true)
  })

  it('resets the highlight when the query changes', () => {
    const { result, rerender, focus } = setup('h')
    focus()
    press(result, 'ArrowDown')
    rerender({ query: 'ho' })
    expect(result.current.highlightedIndex).toBe(-1)
  })

  it('ignores keys while an IME is composing', () => {
    const { result, focus } = setup('ho')
    focus()
    expect(press(result, 'ArrowDown', true).handled).toBe(false)
  })

  it('ignores arrow keys when there is nothing to show', () => {
    const { result } = setup('zzz')
    expect(press(result, 'ArrowDown').handled).toBe(false)
  })

  it('updates the highlight from the pointer', () => {
    const { result, focus } = setup('ho')
    focus()
    act(() => result.current.highlight(1))
    expect(result.current.highlightedIndex).toBe(1)
  })
})
