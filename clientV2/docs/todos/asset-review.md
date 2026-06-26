# Asset Review — open TODOs

Items for the Asset Review checklist grid (`src/features/AssetReview/`), where one
asset is reviewed across many rules (rows = rules).

## Bugs

- [ ] **Review edit popover doesn't show the evaluator username or the status
  user/timestamp.** `components/common/ReviewEditPopover.vue` binds
  `currentReview.username`, `currentReview.status.ts`, and
  `currentReview.status.user.username`, but the grid feeds it flat
  `getChecklistByAssetStig` (json-access) rows that don't carry those. Two ways to get
  the data:
  - **Extend the checklist response** so `getChecklistByAssetStig` (json-access) carries
    `username` and a status object; bind those. Server-side, no extra request. Preferred.
  - **Also call `getReviewsByAsset`** (`collections/{collectionId}/reviews/{assetId}`)
    and merge into the rows by `ruleId`. Caveat: benchmark-scoped (`benchmarkId` +
    `rules=current|all`), no `revisionStr` param, so it can't be pinned to the viewed
    revision; extra request per load.

  Collection Review's equivalent grid already does this correctly — it merges the review
  endpoint (`getReviewsByCollection`, fetched per rule across all assets) into its rows by
  `assetId` (`CollectionReview.vue` `mergedReviewsData`), so its popover gets the full
  `Review` shape. That's the proven pattern for the second option.
