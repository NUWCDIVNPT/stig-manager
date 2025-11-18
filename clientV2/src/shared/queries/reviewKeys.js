import { collectionKeys } from './collectionKeys'

export const reviewKeys = {
  all: collectionId => [...collectionKeys.detail(collectionId), 'reviews'],
  asset: (collectionId, assetId) => [...reviewKeys.all(collectionId), assetId],
  rule: (collectionId, assetId, ruleId) => [...reviewKeys.asset(collectionId, assetId), ruleId],
  metadata: (collectionId, assetId, ruleId) => [...reviewKeys.rule(collectionId, assetId, ruleId), 'metadata'],
  metadataKeys: (collectionId, assetId, ruleId) => [...reviewKeys.metadata(collectionId, assetId, ruleId), 'keys'],
  metadataKey: (collectionId, assetId, ruleId, key) => [...reviewKeys.metadataKeys(collectionId, assetId, ruleId), key],
}
