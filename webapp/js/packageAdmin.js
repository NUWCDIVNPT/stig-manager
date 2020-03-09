
function addPackageAdmin() {

	// Set up store for the MAC_CL combo box used in package properties
	var macClFields = Ext.data.Record.create([
		{	name:'macClId',
			type: 'number'
		},{
			name: 'longName',
			type: 'string'
		},{
			name: 'shortName',
			type: 'string'
		},{
			name: 'profileName',
			type: 'string'
		}
	]);
	
	var macClStore = new Ext.data.ArrayStore({
		fields: macClFields,
		idProperty: 'macClId',
		sortInfo: {
			field: 'macClId',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		}
	});
	
	var assetFields = Ext.data.Record.create([
		{	name:'assetId',
			type: 'number'
		},{
			name:'assetName',
			type: 'string'
		},{
			name:'ip',
			type: 'string'
		}
	]);
	var assetStore = new Ext.data.JsonStore({
		url: 'pl/getAssetsForProps.pl',
		fields: assetFields,
		autoLoad: true,
		root: 'rows',
		sortInfo: {
			field: 'assetName',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		idProperty: 'assetId'
	});
	// /******************************************************/
	// // Repositories
	// /******************************************************/
	// var repoStore = new Ext.data.ArrayStore({
	// 	fields: ['repositoryId','repositoryName'],
	// 	sortInfo: {
	// 		field: 'repositoryName',
	// 		direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
	// 	},
	// 	idProperty: 'repositoryId'
	// });

		
	var packageFields = Ext.data.Record.create([
		{	name:'packageId',
			type: 'number'
		},{
			name: 'packageName',
			type: 'string'
		},{
			name: 'emassId',
			type: 'string'
		},{
			name: 'reqRar',
			type: 'number'
		},{
			name: 'pocName',
			type: 'string'
		},{
			name: 'pocEmail',
			type: 'string'
		},{
			name: 'pocPhone',
			type: 'string'
		},{
			name: 'macCl',
			type: 'string'
		}
	]);

	var packageStore = new Ext.data.JsonStore({
		url: 'pl/getPackages.pl',
		root: 'rows',
		fields: packageFields,
		totalProperty: 'records',
		idProperty: 'packageId',
		sortInfo: {
			field: 'packageName',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				store.isLoaded = true,
				Ext.getCmp('packageGrid-totalText').setText(records.length + ' records');
				packageGrid.getSelectionModel().selectFirstRow();
			},
			remove: function (store,record,index) {
				Ext.getCmp('packageGrid-totalText').setText(store.getCount() + ' records');
			}
		},
		writer:new Ext.data.JsonWriter()
	});

	var packageGrid = new Ext.grid.EditorGridPanel({
		id: 'packageGrid',
		store: packageStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [{ 	
				header: "Package",
				width: 300,
				dataIndex: 'packageName',
				sortable: true
			},{ 	
				header: "eMASS ID",
				width: 100,
				dataIndex: 'emassId',
				sortable: true
			},{ 	
				header: "MAC and CL",
				width: 100,
				dataIndex: 'macCl',
				sortable: true
			},{ 	
				header: "RAR?",
				width: 50,
				dataIndex: 'reqRar',
				sortable: true,
				renderer: function (val) {
					if (val == 1) {
						return 'Yes';
					} else {
						return 'No';
					}
				}
			},{ 	
				header: "POC Name",
				width: 150,
				dataIndex: 'pocName',
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
					Ext.getBody().mask('Getting properties of ' + r.get('packageName') + '...');
					showPackageProps(r.get('packageId'));
				}
			}
		},
		tbar: [{
			iconCls: 'icon-add',
			text: 'New package',
			handler: function() {
				Ext.getBody().mask('Loading form...');
				showPackageProps(0);            
			}
		},'-', {
			ref: '../removeBtn',
			iconCls: 'icon-del',
			text: 'Delete package',
			disabled: !(curUser.canAdmin),
			handler: function() {
				var confirmStr="Deleteing this package will <b>permanently remove</b> all data associated with the package. This includes all the package's existing STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to delete the package?";
				Ext.Msg.confirm("Confirm",confirmStr,function (btn,text) {
					if (btn == 'yes') {
						var s = packageGrid.getSelectionModel().getSelections();
						for (var i = 0, r; r = s[i]; i++) {
							packageStore.remove(r);
						}
					}
				});
			}
		},'-',{
			iconCls: 'sm-package-icon',
			text: 'Modify package properties',
			handler: function() {
				var r = packageGrid.getSelectionModel().getSelected();
				Ext.getBody().mask('Getting properties of ' + r.get('packageName') + '...');
				showPackageProps(r.get('packageId'));
			}
		}],
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				id: 'packageGrid-csvBtn',
				iconCls: 'icon-save',
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				width: 20,
				handler: function(btn){
					var ourStore = assetGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&xaction=read';
				}
			},{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'packageGrid-totalText',
				text: '0 records',
				width: 80
			}]
		}),
		loadMask: true
	});



	function showPackageProps(id) {
		/******************************************************/
		// Assets
		/******************************************************/
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
			anchor: "100% -150",
			id: 'packages-assetGrid',
			hideLabel: true,
			isFormField: true,
			store: assetStore,
			columns: [
				assetSm,
				{ header: "Asset", 
					width: 95,
					dataIndex: 'assetName',
					sortable: true
				},
				{ header: "IP", 
					width: 95,
					dataIndex: 'ip',
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
						id: 'packages-assetGrid-filterField',
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
						id: 'packages-assetGrid-filterButton',
						toggleGroup: 'asset-selector',
						enableToggle:true,
						allowDepress: true,
						toggleHandler: function (btn,state) {
							filterAssetStore();
						}
					}]
				}]
			}),
			name: 'assets'
		});

		/******************************************************/
		// Form panel
		/******************************************************/
		var packagePropsFormPanel = new Ext.form.FormPanel({
			baseCls: 'x-plain',
			labelWidth: 95,
			url:'pl/updatePackageProps.pl',
			monitorValid: true,
			items: [
			{ // start fieldset config
				xtype:'fieldset',
				title: 'Package Information',
				autoHeight:true,
				items: [
				{ // start asset column config
					layout: 'column',
					baseCls: 'x-plain',
					items: [ // start asset column items
					{ // start column #1 config
						columnWidth: .5,
						layout: 'form',
						baseCls: 'x-plain',
						items: [
						{
							xtype: 'textfield',
							fieldLabel: 'Package Name',
							anchor: '-20',
							emptyText: 'Enter package name...',
							allowBlank: false,
							name: 'packageName'
						}
						,{
							xtype: 'textfield',
							fieldLabel: 'eMASS ID',
							anchor: '-20',
							emptyText: 'Enter eMASS ID...',
							allowBlank: true,
							name: 'emassId'
						}
						,{
							xtype: 'combo',
							fieldLabel: 'MAC and CL',
							width: 220,
							emptyText: 'Choose the MAC/CL...',
							allowBlank: false,
							editable: false,
							name: 'macCl',
							mode: 'local',
							triggerAction: 'all',
							displayField:'longName',
							valueField: 'macClId',
							hiddenName: 'macClId',
							store: macClStore
						}
						,{
							xtype: 'checkbox',
							name: 'reqRar',
							boxLabel: 'Requires RAR'
						}						
						] // end column #1 items
					},// end column #1 config
					{ // column #2 config
						columnWidth: .5,
						layout: 'form',
						baseCls: 'x-plain',
						items: [
						{
							xtype: 'textfield',
							fieldLabel: 'POC Name',
							anchor: '-20',
							emptyText: 'Enter POC name...',
							allowBlank: false,
							name: 'pocName'
						},
						{
							xtype: 'textfield',
							fieldLabel: 'POC Email',
							anchor: '-20',
							emptyText: 'Enter POC email...',
							allowBlank: true,
							name: 'pocEmail'
						},
						{
							xtype: 'textfield',
							fieldLabel: 'POC Phone',
							anchor: '-20',
							emptyText: 'Enter POC phone...',
							allowBlank: true,
							name: 'pocPhone'
						}
						]// end column #2 items
					} // end column #2 config
					]// end asset column items
				} // end asset column config
				] // end fieldset items
			} // end fieldset config
			,assetGrid
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
					packagePropsFormPanel.getForm().submit({
						submitEmptyText: false,
						params : {
							id: id,
							assets: encodeSm(assetSm,'assetId'),
							req: 'update'
						},
						waitMsg: 'Saving changes...',
						success: function (f,a) {
							Ext.getCmp('packageGrid').getView().holdPosition = true; //sets variable used in override in varsUtils.js
							Ext.getCmp('packageGrid').getStore().reload();
							Ext.Msg.alert('Success','Package ID ' + a.result.id + ' has been updated.');
							window.close();
						},
						failure: function(form, action){
							if (action.failureType === Ext.form.Action.CONNECT_FAILURE) {
								Ext.Msg.alert('Error',
									'Status:'+action.response.status+': '+
									action.response.statusText);
							}
							if (action.failureType === Ext.form.Action.SERVER_INVALID){
								// server responded with success = false
								Ext.Msg.alert('Invalid', action.result.errorStr);
							}
						}	
					});
				}
		   }]
		});

		/******************************************************/
		// Form window
		/******************************************************/
		var window = new Ext.Window({
			id: 'packagePropsWindow',
			title: 'Package Properties, ID ' + id,
			modal: true,
			hidden: true,
			width: 730,
			height:580,
			layout: 'fit',
			plain:true,
			bodyStyle:'padding:5px;',
			buttonAlign:'right',
			items: packagePropsFormPanel
		});
		

		/******************************************************/
		// filterAssetStore ()
		/******************************************************/
		function filterAssetStore () {
			var value = Ext.getCmp('packages-assetGrid-filterField').getValue();
			var selectionsOnly = Ext.getCmp('packages-assetGrid-filterButton').pressed;
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

		/******************************************************/
		// Load store(s), show window, and get properties
		/******************************************************/

		window.render(document.body);
		//assetStore.load({
			//callback: function (r,o,s) {
				packagePropsFormPanel.getForm().load({
					url: 'pl/getPackageProps.pl',
					params: {
						id: id
					},
					success: function(form,action) {
						Ext.getBody().unmask();
						window.show(document.body);
					}
				});
			//}
		//});
		
		
		} //end showAssetProps

	var thisTab = Ext.getCmp('admin-center-tab').add({
		id: 'package-admin-tab',
		iconCls: 'sm-package-icon',
		title: 'C&A packages',
		closable:true,
		layout: 'fit',
		items: [packageGrid]
		});
	thisTab.show();
	
	packageGrid.getStore().load({
		callback: function (r,o,s) {
			// repoStore.loadData(this.reader.jsonData.repositories);
			macClStore.loadData(this.reader.jsonData.macCls);
		}		
	});

	
} // end addPackageAdmin()