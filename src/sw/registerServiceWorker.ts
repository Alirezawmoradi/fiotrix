/*
 * Service worker registration and the "new version available" update flow.
 *
 * A new build installs its worker in the background, where it waits while the
 * old one still controls the page. We surface that waiting worker to the UI
 * (via `subscribeToUpdates`), and when the user accepts, ask it to take over
 * and reload once it controls the page, so the new build is used.
 */

type Listener = () => void

let waitingWorker: ServiceWorker | null = null
const listeners = new Set<Listener>()

function setWaitingWorker(worker: ServiceWorker): void {
  waitingWorker = worker
  listeners.forEach((listener) => listener())
}

/** Registers `sw.js` after the page has loaded, so it never competes with the first render. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(watchForUpdates)
      .catch((error: unknown) => console.error('Service worker registration failed', error))
  })
}

/** Exported for tests. */
export function watchForUpdates(registration: ServiceWorkerRegistration): void {
  // Without a controller this is the first install, not an update.
  const hasController = (): boolean => navigator.serviceWorker.controller !== null

  if (registration.waiting && hasController()) setWaitingWorker(registration.waiting)

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing
    installing?.addEventListener('statechange', () => {
      if (installing.state === 'installed' && hasController()) setWaitingWorker(installing)
    })
  })
}

export function subscribeToUpdates(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isUpdateWaiting(): boolean {
  return waitingWorker !== null
}

/** Activates the waiting worker, then reloads into the new version. */
export function applyUpdate(): void {
  if (!waitingWorker) return
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  })
  waitingWorker.postMessage({ type: 'SKIP_WAITING' })
}
