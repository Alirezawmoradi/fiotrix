import type { JSX } from 'react'
import { TextViewer } from '@/components/TextViewer/TextViewer'
import { sampleText } from '@/data/sampleText'

export function App(): JSX.Element {
  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-10 shrink-0 border-b border-ink/10 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <h1 className="text-lg font-semibold">Smart Search Reader</h1>
        </div>
      </header>

      <TextViewer text={sampleText} />
    </div>
  )
}
