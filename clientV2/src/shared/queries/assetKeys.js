export const assetKeys = {
  all: ['assets'],
  detail: assetId => [...assetKeys.all, assetId],

  checklists: assetId => [...assetKeys.detail(assetId), 'checklists'],
  checklist: (assetId, benchmarkId, revisionStr) => [
    ...assetKeys.checklists(assetId),
    benchmarkId,
    revisionStr,
  ],

  metadata: assetId => [...assetKeys.detail(assetId), 'metadata'],
  metadataKeys: assetId => [...assetKeys.metadata(assetId), 'keys'],
  metadataKey: (assetId, key) => [...assetKeys.metadataKeys(assetId), key],

  stigs: assetId => [...assetKeys.detail(assetId), 'stigs'],
  stigDetail: (assetId, benchmarkId) => [...assetKeys.stigs(assetId), benchmarkId],
}
