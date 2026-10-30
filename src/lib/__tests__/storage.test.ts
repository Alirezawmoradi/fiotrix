import { afterEach, describe, expect, it, vi } from 'vitest'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

function throwing(): never {
  throw new DOMException('Storage unavailable', 'QuotaExceededError')
}

describe('storage', () => {
  it('writes, reads and removes values', () => {
    expect(writeStorage('key', 'value')).toBe(true)
    expect(readStorage('key')).toBe('value')
    removeStorage('key')
    expect(readStorage('key')).toBeNull()
  })

  it('returns null for missing keys', () => {
    expect(readStorage('missing')).toBeNull()
  })

  it('reports a failed write instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwing)
    expect(writeStorage('key', 'value')).toBe(false)
  })

  it('returns null when reading throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(throwing)
    expect(readStorage('key')).toBeNull()
  })

  it('ignores errors when removing', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(throwing)
    expect(() => removeStorage('key')).not.toThrow()
  })
})
