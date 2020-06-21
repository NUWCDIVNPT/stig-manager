'use strict'

class Collection {
    constructor (api) {
        this.config = config
        this.infoUi = config.infoUi || {}        
        this.assetUi = config.assetUi || {}
        this.grantUi = config.grantUi || {}        
        this.stigUi = config.stignUi || {}        
    }


    async updateBackend(putData) {
        try {
            let result = await Ext.Ajax.requestPromise({
                url: `${CMSAT.Env.apiBase}/collections/${this.config.collectionId}`,
                method: 'PUT',
                headers: { 'Content-Type': 'application/json;charset=utf-8' },
                jsonData: putData
            })
            this.config = JSON.parse(result.response.responseText)
            return result
        }
        catch (err) {
            throw (err)
        }
    }

    async deleteCollection() {
        try {
            let results = await Ext.Ajax.requestPromise({
                url: `${CMSAT.Env.apiBase}/collections/${this.config.collectionId}`,
                method: 'DELETE'
            })
            return results
        }
        catch (err) {
            throw (err)
        }
    }

    updateInfoUi () {
        this.infoUi.panel.update(this.config)
    }
   
}