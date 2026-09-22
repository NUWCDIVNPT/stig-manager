# Typography and Sizing

The client sizes everything from one number: the root font size in `src/style.css` (`:root { font-size: 12px }`). Text, row heights, column widths and icon sizes are declared in `rem` and derive from it, so the root can change without re-tuning anything. A convention test (`src/shared/tests/typographyConventions.test.js`) enforces the rules below on every source file.

## Type scale

Every `font-size` in a component, stylesheet or PrimeVue `pt` string is one of these tokens, declared once in `style.css`:

| token | rem | at 12px | use for |
|---|---|---|---|
| `--text-sm` | 0.85 | 10.2px | badges, pills, counts, author/timestamp lines, uppercase kicker labels, character counters |
| `--text-md` | 1 | 12px | everything the user reads to act on: body, table cells, inputs, form labels, hints, validation messages, buttons, log and `pre` output, modal content, table headers (dense review-grid headers use `sm`) |
| `--text-lg` | 1.1 | 13.2px | Review checklist cell text, Rule titles, nav rail labels, in-page panel titles |
| `--text-xl` | 1.25 | 15px | section headings, modal titles, breadcrumb, large stat values |
| `--text-2xl` | 1.5 | 18px | page titles, wizard step titles, empty-state headlines, the CORA score |
| `--text-display` / `-lg` / `-xl` | 2 / 3 / 5 | | 404 code, bootstrap art, large standalone icons |
| `--icon-xs` | 0.75 | 9px | standalone glyphs only: carets, clear and dismiss buttons, row action pencils |

Rules:

- **One text size below the root.** `sm` is for things that are scanned, not read. Text the user must read to act on (a validation message, a form label, a hint, an error detail) is `md` even when it is secondary; use `--color-text-dim` for hierarchy, not a smaller size.
- **Icons inline with text inherit** the text size. Only a standalone glyph takes `--icon-xs`; larger standalone icons take `xl`, `2xl` or a display token.
- **No literal sizes anywhere**: not in `<style>`, not in a `pt` string (`style: 'font-size: var(--text-md);'`), not in a style object (`fontSize: 'var(--text-md)'`), and no `font:` shorthand. `inherit` is allowed.
- **Code that needs the number** (grid geometry, text measurement) reads `TEXT_SCALE_REM` from `src/shared/lib/textScale.js`, which mirrors every `--text-*` token. The convention test fails if the two drift.

If a design needs a size that is not on the scale, the answer is almost always a neighbouring token plus weight or color. Adding a token is a deliberate change: add it to `style.css`, to `textScale.js` if code needs it, and to this table.

```vue
<style scoped>
.field-error {
  font-size: var(--text-md);
  color: var(--color-text-error);
}
.readonly-badge {
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
}
.clear-btn .pi {
  font-size: var(--icon-xs);
}
</style>
```

## Font families

Two families ship with the app; nothing else is named in source.

- **Open Sans** is the body font and is inherited. Components never set it. (`style.css` re-applies it to form controls, because user-agent stylesheets give those an explicit family.)
- **Ubuntu Mono** is `var(--font-mono)`. Use it for identifiers (benchmark, rule, group, CCI), timestamps, code, logs and diffs, where fixed-width alignment helps scanning. Use it sparingly; primary content stays in Open Sans.
- **Ubuntu Mono is regular weight only.** `font-synthesis-weight: none` stops the browser faking a bold, so an element that asks for `font-weight` above 400 with the mono token falls back to the system mono stack and looks different. Emphasise mono text with color or background, never weight. If a heading inside a mono container needs to be bold, keep the heading in Open Sans and put the token on the content below it.

`font-family` in a component is `var(--font-mono)` or `inherit`; the convention test rejects anything else.

## Row heights and virtual scrollers

Virtual scrollers need a pixel `itemSize`, and rows are pinned to it (`height: var(--item-size); overflow: hidden`). A row that renders taller than its slot drifts as the list scrolls; a row that renders shorter leaves a gap at the end. Because the rows themselves are sized in rem, the pixel value must derive from the root:

