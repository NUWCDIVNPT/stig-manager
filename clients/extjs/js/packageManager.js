function addPackageManager( packageId, packageName ) {
    // let assetPanel = new SM.PackageAssetPanel({
    //     gridCfg: {
	// 		packageId: packageId,
	// 		url: `${STIGMAN.Env.apiBase}/assets`
	// 	},
	// 	region: 'center',
    // })
    let assetGrid = new SM.PackageAssetGrid({
		packageId: packageId,
		url: `${STIGMAN.Env.apiBase}/assets`,
		region: 'center'
    })
	let thisTab = Ext.getCmp('reviews-center-tab').add({
		id: `${packageId}-package-manager-tab`,
		iconCls: 'sm-package-icon',
		title: `${packageName} : Configuration`,
		closable: true,
		layout: 'border',
		items: [ assetGrid ]
	});
	thisTab.show();
	assetGrid.getStore().load()
}