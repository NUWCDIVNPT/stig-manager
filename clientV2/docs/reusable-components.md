# Reusable Components

Component patterns for the new client. Candidates for implementation as we develop.

**Legend:**
- **Native** - PrimeVue handles this; just use `#body` template + helper function
- **Wrapper** - Custom component wrapping PrimeVue Column
- **Shared** - Sub-component used by multiple columns/features

---

## Proposed Structure

```
src/
├── components/
│   ├── common/          # Small reusable pieces
│   │   ├── LabelsRow.vue        # Shared: label badges with overflow
│   │   ├── SeverityBadge.vue    # Shared: Cat I/II/III styled badge
│   │   ├── CORABadge.vue        # Shared: risk rating with color
│   │   └── ...
│   ├── columns/         # Reusable table columns
│   │   ├── DurationColumn.vue
│   │   ├── PercentageColumn.vue
│   │   ├── AssetWithLabelsColumn.vue
│   │   └── ...
│   └── global/          # App-wide singletons (Banner, Overlay)
├── shared/
│   └── lib/             # Helper functions
│       ├── formatters.js        # formatDuration, formatPercent
│       └── severity.js          # getSeverityColor, getCoraSeverity
```

---

## Column Components

### Native (PrimeVue `#body` template + helper)

These don't need wrapper components—just inline templates with helper functions.

| Pattern | Template Example | Helper Needed |
|---------|------------------|---------------|
| CountColumn | `{{ data.count }}` | none |
| CountWithTooltip | `<span v-tooltip="itemList">{{ count }}</span>` | `formatTooltipList()` |
| IconColumn | `<i :class="getIcon(data)" v-tooltip="label" />` | `getIconClass()` |
| ResponseCodeColumn | `<Tag :severity="getHttpSeverity(code)">{{ code }}</Tag>` | `getHttpSeverity()` |
| ResultColumn | `<Tag :severity="getResultSeverity(result)">{{ result }}</Tag>` | `getResultSeverity()` |
| ReviewStatusColumn | `<i :class="getStatusIcon(status)" />` | `getStatusIcon()` |
| BadgeColumn | `<Tag v-for="item in items" ...>` | none |
| DataWithBadgeColumn | `{{ name }} <Tag>{{ classification }}</Tag>` | none |
| ListInline | `{{ items.join(', ') }}` | none |
| ListNewline | `<div v-for="item in items">{{ item }}</div>` | none |
| ActionColumn | `<Button icon="pi pi-pencil" @click="edit" />...` | none |

### Wrapper Components (Custom Column components)

These warrant dedicated `.vue` files for reuse and consistency.

| Column | Why Wrapper | Shared Sub-components |
|--------|-------------|----------------------|
| **DurationColumn** | Complex relative time logic ("5 d", "2 h", "now") | `formatDuration()` helper |
| **PercentageColumn** | Custom thermometer visualization | none |
| **SeverityCountColumn** | Count + severity-appropriate color styling | `SeverityBadge` |
| **CORAColumn** | Risk badge with color + explanatory tooltip | `CORABadge` |
| **AssetWithLabelsColumn** | Asset name + labels sub-row | `LabelsRow` |
| **UserWithEmailColumn** | Username + email sub-row | none (or generic `SubRowColumn`) |
| **LabelsColumn** | Label badges with "+N" overflow tooltip | `LabelsRow` |
| **SingleLabelColumn** | Single styled label badge | `LabelBadge` |
| **ResultOriginColumn** | Icon + color + popover (more than just icon) | none |

### Multi-Row Pattern

For columns with main content + sub-row, consider a generic pattern:

```vue
<!-- SubRowColumn.vue -->
<Column :field="field" :header="header">
  <template #body="{ data }">
    <div class="main-row">{{ getMain(data) }}</div>
    <div class="sub-row text-muted">{{ getSub(data) }}</div>
  </template>
</Column>
```

Usage examples:
- Asset + Labels
- User + Email
- Username + Display Name
- Label + STIG (ACL rules)
- Asset + STIG (ACL rules)

---

## Shared Sub-Components

Small pieces used inside columns AND in other contexts (dashboards, panels).

