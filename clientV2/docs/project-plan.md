# ClientV2 Project Plan

Plan for the Vue 3 client rewrite of STIG Manager. Organized into phases with parallel tracks where possible.

---

## Current State Summary

### Built & Working
- **Infrastructure:** Auth bootstrap, OIDC worker, routing (hash-based), Pinia stores (globalApp, globalAuth, useEnv, selectedCollection), smFetch, useAsyncData
- **App Shell:** NavTree (sidebar with tree, peek mode, keyboard nav), MenuBar, GlobalBanner, GlobalErrorModal, GlobalServiceOverlay, ReauthPrompt
- **Collection Dashboard (partial):** CollectionView container, CollectionMetrics overview (Progress donut, CORA, Inventory/Findings/Ages cards, Export), StigsView/AssetsView/LabelsView tab structure, MetricsSummaryGrid (schema-adaptive), StatusFooter
- **Asset Review (scaffolded):** AssetReview container, ReviewForm, ReviewResources, RuleInfo, ChecklistInfo
- **Admin (stubs only):** CollectionManage, UserManage, UserGroupManage, STIGManage, ServiceJobs, AppInfo, ExportImportManage
- **Common components:** Column components (Labels, Percentage, Duration, CountWithTooltip, Asset), CloseButton, Label, BreadcrumbSelect
- **Testing:** Vitest + Testing Library setup, 33 test files (NavTree: 19, CollectionMetrics: 13, Home: 1)
- **Documentation:** feature-list.md, COMPONENT_PLAN.md, reusable-components.md, dev-notes.md

### In Flight
- Senior dev evaluating bootstrap/init process (built vs dev scenarios, Env.js loading)

### Established Patterns
- Feature-based folder structure: `features/Name/{components,api,composables,tests}/`
- Route-as-state (URL drives tabs, selections, review context)
- Schema-adaptive grids (MetricsSummaryGrid detects aggregation type from data shape)
- smFetch for all API calls (token injection, centralized error handling)
- useAsyncData composable (data/isLoading/errorMessage/execute refs)
- Column component tiers: Native (PrimeVue template), Wrapper (custom Column component), Shared (sub-components)
- No semicolons, no explicit colors, no explicit font sizes

---

## Phase 1: Foundation & Shared Components

**Goal:** Build the reusable component library that all features depend on. Solidify patterns so parallel feature work is unblocked.

### 1a. Shared Badge Components
Build the inline badge set used across all grids and panels:
- [ ] `CatBadge` — CAT severity (1/2/3), color-coded, optional label/count
- [ ] `ResultBadge` — Review result (NF/O/NA/NR/I), color-coded
- [ ] `StatusBadge` — Review status (Saved/Submitted/Accepted/Rejected), icon + color
- [ ] `CoraBadge` — CORA percentage inline in grid cells
- [ ] `ResultOriginBadge` — Manual/Evaluate-STIG/tool name/override indicator

**Used by:** Collection Dashboard, Meta Dashboard, Asset Review, Collection Review, Findings

### 1b. Shared Layout & Grid Components
- [ ] `LabelChipGroup` — Multi-label tag display with overflow handling
- [ ] `GridFooterBar` — Refresh button, CSV export, record count (extends/replaces StatusFooter)
- [ ] `MasterDetailLayout` — 2-panel splitter with master grid driving detail grid
- [ ] `ThreeLevelDrilldown` — 3-panel cascading selection layout
- [ ] `LabelFilterDropdown` — Multi-select label filter with chip preview
- [ ] `CollectionFilterDropdown` — Multi-select collection filter

**Used by:** All dashboard and review features

### 1c. Infrastructure Cleanup
- [ ] Fix hard-coded colors in CollectionView.vue (use CSS custom properties)
- [ ] Implement watch simplification (parent resets selections on collectionId change)
- [ ] Standardize folder naming (`composables` not `composeables`)
- [ ] Wire centralized 401 handling in smFetch → globalAuthStore/useGlobalError
- [ ] Resolve bootstrap/init for built vs dev scenarios (senior dev lead)

### 1d. Pattern Documentation
- [ ] Document final component patterns with working examples for team reference
- [ ] Establish test patterns (what to test, how to mock smFetch/useAsyncData)

**Milestone:** Team can build features in parallel using shared components and documented patterns.

