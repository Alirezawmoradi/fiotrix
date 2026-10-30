import { describe, expect, it } from 'vitest'
import { tokenize } from '@/lib/tokenize'

describe('tokenize', () => {
  it('splits words and records their offsets', () => {
    expect(tokenize('Hello, world!')).toEqual([
      { word: 'Hello', start: 0 },
      { word: 'world', start: 7 },
    ])
  })

  it('keeps digits and underscores inside words', () => {
    expect(tokenize('my_var2 = 42').map((t) => t.word)).toEqual(['my_var2', '42'])
  })

  it('handles Persian words and splits on the zero-width non-joiner', () => {
    expect(tokenize('برنامه‌های وب، سریع').map((t) => t.word)).toEqual([
      'برنامه',
      'های',
      'وب',
      'سریع',
    ])
  })

  it('keeps combining marks attached to their word', () => {
    expect(tokenize('café کتابً').map((t) => t.word)).toEqual(['café', 'کتابً'])
  })

  it('returns an empty list for text without words', () => {
    expect(tokenize('  ... !!! ')).toEqual([])
  })
})