| Component | Description | Used By |
|-----------|-------------|---------|
| **LabelsRow** | Label badges, "+N" overflow with tooltip | LabelsColumn, AssetWithLabelsColumn, dashboard panels |
| **SeverityBadge** | Cat I/II/III with appropriate color | SeverityColumn, SeverityCountColumn, rule displays |
| **CORABadge** | Risk rating (Very Low → Very High) with color | CORAColumn, dashboard Overview panel |
| **LabelBadge** | Single styled label | SingleLabelColumn, various |
| **ClassificationBadge** | Security classification styling | DataWithBadgeColumn (benchmarks) |

---

## PrimeVue Native Features

Don't reinvent these—use PrimeVue's built-in capabilities.

| Feature | PrimeVue Approach |
|---------|-------------------|
| **Row expansion** | `v-model:expandedRows` + `#expansion` template |
| **Cell editing** | `editMode="cell"` + `#editor` template |
| **Tooltips** | `v-tooltip` directive (positioning, delays, custom styling) |
| **Severity colors** | `<Tag severity="danger/warn/success/info">` |
| **Row styling** | `:rowClass` or `:rowStyle` props |
| **Cell background** | Dynamic classes in `#body` template |
| **Sorting** | Native Column `sortable` prop |
| **Filtering** | Native + custom `#filter` template |
| **Checkbox selection** | Native `selectionMode="multiple"` |
| **Header info icon** | Custom `#header` template with icon + tooltip |

---

## Column Features

### Header Options (Native PrimeVue)
- Sorting: `sortable` prop
- Filtering: `#filter` template
- Checkbox: Column with `selectionMode`
- Info tooltip: `#header` template + `v-tooltip`

### Cell Options (via `#body` template)
- Background color: dynamic `:class` binding
- Reactive styling: computed classes based on data

---

## Row Components

| Row Type | Implementation |
|----------|---------------|
| Checkbox row | Native: `selectionMode="multiple"` |
| Editable row | Native: `editMode="row"` + `#editor` templates |
| ExpandableReviewRow | Native: `#expansion` template with review detail content |

---

## Table Footer

- Refresh button: `#footer` template
- CSV export: `#footer` template + export logic
- Row count: `#footer` template with `{{ data.length }}`
- Totals badges: `#footer` template with Tag components

---

## Badges & Icons (Shared Components)

| Component | Variants | Usage Context |
|-----------|----------|---------------|
| SeverityBadge | Cat I (high), Cat II (medium), Cat III (low) | Rules, findings, metrics |
| SeverityCount | Count styled for severity level | Metrics columns |
| CORABadge | Very Low, Low, Moderate, High, Very High | Dashboard, metrics |
| ClassificationBadge | U, CUI, C, S, TS, etc. | Benchmarks |
| ResultBadge | Pass, Fail, Other, etc. | Reviews |
| StatusIcon | Saved, Submitted, Accepted, Rejected | Reviews |
| OriginIcon | Manual, Automated | Reviews |

---

## Assignment Interfaces

Dual-panel patterns for managing relationships.

| Pattern | Left Panel | Right Panel | Usage |
|---------|------------|-------------|-------|
| Group membership | Users grid | Groups grid (or inverse) | User group management |
| STIG assignment | Assets grid | STIGs grid | Collection settings |
| Grants | Collection users | Available users | Collection grants |
| ACL rules | Nav tree | Rules grid | Access control |

---

## Panels

### Rule/Check Panels
- **RuleCheckPanel** - Manual check/fix text
- **RuleInfoPanel** - Discussion, documentable flag, CCIs/controls
- **DetailedChangesPanel** - Diff view for rule comparison

### Display Panels
- **JsonPanel** - Formatted JSON with syntax highlighting

### Action Panels
- **ImportProgress** - CKL/SCAP import progress
- **InventoryPanel** - Export/manage actions
- **FindingsPanel** - Finding details

---

## Helper Functions (`src/shared/lib/`)

```javascript
// formatters.js
formatDuration(date)      // → "5 d", "2 h", "now"
formatPercent(value)      // → "< 1%", "50%", "> 99%"
formatTooltipList(items)  // → "Item1, Item2, +3 more"

// severity.js
getSeverityColor(cat)     // Cat I/II/III → color
getCoraSeverity(rating)   // Very Low → success, Very High → danger
getHttpSeverity(code)     // 200 → success, 500 → danger
getResultSeverity(result) // Pass → success, Fail → danger
getStatusIcon(status)     // Saved → pi-save, etc.
```
