import { collectionKeys } from './collectionKeys'

const metaRoot = ['collections', 'meta', 'metrics']

const scopedMeta = (segment, scope) => [...metaRoot, segment, scope]

export const metricsKeys = {
  collectionDetail: (collectionId, scope) => collectionKeys.metricsDetail(collectionId, scope),
  collectionSummary: (collectionId, scope) => collectionKeys.metricsSummary(collectionId, scope),
  collectionDetailAsset: collectionId => collectionKeys.metricsDetail(collectionId, 'asset'),
  collectionDetailCollection: collectionId => collectionKeys.metricsDetail(collectionId, 'collection'),
  collectionDetailLabel: collectionId => collectionKeys.metricsDetail(collectionId, 'label'),
  collectionDetailStig: collectionId => collectionKeys.metricsDetail(collectionId, 'stig'),
  collectionSummaryAsset: collectionId => collectionKeys.metricsSummary(collectionId, 'asset'),
  collectionSummaryCollection: collectionId => collectionKeys.metricsSummary(collectionId, 'collection'),
  collectionSummaryLabel: collectionId => collectionKeys.metricsSummary(collectionId, 'label'),
  collectionSummaryStig: collectionId => collectionKeys.metricsSummary(collectionId, 'stig'),

  metaDetail: scope => scopedMeta('detail', scope),
  metaSummary: scope => scopedMeta('summary', scope),
  metaDetailAsset: () => metricsKeys.metaDetail('asset'),
  metaDetailCollection: () => metricsKeys.metaDetail('collection'),
  metaDetailLabel: () => metricsKeys.metaDetail('label'),
  metaDetailStig: () => metricsKeys.metaDetail('stig'),
  metaSummaryAsset: () => metricsKeys.metaSummary('asset'),
  metaSummaryCollection: () => metricsKeys.metaSummary('collection'),
  metaSummaryLabel: () => metricsKeys.metaSummary('label'),
  metaSummaryStig: () => metricsKeys.metaSummary('stig'),
}
