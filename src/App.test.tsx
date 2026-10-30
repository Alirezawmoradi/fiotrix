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
    await userEvent.type(screen.getByRole('searchbox'), 'service worker')

    const total = document.querySelectorAll('mark').length
    expect(total).toBeGreaterThan(1)
    expect(screen.getByText(`${total} results`)).toBeInTheDocument()
    expect(activeMark()).toHaveAttribute('data-match-index', '0')
  })

  it('moves through matches with the arrows and wraps around', async () => {
    render(<App />)
    await userEvent.type(screen.getByRole('searchbox'), 'service worker')
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
    await userEvent.type(screen.getByRole('searchbox'), 'offline{Enter}')
    expect(activeMark()).toHaveAttribute('data-match-index', '1')

    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    expect(activeMark()).toHaveAttribute('data-match-index', '0')
  })
})
