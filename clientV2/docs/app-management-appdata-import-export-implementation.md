# App Management: Application Data Import/Export Implementation Guide

This document describes the experimental **App Management -> Export/Import Data** feature in implementation-neutral terms, and maps it to the current implementations: the API, the legacy ExtJS client, and the Vue clientV2 feature at `clientV2/src/features/AppManagement/Appdata/`.

The feature exports most application-owned database data as a streaming JSON Lines (JSONL) document, optionally compressed with GZip, and can import such a document to replace the destination instance's application data. It is an administrative migration/restore mechanism, not a general-purpose interchange format and not a substitute for a database backup.

> **Destructive-operation warning:** an import truncates, drops, or rewrites database data. It is not transactional, has no rollback, and can leave a partially replaced database if it fails. Require a current database backup, an explicit destructive confirmation, and an operational maintenance window.

## 1. Current implementation map

| Concern | Current source |
| --- | --- |
| OpenAPI contract and operation IDs | `api/source/specification/stig-manager.yaml` |
| HTTP request handling and progress response | `api/source/controllers/Operation.js` |
| Export/import serialization and database logic | `api/source/service/OperationService.js` |
| Binary JSON encoding | `api/source/utils/buffer-json.js` |
| Feature flag | `api/source/utils/config.js` |
| Feature flag delivered to clients | `api/source/bootstrap/client.js` |
| Authentication/elevation enforcement | `api/source/utils/auth.js` |
| Legacy UI | `client/src/js/SM/AppData.js` |
| Legacy conditional navigation | `client/src/js/SM/NavTree.js` |
| V2 route (`admin-transfer`, `/app-management/transfer`) and guard | `clientV2/src/router/index.js`, `clientV2/src/router/navigationGuards.js` |
| V2 App Management menu item | `clientV2/src/features/AppManagement/composables/useAppManagementItems.js` |
| V2 feature-flag helper | `clientV2/src/shared/lib/featureFlags.js` |
| V2 page | `clientV2/src/features/AppManagement/Appdata/components/AppData.vue` |
| V2 export/import state machines | `clientV2/src/features/AppManagement/Appdata/composables/` |
| V2 pure analysis/progress/stream modules (unit-tested) | `clientV2/src/features/AppManagement/Appdata/lib/`, `.../tests/` |
| V2 API module | `clientV2/src/features/AppManagement/Appdata/api/appDataApi.js` |
| Existing administrator documentation | `docs/admin-guide/admin-guide.rst` |
| API fixture loader and export authorization test | `test/api/mocha/utils/testUtils.js`, `test/api/mocha/data/operation/op.test.js` |

The V2 route is `/app-management/transfer`, is named `admin-transfer`, and is gated twice: `requiresAdmin` plus a `meta.isEnabled` feature-flag predicate enforced by the shared navigation guard. The App Management menu applies the same predicate to the item definition, so the page is listed only when the server-side experimental flag is enabled.

## 2. Feature enablement and authorization

### 2.1 Experimental flag

The server reads:

```text
STIGMAN_EXPERIMENTAL_APPDATA=true
```

The comparison is exact and case-sensitive. Any value other than the string `true`, including an unset value, disables the feature. The default is therefore disabled.

The generated client environment exposes the result as `experimental.appData`, currently serialized as the string `"true"` or `"false"`, not a Boolean. The legacy navigation only adds the **Export/Import Data (experimental)** node when the value is exactly `"true"`. The V2 client reads the flag through `isAppDataEnabled()` in `clientV2/src/shared/lib/featureFlags.js`, used by both the route guard and the menu filter.

Both `getAppData` and `replaceAppData` check the server-side flag and return a not-found error when disabled. UI hiding is only a convenience; the server check is authoritative. `getAppDataTables` does not currently check this flag.

### 2.2 Administrator elevation

Every AppData request must include:

```text
elevate=true
```

The request must also carry a valid bearer access token. The authentication layer rejects `elevate=true` unless the token-derived user has the application `admin` privilege. The endpoints additionally reject a request whose parsed `elevate` value is absent or false.

The OpenAPI scopes are:

| Operation | Required OAuth scope |
| --- | --- |
| Export | `stig-manager:op:read` |
| Import/replace | `stig-manager:op` |
| Table information | `stig-manager:op:read` |

