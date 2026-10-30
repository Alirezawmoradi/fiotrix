import { useLayoutEffect, type RefObject } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import type { MatchRange } from '@/types'

/**
 * Scrolls the active match to the vertical center of the scroll container.
 *
 * Runs whenever the active match or the result set changes (so a new search
 * scrolls to its first match). Uses `container.scrollTo` with a computed
 * offset rather than `scrollIntoView`, so only the text container scrolls,
 * never the page or other ancestors.
 */
export function useScrollToActive(
  containerRef: RefObject<HTMLElement | null>,
  activeIndex: number,
  matches: readonly MatchRange[],
): void {
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || matches.length === 0) return

    const mark = container.querySelector<HTMLElement>(`[data-match-index="${activeIndex}"]`)
    if (!mark) return

    const containerRect = container.getBoundingClientRect()
    const markRect = mark.getBoundingClientRect()
    const markTop = container.scrollTop + markRect.top - containerRect.top

    container.scrollTo({
      top: markTop - (container.clientHeight - markRect.height) / 2,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }, [containerRef, activeIndex, matches])
}
