import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Autocomplete } from '@/components/Autocomplete/Autocomplete'

type Props = ComponentProps<typeof Autocomplete>

function renderAutocomplete(overrides: Partial<Props> = {}): Props {
  const props: Props = {
    id: 'list',
    isOpen: true,
    items: [
      { kind: 'suggestion', word: 'react', count: 12 },
      { kind: 'suggestion', word: 'reactive', count: 1 },
    ],
    highlightedIndex: -1,
    prefixLength: 3,
    onSelect: vi.fn(),
    onHighlight: vi.fn(),
    ...overrides,
  }
  render(<Autocomplete {...props} />)
  return props
}

describe('Autocomplete', () => {
  it('renders an accessible listbox of options', () => {
    renderAutocomplete()
    expect(screen.getByRole('listbox', { name: 'Suggestions' })).toHaveAttribute('id', 'list')
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('emphasizes the typed prefix and shows the count', () => {
    renderAutocomplete()
    const [first] = screen.getAllByRole('option')

    expect(first?.querySelector('strong')).toHaveTextContent(/^rea$/)
    expect(first).toHaveTextContent('react12')
    expect(first).toHaveAccessibleName('react, 12 occurrences')
  })

  it('gives each option an id for aria-activedescendant and marks the highlighted one', () => {
    renderAutocomplete({ highlightedIndex: 1 })
    const [first, second] = screen.getAllByRole('option')

    expect(first).toHaveAttribute('id', 'list-option-0')
    expect(first).toHaveAttribute('aria-selected', 'false')
    expect(second).toHaveAttribute('aria-selected', 'true')
  })

  it('selects on click without taking focus from the input', async () => {
    const props = renderAutocomplete()
    const option = screen.getAllByRole('option')[1]
    if (!option) throw new Error('missing option')

    // A prevented mousedown keeps focus (and the open list) on the input.
    expect(fireEvent.mouseDown(option)).toBe(false)
    await userEvent.click(option)
    expect(props.onSelect).toHaveBeenCalledWith(1)
  })

  it('highlights the option under the pointer', () => {
    const props = renderAutocomplete({ highlightedIndex: 0 })
    const [first, second] = screen.getAllByRole('option')
    if (!first || !second) throw new Error('missing options')

    fireEvent.mouseMove(first)
    expect(props.onHighlight).not.toHaveBeenCalled()
    fireEvent.mouseMove(second)
    expect(props.onHighlight).toHaveBeenCalledWith(1)
  })

  it('labels recent searches', () => {
    renderAutocomplete({ items: [{ kind: 'recent', query: 'جستجو' }] })
    expect(screen.getByRole('listbox', { name: 'Recent searches' })).toBeInTheDocument()
    expect(screen.getByRole('option')).toHaveTextContent('جستجو')
  })

  it('is hidden while closed', () => {
    renderAutocomplete({ isOpen: false })
    expect(screen.getByRole('listbox', { hidden: true })).toHaveClass('invisible')
  })
})
