import { useState, type JSX } from 'react'
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate'

/** Bottom toast offering to reload into a newly downloaded version of the app. */
export function UpdateToast(): JSX.Element {
  const { isUpdateAvailable, applyUpdate } = useServiceWorkerUpdate()
  const [isDismissed, setIsDismissed] = useState(false)
  const isVisible = isUpdateAvailable && !isDismissed

  // The live region stays mounted so the message is announced when it appears.
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {isVisible && (
        <div className="pointer-events-auto flex animate-toast-in items-center gap-3 rounded-xl bg-ink py-2 ps-4 pe-2 text-sm text-surface shadow-lg motion-reduce:animate-none">
          <span>New version available</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="min-h-11 rounded-lg px-3 font-semibold underline underline-offset-2 hover:bg-surface/10 focus-visible:outline-surface"
          >
            Reload
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setIsDismissed(true)}
            className="flex size-11 items-center justify-center rounded-lg hover:bg-surface/10 focus-visible:outline-surface"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-4"
            >
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