Do not treat possession of a scope alone as sufficient. The current design requires both the appropriate scope and the application's administrator privilege through elevation.

The UI route should require an administrator and redirect a non-administrator to a safe page. The API must still enforce authorization independently.

## 3. API contract and operation IDs

The API base prefix is deployment-specific; paths below are relative to it.

### 3.1 Export application data

| Field | Value |
| --- | --- |
| Operation ID | `getAppData` |
| Method/path | `GET /op/appdata` |
| Query | `elevate=true`; `format=gzip` or `format=jsonl` |
| Default format | `gzip` |
| Success body | streamed JSONL or streamed GZip-compressed JSONL |
| Authorization | bearer token; admin elevation; `stig-manager:op:read` |

For uncompressed output the response media type is `application/jsonl`. GZip output is returned as an attachment and is represented by the OpenAPI contract as `application/gzip`.

The generated filename is:

```text
appdata-v{currentMigration}_{date-safe-timestamp}.jsonl
appdata-v{currentMigration}_{date-safe-timestamp}.jsonl.gz
```

The export response is streamed, and its final size is not known up front. A frontend should not promise percentage progress unless the response supplies a usable content length. GZip usually reduces transfer size substantially but consumes compression CPU; JSONL can stream faster while producing a much larger file.

### 3.2 Replace application data

| Field | Value |
| --- | --- |
| Operation ID | `replaceAppData` |
| Method/path | `POST /op/appdata` |
| Query | `elevate=true` |
| Request body | raw JSONL or raw GZip bytes (not multipart form data) |
| Accepted media types | `application/jsonl`, `application/gzip`, `application/x-gzip` |
| Success/progress body | chunked `application/jsonl; charset=utf-8` |
| Authorization | bearer token; admin elevation; `stig-manager:op` |

Set the request `Content-Type` explicitly. For a `.jsonl` file, the legacy client reconstructs the browser `File` with `application/jsonl` because browsers frequently provide an empty or generic type. GZip detection on the server is an exact comparison against `application/gzip` or `application/x-gzip`; an incorrect type causes compressed bytes to be parsed as plain JSONL.

The current request body is accumulated completely in server memory before processing. The response disables common reverse-proxy buffering with `X-Accel-Buffering: no` and uses chunked transfer encoding so progress records can arrive incrementally.

### 3.3 Database table information

| Field | Value |
| --- | --- |
| Operation ID | `getAppDataTables` |
| Method/path | `GET /op/appdata/tables` |
| Query | `elevate=true` |
| Response | JSON array of `{name, rows, dataLength}` |
| Authorization | bearer token; admin elevation; `stig-manager:op:read` |

This operation queries database metadata for all base tables and is not used by the legacy import/export screen. Database estimates such as `rows` may not be exact. Unlike the two transfer endpoints, this endpoint currently remains callable when the AppData experimental flag is disabled.

## 4. AppData file format

The logical document is UTF-8 JSONL: one complete JSON value per line. It may be transported as-is or wrapped in one GZip stream. There is no JSON array surrounding the document.

There are four record roles, in this order:

1. Export metadata object.
2. Whole-file table summary object.
3. One table metadata object followed by zero or more row arrays.
4. Step 3 repeats for every included table.

An abbreviated file is:

```jsonl
{"version":"1.4.13","commit":{"branch":"main","sha":"...","tag":"...","describe":"..."},"date":"2024-08-18T15:29:16.784Z","lastMigration":33}
{"tables":[{"table":"asset","rowCount":2},{"table":"collection","rowCount":1}],"totalRows":3}
{"table":"asset","columns":"`assetId`,`collectionId`,`name`","rowCount":2}
[1,10,"host-a"]
[2,10,"host-b"]
{"table":"collection","columns":"`collectionId`,`name`","rowCount":1}
[10,"Example Collection"]
```

### 4.1 Export metadata

```text
{
  version: application semantic version,
  commit: build/commit metadata object,
  date: export timestamp,
  lastMigration: source database migration number
}
```

`lastMigration` is the compatibility field used by the importer. `version`, `commit`, and `date` are informational.

### 4.2 Table summary

```text
{
  tables: [{ table: table name, rowCount: integer }, ...],
  totalRows: sum of the listed row counts
}
```