---

## Phase 2: Complete Collection Dashboard

**Goal:** Finish the primary read-only view that users land on. This is the most-used screen and validates our grid/metrics patterns.

### 2a. Metrics Grid Completion
- [ ] Wire MetricsSummaryGrid columns with badge components (CatBadge, CoraBadge, ProgressBarCell)
- [ ] STIGs tab: master STIG grid → detail assets/checklists grid (MasterDetailLayout)
- [ ] Assets tab: master asset grid → detail checklists grid (MasterDetailLayout)
- [ ] Labels tab: labels → assets → checklists (ThreeLevelDrilldown or nested MasterDetail)
- [ ] Tally sprites (filter-responsive counts in tab toolbars)

### 2b. Label Filtering
- [ ] LabelFilterDropdown in CollectionView header
- [ ] Wire label filter to metrics overview API calls
- [ ] Wire label filter to all tab grid queries
- [ ] Filter persistence across tab switches

### 2c. Overview Polish
- [ ] Verify all overview cards match legacy client behavior (inventory, findings, ages, CORA)
- [ ] Export metrics functionality (format selection, download)
- [ ] Fetched timestamp with refresh indicator

**Milestone:** Collection Dashboard is fully functional for read-only browsing with filtering.

---

## Phase 3: Core Review Workspaces

**Goal:** Implement the two primary write workflows — where evaluators and reviewers spend most of their time.

### 3a. Asset Review Workspace
The 4-panel layout where an evaluator reviews all checks for one STIG on one asset.

**Checklist Panel (left):**
- [ ] ChecklistGrid with CAT/Group/Rule/Result/Status columns
- [ ] Checklist toolbar (export, import, revisions menu)
- [ ] Filter by result status (All/Open/NF/NA/NR)
- [ ] Title search
- [ ] Group/Rule toggle
- [ ] SCAP result indicator

**Rule Info Panel (center):**
- [ ] RuleInfoPanel (shared) — Rule ID, CAT, title, manual check, fix, other data
- [ ] Collapsible sections

**Review Resources Panel (upper right):**
- [ ] Other Assets tab (same rule on other assets, drag-to-copy)
- [ ] Attachments tab (attach/view/download/delete images)
- [ ] Feedback tab (rejection text)
- [ ] Review History/Log tab

**Review Form Panel (lower right):**
- [ ] ReviewForm: Result dropdown, Detail textarea, Comment textarea
- [ ] Field validation (required/optional per collection settings)
- [ ] Result engine attribution display (manual vs automated)
- [ ] AttributionsDisplay (who evaluated/statused, when)
- [ ] Save/Submit/Accept/Reject actions
- [ ] Dirty state tracking (unsaved changes warning)

### 3b. Collection Review Workspace
The 3-panel layout where a reviewer manages one STIG rule across all assets in a collection.

**Checklist Summary Panel (upper left):**
- [ ] ChecklistSummaryGrid with aggregated counts per rule (O/NF/NA/NR/Submitted/Accepted/Rejected)
- [ ] Summary toolbar with asset count display
- [ ] Summary footer with aggregate totals

**Rule Info Panel (right):**
- [ ] Reuse RuleInfoPanel from Asset Review

**Reviews Panel (bottom):**
- [ ] ReviewsGrid — individual asset reviews with selection checkboxes
- [ ] Reviews toolbar: Accept/Reject/Submit/Unsubmit/Batch Edit buttons
- [ ] Inline review editing
- [ ] BatchEditModal (ReviewForm applied to selected assets)
- [ ] RejectReviewModal (rejection with feedback text)

### 3c. Shared Review Components
- [ ] ReviewForm (shared between Asset Review form and Batch Edit modal)
- [ ] RuleInfoPanel (shared between both workspaces)
- [ ] ChecklistGrid (shared between both workspaces)
- [ ] AttributionsDisplay

**Milestone:** Evaluators and reviewers can perform their core daily workflows.

---

## Phase 4: Supporting Features

**Goal:** Import/export, findings, and collection management — features that support the core workflows.

### 4a. Findings Report
- [ ] FindingsReport container (2-panel layout)
- [ ] AggregatedFindingsGrid (left) — grouped by Rule/Group/CCI
- [ ] IndividualFindingsGrid (right) — per-asset findings
- [ ] Aggregator dropdown and STIG filter
- [ ] GridFooterBar with CSV export

