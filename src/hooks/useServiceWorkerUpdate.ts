import { useSyncExternalStore } from 'react'
import { applyUpdate, isUpdateWaiting, subscribeToUpdates } from '@/sw/registerServiceWorker'

export interface ServiceWorkerUpdate {
  /** A new version has been downloaded and is waiting to take over. */
  isUpdateAvailable: boolean
  applyUpdate: () => void
}

export function useServiceWorkerUpdate(): ServiceWorkerUpdate {
  const isUpdateAvailable = useSyncExternalStore(subscribeToUpdates, isUpdateWaiting, () => false)
  return { isUpdateAvailable, applyUpdate }
}
