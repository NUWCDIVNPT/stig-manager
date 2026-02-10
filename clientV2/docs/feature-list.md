# Feature Hitlist

Legend: `[x]` done | `[~]` partial | `[ ]` todo | `[?]` needs design

Folders: `Proposed` or `Proposed` ← `Current` if renaming

---

## Admin Features → `Admin/`
- [ ] Collections — `Admin/Collections`
- [ ] Users — `Admin/Users` ← `UserManage`
  - [ ] User Status Management (Available/Unavailable)
  - [ ] User Properties View (grants, groups, last OIDC claims)
- [ ] User Groups — `Admin/UserGroups` ← `UserGroupManage`
  - [ ] User Group Batch Grants
- [ ] STIGs — `Admin/STIGs` ← `STIGManage`
- [ ] Service Jobs — `Admin/ServiceJobs` ← `ServiceJobs`
- [ ] App Info — `Admin/AppInfo` ← `AppInfo`
- [ ] Log Stream — `Admin/LogStream`
- [ ] AppData (import/export) — `Admin/AppData` ← `ExportImportManage`

## App Shell (flat)
- [~] Home — `Home`
- [x] Classification Banner — `components/global/`
- [~] Nav Tree — `NavTree`
- [~] Menu Bar — `MenuBar`
- [~] Tab System — `TabList`
- [ ] What's New Dialog/Tab
- [ ] Dark Mode toggle
- [ ] Preview Tabs (temporary until double-clicked)

## User Features → `UserProfile`
- [ ] Preferences
- [ ] Token Display
- [ ] Logout

## STIG Library → `STIGLibrary/`
- [ ] Browser — `STIGLibrary/Browser` ← `STIGLibrary`
- [ ] Differ — `STIGLibrary/Differ`
- [ ] Search — `STIGLibrary/Search`

## Collection Dashboard — `CollectionView`
- [~] Overview (Inventory, CORA, progress, ages, findings, import/export) - `CollectionMetrics`
- [ ] Filter overview and Metrics by label(s)
- [ ] Metrics By STIG (agg) - `MetricsSummaryGrid`
  - [ ] Assets grid (unagg) - `MetricsSummaryGrid`
- [ ] Metrics By Asset (agg) - `MetricsSummaryGrid`
  - [ ] STIGs grid (unagg) - `MetricsSummaryGrid`
- [ ] Metrics By Label (agg) - `MetricsSummaryGrid`
  - [ ] Assets grid (agg) - `MetricsSummaryGrid`
    - [ ] STIGs grid (unagg) - `MetricsSummaryGrid`
- [ ] Tally Sprites (filter-responsive counts in toolbars)

## Meta Dashboard — `MetaDashboard` ← `CollectionSelection`
- [ ] Overview (Inventory, CORA, progress, ages, findings, import/export) - `MetaCollectionOverview`
- [ ] Filter overview and Metrics by Collection(s)
- [ ] Metrics By Collection (agg) - `MetricsSummaryGrid`
  - [ ] STIGs grid (agg) - `MetricsSummaryGrid`
    - [ ] Assets grid (unagg) - `MetricsSummaryGrid`
- [ ] Metrics By STIG (agg) - `MetricsSummaryGrid`
  - [ ] Collections grid (agg) - `MetricsSummaryGrid`
    - [ ] Assets grid (unagg) - `MetricsSummaryGrid`

## Collection Features (flat)
- [ ] Asset Review — `AssetReview`
  - [ ] Rule table
  - [ ] Rule Info panel
  - [ ] Review Resources panel
  - [ ] Edit Reviews (in-line or in panel)
  - [ ] Review History Log Tab
  - [ ] Review Attachments (attach/view/download/delete image evidence)
  - [ ] Status Text Tab (rejection feedback display)
  - [ ] Other Assets Tab (compare reviews across assets, drag-drop copy)
  - [ ] Result Engine Attribution (manual vs automated badges, override tooltips)
  - [ ] Review Attributions Panel (who evaluated/statused and when)
- [ ] Collection Review — `CollectionReview`
  - [ ] Rule Table
  - [ ] Reviews grid (all assets for selected rule)
  - [ ] Rule Info panel
  - [ ] Inline review editing
  - [ ] Batch Review Editing
- [ ] Findings — `Findings`
  - [ ] Findings aggregated by Rule/Group/CCI
  - [ ] Assets grid (individual assets with selected finding)
- [ ] Collection Management — `CollectionManagement` ← `CollectionManage`
  - [ ] Properties (name, description, metadata, workflow)
  - [ ] Grants (direct user grants)
  - [ ] Access Control Rules
    - [ ] Access Rule Editor (Collection/Asset/STIG/Label combinations)
    - [ ] Effective Access View (per-user calculated access)
  - [ ] Users Tab (all users with access: direct + group)
  - [ ] Labels (manage/assign collection labels)
  - [ ] Assets (CRUD, labels) - `MetricsSummaryGrid`
  - [ ] STIGs (assign/unassign) - `MetricsSummaryGrid`
  - [ ] Collection Metadata Tab (arbitrary key-value pairs)
  - [ ] Review Fields Settings (Detail/Comment enable/required options)
  - [ ] Review Status Settings (reset behavior, accept/reject workflow, grant levels)
  - [ ] Review History Settings (max history records 0-15)
  - [ ] Import Options Settings (status per result type, unreviewed/empty handling)
- [ ] Clone Collection (clone with options for assets, STIGs, labels, reviews, grants, revision pinning)
- [ ] Checklist Import — `ChecklistImport`
- [ ] Checklist Export — `ChecklistExport`
  - [ ] Multi-STIG CKL Export
  - [ ] CKLB Format support (STIG Viewer 3)

## Transfer/Export Features
- [ ] Transfer Assets to Another Collection (move, not copy)
- [ ] Export Results to Another Collection
- [ ] Export Assets CSV
- [ ] Batch Asset Creation from CSV

## Cross-Cutting → `components/common/`
- [ ] Create Collection wizard
- [ ] Grants panel
- [ ] Rule/Check Info Panel
- [ ] Label filter
