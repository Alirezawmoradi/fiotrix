import type { JSX } from 'react'

interface TextViewerProps {
  text: string
}

/** Scrollable reading area. Highlighting is added in Phase 3. */
export function TextViewer({ text }: TextViewerProps): JSX.Element {
  const paragraphs = text.split('\n')

  return (
    <main className="flex-1 overflow-y-auto">
      <article className="mx-auto max-w-3xl space-y-4 px-4 py-6 leading-relaxed">
        {paragraphs.map((paragraph, index) => (
          <p key={index} dir="auto">
            {paragraph}
          </p>
        ))}
      </article>
    </main>
  )
}
