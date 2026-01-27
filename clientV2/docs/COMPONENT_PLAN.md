# STIG Manager Client V2 - Component Plan

This document outlines the Vue 3 / PrimeVue 4 components needed for the core features of STIG Manager. It serves as a guide for development and tracking.

## Visual References

Screenshots are located at: `/docs/assets/images/`

| Feature | Key Screenshots |
|---------|-----------------|
| Collection Dashboard | `collection-panel.png`, `collection-panel-overview.png`, `collection-panel-assets.png`, `collection-panel-labels.png`, `collection-panel-filters.png` |
| Meta-Collection Dashboard | `meta-collection-dashboard.png`, `meta-collection-dashboard-collections-tab.png`, `meta-collection-dashboard-stigs-tab.png` |
| Asset Review | `asset-review.png`, `review-eval-panel.png`, `attachments-hover-crop.png` |
| Collection Review | `collection-review.png`, `collection-review-batch-edit.png` |
| Findings Report | `findings-report.png` |

---

## Shared/Reusable Components

Components used across multiple features throughout the application.

### Data Display Components

| Component | Description | PrimeVue Base |
|-----------|-------------|---------------|
| `MetricsSummaryGrid` | Configurable data table with sorting, selection, inline progress bars, and badge columns. Core grid component for metrics displays. Schema-adaptive: detects aggregation type from data shape. | DataTable |
| `ChecklistGrid` | Specialized grid for STIG checklists with CAT, Group, Rule Title, Result, Status columns. Used in both review workspaces. | DataTable |
| `ProgressBarCell` | Inline progress bar for percentage columns (Assessed, Submitted, etc.) with color coding based on value. | ProgressBar |
| `LabelChipGroup` | Renders multiple label chips/tags for an asset. Handles overflow gracefully. | Tag |
| `StatusLegendItem` | Color-coded status indicator with label and count (for chart legends). | custom |
| `MetricCard` | Card displaying a single metric with label and value. Props: `label`, `value`, `suffix?`, `variant?`. Used for Inventory, Findings, Review Ages. | Card |
| `CoraRiskCard` | CORA display showing percentage AND risk level text (e.g., "9.0% / Moderate"). Color-coded background based on risk thresholds. | Card/custom |
| `RuleInfoPanel` | Displays rule details: Rule ID, CAT badge, title, Manual Check, Fix, Other Data sections. **Shared between Asset Review and Collection Review.** | Panel/custom |

### Inline Badge Components (ie. used in grids)

| Component | Description | PrimeVue Base |
|-----------|-------------|---------------|
| `CoraBadge` | Small inline badge for CORA percentage in grid cells (e.g., "2.5", "75.6"). Color-coded background. | Badge/custom |
| `CatBadge` | CAT severity badge. Props: `category` (1/2/3), `count?`, `showLabel?`. Color-coded by severity (CAT1=red, CAT2=yellow, CAT3=blue). | Badge |
| `ResultBadge` | Review result badge (NF=green, O=red, NA=blue, NR=gray, I=purple). Props: `result`, `showIcon?`. | Badge |
| `StatusBadge` | Review status badge (Saved=flag, Submitted=checkmark, Accepted=star, Rejected=X). | Badge |
| `ResultOriginBadge` | Shows how result was determined: "Manual" (blue), "Evaluate-STIG" (teal), tool name, or override indicator. | Badge |

### Chart Components

| Component | Description | PrimeVue Base |
|-----------|-------------|---------------|
| `ProgressDonutChart` | Donut/ring chart showing assessment progress with center percentage text. Segments for Unassessed, Assessed, Submitted, Accepted, Rejected. | Chart (Chart.js) |

### Filter/Control Components

