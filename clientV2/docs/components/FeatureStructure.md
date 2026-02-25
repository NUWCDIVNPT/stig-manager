# Feature Directory Structure

We organize our codebase by **Feature**, not by file type. This keeps related code together and makes the codebase easier to navigate and maintain.

## Excepted Structure

When creating a new feature (e.g., `src/features/CollectionMetrics`), follow this standard structure:

```text
src/features/MyFeature/
├── api/                  # API calls and service functions
│   └── myFeatureApi.js
├── components/           # Vue components
│   ├── MainComponent.vue
│   └── SubComponent.vue
├── composables/          # Reusable logic and state management
│   └── useMyFeature.js
├── tests/                # Unit and Component tests
│   ├── MainComponent.test.js
│   └── myFeatureApi.test.js
└── index.js              # Optional: Export public feature API
```

### Why this works
*   **Discoverability:** Everything related to "Collection Metrics" is in one place.
*   **Scalability:** The `components` folder prevents the feature root from getting cluttered.
*   **Separation of Concerns:** Logic lives in `composables`, data fetching in `api`, and UI in `components`.

## Patterns to Avoid (What NOT To Do)

### ❌ 1. Grouping by File Type globally
Don't put all your components in `src/components` and all your API calls in `src/api` unless they are truly global and shared across the entire application.

**Bad:**
```text
src/
├── api/
│   ├── collectionMetricsApi.js
│   └── userApi.js
├── components/
│   ├── CollectionMetrics.vue
│   └── UserProfile.vue
```

### ❌ 2. Flat Feature Directories
Don't dump everything into the root of the feature folder. It becomes impossible to scan once you have more than 5-6 files.

**Bad:**
```text
src/features/CollectionMetrics/
├── CollectionMetrics.vue
├── CollectionMetrics.test.js
├── api.js
├── utils.js
├── modal.vue
├── graph.vue
└── store.js
```

### ❌ 3. Circular Dependencies
Avoid importing unrelated features into your feature. If `Feature A` needs `Feature B`, consider if `Feature B` should be in `shared/` or if the dependency direction is correct.
