# Collection Review — open TODOs

Items for the Collection Review grid (`src/features/CollectionReview/`), where one
STIG rule is reviewed across many assets (rows = assets).

## Bugs

- [ ] **Re-clicking the already-open review row doesn't dismiss its edit popover.**
  In `RuleTableGrid.vue`, a row click opens `ReviewEditPopover` via `openRowEditor`
  (the `isSameRow` branch calls `reviewEditPopover.toggle()`); clicking the same row
  again should toggle it closed but the popover stays open (flickers closed then
  reopens). Works correctly in Asset Review — `AssetReview/components/AssetChecklistGrid.vue`
  `openRowEditor` is structurally parallel (same `isSameRow → toggle()` branch, same
  `@close="editingRow = null"`), so the bug is *not* in the toggle branch itself.
  Likely cause: the popover's outside-click auto-hide races the DataTable `@row-click`
  — the second click first dismisses the popover (`onPopoverClose` nulls `editingRow`),
  then `onRowClick` fires with `editingRow` already null, so it's treated as a fresh
  `show()` instead of a toggle. The Asset Review difference to mirror: its `onRowClick`
  pairs the popover with single-row `selectRule()` selection + `guardUnsaved`, whereas
  Collection Review's row-click only drives the popover (selection is separate checkbox
  multi-select via `onSelectionChange`). Confirm at runtime, then align the row-click
  path with Asset Review's.
