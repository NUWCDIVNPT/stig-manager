# clientV2 Routing Review

Review of route handling, permission guards, bad-URL/error routing, and use of the URL for state.

Done items keep their original finding for reference. Line links reflect the code as of 2026-11-05.

## Index

| # | Item | Area | Status |
|---|---|---|---|
| 1 | STIG Library breadcrumb does nothing on a benchmark page | Bug | ✅ cc99e84b |
| 2 | Bad URLs trap the Back button | Bug | ✅ ec8369b7 |
| 3 | Asset Review doesn't check the asset belongs to the URL's collection | Bug | ✅ beee491b |
| 4 | Bad STIG or revision handled three different ways | Bad URL | ✅ be3c8e30 |
| 5 | Feature-flag gate has no guard test | Bad URL | ✅ a01ae6c8 |
| 6 | Orphan route `/assets/:assetId` | Security | ✅ e169a965 |
| 7 | Grants go stale | Security | ✅ c8702432 |
| 8 | Denials aren't handled consistently | Security | ✅ b34a3a59 |
| 9 | Recent views leak between users | Security | ⏭️ Skipped (accepted risk) |
| 10 | Nav rail admin check never updates | Security | ✅ 74011beb |
| 11 | Error checks rely on message text | Security | ✅ 3219802c |
| 12 | Label filter lost on the way into Asset Review | Label filter | ✅ 821c8479 |
| 13 | Tab switches drop each tab's own query | URL state | ✅ bc9d9efc |
| 14 | Collection-tab selections are local state | URL state | ✅ 9605a460 (collection tabs) |
| 15 | Collection Review selected rule isn't in the URL | URL state | ✅ uncommitted |
| 16 | Collections page tab isn't in the URL | URL state | Open |
| 17 | Grid rows aren't links | URL state | Open |
| 18 | Every page has the same browser tab title | URL state | Open |
| 19 | Recent-views cleanup matches by text | Found during fixes | Open |
| 20 | Page-level 404 redirects drop the query | Found during fixes | Open |

## Suggested order

1. ~~**#6** dead route (quick).~~ ✅
2. ~~**#12** label filter into Asset Review.~~ ✅
3. **#7–#11** route security cleanup.
4. **#13–#18** the URL-state effort (its own PR): start with the stashed prototype (#13), then #14.

---

## Done

### 1. STIG Library breadcrumb does nothing on a benchmark page — ✅ cc99e84b

- **Problem:** The page saves its own URL as the "last visited" one, so clicking the crumb lets the `beforeEnter` hook in [router/index.js](../src/router/index.js) send you straight back to the page you're on. Only the page-header title (`goToList`) clears that saved URL. The `/library` alias has the same problem.
- **Fix:** the hook now skips the restore when navigating from within the library.

### 2. Bad URLs trap the Back button — ✅ ec8369b7

- **Problem:** All four not-found redirects used `router.push` (CollectionView, AssetReview, CollectionReview, StigLibrary ×2). Pressing Back reloads the bad URL, which pushes to the 404 page again.
- **Fix:** all not-found redirects use `router.replace`.

### 3. Asset Review doesn't check the asset belongs to the URL's collection — ✅ beee491b

- **Problem:** Say a user has grants on collections 1 and 2 and opens `/collection/1/asset/<asset from collection 2>/...`. The page renders using collection 1's field settings and role, so the Accept button and required-field rules can be wrong, and saves (sent to collection 1) fail. The API still enforces on save, so this is a display bug, not a security hole.
- **Fix:** Asset Review routes to not-found when `asset.collection.collectionId` differs from the URL.

### 4. Bad STIG or revision handled three different ways — ✅ be3c8e30

- **Problem:** A bad benchmark or revision got different results:
  - STIG Library → 404 page.
  - Collection Review → global error popup. *(Correction: only for a malformed revision. A made-up STIG or revision gave an empty grid.)*
  - Asset Review → inline error.

  Bad IDs and bad STIG or revision values should all lead to the same result.
