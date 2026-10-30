import type { JSX } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/** Reassures the user while offline: the whole app is cached, so search keeps working. */
export function OfflineBadge(): JSX.Element {
  const isOnline = useOnlineStatus()

  // The live region stays mounted so screen readers announce the badge when it appears.
  return (
    <p role="status" className="text-xs">
      {!isOnline && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          Offline — everything still works
        </span>
      )}
    </p>
  )
}