### 4b. Checklist Import/Export
- [ ] Checklist Import modal (CKL/CKLB/XCCDF file parsing)
- [ ] Import options (status mapping per result type, unreviewed handling)
- [ ] Checklist Export (CKL format)
- [ ] Multi-STIG CKL export
- [ ] CKLB format support (STIG Viewer 3)

### 4c. Collection Management
- [ ] Properties tab (name, description, metadata, workflow settings)
- [ ] Grants tab (direct user grants with role assignment)
- [ ] Access Control Rules editor (Collection/Asset/STIG/Label combinations)
- [ ] Effective Access view (per-user calculated access)
- [ ] Users tab (all users with access: direct + group)
- [ ] Labels management (create/edit/assign labels)
- [ ] Assets management (CRUD, label assignment)
- [ ] STIGs management (assign/unassign STIGs to collection)
- [ ] Collection Metadata tab (arbitrary key-value pairs)
- [ ] Review Field Settings (Detail/Comment enable/required)
- [ ] Review Status Settings (reset behavior, accept/reject workflow)
- [ ] Review History Settings (max history 0-15)
- [ ] Import Options Settings (status per result type)

### 4d. Transfer & Batch Operations
- [ ] Transfer Assets to Another Collection
- [ ] Export Results to Another Collection
- [ ] Export Assets CSV
- [ ] Batch Asset Creation from CSV
- [ ] Clone Collection (with options for assets, STIGs, labels, reviews, grants, revision pinning)

**Milestone:** Full collection lifecycle — create, configure, import data, review, export results.

---

## Phase 5: Meta Dashboard, Admin & Polish

**Goal:** Multi-collection views, administrative functions, and feature parity with the legacy client.

### 5a. Meta Dashboard
Reuses Collection Dashboard components with multi-collection data source:
- [ ] MetaDashboard container
- [ ] CollectionFilterDropdown (replaces LabelFilterDropdown)
- [ ] Collections tab: Collections → STIGs → Checklists (ThreeLevelDrilldown)
- [ ] STIGs tab: STIGs → Collections → Checklists (ThreeLevelDrilldown)
- [ ] Overview panel (reuse all Collection Dashboard sections with multi-collection API)

### 5b. Admin Features
- [ ] User Management (status, properties, grants, groups, last OIDC claims)
- [ ] User Group Management (batch grants)
- [ ] STIG Management (library administration)
- [ ] Service Jobs monitoring
- [ ] App Info display
- [ ] Log Stream viewer
- [ ] AppData import/export (backup/restore)

### 5c. STIG Library
- [ ] Browser (navigate STIGs, rules, checks)
- [ ] Differ (compare STIG revisions)
- [ ] Search (full-text rule search)

### 5d. App Shell Completion
- [ ] Dark mode toggle (currently hardcoded dark)
- [ ] What's New dialog/tab
- [ ] Preview tabs (temporary until double-clicked)
- [ ] User preferences/profile
- [ ] Token display
- [ ] Create Collection wizard (shared component)

### 5e. Cross-Cutting Quality
- [ ] Accessibility audit (ARIA labels, keyboard navigation, screen reader testing)
- [ ] Performance profiling (large collections, many assets)
- [ ] Error state handling audit (empty states, network failures, permission errors)
- [ ] Responsive/window resizing behavior

**Milestone:** Feature parity with legacy ExtJS client.

---

## Parallel Work Tracks

These tracks can be worked on simultaneously by different team members once Phase 1 shared components are available:

| Track | Phases | Dependencies |
|-------|--------|--------------|
| **Infrastructure** | Bootstrap/init (in flight), 401 handling, dev tooling | None — can proceed now |
| **Dashboard** | Phase 2 (Collection Dashboard completion) | Phase 1 shared components |
| **Asset Review** | Phase 3a | Phase 1 badges + RuleInfoPanel + ReviewForm |
| **Collection Review** | Phase 3b | Phase 1 badges + RuleInfoPanel + ReviewForm + BatchEditModal |
| **Import/Export** | Phase 4b | Can start design now; API integration after smFetch patterns solid |
| **Collection Mgmt** | Phase 4c | Phase 1 shared components, some overlap with dashboard grids |
| **Admin** | Phase 5b | Mostly independent; can start stubs anytime |

