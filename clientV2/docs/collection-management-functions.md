# Collection Management — Complete Function Inventory

This document catalogs every management action available in the Collection Management interface, organized by functional area. This serves as the feature reference for the new Vue client implementation.

## 1. Properties

| Action | Description | API | Constraints |
|--------|-------------|-----|-------------|
| Edit Name | Inline-editable text field, auto-saves on blur | `PATCH /collections/{collectionId}` | Required, non-blank |
| Edit Description | Inline-editable textarea, auto-saves on blur | `PATCH /collections/{collectionId}` | Optional |
| Clone Collection | Opens wizard: name, description, include grants/labels/assets, STIG clone depth, pin revisions | `POST /collections/{collectionId}/clone` | Requires `create_collection` privilege + roleId >= 3 |
| Delete Collection | Confirmation dialog, removes ALL data | `DELETE /collections/{collectionId}` | Owner only (roleId === 4) |

## 2. Review Settings

All settings auto-save via `PATCH /collections/{collectionId}` with `{ settings: {...} }`.

### Review Fields

| Field | Setting | Options |
|-------|---------|---------|
| Detail | Enabled | Always, Findings only |
| Detail | Required to submit | Always, Findings only, Optional |
| Comment | Enabled | Always, Findings only |
| Comment | Required to submit | Always, Findings only, Optional |

**Constraint**: When Enabled = "Findings only", Required cannot be "Always".

### Review Status

| Setting | Options |
|---------|---------|
| Reset to Saved upon change to | Review result, Any review field |
| Reviews can be Accepted or Rejected | Checkbox (boolean) |
| Grant required to set Accept or Reject | Manage or Owner (3), Owner only (4) — disabled when Accept/Reject is unchecked |

### Review History

| Setting | Options |
|---------|---------|
| Asset/Rule history records are | Disabled (0), Capped at 1 through Capped at 15 |

## 3. Import Options

### Status Per Result

| Result | Options |
|--------|---------|
| Fail | Keep Existing (null), Saved, Submitted, Accepted |
| Not Applicable | Keep Existing (null), Saved, Submitted, Accepted |
| Pass | Keep Existing (null), Saved, Submitted, Accepted |

Note: "Accepted" option only available when collection allows Accept/Reject.

### Unreviewed Rules

| Setting | Options |
|---------|---------|
| Include unreviewed rules | Never, Having comments, Always |
| Unreviewed with a comment is | Informational, Not Reviewed — disabled when above = "Never" |

### Empty Field Handling

| Setting | Options |
|---------|---------|
| Empty detail text is | Ignored, Replaced, Imported |
| Empty comment text is | Ignored, Replaced, Imported |

### Custom Override

| Setting | Description |
|---------|-------------|
| Options can be customized for each import | Checkbox — when checked, users can override these defaults in the import wizard |

## 4. Grants

| Action | Description | API | Constraints |
|--------|-------------|-----|-------------|
| View Grants | Grid showing Role, User/Group for each grant | `GET /collections/{collectionId}/grants` | |
| Add Grants | Complex dialog: grantee tree picker (users + groups), activity filter, role selector, batch add | `POST /collections/{collectionId}/grants` | |
| Edit Grant | Change grantee or role | `PUT /collections/{collectionId}/grants/{grantId}` | Owner grants require Owner role |
| Edit ACL | Asset-level access restrictions per grant | `PUT /collections/{collectionId}/grants/{grantId}/acl` | For Restricted role grants |
| Remove Grant | Confirmation dialog | `DELETE /collections/{collectionId}/grants/{grantId}` | Owner grants require Owner role |
| Export CSV | Export grants list | Client-side | |

### Role Levels

| roleId | Name | Description |
|--------|------|-------------|
| 1 | Restricted | Access limited by ACL to specific assets/STIGs/labels |
| 2 | Full | Full access to all assets and reviews |
| 3 | Manage | Full + can manage assets, STIGs, grants, accept/reject reviews |
| 4 | Owner | Manage + can delete collection, modify Owner grants |

## 5. Effective Users

| Action | Description | API |
|--------|-------------|-----|
| View Users | Read-only grid showing User, Grantee source (Direct or group name), Role | `GET /collections/{collectionId}?projection=users` |
| Show Effective Access | Per-user detail showing which assets at what access level | Client-side computation |
| Export CSV | Export users list | Client-side |

## 6. Metadata

| Action | Description | API | Constraints |
|--------|-------------|-----|-------------|
| View Metadata | Key-value grid | `GET /collections/{collectionId}/metadata` | |
| Add Key | Create new key-value pair, inline editing | `PUT /collections/{collectionId}/metadata` | No blanks, no duplicates, no reserved keys (e.g., "importOptions") |
| Edit Key/Value | Double-click to edit (row editor) | `PUT /collections/{collectionId}/metadata` | Same validation |
| Delete Key | Remove selected key | `PUT /collections/{collectionId}/metadata` | |
| Export CSV | Export metadata | Client-side | |

