# Feature Hitlist

Legend: `[x]` done | `[~]` partial | `[ ]` todo | `[?]` needs design

---

## Admin Features
- [ ] AdminCollections (create/delete, high-level properties and grants)
- [ ] AdminUsers
- [ ] AdminUserGroups
- [ ] AdminSTIGs
- [ ] AdminServiceJobs
- [ ] AdminAppInfo
- [ ] AdminLogStream
- [ ] AdminAppData (import/export)

## App Shell
- [~] Home
- [x] Classification Banner
- [~] Nav Tree
- [~] Menu Bar
- [~] Tab System

## User Features
- [ ] Preferences
- [ ] Token Display
- [ ] Logout

## STIG Library
- [ ] STIG Browser
- [ ] STIG Differ
- [ ] STIG Search

## Collection Dashboard
- [~] Overview (Inventory, CORA, progress, ages, findings, import/export)
- [ ] Filter overview and Metrics by label(s)
- [ ] Metrics By STIG (agg)
  - [ ] Assets grid (unagg)
- [ ] Metrics By Asset (agg)
  - [ ] STIGs grid (unagg)
- [ ] Metrics By Label (agg)
  - [ ] Assets grid (agg)
    - [ ] STIGs grid (unagg)

## Meta Dashboard
- [ ] Overview (Inventory, CORA, progress, ages, findings, import/export)
- [ ] Filter overview and Metrics by Collection(s)
- [ ] Metrics By Collection (agg)
  - [ ] STIGs grid (agg)
    - [ ] Assets grid (unagg)
- [ ] Metrics By STIG (agg)
  - [ ] Collections grid (agg)
    - [ ] Assets grid (unagg)

## Collection Features
- [ ] Asset Review (single asset, navigate by rules in assigned STIGs)
  - [ ] Rule table
  - [ ] Rule Info panel
  - [ ] Review Resources panel
  - [ ] Edit Reviews (in-line or in panel)
- [ ] Collection Review (single STIG across collection, navigate by rules)
  - [ ] Rule Table
  - [ ] Reviews grid (all assets in collection for selected rule)
  - [ ] Rule Info panel
  - [ ] Inline review editing
- [ ] Findings
  - [ ] Findings aggregated by Rule/Group/CCI
  - [ ] Assets grid (individual assets with selected finding)
- [ ] Collection Management (Not necessarily its own tab, but this set of features will only be presented to users with Manage/Owner privileges)
  - [ ] Properties (name, description, metadata, workflow)
  - [ ] Grants (direct user grants)
  - [ ] Access Control Rules
  - [ ] Labels (manage/assign collection labels)
  - [ ] Assets (CRUD, labels)
  - [ ] STIGs (assign/unassign)
- [ ] Checklist Import Wizard
- [ ] Checklist Export

## Cross-Cutting
- [ ] Create Collection
- [ ] Grants (user + admin contexts)
- [ ] Rule/Check Info Panel
- [ ] Filtering by labels (stigs, etc?)

---

## Naming Convention (folder structure)

| Scope | Pattern | Examples |
|-------|---------|----------|
| Admin (app-level) | `Admin*` | `AdminCollections`, `AdminUsers`, `AdminSTIGs` |
| Collection-level | `Collection*` | `CollectionSettings`, `CollectionReview` |
| Entity-focused | `[Entity][Action]` | `AssetReview`, `ChecklistImport` |
