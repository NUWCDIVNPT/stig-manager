function addUserAdmin() {

	const userFields = Ext.data.Record.create([
		{	name:'userId',
			type: 'string'
		},{
			name:'username',
			type: 'string'
		},{
			name: 'display',
			type: 'string'
		},{
			name: 'globalAccess',
			type: 'boolean',
			mapping: 'privileges.globalAccess'
		},{
			name: 'canCreateCollection',
			type: 'boolean',
			mapping: 'privileges.canCreateCollection'
		},{
			name: 'canAdmin',
			type: 'boolean',
			mapping: 'privileges.canAdmin'
		},{
			name: 'metadata'
		},{
			name: 'created',
			type: 'date',
			mapping: 'statistics.created'
		},{
			name: 'lastAccess',
			type: 'integer',
			mapping: 'statistics.lastAccess'
		},
	])
	const userStore = new Ext.data.JsonStore({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/users`,
			method: 'GET'
		}),
		baseParams: {
			elevate: curUser.privileges.canAdmin,
			projection: ['privileges', 'statistics']
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
				header: "Display Name",
				width: 150,
				dataIndex: 'display',
				sortable: true
			},
			{ 	
				xtype: 'booleancolumn',
				header: "Create Collection",
				width: 150,
				align: 'center',
				dataIndex: 'canCreateCollection',
				sortable: true,
				trueText: '&#x2714;',
				falseText: ''
			},
			{ 	
				xtype: 'booleancolumn',
				header: "Global Access",
				width: 150,
				align: 'center',
				dataIndex: 'globalAccess',
				sortable: true,
				trueText: '&#x2714;',
				falseText: ''
			},
			{ 	
				xtype: 'booleancolumn',
				header: "Administrator",
				width: 150,
				align: 'center',
				dataIndex: 'canAdmin',
				sortable: true,
				trueText: '&#x2714;',
				falseText: ''
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
				header: "userId", 
				width: 150,
				dataIndex: 'userId',
				sortable: true
			}
		],
		view: new Ext.grid.GridView({
			forceFit:false,
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
					Ext.getBody().mask('Getting properties of ' + r.get('display') + '...');
					showUserProps(r.get('userId'));
				}
			}
		},
		tbar: [{
			iconCls: 'icon-add',
			text: 'New User',
			disabled: !(curUser.privileges.canAdmin),
			handler: function() {
				Ext.getBody().mask('Loading form...');
				showUserProps(0);            
			}
		},'-', {
			ref: '../removeBtn',
			iconCls: 'icon-del',
			text: 'Delete User',
			disabled: !(curUser.privileges.canAdmin),
			handler: function() {
				//var confirmStr="Delete this user?";
				
				let user = userGrid.getSelectionModel().getSelected();
				let confirmStr="Delete user, " + user.data.display + "?";
				
				Ext.Msg.confirm("Confirm",confirmStr,async function (btn,text) {
					try {
						if (btn == 'yes') {
							let result = await Ext.Ajax.requestPromise({
								url: `${STIGMAN.Env.apiBase}/users/${user.data.userId}`,
								method: 'DELETE'
							})
							userStore.remove(user);
						}
					}
					catch (e) {
						alert(e)
					}
				});
			}
		},'-',{
			iconCls: 'icon-edit',
			text: 'View/Edit User Properties',
			handler: function() {
				var r = userGrid.getSelectionModel().getSelected();
				Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
				showUserProps(r.get('userId'));
			}
		}],
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
			},{
				xtype: 'tbbutton',
				id: 'userGrid-csvBtn',
				iconCls: 'sm-export-icon',
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				width: 20,
				handler: function(btn){
					var ourStore = userGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&xaction=read';
				}
			},{
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

		

	const thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'user-admin-tab',
		iconCls: 'sm-users-icon',
		title: 'Users',
		closable:true,
		layout: 'border',
		border: false,
		items: [userGrid]
	})
	thisTab.show()
	
	userGrid.getStore().load()
}

