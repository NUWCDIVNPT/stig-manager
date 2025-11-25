# NavTree Feature

## Overview

The NavTree feature provides a collapsible navigation drawer for the STIG Manager application. It displays hierarchical navigation items including collections, app management sections, STIG library sections, and settings. The navigation tree supports keyboard navigation, peek mode (temporary overlay), and persists open/closed state.

## User-Facing Functionality

- **Collapsible Drawer**: Users can toggle the navigation drawer open/closed via a tab button
- **Peek Mode**: Hover over the tab to temporarily peek at navigation without fully opening
- **Collections Management**: Displays a dynamic list of collections fetched from the API
- **Keyboard Navigation**: Close the drawer with the Escape key
- **Outside Click**: Clicking outside the drawer in peek mode closes it
- **Static Navigation Sections**: App Management, STIG Library, and Display Settings with predefined items
- **Node Selection**: Clicking a navigation item emits selection events to open content in tabs

## Architecture

### Component Hierarchy

```
NavTree (root orchestrator)
├── NavTreeTab (toggle button/tab on left edge)
├── NavTreeDrawer (drawer container)
│   ├── NavTreeHeader (logout, close, branding)
│   └── NavTreeContent (tree view with nodes)
```

### State Management

**Store**: `navTreeStore.js` (located in `src/shared/stores/`)
- Pinia store for managing navigation selection state
- Manages `selectedData` (currently selected node)
- Provides `select(node)` method to update selection

**Purpose**: Share selected navigation node across the app so other features can react to navigation changes.

### Data Flow

1. **Data Fetching**: `useNavTreeData` composable uses TanStack Query to fetch collections from `/api/collections`
2. **Node Building**: `useNavTreeNodes` composable merges API collections with static config to build the full tree structure
3. **Rendering**: `NavTreeContent` receives nodes and renders the tree
4. **Selection**: When a node is clicked, it's stored in `navTreeStore` and passed to parent components via events

### Key Composables

#### `useNavTreeData.js`
Fetches collections from the API using TanStack Query.

**Returns:**
- `collections` - Computed array of collection objects
- `loading` - Computed boolean indicating fetch state
- `error` - Computed error object if fetch fails

**Dependencies:**
- Injects `worker` (OIDC worker) to get the auth token
- Uses `fetchCollections` from `navTreeApi.js`

#### `useNavTreeNodes.js`
Transforms raw collections data and config into a hierarchical node structure for the tree view.

**Parameters:**
- `collections` - Ref/computed collections from API
- `config` - Static navigation config object

**Returns:**
- Computed array of root-level navigation nodes

**Node Structure:**
```js
{
  key: 'unique-key',           // Unique identifier
  label: 'Display Name',       // Human-readable label
  component: 'ComponentName',  // Component to render in tab
  icon: 'icon-class',          // Icon class name
  data: { ...extraData },      // Additional data (collection object, etc.)
  children: [ ...childNodes ], // Nested nodes (optional)
}
```

**Logic:**
1. Maps API collections to child nodes under "Collections" section
2. Adds a "Create New Collection..." action node at the top
3. Merges collections section with static sections from config
4. Returns final hierarchical structure

#### `useKeyboardNav.js`
Provides keyboard event handling for the navigation drawer.

**Parameters:**
- Object mapping key names to callback functions

**Example:**
```js
useKeyboardNav({ Escape: () => closePeek() })
```

#### `useOutsideClick.js`
Detects clicks outside a target element and triggers a callback.

**Parameters:**
- `targetRef` - Ref to the element to watch
- `callback` - Function to call on outside click
- `options` - `{ active: Ref<boolean> }` - Only active when true

**Use Case**: Close peek mode when clicking outside the drawer.

### Configuration

**File**: `navTreeConfig.js`

Defines static navigation sections and their children. Each section has:
- `key` - Unique identifier
- `label` - Display name
- `icon` - Icon class
- `children` - Array of child nodes (optional)

**Sections:**
1. **App Management** - Collections, Users, User Groups, STIG Benchmarks, Service Jobs, App Info, Export/Import
2. **STIG Library** - Categorized STIG folders (A-E, F-M, N-V, W-Z)
3. **Display Settings** - What's New, Theme Settings

**Dynamic Section**: Collections are fetched from the API and merged into the tree at runtime.

### API Integration

**File**: `navTreeApi.js`

**`fetchCollections(token)`**
- Fetches collections from `/api/collections`
- Requires Bearer token for authorization
- Returns JSON array of collection objects

**Collection Object Shape:**
```js
{
  collectionId: 123,
  name: "Collection Name",
  // ...other fields
}
```

## Component Details

### NavTree.vue
**Purpose**: Root orchestrator for the navigation feature.

**Props**: None (uses v-model)

**v-model:**
- `open` - Boolean controlling drawer visibility
- `peekMode` - Boolean for temporary overlay mode

**Logic:**
- Fetches collections via `useNavTreeData`
- Builds node tree via `useNavTreeNodes`
- Manages peek/open/close interactions
- Handles keyboard navigation (Escape key)
- Detects outside clicks to close peek mode

