Ext.ns('SM.Cache')

SM.Cache.CollectionMap = new Map()

SM.Cache.getCollections = async function () {
  const result = await Ext.Ajax.requestPromise({
    url: `${STIGMAN.Env.apiBase}/collections`,
    method: 'GET',
    params: {
      projection: 'labels'
    }
  })
  const apiCollections = JSON.parse(result.response.responseText)
  return SM.Cache.seedCollections(apiCollections)
}

SM.Cache.updateCollectionLabels = async function (collectionId) {
  const collectionMap = SM.Cache.CollectionMap.get(collectionId)
  let result = await Ext.Ajax.requestPromise({
    url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/labels`,
    method: 'GET'
  })
  collectionMap.labels = JSON.parse(result.response.responseText)
  collectionMap.labelMap = new Map()
  for (const label of collectionMap.labels) {
    collectionMap.labelMap.set(label.labelId, label)
  }
  return collectionMap.labelMap
}


SM.Cache.seedCollections = function (apiCollections) {
  for (const collection of apiCollections) {
    // collection.labels.sort((a,b) => a.name.localeCompare(b.name))
    const labelMap = new Map()
    for (const label of collection.labels) {
      labelMap.set(label.labelId, label)
    }
    SM.Cache.CollectionMap.set(collection.collectionId, { labelMap, ...collection })
  }
  return SM.Cache.CollectionMap
}

SM.Dispatcher.addListener('collectioncreated', function( apiCollection, options) {
  SM.Cache.seedCollections([apiCollection])
})

SM.Dispatcher.addListener('collectionchanged', function( apiCollection, options) {
  SM.Cache.seedCollections([apiCollection])
})

SM.Dispatcher.addListener('collectiondeleted', function( collectionId) {
  SM.Cache.CollectionMap.delete(collectionId)
})

SM.Dispatcher.addListener('labelcreated', function (collectionId, label) {
  const collection = SM.Cache.CollectionMap.get(collectionId)
  collection.labelMap.set(label.labelId, label)
  collection.labels = Array.from(collection.labelMap.values()).sort((a,b) => a.name.localeCompare(b.name))
})

SM.Dispatcher.addListener('labelchanged', function (collectionId, label) {
  const collection = SM.Cache.CollectionMap.get(collectionId)
  collection.labelMap.set(label.labelId, label)
  collection.labels = Array.from(collection.labelMap.values()).sort((a,b) => a.name.localeCompare(b.name))
})

SM.Dispatcher.addListener('labeldeleted', function (collectionId, labelId) {
  const collection = SM.Cache.CollectionMap.get(collectionId)
  collection.labelMap.delete(labelId)
  collection.labels = Array.from(collection.labelMap.values()).sort((a,b) => a.name.localeCompare(b.name))
})

// SM.Dispatcher.addListener('assetcreated', async function (apiAsset) {
//   await SM.Cache.updateCollectionLabels(apiAsset.collection.collectionId)
// })

// SM.Dispatcher.addListener('assetchanged', async function (apiAsset) {
//   await SM.Cache.updateCollectionLabels(apiAsset.collection.collectionId)
// })

// SM.Dispatcher.addListener('assetdeleted', async function (apiAsset) {
//   await SM.Cache.updateCollectionLabels(apiAsset.collection.collectionId)
// })