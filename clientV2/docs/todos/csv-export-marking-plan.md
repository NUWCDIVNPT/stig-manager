# CSV export — classification Marking plan

Tracks the first item in [csv-export.md](csv-export.md): clientV2 CSV exports carry no
classification marking, and the legacy client's do.

## Status

- [x] **Prerequisite: load the classification at startup.** Since `da68d901`
  (Client/bootstrap 3), `main.js` had been reading `STIGMAN.Env.classification`. The
  API's clientV2 `Env.js` has no such field, so the value was always `'NONE'` and the
  banner never showed. `main.js` now calls `apiCall('getConfiguration')` after
  configuring the API spec and runs `setClassification(config.classification)` before
  mount. The dead `bootstrapEnv()` was removed from `useEnv.js`.
- [ ] Marking column in grid CSV exports and the inventory CSV export (below).

## What the legacy client does

- **Exporter:** only `Ext.ux.ExportButton.gridToCsv` (`client/src/js/ExportButton.js`)
  adds a marking.
  - The header row starts with `Marking` (L134).
  - Every data row starts with `` `(${STIGMAN.apiConfig?.classification})` `` (L164).
- **Value:** the raw API code in parentheses: `(U)`, `(CUI)`, `(FOUO)`, `(C)`, `(S)`,
  `(TS)`, `(SCI)`. It is not the banner text.
  - The legacy client has no special case for `NONE`, so a `NONE` deployment writes
    `(NONE)` on every row. If the config failed to load, it writes `(undefined)`.
- **Source:** `/op/configuration` → `STIGMAN.apiConfig` (`stigman.js:107`). The API
  fills it from `STIGMAN_CLASSIFICATION`.
- **Coverage:** every legacy grid CSV button uses `exportType: 'grid'`. That covers
  Status, Log, asset review (groups, other reviews), collection review (groups,
  rules), Installed STIGs, ACL, Grants, Meta (aggregated and unaggregated), and
  Library (STIG list, changed rules).
- **Legacy exports with no marking:**
  - `storeToCsv` (the "Store data" menu option).
  - Inventory export (`SM.Inventory.apiToCsv`).
  - Asset CSV export (`Manage.js:3602`). This is also the asset re-import format.
  - Metrics CSV, which the server builds in `Metrics.js` with `csv-stringify`.

## clientV2 export paths

| Path | Used by | Legacy equivalent | Marking? |
|---|---|---|---|
| `exportDataTableCsv` → `dataTableCsv` | StatusFooter export on every grid (~34) | `gridToCsv` | **Add** |
| `dataTableCsv(dt, [row])` | GridCopyMenu "Copy row as CSV" (clipboard) | none | No (D2) |
| `generateCsv` | `ExportAssetsCsvButton` (asset export / re-import format) | `Manage.js` asset export | No |
| `generateCsv` | `exportMetricsUtils` inventory export | `SM.Inventory.apiToCsv` | **Add** (beyond legacy, D5) |
| Server CSV via `fetchAndSave` | Metrics export | `MetaPanel` download | No (API is out of scope) |

## Implementation steps

Each step is small, leaves the suite green, and can be reviewed alone. Run
`npx vitest run src/shared src/components src/features/CollectionMetrics` after each one.

### Step 1: `csvMarking()` helper (no behaviour change)

- [x] In `shared/csv.js`, add and export `csvMarking()`. It reads
  `useGlobalAppStore().classification` and returns `` `(${code})` ``. `NONE` gives
  `(NONE)` (D1).
- [x] In `csv.test.js`, check that `'U'` gives `(U)`, `'CUI'` gives `(CUI)`, and
  `'NONE'` gives `(NONE)`.
- **Done when:** the new tests pass and no export output has changed.

### Step 2: `Marking` column in grid exports

- [x] Change `dataTableCsv(dt, rows)` to `dataTableCsv(dt, rows, { marking } = {})`.
  When `marking` is set, put `Marking` first in the header row and the marking value
  first in every data row, both through `escapeCsv`.
- [x] `exportDataTableCsv` passes `{ marking: csvMarking() }`. GridCopyMenu stays
  unchanged (D2).
