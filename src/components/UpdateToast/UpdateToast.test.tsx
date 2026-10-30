import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createRegistration,
  createWorker,
  mockServiceWorkerContainer,
  type MockWorker,
} from '@/sw/__tests__/serviceWorkerMocks'
import type * as ToastModule from '@/components/UpdateToast/UpdateToast'
import type * as RegisterModule from '@/sw/registerServiceWorker'

// Fresh modules per test, since the waiting worker lives in module state.
let UpdateToast: typeof ToastModule.UpdateToast
let sw: typeof RegisterModule
let restore = (): void => {}

beforeEach(async () => {
  vi.resetModules()
  ;({ UpdateToast } = await import('@/components/UpdateToast/UpdateToast'))
  sw = await import('@/sw/registerServiceWorker')
  restore = mockServiceWorkerContainer({ hasController: true }).restore
})

afterEach(() => {
  restore()
})

function announceUpdate(): MockWorker {
  const waiting = createWorker('installed')
  act(() => sw.watchForUpdates(createRegistration({ waiting })))
  return waiting
}

describe('UpdateToast', () => {
  it('stays hidden until an update is waiting', () => {
    render(<UpdateToast />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    announceUpdate()
    expect(screen.getByRole('status')).toHaveTextContent('New version available')
  })

  it('reloads into the new version', async () => {
    render(<UpdateToast />)
    const waiting = announceUpdate()

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('can be dismissed', async () => {
    render(<UpdateToast />)
    announceUpdate()

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
