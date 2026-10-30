import { useCallback, useEffect, type KeyboardEvent, type RefObject } from 'react'

interface MatchNavigationParams {
  total: number
  activeIndex: number
  setActiveIndex: (index: number) => void
  /** The search input, focused by Ctrl/Cmd+F. */
  inputRef: RefObject<HTMLInputElement | null>
}

export interface MatchNavigation {
  next: () => void
  prev: () => void
  /** Enter / Shift+Enter in the search input move to the next / previous match. */
  handleInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Previous/next match with wrap-around, plus keyboard shortcuts:
 * F3 / Shift+F3 and Ctrl/Cmd+G / Shift+Ctrl/Cmd+G anywhere, and Ctrl/Cmd+F to
 * focus our search input instead of the browser's find bar.
 */
export function useMatchNavigation({
  total,
  activeIndex,
  setActiveIndex,
  inputRef,
}: MatchNavigationParams): MatchNavigation {
  const step = useCallback(
    (delta: number) => {
      if (total === 0) return
      // Adding `total` before `%` keeps the result positive when stepping back from 0.
      setActiveIndex((activeIndex + delta + total) % total)
    },
    [total, activeIndex, setActiveIndex],
  )

  const next = useCallback(() => step(1), [step])
  const prev = useCallback(() => step(-1), [step])

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent): void {
      const withModifier = event.ctrlKey || event.metaKey

      // `code` is the physical key, so shortcuts also work on non-Latin
      // layouts such as Persian, where `key` would be a Persian letter.
      if (event.code === 'F3' || (withModifier && event.code === 'KeyG')) {
        event.preventDefault()
        if (event.shiftKey) prev()
        else next()
      } else if (withModifier && event.code === 'KeyF') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, inputRef])

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      // Ignore Enter while an IME is composing text.
      if (event.key !== 'Enter' || event.nativeEvent.isComposing) return
      event.preventDefault()
      if (event.shiftKey) prev()
      else next()
    },
    [next, prev],
  )

  return { next, prev, handleInputKeyDown }
}
