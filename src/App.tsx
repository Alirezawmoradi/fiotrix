import { useCallback, useRef, type JSX, type KeyboardEvent } from 'react'
import { Autocomplete } from '@/components/Autocomplete/Autocomplete'
import { FloatingNavigator } from '@/components/MatchNavigator/FloatingNavigator'
import { MatchNavigator } from '@/components/MatchNavigator/MatchNavigator'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { TextViewer } from '@/components/TextViewer/TextViewer'
import { useAutocomplete } from '@/hooks/useAutocomplete'
import { useDocumentText } from '@/hooks/useDocumentText'
import { useMatchNavigation } from '@/hooks/useMatchNavigation'
import { useRecentSearches } from '@/hooks/useRecentSearches'
import { useScrollToActive } from '@/hooks/useScrollToActive'
import { useSearch } from '@/hooks/useSearch'

export function App(): JSX.Element {
  const { text } = useDocumentText()
  const search = useSearch(text)
  const { recent, addRecent } = useRecentSearches()

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Navigating results means the user found what they searched for: remember it.
  const rememberQuery = useCallback(() => addRecent(search.query), [addRecent, search.query])

  const navigation = useMatchNavigation({
    total: search.total,
    activeIndex: search.activeIndex,
    setActiveIndex: search.setActiveIndex,
    inputRef,
    onNavigate: rememberQuery,
  })
  useScrollToActive(scrollRef, search.activeIndex, search.matches)

  const autocomplete = useAutocomplete({
    text,
    query: search.query,
    setQuery: search.setQuery,
    recentSearches: recent,
    onSelect: addRecent,
  })

  // An open suggestion list gets first pick of keys; Enter otherwise navigates matches.
  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!autocomplete.handleKeyDown(event)) navigation.handleInputKeyDown(event)
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 shrink-0 border-b border-ink/10 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pt-3">
          <h1 className="text-sm font-semibold text-ink-muted">Smart Search Reader</h1>
          <SearchBar
            query={search.query}
            onQueryChange={search.setQuery}
            options={search.options}
            onOptionsChange={search.setOptions}
            searchedQuery={search.searchedQuery}
            total={search.total}
            isStale={search.isStale}
            inputRef={inputRef}
            onInputKeyDown={handleInputKeyDown}
            comboboxProps={autocomplete.inputProps}
            dropdown={
              <Autocomplete
                id={autocomplete.listboxId}
                isOpen={autocomplete.isOpen}
                items={autocomplete.items}
                highlightedIndex={autocomplete.highlightedIndex}
                prefixLength={autocomplete.prefixLength}
                onSelect={autocomplete.select}
                onHighlight={autocomplete.highlight}
              />
            }
          >
            <MatchNavigator
              total={search.total}
              activeIndex={search.activeIndex}
              onPrev={navigation.prev}
              onNext={navigation.next}
            />
          </SearchBar>
        </div>
      </header>

      {/* The text area scrolls on its own so the header stays in view. */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="relative mx-auto max-w-3xl">
          <TextViewer
            text={text}
            matches={search.matches}
            activeIndex={search.activeIndex}
            highlightKey={search.searchKey}
          />
          <FloatingNavigator
            containerRef={contentRef}
            matches={search.matches}
            activeIndex={search.activeIndex}
            onPrev={navigation.prev}
            onNext={navigation.next}
          />
        </div>
      </main>
    </div>
  )
}
