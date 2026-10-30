# Smart Search Reader — Implementation Plan

> This file is the single source of truth for the project. Read it fully before writing any code.
> Work **phase by phase**. After each phase: run `npm run typecheck`, `npm run lint`, `npm test`, fix everything, then stop and summarize what was done before moving on.

---

## 1. Goal

Build a **PWA** with **React + TypeScript** that lets users search keywords inside a text quickly and precisely, with:

1. Keyword input and visible search results.
2. Matched words **highlighted in the text**, with **animation**.
3. **Search suggestions (autocomplete)**.
4. **Offline support** and **installable** on devices (mobile + desktop).
5. **Multi-result navigation**: when a term matches several places, up/down arrow buttons appear automatically next to the results; clicking them smoothly scrolls to the previous/next match.
6. A **counter** showing how many matches were found and which one is active (e.g. `3 / 12`).

The app searches a **single built-in demo text** (`src/data/sampleText.ts`). Users cannot paste or upload their own text.

### Evaluation priorities (from the task brief)
- Search must be **instant and efficient** on large texts.
- **Smooth** highlight animations and **scroll synced** to the active match position.
- Works **offline** and is **installable** on mobile.
- **Clean, readable, well-structured code** is the main focus.
- **Avoid unnecessary libraries.** Runtime dependencies are ONLY `react` and `react-dom`. No UI kits, no state libraries, no search libraries, no animation libraries, no PWA plugins. Dev dependencies are allowed for tooling only (Vite, TypeScript, ESLint, Vitest, Testing Library).

---

## 2. Tech stack & conventions

