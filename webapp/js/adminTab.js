function getAdministrationItems() {
	return [{
		region: 'west',
		xtype: 'treepanel',
		id: 'admin-nav-tree',
		rootVisible: false,
		autoScroll: true,
		split: true,
		collapsible: true,
		title: 'STIG Manager Administration',
		bodyStyle:'padding:5px;',
		width: 220,
		minSize: 160,
		root: {
			nodeType: 'async',
			text: 'Administration'
		},
		dataUrl: 'pl/adminNavTree.pl',
		listeners: {
			click: adminTreeClick
		}
	},{
		region: 'center',
		xtype: 'tabpanel',
		id: 'admin-center-tab',
		title: 'STIGManager',
		activeTab: 0,
		items: [
			{			
				title: 'Home',
				iconCls: 'sm-setting-icon',
				autoLoad:'adminHome.html',
				padding: 20,
				autoScroll:true
			}		
		]
	}];
}

function adminTreeClick(n) {
	var tab = Ext.getCmp('admin-center-tab').getItem('admin-tab-' + n.attributes.id);
	if (tab) {
		tab.show();
	} else {
		addAdminTab(n.attributes);
	}
}

function addAdminTab(adminAttributes) {
	switch(adminAttributes.id) {
		case 'user-admin':
			addUserAdmin();
			break;
		case 'asset-admin':
			addAssetAdmin();
			break;
		case 'package-admin':
			addPackageAdmin();
			break;
		case 'stig-admin':
			addStigAdmin();
			break;
		case 'artifact-admin':
			addArtifactAdmin();
			break;
	}	

} //end addAdminTab();