| Component | Description | PrimeVue Base |
|-----------|-------------|---------------|
| `LabelFilterDropdown` | Multi-select dropdown for filtering by labels with colored chips preview. Used in Collection Dashboard. | MultiSelect |
| `CollectionFilterDropdown` | Multi-select dropdown for filtering by collections. Shows "Collections: X of Y" indicator. Used in Meta Dashboard. | MultiSelect |
| `ExportOptionsPanel` | Grouped dropdowns for export configuration (Group by, Style, Format) with Download button. | Dropdown, Button |
| `GridFooterBar` | Footer with refresh button, CSV export button, and record count display. | Toolbar |
| `ColumnFilterMenu` | Column header menu with sort options, visibility toggles, and filter controls. | Menu/OverlayPanel |

### Form Components

| Component | Description | PrimeVue Base |
|-----------|-------------|---------------|
| `ReviewForm` | Evaluation form with Result dropdown, Detail textarea, Comment textarea, and field help tooltips. **Shared between Asset Review and Collection Review batch edit.** | Fieldset, Dropdown, Textarea |
| `AttributionsDisplay` | Shows review attribution info: Modified (status, timestamp, user, rule) and Status (badge, timestamp, user). | custom |
| `FieldHelpTooltip` | Help icon with tooltip showing field requirements and export mappings. | Tooltip |

### Modal/Dialog Components

| Component | Description | PrimeVue Base |
|-----------|-------------|---------------|
| `BatchEditModal` | Modal for batch editing multiple reviews. Contains ReviewForm and applies to all selected assets. | Dialog |
| `ImportResultsModal` | Modal for importing CKL/XCCDF results. | Dialog |
| `RejectReviewModal` | Modal for rejecting reviews with feedback text. | Dialog |

### Layout Components

| Component | Description | PrimeVue Base |
|-----------|-------------|---------------|
| `MasterDetailLayout` | Two-panel layout where selecting master row populates detail grid below. Used in Collection Dashboard tabs. | Splitter/custom |
| `ThreeLevelDrilldown` | Three vertically-stacked grids with cascading selection. Used in Meta Dashboard. | Splitter/custom |
| `CollapsibleSection` | Panel section with header, optional action buttons, and collapsible content. | Panel |
| `WorkspaceToolbar` | Standard toolbar layout for workspace headers with menu, filters, and actions. | Toolbar |

---

## Feature: Collection View (Dashboard)

### Overview

The Collection View (Dashboard) displays overall status and metrics for a collection. Two-panel layout with Overview (left) and Checklist Navigation (right).

### Feature-Specific Components

| Component | Description |
|-----------|-------------|
| `CollectionView` | Main container, orchestrates two-panel layout |
| `CollectionHeader` | Title bar with collection name and LabelFilterDropdown |

#### Overview Panel (Left Side)

| Component | Description |
|-----------|-------------|
| `CollectionOverview` | Container for all overview sections, scrollable |
| `ProgressSection` | Progress donut chart, status legend, and progress bars |
| `CoraSection` | "Open or Unassessed" CAT counts and CoraRiskCard |
| `InventorySection` | Assets/STIGs/Checklists MetricCards with Export/Manage buttons |
| `FindingsSection` | CAT 1/2/3 finding count MetricCards with Details button |
| `ReviewAgesSection` | Oldest/Newest/Updated MetricCards with day suffix |
| `ExportMetricsSection` | ExportOptionsPanel for metrics download |
| `FetchedTimestamp` | "Fetched: [datetime]" with refresh indicator |

#### Checklist Navigation Panel (Right Side)

| Component | Description |
|-----------|-------------|
| `ChecklistNavigation` | TabView container for STIGs/Assets/Labels tabs |
| `StigsTab` | STIGs master grid + Checklists detail grid (MasterDetailLayout) |
| `AssetsTab` | Assets master grid + Checklists detail grid (MasterDetailLayout) |
| `LabelsTab` | Labels → Assets → Checklists (3-level MasterDetailLayout) |

### Component Hierarchy

