function addStigAdmin( params ) {
	let { treePath } = params
	const tab = Ext.getCmp('main-tab-panel').getItem('stig-admin-tab')
	if (tab) {
		tab.show()
		return
	}

	const stigGrid = new SM.StigRevision.StigGrid({
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
		region: 'center',
		stripeRows:true,
		loadMask: {msg: ''}
	})

	var thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'stig-admin-tab',
		sm_treePath: treePath,
		iconCls: 'sm-stig-icon',
		title: 'STIG checklists',
		closable:true,
		layout: 'border',
		items: [stigGrid]
	});
	
	// Show the tab
	thisTab.show();
	stigGrid.getStore().load();
} // end addStigAdmin()