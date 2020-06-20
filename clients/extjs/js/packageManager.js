async function addPackageManager( packageId, packageName ) {
	try {
		let packagePanel = new SM.PackagePanel({
			packageId: packageId,
			region: 'north',
			padding: '10px 10px 10px 10px',
			border: false,
			split: true,
			layout: 'fit',
			height: 300
		})
		let grantGrid = new SM.UserGrantsGrid({
			packageId: packageId,
			url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
			baseParams: {
				elevate: curUser.canAdmin,
				projection: 'grants'
			},
			title: 'Grants',
			border: false,
			region: 'center'
		})
		let assetGrid = new SM.PackageAssetGrid({
			packageId: packageId,
			url: `${STIGMAN.Env.apiBase}/assets`,
			title: 'Assets',
			region: 'north',
			split: true,
			height: '50%'
		})
		let stigGrid = new SM.PackageStigsGrid({
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
					region: 'west',
					width: 500,
					split: true,
					border: true,
					layout: 'border',
					items: [
						packagePanel,
						grantGrid 
					]
				},
				{
					region: 'center',
					layout: 'border',
					items: [
						assetGrid,
						stigGrid
					]
	
				}
			]
		})
	
		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
			params: {
				elevate: curUser.canAdmin,
				projection: 'grants'
			},
			method: 'GET'
		})
		let apiPackage = JSON.parse(result.response.responseText)
	
		thisTab.show();
		packagePanel.getForm().setValues(apiPackage)
		grantGrid.getStore().loadData(apiPackage.grants.map( g => ({
			userId: g.user.userId,
			username: g.user.username,
			accessLevel: g.accessLevel
		})))
		assetGrid.getStore().load()
		stigGrid.getStore().load()
	}
	catch( e) {
		throw (e)
	}

}