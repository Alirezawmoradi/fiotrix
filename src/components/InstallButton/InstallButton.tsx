import { useId, useState, type JSX } from 'react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

const BUTTON_CLASSES =
  'inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-accent transition-colors hover:bg-accent/10'

/**
 * "Install" button. Uses the browser's install prompt where available; on iOS,
 * which has none, it reveals how to add the app to the home screen instead.
 * Renders nothing once the app is installed or when installing isn't possible.
 */
export function InstallButton(): JSX.Element | null {
  const { canInstall, needsManualInstall, install } = useInstallPrompt()
  const [isHintOpen, setIsHintOpen] = useState(false)
  const hintId = useId()

  if (canInstall) {
    return (
      <button type="button" onClick={() => void install()} className={BUTTON_CLASSES}>
        <InstallIcon />
        Install
      </button>
    )
  }

  if (!needsManualInstall) return null

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isHintOpen}
        aria-controls={hintId}
        onClick={() => setIsHintOpen((open) => !open)}
        className={BUTTON_CLASSES}
      >
        <InstallIcon />
        Install
      </button>
      <p
        id={hintId}
        hidden={!isHintOpen}
        className="absolute end-0 top-full z-30 mt-1 w-56 rounded-lg border border-ink/10 bg-surface p-3 text-sm shadow-lg"
      >
        Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
      </p>
    </div>
  )
}

function InstallIcon(): JSX.Element {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M10 3v10m-4-4 4 4 4-4M4 16h12" />
    </svg>
  )
}
