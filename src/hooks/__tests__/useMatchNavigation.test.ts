import { act, fireEvent, renderHook } from '@testing-library/react'
import type { KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useMatchNavigation } from '@/hooks/useMatchNavigation'

function setup(total: number, activeIndex: number) {
  const setActiveIndex = vi.fn()
  const input = document.createElement('input')
  input.value = 'query'
  document.body.append(input)
  const inputRef = { current: input }

  const { result, unmount } = renderHook(() =>
    useMatchNavigation({ total, activeIndex, setActiveIndex, inputRef }),
  )
  return { result, setActiveIndex, input, unmount }
}

function enterEvent(shiftKey = false, isComposing = false): KeyboardEvent<HTMLInputElement> {
  return {
    key: 'Enter',
    shiftKey,
    nativeEvent: { isComposing },
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLInputElement>
}

describe('useMatchNavigation', () => {
  it('moves to the next and previous match', () => {
    const { result, setActiveIndex } = setup(5, 2)
    act(() => result.current.next())
    expect(setActiveIndex).toHaveBeenLastCalledWith(3)
    act(() => result.current.prev())
    expect(setActiveIndex).toHaveBeenLastCalledWith(1)
  })

  it('wraps from the last match to the first', () => {
    const { result, setActiveIndex } = setup(5, 4)
    act(() => result.current.next())
    expect(setActiveIndex).toHaveBeenLastCalledWith(0)
  })

  it('wraps from the first match to the last', () => {
    const { result, setActiveIndex } = setup(5, 0)
    act(() => result.current.prev())
    expect(setActiveIndex).toHaveBeenLastCalledWith(4)
  })

  it('does nothing without matches', () => {
    const { result, setActiveIndex } = setup(0, 0)
    act(() => result.current.next())
    expect(setActiveIndex).not.toHaveBeenCalled()
  })

  it('navigates with Enter and Shift+Enter in the input', () => {
    const { result, setActiveIndex } = setup(5, 2)
    const event = enterEvent()
    act(() => result.current.handleInputKeyDown(event))
    expect(setActiveIndex).toHaveBeenLastCalledWith(3)
    expect(event.preventDefault).toHaveBeenCalled()

    act(() => result.current.handleInputKeyDown(enterEvent(true)))
    expect(setActiveIndex).toHaveBeenLastCalledWith(1)
  })

  it('ignores Enter while an IME is composing', () => {
    const { result, setActiveIndex } = setup(5, 2)
    act(() => result.current.handleInputKeyDown(enterEvent(false, true)))
    expect(setActiveIndex).not.toHaveBeenCalled()
  })

  it.each([
    ['F3', { code: 'F3' }, 3],
    ['Shift+F3', { code: 'F3', shiftKey: true }, 1],
    ['Ctrl+G', { code: 'KeyG', ctrlKey: true }, 3],
    ['Cmd+G', { code: 'KeyG', metaKey: true }, 3],
    ['Shift+Ctrl+G', { code: 'KeyG', ctrlKey: true, shiftKey: true }, 1],
  ])('handles %s anywhere on the page', (_, init, expected) => {
    const { setActiveIndex } = setup(5, 2)
    const notPrevented = fireEvent.keyDown(window, init)
    expect(setActiveIndex).toHaveBeenLastCalledWith(expected)
    expect(notPrevented).toBe(false)
  })

  it('ignores G without a modifier', () => {
    const { setActiveIndex } = setup(5, 2)
    fireEvent.keyDown(window, { code: 'KeyG' })
    expect(setActiveIndex).not.toHaveBeenCalled()
  })

  it('focuses and selects the search input on Ctrl+F, on any keyboard layout', () => {
    const { input } = setup(5, 2)
    // A Persian layout reports the letter in `key`; `code` is still KeyF.
    const notPrevented = fireEvent.keyDown(window, { code: 'KeyF', key: 'ب', ctrlKey: true })

    expect(notPrevented).toBe(false)
    expect(input).toHaveFocus()
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
  })

  it('removes its listener on unmount', () => {
    const { setActiveIndex, unmount } = setup(5, 2)
    unmount()
    fireEvent.keyDown(window, { code: 'F3' })
    expect(setActiveIndex).not.toHaveBeenCalled()
  })

  it('reports each navigation', () => {
    const setActiveIndex = vi.fn()
    const onNavigate = vi.fn()
    const { result } = renderHook(() =>
      useMatchNavigation({
        total: 3,
        activeIndex: 0,
        setActiveIndex,
        inputRef: { current: null },
        onNavigate,
      }),
    )
    act(() => result.current.next())
    act(() => result.current.prev())
    expect(onNavigate).toHaveBeenCalledTimes(2)
  })
})
