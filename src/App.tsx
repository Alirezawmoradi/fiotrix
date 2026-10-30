import type { JSX } from 'react'
import { SearchBar } from '@/components/SearchBar/SearchBar'
import { TextViewer } from '@/components/TextViewer/TextViewer'
import { useDocumentText } from '@/hooks/useDocumentText'
import { useSearch } from '@/hooks/useSearch'

export function App(): JSX.Element {
  const { text } = useDocumentText()
  const search = useSearch(text)

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
          />
        </div>
      </header>

      <TextViewer
        text={text}
        matches={search.matches}
        activeIndex={search.activeIndex}
        highlightKey={search.searchKey}
      />
    </div>
  )
}
