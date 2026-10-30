import { memo, useMemo, type JSX } from 'react'
import { cn } from '@/lib/cn'
import { groupMatchesByParagraph, splitParagraphs } from '@/lib/paragraphs'
import { buildSegments } from '@/lib/segments'
import type { MatchRange } from '@/types'

const NO_MATCHES: readonly MatchRange[] = []

const MARK_CLASSES = cn(
  'rounded-sm box-decoration-clone',
  'transition-[background-color,color] duration-200 motion-reduce:animate-none',
)
const INACTIVE_MARK_CLASSES = 'bg-highlight text-inherit animate-highlight-in'
const ACTIVE_MARK_CLASSES = 'bg-highlight-active text-highlight-active-ink animate-highlight-active'

interface TextViewerProps {
  text: string
  matches: readonly MatchRange[]
  activeIndex: number
  /** Changes with every new search; remounts the marks so they animate in again. */
  highlightKey: string
}

/**
 * The text with highlighted matches. The parent provides the scroll container.
 *
 * Memoized, and split into memoized paragraphs: when the active match moves,
 * only the one or two paragraphs containing the old/new active match
 * re-render, and paragraphs without matches never re-render while typing.
 */
export const TextViewer = memo(function TextViewer({
  text,
  matches,
  activeIndex,
  highlightKey,
}: TextViewerProps): JSX.Element {
  const paragraphs = useMemo(() => splitParagraphs(text), [text])
  const spans = useMemo(() => groupMatchesByParagraph(paragraphs, matches), [paragraphs, matches])

  return (
    <article className="space-y-4 px-4 py-6 leading-relaxed">
      {paragraphs.map((paragraph, i) => {
        const { first, end } = spans[i] ?? { first: 0, end: 0 }
        const hasMatches = end > first
        const containsActive = activeIndex >= first && activeIndex < end

        // Paragraphs without matches always receive identical props,
        // so React.memo skips them entirely.
        return (
          <ParagraphView
            key={i}
            text={paragraph.text}
            offset={paragraph.start}
            matches={hasMatches ? matches : NO_MATCHES}
            firstMatch={hasMatches ? first : 0}
            endMatch={hasMatches ? end : 0}
            activeIndex={containsActive ? activeIndex : -1}
            highlightKey={hasMatches ? highlightKey : ''}
          />
        )
      })}
    </article>
  )
})

interface ParagraphViewProps {
  text: string
  /** Offset of this paragraph in the full text. */
  offset: number
  /** All matches of the text; this paragraph renders `[firstMatch, endMatch)`. */
  matches: readonly MatchRange[]
  firstMatch: number
  endMatch: number
  /** Global index of the active match if it is in this paragraph, else -1. */
  activeIndex: number
  highlightKey: string
}

const ParagraphView = memo(function ParagraphView({
  text,
  offset,
  matches,
  firstMatch,
  endMatch,
  activeIndex,
  highlightKey,
}: ParagraphViewProps): JSX.Element {
  const segments = buildSegments(text, matches.slice(firstMatch, endMatch), offset, firstMatch)

  return (
    <p dir="auto">
      {segments.map((segment, i) => {
        if (segment.kind === 'text') return segment.text

        const isActive = segment.matchIndex === activeIndex
        return (
          <mark
            // Keyed by search, not just position: a new search remounts only
            // the marks (never the paragraph), replaying their appear animation.
            key={`${highlightKey}:${i}`}
            data-match-index={segment.matchIndex}
            aria-current={isActive ? 'true' : undefined}
            className={cn(MARK_CLASSES, isActive ? ACTIVE_MARK_CLASSES : INACTIVE_MARK_CLASSES)}
          >
            {segment.text}
          </mark>
        )
      })}
    </p>
  )
})