- **Fix:** `useStigRevisions` sends a STIG that doesn't exist, or a revision that STIG doesn't have (including malformed ones), to not-found on both review pages. A real STIG that isn't assigned to the collection or asset keeps the existing breadcrumb warning, empty grid or banner. Collection Review no longer opens the error popup for a 400 checklist error. This also fixed Asset Review keeping the previous STIG's revision list after a STIG switch.

### 5. Feature-flag gate has no guard test — ✅ a01ae6c8

- **Problem:** The feature-flag gate (`meta.isEnabled`) had no guard test, so breaking it would fail nothing. Coverage gap only; the gate itself worked.
- **Fix:** guard tests cover feature off (redirect) and on (allowed).

---

## Route security

**Already good:** the guard is clearly a UI convenience and the API is the real enforcement. The admin, feature-flag and `minRoleId` gates are clean and tested.

### 6. Orphan route `/assets/:assetId` — ✅ e169a965

- **Done:** route removed; a URL like `/assets/12` now lands on the 404 page.
- **Where:** `router/index.js` (was line 230)
- **Problem:** no guard, no collectionId, and nothing links to it.
- **Fix:** delete it.

### 7. Grants go stale — ✅ c8702432

- **Done:** the guard calls `refreshUser()` once before denying a grant or role check, then re-checks. Allowed navigations don't refetch, so the cost (one GET /user) only lands on a denial.
- **Problem:** The user's grants only refresh after mutations they make themselves. If an admin gives them a new grant elsewhere, the guard silently bounces them to `/collections` until they reload. (`routing-and-authorization.md` documents this as an accepted trade-off.)
- **Fix:** have the guard call `refreshUser()` once and re-check before denying.

### 8. Denials aren't handled consistently — ✅ b34a3a59

- **Done:** no grant and non-admin now go to the 404 page with the URL kept, the same as an API 403 or a bad URL. The Management tab with too low a role still goes to that collection's dashboard. The 404 text now reads "doesn't exist, or you don't have access to it."
- **Problem:**
  - No grant in the guard → silent redirect to `/collections`.
  - The API returns 403 → 404 page.
  - Not an admin → silent redirect to Home.
- **Fix:** pick one behavior, or at least show a toast.

### 9. Recent views leak between users — ⏭️ Skipped (accepted risk)

