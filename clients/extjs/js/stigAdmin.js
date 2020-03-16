/* 
$Id: stigAdmin.js 807 2017-07-27 13:04:19Z csmig $
*/

function addStigAdmin() {

	var stigFields = Ext.data.Record.create([
		{	name:'stigId',
			type: 'string'
		},{
			name: 'title',
			type: 'string'
		},{
			name: 'revision',
			type: 'string'
		},{
			name: 'benchmarkDateSql',
			type: 'date',
			dateFormat: 'Y-m-d'
		}
	]);

	var stigStore = new Ext.data.JsonStore({
		url: 'pl/getStigs.pl',
		root: 'rows',
		fields: stigFields,
		totalProperty: 'records',
		idProperty: 'stigId',
		sortInfo: {
			field: 'stigId',
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
		},
		writer:new Ext.data.JsonWriter()
	});

	var stigGrid = new Ext.grid.GridPanel({
		id: 'stigGrid',
		store: stigStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [{ 	
				header: "Benchmark ID",
				width: 150,
				dataIndex: 'stigId',
				sortable: true
			},{ 	
				header: "Title",
				id: 'stigGrid-title-column',
				width: 350,
				dataIndex: 'title',
				sortable: true
			},{ 	
				header: "Current revision",
				width: 150,
				dataIndex: 'revision',
				sortable: true
			}
			,{ 	
				header: "Revision date",
				width: 150,
				dataIndex: 'benchmarkDateSql',
				xtype: 'datecolumn',
				format: 'Y-m-d',
				sortable: true
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
			rowdblclick: {
				fn: function(grid,rowIndex,e) {
					var r = grid.getStore().getAt(rowIndex);
					Ext.getBody().mask('Getting assignments for ' + r.get('stigId') + '...');
					showStigAssignments(r.get('stigId'));
				}
			}
		},
		tbar: [{
			iconCls: 'sm-asset-icon',
			text: 'Assign assets',
			disabled: false,
			handler: function() {
				var r = stigGrid.getSelectionModel().getSelected();
				Ext.getBody().mask('Getting assignments for ' + r.get('stigId') + '...');
				showStigAssignments(r.get('stigId'));
			}
		}],
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				id: 'stigGrid-csvBtn',
				iconCls: 'icon-save',
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

	var thisTab = Ext.getCmp('admin-center-tab').add({
		id: 'stig-admin-tab',
		iconCls: 'sm-stig-icon',
		title: 'STIG checklists',
		closable:true,
		layout: 'fit',
		items: [stigGrid]
		});


	function showStigAssignments(stigId) {

		var assetFields = Ext.data.Record.create([
			{
				name:'assetId',
				type: 'number'
			},{
				name:'assetName',
				type: 'string'
			},{
				name:'dept',
				type: 'string'
			},{
				name:'assetGroup',
				type: 'string'
			}
		]);	
		var assetStore = new Ext.data.JsonStore({
			url: 'pl/getAssetsForStigAssignments.pl',		
			fields: assetFields,
			root: 'rows',
			sortInfo: {
				field: 'assetName',
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
					dataIndex: 'assetName',
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
			setValue: function(v) {
				var selRecords = [];
				for(y=0;y<v.length;y++) {
					var record = assetStore.getById(v[y]);
					selRecords.push(record);
				}
				assetSm.selectRecords(selRecords);
			},
			getValue: function() {},
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
					window.close();
				}
			},{
				text: 'Save',
				formBind: true,
				id: 'submit-button',
				handler: function(){
					stigAssignmentsFormPanel.getForm().submit({
						submitEmptyText: false,
						params : {
							stigId: stigId,
							assetIds: encodeSm(assetSm,'assetId'),
							req: 'update'
						},
						waitMsg: 'Saving changes...',
						success: function (f,a) {
							if (a.result.success == 'true') {
								Ext.getCmp('stigGrid').getView().holdPosition = true; //sets variable used in override in varsUtils.js
								Ext.getCmp('stigGrid').getStore().reload();
								//Ext.Msg.alert('Success','Asset ID ' + a.result.id + ' has been updated.');
								window.close();
							} else {
								Ext.Msg.alert('Failure!','The database update has failed.');
								window.close();
							}	
						},
						failure: function(f,a) {
							Ext.Msg.alert('AJAX Failure!','AJAX call has completely failed.');
							window.close();
						}	
					});
				}
		   }]
		});

		/******************************************************/
		// Form window
		/******************************************************/
		var window = new Ext.Window({
			id: 'stigAssignmentWindow',
			title: stigId,
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

		window.render(document.body);
		assetStore.load({
			callback: function (r,o,s) {
				stigAssignmentsFormPanel.getForm().load({
					url: 'pl/getStigAssignments.pl',
					params: {
						stigId: stigId
					},
					success: function(form,action) {
						Ext.getBody().unmask();
						window.show(document.body);
					},
					failure: function(form,action) {
						Ext.getBody().unmask();
						window.show(document.body);
					}
				});
			}
		});




	}


	// Show the tab
	thisTab.show();
	stigGrid.getStore().load();
	
	

} // end addPackageAdmin()