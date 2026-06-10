# Pending API Enhancements

Tracks API gaps blocking — or partially compromising — clientV2 features. Each entry describes the endpoint(s) involved, the feature that needs the change, the current limitation, and a proposed shape for the enhancement. Add to the list as you encounter new gaps.

These are **server-side** changes — the OpenAPI spec, the service layer, and the underlying SQL all need to be updated. The clientV2 code currently has `TODO(label-filter)` (or similar) comments at the call sites that reference this document.

---

## 1. Label filtering on `GET /collections/{collectionId}/findings`

**Operation:** `getFindingsByCollection`
**Feature:** Findings report — middle pane (AggregatedFindingsGrid)
**Consumer:** [`useFindings`](../src/features/Findings/composables/useFindings.js)

### Current behavior

The endpoint accepts `aggregator`, `acceptedOnly`, `benchmarkId`, `assetId`, `projection`. **No label parameters.** Aggregated findings rows and their `assetCount` always reflect the entire collection, regardless of the orchestrator-level label filter.

### Why it matters

When a user narrows the Findings view with the label filter chip:

- The "Overall" CAT 1/2/3 totals **do** update (driven by `getCollectionStigs`, which accepts labels).
- The aggregated findings rows and asset counts **do not** — the user sees rules counted against assets that don't carry the selected label.
- The right pane (individual findings) inherits the same gap because it filters reviews by the aggregator-value the user clicked.

The result is an inconsistency the user notices: the popover summary disagrees with the grid.

### Proposed shape

Accept the same three params used elsewhere in the spec (e.g. `getAssets`, `getMetricsDetailByCollection`):

```
GET /collections/{collectionId}/findings
  ?labelId={labelId}        # repeatable
  &labelName={labelName}    # repeatable
  &labelMatch=null          # match assets with no labels
```

Reuse the existing `LabelIdQuery` / `LabelNameQuery` / `LabelMatchQuery` parameter components. Server-side: intersect the asset set with the label filter before computing aggregations.

### Client-side workaround (not yet implemented)

Pre-resolve `labelIds → assetIds` via `GET /assets?collectionId=X&labelId=...` and pass `assetId=[...]` to the findings endpoint. Costs one extra request per filter change and doesn't degrade gracefully for collections with very many assets.

---

## 2. Label filtering on `GET /collections/{collectionId}/reviews`

**Operation:** `getReviewsByCollection`
**Feature:** Findings report — right pane (IndividualFindingsGrid)
**Consumer:** [`useFindingReviews`](../src/features/Findings/composables/useFindingReviews.js)

### Current behavior

The endpoint accepts `rules`, `result`, `status`, `ruleId`, `groupId`, `cci`, `userId`, `assetId`, `benchmarkId`, `metadata`, `projection`. **No label parameters.**

### Why it matters

Same root cause as (1) — the individual findings pane shows review records for assets that don't meet the active label filter. Even if (1) is addressed first, the right pane needs the same fix to stay consistent when the user drills in.

### Proposed shape

Identical to (1):

```
GET /collections/{collectionId}/reviews
  ?labelId={labelId}        # repeatable
  &labelName={labelName}    # repeatable
  &labelMatch=null
```

### Notes

(1) and (2) should ship together. Implementing only (1) would leave the drill-down inconsistent in a more visible way than the current state.

---

## 3. Rule text search

**Operations:** (new) — or extension of `getRulesByRevision`
**Feature:** STIG Library — rule pane filter / cross-revision search
**Consumer:** [`STIGLibrary/components/RulePane.vue`](../src/features/STIGLibrary/components/RulePane.vue) and friends

### Current behavior

The only rule-listing endpoint is `GET /stigs/{benchmarkId}/revisions/{revisionStr}/rules` (`getRulesByRevision`), which returns **all** rules for one revision with no text-search params. Filtering by check text / fix text / discussion content currently has to happen client-side after the full payload arrives, and there is no way to search across revisions or across benchmarks without N round-trips.

### Why it matters

Users routinely want to find rules by phrases inside the check/fix/discussion text — "all rules mentioning SELinux", "rules that reference a specific registry path", etc. The STIG Library page is the natural home for this, but the current endpoint shape forces either:

- Loading the full revision and filtering in the browser (works for one revision, doesn't scale across many).
- N requests, one per revision, which is prohibitive for users who want to search the whole catalog.

### Proposed shape

Two reasonable options — discuss before implementing:

**Option A — new dedicated search endpoint**

```
GET /stigs/rules/search
  ?q={substring}                  # required, full-text match against title / vulnDiscussion / checkContent / fixText / weight
  &field={field}                  # optional, restrict the match to one field
  &benchmarkId={id}               # repeatable, optional
  &revisionStr={V*R*}             # optional, ignored unless benchmarkId is single
  &severity={high|medium|low}     # optional
  &limit={n}                      # default 100
  &projection=stig                # so each hit knows where it came from
```

Returns an array of rule projections augmented with the originating `benchmarkId` + `revisionStr` (and ideally a snippet of the matched text for highlighting). Latest-revision-only by default; opt into older revisions explicitly.

**Option B — extend `getRulesByRevision` with a `contains` param**

Lower-impact but limited to one revision at a time, which doesn't satisfy the cross-STIG use case.

### Notes

Option A is the one users actually need. The implementation cost is real (a server-side full-text index would help, but a `LIKE %q%` against the existing rule-text columns is a reasonable v1 and matches how the legacy ExtJS client searched the loaded payload). Highlighting is nice-to-have; the v1 client can re-find the match locally.
