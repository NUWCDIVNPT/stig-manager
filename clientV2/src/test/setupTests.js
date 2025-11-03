import { cleanup } from '@testing-library/vue'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './testServer' // if using MSW
import '@testing-library/jest-dom'

afterEach(() => {
  cleanup()
  server.resetHandlers() // idk how i feel abbout this
})

// MSW setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
