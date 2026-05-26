# Unit Test Priorities — `new-client-refactor` vs `new-client`

Inventory of new/changed clientV2 code on this branch that does **not** already
have a test file. Ordered by priority. Priority blends three factors:

- **Bug risk** — branchy logic, edge cases, state machines, async races.
- **Blast radius** — how many features break if this is wrong (shared utilities
  and stores beat one-off components).
- **Test cost** — pure JS modules are cheap; Vue components with DOM/portals are
  expensive. High-value, low-cost work goes to the top.

Already-tested files are listed at the bottom for reference, not as candidates.

---

## P0 — Do these first (pure logic, high reuse, cheap to test)

These are pure functions or near-pure modules used across many features. A bug
here corrupts everything downstream. They take an hour or two each.

### 1. `src/shared/csv.js`
- `escapeCsv(value)` — null/undefined → empty; quote/comma/newline triggers
  quoting; embedded quotes get doubled. Classic CSV escape edge cases.
- `generateCsv(data, columns, listDelimiter)` — array values, the
  `delimitedProperty` extraction branch, missing properties → empty cells,
  header ordering preserved.
- `mapAssetToLabel(assets, labels)` — labelIds → label names, missing
  `labelIds`, missing `labels` arg.
- `formatAssetsForCsv(assets)` — `noncomputing` true/false/undefined boundary,
  `metadata` JSON serialization, `stigs` → benchmarkId array.
- **Why P0:** drives both asset and STIG CSV exports. Silent breakage corrupts
  exported data without any visible error.

### 2. `src/shared/lib.js` (modified)
Several pure formatters with off-by-one risk. Most are easy wins.
- `formatAge(dateString)` — null → `'0 d'`, day boundary, future dates.
- `formatPercent(val, total)` — 0/0, `<1%` and `>99%` thresholds, exact 1 and 99.
- `formatDateTimeString(date)` — null, invalid date, timezone suffix.
- `calculateCora(metrics)` — heavy weighted-average logic with several risk-band
  thresholds (`Very Low`, `Low`, `Moderate`, `High`, `Very High`). Boundary
  values at 0.2 / 0.1 / 0.05 must be pinned down; tests double as the spec.
- `filenameEscaped(value)` — reserved chars, control chars, 255-char truncation.
- `formatBytes(bytes)` — null, < 1024, KB threshold, MB threshold.
- `durationToNow(date)` — null, invalid date, day/hour/minute/`now` cascade.

### 3. `src/shared/lib/reviewFormUtils.js` (modified)
- `isFieldEnabled(setting, result, editable)` — non-editable short-circuit, no
  result short-circuit, `'always'` vs `'findings'` (fail vs non-fail).
- `isFieldRequired(setting, result)` — `'always'`, `'findings'` + fail vs not.
- `statusPayloadForAction(actionType, rejectText)` — all four actions plus
  unknown → null; reject default text.
- `isReviewComplete(review, fieldSettings)` — every branch (missing result,
  invalid result, required detail missing, required comment missing, happy
  path), default field settings.
- **Why P0:** decides whether the Save/Submit buttons enable. Wrong answer here
  blocks users or lets them submit invalid reviews.

### 4. `src/shared/lib/ndjsonStream.js`
- `createNdjsonTransformStream()` — multi-record chunk, split mid-record across
  chunks, invalid JSON segment ignored, empty trailing newline, custom
  separator.
- `readNdjson(response)` — async iterator yields parsed objects, releases lock
  on early break.
- **Why P0:** used by both export-progress and import-progress streams. Subtle
  buffer-handling bugs only surface under specific chunk boundaries — exactly
  what unit tests catch and manual testing won't.

### 5. `src/shared/composables/useTableSelection.js`
- `toggleRow` — add when missing, remove when present.
- `selectAll(true/false)` — replaces selection with all items / empties it.
- `handleCheckboxClick` — shift-click range with `lastClickedIndex` set vs
  unset, deduplication when the range overlaps existing selection, custom
  `idKey`.
- `isAllSelected` / `selectedIdSet` — empty items, partial selection,
  full selection.
- **Why P0:** used by every grid/table on the branch. Shift-click logic is the
  exact kind of thing that silently regresses.

### 6. `src/shared/composables/useGridDensity.js`
- Per-`gridKey` state isolation (two calls with the same key share state; two
  with different keys do not).
- `increaseRowHeight` caps at 10; `decreaseRowHeight` floors at 1.
- `itemSize` reflects the multiplier formula.
- **Why P0:** trivial to test, used in multiple grids, the clamp boundaries are
  easy to get wrong.

### 7. `src/features/AssetReview/lib/labels.js`
- `getContrastColor(hex)` — null/undefined → white, dark color → white, light
  color → near-black, YIQ threshold at 128 (pin two values that straddle it).
- `useResolvedLabels(asset, labels)` — missing labelIds, missing labels, label
  not in collection filtered out, color fallback to `#3b82f6`.

