import { cleanup } from '@testing-library/vue'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './testServer' // if using MSW
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
  server.resetHandlers() // idk how i feel abbout this
})

// MSW setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