The frontend uses this record to validate that the file resembles AppData and to calculate import progress. The backend uses it only to emit progress information; it does not reconcile declared counts against actual row records.

### 4.3 Table header and rows

Each table header contains:

```text
{
  table: database table name,
  columns: comma-separated, database-quoted column identifiers,
  rowCount: declared row count
}
```

Each subsequent array is a row whose positional values correspond exactly to `columns`. A new table header ends the previous table's row sequence. Even an empty table has a header; importing that header truncates the destination table.

This format intentionally exposes physical schema names and column order. It is therefore migration-sensitive and is not a stable public domain model.

### 4.4 Database value encoding

Export selects rows as arrays and preserves database JSON/date/time-like values as their original database strings. One-bit fields are emitted as Booleans. Other values use the database driver's normal conversion.

Binary values use a JSON-compatible Buffer representation. Conceptually:

```json
{"type":"Buffer","data":"base64:SGVsbG8="}
```

The `base64:` prefix distinguishes base64 text from older/plain UTF-8 Buffer representations. An empty Buffer is represented with an empty `data` string. A compatible importer must revive these objects into database binary values before binding inserts.

## 5. Export algorithm

A language-agnostic export implementation should perform the following sequence:

1. Verify the feature flag, bearer authorization, required scope, and administrator elevation.
2. Select the output format, defaulting to GZip.
3. Set an attachment filename and the correct media type.
4. If requested, insert a streaming GZip encoder between serialization and the HTTP response.
5. Write the export metadata object plus a newline.
6. Discover all base tables in the configured application schema, excluding the tables listed below.
7. For every included table, discover all non-generated columns. The current exporter orders columns alphabetically by column name.
8. Count each table, calculate `totalRows`, and write the table summary record.
9. For each table, write its table header, stream a `SELECT` of its selected columns as positional arrays, encode special binary values, and terminate every record with a newline.
10. Finish the compressor, if any, and close the HTTP response.

The current excluded tables are:

```text
_migrations
status
result
severity_cat_map
cci
cci_reference_map
config
job
job_run
job_task_map
task
task_output
```

These are omitted because they are migration-owned/reference/configuration/service-job data rather than transferred application state. Their destination contents are not replaced by a same-migration import. If a source is older, the reset-and-migrate path recreates migration-owned data before and after importing application rows.

Generated columns are also omitted so the destination database can derive them.

The exporter currently supplies no `ORDER BY`, and schema discovery supplies no explicit table ordering. Consumers must not depend on stable table or row order. Relational insertion succeeds because foreign-key checks are temporarily disabled during import, not because parents are guaranteed to precede children.

## 6. Import algorithm

### 6.1 Client-side analysis

Before enabling the destructive action, both clients read the selected file locally without uploading it. The legacy UI performs:

1. Accept a single `.gz` or `.jsonl` file.
2. Stream file-read progress as **Analyzing**.
3. Detect GZip from the browser-provided MIME type and decompress when needed.
4. Decode UTF-8 and split on newline boundaries while retaining incomplete records between chunks.
5. Parse object records. Row arrays are deliberately ignored during analysis.
6. Display the source version/date, migration, table names, and declared row counts.
7. Reject the file if its `lastMigration` is greater than the current API migration.
8. Enable **Replace Application Data** only when migration compatibility passes and a table-summary object was found.

The V2 analyzer (`clientV2/src/features/AppManagement/Appdata/lib/appDataAnalysis.js`) strengthens step 8: it requires a valid integer `lastMigration`, exactly one metadata and one summary record, well-formed table headers, row-array widths that match their header, accurate declared counts, and no malformed JSONL. The legacy analyzer silently ignores malformed JSON and can incorrectly accept a file with a summary but no `lastMigration` because its initial false-like value compares as less than a number.

Browser MIME detection is unreliable. Prefer checking both MIME and file extension, then verify the GZip magic bytes (`1f 8b`) before decompression; the V2 client sniffs the magic bytes and treats name/type as hints only. Do not rely solely on `File.type` as the legacy UI does.

### 6.2 Upload and server-side replacement

After a separate, explicit user confirmation:

1. Disable the action and prevent accidental dialog closure.
2. Upload the original raw file body with the correct media type and `elevate=true`.
3. The server buffers the request, selects plain/GZip decoding from `Content-Type`, and parses newline-delimited records.
4. On reading the source migration:
   - If it equals the current migration, continue against the existing schema.
   - If it is newer, fail compatibility validation.
   - If it is older, drop every table and view, migrate an empty database up to the source migration, import the source records, then migrate to the current migration.
