import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TextViewer } from '@/components/TextViewer/TextViewer'
import { findMatches } from '@/lib/findMatches'

const TEXT = 'cat and dog\nno pets here\nanother cat, a third CAT'
const matches = findMatches(TEXT, 'cat', { caseSensitive: false, wholeWord: false })

function marks(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('mark'))
}

describe('TextViewer', () => {
  it('renders one paragraph per line', () => {
    const { container } = render(<TextViewer text={TEXT} matches={[]} activeIndex={0} />)
    expect(container.querySelectorAll('p')).toHaveLength(3)
    expect(screen.getByText('no pets here')).toHaveAttribute('dir', 'auto')
  })

  it('highlights every match with its global index', () => {
    const { container } = render(<TextViewer text={TEXT} matches={matches} activeIndex={0} />)
    const rendered = marks(container)

    expect(rendered.map((mark) => mark.textContent)).toEqual(['cat', 'cat', 'CAT'])
    expect(rendered.map((mark) => mark.dataset.matchIndex)).toEqual(['0', '1', '2'])
  })

  it('marks only the active match as current', () => {
    const { container } = render(<TextViewer text={TEXT} matches={matches} activeIndex={2} />)
    const current = container.querySelectorAll('mark[aria-current="true"]')

    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('CAT')
  })

  it('keeps the text content intact', () => {
    const { container } = render(<TextViewer text={TEXT} matches={matches} activeIndex={0} />)
    const paragraphs = Array.from(container.querySelectorAll('p'), (p) => p.textContent)
    expect(paragraphs.join('\n')).toBe(TEXT)
  })
})
