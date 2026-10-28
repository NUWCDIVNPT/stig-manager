# Collection Manage ("admin" features) — open TODOs

Management features under `src/features/CollectionManage/` (Manage Assets / STIGs /
Labels, roleId >= 3). Captured during the Manage Labels review (2026-06-24).

## Test gaps

- [ ] **Manage Labels coverage holes.** No test asserts `TagAssetsModal.onSave` PUTs
  the right `assetId[]` to `replaceLabelAssets`. `ManageLabels`' optimistic state
  updates — `applyLabelCreated` / `applyLabelChanged` / `onDeleteConfirmed` (incl. the
  partial-failure `triggerError` + `loadLabels()` reload path) — are untested; a small
  `ManageLabels` integration test would lock in the trickiest logic. Pure helpers
  (`tagAssets.js`, `labelPalette.js`) and the leaf components are already well covered.

See also in [common.md](common.md): the CSV export gaps item — Manage Labels
(`Label/LabelsTable.vue`) exports through `exportDataTableCsv` like every other grid,
with the same decorate/export caveats.
