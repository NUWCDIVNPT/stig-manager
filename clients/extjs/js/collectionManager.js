async function addCollectionManager( params ) {
	let { collectionId, collectionName, treePath } = params
	try {
		const tab = Ext.getCmp('main-tab-panel').getItem(`${collectionId}-collection-manager-tab`)
		if (tab) {
			tab.show()
			return
		}
	
		let collectionGrant = curUser.collectionGrants.find( g => g.collection.collectionId === collectionId )

		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
			params: {
				projection: 'grants'
			},
			method: 'GET'
		})
		let apiCollection = JSON.parse(result.response.responseText)
		let apiFieldSettings = apiCollection.metadata.fieldSettings ? JSON.parse(apiCollection.metadata.fieldSettings) : {
			detailEnabled: 'always',
			detailRequired: 'always',
			commentEnabled: 'findings',
			commentRequired: 'findings'
		}
		function onFieldSettingsChanged (collectionId, fieldSettings) {
			if (collectionId === apiCollection.collectionId) {
				apiFieldSettings = fieldSettings
				assetGrid.apiFieldSettings = apiFieldSettings
			}
		}
	
		let collectionPanel = new SM.Collection.ManagePanel({
			collectionId: collectionId,
			apiCollection: apiCollection,
			title: `Collection Properties (ID ${collectionId})`,
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
			region: 'west',
			width: '30%',
			minWidth: 330,
			padding: '10px 10px 10px 10px',
			border: false,
			split: true,
			layout: 'fit',
			allowDelete: collectionGrant.accessLevel === 4,
			height: 420
		})
		let assetGrid = new SM.CollectionAssetGrid({
			collectionId: collectionId,
			collectionName: collectionName,
			apiFieldSettings: apiFieldSettings,
			url: `${STIGMAN.Env.apiBase}/assets`,
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.adjacent },
			title: 'Assets',
			region: 'north',
			border: false,
			split: true,
			height: '50%'
		})
		let stigGrid = new SM.CollectionStigsGrid({
			collectionId: collectionId,
			collectionName: collectionName,
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`,
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
			border: false,
			title: 'STIGs',
			region: 'center'
		})
		let managerTab = new Ext.Panel({
			id: `${collectionId}-collection-manager-tab`,
			collectionId: collectionId,
			collectionName: collectionName,
			iconCls: 'sm-collection-tab-icon',
			sm_tabMode: 'permanent',
			sm_treePath: treePath,
			closable: true,
			layout: 'border',
			layoutConfig: {
				targetCls: 'sm-border-layout-ct'
			},
			listeners: {
				beforedestroy: () => {
					SM.Dispatcher.removeListener('assetchanged', onAssetEvent)
					SM.Dispatcher.removeListener('assetcreated', onAssetEvent)
					SM.Dispatcher.removeListener('assetdeleted', onAssetEvent)
					SM.Dispatcher.removeListener('stigassetschanged', onStigAssetsChanged)
				}
			},
			items: [
				// {
				// 	region: 'west',
				// 	width: '30%',
				// 	minWidth: 330,
				// 	split: true,
				// 	border: false,
				// 	layout: 'border',
				// 	layoutConfig: {
				// 		targetCls: 'sm-border-layout-ct'
				// 	},
				// 	items: [
				// 		collectionPanel,
				// 		grantGrid 
				// 	]
				// },
				collectionPanel,
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
		let onAssetEvent = (apiAsset) => {
			if (apiAsset.collection.collectionId === collectionId) {
				assetGrid.getStore().reload()
				stigGrid.getStore().reload()
			}
		}
		let onStigAssetsChanged = (eCollectionId) => {
			if (eCollectionId === collectionId) {
				assetGrid.getStore().reload()
				stigGrid.getStore().reload()
			}
		}
		managerTab.updateTitle = function () {
			managerTab.setTitle(`${managerTab.sm_tabMode === 'ephemeral' ? '<i>':''}${managerTab.collectionName} / Manage${this.sm_tabMode === 'ephemeral' ? '</i>':''}`)
		}

		managerTab.makePermanent = function () {
			managerTab.sm_tabMode = 'permanent'
			managerTab.updateTitle.call(managerTab)
		}
		
		let tp = Ext.getCmp('main-tab-panel')
		let ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
		let thisTab
		if (ephTabIndex !== -1) {
		let ephTab = tp.items.itemAt(ephTabIndex)
		tp.remove(ephTab)
		thisTab = tp.insert(ephTabIndex, managerTab);
		} else {
		thisTab = tp.add( managerTab )
		}
		thisTab.updateTitle.call(thisTab)
		thisTab.show();
		
		// grantGrid.getStore().loadData(apiCollection.grants.map( g => ({
		// 	userId: g.user.userId,
		// 	username: g.user.username,
		// 	accessLevel: g.accessLevel
		// })))
		assetGrid.getStore().load()
		stigGrid.getStore().load()
		SM.Dispatcher.addListener('assetchanged', onAssetEvent)
		SM.Dispatcher.addListener('assetcreated', onAssetEvent)
		SM.Dispatcher.addListener('assetdeleted', onAssetEvent)
		SM.Dispatcher.addListener('stigassetschanged', onStigAssetsChanged)
		SM.Dispatcher.addListener('fieldsettingschanged', onFieldSettingsChanged)
	}
	catch( e) {
		throw (e)
	}

}

