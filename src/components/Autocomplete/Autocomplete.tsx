import type { JSX } from 'react'
import { optionId, type AutocompleteItem } from '@/hooks/useAutocomplete'
import { cn } from '@/lib/cn'

const LIST_CLASSES = cn(
  'absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-ink/10 bg-surface py-1 shadow-lg',
  'origin-top transition-[opacity,translate,visibility] duration-150 ease-out motion-reduce:transition-none',
)

const OPTION_CLASSES =
  'flex min-h-11 cursor-pointer items-center gap-3 px-3 text-base aria-selected:bg-accent/10'

interface AutocompleteProps {
  id: string
  isOpen: boolean
  items: readonly AutocompleteItem[]
  highlightedIndex: number
  /** Length of the typed prefix, shown in bold in each suggestion. */
  prefixLength: number
  onSelect: (index: number) => void
  onHighlight: (index: number) => void
}

/**
 * Listbox half of the search combobox. The input owns focus throughout:
 * options are chosen with the keyboard via `aria-activedescendant`, and mouse
 * presses are prevented from blurring the input.
 */
export function Autocomplete({
  id,
  isOpen,
  items,
  highlightedIndex,
  prefixLength,
  onSelect,
  onHighlight,
}: AutocompleteProps): JSX.Element {
  const showsRecent = items[0]?.kind === 'recent'

  return (
    <ul
      id={id}
      role="listbox"
      aria-label={showsRecent ? 'Recent searches' : 'Suggestions'}
      className={cn(
        LIST_CLASSES,
        isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
      )}
    >
      {items.map((item, index) => (
        <li
          key={item.kind === 'recent' ? `recent:${item.query}` : `word:${item.word}`}
          id={optionId(id, index)}
          role="option"
          aria-selected={index === highlightedIndex}
          // Keep focus in the input so the click below can select.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(index)}
          onMouseMove={() => {
            if (index !== highlightedIndex) onHighlight(index)
          }}
          className={OPTION_CLASSES}
        >
          {item.kind === 'recent' ? (
            <RecentOption query={item.query} />
          ) : (
            <SuggestionOption word={item.word} count={item.count} prefixLength={prefixLength} />
          )}
        </li>
      ))}
    </ul>
  )
}

function SuggestionOption({
  word,
  count,
  prefixLength,
}: {
  word: string
  count: number
  prefixLength: number
}): JSX.Element {
  return (
    <>
      <span dir="auto" className="flex-1 truncate">
        <strong className="font-semibold">{word.slice(0, prefixLength)}</strong>
        {word.slice(prefixLength)}
      </span>
      <span
        aria-hidden="true"
        className="rounded-full bg-ink/10 px-2 py-0.5 text-xs text-ink-muted tabular-nums"
      >
        {count.toLocaleString()}
      </span>
      <span className="sr-only">
        , {count} {count === 1 ? 'occurrence' : 'occurrences'}
      </span>
    </>
  )
}

function RecentOption({ query }: { query: string }): JSX.Element {
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="size-4 shrink-0 text-ink-muted"
      >
        <circle cx="10" cy="10" r="7" />
        <path d="M10 6.5V10l2.5 1.5" />
      </svg>
      <span dir="auto" className="flex-1 truncate">
        {query}
      </span>
    </>
  )
}
