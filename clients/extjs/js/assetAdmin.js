/* 
$Id: assetAdmin.js 820 2017-08-31 14:14:41Z csmig $
*/

function addAssetAdmin() {

	var stigFields = Ext.data.Record.create([
		{	name:'benchmarkId',
			type: 'string'
		},{
			name:'title',
			type: 'string'
		},{
			name: 'users' 
		},{
			name: 'icon'
		}
	]);
	var stigStore = new Ext.data.JsonStore({
		url: `${STIGMAN.Env.apiBase}/stigs`,
		fields: stigFields,
		autoLoad: true,
		root: '',
		sortInfo: {
			field: 'title',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		idProperty: 'benchmarkId'
	});
		var packageFields = Ext.data.Record.create([
			{	name:'packageId',
				type: 'number'
			},{
				name:'name',
				type: 'string'
			}
		]);
		var packageStore = new Ext.data.JsonStore({
			url: `${STIGMAN.Env.apiBase}/packages?elevate=${curUser.canAdmin}`,
			autoLoad: true,
			fields: packageFields,
			root: '',
			sortInfo: {
				field: 'name',
				direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
			},
			idProperty: 'packageId'
		});


	var assetFields = Ext.data.Record.create([
		{	name:'assetId',
			type: 'number'
		},{
			name: 'name',
			type: 'string'
		},{
			name: 'group',
			type: 'string'
		},{
			name: 'ip',
			type: 'string',
			sortType: sortIpAddress
		},{
			name: 'dept',
			type: 'string'
		},{
			name: 'packages',
			type: 'string',
			convert: (v, r) => v.map(i => i.name).join(', ')
		},{
			name: 'stigCount',
			type: 'integer',
			mapping: 'adminStats.stigCount'
		},{
			name: 'stigUnassignedCount',
			type: 'integer',
			convert: (v, r) => r.adminStats.stigCount - r.adminStats.stigAssignedCount
		},{
			name: 'nonnetwork',
			type: 'number'
		},{
			name: 'scanexempt',
			type: 'number'
		}
	]);

	var assetStore = new Ext.data.JsonStore({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/assets`,
			method: 'GET'
		}),
		root: '',
		fields: assetFields,
		totalProperty: 'records',
		isLoaded: false, // custom property
		idProperty: 'assetId',
		sortInfo: {
			field: 'name',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				store.isLoaded = true,
				Ext.getCmp('assetGrid-totalText').setText(records.length + ' records');
				assetGrid.getSelectionModel().selectFirstRow();
			},
			remove: function (store,record,index) {
				Ext.getCmp('assetGrid-totalText').setText(store.getCount() + ' records');
			}
		}
	});

	var assetGrid = new Ext.grid.GridPanel({
		//region: 'center',
		//split: true,
		//title: 'Asset administration',
		id: 'assetGrid',
		store: assetStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({
			singleSelect: true,
			listeners: {
				selectionchange: function (sm) {
					Ext.getCmp('assetGrid-modifyBtn').setDisabled(!sm.hasSelection());
					Ext.getCmp('assetGrid-deleteBtn').setDisabled(!sm.hasSelection());
				}
			}
		}),
		columns: [{ 	
				header: "Asset",
				width: 15,
				dataIndex: 'name',
				sortable: true
			},{ 	
				header: "Group",
				width: 10,
				dataIndex: 'group',
				sortable: true
			},{ 	
				header: "Dept",
				width: 5,
				align: "center",
				dataIndex: 'dept',
				sortable: true
			},{ 	
				header: "IP",
				width: 10,
				dataIndex: 'ip',
				sortable: true
			},{ 	
				header: "Packages",
				width: 10,
				dataIndex: 'packages',
				sortable: true
			},{ 	
				header: "Not Networked",
				width: 5,
				dataIndex: 'nonnetwork',
				align: "center",
				tooltip:"Is the asset connected to a network",
				renderer: function(value, metaData, record, rowIndex, colIndex, store) {
				  return value ? 'X' : '';
				},
				sortable: true
			},{ 	
				header: "Scan Exempt",
				width: 5,
				dataIndex: 'scanexempt',
				align: "center",
				tooltip:"Is the asset exempt from vulnerability scanning",
				renderer: function(value, metaData, record, rowIndex, colIndex, store) {
				  return value ? 'X' : '';
				},
				sortable: true
			},{ 	
				header: "STIGs",
				width: 5,
				dataIndex: 'stigCount',
				align: "center",
				tooltip:"Total STIGs Assigned",
				sortable: true
			},{ 	
				header: "Unassigned",
				width: 7,
				dataIndex: 'stigUnassignedCount',
				align: "center",
				tooltip:"STIGs Missing User Assignments",
				sortable: true
			}],
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
					Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
					showAssetProps(r.get('assetId'));
				}
			}
		},
		tbar: [
		{
			iconCls: 'icon-add',
			text: 'New asset',
			handler: function() {
				Ext.getBody().mask('Loading form...');
				showAssetProps();            
			}
		}
		,'-'
		, {
			ref: '../removeBtn',
			iconCls: 'icon-del',
			id: 'assetGrid-deleteBtn',
			text: 'Delete asset',
			disabled: true,
			handler: function() {
				try {
					var confirmStr="Deleteing this asset will <b>permanently remove</b> all data associated with the asset. This includes all the asset's existing STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to delete the asset?";
					Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
						if (btn == 'yes') {
							let asset = assetGrid.getSelectionModel().getSelected()
							let result = await Ext.Ajax.requestPromise({
								url: `${STIGMAN.Env.apiBase}/assets/${asset.data.assetId}`,
								method: 'DELETE'
							})
							assetStore.remove(asset)
						}
					})
				}
				catch (e) {
					alert(e.message)
				}
			}
		}
		,'-'
		,{
			iconCls: 'sm-asset-icon',
			disabled: true,
			id: 'assetGrid-modifyBtn',
			text: 'Modify asset properties',
			handler: function() {
				var r = assetGrid.getSelectionModel().getSelected();
				Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
				showAssetProps(r.get('assetId'));
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
					assetGrid.getStore().reload();
				}
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbbutton',
				id: 'assetGrid-csvBtn',
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
				id: 'assetGrid-totalText',
				text: '0 records',
				width: 80
			}]
		}),
		width: '50%',
		loadMask: true
	});



	async function showAssetProps(assetId) {
		let apiAsset
		let userAssignments = {}
		/******************************************************/
		// Packages
		/******************************************************/
		var packageSm = new Ext.grid.CheckboxSelectionModel({
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
		var packageGrid = new Ext.grid.GridPanel({
			title:'Package assignments',
			hideHeaders: true,
			flex: 30,
			id: 'assets-packagesGrid',
			hideLabel: true,
			isFormField: true,
			store: packageStore,
			columns: [
				packageSm,
				{ header: "Packages", 
					width: 95,
					dataIndex: 'name',
					sortable: true
				}
			],
			viewConfig: {
				forceFit: true
			},
			sm: packageSm,
			setValue: function(v) {
				var selRecords = [];
				for(y=0;y<v.length;y++) {
					var record = packageStore.getById(v[y].packageId);
					selRecords.push(record);
				}
				packageSm.selectRecords(selRecords);
			},
			getValue: function() {
				return JSON.parse(encodeSm(packageSm,'packageId'))
			},
			markInvalid: function() {},
			clearInvalid: function() {},
			validate: function() { return true},
			isValid: function() { return true;},
			getName: function() {return this.name},
			fieldLabel: 'Packages',
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
							filterPackageStore();
						},
						id: 'assets-packageGrid-filterField',
						width: 140,
						submitValue: false,
						enableKeyEvents:true,
						emptyText:'Enter a package filter...',
						listeners: {
							keyup: function (field,e) {
								filterPackageStore();
								return false;
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						icon: 'img/tick_white.png',
						tooltip: 'Show assignments only',
						id: 'assets-packageGrid-filterButton',
						toggleGroup: 'package-selector',
						enableToggle:true,
						allowDepress: true,
						toggleHandler: function (btn,state) {
							filterPackageStore();
						}
					}]
				}]
			}),
			name: 'packages'
		});

		/******************************************************/
		// STIG Grid
		/******************************************************/
		var stigSm = new Ext.grid.CheckboxSelectionModel({
			checkOnly: true,
			onRefresh: function() {
				// ORIGINAL PRIVATE METHOD BELOW
				// var ds = this.grid.store, index;
				// var s = this.getSelections();
				// this.clearSelections(true);
				// for(var i = 0, len = s.length; i < len; i++){
					// var r = s[i];
					// if((index = ds.indexOfId(r.id)) != -1){
						// this.selectRow(index, true);
					// }
				// }
				// if(s.length != this.selections.getCount()){
					// this.fireEvent('selectionchange', this);
				// }
				
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
		var stigGrid = new Ext.grid.GridPanel({
			title:'STIG assignments',
			hideHeaders: true,
			margins: {
				top: 0,
				bottom: 0,
				left: 10,
				right: 0
			},
			flex: 70,
			anchor: '100% 100%',
			id: 'assets-stigsGrid',
			hideLabel: true,
			isFormField: true,
			store: stigStore,
			cls: 'custom-stig-users',
			listeners: {
				celldblclick: function (grid,rowIndex,columnIndex,e) {
					if (grid.getSelectionModel().isSelected(rowIndex)) { 
						if (columnIndex == 2) {
							Ext.getBody().mask('Loading IAWF...');
							var record = grid.getStore().getAt(rowIndex);
							if (!(record.data.benchmarkId in userAssignments)) {
								// Initialize if this is a new STIG mapping for the Asset
								userAssignments[record.data.benchmarkId] = []
							}
							showStigReviewers(record.data.benchmarkId, userAssignments[record.data.benchmarkId]); // defined in this file
						}
					}
				}
			},
			columns: [
				stigSm,
				{ 	
					header: "Checklists", 
					width: 375,
					dataIndex: 'title',
					sortable: true
				},{ 
					header: "Icon",
					width: 30,
					dataIndex: 'icon'
				}
			],
			viewConfig: {
				forceFit: true
			},
			sm: stigSm,
			setValue: function(stigReviewers) {
				var selRecords = []
				stigReviewers.forEach(stig => {
					let record = stigStore.getById(stig.benchmarkId)
					selRecords.push(record)
					// User assignments
					userAssignments[stig.benchmarkId] = stig.reviewers
				})
				stigSm.selectRecords(selRecords);
			},
			getValue: function() {
				let stigReviewers = []
				let selectedStigs = stigSm.getSelections();
				selectedStigs.forEach(stigRecord => {
					// Map the userIds from the assignment object
					let userIds = stigRecord.data.benchmarkId in userAssignments ? userAssignments[stigRecord.data.benchmarkId].map(r => r.userId) : []
					stigReviewers.push({
						benchmarkId: stigRecord.data.benchmarkId,
						userIds: userIds
					})
				})
				return stigReviewers
			},
			markInvalid: function() {},
			clearInvalid: function() {},
			validate: function() { return true},
			isValid: function() { return true;},
			getName: function() {return this.name},
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
							filterStigStore();
						},
						id: 'assets-stigGrid-filterField',
						width: 140,
						submitValue: false,
						enableKeyEvents:true,
						emptyText:'Enter a STIG filter...',
						listeners: {
							keyup: function (field,e) {
								filterStigStore();
								return false;
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						icon: 'img/tick_white.png',
						tooltip: 'Show assignments only',
						id: 'assets-stigGrid-filterButton',
						toggleGroup: 'stig-selector',
						enableToggle:true,
						allowDepress: true,
						toggleHandler: function (btn,state) {
							filterStigStore();
						}
					}]
				}]
			}),
			name: 'stigReviewers'
		});


		/******************************************************/
		// Form panel
		/******************************************************/
		var assetPropsFormPanel = new Ext.form.FormPanel({
			baseCls: 'x-plain',
			labelWidth: 70,
			monitorValid: true,
			trackResetOnLoad: true,
			items: [
			{ // start fieldset config
				xtype:'fieldset',
				title: 'Asset Information',
				autoHeight:true,
				items: [
				{ // start asset column config
					layout: 'column',
					baseCls: 'x-plain',
					items: [ // start asset column items
					{ // start column #1 config
						columnWidth: .50,
						layout: 'form',
						baseCls: 'x-plain',
						items: [
						{
							xtype: 'textfield',
							fieldLabel: 'Asset Name',
							width: 150,
							emptyText: 'Enter asset name...',
							allowBlank: false,
							//disabled: !(curUser.canAdmin),
							name: 'name'
						},{
							xtype: 'textfield',
							id: 'assetProps-ip',
							fieldLabel: 'IP address',
							width: 150,
							emptyText: 'Enter asset IP address...',
							allowBlank: true,
							vtype: 'IPAddress',
							name: 'ip'
						}
						] // end column #1 items
					},// end column #1 config
					{ // column #2 config
						columnWidth: .50,
						layout: 'form',
						baseCls: 'x-plain',
						items: [
						{
							xtype: 'combo',
							fieldLabel: 'Department',
							width: 100,
							emptyText: 'Department...',
							allowBlank: false,
							editable: false,
							forceSelection: true,
							name: 'dept',
							mode: 'local',
							triggerAction: 'all',
							hideTrigger: !(curUser.canAdmin || curUser.role == 'Staff'),
							readOnly: !(curUser.canAdmin || curUser.role == 'Staff'),
							//fieldClass: "x-item-disabled",
							displayField:'dept',
							//disabled: !(curUser.canAdmin),
							store: new Ext.data.SimpleStore({
								fields: ['dept'],
								data : [['10'],['15'],['25'],['34'],['40'],['60'],['70'],['85']]
							})
						},
						{
							xtype: 'checkbox',
							id: 'assetProps-nonnetwork',
							name: 'nonnetwork',
							value: 'off',
							//disabled: !(curUser.canAdmin),
							boxLabel: 'Not networked',
							handler: function (cb,checked){
								var cb_scanexempt = Ext.getCmp('assetProps-scanexempt');
								var tf_ip = Ext.getCmp('assetProps-ip');
								cb_scanexempt.setDisabled(checked);
								tf_ip.setDisabled(checked);
								tf_ip.allowBlank = false;
								if (checked){
									cb_scanexempt.setValue(true);
									tf_ip.setValue('');
									tf_ip.allowBlank = true;
									//tf_ip.getEl().dom.labels[0].innerHTML='IP Address:'
									tf_ip.label.dom.innerHTML='IP Address:';

								} else {
									// tf_ip.getEl().dom.labels[0].innerHTML='IP Address:<span style="color: rgb(255, 0, 0); padding-left: 2px;">*</span>'
									tf_ip.label.dom.innerHTML='IP Address:<span style="color: rgb(255, 0, 0); padding-left: 2px;">*</span>';
								}
							}
						},
						{
							xtype: 'checkbox',
							id: 'assetProps-scanexempt',
							name: 'scanexempt',
							value: 'off',
							//disabled: !(curUser.canAdmin),
							boxLabel: 'Scanning Exempt'
						}
						]// end column #2 items
					} // end column #2 config
					]// end asset column items
				} // end asset column config
				] // end fieldset items
			} // end fieldset config
			,
			{
				layout: 'hbox',
				anchor: '100% -130',
				baseCls: 'x-plain',
				border: false,
				layoutConfig: {
					align: 'stretch'
				},
				items: [
					packageGrid,stigGrid
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
						if (assetPropsFormPanel.getForm().isValid()) {
							let values = assetPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
							// change "packages" to "packageIds"
							delete Object.assign(values, {['packageIds']: values['packages'] })['packages']
							let url, method
							if (assetId) {
								url = `${STIGMAN.Env.apiBase}/assets/${assetId}?elevate=${curUser.canAdmin}`
								method = 'PUT'
							}
							else {
								url = `${STIGMAN.Env.apiBase}/assets?elevate=${curUser.canAdmin}`
								method = 'POST'
							}
							let result = await Ext.Ajax.requestPromise({
								url: url,
								method: method,
								headers: { 'Content-Type': 'application/json;charset=utf-8' },
								jsonData: values
							  })
							apiAsset = JSON.parse(result.response.responseText)

							//TODO: This is expensive, should update the specific record instead of reloading entire set
							Ext.getCmp('assetGrid').getView().holdPosition = true
							Ext.getCmp('assetGrid').getStore().reload()
							appwindow.close()
						}
					}
					catch (e) {
						alert(e.message)
					}
				}
		   }]
		});

		/******************************************************/
		// Form window
		/******************************************************/
		var appwindow = new Ext.Window({
			id: 'assetPropsWindow',
			title: assetId ? 'Asset Properties, ID ' + assetId : 'Create new Asset',
			modal: true,
			hidden: true,
			width: 730,
			height:520,
			layout: 'fit',
			plain:true,
			bodyStyle:'padding:5px;',
			buttonAlign:'right',
			items: assetPropsFormPanel
		});
		

		/******************************************************/
		// filterStigStore ()
		/******************************************************/
		function filterStigStore () {
			var value = Ext.getCmp('assets-stigGrid-filterField').getValue();
			var selectionsOnly = Ext.getCmp('assets-stigGrid-filterButton').pressed;
			if (value == '') {
				if (selectionsOnly) {
					stigStore.filterBy(filterChecked,stigSm);
				} else {
					stigStore.clearFilter();
				}
			} else {
				if (selectionsOnly) {
					stigStore.filter([
						{
							property:'title',
							value:value,
							anyMatch:true,
							caseSensitive:false
						},{
							fn: filterChecked,
							scope: stigSm
						}
					]);
				} else {
					stigStore.filter({property:'title',value:value,anyMatch:true,caseSensitive:false});
				}
			}
		};

		/******************************************************/
		// filterPackageStore ()
		/******************************************************/
		function filterPackageStore () {
			var value = Ext.getCmp('assets-packageGrid-filterField').getValue();
			var selectionsOnly = Ext.getCmp('assets-packageGrid-filterButton').pressed;
			if (value == '') {
				if (selectionsOnly) {
					packageStore.filterBy(filterChecked,packageSm);
				} else {
					packageStore.clearFilter();
				}
			} else {
				if (selectionsOnly) {
					packageStore.filter([
						{
							property:'name',
							value:value,
							anyMatch:true,
							caseSensitive:false
						},{
							fn: filterChecked,
							scope: packageSm
						}
					]);
				} else {
					packageStore.filter({property:'name',value:value,anyMatch:true,caseSensitive:false});
				}
			}
		};

		
		/******************************************************/
		// showStigReviewers
		/******************************************************/
		async function showStigReviewers (benchmarkId, assignedUsers) {
			var stigUserFields = Ext.data.Record.create([
				{	name:'userId',
					type: 'number'
				},{
					name:'username',
					type: 'string'
				},{
					name:'dept',
					type: 'string'
				}
			]);
			var stigUserStore = new Ext.data.JsonStore({
				fields: stigUserFields,
				root: '',
				sortInfo: {
					field: 'username',
					direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
				},
				idProperty: 'userId'
			});
			var stigUserSm = new Ext.grid.CheckboxSelectionModel({
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
				},
				deselectRow: function (index, preventViewNotify) {
					if(this.isLocked()){
						return;
					}
					if(this.last == index){
						this.last = false;
					}
					if(this.lastActive == index){
						this.lastActive = false;
					}
					var r = this.grid.store.getAt(index);
					if(r && this.fireEvent('beforerowdeselect', this, index, r) !== false){
						this.selections.remove(r);
						if(!preventViewNotify){
							this.grid.getView().onRowDeselect(index);
						}
						this.fireEvent('rowdeselect', this, index, r);
						this.fireEvent('selectionchange', this);
					}
				},
			
				listeners: {
					// beforerowdeselect: function (sm, index, record) {
					// 	if (curUser.role === 'IAO' && !curUser.canAdmin) {
					// 		if (record.data.dept !== curUser.dept) {
					// 			return false
					// 		}
					// 	}
					// 	return true
					// }
				}
			});
			var stigUserGrid = new Ext.grid.GridPanel({
				anchor: "100% 100%",
				id: 'assets-stigsGrid-usersGrid',
				hideHeaders: false,
				hideLabel: true,
				store: stigUserStore,
				columns: [
					stigUserSm,
					{ 	
						header: "Username", 
						width: 100,
						dataIndex: 'username',
						sortable: true
					},
{ 	
						header: "Dept", 
						width: 50,
						dataIndex: 'dept',
						sortable: true
					}					
				],
				viewConfig: {
					forceFit: true,
					getRowClass: function(record, rowIndex, rp, ds) {
						if (curUser.role === 'IAO' && !curUser.canAdmin) {
							if (record.data.dept !== curUser.dept) {
								return 'x-stigman-cross-department'
							}
						}
					}
				},
				sm: stigUserSm,
				setValue: function(assignedUsers) {
					var selRecords = []
					assignedUsers.forEach(user => {
						let record = stigUserStore.getById(user.userId)
						selRecords.push(record)
					})
					stigUserSm.selectRecords(selRecords);
				},
				getValue: function() {},
				markInvalid: function() {},
				clearInvalid: function() {},
				isValid: function() { return true;},
				getName: function() {return this.name},
				isFormField: true,
				tbar: new Ext.Toolbar({
					items: [
						{
							xtype: 'trigger',
							fieldLabel: 'Filter',
							triggerClass: 'x-form-clear-trigger',
							onTriggerClick: function() {
								this.triggerBlur();
								this.blur();
								this.setValue('');
								filterStigUserStore();
							},
							id: 'assets-stigUserGrid-filterField',
							width: 140,
							submitValue: false,
							enableKeyEvents:true,
							emptyText:'Enter a user filter...',
							listeners: {
								keyup: function (field,e) {
									filterStigUserStore();
									return false;
								}
							}
						},{
							xtype: 'tbseparator'
						},{
							xtype: 'tbbutton',
							icon: 'img/tick_white.png',
							tooltip: 'Show assigned users only',
							toggleGroup: 'stigUser-selector',
							id: 'assets-stigUserGrid-filterButton',
							enableToggle:true,
							allowDepress: true,
							toggleHandler: function (btn,state) {
								filterStigUserStore();
								}
							// toggleHandler: function (btn,state) {
								// if (state) {
									// //pressed
									// stigUserStore.filterBy(filterChecked,stigUserSm);
								// } else {
									// stigUserStore.clearFilter();
								// }
							// }
						}
					]
				}),
				name: 'users'
			});
			var stigUserFormPanel = new Ext.form.FormPanel({
				baseCls: 'x-plain',
				labelWidth: 85,
				items: stigUserGrid		
			});
			var stigUserWindow = new Ext.Window({
				//title: 'Reviewers: ' + record.data['title'],
				title: benchmarkId,
				modal: true,
				width: 280,
				height:440,
				layout: 'fit',
				plain:true,
				bodyStyle:'padding:5px;',
				buttonAlign:'center',
				items: stigUserFormPanel,
				buttons: [{
					text: 'Cancel',
					handler: function(){
						stigUserWindow.close();
					}
				},{
					text: 'OK',
					formBind: true,
					handler: function(){
						assignedUsers.length = 0
						let selectedUsers = stigUserSm.getSelections()
						selectedUsers.forEach(userRecord => {
							// assignedUsers.push({
							// 	userId: userRecord.data['userId'],
							// 	username: userRecord.data['username'],
							// 	dept: userRecord.data['dept']
							// })
							assignedUsers.push(userRecord.data)
						})
						stigUserWindow.close()
					}
				}]
			});

			// TODO: Load stigUserStore from GET /users?role=IAWF. If unelevated IAO, also merge the non-dept users from assignedUsers

			let result = await Ext.Ajax.requestPromise({
				url: `${STIGMAN.Env.apiBase}/users`,
				params: {
					elevate: curUser.canAdmin,
					role: 'IAWF'
				},
				method: 'GET'
			})
			let apiUsers = JSON.parse(result.response.responseText)
			if (curUser.role === 'IAO' && !curUser.canAdmin) {
				// merge users from assignedUsers, allowing duplicate ids
				apiUsers = apiUsers.concat(assignedUsers)
			}
			stigUserStore.loadData(apiUsers)

			stigUserWindow.show(
				document.body,
				function () { // window.show()callback function
					Ext.getBody().unmask();
					stigUserWindow.getEl().mask('Loading...');
					stigUserGrid.setValue(assignedUsers);
					stigUserWindow.getEl().unmask();
				}
			);



			// stigUserStore.load({
			// 	callback: function (r,o,s) {
			// 		stigUserWindow.show(
			// 			document.body,
			// 			function () { // window.show()callback function
			// 				Ext.getBody().unmask();
			// 				stigUserWindow.getEl().mask('Loading...');
			// 				stigUserGrid.setValue(assignedUsers);
			// 				stigUserStore.filter([
			// 					{
			// 						fn: filterDept
			// 					}
			// 				]);
			// 				stigUserWindow.getEl().unmask();
			// 			}
			// 		);
			// 	}
			// });

			function filterStigUserStore () {
					var value = Ext.getCmp('assets-stigUserGrid-filterField').getValue();
					var selectionsOnly = Ext.getCmp('assets-stigUserGrid-filterButton').pressed;
					if (value == '') {
						if (selectionsOnly) {
							stigUserStore.filterBy(filterChecked,stigUserSm);
						} else {
							stigUserStore.clearFilter();
						}
					} else {
						if (selectionsOnly) {
							stigUserStore.filter([
								{
									property:'username',
									value:value,
									anyMatch:true,
									caseSensitive:false
								},{
									fn: filterChecked,
									scope: stigUserSm
								}
							]);
						} else {
							stigUserStore.filter({property:'username',value:value,anyMatch:true,caseSensitive:false});
						}
					}
			};
		
		};
		
		/******************************************************/
		// Load store(s), show window, and get properties
		/******************************************************/

		packageStore.clearFilter();
		stigStore.clearFilter();
		appwindow.render(document.body);

		if (assetId) {
			let result = await Ext.Ajax.requestPromise({
				url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
				params: {
					elevate: curUser.canAdmin,
					projection: ['stigReviewers', 'packages']
				},
				method: 'GET'
			})
			apiAsset = JSON.parse(result.response.responseText)
			assetPropsFormPanel.getForm().setValues(apiAsset)

			var cb_scanexempt = Ext.getCmp('assetProps-scanexempt');
			var nonnetworked = Ext.getCmp('assetProps-nonnetwork').getValue();
			var tf_ip = Ext.getCmp('assetProps-ip');
			
			cb_scanexempt.setDisabled(nonnetworked);
			tf_ip.setDisabled(nonnetworked);
			if (nonnetworked == 1){
				cb_scanexempt.setValue(true);
				tf_ip.setValue('');
				tf_ip.allowBlank = true;
			} else {
				tf_ip.allowBlank = false;
				//tf_ip.getEl().dom.labels[0].innerHTML='IP Address:<span style="color: rgb(255, 0, 0); padding-left: 2px;">*</span>'
				tf_ip.label.dom.innerHTML='IP Address:<span style="color: rgb(255, 0, 0); padding-left: 2px;">*</span>';
			}
		}
		
		Ext.getBody().unmask();
		appwindow.show(document.body);		
	} //end showAssetProps

	var thisTab = Ext.getCmp('admin-center-tab').add({
		id: 'asset-admin-tab',
		iconCls: 'sm-asset-icon',
		title: 'Assets',
		closable:true,
		layout: 'fit',
		items: [assetGrid]
		});
	// if (!curUser.canAdmin) {
		// assetGrid.getTopToolbar().hide();
	// }
	thisTab.show();
	
	assetGrid.getStore().load({
		params: {
			projection: ['adminStats', 'packages'],
			elevate: curUser.canAdmin
		}
	});

} // end addAssetAdmin()