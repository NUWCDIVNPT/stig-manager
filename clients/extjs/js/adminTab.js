// $Id: adminTab.js 807 2017-07-27 13:04:19Z csmig $

function getAdministrationItems() {
	return [{
		region: 'west',
		xtype: 'treepanel',
		id: 'admin-nav-tree',
		rootVisible: true,
		autoScroll: true,
		split: true,
		collapsible: true,
		title: 'STIG Manager Administration',
		bodyStyle:'padding:5px;',
		width: 220,
		minSize: 160,
		root: getTree(),
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
		case 'api-admin':
			addApiAdmin();
			break;
	}	
}

function getTree() {
	let children = [{
		id: 'user-admin',
		text: 'Users',
		leaf: true,
		iconCls: 'sm-users-icon'
	},{
		id: 'asset-admin',
		text: 'Assets',
		leaf: true,
		iconCls: 'sm-asset-icon'
	},{
		id: 'artifact-admin',
		text: 'Artifacts',
		leaf: true,
		iconCls: 'sm-artifact-icon'
	},{
		id: 'stig-admin',
		text: 'STIG checklists',
		leaf: true,
		iconCls: 'sm-stig-icon'
	}]

	if (curUser.canAdmin || curUser.role.roleId === 4) {
		children.push({
			id: 'package-admin',
			text: 'Packages',
			leaf: true,
			iconCls: 'sm-package-icon'
		})
	}
	if (curUser.canAdmin) {
		children.push({
			id: 'api-admin',
			text: 'API ',
			leaf: true,
			iconCls: 'sm-database-save-icon'
		})
	}

	return new Ext.tree.AsyncTreeNode({
		id: 'global-admin',
		text: 'Administration areas',
		icon: 'img/Settings-icon-16.png',
		expanded: true,
		children: children
	})
}

