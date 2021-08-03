function addUserAdmin(params ) {
	let { treePath } = params
	const tab = Ext.getCmp('main-tab-panel').getItem('user-admin-tab')
	if (tab) {
		tab.show()
		return
	}

	const userFields = Ext.data.Record.create([
		{	name:'userId',
			type: 'string'
		},
		{
			name:'username',
			type: 'string'
		},
		{
			name: 'name',
			type: 'string',
			mapping: 'statistics.lastClaims?.name'
		},
		{
			name: 'created',
			type: 'date',
			mapping: 'statistics.created'
		},
		{
			name: 'lastAccess',
			type: 'integer',
			mapping: 'statistics.lastAccess'
		},
		{
			name: 'collectionGrantCount',
			type: 'integer',
			mapping: 'statistics.collectionGrantCount'
		},
		{
			name: 'statistics'
		}
	])
	const userStore = new Ext.data.JsonStore({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/users`,
			method: 'GET'
		}),
		baseParams: {
			elevate: curUser.privileges.canAdmin,
			projection: ['statistics']
		},
		root: '',
		fields: userFields,
		isLoaded: false, // custom property
		idProperty: 'userId',
		sortInfo: {
			field: 'username',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				store.isLoaded = true;
				Ext.getCmp('userGrid-totalText').setText(records.length + ' records');
				userGrid.getSelectionModel().selectFirstRow();
			},
			remove: function (store,record,index) {
				Ext.getCmp('userGrid-totalText').setText(store.getCount() + ' records');
			}
		}
	})

	const roleGetter = new Function("obj", "return obj?." + STIGMAN.Env.oauth.claims.roles + " || [];");

	const userGrid = new Ext.grid.GridPanel({
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    	region: 'center',
		id: 'userGrid',
		store: userStore,
		border: true,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [
			{
				header: "Username", 
				width: 150,
				dataIndex: 'username',
				sortable: true
			},
			{ 	
				header: "Name",
				width: 150,
				dataIndex: 'name',
				sortable: true
			},
			{ 	
				header: "Grants",
				width: 50,
				align: 'center',
				dataIndex: 'collectionGrantCount',
				sortable: true,
			},
			{ 	
				header: "Added",
				xtype: 'datecolumn',
				format: 'Y-m-d H:i T',
				width: 150,
				dataIndex: 'created',
				sortable: true
			},
			{ 	
				header: "Last Access",
				width: 150,
				dataIndex: 'lastAccess',
				sortable: true,
				renderer: v => v ? Ext.util.Format.date(new Date(v * 1000), 'Y-m-d H:i T') : SM.styledEmptyRenderer()
			},
			{ 	
				header: "Create Collection",
				width: 100,
				align: 'center',
				renderer: function (value, metaData, record) {
					return roleGetter(record.data.statistics.lastClaims).includes('create_collection') ? '&#x2714;' : ''
				}
			},
			{ 	
				header: "Administrator",
				width: 100,
				align: 'center',
				renderer: function (value, metaData, record) {
					return roleGetter(record.data.statistics.lastClaims).includes('admin') ? '&#x2714;' : ''
				}
			},
			{
				header: "userId", 
				width: 100,
				dataIndex: 'userId',
				sortable: true
			}
		],
		view: new Ext.grid.GridView({
			forceFit:true,
			// These listeners keep the grid in the same scroll position after the store is reloaded
			listeners: {
				beforerefresh: function(v) {
				   v.scrollTop = v.scroller.dom.scrollTop;
				   v.scrollHeight = v.scroller.dom.scrollHeight;
				},
				refresh: function(v) {
					setTimeout(function() { 
						v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
					}, 100);
				}
			},
			deferEmptyText:false
		}),
		listeners: {
			rowdblclick: {
				fn: function(grid,rowIndex,e) {
					var r = grid.getStore().getAt(rowIndex);
					Ext.getBody().mask('Getting grants for ' + r.get('name') + '...');
					showUserProps(r.get('userId'));
				}
			}
		},
		tbar: [
			{
				iconCls: 'icon-add',
				text: 'Pre-register User',
				disabled: !(curUser.privileges.canAdmin),
				handler: function() {
					Ext.getBody().mask('Loading form...');
					showUserProps(0);            
				}
			},
			'-',
			{
				ref: '../removeBtn',
				iconCls: 'icon-del',
				text: 'Unregister User',
				disabled: !(curUser.privileges.canAdmin),
				handler: function() {
					let user = userGrid.getSelectionModel().getSelected();
					let confirmStr=`Unregister user ${user.data.username}?<br><br>This will remove all Collection Grants for the user and is not reversable.`;
					
					Ext.Msg.show({
						title: 'Confirm unregister action',
						icon: Ext.Msg.WARNING,
						msg: confirmStr,
						buttons: {yes: 'Unregister', no: 'Cancel'},
						fn: async function (btn,text) {
							try {
								if (btn == 'yes') {
									let result = await Ext.Ajax.requestPromise({
										url: `${STIGMAN.Env.apiBase}/users/${user.data.userId}?elevate=${curUser.privileges.canAdmin}`,
										method: 'DELETE'
									})
									let apiUser = JSON.parse(result.response.responseText)
									userStore.remove(user)
									SM.Dispatcher.fireEvent('userdeleted', apiUser)
								}
							}
							catch (e) {
								alert(e.message)
							}
						}
					})



					// Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
					// 	try {
					// 		if (btn == 'yes') {
					// 			let result = await Ext.Ajax.requestPromise({
					// 				url: `${STIGMAN.Env.apiBase}/users/${user.data.userId}?elevate=${curUser.privileges.canAdmin}`,
					// 				method: 'DELETE'
					// 			})
					// 			let apiUser = JSON.parse(result.response.responseText)
					// 			userStore.remove(user)
					// 			SM.Dispatcher.fireEvent('userdeleted', apiUser)
					// 		}
					// 	}
					// 	catch (e) {
					// 		alert(e.message)
					// 	}
					// });
				}
			},
			'-',
			{
				iconCls: 'icon-edit',
				text: 'Modify User',
				handler: function() {
					var r = userGrid.getSelectionModel().getSelected();
					Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
					showUserProps(r.get('userId'));
				}
			}
		],
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				width: 20,
				handler: function(btn){
					userGrid.getStore().reload();
				}
			},{
				xtype: 'tbseparator'
			},
			// {
			// 	xtype: 'tbbutton',
			// 	id: 'userGrid-csvBtn',
			// 	iconCls: 'sm-export-icon',
			// 	tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
			// 	width: 20,
			// 	handler: function(btn){
			// 		var ourStore = userGrid.getStore();
			// 		var lo = ourStore.lastOptions;
			// 		window.location=ourStore.url + '?csv=1&xaction=read';
			// 	}
			// },
			{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'userGrid-totalText',
				text: '0 records',
				width: 80
			}]
		}),
		width: '50%',
		loadMask: true
	})

	const onUserChanged = function (apiUser) {
		userStore.loadData(apiUser, true)
		const sortState = userStore.getSortState()
		userStore.sort(sortState.field, sortState.direction)
		userGrid.getSelectionModel().selectRow(userStore.findExact('userId',apiUser.userId))
	}
	SM.Dispatcher.addListener('userchanged', onUserChanged)

	const onUserCreated = function (apiUser) {
		userStore.loadData(apiUser, true)
		const sortState = userStore.getSortState()
		userStore.sort(sortState.field, sortState.direction)
		userGrid.getSelectionModel().selectRow(userStore.findExact('userId',apiUser.userId))
	}
	SM.Dispatcher.addListener('usercreated', onUserCreated)


	const thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'user-admin-tab',
		sm_treePath: treePath, 
		iconCls: 'sm-users-icon',
		title: 'User Grants',
		closable:true,
		layout: 'border',
		border: false,
		items: [userGrid],
		listeners: {
			beforedestroy: function(grid) {
				SM.Dispatcher.removeListener('userchanged', onUserChanged)
				SM.Dispatcher.removeListener('usercreated', onUserCreated)
			}
		}
	})
	thisTab.show()
	
	userGrid.getStore().load()
}

