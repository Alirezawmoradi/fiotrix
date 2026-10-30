import {
  useCallback,
  useId,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { buildIndex } from '@/lib/searchIndex'
import { getLastWord, replaceLastWord, suggest } from '@/lib/suggest'

export type AutocompleteItem =
  { kind: 'suggestion'; word: string; count: number } | { kind: 'recent'; query: string }

/** ARIA and focus props for the combobox input (WAI-ARIA 1.2 combobox pattern). */
export type ComboboxInputProps = Pick<
  InputHTMLAttributes<HTMLInputElement>,
  | 'role'
  | 'aria-expanded'
  | 'aria-controls'
  | 'aria-autocomplete'
  | 'aria-activedescendant'
  | 'onFocus'
  | 'onBlur'
>

interface AutocompleteParams {
  text: string
  query: string
  setQuery: (query: string) => void
  recentSearches: readonly string[]
  /** Called with the resulting query when the user picks an item. */
  onSelect: (query: string) => void
}

export interface Autocomplete {
  items: AutocompleteItem[]
  isOpen: boolean
  highlightedIndex: number
  /** Length of the word being completed, to emphasize the matched prefix. */
  prefixLength: number
  listboxId: string
  inputProps: ComboboxInputProps
  /** Returns `true` when the key was handled, so other handlers should skip it. */
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => boolean
  select: (index: number) => void
  highlight: (index: number) => void
}

/** Moves the highlight with wrap-around; from "none", Down picks the first item and Up the last. */
function stepHighlight(current: number, step: 1 | -1, count: number): number {
  if (current === -1) return step === 1 ? 0 : count - 1
  return (current + step + count) % count
}

export function optionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`
}

/**
 * Suggestion list state for the search input: completions for the last word
 * being typed, or recent searches while the input is empty.
 */
export function useAutocomplete({
  text,
  query,
  setQuery,
  recentSearches,
  onSelect,
}: AutocompleteParams): Autocomplete {
  const listboxId = useId()
  const index = useMemo(() => buildIndex(text), [text])
  const prefix = getLastWord(query).word

  const items = useMemo((): AutocompleteItem[] => {
    if (query.trim() === '') {
      return recentSearches.map((recent) => ({ kind: 'recent', query: recent }))
    }
    return suggest(index, prefix).map((suggestion) => ({ kind: 'suggestion', ...suggestion }))
  }, [query, prefix, index, recentSearches])

  const [isFocused, setIsFocused] = useState(false)
  // The query the list was closed for (Escape or a selection). Typing a
  // different query reopens it, with no effect needed to reset the flag.
  const [dismissedFor, setDismissedFor] = useState<string | null>(null)
  const isOpen = isFocused && dismissedFor !== query && items.length > 0

  // Likewise, a highlight only applies to the query it was made for.
  const [highlight, setHighlight] = useState({ query, index: -1 })
  const highlightedIndex =
    isOpen && highlight.query === query && highlight.index < items.length ? highlight.index : -1

  const select = useCallback(
    (itemIndex: number) => {
      const item = items[itemIndex]
      if (!item) return
      const nextQuery = item.kind === 'recent' ? item.query : replaceLastWord(query, item.word)
      setQuery(nextQuery)
      setDismissedFor(nextQuery)
      onSelect(nextQuery)
    },
    [items, query, setQuery, onSelect],
  )

  const highlightItem = useCallback(
    (itemIndex: number) => setHighlight({ query, index: itemIndex }),
    [query],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>): boolean => {
      if (event.nativeEvent.isComposing) return false

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
          if (items.length === 0) return false
          event.preventDefault()
          const step = event.key === 'ArrowDown' ? 1 : -1
          setDismissedFor(null) // Arrow keys also reopen a dismissed list.
          setHighlight({ query, index: stepHighlight(highlightedIndex, step, items.length) })
          return true
        }
        case 'Enter':
        case 'Tab':
          // Without a highlighted item, Enter falls through to match navigation.
          if (highlightedIndex === -1) return false
          event.preventDefault()
          select(highlightedIndex)
          return true
        case 'Escape':
          if (!isOpen) return false
          event.preventDefault() // Also stops the search input from clearing itself.
          setDismissedFor(query)
          return true
        default:
          return false
      }
    },
    [items.length, highlightedIndex, isOpen, query, select],
  )

  const inputProps: ComboboxInputProps = {
    role: 'combobox',
    'aria-expanded': isOpen,
    'aria-controls': listboxId,
    'aria-autocomplete': 'list',
    'aria-activedescendant':
      highlightedIndex === -1 ? undefined : optionId(listboxId, highlightedIndex),
    onFocus: () => {
      setIsFocused(true)
      setDismissedFor(null)
    },
    onBlur: () => setIsFocused(false),
  }

  return {
    items,
    isOpen,
    highlightedIndex,
    prefixLength: prefix.length,
    listboxId,
    inputProps,
    handleKeyDown,
    select,
    highlight: highlightItem,
  }
}
