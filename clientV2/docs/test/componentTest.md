# Component Testing in This Vue App (Vitest + Testing Library)

This project’s component tests are written with Vitest + @testing-library/vue (Vue Testing Library). The goal is to test components the way a user experiences them: render the component, find UI by accessible queries, interact via userEvent, and assert on visible behavior.

## What we use

*   **Test runner:** Vitest (JSDOM environment) - defined in `vitest.config`
*   **Renderer + queries:** `@testing-library/vue` (e.g. `render`, `screen`, `waitFor`)
*   **User interactions:** `@testing-library/user-event` (click, type, etc.)
*   **DOM matchers:** `@testing-library/jest-dom` (e.g. `toBeInTheDocument`) - setup in `setupTests`

## Test file placement and naming

Most tests live near the code they test (feature/component folders), and are picked up by Vitest via these globs:

*   `src/**/*.{test,spec}.{js,jsx,ts,tsx}`
*   `tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}`

Example: `MyComponent.test.js` tests `MyComponent.vue` in the same feature area.

## Our “default render” helper: renderWithProviders

Most components assume certain global app context exists (Pinia, injected worker, PrimeVue). To avoid repeating setup in every test, use:

```javascript
renderWithProviders(MyComponent, {
  props: { ... },
  worker: { ... },       // optional override
  withPrimeVue: true,    // optional
})
```

**What it does:**
1.  Registers Pinia
2.  Provides an injected worker object (token + user identity)
3.  Optionally installs PrimeVue (see `utils`)

This keeps tests consistent and reduces “random failing because provider missing.”

## Global test setup (polyfills / cleanup)

Vitest runs in JSDOM, which is missing some browser APIs that UI libraries expect. We handle that centrally in `setupTests.js`.

*   Imports `jest-dom` matchers
*   Mocks `ResizeObserver` (PrimeVue components often require it)
*   Cleans up the DOM after each test (via Testing Library cleanup)

Vitest loads this file automatically via `setupFiles` in `vitest.config`.

## When to mock per-test vs globally

*   Put generally needed polyfills (`ResizeObserver`) in `setupTests.js`.
*   Put component-specific hacks (like `matchMedia` for a single PrimeVue widget) inside that test file, so it’s obvious why it exists and doesn’t leak into unrelated tests.

## The basic testing pattern we follow

### 1) Render in a realistic state

If the component is conditionally shown, render it in the “visible” state and provide required props.

```javascript
renderWithProviders(MyComponent, {
  props: {
    visible: true,
    itemId: '12345',
    itemName: 'Test Item'
  }
})
```

### 2) Wait for the UI to be ready

Use `waitFor` when the component’s content depends on async updates, transitions, or computed state.

Example: waiting until a title is present before asserting anything else.

### 3) Query the DOM like a user would

Prefer accessible queries in this order:
1.  `getByRole` (best)
2.  `getByLabelText`
3.  `getByText`

Examples:
```javascript
screen.getByRole('radio', { name: 'Option A' })
screen.getByLabelText('Enter your username')
```

Avoid testing internal implementation details (component instance methods, private state, etc.) unless absolutely necessary.

### 4) Interact using userEvent

Use `const user = userEvent.setup()` and then await `user.click(...)`. This better matches real browser behavior than firing events manually.

### 5) Assert on behavior, not structure

Good assertions:
*   text exists / doesn’t exist
*   correct controls appear for a selected mode
*   clicking a button calls the right action with the right payload
*   emitted events are correct

Example checks:
*   Default format is 'Standard', so "Standard fields" appears.
*   Selecting 'Advanced' reveals advanced options.
*   Switching sort order changes the displayed list.

## Mocking strategy

### Mock external modules at the boundary

In component tests, we typically mock:
*   API helpers
*   Composables that access environment or global config
*   “Do the thing” utility functions (exports, downloads, etc.)

Example:
*   `useEnv()` is mocked so the component doesn’t depend on a real environment.
*   `handleExportAction()` is mocked so we can assert it was called with correct params, without actually performing the action.

### Prefer “assert it was called with X” over “re-implement the logic”

Your test verifies:
1.  Clicking "Submit" calls `handleSubmit` once.
2.  Params include the correct data + selected options.

That’s the right level of integration for a component test.

## Testing emitted events

When a component should notify a parent, assert emitted events rather than inspecting internal state.

Example:
clicking the close button should emit `update:visible` with `[false]`.

This keeps tests aligned with the public component API.

## Checklist for writing a new component test

1.  [ ] Render with `renderWithProviders` if the component expects Pinia / worker / PrimeVue.
2.  [ ] Mock boundary dependencies (env composables, API helpers, heavy utils).
3.  [ ] Add polyfills only when needed (prefer global `setupTests.js` for common ones).
4.  [ ] Use `waitFor` when the UI appears after async updates.
5.  [ ] Interact via `userEvent` and assert user-visible behavior.
