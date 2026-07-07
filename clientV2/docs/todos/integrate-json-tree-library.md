# Integrate JSON Tree Library for Structured Data Rendering

We need to select, install, and integrate a Vue 3 compatible JSON tree rendering library to support clean, interactive, and structured visualization of raw/complex data formats across various areas of the application.

## Key Use Cases

1. **Last Claims Tab (Users Management)**:
   * Render the structured claims dictionary returned by the backend under `statistics.lastClaims`.
   * Expand/collapse nested keys.
   * Format dates, arrays, and scopes cleanly.

2. **JSON Web Token (JWT) Inspector / Debugger**:
   * Render decrypted token payloads for administrators to debug scope and identity assignments.

3. **API Error Details Modals**:
   * Render verbose nested error objects returned from backend API failures to help users/admins troubleshoot.

## Candidates & Requirements

* **Library Options**:
  * `vue-json-pretty` (highly active, customizable styling, Vue 3 support).
  * `vue3-json-viewer` (simple, fast, lightweight).
* **Requirements**:
  * Must support dark-mode styling/variables matching our UI theme.
  * Must support deep expansion by default (or configurable expand depth).
  * Must handle primitive formatting (e.g. converting Unix timestamp values or long string arrays like `scope` into clean lists/dates).
  * Must be performant with large JSON objects.

## Tasks

- [ ] Evaluate JSON tree libraries (`vue-json-pretty`, etc.) for bundle size, features, and Vue 3 compatibility.
- [ ] Install selected library via `npm install`.
- [ ] Create a common wrapper component (e.g., `JsonTreeViewer.vue`) to encapsulate global configuration, CSS overrides, and custom transformers (like dates/scopes).
- [ ] Integrate into `LastClaims.vue` component.
- [ ] Integrate into OIDC / Token debugging views if applicable.
- [ ] Integrate into application error modals/handling systems.
