
function addAssetAdmin() {

	var stigFields = Ext.data.Record.create([
		{	name:'stigId',
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
		url: 'pl/getStigsForProps.pl',
		fields: stigFields,
		autoLoad: true,
		root: 'rows',
		sortInfo: {
			field: 'title',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		idProperty: 'stigId'
	});
		var packageFields = Ext.data.Record.create([
			{	name:'packageId',
				type: 'number'
			},{
				name:'packageName',
				type: 'string'
			}
		]);
		var packageStore = new Ext.data.JsonStore({
			url: 'pl/getPackages.pl',
			autoLoad: true,
			fields: packageFields,
			root: 'rows',
			sortInfo: {
				field: 'packageName',
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
			name: 'profile',
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
			type: 'string'
		},{
			name: 'stigNum',
			type: 'string'
		},{
			name: 'unassigned',
			type: 'string'
		},{
			name: 'nonnetwork',
			type: 'number'
		},{
			name: 'scanexempt',
			type: 'number'
		}
	]);

	var assetStore = new Ext.data.JsonStore({
		url: 'pl/getAssets.pl',
		root: 'rows',
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
		},
		writer:new Ext.data.JsonWriter()
	});

	var assetGrid = new Ext.grid.EditorGridPanel({
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
				header: "Profile",
				width: 10,
				dataIndex: 'profile',
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
				  return value == 1 ? 'X' : '';
				},
				sortable: true
			},{ 	
				header: "Scan Exempt",
				width: 5,
				dataIndex: 'scanexempt',
				align: "center",
				tooltip:"Is the asset exempt from vulnerability scanning",
				renderer: function(value, metaData, record, rowIndex, colIndex, store) {
				  return value == 1 ? 'X' : '';
				},
				sortable: true
			},{ 	
				header: "STIGs",
				width: 5,
				dataIndex: 'stigNum',
				align: "center",
				tooltip:"Total STIGs Assigned",
				sortable: true
			},{ 	
				header: "Unassigned",
				width: 7,
				dataIndex: 'unassigned',
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
				showAssetProps(0);            
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
				var confirmStr="Deleting this asset will <b>permanently remove</b> all data associated with the asset. This includes all the asset's existing STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to delete the asset?";
				Ext.Msg.confirm("Confirm",confirmStr,function (btn,text) {
					if (btn == 'yes') {
						var s = assetGrid.getSelectionModel().getSelections();
						for (var i = 0, r; r = s[i]; i++) {
							assetStore.remove(r);
						}
					}
				});
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



	function showAssetProps(id) {
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
					dataIndex: 'packageName',
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
					var record = packageStore.getById(v[y]);
					selRecords.push(record);
				}
				packageSm.selectRecords(selRecords);
			},
			getValue: function() {},
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
							showStigReviewers(id,record); // defined in this file
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
			setValue: function(v) {
				var selRecords = [];
				for(y=0;y<v.length;y++) {
					var record = stigStore.getById(v[y]);
					selRecords.push(record);
				}
				stigSm.selectRecords(selRecords);
			},
			getValue: function() {},
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
			name: 'stigs'
		});


		/******************************************************/
		// Form panel
		/******************************************************/
		var assetPropsFormPanel = new Ext.form.FormPanel({
			baseCls: 'x-plain',
			labelWidth: 70,
			url:'pl/updateAssetProps.pl',
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
					window.close();
				}
			},{
				text: 'Save',
				formBind: true,
				id: 'submit-button',
				handler: function(){
					assetPropsFormPanel.getForm().submit({
						submitEmptyText: true,
						params : {
							id: id,
							packages: encodeSm(packageSm,'packageId'),
							stigs: encodeSmExtend(stigSm,'stigId','users'),
							req: 'update',
							ipChanged: Ext.getCmp('assetProps-ip').isDirty()
						},
						waitMsg: 'Saving changes...',
						success: function (f,a) {
							if (a.result.success) {
								Ext.getCmp('assetGrid').getView().holdPosition = true; //sets variable used in override in varsUtils.js
								Ext.getCmp('assetGrid').getStore().reload();
								//Ext.Msg.alert('Success','Asset ID ' + a.result.id + ' has been updated.');
								window.close();
							} else {
								Ext.Msg.alert('Failure!','The database update has failed.');
								window.close();
							}
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
			id: 'assetPropsWindow',
			title: 'Asset Properties, ID ' + id,
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
							property:'packageName',
							value:value,
							anyMatch:true,
							caseSensitive:false
						},{
							fn: filterChecked,
							scope: packageSm
						}
					]);
				} else {
					packageStore.filter({property:'packageName',value:value,anyMatch:true,caseSensitive:false});
				}
			}
		};

		
		/******************************************************/
		// showStigReviewers
		/******************************************************/
		function showStigReviewers (assetId,record) {
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
				url: 'pl/getReviewers.pl',
				fields: stigUserFields,
				root: 'rows',
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
					forceFit: true
				},
				sm: stigUserSm,
				setValue: function(v) {
					var selRecords = [];
					for(y=0;y<v.length;y++) {
						var record = stigUserStore.getById(v[y]);
						selRecords.push(record);
					}
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
				title: record.data['title'],
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
						var myArray = new Array;
						var selectedUsers = stigUserSm.getSelections();
						for (var i=0; i < selectedUsers.length; i++) {
							myArray.push(selectedUsers[i].data['userId']);
						}
						record.data['users'] = myArray;
						stigUserWindow.close();
					}
				}]
			});

			stigUserStore.load({
				callback: function (r,o,s) {
					stigUserWindow.show(
						document.body,
						function (){ // window.show()callback function
							Ext.getBody().unmask();
							stigUserWindow.getEl().mask('Loading...');
							if (typeof record.data.users == 'object') { 
								// user has already interacted with this, so use their settings
								stigUserGrid.setValue(record.data.users);
								// filter has to happen after setting selections
								stigUserStore.filter([
									{
										fn: filterDept
									}
								]);
								stigUserWindow.getEl().unmask();
							} else {
								stigUserFormPanel.getForm().load({
									url: 'pl/getStigUserProps.pl',
									params: {
										assetId: assetId,
										stigId: record.data['stigId']
									},
									success: function (){
										stigUserStore.filter([
											{
												fn: filterDept
											}
										]);
										stigUserWindow.getEl().unmask();
									},
									failure : function (){
										stigUserWindow.getEl().unmask();
									}
								});
							}
						}
					);
				}
			});

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
		
		packageStore.clearFilter();
		stigStore.clearFilter();
		window.render(document.body);
						assetPropsFormPanel.getForm().load({
							url: 'pl/getAssetProps.pl',
							params: {
								id: id
							},
							success: function(form,action) {
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
								
								Ext.getBody().unmask();
								window.show(document.body);
							}
						});
		
		} //end showAssetProps

	var thisTab = Ext.getCmp('admin-center-tab').add({
		id: 'asset-admin-tab',
		iconCls: 'sm-asset-icon',
		title: 'Assets',
		closable:true,
		layout: 'fit',
		items: [assetGrid]
		});
	thisTab.show();
	
	assetGrid.getStore().load();

} // end addAssetAdmin()