```
CollectionView
├── CollectionHeader
│   └── LabelFilterDropdown (shared)
│
├── CollectionOverview
│   ├── ProgressSection
│   │   ├── ProgressDonutChart (shared)
│   │   ├── StatusLegendItem (shared) x5
│   │   └── ProgressBarCell (shared) x4
│   │
│   ├── CoraSection
│   │   ├── CatBadge (shared, showLabel=true) x3
│   │   └── CoraRiskCard (shared)
│   │
│   ├── InventorySection
│   │   └── MetricCard (shared) x3
│   │
│   ├── FindingsSection
│   │   └── MetricCard (shared, variant=cat) x3
│   │
│   ├── ReviewAgesSection
│   │   └── MetricCard (shared, suffix="d") x3
│   │
│   ├── ExportMetricsSection
│   │   └── ExportOptionsPanel (shared)
│   │
│   └── FetchedTimestamp
│
└── ChecklistNavigation (TabView)
    ├── StigsTab
    │   ├── MetricsSummaryGrid (shared) [STIGs]
    │   ├── GridFooterBar (shared)
    │   ├── MetricsSummaryGrid (shared) [Checklists]
    │   └── GridFooterBar (shared)
    │
    ├── AssetsTab
    │   ├── MetricsSummaryGrid (shared) [Assets]
    │   ├── GridFooterBar (shared)
    │   ├── MetricsSummaryGrid (shared) [Checklists]
    │   └── GridFooterBar (shared)
    │
    └── LabelsTab
        ├── MetricsSummaryGrid (shared) [Labels]
        ├── GridFooterBar (shared)
        ├── MetricsSummaryGrid (shared) [Assets]
        ├── GridFooterBar (shared)
        ├── MetricsSummaryGrid (shared) [Checklists]
        └── GridFooterBar (shared)
```

---

## Feature: Asset Review Workspace

### Overview

The Asset Review Workspace allows reviewing all checks for a specific STIG on a single asset. Four-panel layout: Checklist (left), Rule Info (center), Review Resources (upper right), Review Form (lower right).

### Feature-Specific Components

| Component | Description |
|-----------|-------------|
| `AssetReviewWorkspace` | Main container, orchestrates four-panel layout |
| `AssetReviewHeader` | STIG version/release info, writeable/read-only indicator |

#### Checklist Panel (Left)

| Component | Description |
|-----------|-------------|
| `AssetChecklistPanel` | Container for checklist grid and controls |
| `ChecklistToolbar` | Checklist menu (export, import, revisions), filter dropdown, title search, SCAP toggle |
| `ChecklistMenu` | Dropdown menu with Group/Rule toggle, Export CKL, Import Results, Submit All, Revisions submenu |
| `ChecklistFilterDropdown` | Filter by result status (All, Open, NF, NA, NR, etc.) |

#### Review Resources Panel (Upper Right)

| Component | Description |
|-----------|-------------|
| `ReviewResourcesPanel` | TabView container for resource tabs |
| `OtherAssetsTab` | Grid showing same rule's reviews on other assets. Supports drag-to-copy. |
| `AttachmentsTab` | AttachmentList with "Attach image..." button |
| `FeedbackTab` | Displays rejection feedback text from reviewer |
| `ReviewLogTab` | History grid showing review changes over time |

#### Review Panel (Lower Right)

| Component | Description |
|-----------|-------------|
| `AssetReviewPanel` | Container for review form and actions |
| `ReviewPanelHeader` | "Review on [Asset_Name]" with label chips |
| `ReviewActions` | Save/Unsubmit, Submit, Accept buttons |

### Component Hierarchy

