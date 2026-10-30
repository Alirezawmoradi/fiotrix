import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement element scrolling; give it a no-op tests can spy on.
Element.prototype.scrollTo = function scrollTo(): void {}

afterEach(() => {
  cleanup()
})
