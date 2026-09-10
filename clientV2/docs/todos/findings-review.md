# Findings feature — open TODOs

Originated from the branch review of `new-client-findings-individual-row-tests` vs
`new-client` (2026-06-10). Cross-cutting items from that review live in
[common.md](common.md).

## Layout

- [ ] **Header "Overall" CAT totals wrap to two lines ("CAT" over "1") when squeezed.**
  In `AggregatedFindingsGrid.vue`, each pill's `.header-cat-pill__label` (~L399, renders
  "CAT 1/2/3") has no `white-space: nowrap`, and `.agg-grid-panel__totals` (`margin-left: auto`,
  no min-width) lets the pills shrink, so the label breaks. Keep each pill one line —
  `white-space: nowrap` on the label and/or `flex-shrink: 0` on `.header-cat-pill`.