- **Decision (2026-11-06):** not fixing. It only matters when people share one OS login and browser profile, which they don't in practice. Only names show (a click on someone else's entry hits the 404 page from #8). A per-user key would only hide the list on screen; the data would still be readable in DevTools.
- **Where:** [useRecentViews.js:3](../src/features/NavRail/composables/useRecentViews.js#L3)
- **Problem:** saved in localStorage under a single key that isn't tied to the user. On a shared workstation, the next user sees the previous user's collection and asset names.
- **Fix:** add the userId to the key.

### 10. Nav rail admin check never updates — ✅ 74011beb

- **Done:** the nav rail uses `useCurrentUser().isAdmin`, the same source as the guard. Tests swap the user in the real store and check the Admin item follows.
- **Where:** [useNavItems.js:7](../src/features/NavRail/composables/useNavItems.js#L7)
- **Problem:** destructures `user` from the store, so `isAdmin` keeps the value from startup.
- **Fix:** use `useCurrentUser().isAdmin`.

### 11. Error checks rely on message text — ✅ 3219802c

- **Done:** all three pages decide by status only: 400/403/404 → not-found, anything else → error popup. Checked against the API: `PrivilegeError` is always 403 and the body's `error` is only the message text (the spec's `Error` schema types it as a plain string), so the text check added nothing. CollectionView previously sent 404s and reworded 403s to the error popup.
- **Where:** [CollectionView.vue:54](../src/features/CollectionView/components/CollectionView.vue#L54), [AssetReview.vue:44](../src/features/AssetReview/components/AssetReview.vue#L44), [CollectionReview.vue:53](../src/features/CollectionReview/components/CollectionReview.vue#L53)
- **Problem:** pages compare against `'User has insufficient privilege…'`.
- **Fix:** check for status 403 alone; it's less brittle.

---

## Label filter in the URL

**Already good:**
- One composable, [useLabelFilterQuery.js](../src/shared/composables/useLabelFilterQuery.js), owns it.
- Hand-edited URLs are cleaned up before they reach the API.
- Changes use `replace`, so they don't clutter history.
- The collection breadcrumb and tab switches carry the filter, and Management drops it.
- All of this has tests.

### 12. Label filter lost on the way into Asset Review — ✅ 821c8479

- **Done (Fix A):** all six links now carry the filter. The tabs and the Findings grid use `buildLabelFilterParams(props.selectedLabelNames)`; Findings passes the filter down to its grid and merges it with `ruleId`. The Asset Review STIG and revision dropdowns use `pickLabelFilterQuery(route.query)`, which drops `ruleId` because it belongs to the old STIG. The breadcrumb's return trip was already tested in `labelFilterRoutes.test.js`.
- **Problem:** Only STIGs tab → Collection Review carries it. These links drop it:
  - [CollectionAssetsTab.vue:86](../src/features/CollectionView/components/CollectionAssetsTab.vue#L86)
  - [CollectionStigsTab.vue:93](../src/features/CollectionView/components/CollectionStigsTab.vue#L93)
  - [CollectionLabelsTab.vue:99](../src/features/CollectionView/components/CollectionLabelsTab.vue#L99)
  - [IndividualFindingsGrid.vue:140](../src/features/Findings/components/IndividualFindingsGrid.vue#L140)
  - the Asset Review STIG and revision dropdowns ([useAppBreadcrumb.js:246](../src/features/MenuBar/composables/useAppBreadcrumb.js#L246), [useAppBreadcrumb.js:279](../src/features/MenuBar/composables/useAppBreadcrumb.js#L279))

  Because of that, the breadcrumb's "carry the filter" logic on Asset Review never has a filter to carry, and going back to the collection loses it.
- **Fix A:** add `query: pickLabelFilterQuery(...)` / `buildLabelFilterParams(...)` at each link above.
- **Fix B (from the URL-state todo):** replace the per-call-site spreads with one `router.beforeEach` that copies the label keys when `to.params.collectionId === from.params.collectionId` and `to.query` has none, skipping `meta.labelFilter: false` routes (Management drops the filter on purpose). Costs: the keys ride along on Asset Review URLs and recent-view entries, and the nav-rail link to the current collection would keep the filter.

---

## URL state (using routing to its full potential)

Planned as its own effort and PR (decided 2026-10-28; merged here from `docs/todos/url-state.md` on `new-client-todos-docs`). Goal: what's on screen is always reflected in the URL, so Back, reload, recent views and shared links restore the same view.

**Current state:** STIG Library (`ruleId`, `compareRev`, `diffKey`), Findings (`stig`, `agg`, `sel`) and Asset Review (`ruleId`) already keep their state in the URL, each with its own hand-rolled read-on-mount + `router.replace` watch. The label filter lives in the URL via `useLabelFilterQuery` but is carried route-to-route per call site.

### 13. Tab switches drop each tab's own query — ✅ bc9d9efc

- **Done:** stash applied by hand (one hunk had drifted). Tests click the real tabs: round trip restores Findings' query, no leaking between tabs, current label filter wins, Management stays unfiltered, a collection switch clears saved queries, and Back from Asset Review lands on the restored URL. The stash itself is still in `git stash list`; drop it once this is committed.
- **Problem:** Collection tabs are route navigation, but panels stay mounted (`visitedTabs` + `v-if`), so component state survives a tab switch while the URL does not. Leaving Findings for STIGs and returning drops `?agg/stig/sel` while Findings still shows them, so URL and screen disagree, and Back from Asset Review lands on the default view.
- **Prototype stashed:** `git stash list` → *"url-state: CollectionView per-tab query save/restore"*. Keeps a `tabQueries` Map in `CollectionView`: on leave, save `route.query` minus label keys; on return, re-attach it with the current label filter on top; clear on collection switch. ~10 lines, tests and lint passed.
- **Why it's safe:** hidden tabs are inert. Findings only changes state from user input or its one-shot mount restore, so a saved query can't go stale.

### 14. Collection-tab selections are local state — ✅ 9605a460 (collection tabs)

- **Done:** new shared `useQuerySelection(key)` (ref ↔ one query key, `replace`). STIGs `?stig=`, Assets `?asset=`, Labels `?label=` (unlabeled row = `none`) and `?asset=`. Tabs now keep a selection that is still listed after a reload or filter change, and fall back to the first row (STIGs/Assets) or nothing (Labels) otherwise. The helper only writes while its own tab is the current route (hidden tabs stay mounted), re-syncs when the tab comes back, and builds same-tick writes on each other so the Labels tab can change two keys at once.
- **Still open:** the Collections page (meta) tabs; do them with #16.
- **Not done (decided 2026-11-06):** the collection breadcrumb on review pages still opens the default tab with nothing selected. Remembering each collection's last view for the crumb was built and then dropped as too complex; Back, reload, Recent views and links do restore the selection.
- **Problem:** the selected STIG, asset and label in the collection tabs are plain refs (e.g. `selectedBenchmarkId` in `CollectionStigsTab.vue`). Back from Asset Review loses the selection, and you can't link to "collection X with STIG Y selected." Same gap in the meta-dash (Collections page) tabs. This is the biggest UX gap.
- **Fix:** mirror them to the query the way Findings does (`?stig=` etc.).

### 15. Collection Review selected rule isn't in the URL — ✅ uncommitted

- **Done:** `selectedRuleId = useQuerySelection('ruleId')`, the same key as Asset Review. A rule restored from the URL is loaded once the checklist confirms it; an unknown one falls back to the first rule. When the STIG or revision changes on the same page (dropdowns, Back/Forward), the rule comes from the new URL, so a dropdown switch starts at the first rule.
- **Where:** [CollectionReview.vue:100](../src/features/CollectionReview/components/CollectionReview.vue#L100)
- **Problem:** `selectedRuleId` is a plain ref, while Asset Review keeps `?ruleId` in the URL.
- **Fix:** mirror it to `?ruleId` like Asset Review.

### 16. Collections page tab isn't in the URL

- **Where:** [MetaCollectionView.vue:17](../src/features/MetaCollectionView/components/MetaCollectionView.vue#L17)
- **Problem:** `activeTab` is a plain ref.
- **Fix:** put it in the query or make the tabs child routes, like CollectionView.

### 17. Grid rows aren't links

- **Problem:** rows navigate with `router.push`, so there's no Ctrl-click or middle-click to open in a new tab and no link to copy.
- **Fix:** render shield and action buttons as `<router-link>` or use `router.resolve().href`.

### 18. Every page has the same browser tab title

- **Fix:** a `router.afterEach` hook could build titles from the existing `meta.breadcrumbs`.

### Design questions for #13–#18

- One shared composable for state↔query mirroring (read on mount, `replace` on change, omit defaults) instead of each feature hand-rolling Findings' pattern?
- Carry rules in one place (router guard) vs per call site?
- Which keys are global (label filter) vs per view (`agg`, `stig`, `sel`)?
- `replace` vs `push`: which state changes deserve a history entry?

---

## Found during fixes

### 19. Recent-views cleanup matches by text

- **Where:** [CollectionView.vue](../src/features/CollectionView/components/CollectionView.vue) (`onError` of the collection fetch); AssetReview and CollectionReview use the same `key.includes(...)` pattern.
- **Problem:** `removeView(key => key.includes(':12'))` also matches `collection:123`, so a 404 on collection 12 drops collection 123's recent entries too.
- **Fix:** match on whole key segments (e.g. split on `:` and compare the id), or remove by exact key.

### 20. Page-level 404 redirects drop the query

- **Where:** the `redirectToNotFound` / `onError` redirects in CollectionView, AssetReview and CollectionReview.
- **Problem:** they pass only `pathMatch`, so `?labelName=…` (and any hash) is lost on the 404 page. The guard's redirect from #8 keeps the query and hash, so the two paths to the same 404 page disagree.
- **Fix:** pass `query: route.query, hash: route.hash` too, ideally through one shared helper used by the guard and the pages.
