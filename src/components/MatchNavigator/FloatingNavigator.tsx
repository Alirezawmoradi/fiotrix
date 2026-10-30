import { useLayoutEffect, useRef, type JSX, type RefObject } from 'react'
import { NavButton } from '@/components/MatchNavigator/MatchNavigator'
import { cn } from '@/lib/cn'
import type { MatchRange } from '@/types'

interface FloatingNavigatorProps {
  /** Positioned element wrapping the text; the navigator is placed relative to it. */
  containerRef: RefObject<HTMLElement | null>
  matches: readonly MatchRange[]
  activeIndex: number
  onPrev: () => void
  onNext: () => void
}

/**
 * Small previous/next control that sits beside the active match inside the
 * scrolling content, so it scrolls with the text and needs no scroll listener.
 * It moves with a CSS transform transition when the active match changes.
 *
 * Pointer/touch convenience only: the header navigator and keyboard shortcuts
 * provide the same actions, so this copy is hidden from assistive technology
 * and from the tab order.
 */
export function FloatingNavigator({
  containerRef,
  matches,
  activeIndex,
  onPrev,
  onNext,
}: FloatingNavigatorProps): JSX.Element {
  const navRef = useRef<HTMLDivElement>(null)
  const isVisible = matches.length > 1

  useLayoutEffect(() => {
    const container = containerRef.current
    const nav = navRef.current
    if (!container || !nav || !isVisible) return

    // Written straight to the DOM: moving the navigator needs no re-render.
    const alignToActiveMatch = (): void => {
      const mark = container.querySelector(`[data-match-index="${activeIndex}"]`)
      if (!mark) return

      const markRect = mark.getBoundingClientRect()
      const markCenter = markRect.top - container.getBoundingClientRect().top + markRect.height / 2
      nav.style.transform = `translateY(${markCenter - nav.offsetHeight / 2}px)`
    }

    alignToActiveMatch()

    // Re-align when the text reflows (window resize, font load, etc.).
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(alignToActiveMatch)
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, matches, activeIndex, isVisible])

  return (
    <div
      ref={navRef}
      aria-hidden="true"
      data-testid="floating-navigator"
      className={cn(
        'absolute end-1 top-0 flex flex-col rounded-xl border border-ink/10 bg-surface/95 shadow-md backdrop-blur lg:-end-14',
        'transition-[transform,opacity,visibility] duration-300 ease-out motion-reduce:transition-none',
        isVisible ? 'visible opacity-100' : 'invisible opacity-0',
      )}
    >
      <NavButton direction="prev" onClick={onPrev} tabIndex={-1} />
      <NavButton direction="next" onClick={onNext} tabIndex={-1} />
    </div>
  )
}
