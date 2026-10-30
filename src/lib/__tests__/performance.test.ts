import { describe, expect, it } from 'vitest'
import { sampleText } from '@/data/sampleText'
import { findMatches } from '@/lib/findMatches'
import { normalizeText } from '@/lib/normalize'
import { groupMatchesByParagraph, splitParagraphs } from '@/lib/paragraphs'
import { buildIndex } from '@/lib/searchIndex'
import { suggest } from '@/lib/suggest'

const ONE_MB = 1024 * 1024
const largeText = sampleText.repeat(Math.ceil(ONE_MB / sampleText.length)).slice(0, ONE_MB)

function time<T>(run: () => T): { result: T; ms: number } {
  const start = performance.now()
  const result = run()
  return { result, ms: performance.now() - start }
}

// Loose timing guards: they catch accidental algorithmic regressions
// (e.g. normalizing or re-indexing per keystroke), not micro-benchmarks.
describe('performance on ~1MB of text', () => {
  const options = { caseSensitive: false, wholeWord: false }
  const normalized = normalizeText(largeText, options.caseSensitive)

  it('finds matches in under 50ms on pre-normalized text', () => {
    const { result, ms } = time(() => findMatches(largeText, 'search', options, normalized))
    console.info(`findMatches: ${result.length} matches in ${ms.toFixed(1)}ms`)
    expect(result.length).toBeGreaterThan(100)
    expect(ms).toBeLessThan(50)
  })

  it('finds whole-word matches in under 50ms', () => {
    const { ms } = time(() =>
      findMatches(largeText, 'react', { ...options, wholeWord: true }, normalized),
    )
    expect(ms).toBeLessThan(50)
  })

  it('suggests from a prebuilt index in under 5ms', () => {
    const index = buildIndex(largeText)
    const { result, ms } = time(() => suggest(index, 'se'))
    expect(result.length).toBeGreaterThan(0)
    expect(ms).toBeLessThan(5)
  })
})

describe('one keystroke on ~2MB of text', () => {
  const options = { caseSensitive: false, wholeWord: false }
  const hugeText = largeText + largeText
  // These are computed once per text, not per keystroke.
  const normalized = normalizeText(hugeText, options.caseSensitive)
  const paragraphs = splitParagraphs(hugeText)
  const index = buildIndex(hugeText)

  it('computes matches, their paragraphs and suggestions in under 50ms', () => {
    const { ms } = time(() => {
      const matches = findMatches(hugeText, 'search', options, normalized)
      groupMatchesByParagraph(paragraphs, matches)
      suggest(index, 'search')
    })
    console.info(`keystroke on 2MB: ${ms.toFixed(1)}ms`)
    expect(ms).toBeLessThan(50)
  })
})