5. Disable foreign-key checks on the import connection.
6. On each table header, issue `TRUNCATE {table}` before inserting rows.
7. Collect at most 10,000 row arrays per insert statement, then execute a bulk insert using the header's table and column list.
8. Emit progress JSONL as table chunks and migrations complete.
9. Re-enable foreign-key checks and release the connection.
10. Tell the user to refresh/reload the entire web application so cached identity, grants, collections, and other state are rebuilt from the replacement data.

The parser uses the binary-aware JSON reviver described above. It retains an incomplete final line and attempts to parse it at end of stream, so a trailing newline is recommended but not required.

## 7. Import progress protocol

The POST response is itself a JSONL event stream. A consumer must incrementally decode it and preserve partial lines between network chunks. Possible records include:

| Shape | Meaning |
| --- | --- |
| `{tables, totalRows}` | Echoed whole-file summary; initialize progress denominator |
| `{seq, table, valueCount}` | A truncate or insert statement completed |
| `{migration, status:"started"}` | A migration started |
| `{migration, status:"finished"}` | A migration finished |
| `{sql}` | A table or view was dropped while resetting an older schema |
| `{status:"success"}` | Replacement and any forward migrations completed |
| `{status:"fail", error}` | Import processing failed |

`valueCount` is zero for the truncate event and positive for inserted batches. The legacy UI adds each positive `valueCount` to `insertedRows`, then displays `insertedRows / totalRows` and the current table.

Do not interpret HTTP 200 or end-of-stream alone as success. The current service catches processing errors, emits `{status:"fail", error:...}`, and returns normally, so the controller may still finish with HTTP 200. A correct client must require the terminal `{status:"success"}` record and surface a `fail` record as an error. It should also handle network termination without either terminal record as an indeterminate/failed import.

## 8. UI behavior to reproduce

### 8.1 Page

Show the item under **App Management** only when:

- the logged-in user is an application administrator; and
- the runtime AppData feature flag is enabled.

Label it as experimental. The page has two clearly separated areas:

- **Export**: format selector (`GZip` default, `JSONL`) and **Download Application Data**.
- **Import**: destructive warning and **Replace Application Data...**.

The V2 application uses its `admin-transfer` route with the administrator navigation guard, a `meta.isEnabled` feature-flag predicate on the route, and the same predicate on the menu item definition.

### 8.2 Export interaction

The authenticated download cannot assume a plain anchor can attach the bearer token. Both clients send the request description through the service worker, receive a temporary/downloadable URL, and navigate the window to it; the V2 client falls back to a buffered authenticated fetch when no service worker controls the page. A replacement can instead use an authenticated streaming fetch and a platform download mechanism, but must avoid loading a large export into JavaScript memory if streaming-to-disk support is available.

Show indeterminate activity rather than a percentage because the server does not know the final compressed size before streaming.

### 8.3 Import dialog

The legacy dialog is modal, 500 by 400 pixels, and cannot be dismissed with Escape. The V2 implementation is an inline page section rather than a dialog, with the same elements:

- a single-file picker limited in the UI to `.gz` and `.jsonl`;
- a read-only, auto-scrolling status log;
- a progress bar with normal and error styling; and
- a disabled **Replace Application Data** button that becomes enabled only after analysis.

Selecting another file resets prior analysis. During upload, disable the button and hide/disable the close control. Stream every progress object into the status log, update table/row progress, show migrations separately, and only show **Done** after `status:"success"`.

The legacy UI does not ask for a second confirmation after analysis. The V2 page adds an explicit confirmation step (the `confirming` phase) stating that destination data will be overwritten and that the operation is non-transactional, and blocks in-app navigation and page unload while an upload is in progress.

## 9. Critical gotchas and failure modes

### Destructive and non-atomic behavior

- There is no encompassing database transaction and `TRUNCATE`/DDL operations generally auto-commit.
- Tables are replaced progressively. A parse, SQL, network, process, or migration failure can leave mixed old/new data or an incomplete schema.
- Foreign-key checks being disabled prevents ordering errors but also removes referential protection during import.
- Re-enabling foreign-key checks does not retroactively validate all inserted relationships.
- Concurrent application traffic can observe or mutate intermediate state. Put the service into a maintenance/unavailable mode or otherwise quiesce writes during replacement.
- Always take and verify a native database backup first. AppData itself intentionally excludes tables and is not a complete physical backup.

