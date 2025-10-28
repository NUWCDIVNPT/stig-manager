import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/vue'
import '@testing-library/jest-dom'
import { server } from './testServer' // if using MSW

// Clean up between tests
afterEach(() => {
  cleanup()
})

// MSW setup
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
