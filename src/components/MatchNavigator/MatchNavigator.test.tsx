import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FloatingNavigator } from '@/components/MatchNavigator/FloatingNavigator'
import { MatchNavigator } from '@/components/MatchNavigator/MatchNavigator'

describe('MatchNavigator', () => {
  it('renders nothing without matches', () => {
    const { container } = render(
      <MatchNavigator total={0} activeIndex={0} onPrev={vi.fn()} onNext={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the position as "n / total" and announces it in words', () => {
    render(<MatchNavigator total={12} activeIndex={2} onPrev={vi.fn()} onNext={vi.fn()} />)
    const counter = screen.getByText((_, element) => element?.tagName === 'P')

    expect(counter).toHaveTextContent('Result 3 / of 12')
    expect(counter).toHaveAttribute('aria-live', 'polite')
  })

  it('hides the arrows when there is a single match', () => {
    render(<MatchNavigator total={1} activeIndex={0} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Next result' }).parentElement).toHaveClass(
      'invisible',
    )
  })

  it('calls the handlers from the arrows', async () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(<MatchNavigator total={3} activeIndex={0} onPrev={onPrev} onNext={onNext} />)

    await userEvent.click(screen.getByRole('button', { name: 'Next result' }))
    await userEvent.click(screen.getByRole('button', { name: 'Previous result' }))
    expect(onNext).toHaveBeenCalledOnce()
    expect(onPrev).toHaveBeenCalledOnce()
  })
})

describe('FloatingNavigator', () => {
  const matches = [
    { start: 0, end: 3 },
    { start: 5, end: 8 },
  ]

  it('is hidden from assistive technology and the tab order', () => {
    render(
      <FloatingNavigator
        containerRef={createRef()}
        matches={matches}
        activeIndex={0}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )
    const navigator = screen.getByTestId('floating-navigator')

    expect(navigator).toHaveAttribute('aria-hidden', 'true')
    navigator.querySelectorAll('button').forEach((button) => {
      expect(button).toHaveAttribute('tabindex', '-1')
    })
  })

  it('is hidden with one match or fewer', () => {
    render(
      <FloatingNavigator
        containerRef={createRef()}
        matches={matches.slice(0, 1)}
        activeIndex={0}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )
    expect(screen.getByTestId('floating-navigator')).toHaveClass('invisible')
  })

  it('aligns its center with the active match', () => {
    const container = document.createElement('div')
    container.innerHTML = '<mark data-match-index="1">x</mark>'
    container.getBoundingClientRect = () => ({ top: 100 }) as DOMRect
    const mark = container.querySelector('mark')
    if (mark) mark.getBoundingClientRect = () => ({ top: 400, height: 20 }) as DOMRect

    render(
      <FloatingNavigator
        containerRef={{ current: container }}
        matches={matches}
        activeIndex={1}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />,
    )

    // Mark center relative to the container: 400 - 100 + 20 / 2 = 310 (nav height is 0 in jsdom).
    expect(screen.getByTestId('floating-navigator').style.transform).toBe('translateY(310px)')
  })

  describe('when the text reflows', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('re-aligns on container resize and stops observing on unmount', () => {
      let onResize = (): void => {}
      const observe = vi.fn()
      const disconnect = vi.fn()
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(callback: () => void) {
            onResize = callback
          }
          observe = observe
          disconnect = disconnect
        },
      )

      let markTop = 400
      const container = document.createElement('div')
      container.innerHTML = '<mark data-match-index="0">x</mark>'
      container.getBoundingClientRect = () => ({ top: 0 }) as DOMRect
      const mark = container.querySelector('mark')
      if (mark) mark.getBoundingClientRect = () => ({ top: markTop, height: 0 }) as DOMRect

      const { unmount } = render(
        <FloatingNavigator
          containerRef={{ current: container }}
          matches={matches}
          activeIndex={0}
          onPrev={vi.fn()}
          onNext={vi.fn()}
        />,
      )
      expect(observe).toHaveBeenCalledWith(container)

      markTop = 250
      onResize()
      expect(screen.getByTestId('floating-navigator').style.transform).toBe('translateY(250px)')

      unmount()
      expect(disconnect).toHaveBeenCalled()
    })
  })
})
