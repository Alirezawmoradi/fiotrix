import { describe, expect, it } from 'vitest'
import { buildIndex } from '@/lib/searchIndex'

describe('buildIndex', () => {
  it('stores unique normalized words in code-unit order', () => {
    const index = buildIndex('banana Apple cherry apple BANANA')
    expect(index.words).toEqual(['apple', 'banana', 'cherry'])
  })

  it('counts occurrences case-insensitively', () => {
    const index = buildIndex('React react REACT hooks')
    expect(index.counts.get('react')).toBe(3)
    expect(index.counts.get('hooks')).toBe(1)
  })

  it('keeps the most common original form for display', () => {
    const index = buildIndex('React react React REACT')
    expect(index.display.get('react')).toBe('React')
  })

  it('keeps the first seen form on a tie', () => {
    const index = buildIndex('react React')
    expect(index.display.get('react')).toBe('react')
  })

  it('unifies Arabic and Persian letters into one entry', () => {
    const index = buildIndex('كتاب کتاب کتاب')
    expect(index.words).toEqual(['کتاب'])
    expect(index.counts.get('کتاب')).toBe(3)
    expect(index.display.get('کتاب')).toBe('کتاب')
  })

  it('handles empty text', () => {
    expect(buildIndex('').words).toEqual([])
  })
})
