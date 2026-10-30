export interface SearchOptions {
  caseSensitive: boolean
  wholeWord: boolean
}

export interface MatchRange {
  /** Inclusive offset in the ORIGINAL text. */
  start: number
  /** Exclusive offset in the ORIGINAL text. */
  end: number
}

export interface Suggestion {
  /** Original form as it appears in the text (most frequent casing). */
  word: string
  /** Number of occurrences in the text. */
  count: number
}

export type Segment =
  { kind: 'text'; text: string } | { kind: 'match'; text: string; matchIndex: number }