```
AssetReviewWorkspace
├── AssetReviewHeader
│   └── StatusBadge (shared) [writeable/read-only]
│
├── AssetChecklistPanel
│   ├── ChecklistToolbar
│   │   ├── ChecklistMenu
│   │   ├── ChecklistFilterDropdown
│   │   └── TitleSearchInput
│   ├── ChecklistGrid (shared)
│   │   └── [CatBadge, ResultBadge, ResultOriginBadge, StatusBadge per row]
│   └── GridFooterBar (shared)
│
├── RuleInfoPanel (shared)
│   ├── RuleHeader
│   │   └── CatBadge (shared)
│   ├── ManualCheckSection
│   ├── FixSection
│   └── OtherDataSection (collapsible)
│       └── ControlsTable
│
├── ReviewResourcesPanel (TabView)
│   ├── OtherAssetsTab
│   │   ├── OtherAssetsGrid
│   │   │   └── [LabelChipGroup, StatusBadge, ResultBadge per row]
│   │   └── GridFooterBar (shared)
│   │
│   ├── AttachmentsTab
│   │   ├── AttachImageButton
│   │   └── AttachmentList (shared)
│   │
│   ├── FeedbackTab
│   │   └── FeedbackDisplay
│   │
│   └── ReviewLogTab
│       └── ReviewHistoryGrid
│           └── [ResultBadge, ResultOriginBadge, StatusBadge per row]
│
└── AssetReviewPanel
    ├── ReviewPanelHeader
    │   └── LabelChipGroup (shared)
    ├── ReviewForm (shared)
    │   ├── ResultDropdown
    │   ├── ResultOriginBadge (shared)
    │   ├── DetailTextarea
    │   ├── FieldHelpTooltip (shared)
    │   └── CommentTextarea
    ├── AttributionsDisplay (shared)
    └── ReviewActions
```

---

## Feature: Collection Review Workspace

### Overview

The Collection Review Workspace allows reviewing a single STIG rule across ALL assets in a collection. Supports batch editing and bulk status changes. Three-panel layout: Checklist Summary (upper left), Rule Info (right), Reviews Grid (bottom).

### Feature-Specific Components

| Component | Description |
|-----------|-------------|
| `CollectionReviewWorkspace` | Main container, orchestrates three-panel layout |
| `CollectionReviewHeader` | STIG version/release info |

#### Checklist Summary Panel (Upper Left)

| Component | Description |
|-----------|-------------|
| `ChecklistSummaryPanel` | Container for aggregated checklist grid |
| `SummaryToolbar` | Checklist menu, CSV export, asset count display |
| `ChecklistSummaryGrid` | Grid with aggregated counts per rule (O, NF, NA, NR+, Submitted, Accepted, Rejected counts) |
| `SummaryFooterBar` | Totals row with aggregate counts across all rules |

#### Reviews Panel (Bottom)

| Component | Description |
|-----------|-------------|
| `ReviewsPanel` | Container for individual asset reviews grid |
| `ReviewsToolbar` | Accept, Reject, Submit, Unsubmit, Batch Edit buttons + view mode toggle |
| `ReviewsGrid` | Grid of individual reviews with selection checkboxes for batch operations |
| `ReviewsFooterBar` | CSV export, count summary |

### Component Hierarchy

```
CollectionReviewWorkspace
├── CollectionReviewHeader
│
├── ChecklistSummaryPanel
│   ├── SummaryToolbar
│   │   ├── ChecklistMenu
│   │   └── AssetCountDisplay
│   ├── ChecklistSummaryGrid
│   │   └── [CatBadge, aggregated count cells per row]
│   └── SummaryFooterBar
│
├── RuleInfoPanel (shared)
│   ├── RuleHeader
│   │   └── CatBadge (shared)
│   ├── ManualCheckSection
│   ├── FixSection
│   └── OtherDataSection (collapsible)
│
└── ReviewsPanel
    ├── ReviewsToolbar
    │   ├── AcceptButton
    │   ├── RejectButton
    │   ├── SubmitButton
    │   ├── UnsubmitButton
    │   ├── BatchEditButton
    │   └── ViewModeToggle
    ├── ReviewsGrid
    │   └── [Checkbox, StatusBadge, LabelChipGroup, ResultBadge, ResultOriginBadge per row]
    ├── ReviewsFooterBar (shared)
    │
    └── BatchEditModal (shared, opened by BatchEditButton)
        └── ReviewForm (shared)
```

