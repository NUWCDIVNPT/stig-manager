import { cleanup } from '@testing-library/vue'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './testServer' // if using MSW
import '@testing-library/jest-dom'

// Clean up between tests
afterEach(() => {
  cleanup()
})

// MSW setup
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
