const appendScope = (base, scope) => [...base, scope]

export const collectionKeys = {
  all: ['collections'],
  detail: collectionId => [...collectionKeys.all, collectionId],

  archive: {
    root: collectionId => [...collectionKeys.detail(collectionId), 'archive'],
    ckl: collectionId => [...collectionKeys.archive.root(collectionId), 'ckl'],
    cklb: collectionId => [...collectionKeys.archive.root(collectionId), 'cklb'],
    xccdf: collectionId => [...collectionKeys.archive.root(collectionId), 'xccdf'],
  },

  assets: collectionId => [...collectionKeys.detail(collectionId), 'assets'],

  checklists: (collectionId, benchmarkId, revisionStr) => [
    ...collectionKeys.detail(collectionId),
    'checklists',
    benchmarkId,
    revisionStr,
  ],

  clone: collectionId => [...collectionKeys.detail(collectionId), 'clone'],

  exportTo: (collectionId, destinationCollectionId) => [
    ...collectionKeys.detail(collectionId),
    'export-to',
    destinationCollectionId,
  ],

  findings: collectionId => [...collectionKeys.detail(collectionId), 'findings'],

  grants: {
    root: collectionId => [...collectionKeys.detail(collectionId), 'grants'],
    detail: (collectionId, grantId) => [...collectionKeys.grants.root(collectionId), grantId],
    acl: (collectionId, grantId) => [...collectionKeys.grants.detail(collectionId, grantId), 'acl'],
  },

  labels: collectionId => [...collectionKeys.detail(collectionId), 'labels'],
  labelsBatch: collectionId => [...collectionKeys.labels(collectionId), 'batch'],
  labelDetail: (collectionId, labelId) => [...collectionKeys.labels(collectionId), labelId],
  labelAssets: (collectionId, labelId) => [...collectionKeys.labelDetail(collectionId, labelId), 'assets'],

  metadata: collectionId => [...collectionKeys.detail(collectionId), 'metadata'],
  metadataKeys: collectionId => [...collectionKeys.metadata(collectionId), 'keys'],
  metadataKey: (collectionId, key) => [...collectionKeys.metadataKeys(collectionId), key],

  metrics: collectionId => [...collectionKeys.detail(collectionId), 'metrics'],
  metricsDetail: (collectionId, scope) => appendScope([...collectionKeys.metrics(collectionId), 'detail'], scope),
  metricsSummary: (collectionId, scope) => appendScope([...collectionKeys.metrics(collectionId), 'summary'], scope),
  assetSummary: collectionId => collectionKeys.metricsSummary(collectionId, 'asset'),
  detailByAsset: collectionId => collectionKeys.metricsDetail(collectionId, 'asset'),
  detailByCollection: collectionId => collectionKeys.metricsDetail(collectionId, 'collection'),
  detailByLabel: collectionId => collectionKeys.metricsDetail(collectionId, 'label'),
  detailByStig: collectionId => collectionKeys.metricsDetail(collectionId, 'stig'),
  summaryByAsset: collectionId => collectionKeys.metricsSummary(collectionId, 'asset'),
  summaryByCollection: collectionId => collectionKeys.metricsSummary(collectionId, 'collection'),
  summaryByLabel: collectionId => collectionKeys.metricsSummary(collectionId, 'label'),
  summaryByStig: collectionId => collectionKeys.metricsSummary(collectionId, 'stig'),

  poam: collectionId => [...collectionKeys.detail(collectionId), 'poam'],

  reviewHistory: collectionId => [...collectionKeys.detail(collectionId), 'review-history'],
  reviewHistoryStats: collectionId => [...collectionKeys.reviewHistory(collectionId), 'stats'],

  stigs: collectionId => [...collectionKeys.detail(collectionId), 'stigs'],
  stigsDetail: (collectionId, benchmarkId) => [...collectionKeys.stigs(collectionId), benchmarkId],
  stigsAssets: (collectionId, benchmarkId) => [...collectionKeys.stigsDetail(collectionId, benchmarkId), 'assets'],

  unreviewedAssets: collectionId => [...collectionKeys.detail(collectionId), 'unreviewed', 'assets'],
  unreviewedRules: collectionId => [...collectionKeys.detail(collectionId), 'unreviewed', 'rules'],

  usersEffectiveAcl: (collectionId, userId) => [...collectionKeys.detail(collectionId), 'users', userId, 'effective-acl'],
}
