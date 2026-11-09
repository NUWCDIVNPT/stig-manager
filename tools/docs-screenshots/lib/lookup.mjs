import { api } from './api.mjs'

// Name-to-id lookups so manifest entries can name things instead of hardcoding ids
// that change whenever the fixture is regenerated.
export async function buildLookup() {
  const list = await api('/collections?elevate=true')
  const collections = await Promise.all(list.map(c =>
    api(`/collections/${c.collectionId}?projection=assets&projection=stigs&projection=labels&elevate=true`)))
  const byName = new Map(collections.map(c => [c.name, c]))
  const need = (map, name, what) => {
    const v = map.get(name)
    if (!v) throw new Error(`Unknown ${what} "${name}". Known: ${[...map.keys()].join(', ')}`)
    return v
  }
  return {
    collections,
    collectionId: name => need(byName, name, 'collection').collectionId,
    assetId: (collectionName, assetName) => {
      const c = need(byName, collectionName, 'collection')
      const a = c.assets.find(a => a.name === assetName)
      if (!a) throw new Error(`Unknown asset "${assetName}" in "${collectionName}". Known: ${c.assets.map(a => a.name).join(', ')}`)
      return a.assetId
    },
    labelId: (collectionName, labelName) => {
      const c = need(byName, collectionName, 'collection')
      const l = c.labels.find(l => l.name === labelName)
      if (!l) throw new Error(`Unknown label "${labelName}" in "${collectionName}"`)
      return l.labelId
    },
    assetReviewRoute: async (collectionName, assetName, benchmarkId, revisionStr = 'latest') => {
      const collectionId = need(byName, collectionName, 'collection').collectionId
      const c = need(byName, collectionName, 'collection')
      const a = c.assets.find(a => a.name === assetName)
      if (!a) throw new Error(`Unknown asset "${assetName}"`)
      return `/collection/${collectionId}/asset/${a.assetId}/stig/${benchmarkId}/revision/${revisionStr}`
    },
  }
}
