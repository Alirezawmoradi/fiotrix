import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { sampleText } from '@/data/sampleText'
import { useDocumentText } from '@/hooks/useDocumentText'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('useDocumentText', () => {
  it('starts with the sample text', () => {
    const { result } = renderHook(() => useDocumentText())
    expect(result.current.text).toBe(sampleText)
    expect(result.current.source).toBe('sample')
  })

  it('persists custom text across launches', () => {
    const first = renderHook(() => useDocumentText())
    act(() => first.result.current.setText('my own text'))
    expect(first.result.current.text).toBe('my own text')
    expect(first.result.current.isPersisted).toBe(true)

    const second = renderHook(() => useDocumentText())
    expect(second.result.current.text).toBe('my own text')
    expect(second.result.current.source).toBe('custom')
  })

  it('resets to the sample text and forgets the custom text', () => {
    const first = renderHook(() => useDocumentText())
    act(() => first.result.current.setText('my own text'))
    act(() => first.result.current.resetToSample())
    expect(first.result.current.text).toBe(sampleText)

    const second = renderHook(() => useDocumentText())
    expect(second.result.current.source).toBe('sample')
  })

  it('keeps the text in memory when storage is full', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useDocumentText())
    act(() => result.current.setText('huge text'))

    expect(result.current.text).toBe('huge text')
    expect(result.current.isPersisted).toBe(false)
  })
})
