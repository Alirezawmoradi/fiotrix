import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createRegistration,
  createWorker,
  finishInstalling,
  mockServiceWorkerContainer,
} from '@/sw/__tests__/serviceWorkerMocks'
import type * as RegisterModule from '@/sw/registerServiceWorker'

// The module keeps the waiting worker in module state: load a fresh copy per test.
let sw: typeof RegisterModule
let restore = (): void => {}

beforeEach(async () => {
  vi.resetModules()
  sw = await import('@/sw/registerServiceWorker')
})

afterEach(() => {
  restore()
  vi.restoreAllMocks()
})

describe('registerServiceWorker', () => {
  it('registers sw.js once the page has loaded', async () => {
    const mock = mockServiceWorkerContainer({ hasController: false })
    restore = mock.restore
    mock.container.register.mockResolvedValue(createRegistration())

    sw.registerServiceWorker()
    expect(mock.container.register).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('load'))
    expect(mock.container.register).toHaveBeenCalledWith('/sw.js')
    await vi.waitFor(() => expect(sw.isUpdateWaiting()).toBe(false))
  })

  it('does nothing in browsers without service workers', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener')
    sw.registerServiceWorker()
    expect(addEventListener).not.toHaveBeenCalledWith('load', expect.any(Function))
  })

  it('logs registration failures instead of throwing', async () => {
    const mock = mockServiceWorkerContainer({ hasController: false })
    restore = mock.restore
    mock.container.register.mockRejectedValue(new Error('blocked'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    sw.registerServiceWorker()
    window.dispatchEvent(new Event('load'))
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled())
  })
})

describe('watchForUpdates', () => {
  it('reports a worker that is already waiting to update the page', () => {
    restore = mockServiceWorkerContainer({ hasController: true }).restore
    const listener = vi.fn()
    sw.subscribeToUpdates(listener)

    sw.watchForUpdates(createRegistration({ waiting: createWorker('installed') }))

    expect(sw.isUpdateWaiting()).toBe(true)
    expect(listener).toHaveBeenCalledOnce()
  })

  it('reports an update once a newly found worker finishes installing', () => {
    restore = mockServiceWorkerContainer({ hasController: true }).restore
    const installing = createWorker('installing')
    const registration = createRegistration({ installing })

    sw.watchForUpdates(registration)
    registration.dispatchEvent(new Event('updatefound'))
    expect(sw.isUpdateWaiting()).toBe(false)

    finishInstalling(installing)
    expect(sw.isUpdateWaiting()).toBe(true)
  })

  it('treats the very first install as no update', () => {
    restore = mockServiceWorkerContainer({ hasController: false }).restore
    const installing = createWorker('installing')
    const registration = createRegistration({ installing })

    sw.watchForUpdates(registration)
    registration.dispatchEvent(new Event('updatefound'))
    finishInstalling(installing)

    expect(sw.isUpdateWaiting()).toBe(false)
  })

  it('stops notifying unsubscribed listeners', () => {
    restore = mockServiceWorkerContainer({ hasController: true }).restore
    const listener = vi.fn()
    const unsubscribe = sw.subscribeToUpdates(listener)
    unsubscribe()

    sw.watchForUpdates(createRegistration({ waiting: createWorker('installed') }))
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('applyUpdate', () => {
  it('asks the waiting worker to take over and reloads when it does', () => {
    const mock = mockServiceWorkerContainer({ hasController: true })
    restore = mock.restore
    const waiting = createWorker('installed')
    sw.watchForUpdates(createRegistration({ waiting }))
    const addEventListener = vi.spyOn(mock.container, 'addEventListener')

    sw.applyUpdate()

    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    expect(addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function), {
      once: true,
    })
  })

  it('does nothing without a waiting worker', () => {
    expect(() => sw.applyUpdate()).not.toThrow()
  })
})
