import { cleanup } from '@testing-library/vue'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock browser APIs that jsdom does not implement but PrimeVue requires
globalThis.matchMedia = query => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})

globalThis.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe() {}

  unobserve() {}

  disconnect() {}
}

afterEach(() => {
  cleanup()
})
