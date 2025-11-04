# STIG Manager Client V2

A modern Vue 3 client application for STIG Manager, built with Vite, PrimeVue, and Pinia.

## Getting Started

### Development

To run the application in development mode:

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

**Note:** You need a running STIG Manager API server for the app to function properly. The API server should be running at the address specified in `.env.development`.

### Production

To build and preview the production bundle:

```bash
npm run build
npm run preview
```

For production deployment, serve the `dist/` folder with a static file server.

## Environment Configuration

### `.env.development`

This file configures the API origin for development mode:

```bash
VITE_API_ORIGIN=http://localhost:64001
```

**Why is this needed?**
- In development, the client runs on `localhost:5173` while the API runs on a different port (e.g., `64001`)
- Vite uses this environment variable to proxy API requests and fetch configuration data
- The app fetches `/op/configuration` and `/op/definition` from the API during bootstrap
- Without this, the app cannot connect to the API server in development

In production, the client is served from the same origin as the API, so this is not needed.

## Project Structure

```
src/
├── auth/                   # Authentication logic (OIDC worker, bootstrap)
├── components/             # Shared/global components
│   └── global/            # App-wide components (banners, overlays)
├── features/              # Feature modules (organized by domain)
│   ├── NavTree/           # Navigation tree feature
│   ├── TabList/           # Tab management feature
│   ├── AssetGrid/         # Asset grid feature
│   └── [FeatureName]/     # Each feature has its own structure:
│       ├── api/           # Feature-specific API calls
│       ├── components/    # Feature components
│       ├── composeables/  # Vue composables (business logic)
│       ├── stores/        # Pinia stores (state management)
│       ├── tests/         # Unit tests for the feature
│       └── mocks/         # MSW mock handlers for testing
├── global-state/          # Global Pinia stores and env config
├── pages/                 # Top-level page components
├── SPAroot/               # Root SPA layout component
└── testUtils/             # Shared test utilities and setup

```

### Adding New Features

To add a new feature:

1. Create a folder under `src/features/[FeatureName]/`
2. Follow the standard feature structure:
   - `api/` - API client methods for this feature
   - `components/` - Vue components
   - `composeables/` - Business logic and data fetching
   - `stores/` - Pinia stores for state management
   - `tests/` - Unit tests using Vitest
   - `mocks/` - MSW handlers for test API responses
3. Export main components from the feature folder
4. Import and use in pages or other features

## Tech Stack

### Core Libraries

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Fast build tool and dev server
- **Pinia** - State management
- **PrimeVue** - UI component library with Material theme
- **TanStack Query (Vue Query)** - Data fetching and caching

### Testing

- **Vitest** - Fast unit test runner (Vite-powered)
- **Testing Library (Vue)** - User-centric component testing
- **MSW (Mock Service Worker)** - API mocking for tests
- **Playwright** - End-to-end testing
- **JSDOM** - DOM implementation for tests

### Development Tools

- **ESLint** - Linting with @antfu/eslint-config
- **Vite Plugin Vue Devtools** - Vue devtools integration
- **TanStack Query Devtools** - Query debugging

## Testing

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

- Tests are colocated with features in `[Feature]/tests/`
- Shared test utilities are in `src/testUtils/`
- Test setup is in `src/testUtils/setupTests.js`
- Use `renderWithProviders()` helper to render components with Pinia, Vue Query, and PrimeVue
- Mock API responses using MSW in `[Feature]/mocks/`

### Example Test

```javascript
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import MyComponent from '../components/MyComponent.vue'

describe('mycomponent', () => {
  it('renders the component', () => {
    const { getByText } = renderWithProviders(MyComponent)
    expect(getByText('Hello')).toBeTruthy()
  })
})
```

## Linting

This project uses **ESLint** with [@antfu/eslint-config](https://github.com/antfu/eslint-config) for consistent code style.

### Running the Linter

```bash
# Check for lint errors
npm run lint

# Fix auto-fixable errors
npm run lint:fix
```

### VSCode Setup

For the best development experience, use the following VSCode settings (`.vscode/settings.json`):

```json
{
  // Disable the default formatter, use eslint instead
  "prettier.enable": false,
  "editor.formatOnSave": false,

  // Auto fix
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },

  // Silent the stylistic rules in your IDE, but still auto fix them
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "warn", "fixable": true },
    { "rule": "format/*", "severity": "warn", "fixable": true },
    { "rule": "*-indent", "severity": "warn", "fixable": true },
    { "rule": "*-spacing", "severity": "warn", "fixable": true },
    { "rule": "*-spaces", "severity": "warn", "fixable": true },
    { "rule": "*-order", "severity": "warn", "fixable": true },
    { "rule": "*-dangle", "severity": "warn", "fixable": true },
    { "rule": "*-newline", "severity": "warn", "fixable": true },
    { "rule": "*quotes", "severity": "warn", "fixable": true },
    { "rule": "*semi", "severity": "warn", "fixable": true }
  ],

  // Enable eslint for all supported languages
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "jsonc",
    "yaml",
    "toml",
    "xml",
    "gql",
    "graphql",
    "astro",
    "svelte",
    "css",
    "less",
    "scss",
    "pcss",
    "postcss"
  ]
}
```

This configuration:
- Disables Prettier in favor of ESLint formatting
- Auto-fixes lint errors on save
- Shows stylistic rules as warnings instead of errors
- Enables ESLint for multiple file types

### Lint Rules

The project follows:
- No semicolons
- Single quotes
- 2-space indentation
- Trailing commas where valid
- Import sorting and organization

ESLint will auto-fix most style issues when you save files in VSCode.

## Architecture Notes

- **Global State**: Managed with Pinia stores in `src/global-state/`
- **Authentication**: OIDC-based auth using a SharedWorker in `src/auth/`
- **Environment Bootstrap**: App fetches `/op/configuration` and `/op/definition` on startup
- **Feature-based**: Code is organized by feature/domain, not by file type
- **Composition API**: All components use `<script setup>` syntax
