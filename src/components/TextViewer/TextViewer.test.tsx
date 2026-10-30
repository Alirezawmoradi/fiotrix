import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { TextViewer } from '@/components/TextViewer/TextViewer'
import { findMatches } from '@/lib/findMatches'

const TEXT = 'cat and dog\nno pets here\nanother cat, a third CAT'
const matches = findMatches(TEXT, 'cat', { caseSensitive: false, wholeWord: false })

type Props = ComponentProps<typeof TextViewer>
const defaults: Props = { text: TEXT, matches, activeIndex: 0, highlightKey: 'cat' }

function marks(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('mark'))
}

describe('TextViewer', () => {
  it('renders one paragraph per line', () => {
    const { container } = render(<TextViewer {...defaults} matches={[]} />)
    expect(container.querySelectorAll('p')).toHaveLength(3)
    expect(screen.getByText('no pets here')).toHaveAttribute('dir', 'auto')
  })

  it('highlights every match with its global index', () => {
    const { container } = render(<TextViewer {...defaults} />)
    const rendered = marks(container)

    expect(rendered.map((mark) => mark.textContent)).toEqual(['cat', 'cat', 'CAT'])
    expect(rendered.map((mark) => mark.dataset.matchIndex)).toEqual(['0', '1', '2'])
  })

  it('marks only the active match as current', () => {
    const { container } = render(<TextViewer {...defaults} activeIndex={2} />)
    const current = container.querySelectorAll('mark[aria-current="true"]')

    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('CAT')
  })

  it('keeps the text content intact', () => {
    const { container } = render(<TextViewer {...defaults} />)
    const paragraphs = Array.from(container.querySelectorAll('p'), (p) => p.textContent)
    expect(paragraphs.join('\n')).toBe(TEXT)
  })

  describe('animations', () => {
    it('animates marks in, and pulses the active one', () => {
      const { container } = render(<TextViewer {...defaults} activeIndex={1} />)
      const [first, active] = marks(container)

      expect(first).toHaveClass('animate-highlight-in', 'motion-reduce:animate-none')
      expect(active).toHaveClass('animate-highlight-active', 'motion-reduce:animate-none')
    })

    it('keeps mark elements when only the active match moves', () => {
      const { container, rerender } = render(<TextViewer {...defaults} />)
      const before = marks(container)

      rerender(<TextViewer {...defaults} activeIndex={1} />)
      marks(container).forEach((mark, i) => expect(mark).toBe(before[i]))
    })

    it('remounts marks, but not paragraphs, for a new search', () => {
      const { container, rerender } = render(<TextViewer {...defaults} />)
      const marksBefore = marks(container)
      const paragraphsBefore = Array.from(container.querySelectorAll('p'))

      rerender(<TextViewer {...defaults} highlightKey="cat (whole word)" />)

      marks(container).forEach((mark, i) => expect(mark).not.toBe(marksBefore[i]))
      container.querySelectorAll('p').forEach((p, i) => expect(p).toBe(paragraphsBefore[i]))
    })
  })
})
