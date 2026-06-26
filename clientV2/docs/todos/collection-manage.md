# Collection Manage ("admin" features) — open TODOs

Management features under `src/features/CollectionManage/` (Manage Assets / STIGs /
Labels, roleId >= 3). Captured during the Manage Labels review (2026-06-24).

## Hardening / Consistency

- [ ] **`TagAssetsModal` data load bypasses `useAsyncState`.** `loadData` in
  `components/Label/TagAssetsModal.vue` hand-rolls `isLoading` +
  `try/catch/triggerError` for its 3-way `Promise.all` fetch, so it loses the
  composable's abort/race guard (matters on rapid modal reopen). The sibling
  `components/Stig/StigAssignmentModal.vue` (~L87-117) already does this right —
  `useAsyncState` for both its loads and its save; follow that. The label mutation
  handlers (`Label/LabelFormModal.onSave`, `Label/TagAssetsModal.onSave`,
  `ManageLabels.onDeleteConfirmed`) manage a `saving` ref manually too — softer call,
  mixed precedent (`composables/useAssetForm.save` is also manual), but worth
  converging while here.

## Test gaps

- [ ] **Manage Labels coverage holes.** No test asserts `TagAssetsModal.onSave` PUTs
  the right `assetId[]` to `replaceLabelAssets`. `ManageLabels`' optimistic state
  updates — `applyLabelCreated` / `applyLabelChanged` / `onDeleteConfirmed` (incl. the
  partial-failure `triggerError` + `loadLabels()` reload path) — are untested; a small
  `ManageLabels` integration test would lock in the trickiest logic. Pure helpers
  (`tagAssets.js`, `labelPalette.js`) and the leaf components are already well covered.

See also in [common.md](common.md): the `exportCSV` gaps item — Manage Labels exports
via PrimeVue's native `exportCSV()` (`Label/LabelsTable.vue`), same decorate/export
caveats as the other grids, and it does not route through `shared/csv.js`'s
formula-injection guard.
