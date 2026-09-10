# Pending API Enhancements

Tracks API gaps blocking — or partially compromising — clientV2 features. Each entry describes the endpoint(s) involved, the feature that needs the change, the current limitation, and a proposed shape for the enhancement. Add to the list as you encounter new gaps.

These are **server-side** changes — the OpenAPI spec, the service layer, and the underlying SQL all need to be updated. When a gap has a client call site, leave a `TODO`-style comment there that references this document so the two can be reconciled when the API catches up.

---

## 1. Rule text search

**Operations:** (new) — or extension of `getRulesByRevision`
**Feature:** STIG Library — rule pane filter / cross-revision search
**Consumer:** [`STIGLibrary/components/RulePane.vue`](../../src/features/STIGLibrary/components/RulePane.vue) and friends

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

---

## 2. Asset search across collections

**Operation:** (new) — or extension of `getAssets`
**Feature:** Meta-dashboard — asset lookup across the selected collection set (net-new feature request, not a regression)
**Consumer:** [`MetaStigsTab`](../../src/features/MetaCollectionView/components/MetaStigsTab.vue) / a future Meta asset panel

### Current behavior

`getAssets` is single-collection scoped — `GET /collections/{collectionId}/assets` (and `GET /assets?collectionId={id}` takes one collection). The meta-dashboard operates over a *set* of collections (`selectedCollectionIds`), but there is no way to query assets across them in one request. The STIGs tab can only reach assets by drilling STIG → one collection → assets (`fetchCollectionChecklistAssets`, one collection at a time).

### Why it matters

Reviewers using the meta-dashboard routinely want to find an asset — by name, FQDN, or IP — across every Collection they oversee ("where does host X live?") without first knowing which Collection holds it. Today that is N manual per-Collection lookups.

### Proposed shape

Accept a repeatable `collectionId` (the meta set) plus a search term:

```
GET /assets
  ?collectionId={id}     # repeatable — the selected meta set
  &name={substring}      # match name / FQDN / IP
  &benchmarkId={id}      # optional — scope to one STIG
  &projection=stigs
```

Each hit carries its originating `collectionId` so the client can route to the right Collection/Asset.

### Notes

Grant enforcement is the non-trivial part: a caller may hold a grant on only some of the requested collections. The endpoint should intersect with the caller's accessible set and silently drop the rest, rather than 403 the whole request — otherwise the meta-dashboard becomes unusable for anyone without uniform access across the set.

---

## 3. Prior-revision rule content for the "same rule"

**Operation:** (new) — e.g. `GET /stigs/{benchmarkId}/rules/{ruleId}/revisions`
**Feature:** Review presentation — diff the current rule's check (or other fields) against the rule content that was in effect when the Review was last touched
**Consumer:** [`useRuleDetail`](../../src/features/AssetReview/composables/useRuleDetail.js) / a future rule-content diff panel in Asset Review

### Current behavior

Rule content lookups are either ruleId-scoped (`getRuleByRuleId` — unpinned, with documented edge cases) or pinned to one revision (`getRuleByRevision`). There is no endpoint that, given a rule, returns the corresponding rule content from **other revisions of the same benchmark**. RuleIds mutate across revisions (the `rNNN` segment increments even for trivial edits), so "same rule" has to be resolved through a stable key — `version` (STIG ID), with `groupId` as a secondary candidate. Reaching prior-revision content today means: `getRevisionsByBenchmarkId`, then the **full** rule list per revision, then a client-side join — the entire catalog fetched to diff one rule.

### Why it matters

Reviews are keyed by `(assetId, version, checkDigest)` (see the `rule_version_check_digest` joins in `ReviewService`). When a new revision changes a rule's check content, the digest changes and the existing Review no longer attaches — precisely the moment a reviewer asks "what changed in the check since I evaluated this?". The review presentation should answer that with an inline diff of check content (and optionally fix text / discussion) between the reviewed-era rule and the current one, rather than sending the user to hunt through the STIG Library.

### Proposed shape

```
GET /stigs/{benchmarkId}/rules/{ruleId}/revisions
  ?projection=check,fix,detail    # same projections as getRuleByRevision
```

Server resolves `{ruleId}` to its `version` (STIG ID), then returns one entry per revision of the benchmark where a rule with that `version` exists:

```
[ { revisionStr, ruleId, version, groupId, title, severity, checkDigest, ...projections } ]
```

Keying the path on `ruleId` (not `version`) matches what the client already holds in the review presentation; returning `checkDigest` per entry lets the client identify which prior revision the existing Review actually matches, not just the immediately previous one.

### Notes

The STIG Library's revision diff ([`useRevisionDiff`](../../src/features/STIGLibrary/composables/useRevisionDiff.js)) already joins revisions by `rule.version` client-side — same mapping, so the server and client agree on what "same rule" means. `groupId` alone is not sufficient (DISA's group renumbering makes it less stable than the STIG ID) but could serve as a fallback when `version` is absent. Diff rendering itself stays client-side; the endpoint only needs to supply the per-revision text.

---

## 4. Label filtering on POA&M export (not a priority)

**Operations:** `getPoamByCollection`
**Feature:** Findings — POA&M export (`PoamExport.vue`)

### Current behavior

The endpoint accepts `aggregator`, `acceptedOnly`, `benchmarkId`, `assetId`, and the format/date/status fields. **No label parameters.** The controller calls `CollectionService.getFindingsByCollection` without `labelIds`/`labelNames`/`labelMatch`, even though the service accepts them (the findings and reviews endpoints already expose them).

### Why it matters

The Findings grid honors the orchestrator-level label filter, but the POA&M generated from that grid is always collection-wide. A user who narrows to a label, sees N rows, and exports gets a workbook covering every asset in the collection, with no hint that the scopes differ. The legacy client has no label filter on its Findings panel, so this is a clientV2-only inconsistency rather than a regression.

### Proposed shape

Add `LabelIdQuery` / `LabelNameQuery` / `LabelMatchQuery` to `getPoamByCollection` and pass them through the controller to `getFindingsByCollection`. Client side, thread the same label params `useFindings` builds into `downloadPoam`. `AssetIdQuery` on this endpoint is single-valued, so a client-side labelIds → assetIds pre-resolution does not generalize.
