import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SearchBar } from '@/components/SearchBar/SearchBar'

type Props = ComponentProps<typeof SearchBar>

function renderSearchBar(overrides: Partial<Props> = {}): Props {
  const props: Props = {
    query: '',
    onQueryChange: vi.fn(),
    options: { caseSensitive: false, wholeWord: false },
    onOptionsChange: vi.fn(),
    searchedQuery: '',
    total: 0,
    isStale: false,
    inputRef: createRef<HTMLInputElement>(),
    ...overrides,
  }
  render(<SearchBar {...props} />)
  return props
}

describe('SearchBar', () => {
  it('reports typed text', async () => {
    const props = renderSearchBar()
    await userEvent.type(screen.getByRole('searchbox'), 'a')
    expect(props.onQueryChange).toHaveBeenCalledWith('a')
  })

  it('shows no summary without a query', () => {
    renderSearchBar()
    expect(screen.queryByText(/result/)).not.toBeInTheDocument()
  })

  it.each([
    [0, 'No results'],
    [1, '1 result'],
    [12, '12 results'],
  ])('summarizes %i matches as "%s"', (total, summary) => {
    renderSearchBar({ query: 'cat', searchedQuery: 'cat', total })
    expect(screen.getByText(summary)).toBeInTheDocument()
  })

  it('toggles search options', async () => {
    const props = renderSearchBar()
    await userEvent.click(screen.getByRole('button', { name: 'Match case' }))
    expect(props.onOptionsChange).toHaveBeenCalledWith({ caseSensitive: true, wholeWord: false })

    await userEvent.click(screen.getByRole('button', { name: 'Match whole word' }))
    expect(props.onOptionsChange).toHaveBeenCalledWith({ caseSensitive: false, wholeWord: true })
  })

  it('reflects active options as pressed', () => {
    renderSearchBar({ options: { caseSensitive: true, wholeWord: false } })
    expect(screen.getByRole('button', { name: 'Match case' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('clears the query and keeps focus in the input', async () => {
    const props = renderSearchBar({ query: 'cat' })
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(props.onQueryChange).toHaveBeenCalledWith('')
    expect(screen.getByRole('searchbox')).toHaveFocus()
  })
})
