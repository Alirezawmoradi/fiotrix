import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const SW_TEMPLATE = fileURLToPath(new URL('./src/sw/sw-template.js', import.meta.url))

/**
 * Emits `sw.js` from `src/sw/sw-template.js` with the build's file list.
 *
 * Vite gives built files content-hashed names, so the service worker cannot
 * hard-code what to precache. This plugin runs after Vite has emitted every
 * file (including index.html), lists them plus the `public/` files, and
 * derives the cache version from their contents, so each build gets a new
 * cache and old ones are cleaned up on activation.
 */
function serviceWorker(): Plugin {
  let base = '/'
  let publicDir = ''

  return {
    name: 'service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      base = config.base
      publicDir = config.publicDir
    },
    generateBundle(_options, bundle) {
      const files = new Map<string, string | Uint8Array>()
      for (const output of Object.values(bundle)) {
        files.set(output.fileName, output.type === 'chunk' ? output.code : output.source)
      }
      for (const entry of readdirSync(publicDir, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile()) continue
        const path = `${entry.parentPath}/${entry.name}`
        files.set(relative(publicDir, path).replaceAll('\\', '/'), readFileSync(path))
      }

      const fileNames = [...files.keys()].filter((name) => !name.endsWith('.map')).sort()
      const hash = createHash('sha256')
      for (const name of fileNames) hash.update(name).update(files.get(name) ?? '')

      const source = fillPlaceholders(readFileSync(SW_TEMPLATE, 'utf8'), {
        __PRECACHE_URLS__: fileNames.map((name) => base + name),
        __CACHE_VERSION__: hash.digest('hex').slice(0, 12),
      })

      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

/** Replaces each placeholder with its JSON value; fails the build unless it occurs exactly once. */
function fillPlaceholders(template: string, values: Record<string, unknown>): string {
  let result = template
  for (const [placeholder, value] of Object.entries(values)) {
    const occurrences = result.split(placeholder).length - 1
    if (occurrences !== 1) {
      throw new Error(
        `sw-template.js must contain ${placeholder} exactly once (found ${occurrences})`,
      )
    }
    result = result.replace(placeholder, JSON.stringify(value))
  }
  return result
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serviceWorker()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**', 'src/components/**', 'src/sw/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
      reporter: ['text', 'html'],
    },
  },
})
