function addStigAdmin() {
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
				xtype: 'tbbutton',
				id: 'stigGrid-csvBtn',
				iconCls: 'sm-export-icon',
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				width: 20,
				handler: function(btn){
					var ourStore = stigGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&xaction=read';
				}
			},{
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
		iconCls: 'sm-stig-icon',
		title: 'STIG checklists',
		closable:true,
		layout: 'border',
		items: [stigGrid]
		});


	async function showStigAssignments(benchmarkId) {

		var assetFields = Ext.data.Record.create([
			{
				name:'assetId',
				type: 'number'
			},{
				name:'name',
				type: 'string'
			},{
				name:'dept',
				type: 'string'
			}
		]);	
		var assetStore = new Ext.data.JsonStore({
			url: `${STIGMAN.Env.apiBase}/assets?elevate=true`,
			fields: assetFields,
			root: '',
			sortInfo: {
				field: 'name',
				direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
			},
			idProperty: 'assetId'	
		});
		var assetSm = new Ext.grid.CheckboxSelectionModel({
			checkOnly: true,
			onRefresh: function() {
				var ds = this.grid.store, index;
				var s = this.getSelections();
				for(var i = 0, len = s.length; i < len; i++){
					var r = s[i];
					if((index = ds.indexOfId(r.id)) != -1){
						this.grid.view.addRowClass(index, this.grid.view.selectedRowClass);
					}
				}
			}
		});
		var assetGrid = new Ext.grid.GridPanel({
			title:'Asset assignments',
			hideHeaders: false,
			flex: 30,
			id: 'stigs-assetsGrid',
			hideLabel: true,
			isFormField: true,
			store: assetStore,
			columns: [
				assetSm,
				{ header: "Assets", 
					width: 95,
					dataIndex: 'name',
					sortable: true
				}
				,{ header: "Dept", 
					width: 55,
					dataIndex: 'dept',
					sortable: true
				}
			],
			viewConfig: {
				forceFit: true
			},
			sm: assetSm,
			setValue: function(assets) {
				var selRecords = []
				assets.forEach(asset => {
					let record = assetStore.getById(asset.assetId)
					selRecords.push(record)
				})
				assetSm.selectRecords(selRecords);
			},
			getValue: function() {
				return JSON.parse(encodeSm(assetSm,'assetId'))
			},
			markInvalid: function() {},
			clearInvalid: function() {},
			validate: function() { return true},
			isValid: function() { return true;},
			getName: function() {return this.name},
			fieldLabel: 'Assets',
			tbar: new Ext.Toolbar({
				items: [
				{
				// START Filter control
					xtype: 'buttongroup',
					title: 'Filtering',
					items: [
					{
						xtype: 'trigger',
						fieldLabel: 'Filter',
						triggerClass: 'x-form-clear-trigger',
						onTriggerClick: function() {
							this.triggerBlur();
							this.blur();
							this.setValue('');
							filterAssetStore();
						},
						id: 'stigs-assetsGrid-filterField',
						width: 140,
						submitValue: false,
						enableKeyEvents:true,
						emptyText:'Enter an asset filter...',
						listeners: {
							keyup: function (field,e) {
								filterAssetStore();
								return false;
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						icon: 'img/tick_white.png',
						tooltip: 'Show assignments only',
						id: 'stigs-assetsGrid-filterButton',
						toggleGroup: 'asset-selector',
						enableToggle:true,
						allowDepress: true,
						toggleHandler: function (btn,state) {
							filterAssetStore();
						}
					}]
				}]
			}),
			name: 'assetAssignments'
		});

		/******************************************************/
		// Form panel
		/******************************************************/
		var stigAssignmentsFormPanel = new Ext.form.FormPanel({
			baseCls: 'x-plain',
			labelWidth: 65,
			url:'pl/updateStigAssignments.pl',
			monitorValid: true,
			items: [
			{
				layout: 'hbox',
				anchor: '100% -30',
				baseCls: 'x-plain',
				border: false,
				layoutConfig: {
					align: 'stretch'
				},
				items: [
					assetGrid
				]
			}
			], // end form items
			buttons: [{
				text: 'Cancel',
				handler: function(){
					appwindow.close();
				}
			},{
				text: 'Save',
				formBind: true,
				id: 'submit-button',
				handler: async function(){
					try {
						if (stigAssignmentsFormPanel.getForm().isValid()) {
							let values = stigAssignmentsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
							// TODO: Replace loop with dedivcated endpoint PUT /stigs/{benchmarkId}/assets
							let requests = []
							values.assetAssignments.forEach( sa => {
								Ext.Ajax.requestPromise({
									url: `${STIGMAN.Env.apiBase}/assets/${sa}?elevate=${curUser.privileges.canAdmin}`,
									method: method,
									headers: { 'Content-Type': 'application/json;charset=utf-8' },
									jsonData: values
								  })
							})
							// change "assets" to "assetIds"
							delete Object.assign(values, {['assetIds']: values['assets'] })['assets']
							let url, method
							if (collectionId) {
								url = `${STIGMAN.Env.apiBase}/collections/${collectionId}?elevate=${curUser.privileges.canAdmin}`
								method = 'PUT'
							}
							else {
								url = `${STIGMAN.Env.apiBase}/collections?elevate=${curUser.privileges.canAdmin}`
								method = 'POST'
							}
							let result = await Ext.Ajax.requestPromise({
								url: url,
								method: method,
								headers: { 'Content-Type': 'application/json;charset=utf-8' },
								jsonData: values
							  })
							apiCollection = JSON.parse(result.response.responseText)

							//TODO: This is expensive, should update the specific record instead of reloading entire set
							Ext.getCmp('collectionGrid').getView().holdPosition = true
							Ext.getCmp('collectionGrid').getStore().reload()
							appwindow.close()
						}
					}
					catch (e) {
						alert(e.message)
					}
				},
				
				// handler: function(){
				// 	stigAssignmentsFormPanel.getForm().submit({
				// 		submitEmptyText: false,
				// 		params : {
				// 			benchmarkId: benchmarkId,
				// 			assetIds: encodeSm(assetSm,'assetId'),
				// 			req: 'update'
				// 		},
				// 		waitMsg: 'Saving changes...',
				// 		success: function (f,a) {
				// 			if (a.result.success == 'true') {
				// 				Ext.getCmp('stigGrid').getView().holdPosition = true; //sets variable used in override in varsUtils.js
				// 				Ext.getCmp('stigGrid').getStore().reload();
				// 				//Ext.Msg.alert('Success','Asset ID ' + a.result.id + ' has been updated.');
				// 				appwindow.close();
				// 			} else {
				// 				Ext.Msg.alert('Failure!','The database update has failed.');
				// 				appwindow.close();
				// 			}	
				// 		},
				// 		failure: function(f,a) {
				// 			Ext.Msg.alert('AJAX Failure!','AJAX call has completely failed.');
				// 			appwindow.close();
				// 		}	
				// 	});
				// }
		   }]
		});

		/******************************************************/
		// Form window
		/******************************************************/
		var appwindow = new Ext.Window({
			id: 'stigAssignmentWindow',
			title: benchmarkId,
			modal: true,
			hidden: true,
			width: 330,
			height:520,
			layout: 'fit',
			plain:true,
			bodyStyle:'padding:5px;',
			buttonAlign:'right',
			items: stigAssignmentsFormPanel
		});


		/******************************************************/
		// filterAssetStore ()
		/******************************************************/
		function filterAssetStore () {
			var value = Ext.getCmp('stigs-assetsGrid-filterField').getValue();
			var selectionsOnly = Ext.getCmp('stigs-assetsGrid-filterButton').pressed;
			if (value == '') {
				if (selectionsOnly) {
					assetStore.filterBy(filterChecked,assetSm);
				} else {
					assetStore.clearFilter();
				}
			} else {
				if (selectionsOnly) {
					assetStore.filter([
						{
							property:'assetName',
							value:value,
							anyMatch:true,
							caseSensitive:false
						},{
							fn: filterChecked,
							scope: assetSm
						}
					]);
				} else {
					assetStore.filter({property:'assetName',value:value,anyMatch:true,caseSensitive:false});
				}
			}
		};

		appwindow.render(document.body);
		assetStore.load({
			callback: async function (r,o,s) {
				try {
					let result = await Ext.Ajax.requestPromise({
						url: `${STIGMAN.Env.apiBase}/assets`,
						params: {
							elevate: true,
							benchmarkId: benchmarkId
						},
						method: 'GET'
					})
					let stigProps = {
						assetAssignments: JSON.parse(result.response.responseText)
					}
					stigAssignmentsFormPanel.getForm().setValues(stigProps)
					Ext.getBody().unmask();
					appwindow.show(document.body);
				}
				catch (e) {
					alert (e.message)
				}
			}
		})
	}
	// Show the tab
	thisTab.show();
	stigGrid.getStore().load();
} // end addStigAdmin()