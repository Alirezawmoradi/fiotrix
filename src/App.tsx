import { useRef, type JSX } from 'react'
import { FloatingNavigator } from '@/components/MatchNavigator/FloatingNavigator'
import { MatchNavigator } from '@/components/MatchNavigator/MatchNavigator'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { TextViewer } from '@/components/TextViewer/TextViewer'
import { useDocumentText } from '@/hooks/useDocumentText'
import { useMatchNavigation } from '@/hooks/useMatchNavigation'
import { useScrollToActive } from '@/hooks/useScrollToActive'
import { useSearch } from '@/hooks/useSearch'

export function App(): JSX.Element {
  const { text } = useDocumentText()
  const search = useSearch(text)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const navigation = useMatchNavigation({
    total: search.total,
    activeIndex: search.activeIndex,
    setActiveIndex: search.setActiveIndex,
    inputRef,
  })
  useScrollToActive(scrollRef, search.activeIndex, search.matches)

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
            onInputKeyDown={navigation.handleInputKeyDown}
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
