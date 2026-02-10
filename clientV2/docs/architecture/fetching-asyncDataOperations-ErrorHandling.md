# Async Data Fetching & Error Handling

This document describes the standard approach for performing async work, fetching data, and handling errors in this codebase. The goal is to avoid unhandled promise rejections, prevent duplicated error UI, and make error behavior predictable and explicit.

## Core Idea (Mental Model)

**`useAsyncState` converts async failures into reactive state instead of control flow.** Errors become data that the UI can react to, rather than exceptions that break execution.

## Standard Flow

1.  An async function (often from `apiClient`) is executed.
2.  If it fails, it throws.
3.  `useAsyncState` catches the error.
4.  The error is stored in reactive state.
5.  The component decides how (or if) the error is shown.
6.  Global error UI is **triggered by default** but can be opted out of.

## Responsibilities by Layer

### `apiClient`
The API layer is responsible for data access, authentication injection, and error normalization. It provides a consistent interface for making HTTP requests while abstracting away boilerplate like headers and token management.

#### Core Functions

- **`apiFetch(path, opts)`**: The low-level wrapper around `fetch`.
    - Automatically injects the Authorization header.
    - Sets `Accept: application/json` by default.
    - Handles JSON serialization if `opts.json` is provided.
    - **`path`**: Can be a relative path (e.g., `/stigs`) or a full URL.
    - **`opts.json`**: Pass a JS object here to have it automatically stringified and the `Content-Type` header set to `application/json`.
    - **`opts.rawBody`**: Use this for `FormData` or `Blob` payloads where you need browser-managed headers.
    - **`opts.responseType`**: defaults to `'json'`, but can be `'text'` or `'blob'`.

- **`apiCall(operationId, params, body, opts)`**: The OpenAPI-aware wrapper.
    - Ensures you are calling a valid operation from the spec.
    - Constructs the URL based on the operation's path template and parameters.
    - Ideal for maintaining contract correctness.
    - Uses `apiFetch` internally.

- **`api` Helper Object**: Syntactic sugar for common HTTP verbs. (used with apiFetch)
    - `api.get(path, opts)`
    - `api.post(path, body, opts)` -> internally uses `json: body`
    - `api.put(path, body, opts)` -> internally uses `json: body`
    - `api.patch(path, body, opts)` -> internally uses `json: body`
    - `api.del(path, opts)`

#### Error Handling in Client
It throws `ApiError` on non-2xx responses. This error object contains:
- `status`: HTTP status code.
- `url`: The URL that was requested.
- `body`: The parsed error response body (if JSON) or text.

**Note:** The client never triggers UI logic (like alerts or modals) directly. It purely throws errors for the consumer (usually `useAsyncState`) to handle.

```javascript
// Example Usage
import { api, apiCall } from '@/shared/api/apiClient.js'

// Simple GET
const data = await api.get('/stigs')

// POST with JSON body using helper
await api.post('/stigs', { name: 'New STIG' })

// Low-level fetch with specific options
await apiFetch('/custom/endpoint', {
  method: 'PUT',
  json: { complex: 'data' },
  headers: { 'X-Custom': 'value' }
})

// Using strict OpenAPI operation (Preferred for API calls)
await apiCall('getStigById', { collectionId: 1, stigId: 'stig-1' })
```

### `useAsyncState`
This is the async lifecycle and state orchestration layer. It executes async functions, always catches errors, converts failures into reactive state, and **triggers the global error modal by default**.

```javascript
// src/shared/composables/useAsyncState.js
// ...
try {
  const result = await promiseFactory(...args)
  // ...
}
catch (e) {
  error.value = e
  if (onError) onError(e) // Defaults to triggering global error
  // ...
  return null
}
// ...
```

### Components
Components decide how errors are presented. They can rely on the default global error modal or opt-out to handle errors locally. Components should **not** expect `execute()` to throw.

### `useGlobalError`
This manages the global error state and modal. It is triggered automatically by `useAsyncState` unless configured otherwise.

## What Happens on Error in `useAsyncState`

When an error occurs inside `execute()`:
*   The error is stored in `error.value`.
*   Loading flags are updated (`isLoading.value = false`).
*   Data remains `null` (or keeps stale state if configured).
*   `execute()` returns `null`.
*   The error is **not** rethrown.
*   **By default, the global error modal is triggered.**

## Error Handling Patterns

### Global Blocking Errors (Default)
This is the default behavior. If the async operation fails, the global error modal appears. You don't need to do anything extra.

```javascript
// Inherits default onError behavior (triggers global modal)
useAsyncState(api.getSomeData)
```

### Silencing Errors (Opt-Out)
If you want to handle errors silently (or just ignore them) and NOT show the global modal, pass `onError: null`.

```javascript
useAsyncState(api.getBackgroundData, {
  onError: null // Disables default global error trigger
})
```

### Custom Local Handling (Override)
If you want to handle errors locally (e.g., inline UI) instead of the global modal, provide a custom `onError` callback. This replaces the default handler.

```javascript
const { execute, error } = useAsyncState(api.getSearchData, {
  onError: (err) => {
    // Custom logic here (logging, toast, etc.)
    // Global modal is NOT triggered unless you explicitly call it
    console.error('Search failed', err)
  }
})

// In template:
// <div v-if="error">Search failed: {{ error.message }}</div>
```

### Non-API Async Work
`useAsyncState` behaves the same for API calls and non-API async functions. Any thrown or rejected error becomes reactive state and triggers the global error default.

## Skipping `useAsyncState`

If `apiClient` is called directly without `useAsyncState`, errors will throw and the caller is responsible for handling them with `try/catch` or relying on app-level error handlers.

## What Not to Do

*   **Do not** trigger global error UI inside `apiClient`.
*   **Do not** expect `execute()` to throw.
*   **Do not** wrap `execute()` in `try/catch` unless intentionally overriding behavior.
*   **Do not** unintentionally show both inline and global error UI for the same failure (unless desired).

## Summary

*   The API layer throws.
*   `useAsyncState` catches and triggers global error by default.
*   Errors become reactive state.
*   Pass `onError: null` to opt-out of global errors.
*   Pass a function to `onError` to override/customize handling.
