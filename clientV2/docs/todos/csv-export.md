# CSV export — open TODOs

Every exporting grid goes through `exportDataTableCsv` (`shared/csv.js`), with cells
formatted by `exportDisplayValue` (`shared/lib/exportCells.js`) or a column's
`:export-value`. The legacy client builds its CSV from what the grid renders —
visible columns, header text, and each cell's rendered value
(`client/src/js/ExportButton.js` `gridToCsv`).

## Items

- [ ] **Classification "Marking" column is missing.** The legacy client prepends a
  `Marking` header and puts `(${STIGMAN.apiConfig.classification})` (e.g. `(U)`,
  `(CUI)`) in every row (`ExportButton.js:134`, row value ~L164). clientV2 exports
  have no marking at all, so a CSV that leaves the app carries no classification.
  - Product decision first. Options: match legacy (leading `Marking` column on every
    row), a single marking line at the top of the file, or the marking in the filename.
  - Whichever is chosen is one change in `shared/csv.js` and covers every grid.
  - Planned as its own PR. Plan and open decisions: [csv-export-marking-plan.md](csv-export-marking-plan.md).

- [ ] **Fidelity audit against the legacy client.** No one has compared clientV2
  exports to the legacy output for the same screen. Risks: missing or extra columns,
  different header names, different value formats (e.g. raw `fail` vs `O`, dates,
  labels, empty cells).
  - 34 grids export (`git grep -l ':dt=' -- '*.vue'`). Mostly runtime work: export
    the same screen from both clients against the same data and diff the files.
  - Only worth a full pass if someone depends on the CSV format (scripts,
    spreadsheets built on the legacy export). Otherwise spot-check the most-used
    grids: Findings, Asset Review, Collection Review, the dashboard grids.