---

## Feature: Findings Report

### Overview

The Findings Report shows aggregated and individual findings for a collection. Two-panel layout: Aggregated Findings (left) and Individual Findings (right).

### Feature-Specific Components

| Component | Description |
|-----------|-------------|
| `FindingsReport` | Main container with two-panel layout |
| `FindingsToolbar` | Aggregator dropdown (Group), STIG filter dropdown |
| `AggregatedFindingsGrid` | Left grid grouped by finding with asset counts |
| `IndividualFindingsGrid` | Right grid showing individual asset findings |

### Component Hierarchy

```
FindingsReport
├── FindingsToolbar
│   ├── AggregatorDropdown
│   └── StigFilterDropdown
│
├── AggregatedFindingsPanel
│   ├── AggregatedFindingsGrid
│   │   └── [CatBadge per row]
│   └── GridFooterBar (shared)
│
└── IndividualFindingsPanel
    ├── IndividualFindingsGrid
    │   └── [LabelChipGroup, StatusBadge per row]
    └── GridFooterBar (shared)
```

---

## Feature: Meta-Collection Dashboard

### Overview

The Meta-Collection Dashboard provides aggregated metrics across **multiple collections**. Similar to Collection Dashboard but operates at a higher level, allowing users to view and compare data across all collections they have access to. Two-panel layout with Overview (left) and a 3-level tabbed drill-down (right).

**Key Differences from Collection Dashboard:**
- Aggregates across multiple collections instead of one
- Uses Collection filter instead of Label filter
- Has Collections/STIGs tabs instead of STIGs/Assets/Labels tabs
- Uses 3-level grid drill-down instead of 2-level master-detail

### Feature-Specific Components

| Component | Description |
|-----------|-------------|
| `MetaDashboard` | Main container, orchestrates two-panel layout |
| `MetaDashboardHeader` | "Collections: X of Y" indicator with CollectionFilterDropdown |

#### Overview Panel (Left Side)

The overview panel is **nearly identical** to Collection Dashboard and reuses the same section components:

| Component | Description |
|-----------|-------------|
| `MetaOverview` | Container for overview sections (can potentially reuse `CollectionOverview` with a `mode` prop) |

Reuses from Collection Dashboard:
- `ProgressSection`
- `CoraSection`
- `InventorySection`
- `FindingsSection`
- `ReviewAgesSection`
- `ExportMetricsSection`
- `FetchedTimestamp`

#### Navigation Panel (Right Side)

| Component | Description |
|-----------|-------------|
| `MetaNavigation` | TabView container for Collections/STIGs tabs |
| `MetaCollectionsTab` | Collections → STIGs → Checklists drill-down |
| `MetaStigsTab` | STIGs → Collections → Checklists drill-down |

### Grid Configurations

#### Collections Tab Grids

| Grid | Title Format | Key Columns |
|------|--------------|-------------|
| Grid 1: Collections | (none) | Collection, Assets, STIGs, Checklists, dates, percentages, CORA, CATs |
| Grid 2: STIGs | "STIGs in [Collection]" | Benchmark, Revision, Assets, Checks, dates, percentages, CORA, CATs |
| Grid 3: Checklists | "Checklists for [STIG] in [Collection]" | Asset, Labels, Checks, dates, percentages, CORA, CATs |

#### STIGs Tab Grids

| Grid | Title Format | Key Columns |
|------|--------------|-------------|
| Grid 1: STIGs | (none) | Benchmark, Revision, **Collections**, Assets, Checks, dates, percentages, CORA, CATs |
| Grid 2: Collections | "Collections with [STIG]" | Collection, Assets, Checks, dates, percentages, CORA, CATs |
| Grid 3: Checklists | "Checklists for [STIG] in [Collection]" | Asset, Labels, Checks, dates, percentages, CORA, CATs |

