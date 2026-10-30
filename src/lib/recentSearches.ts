export const MAX_RECENT_SEARCHES = 5

/**
 * Puts `query` at the front of the list (newest first), removing an older
 * duplicate and keeping at most `limit` entries. Returns the same array when
 * nothing changes, so React can skip the update.
 */
export function addRecentSearch(
  recent: readonly string[],
  query: string,
  limit = MAX_RECENT_SEARCHES,
): readonly string[] {
  const trimmed = query.trim()
  if (trimmed === '' || recent[0] === trimmed) return recent
  return [trimmed, ...recent.filter((entry) => entry !== trimmed)].slice(0, limit)
}

/** Reads a stored list defensively: anything malformed yields an empty list. */
export function parseRecentSearches(raw: string | null): string[] {
  if (raw === null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.every((entry) => typeof entry === 'string')
      ? parsed.slice(0, MAX_RECENT_SEARCHES)
      : []
  } catch {
    return []
  }
}
