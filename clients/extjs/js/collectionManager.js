async function addCollectionManager( collectionId, collectionName ) {
	try {
		let collectionPanel = new SM.CollectionPanel({
			collectionId: collectionId,
			cls: 'sm-grid-round-panel',
			margins: {top:10, right:5, bottom:5, left:10},
			region: 'north',
			padding: '10px 10px 10px 10px',
			border: false,
			split: true,
			layout: 'fit',
			height: 300
		})
		let grantGrid = new SM.UserGrantsGrid({
			collectionId: collectionId,
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
			baseParams: {
				elevate: curUser.privileges.canAdmin,
				projection: 'grants'
			},
			title: 'Grants',
			cls: 'sm-grid-round-panel',
			margins: {top:5, right:5, bottom:10, left:10},
			border: false,
			region: 'center',
			listeners: {
				grantschanged: async grid => {
                    try {
                        let data = grid.getValue()
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${collectionId}?projection=grants`,
                            method: 'PATCH',
                            jsonData: {
                                grants: data
                            }
                        })
                        let collection = JSON.parse(result.response.responseText)
                        grid.setValue(collection.grants)
                    }
                    catch (e) {
                        alert ('Grants save failed')
                    }
				}
			}
		})
		let assetGrid = new SM.CollectionAssetGrid({
			collectionId: collectionId,
			url: `${STIGMAN.Env.apiBase}/assets`,
			cls: 'sm-grid-round-panel',
			margins: {top:10, right:10, bottom:5, left:5},
			title: 'Assets',
			region: 'north',
			border: false,
			split: true,
			height: '50%'
		})
		let stigGrid = new SM.CollectionStigsGrid({
			collectionId: collectionId,
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`,
			cls: 'sm-grid-round-panel',
			margins: {top:5, right:10, bottom:10, left:5},
			border: false,
			title: 'STIGs',
			region: 'center'
		})
		let managerTab = new Ext.Panel({
			id: `${collectionId}-collection-manager-tab`,
			collectionId: collectionId,
			collectionName: collectionName,
			iconCls: 'sm-collection-icon',
			closable: true,
			layout: 'border',
			layoutConfig: {
				targetCls: 'sm-border-layout-ct'
			},
			items: [
				{
					region: 'west',
					width: 500,
					split: true,
					border: false,
					layout: 'border',
					layoutConfig: {
						targetCls: 'sm-border-layout-ct'
					},
					items: [
						collectionPanel,
						grantGrid 
					]
				},
				{
					region: 'center',
					layout: 'border',
					border: false,
					layoutConfig: {
						targetCls: 'sm-border-layout-ct'
					},
					items: [
						assetGrid,
						stigGrid
					]
	
				}
			]
		})
		let assetsChanged = (apiAsset) => {
			stigGrid.getStore().reload()
		}
		managerTab.updateTitle = function () {
			this.setTitle(`${this.collectionName} : Configuration`)
		}
		let thisTab = Ext.getCmp('main-tab-panel').add(managerTab)
		managerTab.updateTitle.call(managerTab)

		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
			params: {
				elevate: curUser.privileges.canAdmin,
				projection: 'grants'
			},
			method: 'GET'
		})
		let apiCollection = JSON.parse(result.response.responseText)
	
		thisTab.show();
		collectionPanel.getForm().setValues(apiCollection)
		grantGrid.getStore().loadData(apiCollection.grants.map( g => ({
			userId: g.user.userId,
			username: g.user.username,
			accessLevel: g.accessLevel
		})))
		assetGrid.getStore().load()
		stigGrid.getStore().load()
		SM.Dispatcher.addListener('assetchanged', assetsChanged)
		SM.Dispatcher.addListener('assetcreated', assetsChanged)
		SM.Dispatcher.addListener('assetdeleted', assetsChanged)
	}
	catch( e) {
		throw (e)
	}

}