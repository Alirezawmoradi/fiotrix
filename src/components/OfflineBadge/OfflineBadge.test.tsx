import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OfflineBadge } from '@/components/OfflineBadge/OfflineBadge'

afterEach(() => {
  vi.restoreAllMocks()
})

function goOffline(isOffline: boolean): void {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!isOffline)
  act(() => {
    window.dispatchEvent(new Event(isOffline ? 'offline' : 'online'))
  })
}

describe('OfflineBadge', () => {
  it('shows nothing while online', () => {
    render(<OfflineBadge />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('appears when the connection drops and disappears when it returns', () => {
    render(<OfflineBadge />)

    goOffline(true)
    expect(screen.getByRole('status')).toHaveTextContent('Offline — everything still works')

    goOffline(false)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