### Validation and trust boundary

- The current server silently swallows individual JSON parse errors.
- It trusts file-provided table names and column fragments when constructing SQL. Although normal exports produce trusted identifiers, an uploaded document is an administrator-controlled SQL-adjacent input. A hardened implementation must allowlist tables/columns from live schema metadata and reject unexpected syntax, duplicates, missing headers, and row-width mismatches.
- Declared `rowCount` and `totalRows` are not verified and are only progress hints.
- Empty, malformed, or reordered metadata can cause confusing failures; for example a row before a table header has no valid insertion target.
- The OpenAPI request body is marked `required: false`, but a meaningful import requires a non-empty body. Treat it as required in the UI and ideally correct the API contract.

### Compatibility

- Newer-source to older-destination imports are rejected by migration number.
- Older-source imports cause a full schema drop/rebuild and two-stage migration, substantially increasing risk and duration.
- Equal migration numbers do not guarantee application-level compatibility if the format changes without a migration increment. Preserve and validate an explicit AppData format version in a future format revision.
- Physical table/column names make hand-authored or cross-product files unsafe.
- Unknown future metadata objects are currently mostly ignored. Versioned readers should define whether unknown record types are ignored or rejected.

### Streaming and memory

- Export is genuinely streamed from database to response.
- Import is not end-to-end streaming: the controller buffers the entire uploaded file before parsing. A GZip upload reduces transfer bytes and the initially buffered size but decompression/import still needs CPU and query-batch memory.
- The current bulk insert limit is 10,000 rows, not 10,000 scalar values despite the internal option name `maxValues`.
- Large generated SQL strings and database packet limits can still fail for rows containing large text or binary fields.
- Reverse proxies must permit long-lived, chunked responses, disable response buffering for progress, accept the upload size, and have suitable read/write timeouts.

### Content types and files

- Server GZip recognition is exact; normalize media types or strip parameters in a hardened backend.
- A `.gz` file with an empty browser MIME can be mis-analyzed as text by the legacy frontend.
- File extensions are usability hints, not validation.
- JSONL parsing must support records split across arbitrary file/network chunks and a final record without a newline.
- Do not split decoded text before using an incremental UTF-8 decoder; a multibyte character can cross byte chunks.

### Progress and completion

- `totalRows` can be zero; guard against division by zero.
- DDL/migration events do not contribute to the row percentage, so progress may pause for long periods.
- A table's truncate event has `valueCount: 0`; do not count it as an inserted row.
- Require a terminal success record. The current HTTP status may be 200 even after a terminal failure record.
- Refreshing only the page component is insufficient after replacement; authentication-derived user records and application stores may all be stale. Perform a full application reload and, if identity changed, reauthenticate.

### Current implementation quirks worth correcting

- The service starts stream pipelines without awaiting the returned pipeline promise. Consumption of the downstream query stream usually drives processing, but explicit pipeline error propagation should be used in a rewrite.
- The service's query formatter assumes table metadata exists; malformed ordering can cause a null dereference.
- The client parser only recognizes object lines beginning with `{` and silently ignores whitespace-prefixed objects, arrays, and malformed lines during analysis.
- The server catches import exceptions and converts them to progress events rather than an error HTTP status.
- Export service errors occur after streaming has begun and the controller does not await the export promise, complicating propagation and cleanup.
- The legacy completion message is displayed after the response ends even if the stream contained `status:"fail"`; this must not be copied. (The V2 import requires the terminal `{status:"success"}` record and treats an ended stream without a terminal record as indeterminate/failed.)

## 10. Recommended reimplementation architecture

Keep these responsibilities separate:

```text
Runtime feature config
        |
        +--> navigation/page gate
        |
        +--> API endpoint gate

Export endpoint --> schema discovery --> row stream --> JSONL encoder --> optional GZip --> response

File picker --> local validator --> destructive confirmation --> raw upload
                                                            |
Import endpoint --> staged validation --> maintenance lock --> transactional/staged restore where possible
                                                            |
                                                            +--> JSONL progress stream --> UI log/progress
```