### 8. `src/features/STIGLibrary/lastVisited.js`
- Trivial getter/setter, but worth a 5-line test pinning the contract so the
  navrail integration can't silently regress.

---

## P1 — High-value composables with state and async

These have real logic (caching, generation counters for race protection, derived
state). Mock the API layer and exercise the state machine.

### 9. `src/features/STIGLibrary/composables/useRevisionRules.js`
- `getRulesForRev` cache hit (no second fetch), inflight dedupe (two concurrent
  calls share the promise), error path clears inflight.
- `invalidate(bm, rev)` removes one key; `invalidate(bm)` removes all keys for a
  benchmark; `invalidate()` clears all.
- `watchCurrent` race protection: switching benchmark mid-fetch should not let
  the stale fetch overwrite state (use the `generation` counter — important).
- **Why P1:** caching layer for STIG Library. Bug here either thrashes the API
  or shows stale rules in the diff view.

### 10. `src/features/STIGLibrary/composables/useRevisionDiff.js`
- Joining: rule present on left only → `'rule removed'`; right only →
  `'rule added'`; both with no changes → omitted from rows; both with changes →
  `changed` populated by `detectChangedFields`.
- Race protection (`generation`) when refs change mid-`compute`.
- `diffDetailFor(key)` lazily caches; cache cleared on recompute.
- Error path sets `status: 'error'` and clears rows.
- **Why P1:** drives the entire revision diff UI; correctness of the row list
  determines what the user sees.

### 11. `src/features/STIGLibrary/composables/useBenchmarkList.js`
- `filtered` matches on title or benchmarkId, case-insensitive, whitespace trim.
- Empty filter returns full list; empty benchmarks returns empty list.
- `totalCount` vs `filteredCount` divergence with a non-matching filter.

### 12. `src/features/STIGLibrary/composables/useRuleSelection.js`
- Missing benchmarkId / rev / ruleId → ruleContent stays null, no fetch issued.
- Switching ruleId triggers a new fetch; old content cleared before fetch
  resolves.
- `retry` re-issues with current refs.

### 13. `src/shared/composables/useNotifications.js`
- `push` increments id; `remove(id)` removes the matching entry; `remove` on a
  missing id is a no-op.
- Module-level shared state between two `useNotifications()` calls (the array
  is module-scoped — pin this contract).

### 14. `src/shared/stores/collectionExportProgressStore.js`
- `start` resets stages, marks active, registers a notification.
- `pushStage` appends; `status: 'error'` flips `isActive`/`isDone` and sets
  `error`.
- `finish` / `fail` state transitions.
- `dismiss` removes the notification and nulls the id; double-dismiss is safe.
- `isActive` reflects notification registration, not just `state.isActive`.
- **Why P1:** singleton state; once corrupted, the notification UI gets stuck.

### 15. `src/shared/stores/importProgressStore.js`
Same shape as #14 — same checks (start/push/finish/fail/dismiss/isActive
boundaries).

### 16. `src/features/AssetStigImport/composables/useAssetStigImport.js`
Largest untested composable on the branch (~420 lines). At minimum cover:
- Step machine transitions (FILE → PARSING → ERROR/PREVIEW →
  IMPORT_PROGRESS → IMPORT_DONE).
- `updatedOnlyFilter` filters matched rows where `new.result === current.result`.
- `partition` shape: matched / notReviewed / unmatched.
- `reset` returns every ref to initial state.
- Error capture path.
- **Why P1:** drives the per-asset STIG import. Worth investing once even
  though tests will be larger.

### 17. `src/features/ImportWizard/composables/useImportWizard.js`
- `advanceFromFileQueue` with file count < threshold → goes straight to parsing;
  ≥ 250 → `awaitingParseConfirmation` true and parsing deferred until
  `confirmAndStartParsing`.
- `runParsing` routes to `errorsWarnings` when errors or duplicates exist,
  otherwise to `preview`.
- `reset` resets every child composable.
- **Why P1:** orchestrator over five tested composables — the orchestration
  itself is currently unverified.

---

## P2 — API thin wrappers and supporting modules

Each is small enough that a short test pins the operation name + param shape so
a future rename of the OpenAPI op doesn't silently break the call.

### 18. `src/shared/api/reviewsApi.js`
- One test per function asserting the `apiCall` operationId and the params/body
  it forwards. Mock `apiCall`. Catches typos in op names.

### 19. `src/features/CollectionManage/api/assetManageApi.js`
- Same approach as #18.

### 20. `src/features/CollectionReview/api/collectionReviewApi.js`
- Same approach as #18.

### 21. `src/features/AssetStigImport/api/assetStigImportApi.js`
- Same. Specifically pin the streaming endpoint(s) if any.

### 22. `src/features/CollectionManage/ExportResults/api/exportResultsApi.js`
- Same; if it produces NDJSON, also verify it pipes through `readNdjson`.

