function addStigAdmin( params ) {
	let { treePath } = params
	const tab = Ext.getCmp('main-tab-panel').getItem('stig-admin-tab')
	if (tab) {
		tab.show()
		return
	}

	var stigFields = Ext.data.Record.create([
		{	name:'benchmarkId',
			type: 'string'
		},
		{
			name: 'title',
			type: 'string'
		},
		{
			name: 'status',
			type: 'string'
		},
		{
			name: 'lastRevisionStr',
			type: 'string'
		},
		{
			name: 'lastRevisionDate',
			type: 'date',
			dateFormat: 'Y-m-d'
		},
		{
			name: 'ruleCount',
			type: 'integer'
		},
		{
			name: 'autoCount',
			type: 'integer'
		}
	]);

	var stigStore = new Ext.data.JsonStore({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/stigs`,
			method: 'GET'
		}),
		root: '',
		fields: stigFields,
		totalProperty: 'records',
		idProperty: 'benchmarkId',
		sortInfo: {
			field: 'benchmarkId',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				store.isLoaded = true,
				Ext.getCmp('stigGrid-totalText').setText(records.length + ' records');
				stigGrid.getSelectionModel().selectFirstRow();
			},
			remove: function (store,record,index) {
				Ext.getCmp('stigGrid-totalText').setText(store.getCount() + ' records');
			}
		}
	});

	var stigGrid = new Ext.grid.GridPanel({
		id: 'stigGrid',
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
		region: 'center',
		store: stigStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [{ 	
				header: "Benchmark ID",
				width: 300,
				dataIndex: 'benchmarkId',
				sortable: true
			},{ 	
				header: "Title",
				id: 'stigGrid-title-column',
				width: 350,
				dataIndex: 'title',
				sortable: true
			},{ 	
				header: "Status",
				width: 150,
                align: "center",
				dataIndex: 'status',
				sortable: true
			},{ 	
				header: "Current revision",
				width: 150,
                align: "center",
				dataIndex: 'lastRevisionStr',
				sortable: true
			},{ 	
				header: "Revision date",
				width: 150,
                align: "center",
				dataIndex: 'lastRevisionDate',
				xtype: 'datecolumn',
				format: 'Y-m-d',
				sortable: true
			},{ 	
				header: "Rules",
				width: 150,
                align: "center",
				dataIndex: 'ruleCount',
				sortable: true
			},{ 	
				header: "SCAP Rules",
				width: 150,
                align: "center",
				dataIndex: 'autoCount',
				sortable: true,
				renderer: (v) => v ? v : '--'
			}
		],
		autoExpandColumn: 'stigGrid-title-column',
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
			// rowdblclick: {
			// 	fn: function(grid,rowIndex,e) {
			// 		var r = grid.getStore().getAt(rowIndex);
			// 		Ext.getBody().mask('Getting assignments for ' + r.get('benchmarkId') + '...');
			// 		showStigAssignments(r.get('benchmarkId'));
			// 	}
			// }
		},
		tbar: [
			{
				iconCls: 'sm-import-icon',
				text: 'Import STIGs',
				disabled: false,
				handler: function() {
					uploadStigs();
				}
			}
		],
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'exportbutton',
				hasMenu: false,
				gridBasename: 'Installed-STIGs',
				exportType: 'grid',
				iconCls: 'sm-export-icon',
				text: 'Export'
			},
			{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'stigGrid-totalText',
				text: '0 records',
				width: 80
			}]
		}),
		loadMask: true
	});

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