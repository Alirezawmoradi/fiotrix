import { useCallback, useEffect, useState } from 'react'

/** Chromium's install prompt event (not yet in TypeScript's DOM types). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
  interface Navigator {
    /** iOS Safari: true when launched from the home screen. */
    standalone?: boolean
  }
}

export interface InstallPrompt {
  /** The browser offered installation; `install()` shows its prompt. */
  canInstall: boolean
  /** iOS has no install prompt: the user must use Share → Add to Home Screen. */
  needsManualInstall: boolean
  install: () => Promise<void>
}

function isRunningInstalled(): boolean {
  const standaloneDisplay =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  return standaloneDisplay || navigator.standalone === true
}

function isIos(): boolean {
  // iPadOS reports itself as a Mac, but Macs have no touch screen.
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  )
}

/** Offers app installation when the browser allows it, and hides it once installed. */
export function useInstallPrompt(): InstallPrompt {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isRunningInstalled)
  const [isIosDevice] = useState(isIos)

  useEffect(() => {
    function onBeforeInstallPrompt(event: BeforeInstallPromptEvent): void {
      event.preventDefault() // Show our own button instead of the browser's mini-infobar.
      setPromptEvent(event)
    }
    function onInstalled(): void {
      setPromptEvent(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    // A prompt event can only be used once, whatever the user chose.
    setPromptEvent(null)
  }, [promptEvent])

  return {
    canInstall: !isInstalled && promptEvent !== null,
    needsManualInstall: !isInstalled && isIosDevice,
    install,
  }
}
