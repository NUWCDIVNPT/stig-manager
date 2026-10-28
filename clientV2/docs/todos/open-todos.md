# Open TODOs

Consolidated list of items still open as of 2026-10-28. Details for each live in the
linked source doc.

## Correctness

- [ ] **CSV export fidelity audit** against the legacy client, grid by grid. ([common.md](common.md))
- [ ] **CSV exports omit the classification "Marking" column.** Product decision, then one fix
  in `shared/csv.js`. ([common.md](common.md))

## Hardening

- [ ] **`useAsyncState` has no `reset()`.** Manual state clears bypass the race guard.
  ([common.md](common.md))
- [ ] **`useAsyncState` abort signal is positional.** Three factories still destructure
  `({ signal } = {})`; stale `NOTE ... TBD` comment remains.
  ([async-state-abort-signal.md](async-state-abort-signal.md))
- [ ] **Label mutation handlers manage `saving` by hand.** `LabelFormModal.onSave`,
  `ManageLabels.onDeleteConfirmed`; optional convergence on `useAsyncState`.
  ([collection-manage.md](collection-manage.md))

## Behavior / UX

- [ ] **Dashboard tab switches wipe per-tab URL state.** `CollectionView.vue` activeTab setter
  only carries `labelFilterParams`; remember each tab's last query. ([common.md](common.md))
- [ ] **Label filter lost on round trip through Asset Review.** `CollectionAssetsTab.vue`
  shield click and some `useAppBreadcrumb.js` pushes don't carry it. ([common.md](common.md))
- [ ] **Every visited tab refetches on label-filter change.** Refetch the active tab only,
  mark others stale. ([dashboards.md](dashboards.md))

## Polish / Layout

- [ ] **Import preview Severity shows raw text.** `AssetStigPreviewStep.vue` — CatBadge with
  a dash fallback for empty severity. ([asset-stig-import.md](asset-stig-import.md))
- [ ] **Pills-picker style near-duplicates.** Overlay width 250px (`pillsPicker.js`) vs 280px
  (`GridFilterButton.vue`); `.trigger-pills__chip--neutral` restates chip tokens; chevron
  copies `BreadcrumbSelect`. ([common.md](common.md))
- [ ] **Dashboards: tighten spacing and make responsive.** Fixed dims now sidebar
  `min-width: 380px`, `.stats-column max-width: 400px`, Progress label `160px`.
  ([dashboards.md](dashboards.md))
- [ ] **Progress panel width parity** — CSS now matches in both dashes; confirm visually,
  then close. ([dashboards.md](dashboards.md))

## Tests

- [ ] **Manage Labels coverage.** No test for `TagAssetsModal.onSave` → `replaceLabelAssets`;
  `ManageLabels` optimistic updates untested. ([collection-manage.md](collection-manage.md))

## API (server-side, blocked)

See [pending-api-enhancements.md](pending-api-enhancements.md) — none landed yet.

- [ ] Rule text search (`/stigs/rules/search`)
- [ ] Asset search across collections (`getAssets` takes a single required `collectionId`)
- [ ] Prior-revision rule content (`/stigs/{benchmarkId}/rules/{ruleId}/revisions`)
- [ ] Label params on `getPoamByCollection`
