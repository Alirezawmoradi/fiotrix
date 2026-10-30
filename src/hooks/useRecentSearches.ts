import { useCallback, useEffect, useState } from 'react'
import { addRecentSearch, parseRecentSearches } from '@/lib/recentSearches'
import { readStorage, writeStorage } from '@/lib/storage'

const STORAGE_KEY = 'smart-search-reader:recent-searches'

export interface RecentSearches {
  /** Newest first. */
  recent: readonly string[]
  addRecent: (query: string) => void
}

/** The last few searches the user committed to, persisted across launches. */
export function useRecentSearches(): RecentSearches {
  const [recent, setRecent] = useState<readonly string[]>(() =>
    parseRecentSearches(readStorage(STORAGE_KEY)),
  )

  const addRecent = useCallback((query: string) => {
    setRecent((current) => addRecentSearch(current, query))
  }, [])

  useEffect(() => {
    writeStorage(STORAGE_KEY, JSON.stringify(recent))
  }, [recent])

  return { recent, addRecent }
}
