import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from '@/App'

afterEach(() => {
  window.localStorage.clear()
})

function activeMark(): Element | null {
  return document.querySelector('mark[aria-current="true"]')
}

describe('App', () => {
  it('highlights matches and shows the counter while typing', async () => {
    render(<App />)
    await userEvent.type(screen.getByRole('combobox'), 'service worker')

    const total = document.querySelectorAll('mark').length
    expect(total).toBeGreaterThan(1)
    expect(screen.getByText(`${total} results`)).toBeInTheDocument()
    expect(activeMark()).toHaveAttribute('data-match-index', '0')
  })

  it('moves through matches with the arrows and wraps around', async () => {
    render(<App />)
    await userEvent.type(screen.getByRole('combobox'), 'service worker')
    const total = document.querySelectorAll('mark').length
    const next = screen.getByRole('button', { name: 'Next result' })
    const prev = screen.getByRole('button', { name: 'Previous result' })

    await userEvent.click(next)
    expect(activeMark()).toHaveAttribute('data-match-index', '1')

    await userEvent.click(prev)
    await userEvent.click(prev)
    expect(activeMark()).toHaveAttribute('data-match-index', String(total - 1))

    await userEvent.click(next)
    expect(activeMark()).toHaveAttribute('data-match-index', '0')
  })

  it('moves to the next match with Enter in the search input', async () => {
    render(<App />)
    await userEvent.type(screen.getByRole('combobox'), 'offline{Enter}')
    expect(activeMark()).toHaveAttribute('data-match-index', '1')

    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    expect(activeMark()).toHaveAttribute('data-match-index', '0')
  })

  describe('autocomplete', () => {
    it('completes the last word from the keyboard, then Enter navigates again', async () => {
      render(<App />)
      const input = screen.getByRole('combobox')
      await userEvent.type(input, 'offline serv')

      expect(input).toHaveAttribute('aria-expanded', 'true')
      await userEvent.keyboard('{ArrowDown}')
      const highlighted = screen.getByRole('option', { selected: true })
      const word = highlighted.querySelector('span')?.textContent ?? ''
      expect(word.startsWith('serv')).toBe(true)

      await userEvent.keyboard('{Enter}')
      expect(input).toHaveValue(`offline ${word}`)
      expect(input).toHaveAttribute('aria-expanded', 'false')
      expect(input).toHaveFocus()
    })

    it('suggests Persian words with their counts', async () => {
      render(<App />)
      await userEvent.type(screen.getByRole('combobox'), 'جست')

      const options = screen.getAllByRole('option')
      expect(options[0]).toHaveAccessibleName(/^جستجو, \d+ occurrences$/)
    })

    it('offers recent searches once a search was used', async () => {
      render(<App />)
      const input = screen.getByRole('combobox')
      await userEvent.type(input, 'offline{Enter}')
      await userEvent.clear(input)

      expect(screen.getByRole('listbox', { name: 'Recent searches' })).toBeVisible()
      await userEvent.click(screen.getByRole('option', { name: 'offline' }))
      expect(input).toHaveValue('offline')
    })
  })
})
