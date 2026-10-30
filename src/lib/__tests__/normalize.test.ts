import { describe, expect, it } from 'vitest'
import { normalizeChar, normalizeText } from '@/lib/normalize'

describe('normalizeChar', () => {
  it('lowercases when case-insensitive', () => {
    expect(normalizeChar('A', false)).toBe('a')
  })

  it('keeps case when case-sensitive', () => {
    expect(normalizeChar('A', true)).toBe('A')
  })

  it('keeps chars whose lowercase form has a different length', () => {
    // 'İ'.toLowerCase() === 'i̇' (two code units)
    expect('İ'.toLowerCase()).toHaveLength(2)
    expect(normalizeChar('İ', false)).toBe('İ')
  })

  it('unifies Arabic yeh and kaf with their Persian forms', () => {
    expect(normalizeChar('ي', false)).toBe('ی')
    expect(normalizeChar('ك', true)).toBe('ک')
  })

  it('maps Persian and Arabic digits to ASCII digits', () => {
    expect('۰۱۲۳۴۵۶۷۸۹'.split('').map((ch) => normalizeChar(ch, false))).toEqual(
      '0123456789'.split(''),
    )
    expect('٠١٢٣٤٥٦٧٨٩'.split('').map((ch) => normalizeChar(ch, false))).toEqual(
      '0123456789'.split(''),
    )
  })
})

describe('normalizeText', () => {
  const inputs = [
    '',
    'Hello World',
    'İstanbul İİİ',
    'كتاب جستجوي ۱۴۰۳ ١٤٠٣',
    'emoji 😀 and 𐐀 (Deseret capital)',
    'ẞ ǅ ΐ ﬀ',
  ]

  it.each(inputs)('preserves length for %j', (input) => {
    expect(normalizeText(input, false)).toHaveLength(input.length)
    expect(normalizeText(input, true)).toHaveLength(input.length)
  })

  it('normalizes a mixed Persian/English string', () => {
    expect(normalizeText('React كتاب ۱۴۰۳', false)).toBe('react کتاب 1403')
    expect(normalizeText('React كتاب ۱۴۰۳', true)).toBe('React کتاب 1403')
  })
})
