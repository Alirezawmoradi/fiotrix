import type { JSX, KeyboardEvent, ReactNode, RefObject } from 'react'
import type { ComboboxInputProps } from '@/hooks/useAutocomplete'
import { cn } from '@/lib/cn'
import type { SearchOptions } from '@/types'

const INPUT_CLASSES = cn(
  'w-full rounded-lg border border-ink/15 bg-surface-muted py-2.5 ps-10 pe-10 text-base',
  'placeholder:text-ink-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
  // Hide the browser's own clear button; we render a consistent one.
  '[&::-webkit-search-cancel-button]:appearance-none',
)

const TOGGLE_CLASSES = cn(
  'flex h-11 min-w-11 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors',
  'focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none',
)

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  options: SearchOptions
  onOptionsChange: (options: SearchOptions) => void
  /** The query the result count belongs to (may lag `query` while typing). */
  searchedQuery: string
  total: number
  isStale: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onInputKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  /** Combobox ARIA/focus props when the input drives a suggestion list. */
  comboboxProps?: ComboboxInputProps
  /** Rendered under the input (e.g. the suggestion list). */
  dropdown?: ReactNode
  /** Rendered at the end of the result summary row (e.g. the match navigator). */
  children?: ReactNode
}

export function SearchBar({
  query,
  onQueryChange,
  options,
  onOptionsChange,
  searchedQuery,
  total,
  isStale,
  inputRef,
  onInputKeyDown,
  comboboxProps,
  dropdown,
  children,
}: SearchBarProps): JSX.Element {
  function clear(): void {
    onQueryChange('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon />
          <input
            {...comboboxProps}
            ref={inputRef}
            type="search"
            dir="auto"
            autoFocus
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search the text"
            placeholder="Search the text…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={onInputKeyDown}
            className={INPUT_CLASSES}
          />
          {query !== '' && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clear}
              className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-ink-muted hover:text-ink"
            >
              <ClearIcon />
            </button>
          )}
          {dropdown}
        </div>

        <OptionToggle
          label="Match case"
          pressed={options.caseSensitive}
          onToggle={() => onOptionsChange({ ...options, caseSensitive: !options.caseSensitive })}
        >
          Aa
        </OptionToggle>
        <OptionToggle
          label="Match whole word"
          pressed={options.wholeWord}
          onToggle={() => onOptionsChange({ ...options, wholeWord: !options.wholeWord })}
        >
          <span className="underline decoration-2 underline-offset-4">ab</span>
        </OptionToggle>
      </div>

      <div className="flex min-h-11 items-center justify-between gap-2">
        <p
          aria-live="polite"
          className={cn('text-sm text-ink-muted transition-opacity', isStale && 'opacity-50')}
        >
          {resultSummary(searchedQuery, total)}
        </p>
        {children}
      </div>
    </div>
  )
}

function resultSummary(searchedQuery: string, total: number): string {
  if (searchedQuery.trim() === '') return ''
  if (total === 0) return 'No results'
  return total === 1 ? '1 result' : `${total.toLocaleString()} results`
}

interface OptionToggleProps {
  label: string
  pressed: boolean
  onToggle: () => void
  children: ReactNode
}

function OptionToggle({ label, pressed, onToggle, children }: OptionToggleProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onToggle}
      className={cn(
        TOGGLE_CLASSES,
        pressed
          ? 'border-accent bg-accent text-white'
          : 'border-ink/15 bg-surface-muted text-ink-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function SearchIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="pointer-events-none absolute inset-y-0 start-3 my-auto size-5 text-ink-muted"
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" />
    </svg>
  )
}

function ClearIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-4"
    >
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  )
}