## 7. Labels

| Action | Description | API | Constraints |
|--------|-------------|-----|-------------|
| View Labels | Grid: colored name, description, asset count | `GET /collections/{collectionId}/labels` | |
| Create Label | Name (max 16 chars), description, color picker (12 colors) | `POST /collections/{collectionId}/labels` | Case-insensitive unique name |
| Edit Label | Change name, description, color | `PATCH /collections/{collectionId}/labels/{labelId}` | Same validation |
| Delete Label | Remove label | `DELETE /collections/{collectionId}/labels/{labelId}` | |
| Tag Assets | Dual-grid dialog: Available vs Tagged assets, drag-and-drop | `PUT /collections/{collectionId}/labels/{labelId}/assets` | |
| Export CSV | Export labels list | Client-side | |

### Available Colors

`4568F2`, `7000FF`, `E46300`, `8A5000`, `019900`, `DF584B`, `99CCFF`, `D1ADFF`, `FFC399`, `FFF699`, `A3EA8F`, `F5A3A3`

Default for new labels: `99CCFF`

## 8. Asset Management

| Action | Description | API | Constraints |
|--------|-------------|-----|-------------|
| View Assets | Full grid: name, labels, FQDN, IP, MAC, STIGs, Rules, metrics | `GET /metrics/summary/collection/{collectionId}/asset` | Multi-select, virtual scroll |
| Create Asset | Dialog: name (required), description, FQDN, IP, MAC, labels, metadata, STIG assignments (dual-grid) | `POST /assets` | |
| Import Assets CSV | File upload, client-side parse, validation preview, dry-run | `POST /assets` (batch) | |
| Export Assets CSV | Selected or all assets to CSV | Client-side | |
| Import CKL(B) or XCCDF | Collection Builder wizard for bulk file import | Multiple endpoints | |
| Export Results | Tree dialog (Assets > STIGs), format picker (CKL/CKLB/XCCDF), export to zip or another collection | `POST /collections/{collectionId}/export` | Requires selected assets with STIGs |
| Delete Assets | Multi-select, confirmation | `PATCH /assets?collectionId={id}` with `{ operation: 'delete', assetIds }` | |
| Transfer Assets | Dropdown of destination collections (Manage/Owner), confirmation | `PATCH /assets/{assetId}` per asset | Requires Manage+ on both collections |
| Modify Asset | Same dialog as Create, pre-populated | `PUT /assets/{assetId}` | Exactly 1 selected |

### Asset Grid Columns

Name, Labels (multi-value), FQDN (hidden), IP (hidden), MAC (hidden), STIGs (count), Rules (count), Oldest, Newest, Assessed%, Submitted%, Accepted%, Rejected%

## 9. STIG Management

| Action | Description | API | Constraints |
|--------|-------------|-----|-------------|
| View STIGs | Full grid: benchmarkId, revision, pin status, rules, assets, metrics | `GET /metrics/summary/collection/{collectionId}/stig` | Multi-select |
| Assign STIG | Dialog: STIG picker, default revision combo, asset assignments dual-grid | `POST /collections/{collectionId}/stigs/{benchmarkId}` | At least 1 asset required |
| Export Results | Tree dialog (STIGs > Assets), same format options as Asset export | Same as Asset export | |
| Unassign STIG | Confirmation, removes all asset assignments | `PUT /collections/{collectionId}/stigs/{benchmarkId}/assets` with `[]` | Exactly 1 selected |
| Modify Assignment | Same dialog as Assign, pre-populated with current revision and assets | Same as Assign | Exactly 1 selected |

### STIG Grid Columns

BenchmarkId, Revision (with pin icon if pinned), Rules, Assets, Oldest, Newest, Assessed%, Submitted%, Accepted%, Rejected%

## 10. Permission Requirements Summary

| Action | Required |
|--------|----------|
| View Management interface | roleId >= 3 |
| Edit name/description/settings/metadata | roleId >= 3 |
| Create/edit/delete labels | roleId >= 3 |
| Add/edit/remove non-Owner grants | roleId >= 3 |
| Add/edit/remove Owner grants | roleId === 4 |
| Create/modify/delete assets | roleId >= 3 |
| Assign/unassign STIGs | roleId >= 3 |
| Transfer assets | roleId >= 3 on both collections |
| Clone collection | roleId >= 3 AND `create_collection` privilege |
| Delete collection | roleId === 4 |
