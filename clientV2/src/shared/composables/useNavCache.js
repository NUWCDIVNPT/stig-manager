import { reactive } from 'vue'
import { useGlobalAppStore } from '../stores/globalAppStore.js'

const cache = reactive({
  collections: new Map(),
  assets: new Map(),
  stigs: new Map(),
})

let initialized = false

function initFromGrants() {
  if (initialized) return
  const { user } = useGlobalAppStore()
  if (user?.collectionGrants) {
    for (const grant of user.collectionGrants) {
      cache.collections.set(String(grant.collection.collectionId), grant.collection.name)
    }
    initialized = true
  }
}

export function useNavCache() {
  initFromGrants()

  return {
    getCollectionName(collectionId) {
      return cache.collections.get(String(collectionId))
    },

    setCollectionName(collectionId, name) {
      cache.collections.set(String(collectionId), name)
    },

    getAssetName(assetId) {
      return cache.assets.get(String(assetId))
    },

    setAssetName(assetId, name) {
      cache.assets.set(String(assetId), name)
    },

    getStigTitle(benchmarkId) {
      return cache.stigs.get(String(benchmarkId))
    },

    setStigTitle(benchmarkId, title) {
      cache.stigs.set(String(benchmarkId), title)
    },
  }
}
