# URL state — app-wide effort

Planned as its own effort and PR (decided 2026-10-28): make URL handling consistent
across the app instead of patching it per feature. Goal: what's on screen is always
reflected in the URL, so Back, reload, recent views, and shared links restore the
same view.

## Current state

- **Findings** is the only feature that mirrors its state into the URL
  (`?agg`, `?stig`, `?sel` — `Findings/components/Findings.vue`, the
  `router.replace` watch). It reads them once on mount to restore.
- **Label filter** (`?labelName`, `?labelMatch`) lives in the URL via
  `useLabelFilterQuery`, but is carried route-to-route per call site
  (`pickLabelFilterQuery` / `labelFilterParams.value` spreads).
- **Collection tabs** are route navigation (`CollectionView.vue` activeTab setter),
  but panels stay mounted (`visitedTabs` + `v-if`), so component state survives a
  tab switch while the URL does not.

## Items

- [ ] **Tab switches drop each tab's own query.** Leaving Findings for STIGs and
  returning drops `?agg/stig/sel` while the mounted component keeps its state — URL
  and screen disagree, and Back from Asset Review lands on the default view.
  - Prototype stashed: `git stash list` → *"url-state: CollectionView per-tab query
    save/restore"*. Keeps a `tabQueries` Map in `CollectionView`: on leave, save
    `route.query` minus label keys; on return, re-attach it with the current label
    filter on top; clear on collection switch. ~10 lines, tests and lint passed.
  - Safe because hidden tabs are inert: Findings only changes state from user input
    or its one-shot mount restore, so a saved query can't go stale.

- [ ] **STIGs tab keeps no URL state.** Selected STIG (`selectedBenchmarkId` in
  `CollectionView/components/CollectionStigsTab.vue`) is memory-only, so Back from
  Asset Review resets it. Mirror it to `?stig=` the way Findings does. Same gap
  likely in the Assets and Labels tabs and the meta-dash tabs — audit them.

- [ ] **Label filter lost on round trip through Asset Review.** Links into
  `collection-asset-review` (`CollectionAssetsTab.vue` shield click, some
  `useAppBreadcrumb.js` pushes) don't spread it. Option: replace per-site spreads
  with one `router.beforeEach` that copies label keys when
  `to.params.collectionId === from.params.collectionId` and `to.query` has none,
  skipping `meta.labelFilter: false` routes (Management drops the filter on
  purpose). Costs: keys ride along on Asset Review URLs and recent-view entries;
  the nav-rail link to the current collection would keep the filter.

## Design questions for the effort

- One shared composable for state↔query mirroring (read on mount, `replace` on
  change, omit defaults) instead of each feature hand-rolling Findings' pattern?
- Carry rules in one place (router guard) vs per call site?
- Which keys are global (label filter) vs per view (`agg`, `stig`, `sel`)?
- `replace` vs `push`: which state changes deserve a history entry?
