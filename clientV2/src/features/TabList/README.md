# TabList Feature README

## Overview
The TabList feature provides a modular, testable tab navigation component for the application. It is designed for both developer onboarding and AI agent context, supporting dynamic tab management, robust testability, and seamless integration with global state and layout systems.

## Directory Structure
```
TabList/
├── components/
│   └── TabList.vue
├── composeables/
│   └── useTabList.js
├── tests/
    ├── TabList.test.js
    └── useTabList.test.js
```

## Architecture & Design
- **TabList.vue**: Main tab navigation component. Handles dynamic tab rendering, tab selection, and layout adjustments. All tabs are assigned unique IDs for testability and automation.
- **useTabList.js**: Composable for tab state management, selection logic, and integration with global state (e.g., classification banners, Pinia store).
- **Testing**: All logic is colocated with tests. `TabList.test.js` covers component behavior, while `useTabList.test.js` covers composable logic. Tests use Vitest and Testing Library for robust coverage.

## Key Technologies
- **Vue 3**: Component framework.
- **Pinia**: Global state management (classification, noTokenMessage, etc.).
- **PrimeVue**: UI components (if used for tab styling).
- **Vitest**: Unit and integration testing.
- **Testing Library**: DOM-based test assertions.
- **MSW**: API mocking for tests.

## Integration Points
- **Global State**: Uses Pinia for classification and layout state. Ensure Pinia is initialized before using TabList.
- **Dynamic Layout**: Adjusts height/layout via CSS variables based on classification banners.
- **API**: If tabs are API-driven, use the centralized API client and mock with MSW in tests.

## Development Guidelines
- Add new tab-related features in `components/` and supporting logic in `composeables/`.
- Always colocate tests in `tests/` and use descriptive test IDs in the component.
- For onboarding, see project README for environment setup and linting.
- Follow the feature-based folder structure for maintainability and AI context clarity.

## AI Context & Onboarding
- This README is designed for both human developers and AI agents. It provides all necessary context for feature maintenance, extension, and automated reasoning.
- For AI-driven work, ensure all new logic is documented, testable, and follows the established patterns.

## Example Usage
```vue
<!-- TabList.vue usage in a parent component -->
<TabList :tabs="tabs" :selectedTab="selectedTab" @tab-select="onTabSelect" />
```

## Testing Example
```js
// TabList.test.js
import { fireEvent, render } from '@testing-library/vue'
import TabList from '../components/TabList.vue'

test('renders tabs and handles selection', async () => {
  const { getByTestId } = render(TabList, { props: { tabs: ['A', 'B'], selectedTab: 'A' } })
  await fireEvent.click(getByTestId('tab-B'))
  // ...assertions
})
```
