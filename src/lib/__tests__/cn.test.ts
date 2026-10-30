import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('joins class names with a space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('drops falsy values', () => {
    const isActive = false
    expect(cn('base', isActive && 'active', null, undefined, '', 'end')).toBe('base end')
  })

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null)).toBe('')
  })
})