### Component Hierarchy

```
MetaDashboard
├── MetaDashboardHeader
│   └── CollectionFilterDropdown (shared)
│
├── MetaOverview (reuses Collection Dashboard sections)
│   ├── ProgressSection (shared)
│   │   ├── ProgressDonutChart (shared)
│   │   ├── StatusLegendItem (shared) x5
│   │   └── ProgressBarCell (shared) x4
│   │
│   ├── CoraSection (shared)
│   │   ├── CatBadge (shared, showLabel=true) x3
│   │   └── CoraRiskCard (shared)
│   │
│   ├── InventorySection (shared)
│   │   └── MetricCard (shared) x3
│   │
│   ├── FindingsSection (shared)
│   │   └── MetricCard (shared) x3
│   │
│   ├── ReviewAgesSection (shared)
│   │   └── MetricCard (shared) x3
│   │
│   ├── ExportMetricsSection (shared)
│   │   └── ExportOptionsPanel (shared)
│   │
│   └── FetchedTimestamp (shared)
│
└── MetaNavigation (TabView)
    ├── MetaCollectionsTab
    │   └── ThreeLevelDrilldown (shared)
    │       ├── MetricsSummaryGrid (shared) [Collections]
    │       │   └── [ProgressBarCell, CoraBadge, CatBadge per row]
    │       ├── GridFooterBar (shared)
    │       ├── MetricsSummaryGrid (shared) [STIGs]
    │       │   └── [ProgressBarCell, CoraBadge, CatBadge per row]
    │       ├── GridFooterBar (shared)
    │       ├── MetricsSummaryGrid (shared) [Checklists]
    │       │   └── [LabelChipGroup, ProgressBarCell, CoraBadge, CatBadge per row]
    │       └── GridFooterBar (shared)
    │
    └── MetaStigsTab
        └── ThreeLevelDrilldown (shared)
            ├── MetricsSummaryGrid (shared) [STIGs - with Collections column]
            │   └── [ProgressBarCell, CoraBadge, CatBadge per row]
            ├── GridFooterBar (shared)
            ├── MetricsSummaryGrid (shared) [Collections]
            │   └── [ProgressBarCell, CoraBadge, CatBadge per row]
            ├── GridFooterBar (shared)
            ├── MetricsSummaryGrid (shared) [Checklists]
            │   └── [LabelChipGroup, ProgressBarCell, CoraBadge, CatBadge per row]
            └── GridFooterBar (shared)
```

### Shared Components with Collection View

The Meta Dashboard heavily reuses Collection View components:

| Component | Reuse Notes |
|-----------|-------------|
| All Overview sections | Identical structure, different data source |
| `ProgressDonutChart` | Same component |
| `MetricsSummaryGrid` | Same component, different column configs |
| `GridFooterBar` | Same component |
| All badge components | Same components |
| `ExportOptionsPanel` | Same component |

### Unique to Meta Dashboard

| Component | Description |
|-----------|-------------|
| `CollectionFilterDropdown` | Multi-select for collections instead of labels |
| `ThreeLevelDrilldown` | 3-grid layout instead of 2-grid |
| `MetaCollectionsTab` | Collections-first navigation |
| `MetaStigsTab` | STIGs-first navigation (includes Collections count column) |

---

## Component Reuse Matrix