- **Vite** + **React 18+** + **TypeScript** (`strict: true`, `noUncheckedIndexedAccess: true`).
- Styling: **Tailwind CSS v4** via the official Vite plugin (`@tailwindcss/vite`), installed as a **devDependency** (it's build-time only, nothing ships at runtime).
  - All styling via utility classes in components. No CSS Modules, no styled-components.
  - Global stuff lives in one file, `src/index.css`: `@import "tailwindcss";`, theme tokens in `@theme { ... }` (highlight colors, active-match color, animation names), custom `@keyframes` for highlight animations, and the few things utilities can't express cleanly.
  - Light/dark via Tailwind's default `dark:` variant (follows `prefers-color-scheme`).
  - Reduced motion via `motion-reduce:` / `motion-safe:` variants.
  - Do NOT add `clsx`/`classnames`/`tailwind-merge`. Write a tiny `cn(...classes)` helper in `src/lib/cn.ts` (filters falsy values and joins with a space).
  - Keep class lists readable: if a component's class list gets long or repeated, extract it into a named constant in the same file rather than duplicating it.
- Tests: **Vitest** + **@testing-library/react** + **jsdom** (dev only).
- Lint/format: ESLint (typescript-eslint, react-hooks plugin) + Prettier.
- Code rules:
  - Pure logic (search, tokenizing, normalization) lives in `src/lib/` as **pure functions with no React imports**, fully unit-tested.
  - Components are small and presentational; behaviour lives in custom hooks.
  - No `any`. Explicit return types on exported functions.
  - Named exports only (except where a tool requires default).
  - Every file has one clear responsibility. Prefer readability over cleverness.
- Text direction: content may be **Persian (RTL) or English (LTR)**. Use `dir="auto"` on the text and input; UI must work in both.

### npm scripts
```
dev, build, preview, typecheck (tsc --noEmit), lint, test, test:watch
```

---

## 3. Folder structure

```
src/
  main.tsx                  # mount + register service worker
  App.tsx                   # layout composition only
  index.css                 # Tailwind import, @theme tokens, @keyframes (the ONLY css file)

  lib/                      # pure logic, no React
    normalize.ts            # length-preserving text normalization
    tokenize.ts             # split text into words with offsets
    searchIndex.ts          # build index: sorted unique words + frequencies
    findMatches.ts          # find all match ranges for a query
    suggest.ts              # prefix-based autocomplete from index
    segments.ts             # split text into plain/match segments for rendering
    storage.ts              # safe localStorage wrapper (try/catch)
    cn.ts                   # tiny className join helper (no clsx)
    __tests__/              # unit tests for every file above

  hooks/
    useSearch.ts            # query state, deferred search, matches, active index
    useMatchNavigation.ts   # next/prev/wrap-around, keyboard shortcuts
    useScrollToActive.ts    # smooth scroll active match into view
    useAutocomplete.ts      # suggestion list state + keyboard handling
    useInstallPrompt.ts     # beforeinstallprompt handling
    useOnlineStatus.ts      # navigator.onLine + events

  components/
    SearchBar/              # input + options (case-sensitive, whole word)
    Autocomplete/           # accessible combobox listbox
    MatchNavigator/         # ▲ ▼ buttons + "3 / 12" counter
    TextViewer/             # renders text with <mark> highlights
    InstallButton/
    OfflineBadge/

  data/
    sampleText.ts           # the demo text that is searched (mix of Persian + English paragraphs, ~20k+ chars)

  types.ts                  # shared types (MatchRange, Suggestion, SearchOptions...)

public/
  manifest.webmanifest
  icons/                    # 192, 512, maskable-512, apple-touch-icon (generate simple SVG→PNG icons)
  offline-fallback not needed (app shell is fully cached)

vite.config.ts              # includes a small custom plugin that generates sw.js (see Phase 7)
src/sw/sw-template.ts or sw-template.js  # service worker source
```

---

## 4. Core types (`src/types.ts`)

```ts
export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

export interface MatchRange {
  start: number; // inclusive offset in the ORIGINAL text
  end: number;   // exclusive
}

export interface Suggestion {
  word: string;   // original form as it appears in text (most frequent casing)
  count: number;  // occurrences in the text
}

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'match'; text: string; matchIndex: number };
```

---

## 5. Phases

### Phase 1 — Project setup
- **The project has ALREADY been scaffolded by the user with Vite (React + TypeScript template). Do NOT run `npm create vite` or re-scaffold, and do not delete or overwrite the user's setup files without reason.**
- First, inspect what exists (`package.json`, `vite.config.ts`, `tsconfig*.json`, `src/`) and report it briefly.
- Then add only what's missing:
  - **Install and configure Tailwind CSS v4 yourself** (the user has NOT installed it): `npm install -D tailwindcss @tailwindcss/vite`, add the `tailwindcss()` plugin to `vite.config.ts`, replace the contents of `src/index.css` with `@import "tailwindcss";` (plus the `@theme` tokens later), and make sure it's imported in `main.tsx`. Verify it works by applying a utility class in `App.tsx` and running the dev server/build.
  - Remove Vite template leftovers (`App.css`, demo counter, logos) — the default template CSS must not conflict with Tailwind.
  - Strict TS (`strict`, `noUncheckedIndexedAccess`), ESLint, Prettier (+ `prettier-plugin-tailwindcss` as devDependency to sort classes), Vitest (jsdom), path alias `@/` → `src/` (in both `tsconfig` and `vite.config.ts`).
- Create the folder structure above with placeholder files.
- Basic layout in `App.tsx`: sticky header (search bar area) + scrollable text area.
- Add `sampleText.ts` with a long realistic text containing repeated words (so multi-match is visible), both Persian and English paragraphs.

**Done when:** `npm run dev` shows the layout with sample text; typecheck, lint and an example test pass.

---

### Phase 2 — Search engine (pure logic, test-first)

#### `normalize.ts`
- `normalizeChar(ch, caseSensitive)`; `normalizeText(text, caseSensitive)`.
- **Must be length-preserving** (output length === input length) so match offsets map 1:1 to the original text. This is critical — explain it in a comment.
  - Lowercase each char individually; if `ch.toLowerCase()` has length ≠ 1 (e.g. `'İ'`), keep the original char.
  - Persian/Arabic unification, 1:1: `ي → ی`, `ك → ک`, Arabic digits/Persian digits → ASCII digits (`۰-۹`, `٠-٩` → `0-9`).
- Do NOT remove characters (diacritics etc.) — that would break offsets.

#### `findMatches.ts`
- `findMatches(text, query, options): MatchRange[]`
- Normalize text and query with the same function, trim query, return `[]` for empty query.
- Loop with `indexOf(query, fromIndex)` — O(n) scan, no regex built from user input (avoids escaping bugs and ReDoS).
- `wholeWord`: accept a hit only if the chars before/after are not word characters. Word char = Unicode letter/number: `/[\p{L}\p{N}_]/u`.
- Non-overlapping matches; advance `fromIndex` by query length.
- Supports multi-word phrases naturally (it's substring search).
- **Cache normalized text**: the normalized text is computed once per (text, caseSensitive) and memoized (in the hook via `useMemo`), not on every keystroke.

#### `tokenize.ts` + `searchIndex.ts`
- `tokenize(text)` → words using `/[\p{L}\p{N}_]+/gu` (handles Persian).
- `buildIndex(text)` → `{ words: string[] (sorted, normalized, unique), counts: Map<string, number>, display: Map<string, string> }`. `display` keeps the most common original casing for showing in suggestions.
- Built **once per text** (memoized), not per keystroke.

#### `suggest.ts`
- `suggest(index, prefix, limit = 8): Suggestion[]`
- Use **binary search** on the sorted `words` array to find the first word ≥ prefix, then walk forward while words start with the prefix. O(log n + k).
- Uses the **last word** of the query as the prefix (so typing `"react ho"` suggests completions for `ho` and replaces only the last word on select).
- Rank results: higher count first, then shorter, then alphabetical. Exclude a word identical to the prefix only if it's the only option? → Keep it simple: include exact match too (it shows its count, which is useful).
- Use `localeCompare` consistently for sorting AND binary search (or plain `<` comparison consistently — pick one and document it; plain code-unit comparison is simpler and correct for prefix search).

#### `segments.ts`
- `buildSegments(text, matches): Segment[]` — splits text into alternating text/match segments for rendering.

#### Tests (required)
- normalize: length preserved for every input incl. `'İ'`, Persian ی/ک unification, digits.
- findMatches: empty query, no results, multiple results, case-sensitive on/off, whole-word on/off, Persian text, phrase with spaces, match at start/end of text, overlapping pattern like `"aa"` in `"aaaa"` → 2 matches.
- suggest: prefix in middle of sorted list, no matches, limit respected, ranking order, Persian prefix.
- buildSegments: correct reconstruction (joining segments === original text).
- A simple performance test: 1MB text, `findMatches` completes in < 50ms (just log/assert loosely).

**Done when:** all lib tests pass with good coverage.

---

### Phase 3 — Search UI + highlighting

#### `useSearch`
- State: `query`, `options`, `activeIndex`.
- Use **`useDeferredValue(query)`** so typing stays responsive while matching runs at lower priority. No artificial debounce delay needed; note this decision in a comment.
- `matches = useMemo(() => findMatches(...), [normalizedText, deferredQuery, options])`.
- Reset `activeIndex` to 0 when the query/options change.
- Expose: `matches`, `total`, `activeIndex`, `setActiveIndex`, `isStale` (query !== deferredQuery, for a subtle loading indicator).

#### `TextViewer`
- Split text into **paragraphs** (by `\n`), and render each paragraph as a **memoized** component (`React.memo`). Pass each paragraph only its own matches (with global match indexes) and whether it contains the active match. This way, moving to next match only re-renders the 1–2 affected paragraphs — important for performance on long texts.
- Matches render as `<mark data-match-index={i}>`. Active match gets an extra class + `aria-current="true"`.
- Container is the scroll element (`overflow-y: auto`), `dir="auto"` per paragraph.

#### `SearchBar`
- Input (`type="search"`, `dir="auto"`, autofocus, clear button), toggles for **Case sensitive** and **Whole word**.
- Shows result summary: “12 results” / “No results” (with `aria-live="polite"`).

**Done when:** typing highlights all matches instantly; long sample text stays smooth while typing.

---

### Phase 4 — Highlight animations
All animation in **CSS via Tailwind** (no JS animation libs).
- Define the keyframes (`highlight-in`, `active-pulse`) in `src/index.css` and register them as theme animations in `@theme` (e.g. `--animate-highlight-in: highlight-in 250ms ease-out;`) so components use `animate-highlight-in`, `motion-reduce:animate-none`.
- Highlight colors as theme tokens (`--color-highlight`, `--color-highlight-active`) with dark-mode values, used as `bg-highlight`, `bg-highlight-active`.
- Use Tailwind's `box-decoration-clone` utility for marks.

- **Appear animation**: when a query changes, marks animate in (background grows from transparent → highlight color with a short scale/pop, ~250ms). To re-trigger the animation on each new query, key the paragraph's marks by the deferred query (or toggle a class) — choose the approach that does not remount the whole text.
- **Active match**: distinct, stronger color (CSS variable) + a short “pulse” keyframe when it becomes active + `transition: background-color, box-shadow` for smooth change between active/inactive.
- Use `box-decoration-break: clone` so marks wrapping across lines look right.
- Use only `transform`, `opacity`, `background-color`, `box-shadow` (cheap to animate).
- Respect reduced motion with `motion-reduce:` variants → disable keyframes, keep color change.
- Colors defined as `@theme` tokens for light & dark with good contrast.

**Done when:** highlights visibly but subtly animate in; the active match pulses; reduced-motion is respected.

---

### Phase 5 — Multi-result navigation + scroll sync

#### `useMatchNavigation`
- `next()`, `prev()` with **wrap-around** (last → first, first → last).
- Keyboard: `Enter` = next, `Shift+Enter` = prev (when focus is in the input and the autocomplete is closed), `F3` / `Shift+F3`, `Ctrl/Cmd+G` / `Shift+Ctrl/Cmd+G`. `Ctrl/Cmd+F` focuses our search input (preventDefault).

#### `MatchNavigator`
- ▲ / ▼ icon buttons (inline SVG, no icon libraries) + counter `activeIndex+1 / total`.
- **Appears automatically only when total > 1** (animate in/out with CSS), shows just the count when total === 1, hidden at 0.
- Placed in the sticky header next to the search input so it is always reachable.
- Additionally, a small **floating navigator** positioned beside the active match inside the text area (the task says arrows appear next to the results): absolutely positioned within the scroll container, aligned to the active `<mark>` via `offsetTop` relative to the container (no scroll listeners needed when positioned inside the scrolling content). It moves with a CSS `transition: transform` when the active match changes. Hide it if total ≤ 1.
- Buttons have `aria-label`s (“Previous result”, “Next result”); counter has `aria-live="polite"`.

#### `useScrollToActive`
- When `activeIndex` (or matches) changes, find `container.querySelector('[data-match-index="i"]')` and call `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- Only scroll the **text container**, not the whole page (make sure layout is header + container with its own scroll; or use manual `container.scrollTo({ top, behavior: 'smooth' })` computed from `offsetTop` — preferred, gives full control and avoids scrolling ancestors).
- Use `behavior: 'auto'` when reduced motion is preferred.
- Run in `useLayoutEffect`/`requestAnimationFrame` after the DOM has the new active mark.
- On a new query, scroll to the first match automatically.

**Done when:** with many results, arrows appear, counter is correct, clicking/keyboard moves smoothly to each match, wrap-around works, scroll is centered on the match.

---

### Phase 6 — Autocomplete

#### `useAutocomplete`
- Inputs: query, index. Output: `suggestions`, `isOpen`, `highlightedIndex`, handlers.
- Opens while typing when there are suggestions; closes on `Escape`, blur (with small delay to allow click), or selection.
- Keyboard: `ArrowDown`/`ArrowUp` move through suggestions, `Enter`/`Tab` selects highlighted one, `Escape` closes. When closed, `Enter` falls back to match navigation (Phase 5).
- On select: replace the last word of the query with the suggestion, keep focus in input.
- **Recent searches**: when input is empty and focused, show the last 5 searches (stored via `storage.ts`, saved when the user navigates results or selects a suggestion — not on every keystroke).

#### `Autocomplete` component — accessible combobox (WAI-ARIA 1.2 pattern)
- Input: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`.
- List: `role="listbox"`, items `role="option"` with `aria-selected`.
- Each suggestion shows the **matched prefix in bold** and the **occurrence count** badge (e.g. `react   12`).
- Mouse hover updates highlighted item; use `onMouseDown` + `preventDefault` to avoid input blur before click.
- Subtle open/close animation (CSS).

**Done when:** suggestions appear instantly, fully keyboard operable, counts shown, works for Persian.

---

### Phase 7 — PWA: offline + installable (no plugins)

#### Manifest — `public/manifest.webmanifest`
- `name`, `short_name`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `background_color`, `theme_color`, `dir: "auto"`, `lang`.
- Icons: 192×192, 512×512, and a 512×512 `"purpose": "maskable"`. Also `apple-touch-icon` link in `index.html`, plus `<meta name="theme-color">`, and `apple-mobile-web-app-capable` meta for iOS.
- Generate simple icons (a magnifier glyph) — create an SVG and export PNGs (a tiny Node script using no extra deps is fine, or commit pre-made PNGs).

#### Service worker — hand-written
- Problem: Vite outputs hashed file names, so the SW must know the build's asset list.
- Solution: a **small custom Vite plugin** inside `vite.config.ts` (~30 lines) that, in `generateBundle`, collects all emitted file names from the bundle (+ `index.html`, manifest, icons) and emits `sw.js` from a template, injecting:
  - `PRECACHE_URLS` array
  - `CACHE_VERSION` (hash of the asset list, so every build gets a new cache)
- SW behaviour:
  - `install`: open `cache-${CACHE_VERSION}`, `addAll(PRECACHE_URLS)`.
  - `activate`: delete old caches, `clients.claim()`.
  - `fetch` (GET, same-origin only):
    - Navigation requests → **network-first**, fall back to cached `index.html` (so the app opens offline).
    - Static assets → **cache-first**, fall back to network and put the response in cache.
  - Listen for a `SKIP_WAITING` message.
- Register in `main.tsx` **only in production** (`import.meta.env.PROD`), after `window.load`.
- **Update flow**: when a new SW is waiting, show a small toast “New version available — Reload”; clicking posts `SKIP_WAITING` and reloads on `controllerchange`.

#### `useInstallPrompt` + `InstallButton`
- Capture `beforeinstallprompt` (preventDefault, store event), show an **Install** button; on click call `prompt()` and handle `userChoice`. Hide after `appinstalled` or when running standalone (`matchMedia('(display-mode: standalone)')`).
- On iOS Safari (no `beforeinstallprompt`): show a small hint “Share → Add to Home Screen”.

#### `useOnlineStatus` + `OfflineBadge`
- Show a small badge when offline (“Offline — everything still works”).

**Done when:** `npm run build && npm run preview` → Lighthouse PWA/installability checks pass; DevTools “Offline” + reload still opens the app and search works; Install button works on Chrome desktop/Android.

---

### Phase 8 — Polish, a11y, responsive
- Mobile-first layout; sticky header; large touch targets (≥ 44px) for arrows and suggestions; `env(safe-area-inset-*)` paddings.
- Visible focus styles, full keyboard usage, `aria-live` announcements for result counts, sufficient color contrast in both themes.
- Empty states: no query, no results (“No results for ‘xyz’”).
- Search must stay fast on very long texts: verify with a generated 1–2MB text in tests (typing must remain responsive).
- Add a component test for: typing → counter shows correct total; clicking ▼ moves active index & wraps; autocomplete keyboard selection.

---

### Phase 9 — README
Write `README.md` (this is part of the deliverable — reviewers will read it):
- What the app does + screenshots/GIF placeholder.
- How to run, build, test, and test offline/install.
- **Architecture overview** (folder structure, data flow: text → memoized index/normalized text → deferred query → matches → segments → memoized paragraphs).
- **Key decisions & trade-offs**, briefly:
  - Why no libraries (and the only runtime deps). Tailwind is build-time only and adds no runtime JS.
  - Length-preserving normalization to keep offsets exact.
  - `indexOf` scan instead of user-built regex.
  - Sorted array + binary search for autocomplete (vs. trie).
  - `useDeferredValue` instead of debounce.
  - Paragraph-level memoization to limit re-renders.
  - Hand-written SW + tiny Vite plugin instead of a PWA plugin.
  - Considered but not needed: Web Worker for search (mention it as a future improvement for very large texts), CSS Custom Highlight API (rejected because `::highlight()` can't animate the way required).
- Keyboard shortcuts table.

---

## 6. Definition of done (whole project)
- [ ] Only `react` and `react-dom` in `dependencies` (Tailwind and all tooling in `devDependencies`).
- [ ] All styling with Tailwind utilities; `src/index.css` is the only CSS file.
- [ ] Typecheck, lint, all tests pass.
- [ ] Typing in search is instant on the sample text and on a ~1MB text.
- [ ] Matches highlighted with smooth animation; active match distinct and pulsing; reduced-motion respected.
- [ ] Arrows appear automatically for >1 result; counter `n / total`; smooth centered scroll; wrap-around; keyboard shortcuts.
- [ ] Autocomplete with counts, accessible, keyboard-operable, Persian works.
- [ ] Works offline after first load; installable; update toast works.
- [ ] Responsive on mobile; RTL/LTR text both correct.
- [ ] README explains architecture and decisions.
