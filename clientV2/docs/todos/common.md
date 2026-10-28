# Cross-cutting TODOs

Items that affect multiple features and should get a shared fix, not a local patch.
Most originated from the Findings feature review (2026-06-10).

## Correctness

- [ ] **CSV export fidelity audit.**
  Every exporting grid now declares fields/export headers and cells go through
  `exportDisplayValue` (see reusable-components.md, CSV export). Remaining work is a
  grid-by-grid comparison of actual output against the legacy client's export for the
  same screen; `git grep -l ':dt=' -- '*.vue'` lists the tables.

- [ ] **CSV exports omit the classification "Marking" column.**
  The legacy client prepends a `Marking` header with `(${apiConfig.classification})`
  in every row (`client/src/js/ExportButton.js:134`); `exportDataTableCsv` has no such
  column. Product decision needed, then a single fix in `shared/csv.js`.

## Hardening (latent — not reachable today)

- [ ] **Manual state clears bypass `useAsyncState`'s race guard.**
  Clearing state directly (e.g. `reviews.value = []` in `useFindingReviews`) does not
  bump the composable's generation counter, so an in-flight response could repopulate
  cleared state. Not reachable today (the findings API returns only the active
  aggregator's key field per row, so no spurious fetch can start), but worth a shared
  fix: add a `reset()` to `useAsyncState` that bumps generation / aborts — other
  features clear state manually the same way. Think about this holistically.

- [ ] **`useAsyncState`'s abort signal is positional.** Factories that want the
  signal must declare it in slot 0, which only holds while `execute()` is called with
  no arguments — see [async-state-abort-signal.md](async-state-abort-signal.md).

## Consistency

- [ ] **Pills-picker style near-duplicates.** `PillsTrigger.vue` chevron copies
  `BreadcrumbSelect.vue`'s `.p-select-dropdown` box (padding differs by a hair);
  `.trigger-pills__chip--neutral` restates the `--color-chip-default-*` tokens with a
  different bg; `pillsPicker.js` overlay sizes echo `GridFilterButton.vue` `valuesPt`
  (280 vs 250px). Each merge nudges one side a few px, so decide the canonical values
  together rather than one at a time.

## Behavior / UX

URL / navigation state items moved to [url-state.md](url-state.md).
