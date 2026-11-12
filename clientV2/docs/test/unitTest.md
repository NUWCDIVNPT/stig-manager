# Unit Testing in This Vue App (Vitest)

This project uses Vitest for unit testing. The goal of unit tests is to verify logic in isolation—testing utility functions, stores, and composables without rendering Vue components.

## What we use

*   **Test runner:** Vitest (JSDOM environment)
*   **Assertions:** Chai (built-in to Vitest via `expect`)
*   **Mocking:** `vi` (Vitest's mocking utility, compatible with Jest)

## Test file placement and naming

Unit tests are typically co-located with the source file or placed in a `tests` subdirectory within the feature folder.

*   `src/features/MyFeature/myUtils.js`
*   `src/features/MyFeature/tests/myUtils.test.js`

## The basic testing pattern

We follow the Arrange-Act-Assert pattern.

1.  **Arrange:** Set up inputs and mock dependencies.
2.  **Act:** Call the function under test.
3.  **Assert:** Verify the output or side effects (e.g., API calls).

### Example: Testing a Pure Function

For pure logic that doesn't depend on external modules.

```javascript
describe('formatDisplayName', () => {
  it('should format first and last name correctly', () => {
    const result = formatDisplayName({ first: 'John', last: 'Doe' })
    expect(result).toBe('Doe, John')
  })

  it('should handle missing last name', () => {
    const result = formatDisplayName({ first: 'Cher' })
    expect(result).toBe('Cher')
  })
})
```

## Mocking Strategy

When testing functions that have side effects (API calls, file downloads, browser globals), we must mock the dependencies to keep the test isolated.

### Mocking External Modules

Use `vi.mock` to replace imports with mock functions (`vi.fn()`).

```javascript
import { apiCall } from '@/shared/api/apiClient.js'
import { fetchData } from '../myUtils.js'

// Mock the dependency
vi.mock('@/shared/api/apiClient.js', () => ({
  apiCall: vi.fn(),
}))

describe('fetchData', () => {
  it('should call the API with correct parameters', async () => {
    // Arrange
    const mockResponse = { id: 1, name: 'Test' }
    apiCall.mockResolvedValue(mockResponse)

    // Act
    const result = await fetchData('123')

    // Assert
    expect(apiCall).toHaveBeenCalledWith('endpoint/123')
    expect(result).toEqual(mockResponse)
  })
})
```

### Mocking Globals

Sometimes you need to mock browser globals like `fetch` or `window`.

```javascript
beforeEach(() => {
  globalThis.fetch = vi.fn()
})

it('should handle fetch errors', async () => {
  globalThis.fetch.mockRejectedValue(new Error('Network Error'))

  await expect(myAsyncFunction()).rejects.toThrow('Network Error')
})
```

## Testing Async Logic

Use `async/await` for testing Promises.

*   **Success path:** Resolve the mock (`mockResolvedValue`) and await the function result.
*   **Error path:** Reject the mock (`mockRejectedValue`) and assert that the function handles the error or throws.

```javascript
it('should catch errors and trigger global error handler', async () => {
  // Arrange
  const error = new Error('API Failed')
  apiCall.mockRejectedValue(error)

  // Act
  await myAction()

  // Assert
  expect(triggerErrorMock).toHaveBeenCalledWith(error)
})
```

## Checklist for writing a new unit test

1.  [ ] **Isolate the function:** Ensure you are testing *only* the target function, not its dependencies.
2.  [ ] **Mock external calls:** Identify all imports that perform side effects (API, file system, etc.) and mock them.
3.  [ ] **Reset mocks:** Use `beforeEach(() => vi.clearAllMocks())` to prevent test pollution.
4.  [ ] **Test success:** Verify the happy path returns expected data.
5.  [ ] **Test edge cases:** Pass null, undefined, or empty arrays to ensure robustness.
6.  [ ] **Test errors:** Force dependencies to throw errors and verify your code handles them (e.g., try/catch blocks).

## Recommended Structure

```javascript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { myFunction } from '../myFile.js'

// 1. Mock dependencies
vi.mock('../dependency.js')

describe('myFile', () => {
  // 2. Setup/Teardown
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 3. Group by function
  describe('myFunction', () => {
    it('does X when Y', () => {
      // Test code
    })
  })
})
```
