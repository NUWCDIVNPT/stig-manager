'use strict'

async function addOrUpdateCollection( collectionId, collectionObj, options = {} ) {
    let url, method
    if (options.elevate && collectionId) {
        delete collectionObj.settings
        delete collectionObj.metadata
        delete collectionObj.labels
    }
    let elevateParam = options.elevate === true || options.elevate === false ? `?elevate=${options.elevate}` : ''
    if (collectionId) {
      url = `${STIGMAN.Env.apiBase}/collections/${collectionId}${elevateParam}`
      method = 'PATCH'
    }
    else {
      url = `${STIGMAN.Env.apiBase}/collections${elevateParam}`,
      method = 'POST'
    }
    let apiCollection = await Ext.Ajax.requestPromise({
      responseType: 'json',
      url,
      method,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      params: {
        projection: ['owners', 'statistics', 'labels']
      },
      jsonData: collectionObj
    })
    // Refresh the curUser global
    await SM.GetUserObject()
    
    let event = collectionId ? 'collectionchanged' : 'collectioncreated'
    SM.Dispatcher.fireEvent( event, apiCollection, options )
    return apiCollection
  }
  
  