### Suggested Pairing

After Phase 1, two developers can split:
- **Dev A:** Collection Dashboard completion (Phase 2) → Findings Report (4a) → Meta Dashboard (5a)
- **Dev B:** Asset Review (3a) → Collection Review (3b) → Import/Export (4b)
- **Either/Both:** Collection Management (4c), Admin features (5b), Polish (5d/5e)

---

## Loose Timeline

Approximate week ranges. Phases overlap — Phase 2 can start before Phase 1 is fully wrapped, etc. The cleanup/decision items from Phase 1 can be tackled opportunistically throughout.

```
Week    Phase / Focus
─────   ──────────────────────────────────────────────────
1-2     Phase 1: Foundation & cleanup
        - Delete dead code (D13), fix low-hanging items (D15-18)
        - Resolve Pinia decision (D1), race condition fix (D2)
        - Build shared badge components, GridFooterBar
        - Senior dev lands bootstrap/init work
        - Team aligns on remaining DISCUSS items (D6, D8, D10, D19-23)

3-5     Phase 2: Collection Dashboard completion
        - Wire MetricsSummaryGrid with badges, MasterDetailLayout
        - STIGs / Assets / Labels tab drilldowns
        - Label filtering
        - Hardcoded color cleanup (D14) — do it here while touching these files

6-10    Phase 3: Review Workspaces (parallel tracks possible)
        - Track A: Asset Review (4-panel workspace, checklist, rule info, form, resources)
        - Track B: Collection Review (3-panel, batch edit, reject modal)
        - Shared components first (ReviewForm, RuleInfoPanel, ChecklistGrid)

11-14   Phase 4: Supporting Features
        - Findings Report
        - Checklist Import/Export
        - Collection Management (the big one — properties, grants, ACLs, labels, settings)
        - Transfer & batch operations

15+     Phase 5: Meta Dashboard, Admin & Polish
        - Meta Dashboard (reuses Phase 2 components)
        - Admin features (Users, Groups, STIGs, Jobs, AppData)
        - STIG Library
        - App shell completion (dark mode toggle, What's New, preferences)
        - Quality pass (accessibility, performance, error states)
```

These are **not commitments** — they're a rough shape to help sequence work and spot dependencies. Adjust as we learn. The main constraint is the dependency chain: shared components (Phase 1) unblock everything, and review workspaces (Phase 3) are the highest-value user-facing work after the dashboard.

---

## Decision Register

Decisions that were made implicitly during experimentation and need deliberate review before scaling the codebase. Grouped by area.

### State Management

#### D1. Pinia: Keep or Remove? `DISCUSS`

**What happened:** Pinia was adopted early as the "standard" Vue state manager. Four stores were created.

**Audit finding:** None of the four stores use Pinia-specific features (getters, plugins, $subscribe, $patch, $reset, store composition, devtools). Every store is a single reactive field with a setter. The codebase already has a working alternative pattern — `useGlobalError.js` uses a module-level `ref()` with an exported composable, achieving the same result with zero dependencies.

| Store | Fields | Consumers | Pinia features used |
|-------|--------|-----------|-------------------|
| `globalAppStore` | 2 (classification, user) | 4 files | None — write-once-at-boot |
| `globalAuthStore` | 1 (noTokenMessage) | 2 files | None — its own source code comments "could be gotten rid of idk???" |
| `selectedCollection` | 1 (selectedData) | 1 file (+ broken navTreeStore imports) | None |
| `tabCoordinatorStore` | 1 (closeSignal) | **0 files** | None — completely unused dead code |

`useEnv.js` is already a plain module-level cache, not a Pinia store. It works fine.

**Options:**
- **Remove Pinia entirely.** Replace all stores with composables following the `useGlobalError.js` pattern. Delete the dependency. Simplifies bootstrap (`createPinia()` goes away), test setup, and mental model. Re-add later if genuine need arises.
- **Keep Pinia.** Accept the overhead as insurance for future complexity. Devtools integration could help debugging as the app grows.

**Recommendation:** Remove. The stores are trivial, the replacement pattern already exists in the codebase, and re-adding Pinia later if needed is easy.

---

### Data Fetching

