'use strict'

async function addOrUpdateCollection( collectionId, collectionObj, options = {} ) {
    try {
      let url, method
      if (options.elevate && collectionId) {
          delete collectionObj.settings
          delete collectionObj.metadata
          delete collectionObj.labels
      }
      if (collectionId) {
        url = `${STIGMAN.Env.apiBase}/collections/${collectionId}?elevate=${options.elevate ?? false}`
        method = 'PATCH'
      }
      else {
        url = `${STIGMAN.Env.apiBase}/collections?elevate=${options.elevate ?? false}`,
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
    catch (e) {
      SM.Error.handleError(e)
    }
  }
  
  