- **Fixed-height lists** pick a token from `ROW_HEIGHT_REM` in `src/shared/lib/rowHeights.js` and convert it once at setup with `rowHeightPx(kind)`. Choose the smallest token whose height fits the tallest thing in the row (a badge, a Select, a two-line cell). Bind it as `--item-size` on the table root and pin the row height in CSS from that variable. `rowHeights.test.js` fails if a component converts a row height any other way.
- **Density grids** (the Review checklists, Findings, STIG Library) call `useGridDensity(gridKey)`. Geometry lives in one table, `GRID_GEOMETRY`, keyed by grid: the cell text size as a `--text-*` token name, the padding around the text, and the natural height of the tallest non-text cell. The composable returns `gridStyle`, which binds `--line-clamp`, `--item-size`, `--cell-font-size` and `--cell-line-height` on the grid root; the clamped cell rule reads the last two, so `N` clamped lines fill exactly `N` lines and the scroller's `n × itemSize` placement holds. A header and body that share a key share the same geometry and the same density state. `useGridDensity.test.js` fails on a grid key that is used but not registered.

```js
// Fixed-height list
import { rowHeightPx } from '../../shared/lib/rowHeights.js'
const ROW_HEIGHT = rowHeightPx('standard')
```
```vue
<DataTable :virtual-scroller-options="{ itemSize: ROW_HEIGHT }" :style="{ '--item-size': `${ROW_HEIGHT}px` }">
```
```css
:deep(.p-datatable-tbody > tr) { height: var(--item-size); overflow: hidden; }
```

```vue
<!-- Density grid: cell text follows the geometry, not a literal -->
<script setup>
const { itemSize, gridStyle } = useGridDensity('collection-checklist')
</script>
<template>
  <DataTable :style="gridStyle" :virtual-scroller-options="{ itemSize }">
</template>
<style scoped>
.cell-text {
  font-size: var(--cell-font-size);
  line-height: var(--cell-line-height);
}
</style>
```

`remToPx()` in `src/shared/lib/remToPx.js` is the one place that reads the root size; call it at setup, not inside a render or a per-row computed, and never with a literal from a component.

## Column widths

Column widths are `rem`, never `px`, so they follow the root with the text they hold. For a grid with a fixed set of columns, declare the widths beside the column definitions and give the table `table-style="table-layout: fixed"` so the browser honours them; spare width is then shared out proportionally and long-text columns (names, labels, titles) get the room. `MetricsSummaryGrid.vue` is the reference. Two things to know when picking a width:

- The floor for a narrow column is its header text plus the sort icon at the `md` header size, not the digits below it. Shorten the header before shrinking the width.
- With resizable columns, use `column-resize-mode="expand"` so dragging a column widens the table and scrolls it. In `fit` mode PrimeVue takes the width from the neighbouring column and will squeeze it to a few pixels.

## Measuring text

When a component fits content to a width (the label chips in `LabelsRow`), measure with `measureTextWidth(text, font)` from `src/shared/lib/textWidth.js` and build the font string from the same token the CSS uses:

```js
const LABEL_FONT = `600 ${TEXT_SCALE_REM.md * rootFontSizePx()}px ${bodyFontFamily()}`
```

The module shares one canvas and one cache across callers and invalidates when a web font finishes loading, so the estimate and the rendered chip stay equal.

## Checklist for a new component

- Font sizes are `var(--text-*)` (or `--icon-xs` for a lone glyph); no literal rem, px, em or `font:` shorthand.
- No `font-family` unless it is `var(--font-mono)`, and then no `font-weight` with it.
- A virtual scroller takes `rowHeightPx(kind)` or `useGridDensity(gridKey)`, binds `--item-size`, and pins its rows to it.
- Column widths, paddings and gaps are `rem`.
- `npx vitest run src/shared/tests/typographyConventions.test.js src/shared/lib/rowHeights.test.js src/shared/composables/useGridDensity.test.js` passes.