For a production-grade rewrite, improve safety beyond parity:

1. Introduce an explicit AppData format/schema version independent of application and database migration versions.
2. Stream uploads to a restricted temporary file while calculating a checksum; do not retain the full request in memory.
3. Fully validate and inventory the document before altering the live schema.
4. Allowlist every table and column against destination schema metadata.
5. Acquire an application-wide maintenance/import lock and reject concurrent writes.
6. Prefer restore into a staging schema/database, validate counts and relationships, then switch atomically where the database permits it.
7. If in-place replacement is unavoidable, record a durable import job and recovery instructions.
8. Return a job/import ID and structured, versioned progress events.
9. Make terminal failure unambiguous in both the event protocol and final HTTP/job state.
10. Audit who initiated export/import, source metadata, checksum, timestamps, result, and failure details without logging exported sensitive values.

## 11. Reference state machines

### Export

```text
idle -> requesting -> streaming/downloading -> complete
                    \-> failed
```

Disable duplicate export actions while requesting. Cancellation should abort the HTTP request and remove any partial client-side download if the platform allows it.

### Import

```text
no-file
  -> analyzing
      -> invalid
      -> ready
          -> confirming
              -> uploading/importing
                  -> succeeded -> full application reload
                  -> failed/indeterminate -> recovery guidance
```

Do not return from `failed/indeterminate` directly to `ready` without forcing the operator to verify or restore the destination database; the database may already have been partially modified.

## 12. Minimum acceptance tests

### Access and flag tests

- Disabled flag hides the menu and makes export/import endpoints unavailable.
- Non-admin users cannot navigate to the page and receive 403 when attempting elevated calls.
- Missing or false `elevate` is rejected.
- Correct scopes plus administrator privilege permit the appropriate operations.

### Export tests

- GZip is the default and decompresses to valid JSONL.
- Explicit JSONL returns the correct media type and attachment extension.
- Metadata, table summary, every table header, and rows are newline-delimited.
- Summary/table counts equal actual emitted rows.
- Empty tables emit headers.
- Excluded and generated columns are absent.
- Boolean, JSON/date strings, nulls, Unicode, large text, and binary values round-trip.
- Client cancellation and database/response-stream failures clean up resources.

### Analysis/import tests

- Valid same-migration JSONL and GZip files are accepted.
- Newer migrations, corrupt GZip, malformed JSON, missing metadata/summary, unknown tables/columns, duplicate headers, wrong row widths, and count mismatches are rejected before mutation.
- MIME types with parameters and browser-empty types are handled deliberately.
- Lines and multibyte UTF-8 characters split across chunks parse correctly.
- More than 10,000 rows creates multiple insert batches without losing rows.
- Empty tables are cleared.
- Older compatible data follows the reset/source-migrate/import/forward-migrate sequence.
- Every failure produces a terminal failed state and never a false success display.
- A zero-row export does not produce invalid progress arithmetic.
- A disconnected progress stream becomes indeterminate unless a separately queried job state confirms completion.
- On success, a full reload shows replacement users, grants, collections, STIGs, assets, reviews, and review history.

### Recovery/concurrency tests

- Concurrent mutation is blocked for the whole destructive phase.
- Simulated failure after truncate and mid-insert follows documented recovery behavior.
- Foreign keys are restored even after exceptions.
- Temporary files, connections, locks, and streams are cleaned up after success, failure, and cancellation.

## 13. Compatibility checklist for another implementation

To be wire-compatible with the current feature, a replacement must:

- use operation IDs `getAppData`, `replaceAppData`, and optionally `getAppDataTables`;
- call `GET` and `POST /op/appdata` with `elevate=true`;
- send/accept raw `application/jsonl` and GZip bodies, not multipart uploads;
- emit and consume one JSON value per line;
- preserve the metadata -> summary -> table header -> positional rows structure;
- use the header's column ordering for row arrays;
- preserve the Buffer/base64 convention;
- reject source migrations newer than the destination;
- understand the JSONL progress event shapes and require terminal success;
- enforce administrator authorization and the server-side experimental flag; and
- force application state to reload after a successful replacement.

Anything beyond those compatibility requirements should favor stronger validation, staged restoration, durable job state, and recoverability rather than reproducing the current implementation's unsafe quirks.