### 23. `src/features/ImportWizard/api/importResultsApi.js`
- Same.

### 24. `src/features/MenuBar/composables/useAppBreadcrumb.js` (modified)
- Breadcrumb derivation per route — pure logic. Pin the mapping; cheap.

---

## P3 — Vue components worth integration-style coverage

Component tests cost more (mount, slots, props, emits). Reserve for components
with branching logic, not for layout. The first three are the genuine
candidates; the rest can wait.

### 25. `src/features/CollectionManage/components/AssetFormModal.vue` (~640 lines)
- Create vs edit mode (props.assetId presence).
- Validation gating the submit button.
- `noncomputing` toggle, STIG / label pickers, metadata editor wiring.
- Emit shape on save.

### 26. `src/features/CollectionManage/ExportResults/components/ExportResultsModal.vue` (~720 lines)
- Source/destination collection selection.
- Asset and STIG pick-list filtering.
- Disabled-button conditions.
- Start-export wiring to the progress store.

### 27. `src/features/ImportWizard/components/ImportResultsModal.vue` (~300 lines)
- Step routing (delegates to `useImportWizard`, which is P1).
- Confirm-batch dialog appears on large batches.
- Close/cancel reset wiring.

### 28. `src/components/common/PickList.vue` (~250 lines)
- Selection move left/right, multi-select, filter, available vs selected
  partitioning. Used in several places — worth pinning the contract.

### 29. `src/components/common/MetadataEditor.vue` (~170 lines)
- Add/remove key, edit value, duplicate-key validation, emit shape.

### 30. `src/components/common/DiffPropertySection.vue` + `RuleDiffPanel.vue` + `ChangedPropertyChip.vue` + `RuleIdDiffSpan.vue`
- Mostly presentation, but the diff-rendering branches (added / removed /
  changed) are worth a smoke test each. One small test file per component.

### 31. `src/features/STIGLibrary/components/RevisionSelect.vue` / `EarlierRevisionsPills.vue`
- Selection emits, disabled state when only one revision exists.

### 32. `src/features/CollectionManage/components/TransferAssetButton.vue` (~245 lines)
- **Destructive** action — confirm dialog must be required; happy path emits
  refresh; error path keeps the modal open.

---

## P4 — Skip or defer

Pure-display components: `ClassificationBadge.vue`, `NotificationCard.vue`,
`EngineIconCell.vue` (modified), `StatusBadge.vue` (modified), `DensityControls.vue`,
`AssetsToolbar.vue`, `EarlierRevisionsPills.vue` (display half), `RulePaneHeader.vue`,
`RulePaneToolbar.vue`, `GlobalNotifications.vue` (renders a list — already
covered by `useNotifications` tests in P1).

These render props with no branching logic. Snapshot tests would lock in markup
without catching real bugs. If they break visually, that's an e2e/visual-regression
concern, not a unit-test concern.

---

## Already covered on this branch (do not duplicate)

```
common/tests/ReviewEditPopover.test.js
AssetReview/tests/AssetChecklistGridHeader.test.js
AssetReview/tests/AssetChecklistGridTable.test.js
AssetReview/tests/AssetReview.test.js
AssetReview/test/checklistUtils.test.js
CollectionManage/composables/useAssetCsvImport.test.js
CollectionMetrics/tests/ExportMetricsModal.test.js
CollectionMetrics/tests/exportMetricsUtils.test.js
CollectionReview/tests/BatchEditModal.test.js
CollectionReview/tests/CollectionChecklistGridHeader.test.js
CollectionReview/tests/CollectionChecklistGridTable.test.js
CollectionReview/tests/CollectionReview.test.js
CollectionReview/tests/RejectReasonModal.test.js
CollectionReview/tests/RuleTableGrid.test.js
CollectionReview/tests/RuleTableHeader.test.js
CollectionReview/tests/useReviewActionAvailability.test.js
ImportWizard/tests/useFileParsing.test.js
ImportWizard/tests/useFileQueue.test.js
ImportWizard/tests/useImportCollection.test.js
ImportWizard/tests/useImportExecution.test.js
ImportWizard/tests/useImportOptions.test.js
shared/lib/checklistUtils.test.js
shared/lib/ruleDiff.test.js
shared/tests/openApiOps.test.js
shared/tests/queryString.test.js
```

---

## Suggested execution order

1. Knock out **P0 (#1–#8)** in one sitting — every item is a pure module and
   most are small. This gives the biggest correctness lift per hour.
2. **P1 (#9–#17)** next, one composable per session. Mock `apiCall` /
   `fetchRulesByRevision` at the module boundary; do not stand up real HTTP.
3. **P2 (#18–#24)** as a batch — they're nearly identical shape and one helper
   makes them mechanical.
4. **P3 (#25–#32)** opportunistically, when touching the component for other
   reasons.
5. **P4** — leave alone.
