async function addPackageManager( packageId, packageName ) {
	try {
		let assetGrid = new SM.PackageAssetGrid({
			packageId: packageId,
			url: `${STIGMAN.Env.apiBase}/assets`,
			title: 'Assets',
			region: 'center'
		})
		let packagePanel = new SM.PackagePanel({
			packageId: packageId,
			region: 'north',
			padding: '10px 10px 10px 10px',
			border: false,
			split: true,
			height: 270
		})
		let stigsGrid = new SM.PackageStigsGrid({
			packageId: packageId,
			url: `${STIGMAN.Env.apiBase}/packages/${packageId}/stigs`,
			title: 'STIGs',
			region: 'center'
		})
		let thisTab = Ext.getCmp('reviews-center-tab').add({
			id: `${packageId}-package-manager-tab`,
			iconCls: 'sm-package-icon',
			title: `${packageName} : Configuration`,
			closable: true,
			layout: 'border',
			items: [
				{
					region: 'center',
					layout: 'border',
					items: [
						packagePanel,
						assetGrid 
					]
				},
				{
					region: 'east',
					split: true,
					width: '50%',
					layout: 'border',
					items: [
						stigsGrid
					]
	
				}
			]
		})
	
		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
			params: {
				elevate: curUser.canAdmin
			},
			method: 'GET'
		})
		let apiPackage = JSON.parse(result.response.responseText)
	
		thisTab.show();
		packagePanel.getForm().setValues(apiPackage)
		assetGrid.getStore().load()
		stigsGrid.getStore().load()
	}
	catch( e) {
		throw (e)
	}

}