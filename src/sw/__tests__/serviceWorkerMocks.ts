import { vi } from 'vitest'

/** Minimal stand-ins for the Service Worker API objects (jsdom has none). */

export type MockWorker = ServiceWorker & { postMessage: ReturnType<typeof vi.fn> }

export function createWorker(state: ServiceWorkerState): MockWorker {
  return Object.assign(new EventTarget(), { state, postMessage: vi.fn() }) as unknown as MockWorker
}

export function createRegistration(
  parts: { waiting?: ServiceWorker; installing?: ServiceWorker } = {},
): ServiceWorkerRegistration {
  return Object.assign(new EventTarget(), {
    waiting: parts.waiting ?? null,
    installing: parts.installing ?? null,
  }) as unknown as ServiceWorkerRegistration
}

/** Installs a fake `navigator.serviceWorker`; returns it and a cleanup function. */
export function mockServiceWorkerContainer(options: { hasController: boolean }): {
  container: ServiceWorkerContainer & { register: ReturnType<typeof vi.fn> }
  restore: () => void
} {
  const container = Object.assign(new EventTarget(), {
    controller: options.hasController ? createWorker('activated') : null,
    register: vi.fn(),
  }) as unknown as ServiceWorkerContainer & { register: ReturnType<typeof vi.fn> }

  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true })
  return {
    container,
    restore: () => {
      // Remove the own property so `'serviceWorker' in navigator` is false again in jsdom.
      Reflect.deleteProperty(navigator, 'serviceWorker')
    },
  }
}

/** Marks a worker as installed and notifies its listeners, like a finished download. */
export function finishInstalling(worker: MockWorker): void {
  Object.assign(worker, { state: 'installed' })
  worker.dispatchEvent(new Event('statechange'))
}
