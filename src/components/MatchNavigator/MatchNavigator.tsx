import type { JSX } from 'react'
import { cn } from '@/lib/cn'

const NAV_BUTTON_CLASSES =
  'flex size-11 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/10 hover:text-ink'

interface MatchNavigatorProps {
  total: number
  activeIndex: number
  onPrev: () => void
  onNext: () => void
}

/**
 * Header navigator: an "n / total" counter, plus previous/next arrows that
 * appear (animated) only when there is more than one match.
 */
export function MatchNavigator({
  total,
  activeIndex,
  onPrev,
  onNext,
}: MatchNavigatorProps): JSX.Element | null {
  if (total === 0) return null

  const canNavigate = total > 1

  return (
    <div className="flex items-center gap-1">
      <p aria-live="polite" aria-atomic="true" className="px-1 text-sm text-ink tabular-nums">
        <span className="sr-only">Result </span>
        {activeIndex + 1}
        <span aria-hidden="true"> / </span>
        <span className="sr-only"> of </span>
        {total}
      </p>

      <div
        className={cn(
          'flex transition-[opacity,translate,visibility] duration-200 motion-reduce:transition-none',
          canNavigate ? 'visible translate-x-0 opacity-100' : 'invisible translate-x-2 opacity-0',
        )}
      >
        <NavButton direction="prev" onClick={onPrev} />
        <NavButton direction="next" onClick={onNext} />
      </div>
    </div>
  )
}

interface NavButtonProps {
  direction: 'prev' | 'next'
  onClick: () => void
  className?: string
  /** -1 removes the button from the tab order (for duplicate, pointer-only controls). */
  tabIndex?: number
}

export function NavButton({
  direction,
  onClick,
  className,
  tabIndex,
}: NavButtonProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'Previous result' : 'Next result'}
      title={direction === 'prev' ? 'Previous result (Shift+Enter)' : 'Next result (Enter)'}
      tabIndex={tabIndex}
      onClick={onClick}
      className={cn(NAV_BUTTON_CLASSES, className)}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d={direction === 'prev' ? 'm5 12.5 5-5 5 5' : 'm5 7.5 5 5 5-5'} />
      </svg>
    </button>
  )
}
