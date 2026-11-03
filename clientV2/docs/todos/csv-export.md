# CSV export — open TODOs

Every exporting grid goes through `exportDataTableCsv` (`shared/csv.js`), with cells
formatted by `exportDisplayValue` (`shared/lib/exportCells.js`) or a column's
`:export-value`. The legacy client builds its CSV from what the grid renders —
visible columns, header text, and each cell's rendered value
(`client/src/js/ExportButton.js` `gridToCsv`).

## Items

- [ ] **Fidelity audit against the legacy client.** No one has compared clientV2
  exports to the legacy output for the same screen. Risks: missing or extra columns,
  different header names, different value formats (e.g. raw `fail` vs `O`, dates,
  labels, empty cells).
  - 34 grids export (`git grep -l ':dt=' -- '*.vue'`). Mostly runtime work: export
    the same screen from both clients against the same data and diff the files.
  - Only worth a full pass if someone depends on the CSV format (scripts,
    spreadsheets built on the legacy export). Otherwise spot-check the most-used
    grids: Findings, Asset Review, Collection Review, the dashboard grids.
