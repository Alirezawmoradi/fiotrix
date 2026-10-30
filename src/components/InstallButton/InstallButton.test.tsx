import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InstallButton } from '@/components/InstallButton/InstallButton'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'maxTouchPoints')
})

function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function mockUserAgent(userAgent: string, maxTouchPoints = 0): void {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
  // jsdom does not implement maxTouchPoints, so define it rather than spy on it.
  Object.defineProperty(navigator, 'maxTouchPoints', { value: maxTouchPoints, configurable: true })
}

describe('InstallButton', () => {
  it('renders nothing until the browser offers installation', () => {
    const { container } = render(<InstallButton />)
    expect(container).toBeEmptyDOMElement()
  })

  it('replaces the browser prompt with an Install button', () => {
    render(<InstallButton />)
    const event = offerInstall()

    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument()
  })

  it('shows the browser prompt on click, then hides the button', async () => {
    render(<InstallButton />)
    const event = offerInstall('dismissed')

    await userEvent.click(screen.getByRole('button', { name: 'Install' }))

    expect(event.prompt).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Install' })).not.toBeInTheDocument()
  })

  it('hides once the app is installed', () => {
    render(<InstallButton />)
    offerInstall()
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders nothing when already running as an installed app', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { container } = render(<InstallButton />)
    offerInstall()
    expect(container).toBeEmptyDOMElement()
  })

  it.each([
    ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 0],
    ['iPad (reports as a Mac)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5],
  ])('explains Add to Home Screen on %s', async (_, userAgent, touchPoints) => {
    mockUserAgent(userAgent, touchPoints)
    render(<InstallButton />)
    const button = screen.getByRole('button', { name: 'Install' })
    const hint = document.getElementById(button.getAttribute('aria-controls') ?? '')

    expect(hint).toHaveTextContent('Tap Share, then Add to Home Screen.')
    expect(hint).not.toBeVisible()
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(hint).toBeVisible()
  })

  it('does not treat a desktop Mac as iOS', () => {
    mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)
    const { container } = render(<InstallButton />)
    expect(container).toBeEmptyDOMElement()
  })
})
