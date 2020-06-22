// ======================================================================================
// NAME: 		userAdmin.js
// CREATED: 	January 6, 2017 @ 14:12 
// UPDATED: 	January 11, 2017 @ 14:07 
// AUTHOR(S):	BRANDON MASSEY
// PURPOSE: 	Responsible for building the User Management Listing interface
// =======================================================================================

function addUserAdmin() {

	var userFields = Ext.data.Record.create([
		{	name:'userId',
			type: 'integer'
		},{
			name:'username',
			type: 'string'
		},{
			name: 'display',
			type: 'string'
		},{
			name: 'globalAccess',
			type: 'boolean'
		},{
			name: 'canCreateCollection',
			type: 'boolean'
		},{
			name: 'canAdmin',
			type: 'boolean'
		},{
			name: 'metadata'
		}
	]);

	var userStore = new Ext.data.JsonStore({
		url: `${STIGMAN.Env.apiBase}/users${curUser.privileges.canAdmin ? '?elevate=true' : ''}`,
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
	});

	var userGrid = new Ext.grid.EditorGridPanel({
		// region: 'west',
		// split: true,
		//title: 'User Management',
		id: 'userGrid',
		store: userStore,
		border: false,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [
			{
				id:'cn',
				header: "Account Name", 
				width: 250,
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
				header: "Access Level",
				width: 150,
				dataIndex: 'accessLevel',
				sortable: true
			},
			{ 	
				header: "Department",
				width: 150,
				dataIndex: 'dept.name',
				sortable: true
			},
			{ 	
				header: "Admin?",
				width: 150,
				dataIndex: 'canAdmin',
				sortable: true,
				renderer: function (val) {
					return val ? "Yes" : "No"
				}
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
					showUserProperties(r.get('userId'), userGrid);
				}
			}
		},
		tbar: [{
			iconCls: 'icon-add',
			text: 'New User',
			disabled: !(curUser.privileges.canAdmin),
			handler: function() {
				Ext.getBody().mask('Loading form...');
				showUserProperties(0, userGrid);            
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
				showUserProperties(r.get('userId'), userGrid);
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
				iconCls: 'icon-save',
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
	});

		

	var thisTab = Ext.getCmp('reviews-center-tab').add({
		id: 'user-admin-tab',
		iconCls: 'sm-users-icon',
		title: 'Users',
		closable:true,
		layout: 'fit',
		items: [userGrid]
	});
	if (!curUser.privileges.canAdmin) { // only show the modify button for non-admins
		var tb = userGrid.getTopToolbar();
		var items = tb.find();
		for (var x=0;x<items.length;x++) {
			if (items[x].text != 'View/Edit User Properties') {
				items[x].hide();
			}
		}
	}
	thisTab.show();
	
	userGrid.getStore().load();
} // end: function addUserAdmin()

