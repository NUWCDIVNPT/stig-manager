import { cleanup } from '@testing-library/vue'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom'

// Mock ResizeObserver for PrimeVue components
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