#### D2. useAsyncData: Add race condition protection? `DECIDE`

**What happened:** TanStack Query was removed. `useAsyncData` was written as a minimal replacement.

**Audit finding:** `useAsyncData.execute()` has no protection against stale responses. If `collectionId` changes rapidly, an earlier request can resolve after a later one and overwrite `data.value` with stale data. There is no generation counter, no AbortController, and no check that the result is still relevant.

**Fix options:**
- **Minimal:** Add a generation counter — increment on each `execute()`, check before assigning `data.value`.
- **Robust:** Add AbortController support — pass a signal to the fetch, abort the previous request on re-execute.

**Recommendation:** Implement both. The generation counter is a 5-line fix that prevents stale data. AbortController prevents wasted network requests. This should be done before scaling to more features.

#### D3. useFetch.js: Dead code `REMOVE`

`useFetch.js` is imported by zero components. It bypasses `smFetch` (no auth token), has a bug (re-throws inside catch), and represents a competing design from an earlier iteration. Delete it.

#### D4. Duplicate API functions `DECIDE`

`fetchCollectionMetricsSummary` is defined identically in both `metricsApi.js` and `collectionApi.js`. Both call the same endpoint. When `CollectionMetrics` and `CollectionView` are mounted together (which they always are), the same endpoint is hit twice.

**Options:**
- Move shared API functions to a single location (e.g., `shared/api/collectionApi.js`).
- Accept the duplication for now and consolidate when building the shared API layer in Phase 1.

#### D5. Selective caching vs. no caching `DISCUSS`

**What happened:** TanStack Query was removed with the rationale "metrics must be live, no stale data."

**Audit finding:** That reasoning is valid for metrics but not for all data. Several data types are effectively static during a session:
- STIG revision lists (change only on admin import)
- Current user data (fetched once at boot, manually cached in globalAppStore)
- Collection list (changes infrequently)
- Collection metadata (name, description — rarely changes)

**Options:**
- **Status quo.** No caching. Accept redundant requests. Simple mental model.
- **Selective caching.** Introduce a lightweight cache for stable data (Map with TTL or staleTime). Keep metrics uncached.
- **Revisit TanStack Query.** Use it selectively for stable data with long staleTime, keep `useAsyncData` for metrics.

**Recommendation:** Not urgent. Status quo is fine for now. Flag for revisit when performance data shows redundant requests are a problem.

---

### Authentication & Token Management

#### D6. Dual token access pattern `DECIDE`

**What happened:** `smFetch` was introduced with `setOidcWorker()` to centralize token injection. But `app.provide('worker', oidcWorker)` was left in place, and 9 components still `inject('worker')`.

**Audit finding:** Two independent token-access patterns coexist:
- `smFetch` reads `oidcWorker.token` from a module-level reference (for API calls)
- Components inject the worker directly (for user info/roles, logout, and some legacy API calls)

Three of the injecting components (`CollectionDataPane`, `StigAssetLabelTable`, `ChecklistTable`) are dead code that only injects the worker for old query-based API calls.

The remaining legitimate uses of `inject('worker')` are:
- Reading `tokenParsed` for username display and role checks (NavTree, MenuBar)
- Calling `logout()` (NavTreeFooter)
- Reading `token` for export downloads that bypass smFetch (ExportMetrics)

**Options:**
- **Extract user/role info** into a composable (e.g., `useCurrentUser()`) that reads from the already-bootstrapped `globalAppStore.user` plus parsed token claims. Remove worker injection for role/username access.
- **Migrate export downloads** to use `smFetch` so they don't need direct token access.
- **Keep `inject('worker')` only for `logout()`** — or expose `logout()` through a composable.

**Recommendation:** Converge to a single pattern. The worker should be an implementation detail of `smFetch`, not something components interact with directly.

#### D8. smFetch has no token-expiry awareness `DISCUSS`

**Audit finding:** If a token refresh is in progress when `smFetch` makes a call, it reads the (possibly expired) token and sends it. The 401 response is thrown as a generic error with no retry. There is no mechanism to queue requests while waiting for a fresh token.

**Options:**
- **Minimal:** Add 401 detection in `smFetch` and trigger the re-auth flow via `globalAuthStore.noTokenMessage`.
- **Robust:** Have `smFetch` request a token from the worker (which blocks until refresh completes) rather than reading a potentially stale property. Retry once on 401.

