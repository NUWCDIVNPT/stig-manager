async function addCollectionManager( params ) {
	let { collectionId, collectionName, treePath } = params
	try {
		const tab = Ext.getCmp('main-tab-panel').getItem(`${collectionId}-collection-manager-tab`)
		if (tab) {
			tab.show()
			return
		}
	
		let collectionGrant = curUser.collectionGrants.find( g => g.collection.collectionId === collectionId )

		let apiCollection = await Ext.Ajax.requestPromise({
			responseType: 'json',
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
			params: {
				projection: ['grants', 'labels']
			},
			method: 'GET'
		})
		SM.Cache.updateCollection(apiCollection)

		let apiFieldSettings = apiCollection.settings.fields

		function onFieldSettingsChanged (collectionId, fieldSettings) {
			if (collectionId === apiCollection.collectionId) {
				assetGrid.apiFieldSettings = fieldSettings
			}
		}
	
		let collectionPanel = new SM.Collection.ManagePanel({
			collectionId: collectionId,
			apiCollection: apiCollection,
			title: `Manage Collection (${collectionId})`,
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
			region: 'west',
			width: 430,
			minWidth:430,
			padding: '10px 10px 10px 10px',
			border: false,
			split: true,
			layout: 'fit',
			collapsible: true,
			allowDelete: collectionGrant.accessLevel === 4,
			allowClone: collectionGrant.accessLevel >= 3 && curUser.privileges.canCreateCollection,
			canModifyOwners: collectionGrant.accessLevel === 4,
		})
		let assetGrid = new SM.CollectionAssetGrid({
			collectionId: collectionId,
			collectionName: collectionName,
			apiFieldSettings: apiFieldSettings,
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/asset`,
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.adjacent },
			title: 'Assets',
			region: 'north',
			border: false,
			split: true,
			height: '50%',
			stripeRows: true
		})
		let stigGrid = new SM.CollectionStigsGrid({
			collectionId: collectionId,
			collectionName: collectionName,
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary/stig`,
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
			border: false,
			title: 'STIGs',
			region: 'center',
			stripeRows: true
		})
		let managerTab = new Ext.Panel({
			id: `${collectionId}-collection-manager-tab`,
			collectionId: collectionId,
			collectionName: collectionName,
			iconCls: 'sm-setting-icon',
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
					SM.Dispatcher.removeListener('labelassetschanged', onLabelAssetsChanged)
					SM.Dispatcher.removeListener('fieldsettingschanged', onFieldSettingsChanged)
				}
			},
			items: [
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
		async function onAssetEvent (apiAsset) {
			if (apiAsset.collection.collectionId === collectionId) {
				assetGrid.getStore().reload()
				stigGrid.getStore().reload()
				
				// update labels grid
				const labels = await Ext.Ajax.requestPromise({
					responseType: 'json',
					url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/labels`,
					method: 'GET'
				})
				collectionPanel.labelGrid.setValue(labels)
			}
		}
		function onStigAssetsChanged (eCollectionId) {
			if (eCollectionId === collectionId) {
				assetGrid.getStore().reload()
				stigGrid.getStore().reload()
			}
		}
		async function onLabelAssetsChanged(eCollectionId, labelId, apiLabelAssets) {
			if (eCollectionId === collectionId) {
				await assetGrid.getStore().reloadPromise()
				// update labels grid
				const labels = await Ext.Ajax.requestPromise({
					responseType: 'json',
					url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/labels`,
					method: 'GET'
				})
				collectionPanel.labelGrid.setValue(labels)
			}
		}


		managerTab.updateTitle = function () {
			managerTab.setTitle(`${managerTab.sm_tabMode === 'ephemeral' ? '<i>':''}${SM.he(managerTab.collectionName)} / Manage${this.sm_tabMode === 'ephemeral' ? '</i>':''}`)
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
		
		assetGrid.getStore().load()
		stigGrid.getStore().load()
		SM.Dispatcher.addListener('labelassetschanged', onLabelAssetsChanged)
		SM.Dispatcher.addListener('assetchanged', onAssetEvent)
		SM.Dispatcher.addListener('assetcreated', onAssetEvent)
		SM.Dispatcher.addListener('assetdeleted', onAssetEvent)
		SM.Dispatcher.addListener('stigassetschanged', onStigAssetsChanged)
		SM.Dispatcher.addListener('fieldsettingschanged', onFieldSettingsChanged)
	}
	catch( e) {
		SM.Error.handleError(e)
	}

}

