/*
 * Safe localStorage access. Storage can be missing or throw (private mode,
 * blocked site data, quota exceeded). These wrappers never throw, so the app
 * keeps working with in-memory state when storage is unavailable.
 */

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Returns `false` when the value could not be stored (e.g. quota exceeded). */
export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
