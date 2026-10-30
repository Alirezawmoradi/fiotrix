import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useScrollToActive } from '@/hooks/useScrollToActive'
import type { MatchRange } from '@/types'

const MATCHES: MatchRange[] = [
  { start: 0, end: 3 },
  { start: 10, end: 13 },
]

function rect(top: number, height: number): DOMRect {
  return { top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top } as DOMRect
}

/** A 400px-tall container scrolled to 100px, whose mark #1 is 500px below its top edge. */
function createContainer(): HTMLElement {
  const container = document.createElement('main')
  container.innerHTML = '<mark data-match-index="0">a</mark><mark data-match-index="1">b</mark>'
  Object.defineProperty(container, 'clientHeight', { value: 400 })
  container.scrollTop = 100
  container.getBoundingClientRect = () => rect(50, 400)

  const mark = container.querySelector<HTMLElement>('[data-match-index="1"]')
  if (mark) mark.getBoundingClientRect = () => rect(550, 20)
  return container
}

/** jsdom has no `matchMedia`; without it the hook assumes motion is fine. */
function mockReducedMotion(reduce: boolean): void {
  vi.stubGlobal('matchMedia', () => ({ matches: reduce }))
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useScrollToActive', () => {
  it('smoothly centers the active match in the container', () => {
    const container = createContainer()
    const scrollTo = vi.spyOn(container, 'scrollTo')

    renderHook(() => useScrollToActive({ current: container }, 1, MATCHES))

    // mark top in content = 100 + (550 - 50) = 600; centered: 600 - (400 - 20) / 2 = 410
    expect(scrollTo).toHaveBeenCalledWith({ top: 410, behavior: 'smooth' })
  })

  it('jumps instantly when reduced motion is preferred', () => {
    mockReducedMotion(true)
    const container = createContainer()
    const scrollTo = vi.spyOn(container, 'scrollTo')

    renderHook(() => useScrollToActive({ current: container }, 1, MATCHES))
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
  })

  it('scrolls again when the active match changes', () => {
    const container = createContainer()
    const scrollTo = vi.spyOn(container, 'scrollTo')

    const { rerender } = renderHook(
      ({ index }) => useScrollToActive({ current: container }, index, MATCHES),
      { initialProps: { index: 0 } },
    )
    rerender({ index: 1 })
    expect(scrollTo).toHaveBeenCalledTimes(2)
  })

  it('does nothing without matches', () => {
    const container = createContainer()
    const scrollTo = vi.spyOn(container, 'scrollTo')

    renderHook(() => useScrollToActive({ current: container }, 0, []))
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
