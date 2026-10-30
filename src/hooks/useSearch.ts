import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { findMatches } from '@/lib/findMatches'
import { normalizeText } from '@/lib/normalize'
import type { MatchRange, SearchOptions } from '@/types'

const DEFAULT_OPTIONS: SearchOptions = { caseSensitive: false, wholeWord: false }

export interface Search {
  query: string
  setQuery: (query: string) => void
  /** The query the current `matches` were computed for (lags `query` while typing fast). */
  searchedQuery: string
  options: SearchOptions
  setOptions: (options: SearchOptions) => void
  matches: MatchRange[]
  total: number
  activeIndex: number
  setActiveIndex: (index: number) => void
  /** True while results for the latest keystroke are still being computed. */
  isStale: boolean
}

export function useSearch(text: string): Search {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState(DEFAULT_OPTIONS)

  // `useDeferredValue` instead of a debounce: the input updates immediately and
  // React renders the results at a lower priority, abandoning that work if the
  // user types again. There is no fixed delay: results appear at once on fast
  // devices and React adapts on slow ones. This only pays off because the
  // expensive consumer (TextViewer) is memoized and receives deferred data.
  const searchedQuery = useDeferredValue(query)

  // Normalized once per text and case option, never per keystroke.
  const normalizedText = useMemo(
    () => normalizeText(text, options.caseSensitive),
    [text, options.caseSensitive],
  )

  const matches = useMemo(
    () => findMatches(text, searchedQuery, options, normalizedText),
    [text, searchedQuery, options, normalizedText],
  )

  // The active index belongs to one result set. Storing it next to the set it
  // was chosen in makes it reset to the first match whenever `matches` changes
  // (new query, options or text) during render, without an extra effect.
  const [active, setActive] = useState({ matches, index: 0 })
  const activeIndex = active.matches === matches ? active.index : 0

  const setActiveIndex = useCallback((index: number) => setActive({ matches, index }), [matches])

  return {
    query,
    setQuery,
    searchedQuery,
    options,
    setOptions,
    matches,
    total: matches.length,
    activeIndex,
    setActiveIndex,
    isStale: query !== searchedQuery,
  }
}