- [x] `csv.test.js`:
  - The `Marking` header comes first and every row starts with the marking.
  - The marking column still comes first when a column has `exportable=false` or an
    `export-value`.
  - `dataTableCsv` without the option is unchanged.
- [x] `StatusFooterCsvExport.test.js`: after `setClassification('U')`, the downloaded
  file starts with `Marking` and its rows start with `(U)`.
- [x] Confirm that `columnExportConventions.test.js` and `GridCopyMenu.test.js` still
  pass unchanged. Both call `dataTableCsv` without the option.
  `AssetChecklistGridTable.test.js` mocks `exportDataTableCsv`, so it is unaffected.
- [x] `DiffRuleTableExport.test.js` (a real-DataTable export test) now expects the
  marking too. The legacy Changed Rules export had one.
- **Done when:** every StatusFooter grid export is marked and the copy-row output is
  unchanged.

### Step 3: `Marking` column in the inventory export

- [ ] Change `generateCsv(data, columns, listDelimiter)` to
  `generateCsv(data, columns, listDelimiter, { marking } = {})`, using the same rule as
  step 2.
- [ ] In `exportMetricsUtils.js`, the inventory CSV branch passes
  `{ marking: csvMarking() }`. This covers group-by-asset, including the asset-format
  output with its `___skipped___` placeholder columns, and group-by-STIG. JSON output
  stays as it is.
- [ ] `csv.test.js`: `generateCsv` with and without the option.
- [ ] `exportMetricsUtils.test.js`: the inventory CSV is marked for both groupings, and
  JSON is unchanged.
- [ ] Confirm that `ExportAssetsCsvButton.test.js` passes unchanged. The asset export
  stays unmarked (D5).
- **Done when:** the inventory CSV is marked and asset export files still re-import.

### Step 4: docs and manual check

- [ ] Tick the Marking item in [csv-export.md](csv-export.md), and step 2 in Status
  above.
- [ ] Add one line under "CSV export" in `reusable-components.md`: every StatusFooter
  export starts with a `Marking` column.
- [ ] Manual check against a running API with `STIGMAN_CLASSIFICATION=U`:
  - The banner shows.
  - A grid export from StatusFooter and an inventory CSV both start with
    `Marking,…` and every row starts with `(U),…`.
  - Copy row as CSV and the asset export are unmarked.
  - An exported asset CSV still re-imports.

## Decisions (resolved)

- **D1. `NONE` deployments: legacy parity.** The Marking column is always present,
  and a `NONE` deployment writes `(NONE)` on every row. Because of D6 the
  classification is always loaded, so legacy's `(undefined)` case can't happen.
- **D2. "Copy row as CSV": legacy parity, so no marking.** Legacy had no clipboard
  row copy, so GridCopyMenu keeps calling `dataTableCsv` without the option.
- **D3. Format: legacy parity.** A leading `Marking` column with `(CODE)` on every row.
  No top-of-file line and no filename prefix.
- **D4. Source: `exportDataTableCsv` reads the global app store.** No caller changes.
- **D5. Other exports: inventory gets the marking; asset and metrics stay unmarked.**
  - **Inventory export: marked, deliberately going beyond legacy.** It carries asset
    names, IPs, FQDNs and STIGs, and has no technical blocker. Legacy likely left it
    unmarked by accident: the marking lived in `ExportButton`, and this export was
    written separately. It uses the same leading `Marking` column and `(CODE)` value
    as D3.
  - **Asset export: unmarked.** It is also the re-import format. `AssetParser.checkHeaders()` in
    `@nuwcdivnpt/stig-manager-client-modules` rejects any header outside its 9
    expected ones. A Marking column would make exported files fail import in both
    clients, so marking it first needs a change to that package.
  - **Metrics CSV: unmarked.** The API builds it (`csv-stringify` in `Metrics.js`).
    Marking it needs an API change, which is out of clientV2's scope.
  - [ ] **Open:** raise the asset-parser and metrics gaps upstream?
- **D6. `/op/configuration` failure: fail startup, like `/op/definition`.** Already
  implemented. The app never runs without a known classification.
