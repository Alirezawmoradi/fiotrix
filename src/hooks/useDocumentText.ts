import { useCallback, useState } from 'react'
import { sampleText } from '@/data/sampleText'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'

const STORAGE_KEY = 'smart-search-reader:text'

export type TextSource = 'sample' | 'custom'

interface DocumentState {
  text: string
  source: TextSource
}

export interface DocumentText extends DocumentState {
  /** `false` when the current custom text could not be saved (e.g. too large for storage). */
  isPersisted: boolean
  setText: (text: string) => void
  resetToSample: () => void
}

function loadInitialDocument(): DocumentState {
  const stored = readStorage(STORAGE_KEY)
  return stored === null
    ? { text: sampleText, source: 'sample' }
    : { text: stored, source: 'custom' }
}

/** The text being searched: the sample text or the user's own, persisted across launches. */
export function useDocumentText(): DocumentText {
  const [current, setCurrent] = useState(loadInitialDocument)
  const [isPersisted, setIsPersisted] = useState(true)

  const setText = useCallback((text: string) => {
    setCurrent({ text, source: 'custom' })
    // If storage fails the text still works for this session; the UI can tell the user.
    setIsPersisted(writeStorage(STORAGE_KEY, text))
  }, [])

  const resetToSample = useCallback(() => {
    removeStorage(STORAGE_KEY)
    setCurrent({ text: sampleText, source: 'sample' })
    setIsPersisted(true)
  }, [])

  return { ...current, isPersisted, setText, resetToSample }
}