**Recommendation:** At minimum, implement 401 detection. The robust approach is better but couples smFetch more tightly to the worker's internal state.

---

### Routing

#### D9. Hash mode: intentional? `CONFIRMED OK`

**Audit finding:** Hash mode (`createWebHashHistory`) is intentional. The deployment model serves the client from a sub-path of the Express API without URL rewriting. The OIDC flow uses `url.search` for callback params, keeping it cleanly separated from the hash-based route. No change needed.

#### D10. Navigation guards: none exist `DECIDED`

**Audit finding:** There are zero route guards — no `beforeEach`, no per-route `beforeEnter`, no `meta` fields. Auth is handled by the pre-mount bootstrap (app doesn't mount until auth succeeds), but there is no **authorization** checking:
- Any authenticated user can navigate to `/#/admin/users` — they'll get API 403s but the admin UI shell renders.
- No catch-all route for 404 — navigating to `/#/nonexistent` shows a blank page.
- No guard for collection access — navigating to a collection the user can't access renders the shell then shows errors.

**Decision:** Add route `meta` fields and a global `beforeEach` guard. Admin routes require `privileges.admin`. Collection routes require a collection grant (all users, including admins). Asset-level ACL access is handled at the component level via API responses. A `useCurrentUser()` composable replaces direct token parsing for privilege checks. 403 responses trigger user data re-fetch to handle mid-session grant changes. See [routing-and-authorization.md](routing-and-authorization.md) for the full approach.

#### D11. selectedCollection store is vestigial `REMOVE`

**Audit finding:** `selectedCollection.js` is written to in `CollectionSelection.vue` but never read back for any consequential logic. The route params (`route.params.collectionId`) are the actual source of truth everywhere. Additionally, three NavTree files import from `navTreeStore.js` which does not exist as a file — this is a broken import path. The navTreeStore serves a different purpose (tree highlight state) and is the one that should survive.

---

### Component Architecture

#### D12. CollectionView.vue is a "god component" `REFACTOR`

**Audit finding:** At ~330 lines of script, this component mixes:
- 5 parallel data fetches with watchers
- Review-mode routing and breadcrumb logic
- Tab/route synchronization
- Sidebar collapse state
- Child data fetching (checklists, asset STIGs)
- Auto-selection logic for STIGs and assets

**Recommendation:** Extract into composables:
- `useCollectionData()` — the 5 data fetches + auto-selection + selection reset
- `useReviewNavigation()` — breadcrumb construction, STIG/revision selection, review mode detection
- `useTabRouting()` — tab ↔ route synchronization

This brings CollectionView down to layout + template concerns.

#### D13. Dead/vestigial components `REMOVE`

**Audit finding:** These components are not imported by any active code:
- `StigsView.vue` — superseded by inline `MetricsSummaryGrid` in CollectionView
- `AssetsView.vue` — superseded (also uses raw HTML tables instead of MetricsSummaryGrid)
- `LabelsView.vue` — imported in CollectionView but never used in its template
- `CollectionDataPane.vue` — uses old inject/query pattern
- `StigAssetLabelTable.vue` — uses old inject/query pattern
- `ChecklistTable.vue` — uses old inject/query pattern
- `useFetch.js` — imported by nothing
- `tabCoordinatorStore.js` — imported by nothing

#### D14. Hardcoded colors violate project rules `FIX`

**Audit finding:** Pervasive across nearly every component. Dozens of hex values (`#1f1f1f`, `#3a3d40`, `#60a5fa`, etc.) in scoped styles. The project's own guidance says "no explicit colors — use theme variables." This makes dark/light mode switching impossible and will be a large cleanup task.

**Recommendation:** Define a CSS custom property palette mapped to PrimeVue theme tokens. Fix as part of Phase 1 cleanup, not component by component later.

#### D15. Hardcoded font sizes in px `FIX`

**Audit finding:** Several components use `px` values (`13px`, `14px`, `16px`) despite the guidance saying "no explicit font sizes — use rem/em." Fix these during Phase 1 cleanup.

#### D16. `defineProps` explicitly imported from 'vue' `FIX`

**Audit finding:** Six components in CollectionMetrics explicitly `import { defineProps } from 'vue'`. In `<script setup>`, `defineProps` is a compiler macro available without import. This is a learning artifact. Remove the unnecessary imports.

#### D17. Inconsistent `collectionId` prop type `FIX`

**Audit finding:** Some components type `collectionId` as `String`, others as `[String, Number]`. Since it comes from route params (always a string), standardize on `String`.

#### D18. Debug console.logs in production code `FIX`

**Audit finding:** `MetricsSummaryGrid.vue` has `console.log` in a watcher and in computed properties. These should be removed. Other components may have similar leftovers.

---

### Feature Design Decisions

#### D19. Tab system behavior `DISCUSS`

Preview tabs (temporary until double-clicked) vs always-persistent tabs? The `tabCoordinatorStore` exists (unused) suggesting this was considered. Needs design decision before implementing the tab system.

#### D20. Offline/PWA scope `DISCUSS`

Service worker is registered but only does Content-Disposition header proxying for downloads. How much offline support do we want? This affects the service worker, caching strategy, and data fetching architecture.

#### D21. Testing strategy `DISCUSS`

Current tests cover NavTree (19 tests) and CollectionMetrics (13 tests). What is the target coverage for new features? Unit vs integration emphasis? Should we test composables, components, or both? What is the mocking strategy for smFetch?

#### D22. Dark mode toggle `DISCUSS`

Currently hardcoded to dark mode. Is dark-only acceptable for initial release? If we need light mode, the hardcoded colors (D14) must be fixed first.

#### D23. Feature parity threshold `DISCUSS`

Which legacy features are required for initial release vs "nice to have"? This determines which phases are MVP and which are follow-on.

---

### Priority Summary

| ID | Area | Severity | Action |
|----|------|----------|--------|
| D8 | Auth | High | Fix: smFetch needs 401 handling |
| D13 | Code | High | Remove: 8 dead files |
| D14 | Style | High | Fix: hardcoded colors everywhere |
| D1 | State | Medium | Discuss: remove Pinia? |
| D2 | Fetch | Medium | Fix: race condition in useAsyncData |
| D6 | Auth | Medium | Decide: converge token access pattern |
| D10 | Route | Medium | Add: navigation guards + 404 |
| D12 | Arch | Medium | Refactor: CollectionView composable extraction |
| D3 | Code | Low | Remove: useFetch.js |
| D4 | Code | Low | Decide: consolidate duplicate API functions |
| D11 | State | Low | Remove: vestigial selectedCollection store |
| D15-18 | Code | Low | Fix: font sizes, defineProps imports, prop types, console.logs |
| D5 | Fetch | Deferred | Discuss: selective caching |
| D19-23 | Design | Deferred | Discuss: feature design decisions |

---

## Dead Code Inventory

Files to delete (not imported by any active code):

| File | Reason |
|------|--------|
| `src/shared/composables/useFetch.js` | Zero imports, bypasses smFetch, has bugs |
| `src/shared/stores/tabCoordinatorStore.js` | Zero imports |
| `src/features/CollectionView/components/StigsView.vue` | Superseded by inline MetricsSummaryGrid |
| `src/features/CollectionView/components/AssetsView.vue` | Superseded, uses raw HTML tables |
| `src/features/CollectionView/components/LabelsView.vue` | Imported but never rendered |
| `src/features/CollectionView/components/CollectionDataPane.vue` | Uses old inject/query pattern |
| `src/features/CollectionView/components/StigAssetLabelTable.vue` | Uses old inject/query pattern |
| `src/features/CollectionView/components/ChecklistTable.vue` | Uses old inject/query pattern |

Additionally, `postContextActiveMessage()` on the OW object (oidcWorker.js main thread) is defined but never called — the idle-timeout reset is unreachable from the UI.

---

## Reference

- [feature-list.md](feature-list.md) — Detailed feature checklist with status
- [COMPONENT_PLAN.md](COMPONENT_PLAN.md) — Component hierarchy and reuse matrix
- [reusable-components.md](reusable-components.md) — Column patterns, data fetching, PrimeVue usage
- [dev-notes.md](dev-notes.md) — Architecture analysis, refactor plans, resolved questions
- [routing-and-authorization.md](routing-and-authorization.md) — Route guards, privilege checks, collection/asset access control
