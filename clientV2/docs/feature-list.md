# Feature Hitlist

Legend: `[x]` done | `[~]` partial | `[ ]` todo | `[?]` needs design

Folders: `Proposed` or `Proposed` ← `Current` if renaming

---

## Admin Features → `Admin/`
- [ ] Collections — `Admin/Collections`
- [ ] Users — `Admin/Users` ← `UserManage`
- [ ] User Groups — `Admin/UserGroups` ← `UserGroupManage`
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

## User Features → `UserProfile`
- [ ] Preferences
- [ ] Token Display
- [ ] Logout

## STIG Library → `STIGLibrary/`
- [ ] Browser — `STIGLibrary/Browser` ← `STIGLibrary`
- [ ] Differ — `STIGLibrary/Differ`
- [ ] Search — `STIGLibrary/Search`

## Collection Dashboard — `CollectionDashboard` ← `CollectionView`
- [~] Overview (Inventory, CORA, progress, ages, findings, import/export) - `CollectionOverview`
- [ ] Filter overview and Metrics by label(s)
- [ ] Metrics By STIG (agg) - `MetricsSummaryGrid`
  - [ ] Assets grid (unagg) - `MetricsSummaryGrid`
- [ ] Metrics By Asset (agg) - `MetricsSummaryGrid`
  - [ ] STIGs grid (unagg) - `MetricsSummaryGrid`
- [ ] Metrics By Label (agg) - `MetricsSummaryGrid`
  - [ ] Assets grid (agg) - `MetricsSummaryGrid`
    - [ ] STIGs grid (unagg) - `MetricsSummaryGrid`

## Meta Dashboard — `MetaDashboard` ← `CollectionSelection` (or keep as is and invoke metaCollection view from there?)
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
- [ ] Collection Review — `CollectionReview`
  - [ ] Rule Table
  - [ ] Reviews grid (all assets for selected rule)
  - [ ] Rule Info panel
  - [ ] Inline review editing
- [ ] Findings — `Findings`
  - [ ] Findings aggregated by Rule/Group/CCI
  - [ ] Assets grid (individual assets with selected finding)
- [ ] Collection Management — `CollectionManagement` ← `CollectionManage`
  - [ ] Properties (name, description, metadata, workflow)
  - [ ] Grants (direct user grants)
  - [ ] Access Control Rules
  - [ ] Labels (manage/assign collection labels)
  - [ ] Assets (CRUD, labels)  - `MetricsSummaryGrid`
  - [ ] STIGs (assign/unassign) - `MetricsSummaryGrid`
- [ ] Checklist Import — `ChecklistImport`
- [ ] Checklist Export — `ChecklistExport`

## Cross-Cutting → `components/common/`
- [ ] Create Collection wizard
- [ ] Grants panel
- [ ] Rule/Check Info Panel
- [ ] Label filter