| Component | Dashboard | Meta Dashboard | Asset Review | Collection Review | Findings |
|-----------|:---------:|:--------------:|:------------:|:-----------------:|:--------:|
| `MetricsSummaryGrid` | ✓ | ✓ | | | |
| `ChecklistGrid` | | | ✓ | ✓ | |
| `ProgressBarCell` | ✓ | ✓ | | | |
| `LabelChipGroup` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `MetricCard` | ✓ | ✓ | | | |
| `CoraRiskCard` | ✓ | ✓ | | | |
| `RuleInfoPanel` | | | ✓ | ✓ | |
| `AttachmentList` | | | ✓ | | |
| `CoraBadge` | ✓ | ✓ | | | |
| `CatBadge` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ResultBadge` | | | ✓ | ✓ | |
| `StatusBadge` | | | ✓ | ✓ | ✓ |
| `ResultOriginBadge` | | | ✓ | ✓ | |
| `ProgressDonutChart` | ✓ | ✓ | | | |
| `StatusLegendItem` | ✓ | ✓ | | | |
| `LabelFilterDropdown` | ✓ | | | | |
| `CollectionFilterDropdown` | | ✓ | | | |
| `ExportOptionsPanel` | ✓ | ✓ | | | |
| `GridFooterBar` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `MasterDetailLayout` | ✓ | | | | |
| `ThreeLevelDrilldown` | | ✓ | | | |
| `ReviewForm` | | | ✓ | ✓ | |
| `AttributionsDisplay` | | | ✓ | | |
| `BatchEditModal` | | | | ✓ | |

---

## Implementation Priority

### Phase 1: Shared Foundation
Build reusable components first to enable parallel feature development:
1. Badge components (CatBadge, ResultBadge, StatusBadge, CoraBadge, ResultOriginBadge)
2. LabelChipGroup
3. MetricCard, CoraRiskCard
4. GridFooterBar
5. ProgressBarCell
6. MasterDetailLayout, ThreeLevelDrilldown

### Phase 2: Collection Dashboard
1. ProgressDonutChart, StatusLegendItem
2. Overview sections (Progress, CORA, Inventory, Findings, Review Ages)
3. MetricsSummaryGrid
4. LabelFilterDropdown
5. Tab navigation (STIGs, Assets, Labels)

### Phase 3: Meta-Collection Dashboard
Since it heavily reuses Collection Dashboard components, build after Phase 2:
1. CollectionFilterDropdown
2. MetaCollectionsTab, MetaStigsTab (using ThreeLevelDrilldown)
3. Wire up to multi-collection data source

### Phase 4: Review Workspaces (can parallelize)
1. RuleInfoPanel (shared)
2. ChecklistGrid (shared)
3. ReviewForm, AttributionsDisplay (shared)
4. Asset Review workspace assembly
5. Collection Review workspace assembly
6. BatchEditModal

### Phase 5: Findings Report
1. Aggregated/Individual grids
2. Aggregator controls

---

## Key PrimeVue Components

| Need | PrimeVue Component |
|------|-------------------|
| All grids | DataTable |
| Tabs | TabView, TabPanel |
| Charts | Chart (Chart.js wrapper) |
| Progress bars | ProgressBar |
| Labels/Tags | Tag |
| Badges | Badge |
| Dropdowns | Dropdown, MultiSelect |
| Buttons | Button, SplitButton |
| Forms | InputText, Textarea, Checkbox |
| Panels | Panel, Card, Fieldset |
| Layout | Splitter, SplitterPanel |
| Menus | Menu, TieredMenu |
| Modals | Dialog |
| Tooltips | Tooltip directive |
| Toolbar | Toolbar |

---

## State Management Considerations

### Global State (Pinia)
- Current user permissions
- Classification marking
- Active collection context

### Feature State (Composables)
- Collection Dashboard: Label filter, selected tab, master row selection
- Asset Review: Selected rule, review form dirty state, current STIG revision
- Collection Review: Selected rule, selected assets (for batch), review form state

### Data Fetching (Simple Composables)
Since metrics must be live (no stale data), use simple fetch composables rather than caching libraries. See `reusable-components.md` for the documented pattern.

### Cross-Component Communication
- Label filter in Dashboard affects all tab grids
- Rule selection in checklist drives RuleInfoPanel and Review panel
- Batch selection in Collection Review enables/disables toolbar buttons