**Events:**
- `@node-select` - Emitted when a tree node is clicked

### NavTreeDrawer.vue
**Purpose**: The actual drawer container with positioning and animation.

**Props:**
- `visible` - Boolean, controls drawer open/closed state
- `peekMode` - Boolean, adds peek mode styling (offset from edge)

**Styling:**
- Fixed positioning on left edge
- Animated slide-in/out transition
- Background color, border radius
- Dynamic height based on classification banner (uses `--banner-height` CSS variable)

**CSS Variables:**
- `--banner-height` - Height of classification banner (injected via global state)

### NavTreeContent.vue
**Purpose**: Renders the tree structure with expand/collapse and selection.

**Props:**
- `nodes` - Array of root-level nodes
- `loading` - Boolean for loading state

**Features:**
- Recursive tree rendering
- Expand/collapse parent nodes
- Select leaf nodes
- Icon support
- Loading indicator

**Events:**
- `@node-select` - Emitted when a selectable node is clicked

### NavTreeHeader.vue
**Purpose**: Header section with branding, logout, and close button.

**Props**: None

**Events:**
- `@logout` - Emitted when logout button is clicked
- `@close` - Emitted when close button is clicked

### NavTreeTab.vue
**Purpose**: The tab button on the left edge to open/peek the drawer.

**Props:**
- `peekMode` - Boolean indicating if drawer is in peek mode

**Events:**
- `@peak` - Emitted on hover (for peek mode)
- `@open` - Emitted on click (for full open)

**Styling:**
- Fixed position on left edge
- Vertical text orientation
- Hover effects

### CreateCollectionModal.vue
**Purpose**: Modal for creating a new collection (triggered from the "Create New Collection..." node).

**Status**: Present in components but not fully integrated yet.

## Testing

### Test Files
- `useNavTreeData.test.js` - Tests data fetching logic
- `NavTree.test.js` - Integration test for NavTree component
- `NavTreeContent.test.js` - Tests tree rendering and interaction
- `NavTreeDrawer.test.js` - Tests drawer visibility and positioning
- `NavTreeTab.test.js` - Tests tab button behavior

### Mock Data
- `collectionHandlers.js` - MSW handlers for mocking `/api/collections`

### Test Utilities
Tests use `renderWithProviders()` from `src/testUtils/utils.js` to render components with:
- Pinia (state management)
- TanStack Query (data fetching)
- PrimeVue (UI components)
- Mock OIDC worker with test token

## Future Enhancements

### Planned Features
- **Create Collection Modal**: Integrate `CreateCollectionModal.vue` to allow creating collections inline
- **Context Menus**: Right-click collection nodes for edit/delete/permissions actions
- **Search/Filter**: Add search bar in header to filter navigation items
- **Drag & Drop**: Reorder collections or move items between sections
- **Badges**: Show counts or status indicators on nodes (e.g., number of assets in a collection)
- **Persist State**: Remember which nodes are expanded across sessions

## Development Guidelines

### Adding a New Static Navigation Item

1. Edit `navTreeConfig.js`
2. Add a new object to the appropriate section's `children` array:
```js
{
  key: 'MyNewItem',
  component: 'MyNewComponent',
  label: 'My New Item',
  icon: 'icon-my-icon',
}
```
3. Ensure the component is registered/available in the tab system

### Adding a New Dynamic Section

1. Create a composable to fetch the data (similar to `useNavTreeData`)
2. Update `useNavTreeNodes` to merge the new data into the tree structure
3. Add appropriate MSW mock handlers for tests

### Modifying Node Structure

If you need to add fields to nodes:
1. Update `useNavTreeNodes.js` to include new fields
2. Update `NavTreeContent.vue` to consume/render new fields
3. Update tests to verify new fields are handled correctly

### Styling Guidelines

- Use CSS variables for colors and spacing when possible
- Maintain dark theme compatibility
- Ensure drawer height accounts for classification banner via `--banner-height`
- Use transitions for smooth open/close animations

## AI Context Summary

**What this feature does:**
Provides a slide-out navigation drawer with hierarchical navigation items. Fetches collections from API, merges with static config, and renders an interactive tree. Supports keyboard nav, peek mode, and selection state management.

**Key files:**
- `NavTree.vue` - Root component
- `useNavTreeData.js` - Fetches collections
- `useNavTreeNodes.js` - Builds tree structure
- `navTreeConfig.js` - Static navigation config
- `navTreeStore.js` (in `src/shared/stores/`) - Selection state store

**Data flow:**
API → `useNavTreeData` → `useNavTreeNodes` → `NavTreeContent` → User clicks → `navTreeStore` + parent events

**Common tasks:**
- Add nav item: Edit `navTreeConfig.js`
- Change fetch logic: Edit `useNavTreeData.js`
- Modify tree structure: Edit `useNavTreeNodes.js`
- Update styling: Edit `NavTreeDrawer.vue` or `NavTreeContent.vue`
- Add tests: Add files to `tests/`, use `renderWithProviders()`
