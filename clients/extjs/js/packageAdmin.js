function addPackageAdmin() {
	var assetFields = Ext.data.Record.create([
		{	name:'assetId',
			type: 'number'
		},{
			name:'name',
			type: 'string'
		},{
			name:'ip',
			type: 'string'
		}
	]);
	var assetStore = new Ext.data.JsonStore({
		url: `${STIGMAN.Env.apiBase}/assets?elevate=${curUser.canAdmin}`,
		fields: assetFields,
		autoLoad: true,
		root: '',
		sortInfo: {
			field: 'name',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		idProperty: 'assetId'
	});
		
	var packageFields = Ext.data.Record.create([
		{	name:'packageId',
			type: 'number'
		},{
			name: 'name',
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
			name: 'repositoryName',
			type: 'string'
		}
	]);

	var packageStore = new Ext.data.JsonStore({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/packages`,
			method: 'GET'
		}),
		root: '',
		fields: packageFields,
		totalProperty: 'records',
		idProperty: 'packageId',
		sortInfo: {
			field: 'name',
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
		}
	});

	var packageGrid = new Ext.grid.EditorGridPanel({
		id: 'packageGrid',
		store: packageStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [{ 	
				header: "Package",
				width: 300,
				dataIndex: 'name',
				sortable: true
			},{ 	
				header: "eMASS ID",
				width: 100,
				dataIndex: 'emassId',
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
			,{ 	
				header: "POC Email",
				width: 150,
				dataIndex: 'pocEmail',
				sortable: true
			},{ 	
				header: "POC Phone",
				width: 150,
				dataIndex: 'pocPhone',
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
					Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
					showPackageProps(r.get('packageId'));
				}
			}
		},
		tbar: [{
			iconCls: 'icon-add',
			text: 'New Package...',
			handler: function() {
				Ext.getBody().mask('Loading form...');
				showPackageProps(0);            
			}
		},'-',{
			iconCls: 'sm-package-icon',
			text: 'Modify Package...',
			handler: function() {
				var r = packageGrid.getSelectionModel().getSelected();
				Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
				showPackageProps(r.get('packageId'));
			}
		},'-',{
			iconCls: 'sm-asset-icon',
			text: 'Manage Package Assets...',
			handler: function() {
				var r = packageGrid.getSelectionModel().getSelected();
				addAssetAdmin(r.get('packageId'), r.get('name'))
			}
		},'->', {
			ref: '../removeBtn',
			iconCls: 'icon-del',
			text: 'Delete Package',
			disabled: !(curUser.canAdmin),
			handler: function() {
				try {
					var confirmStr="Deleteing this package will <b>permanently remove</b> all data associated with the package. This includes all the package's existing STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to delete the package?";
					Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
						if (btn == 'yes') {
							var package = packageGrid.getSelectionModel().getSelected();
							let result = await Ext.Ajax.requestPromise({
								url: `${STIGMAN.Env.apiBase}/packages/${package.data.packageId}?elevate=true`,
								method: 'DELETE'
							})
							packageStore.remove(package);
						}
					})
				}
				catch (e) {
					alert(e.message)
				}
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



	async function showPackageProps(packageId) {
		let apiPackage
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
					dataIndex: 'name',
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
							name: 'name'
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
					appwindow.close();
				}
			},{
				text: 'Save',
				formBind: true,
				id: 'submit-button',
				handler: async function(){
					try {
						if (packagePropsFormPanel.getForm().isValid()) {
							let values = packagePropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
							// change "assets" to "assetIds"
							delete Object.assign(values, {['assetIds']: values['assets'] })['assets']
							let url, method
							if (packageId) {
								url = `${STIGMAN.Env.apiBase}/packages/${packageId}?elevate=${curUser.canAdmin}`
								method = 'PUT'
							}
							else {
								url = `${STIGMAN.Env.apiBase}/packages?elevate=${curUser.canAdmin}`
								method = 'POST'
							}
							let result = await Ext.Ajax.requestPromise({
								url: url,
								method: method,
								headers: { 'Content-Type': 'application/json;charset=utf-8' },
								jsonData: values
							  })
							apiPackage = JSON.parse(result.response.responseText)

							//TODO: This is expensive, should update the specific record instead of reloading entire set
							Ext.getCmp('packageGrid').getView().holdPosition = true
							Ext.getCmp('packageGrid').getStore().reload()
							appwindow.close()
						}
					}
					catch (e) {
						alert(e.message)
					}
				},
				handlerOriginal: function(){
					packagePropsFormPanel.getForm().submit({
						submitEmptyText: false,
						params : {
							id: packageid,
							assets: encodeSm(assetSm,'assetId'),
							req: 'update'
						},
						waitMsg: 'Saving changes...',
						success: function (f,a) {
							Ext.getCmp('packageGrid').getView().holdPosition = true; //sets variable used in override in varsUtils.js
							Ext.getCmp('packageGrid').getStore().reload();
							Ext.Msg.alert('Success','Package ID ' + a.result.id + ' has been updated.');
							appwindow.close();
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
		var appwindow = new Ext.Window({
			id: 'packagePropsWindow',
			title: packageId ? 'Package Properties, ID ' + packageId : 'Create new Package',
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
							property:'name',
							value:value,
							anyMatch:true,
							caseSensitive:false
						},{
							fn: filterChecked,
							scope: assetSm
						}
					]);
				} else {
					assetStore.filter({property:'name',value:value,anyMatch:true,caseSensitive:false});
				}
			}
		};

		/******************************************************/
		// Load store(s), show window, and get properties
		/******************************************************/
		assetStore.clearFilter()
		appwindow.render(document.body)

		if (packageId) {
			let result = await Ext.Ajax.requestPromise({
				url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
				params: {
					elevate: curUser.canAdmin,
					projection: ['assets']
				},
				method: 'GET'
			})
			apiPackage = JSON.parse(result.response.responseText)
			packagePropsFormPanel.getForm().setValues(apiPackage)
		}
		Ext.getBody().unmask()
		appwindow.show(document.body)	
	} //end showPackageProps

	var thisTab = Ext.getCmp('admin-center-tab').add({
		id: 'package-admin-tab',
		iconCls: 'sm-package-icon',
		title: 'Packages',
		closable:true,
		layout: 'fit',
		items: [packageGrid]
		});
	thisTab.show();
	
	packageGrid.getStore().load({
		params: {
			elevate: curUser.canAdmin
		}
	});

	
} // end addPackageAdmin()