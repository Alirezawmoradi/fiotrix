# Smart Search Reader

A small installable web app (PWA) for searching inside a long text quickly and precisely. It is built with React and TypeScript, and it ships no runtime dependencies other than `react` and `react-dom`.

<!-- TODO: add a screenshot or GIF here, e.g. docs/demo.gif -->

## Features

- **Instant search** in a built-in English and Persian demo text, with match-case and whole-word options
- **Highlighted matches** that animate in, with a distinct, pulsing active match
- **Result navigation** with a `3 / 12` counter and up/down arrows, both in the header and beside the active match; moving wraps around and scrolls the match to the center
- **Autocomplete** for the word being typed, with occurrence counts, plus your recent searches when the input is empty
- **Offline support and installation** on desktop and mobile, with a prompt when a new version is available
- **Persian and English** both work: right-to-left text, Arabic and Persian letter variants (`ي`/`ی`, `ك`/`ک`), and Persian, Arabic and ASCII digits are treated as the same when searching
- **Accessibility**: full keyboard use, screen reader support, reduced-motion support, and light and dark themes

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

| Command                 | What it does                                     |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Start the development server                     |
| `npm run build`         | Type-check and build for production into `dist/` |
| `npm run preview`       | Serve the production build locally               |
| `npm test`              | Run the tests once                               |
| `npm run test:watch`    | Run the tests in watch mode                      |
| `npm run test:coverage` | Run the tests with a coverage report             |
| `npm run typecheck`     | Type-check only                                  |
| `npm run lint`          | Run ESLint                                       |
| `npm run format`        | Format with Prettier                             |
| `npm run icons`         | Regenerate the PWA icons                         |

### Testing offline and install

The service worker is only registered in production builds, so use the preview server:

```bash
npm run build
npm run preview
```

Then open the printed URL in Chrome:

1. **Offline:** in DevTools, check under Application → Service workers that `sw.js` is activated. Tick "Offline" in the Network tab and reload. The app should open and search should still work.
2. **Install:** click the **Install** button in the header, or the install icon in the address bar.
3. **Update toast:** with the app open, change some text, rebuild, and reload the tab. "New version available" should appear.

Browsers only allow service workers and installation on HTTPS or `localhost`. Opening the app through your computer's network address (`http://192.168.x.x`) works for everything except these features. To test them on a phone, serve the app over HTTPS.

## Keyboard shortcuts

| Keys                                    | Action                                      |
| --------------------------------------- | ------------------------------------------- |
| `Ctrl/Cmd + F`                          | Focus the search input                      |
| `Enter` / `Shift + Enter`               | Next / previous match (in the search input) |
| `F3` / `Shift + F3`                     | Next / previous match                       |
| `Ctrl/Cmd + G` / `Shift + Ctrl/Cmd + G` | Next / previous match                       |
| `↓` / `↑`                               | Move through suggestions                    |
| `Enter` or `Tab`                        | Accept the highlighted suggestion           |
| `Esc`                                   | Close the suggestions                       |

Shortcuts use the physical key, so they also work on a Persian keyboard layout.

## Architecture

```
src/
  App.tsx        Composes the hooks and components
  index.css      Tailwind import, theme tokens and keyframes (the only CSS file)
  types.ts       Shared types
  data/          The demo text
  lib/           Pure logic with no React: normalizing, matching, indexing, suggestions
  hooks/         Behaviour: search state, navigation, scrolling, autocomplete, PWA state
  components/    Small presentational components
  sw/            Service worker template and registration
scripts/         Icon generator (Node, no dependencies)
vite.config.ts   Includes the small plugin that generates sw.js
```

Data flows in one direction, and the expensive steps run only when their input changes:

```
text ──► normalized text, word index          once per text (useMemo)
query ──► deferred query                      useDeferredValue
deferred query + normalized text ──► matches  indexOf scan
matches ──► matches per paragraph ──► segments
segments ──► memoized paragraphs with <mark>  only changed paragraphs re-render
```

Search state lives in custom hooks composed in `App`. Every component that uses it is a direct child or close descendant of `App`, so no state library is needed.

## Key decisions and trade-offs

**No libraries beyond React.** Each feature here fits in a small amount of readable code, and fewer dependencies mean a smaller download and less to review. Tailwind, Vitest and the other tools are dev dependencies and add no runtime JavaScript.

**Length-preserving normalization.** Search runs on a normalized copy of the text. Every UTF-16 code unit maps to exactly one code unit, so a match's offset in the normalized copy is also its offset in the original, and no mapping table is needed. The cost: characters whose lowercase form has a different length (such as `İ`) stay as they are, and diacritics are not stripped.

**`indexOf` instead of a regular expression built from user input.** It runs in linear time, needs no escaping, and cannot be abused for catastrophic backtracking. Whole-word matching is a separate check of the characters on either side of each hit.

**Sorted array and binary search for autocomplete, not a trie.** A sorted array is simpler and more compact, and binary search finds the first candidate in `O(log n)`. Words sharing a prefix sit next to each other, so the walk that follows is short. Plain code-unit comparison is used for both sorting and searching, so the two always agree.

**`useDeferredValue` instead of a debounce.** A debounce adds a fixed delay on every device. A deferred value keeps the input responsive and renders results at lower priority, so results appear immediately on fast devices and React adapts on slow ones.

**Paragraph-level memoization.** The text is split into memoized paragraphs. Moving to the next match re-renders only the one or two paragraphs involved, and paragraphs without matches do not re-render while typing.

**Highlight animations without transforms.** `<mark>` must stay inline so that highlighted phrases can wrap across lines, and CSS transforms do not apply to inline elements. The appear effect therefore uses `background-color` and `box-shadow`. A new search remounts only the marks, never the paragraphs, to replay it.

**Hand-written service worker and a small Vite plugin, not a PWA plugin.** Vite gives built files hashed names, so the worker needs the build's file list. A plugin of about 40 lines collects that list, hashes the file contents into a cache version, and fills in `src/sw/sw-template.js`. Pages are network-first with the cached app as the offline fallback, and assets are cache-first.

**Considered but not used:**

- **Web Worker for search.** Not needed at this size: the logic of one keystroke takes about 22 ms on a 2 MB text in the performance test (Node, on a development machine). It would be the next step for much larger texts.
- **CSS Custom Highlight API.** Rejected because `::highlight()` cannot animate the way this design requires.

## Testing

Tests use Vitest and Testing Library on jsdom. They cover the pure logic in `src/lib`, the hooks, the components and the main flows through `App`, plus loose timing checks on large texts.

jsdom does not lay out pages, run CSS or run service workers, so animations, scrolling, offline behaviour and installation need checking in a real browser, as described above.
