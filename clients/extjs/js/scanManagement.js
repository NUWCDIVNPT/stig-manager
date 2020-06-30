/*
$Id: scanManagement.js 807 2017-07-27 13:04:19Z csmig $
*/


//
// addScanManagement()
//
// Arguments:
//		node: Ext.tree.TreeNode  The navigation tree node that invoked this function
//
// Returns: undef
//
// Creates and displays a Tab item that implements the Scan Management interface 
// for a specific collectionId
//
function addScanManagement(node) {

	var collectionId = node.attributes.collectionId;
	var collectionName = node.attributes.collectionName;
	var idAppend = "-scan-mgmt-" + collectionId;
	
	/****************************************************
	 BROWSE CONTEXT MENU
	 Shown when user right-clicks on a row in 
	 scanSumGrid OR pkgDetailGrid
	 ***************************************************/
	var browseContextMenu = new Ext.menu.Menu({
		// The calling grid will set 'sm_contextRecord' to the record 
		// for the row on which the user right-clicked	
		sm_contextRecord: undefined,
		sm_contextTargetType: undefined,
		cls: 'sm-context-menu',
		items: [
		{
			xtype: 'menutextitem',
			sm_browseType: 'header',
			text: 'Quick browse to ...',
			ctCls: 'sm-context-menu-header'
		}
		,{
			xtype: 'menuseparator',
			sm_browseType: 'header',
		}
		,{
			id: 'menuItem-browseScan' + idAppend,
			sm_browseType: 'scan',
			sm_targetId: undefined,
			iconCls: 'sm-nessus-16-icon',
			text: 'Browse to this scan' //will be customized at beforeshow
		}
		,{
			id: 'menuItem-browseAsset' + idAppend,
			sm_browseType: 'asset',
			sm_targetId: undefined,
			iconCls: 'sm-asset-icon',
			text: 'Browse to this asset' //will be customized at beforeshow
		}],
		listeners: {
			beforeshow: function(menu) {
				/* Before showing the menu, customize the item texts */
				menu.items.each(function( item ) {
					switch (item.sm_browseType) {
						case 'scan':
							item.sm_targetId = menu.sm_contextRecord.data.scanId;
							item.setText('Scan ID ' + item.sm_targetId);
							break;
						case 'asset':
							item.sm_targetId = menu.sm_contextRecord.data.assetId;
							item.setText('Asset "' + menu.sm_contextRecord.data.assetName + '"');
							break;
					}
					if (item.sm_browseType == menu.sm_contextTargetType) {
						item.hide();
					} else {
						item.show();
					}
				});					
			},
			itemclick: function(item) {
				// We'll be reloading the source scan summary grid to show the selected target.
				
				var browseTypeCombo = Ext.getCmp('tbar-scanSumGrid-browseTypeCombo' + idAppend);
				var browseTargetCombo = Ext.getCmp('tbar-scanSumGrid-browseTargetCombo' + idAppend);
				
				scanSumGrid.getEl().mask();

				// Ext.form.ComboBox.setVaue() is overriden in overrides.js
				// and the override adds a second parameter which lets us specify 
				// whether to fire the select event. We'll set it to 'false', so
				// we can process things differently than when a user changes the value 
				browseTypeCombo.setValue(item.sm_browseType,false);
				
				// Mimic what the browseTypeCombo select event handler would do
				scanSumGrid.store.removeAll();
				scanSumGrid.sm_browseType = item.sm_browseType;
				
				// Load the browseTarget combobox with items of targetType
				browseTargetCombo.store.load({
					params: {
						reqd: Ext.util.JSON.encode({
							targetType: item.sm_browseType,
							collectionId: collectionId
						})
					}
					,sm_selectedTargetId: item.sm_targetId
					,callback: function (r,o,s) {
						// Mimic what the browseTypeCombo select event handler would do
						if (item.sm_browseType == 'scan') {
							scanSumGrid.getSelectionModel().singleSelect = false;
						} else if (item.sm_browseType == 'asset') {
							scanSumGrid.getSelectionModel().singleSelect = true;
						}
						scanSumGrid.sm_browseType = item.sm_browseType;
						
						scanSumGrid.getEl().unmask();
					}
				});
			}
		}
	});
	
	/**************************************************
	 SOURCE SCAN SUMMARY
	 *************************************************/
	var scanSumFields = Ext.data.Record.create([
		{	
			name:'credentialed',
			type: 'string'
		},{	
			name:'scanId',
			type: 'int'
		},{	
			name:'scanName',
			type: 'string'
		},{	
			name:'assetId',
			type: 'int'
		},{	
			name:'assetName',
			type: 'string'
		},{	
			name:'ip',
			type: 'string',
			sortType: ip2num
		},{	
			name:'scannedName',
			type: 'string'
		},{	
			name:'scanDate',
			type: 'date',
			dateFormat: 'Y-m-d H:i:s'
		},{	
			name:'findCnt',
			type: 'int'
		},{	
			name:'cat1Cnt',
			type: 'int'
		},{	
			name:'cat2Cnt',
			type: 'int'
		},{	
			name:'cat3Cnt',
			type: 'int'
		},{	
			name:'uniqueId',
			type: 'string'
		},{	
			name:'isAssigned',
			type: 'int'
		},{	
			name:'assignable',
			type: 'int'
		}
	]);

	// Store used by the scanSumGrid
	var scanSumStore = new Ext.data.JsonStore({
		url: 'pl/handleScans.pl',
		baseParams: {
			req: 'scanSummary'
		},
		root: 'rows',
		storeId: 'scanSumStore' + idAppend,
		fields: scanSumFields,
		idProperty: 'uniqueId',
		sortInfo: {
			field: 'scanDate',
			direction: 'DESC'
		},
		listeners: {
			load: function (store,records) {
				// filter the store if the user has chosen to hide unassignable items 
				var showUnassignable = Ext.getCmp('tbar-scanSumGrid-unassignableCb' + idAppend);
				if (!showUnassignable.checked) {
					store.filter([
						{
							fn: function(record) {
							  return record.data.assignable > 0;
							},
							scope: this
						}
					]);
				}

				// Update the record count in the bottom toolbar
				Ext.getCmp('scanSumGrid-totalText' + idAppend).setText(store.getCount() + ' records');
			}
			,clear: function (store, records) {
				var actionBtn = Ext.getCmp('tbar-scanSumGrid-actionBtn' + idAppend);
				actionBtn.hide();
			}
		}
	});
	
	// Store used by the browseTargets combo box
	var browseTargetsStore = new Ext.data.JsonStore({
		url: 'pl/handleScans.pl'
		,autoLoad: false
		,baseParams: {
			req: 'getBrowseTargets'
		}
		,root: 'rows'
		,fields: [
			{name:'targetId',type: 'int'},
			{name:'target',type: 'string'},
			{name:'assigned',type: 'int'},
		]
		,listeners: {
			beforeload: function (store,options){
				// Show a grapic while loading
				var browseTargetCombo = Ext.getCmp('tbar-scanSumGrid-browseTargetCombo' + idAppend);
				var targetType = Ext.util.JSON.decode(options.params.reqd).targetType;
				browseTargetCombo.disable();
				browseTargetCombo.getEl().addClass('sm-combo-loading');
				browseTargetCombo.setValue('Loading ' + targetType + ' list...', false); //see overrides.js
				browseTargetCombo.show();
			}
			,load: function (store, records, options) {
				// Tell the combobox what targetType it is dislpaying
				var browseTargetCombo = Ext.getCmp('tbar-scanSumGrid-browseTargetCombo' + idAppend);
				var targetType = Ext.util.JSON.decode(options.params.reqd).targetType;
				browseTargetCombo.sm_targetType = targetType;
				
				// Set the combobox emptyText based on the targetType
				let emptyTextStr =" ";
				switch (targetType){
					case 'asset':
						emptyTextStr = 'Select an asset...';
						break;
					case 'scan':
						emptyTextStr = 'Select a scan...';
						break;
					default:
						emptyTextStr = 'Select an item...';
						break;
				}
				browseTargetCombo.emptyText = emptyTextStr;
				
				// Remove the grapic displayed while loading
				browseTargetCombo.getEl().removeClass('sm-combo-loading');
				
				// Auto-select an item in the combobox if one is provided. Used by the browseContextMenu.
				if (options.sm_selectedTargetId) {
					browseTargetCombo.setValue(options.sm_selectedTargetId,true); // setValue() defined overrides.js
				} else {
					browseTargetCombo.setValue(null,true); // setValue() defined overrides.js
				}
				browseTargetCombo.enable();
			}
		}
	});
	
	var scanSumGrid = new Ext.grid.GridPanel({
		region: 'center',
		listeners: {
			rowcontextmenu: function( grid, rowIndex, e){
				e.stopEvent();
				var xy = e.getXY();
				var r = grid.store.getAt(rowIndex);
				grid.contextMenu.sm_contextRecord = r;
				// Set the context menu's targetType property to match this grid's property
				grid.contextMenu.sm_contextTargetType = grid.sm_browseType;
				grid.contextMenu.showAt(xy);
			}
		},
		contextMenu: browseContextMenu,
		sm_browseType: undefined, // the browseType that is currently being displayed, set by other methods
		border: false,
		style: {
			borderTopStyle: 'solid'
			,borderTopWidth: '1px'
			,borderLeftStyle: 'solid'
			,borderLeftWidth: '1px'
			,borderRightStyle: 'solid'
			,borderRightWidth: '1px'
			,borderBottomStyle: 'solid'
			,borderBottomWidth: '1px'
		},
		id: 'scanSumGrid' + idAppend,
		split:true,
		store: scanSumStore,
		stripeRows:true,
		keys: {
			 // Handle Ctrl-A as select all
			 key: 'a',
			 ctrl: true,
			 stopEvent: true,
			 handler: function() {
				var sm =  scanSumGrid.getSelectionModel();
				if (sm.singleSelect == false){
					/* suspend events so we don't fire 'selectionchange' multiple times
					  this is necessary because selectAll() causes the first 'selectionchange'
					  to fire with a selection count of 1, then 2, etc. and this causes the child grid
					  to get all confused */
					sm.suspendEvents(false);
					sm.selectAll();
					sm.resumeEvents(false);
					sm.fireEvent('selectionchange',sm);
				}
			 }
		},
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: false,
			listeners: {
				beforerowselect: function(sm,index,keepExisting,record) {
					// don't allow rows with no scanId to be selected
					if (record.data.scanId == null || record.data.scanId == 0) {
						return false;
					} else {
						return true;
					}
				},
				selectionchange: {
					fn: function(sm) {
						// GOAL: Set the action button's state based on the type and number of selections

						// Declare and initialize counting variables
						var numAssigned = 0;
						var numUnassigned = 0;
						var numUnassignable = 0;
						
						// Get the selections (an Array of records) 
						var selections = sm.getSelections();
						// Count the types of selected records
						for (var x = 0; x < selections.length; x++) {
							if (selections[x].data.isAssigned == 1) {
								numAssigned++;
							} else {
								numUnassigned++;
							}
							if (selections[x].data.assignable == 0) {
								numUnassignable++;
							}
						}
						
						// Set the button state
						var actionBtn = Ext.getCmp('tbar-scanSumGrid-actionBtn' + idAppend);
						if (numAssigned + numUnassigned == 0) {
							// There are no selections
							actionBtn.hide();
						} else if (numUnassigned > 0){
							// Some selections are unassigned
							actionBtn.smSetMode('assign');
							if (actionBtn.hidden) {
								actionBtn.show();
							}
						} else {
							// All selections are assigned
							actionBtn.smSetMode('unassign');
							if (actionBtn.hidden) {
								actionBtn.show();
							}
						}
						// Disable the button if any of the selections are unassignable
						actionBtn.setDisabled(numUnassignable > 0);

						// Load the detail child grid if there is exactly one selection
						// Otherwise, clear it
						if (selections.length == 1) {
							scanDetailStore.load({
								params: {
									reqd: Ext.util.JSON.encode({
										scanId: selections[0].data.scanId
										,ip: selections[0].data.ip
									})
								}
							});
						} else {
							scanDetailStore.removeAll();
						}
					}
				}
			}
		}),
		view: new Ext.grid.GridView({
			forceFit:true,
			emptyText: 'No scan result summaries to display',
			holdPosition: true, // Used by the onLoad() method in overrides.js
			deferEmptyText:false,
			getRowClass: function (record,index) {
				// Display unassignable scans differently
				if (record.data.assignable == 0) {
					return 'sm-grid3-row-error';
				}
			}
		}),
		cm: new Ext.grid.ColumnModel([
			new Ext.grid.RowNumberer(),
			{ 	
				// Column that shows a graphic if the record indicates the item is assigned
				id:'col-scanSumGrid-isAssigned' + idAppend,
				header: '<img src="img/blackcheckt.gif" width=10 height=10 ext:qtip="Status of the scan assignment" style="vertical-align: middle;" exportvalue="Status">',
				width: 20,
				dataIndex: 'isAssigned',
				sortable: true,
				align: 'center',
				renderer: function (val, md) {
					switch (val) {
						case 1:
							md.attr = 'exportvalue="Assigned_this"';
							return '<img src="img/greencheckt.gif" alt="Assigned this scan" width=10 height=10 ext:qtip="Assigned this scan">';
							break;
						case 2:
							md.attr = 'exportvalue="Assigned_other"';
							return '<img src="img/greycheckt.gif" alt="Assigned other scan" width=10 height=10 ext:qtip="Assigned other scan">';
							break;
						default:
							md.attr = 'exportvalue="Assigned_none"';
							return '';
							break;
					}
				}

			},
			{ 	
				id:'col-scanSumGrid-scanId' + idAppend,
				header: "Scan",
				width: 50,
				dataIndex: 'scanId',
				sortable: true,
				align: 'left',
				renderer: function (value, metaData, record, rowIndex, colIndex, store) {
					metaData.attr = 'ext:qtip="' + record.data.scanName + '"';
					return value;
				}
			},
			{ 	
				id:'col-scanSumGrid-scanDate' + idAppend,
				header: "Scan Date",
				width: 100,
				dataIndex: 'scanDate',
				xtype: 'datecolumn',
				format:'Y-m-d H:i',
				sortable: true
			},
			{ 	
				id:'col-scanSumGrid-assetName' + idAppend,
				header: "Collection Asset",
				width: 120,
				dataIndex: 'assetName',
				sortable: true,
				align: 'left'
			},
			{ 	
				id:'col-scanSumGrid-ip' + idAppend,
				header: "Scanned IP",
				width: 80,
				dataIndex: 'ip',
				sortable: true,
				align: 'left'
			},
			{ 	
				id:'col-scanSumGrid-scannedName' + idAppend,
				header: "Scanned Name",
				width: 120,
				dataIndex: 'scannedName',
				sortable: true,
				align: 'left',
				renderer: function (value, metaData, record, rowIndex, colIndex, store) {
					metaData.attr = 'ext:qtip="' + record.data.scannedName + '"';
					return value;
				}
			},
			{ 	
				id:'col-scanSumGrid-credentialed' + idAppend,
				header: "Cred",
				width: 50,
				dataIndex: 'credentialed',
				fixed: true,
				sortable: true,
				align: 'center',
				renderer: function (value, metaData, record, rowIndex, colIndex, store) {
					metaData.css = (value == 'true') ? 'sm-cell-green' :'sm-cell-red';
					return value;
				}
			},
			{ 	
				id:'col-scanSumGrid-cat1Cnt' + idAppend,
				header: "I",
				dataIndex: 'cat1Cnt',
				width: 32,
				fixed: true,
				sortable: true,
				align: 'center',
				renderer: renderCatCells
			},
			{ 	
				id:'col-scanSumGrid-cat2Cnt' + idAppend,
				header: "II",
				dataIndex: 'cat2Cnt',
				width: 32,
				fixed: true,
				sortable: true,
				align: 'center',
				renderer: renderCatCells
			},
			{ 	
				id:'col-scanSumGrid-cat3Cnt' + idAppend,
				header: "III",
				dataIndex: 'cat3Cnt',
				width: 32,
				fixed: true,
				sortable: true,
				align: 'center',
				renderer: renderCatCells
			}
		]),
		autoExpandColumn:'col-scanSumGrid-assetName' + idAppend,
		loadMask: true,
		tbar: new Ext.Toolbar({
			items: [
				{
					id: 'tbar-scanSumGrid-browseTypeLabel' + idAppend,
					xtype: 'tbtext',
					text: 'Browse by:'
				}
				,{
					xtype: 'tbspacer'
				}
				,{
					/*******************************
					// BROWSE TYPE ComboBox
					*******************************/
					xtype: 'combo',
					id: 'tbar-scanSumGrid-browseTypeCombo' + idAppend,
					sm_contextMenuSelected: false,
					mode: 'local',
					editable: false,
					store: new Ext.data.SimpleStore({
						fields: ['type','typeDisplay'],
						data : [['best','Best Scan'],['asset','Asset...'],['scan','Scan...']]
					}),
					displayField:'typeDisplay',
					valueField: 'type',
					triggerAction: 'all',
					width: 80,
					value: 'best',
					listeners: {
						select: function(browseTypeCombo,rec,i) {
							// GOALS: Show/hide the browseTarget combobox appropriately
							// Load the browseTarget combobox if appropriate
							// Load/Clear the scanSumGrid as necessary
							
							// get the browseTarget comboxbox for future use
							var browseTargetCombo = Ext.getCmp('tbar-scanSumGrid-browseTargetCombo' + idAppend);
							
							// Behave differently depending on the targetType
							var targetType = rec.data.type;
							if (targetType == 'best') {
								// For "Best scan", hide the browseTarget combo (there's no need to choose any targets) 
								// and load the scanSumGrid with records
								browseTargetCombo.hide();
								scanSumGrid.store.load({
									params: {
										reqd: Ext.util.JSON.encode({
											targetType: targetType,
											collectionId: collectionId
										})
									},
									callback: function (r,o,s) {
										// User can select multiple rows for assignment
										scanSumGrid.getSelectionModel().singleSelect = false;
										scanSumGrid.sm_browseType = targetType;
									}
								});
							} else {
								// The targetType is not 'Best scan". The scanSumGrid will be empty until the user chooses an item.
								// John B. asked that the grid's empty text be temporarily changed to hopefully keep users from 
								// considering the empty grid as a bug
								let targetTypeStr="";
								switch (targetType){
									case 'asset':
										targetTypeStr = 'an asset';
										break;
									case 'scan':
										targetTypeStr = 'a scan';
										break;
									default:
										targetTypeStr = 'an item';
										break;
								}
								let savedEmptyText = scanSumGrid.getView().emptyText;
								scanSumGrid.getView().emptyText='Select ' + targetTypeStr + ' from the droplist above.';
								scanSumGrid.store.removeAll();
								scanSumGrid.getView().emptyText=savedEmptyText;
								
								// Show the browseTarget combobox and load it.							
								browseTargetCombo.show();
								browseTargetCombo.store.load({
									params: {
										reqd: Ext.util.JSON.encode({
											collectionId: collectionId,
											targetType: targetType
										})
									}
									,selectedTargetId: ''
									,callback: function(r,o,s) {
										// If we've made it this far, all is well.
										// Set the scanSumGrid's support for multiple selections
										// based on the targetType
										if (targetType == 'scan') {
											scanSumGrid.getSelectionModel().singleSelect = false;
										} else if (targetType == 'asset') {
											scanSumGrid.getSelectionModel().singleSelect = true;
										}
										scanSumGrid.sm_browseType = targetType;

									}
								});
							}
						}
					}
				}
				,{
					xtype: 'tbspacer'
				}
				,{
					/*******************************
					// BROWSE TARGET ComboBox
					*******************************/
					xtype: 'combo',
					id: 'tbar-scanSumGrid-browseTargetCombo' + idAppend,
					tpl: '<tpl for=".">' + 
					'<div class="x-combo-list-item">' + 
					'<tpl if="assigned &gt;= 1">' + 
						'<img src="img/greencheckt.gif" width=12 height=12 style="vertical-align:bottom;">' + 
					'</tpl>' + 
					'<tpl if="assigned===0">' + 
						'<img src="img/greydash.gif" width=12 height=12 style="vertical-align:bottom;">' + 
					'</tpl>' + 
					'&nbsp;&nbsp;{target}' + 
					'</div>' + 
					'</tpl>',
					mode: 'local',
					hidden: true,
					sm_targetType: '',
					smSelectedRecord: undefined, // The currently selected record, set in the select() handler 
					editable: false,
					disabled: true,
					store: browseTargetsStore,
					displayField:'target',
					valueField: 'targetId',
					triggerAction: 'all',
					width: 240,
					emptyText: " ",
					listeners: {
						select: function(c,r,i) {
							c.smSelectedRecord = r;
							scanDetailStore.removeAll();
							scanSumGrid.store.load({
								params: {
									reqd: Ext.util.JSON.encode({
										targetType: c.sm_targetType,
										targetId: r.data.targetId,
										collectionId: collectionId
									})
								}
							});
						},
						collapse: function(c) {
							// Keeps the combobox text field from scrolling to the end of the text
							var d = c.el.dom;
							d.selectionStart=0;
							d.selectionEnd=0;
							d.blur();
						},
						expand: function (c) {
							/* To reapply the combobox's Template */
							c.view.refresh();
						}
					}
				}
				,{
					xtype: 'tbseparator'
				}
				,{
					/*******************************
					// SHOW UNASSIGNABLE checkbox
					*******************************/
					xtype: 'checkbox',
					id: 'tbar-scanSumGrid-unassignableCb' + idAppend,
					value: true,
					boxLabel: 'Show unassignable',
					//boxLabel: '<span style="top:-1px;">Show unassignable</span>',
					//labelStyle: 'top: -1px;',
					handler: function (cb,checked){
						if (checked) {
							scanSumStore.clearFilter();
						} else {
							scanSumStore.filter([
								{
									fn: function(record) {
									  return record.data.assignable > 0;
									},
									scope: this
								}
							]);
						}
						Ext.getCmp('scanSumGrid-totalText' + idAppend).setText(scanSumStore.getCount() + ' records');

					}
				}
				,{
					xtype: 'tbfill'
				}
				,{
					/*******************************
					// ASSIGN/UNASSIGN button
					*******************************/
					text: '',
					ctCls: 'x-btn-over',
					width: 100,
					hideMode: 'visibility',
					hidden: true,
					smMode: '',
					smSetMode: function (action) {
						switch (action) {
							case 'assign':
								this.setText("Assign");
								this.setIconClass("sm-scan-assign-icon");
								this.smMode = "assign";
								break;
							case 'unassign':
								this.setText("Unassign");
								this.setIconClass("sm-scan-unassign-icon");
								this.smMode = "unassign";
								break;
							default:
								break;
						}
					},
					id: 'tbar-scanSumGrid-actionBtn' + idAppend,
					//iconCls: 'sm-check-enabled-icon',
					tooltip: 'Toggle the selection of this scan', 
					handler: handleScanAssignment
				}
				
			]
		}),
		bbar: new Ext.Toolbar({
			items: [
			{
				/*******************************
				// RELOAD button
				*******************************/
				xtype: 'tbbutton',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				width: 20,
				handler: function(btn){
					//Ext.getCmp('tbar-scanSumGrid-actionBtn' + idAppend).disable();
					scanSumStore.reload();
					//hostGrid.getStore().removeAll();
				}
			}
			,{
				xtype: 'tbseparator'
			}
			,{
				/*******************************
				// EXPORT button
				*******************************/
				xtype: 'exportbutton',
				hasMenu: true,
				gridBasename: 'Source Scan Summary (grid)',
				storeBasename: 'Source Scan Summary (store)',
				iconCls: 'sm-artifact-download-icon',
				text: 'Export'
			}
			,{
				xtype: 'tbfill'
			},{
				xtype: 'tbtext',
				id: 'scanSumGrid-totalText' + idAppend,
				text: '0 records',
				width: 80
			}]
		})
	});

	//
	// renderCatCells()
	//
	// Arguments:
	//		value: string  The raw value that is proposed for the cell
	//		metaData: Object, includes the css property
	//		record: Ext.data.record  The record for the row
	//		rowIndex: number  The index of the row
	//		colIndex: number  The index of the column
	//		store: Ext.data.Store  The store containing the record
	//
	// Returns: undef
	//
	// Sets formatting for cells displaying CAT counts
	//
	function renderCatCells (value, metaData, record, rowIndex, colIndex, store) {
		var returnValue = value;
		// A zero count is formatted with green background, no matter what CAT level
		if (value <= 0) {
			returnValue = '-';
			metaData.css = 'sm-cell-green';
		} else {
			// Each CAT level is formatted a different background color
			switch (scanSumGrid.getColumnModel().getDataIndex(colIndex)) {
				case 'cat1Cnt':
					metaData.css = 'sm-cell-red';
					break;
				case 'cat2Cnt':
					metaData.css = 'sm-cell-orange';
					break;
				case 'cat3Cnt':
					metaData.css = 'sm-cell-purple';
					break;
			}
		}
		return returnValue;
		
	};
	
	//
	// handleScanAssignment()
	//
	// Arguments:
	//		b: Ext.Button  The button whose handler this is
	//		e: Ext.EventObject The click event object
	//
	// Returns: undef
	//
	// Click handler for the Action button. Sends an API batch request that assigns or unassigns
	// assetId/scanId combinations AND retrieves the resulting Collection Scan summary.
	//
	function handleScanAssignment(b,e){

		workspaceTab.getEl().mask("Please wait...");

		// Construct an assign API request
		var assign_req = {
			req: 'assign',
			reqd: {
				collectionId: collectionId,
				assign: []
			}
		};
		// Push items onto the request data's assign[]
		var records = scanSumGrid.getSelectionModel().getSelections();
		for (var x = 0; x < records.length; x++) {
			assign_req.reqd.assign.push({
					assetId: records[x].data.assetId,
					scanId: b.smMode == 'assign' ? records[x].data.scanId : undefined
			});
		}
		
		/* Construct the pkgScanSummary request */
		var pkgScanSummary_req = {
			req: 'pkgScanSummary',
			reqd: {
				collectionId: collectionId
			}
		};

		// Send the batch request
		Ext.Ajax.request({
			url: 'pl/handleScans.pl',
			params: { 
				req: 'batch',
				reqd: Ext.util.JSON.encode([assign_req, pkgScanSummary_req])
			},				
			callback: function(options, success, response) {                               
				if (success) {
					var ro = Ext.util.JSON.decode(response.responseText);
					pkgSumGrid.store.loadData(ro.batch[1]);
					pkgSumGrid.store.storeOptions({
						params: {
							req: pkgScanSummary_req.req,
							reqd: Ext.util.JSON.encode(pkgScanSummary_req.reqd)
						}
					});

					if (scanSumGrid.getSelectionModel().singleSelect) {
						// If the grid's selectionModel's singleSelect is true,
						// then we're assigning/unassigning from an asset list so we need
						// to remove the current assignment before setting the new, if any
						var curAssignedIdx = scanSumGrid.store.findExact("isAssigned",1);
						if (curAssignedIdx != -1){
							var curAssignedRec = scanSumGrid.store.getAt(curAssignedIdx);
							curAssignedRec.data.isAssigned = 0;
							// true argument means no update event will be fired 
							curAssignedRec.commit(true);
						}
						if (b.smMode == "assign") {
							records[0].data.isAssigned = 1;
							records[0].commit(true);
						}
					} else {
						// If the grid's selectionModel's singleSelect is false,
						// then we're assigning/unassigning from an scan list so we 
						// either add to or substract from the current assignments
						for (var x = 0; x < records.length; x++) {
							if (b.smMode == "assign") {
								records[x].data.isAssigned = 1;
								records[x].commit(true);
							} else if (b.smMode == "unassign")  {
								records[x].data.isAssigned = 0;
								records[x].commit(true);
							}
						}
					}
					
					// Since we committed with no update events firing
					scanSumGrid.view.refresh();
					
					// Rejigger the assignment button
					if (b.smMode == "assign") {
						b.smSetMode("unassign");
					} else if (b.smMode == "unassign") {
						b.smSetMode("assign");
					}
					
					//Rejigger the target combobox's record
					var cb = Ext.getCmp('tbar-scanSumGrid-browseTargetCombo' + idAppend);
					if (!cb.disabled && !cb.hidden) {
						var curAssignedIdx = scanSumGrid.store.findExact("isAssigned",1);
						if (curAssignedIdx != -1){
							cb.smSelectedRecord.data.assigned = 1;
						} else {
							cb.smSelectedRecord.data.assigned = 0;
						}
						cb.smSelectedRecord.commit(true);
					}
				}
				workspaceTab.getEl().unmask();
			}
		});
	};
	
	/**************************************************
	 SOURCE SCAN DETAIL
	 *************************************************/
	var scanDetailFields = Ext.data.Record.create([
		{	
			name:'cat',
			type: 'int'
		},{	
			name:'pluginId',
			type: 'int'
		},{	
			name:'protocol',
			type: 'string'
		},{	
			name:'port',
			type: 'int'
		},{	
			name:'pluginName',
			type: 'string'
		},{	
			name:'description',
			type: 'string'
		},{	
			name:'solution',
			type: 'string'
		},{	
			name:'pluginOutput',
			type: 'string'
		},{	
			name:'severity',
			type: 'string'
		},{	
			name:'stigSeverity',
			type: 'string'
		}
	]);
	
	var scanDetailStore = new Ext.data.JsonStore({
		url: 'pl/handleScans.pl',
		baseParams: {
			req: 'scanDetail'
		},
		root: 'rows',
		messageProperty: 'message',
		storeId: 'scanDetailStore' + idAppend,
		fields: scanDetailFields,
		sortInfo: {
			field: 'cat',
			direction: 'ASC' // or 'ASC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records,options) {
				var message = store.reader.jsonData.message;
				var str = "";
				Object.keys(message).sort().forEach(function(key,index) {
					str += "<b>" + key + "</b>:&nbsp;" + message[key] + "&nbsp;&nbsp;";
				});
				Ext.getCmp('tb-scanDetailGrid-messageText' + idAppend).setText(str);
				Ext.getCmp('scanDetailGrid-totalText' + idAppend).setText(records.length + ' records');
			},
			clear: function (store,records){
				Ext.getCmp('tb-scanDetailGrid-messageText' + idAppend).setText("");
			}
		}
	});

	var scanDetailExpander = new Ext.ux.grid.RowExpander({
		tpl : new Ext.XTemplate(
			'<p><b>Severity: </b>{severity}&nbsp;&nbsp;',
			'<b>STIG severity: </b>{stigSeverity}</p>',
			'<tpl if="pluginOutput===&quot;&quot;">',
			'<p><b>Plugin Output was not provided.</b></p>',
			'</tpl>',
			'<tpl if="pluginOutput!==&quot;&quot;">',
			'<p><b>Plugin Output:</b><blockquote style="padding-left:20px"> {pluginOutput}</blockquote></p>',
			'</tpl>',
			'<p><b>Description:</b><blockquote style="max-width:500px;padding-left:20px"> {description}</blockquote></p>',
			'<p><b>Solution:</b><blockquote style="max-width:500px;padding-left:20px"> {solution}</blockquote></p>',
			'</tpl>'
		)
		,getRowClass : function(record, rowIndex, p, ds){
			var parentCssClass = Ext.ux.grid.RowExpander.prototype.getRowClass.call(this,record,rowIndex,p,ds);			
			var ourCssClass = '';
			switch (record.data.cat){
				case 1:
					ourCssClass =  ' cs-grid3-row-overdue';
					break;
				case 2:
					ourCssClass =  ' cs-grid3-row-warning';
					break;
				case 3:
					ourCssClass =  ' cs-grid3-row-new-overdue';
					break;
			}
			return parentCssClass + ourCssClass;
		}
	});

	var scanDetailGrid = new Ext.grid.GridPanel({
		region: 'south',
		split:true,
		//margins: {top:0, right:20, bottom:0, left:0},
        plugins: scanDetailExpander,
		height: '34%',
		border: false,
		//margins: "2 2 2 2",
		style: {
			borderTopStyle: 'solid'
			,borderTopWidth: '1px'
			,borderLeftStyle: 'solid'
			,borderLeftWidth: '1px'
			,borderRightStyle: 'solid'
			,borderRightWidth: '1px'
			,borderBottomStyle: 'solid'
			,borderBottomWidth: '1px'
		},
		id: 'scanDetailGrid' + idAppend,
		title: 'Source scan result details',
		store: scanDetailStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: true,
			listeners: {
				beforerowselect: {
					fn: function(sm,index,record) {
						return false;
					}
				}
			}
		}),
		view: new Ext.grid.GridView({
			forceFit:false,
			emptyText: 'No details to display',
			// These listeners keep the grid in the same scroll position after the store is reloaded
			holdPosition: true, // HACK to be used with override
			deferEmptyText:false,
			getRowClass: function (record,index) {
				switch (record.data.cat){
					case "1":
						return 'cs-grid3-row-overdue';
						break;
					case "2":
						return 'cs-grid3-row-warning';
						break;
					case "3":
						return 'cs-grid3-row-new-overdue';
						break;
				}
			}
		}),
		columns: [
			scanDetailExpander,
			{
				id:'col-scanDetailGrid-cat' + idAppend,
				header: "CAT",
				width: 40,
				dataIndex: 'cat',
				sortable: true,
				align: 'center'
			},{ 	
				id:'col-scanDetailGrid-pluginId' + idAppend,
				header: "Plugin",
				width: 80,
				dataIndex: 'pluginId',
				sortable: true,
				align: 'center'
			},{
				id:'col-scanDetailGrid-pluginName' + idAppend,
				header: "Name",
				width: 40,
				dataIndex: 'pluginName',
				sortable: true,
				align: 'left'
			},{
				id:'col-scanDetailGrid-port' + idAppend,
				header: "Port",
				width: 60,
				dataIndex: 'port',
				sortable: true,
				align: 'center'
			}

		],
		autoExpandColumn:'col-scanDetailGrid-pluginName' + idAppend,
		loadMask: true,
		tbar: new Ext.Toolbar({
			height: 27,
			items: [
				{
					xtype: 'tbtext'
					,style: {paddingTop: '4px'}
					,id:'tb-scanDetailGrid-messageText' + idAppend
					,text: ''
				} 
			]
		}),
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				width: 20,
				handler: function(btn){
					scanDetailStore.reload();
					//hostGrid.getStore().removeAll();
				}
			},{
				xtype: 'tbseparator'
			}
			,{
				xtype: 'exportbutton',
				hasMenu: true,
				gridBasename: 'Source Scan Detail (grid)',
				storeBasename: 'Source Scan Detail (store)',
				iconCls: 'sm-artifact-download-icon',
				text: 'Export'
			}
			,{
				xtype: 'tbfill'
			},{
				xtype: 'tbtext',
				id: 'scanDetailGrid-totalText' + idAppend,
				text: '0 records',
				width: 80
			}]
		})
	});

	/**************************************************
	 PACKAGE SCAN SUMMARY
	 *************************************************/
	var pkgSumFields = Ext.data.Record.create([
		{	
			name:'cat',
			type: 'string'
		},{	
			name:'pluginId',
			type: 'int'
		},{	
			name:'pluginName',
			type: 'string'
		},{	
			name:'description',
			type: 'string'
		},{	
			name:'solution',
			type: 'string'
		},{	
			name:'severity',
			type: 'string'
		},{	
			name:'stigSeverity',
			type: 'string'
		},{	
			name:'occurrences',
			type: 'int'
		},{	
			name:'assetNames',
			type: 'string'
		},{	
			name:'assetCnt',
			type: 'int'
		}

	]);

	var pkgSumStore = new Ext.data.JsonStore({
		url: 'pl/handleScans.pl',
		baseParams: {
			req: 'pkgScanSummary'
		},
		root: 'rows',
		messageProperty: 'message',
		storeId: 'pkgSumStore' + idAppend,
		fields: pkgSumFields,
		sortInfo: {
			field: 'cat',
			direction: 'ASC' // or 'ASC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records,options) {
				
				var assetScore = store.reader.jsonData.asset_score;
				
				var str = "<b>Submit by:&nbsp;</b>" + assetScore.lastSubmit + 
				"&nbsp;&nbsp;&nbsp;&nbsp;<b>Assets:&nbsp;</b>" + assetScore.assignedAssets + " of " + assetScore.totalAssets + 
				"&nbsp;&nbsp;&nbsp;&nbsp;<b>Scan files:&nbsp;</b>" + assetScore.distinctScans + 
				"&nbsp;&nbsp;&nbsp;&nbsp;<b>Cat I:&nbsp;</b>" + store.query('cat',1).getCount() + 
				"&nbsp;&nbsp;&nbsp;&nbsp;<b>Cat II:&nbsp;</b>" + store.query('cat',2).getCount() + 
				"&nbsp;&nbsp;&nbsp;&nbsp;<b>Cat III:&nbsp;</b>" + store.query('cat',3).getCount();
				
				Ext.getCmp('tb-pkgSumGrid-scoreboardText' + idAppend).setText(str);
				Ext.getCmp('pkgSumGrid-totalText' + idAppend).setText(records.length + ' records');
			}
		}
	});
	
	var pkgSumExpander = new Ext.ux.grid.RowExpander({
		tpl : new Ext.XTemplate(
			'<p><b>Severity: </b>{severity}&nbsp;&nbsp;',
			'<b>STIG severity: </b>{stigSeverity}</p>',
			'<p><b>Description:</b><blockquote style="max-width:500px;padding-left:20px"> {description}</blockquote></p>',
			'<p><b>Solution:</b><blockquote style="max-width:500px;padding-left:20px"> {solution}</blockquote></p>',
			'</tpl>'
		)
		,getRowClass : function(record, rowIndex, p, ds){
			var parentCssClass = Ext.ux.grid.RowExpander.prototype.getRowClass.call(this,record,rowIndex,p,ds);			
			var ourCssClass = '';
			switch (record.data.cat){
				case "1":
					ourCssClass =  ' cs-grid3-row-overdue';
					break;
				case "2":
					ourCssClass =  ' cs-grid3-row-warning';
					break;
				case "3":
					ourCssClass =  ' cs-grid3-row-new-overdue';
					break;
			}
			return parentCssClass + ourCssClass;
		 }
	});

	var pkgSumGrid = new Ext.grid.GridPanel({
		region: 'center',
		split:false,
        plugins: pkgSumExpander,
		height: "45%",
		border: false,
		//margins: "2 2 2 2",
		style: {
			borderTopStyle: 'solid'
			,borderTopWidth: '1px'
			,borderLeftStyle: 'solid'
			,borderLeftWidth: '1px'
			,borderRightStyle: 'solid'
			,borderRightWidth: '1px'
			,borderBottomStyle: 'solid'
			,borderBottomWidth: '1px'
		},
		id: 'pkgSumGrid' + idAppend,
		//title: 'Collection scan summary',
		store: pkgSumStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: true
			,listeners: {
				rowselect: function(sm,index,record) {
					pkgDetailGrid.store.load({
						params:{
							reqd: Ext.util.JSON.encode({
								pluginId: record.data.pluginId,
								collectionId: collectionId
							})
						}
					});
				}
				,selectionchange: function(sm) {
					if (sm.getSelections().length != 1) {
						pkgDetailStore.removeAll();
					}
				}
			}
		}),
		view: new Ext.grid.GridView({
			forceFit:false,
			emptyText: 'No items to display',
			// These listeners keep the grid in the same scroll position after the store is reloaded
			holdPosition: true, // HACK to be used with override
			deferEmptyText:false
		}),
		columns: [
			pkgSumExpander
			,
			{
				id:'col-pkgSumGrid-cat' + idAppend,
				header: "CAT",
				width: 40,
				dataIndex: 'cat',
				sortable: true,
				align: 'center'
			},{ 	
				id:'col-pkgSumGrid-pluginId' + idAppend,
				header: "Plugin",
				width: 80,
				dataIndex: 'pluginId',
				sortable: true,
				align: 'left'
			},{
				id:'col-pkgSumGrid-pluginName' + idAppend,
				header: "Name",
				width: 40,
				dataIndex: 'pluginName',
				sortable: true,
				align: 'left'
			},{
				id:'col-pkgSumGrid-occurrences' + idAppend,
				header: "#",
				width: 40,
				dataIndex: 'occurrences',
				sortable: true,
				align: 'center'
			}
		],
		autoExpandColumn:'col-pkgSumGrid-pluginName' + idAppend,
		loadMask: true,
		tbar: new Ext.Toolbar({
			height: 27,
			items: [
				{
					xtype: 'tbtext'
					,style: {paddingTop: '4px'}
					,id:'tb-pkgSumGrid-scoreboardText' + idAppend
					,text: ''
				} 
			]
		}),
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				width: 20,
				handler: function(btn){
					pkgSumStore.reload();
					//hostGrid.getStore().removeAll();
				}
			},{
				xtype: 'tbseparator'
			}
			,{
				xtype: 'exportbutton',
				hasMenu: true,
				gridBasename: 'Collection Scan Summary (grid)',
				storeBasename: 'Collection Scan Summary (store)',
				iconCls: 'sm-artifact-download-icon',
				text: 'Export'
			}
			,{
				xtype: 'tbseparator'
			},{
				xtype: 'tbbutton',
				iconCls: 'sm-zip-icon',
				text: 'Generate artifacts',
				tooltip: 'Generate and download collection scan artifacts',
				width: 20,
				handler: function(btn){
					createCollectionScan();
				}
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbfill'
			},{
				xtype: 'tbtext',
				id: 'pkgSumGrid-totalText' + idAppend,
				text: '0 records',
				width: 80
			}]
		})
	});
	
	//
	// createCollectionScan()
	//
	// Arguments:
	//		None
	//
	// Returns: undef
	//
	// Renders an inline frame element that receives the unbuffered
	// output of a middleware process that generates the 
	// collection scan archive file.
	//
	function createCollectionScan() {
		var iframe = document.createElement("iframe");
		iframe.setAttribute('id','progress' + idAppend)
		iframe.src = "pl/createPkgScan.pl?"
			+ "collectionId=" + collectionId
		;
		// Render the iframe
		document.body.appendChild(iframe);
		
		// initProgress() is defined in stigmanUtils.js
		// It creates a window with a progress bar, a text area, and two buttons
		// The iframe element is passed so closing the window will close the
		// iframe's request to the middleware 
		initProgress("Create collection scan","Initializing...",null,iframe);
		
	};

	/**************************************************
	 PACKAGE SCAN DETAIL
	 *************************************************/
	var pkgDetailFields = Ext.data.Record.create([	
		{	
			name:'assetId',
			type: 'int'
		},{	
			name:'assetName',
			type: 'string'
		},{	
			name:'ip',
			type: 'string',
			sortType: ip2num
		},{	
			name:'scanId',
			type: 'int'
		},{	
			name:'scanName',
			type: 'string'
		},{	
			name:'scanDate',
			type: 'date',
			dateFormat: 'Y-m-d H:i:s'
		},{	
			name:'port',
			type: 'string'
		},{	
			name:'pluginOutput',
			type: 'string'
		}
	]);
	
	var pkgDetailStore = new Ext.data.JsonStore({
		url: 'pl/handleScans.pl',
		baseParams: {
			req: 'pkgScanDetail'
		},
		root: 'rows',
		messageProperty: 'message',
		storeId: 'pkgDetailStore' + idAppend,
		fields: pkgDetailFields,
		sortInfo: {
			field: 'assetName',
			direction: 'ASC' // or 'ASC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records,options) {
			Ext.getCmp('pkgDetailGrid-totalText' + idAppend).setText(records.length + ' records');
			}
		}
	});

	var pkgDetailExpander = new Ext.ux.grid.RowExpander({
		tpl : new Ext.XTemplate(
			'<tpl if="pluginOutput===&quot;&quot;">',
			'<p><b>Plugin Output was not provided.</b></p>',
			'</tpl>',
			'<tpl if="pluginOutput!==&quot;&quot;">',
			'<p><b>Plugin Output:</b><blockquote style="width:600px;padding-left:20px"> {pluginOutput}</blockquote></p>',
			'</tpl>'
		)
	});

	var pkgDetailGrid = new Ext.grid.GridPanel({
		region: 'south',
		listeners: {
			rowcontextmenu: function( grid, rowIndex, e){
				e.stopEvent();
				var xy = e.getXY();
				var r = grid.store.getAt(rowIndex);
				grid.contextMenu.sm_contextRecord = r;
				grid.contextMenu.sm_contextTargetType = 'pkg';
				grid.contextMenu.showAt(xy);
			}
		},
		split:true,
		//margins: {top:0, right:20, bottom:0, left:0},
        plugins: pkgDetailExpander,
		contextMenu: browseContextMenu,
		height: '34%',
		border: false,
		//margins: "2 2 2 2",
		style: {
			borderTopStyle: 'solid'
			,borderTopWidth: '1px'
			,borderLeftStyle: 'solid'
			,borderLeftWidth: '1px'
			,borderRightStyle: 'solid'
			,borderRightWidth: '1px'
			,borderBottomStyle: 'solid'
			,borderBottomWidth: '1px'
		},
		id: 'pkgDetailGrid' + idAppend,
		title: 'Collection scan finding details',
		store: pkgDetailStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: true,
			listeners: {
				beforerowselect: {
					fn: function(sm,index,record) {
						return false;
					}
				}
			}
		}),
		view: new Ext.grid.GridView({
			forceFit:true,
			emptyText: 'No details to display',
			// These listeners keep the grid in the same scroll position after the store is reloaded
			holdPosition: true, // HACK to be used with override
			deferEmptyText:false,
			//getRowClass: function (record,index) {
			//}
		}),
		columns: [
			pkgDetailExpander,
			{ 	
				id:'col-pkgDetailGrid-scanId' + idAppend,
				header: "Scan",
				width: 25,
				dataIndex: 'scanId',
				sortable: true,
				align: 'left',
				renderer: function (value, metaData, record, rowIndex, colIndex, store) {
					metaData.attr = 'ext:qtip="' + record.data.scanName + '"';
					return value;
				}
			},
			{ 	
				id:'col-pkgDetailGrid-scanDate' + idAppend,
				header: "Scan Date",
				width: 60,
				dataIndex: 'scanDate',
				xtype: 'datecolumn',
				format:'Y-m-d H:i',
				sortable: true
			},
			{ 	
				id:'col-pkgDetailGrid-assetName' + idAppend,
				header: "Collection Asset",
				width: 100,
				dataIndex: 'assetName',
				sortable: true,
				align: 'left'
			},
			{ 	
				id:'col-pkgDetailGrid-ip' + idAppend,
				header: "Scanned IP",
				width: 50,
				dataIndex: 'ip',
				sortable: true,
				align: 'left'
			},
			{
				id:'col-pkgDetailGrid-port' + idAppend,
				header: "Port",
				width: 40,
				dataIndex: 'port',
				sortable: true,
				align: 'center'
			}

		],
		autoExpandColumn:'col-pkgDetailGrid-assetName' + idAppend,
		loadMask: true,
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				width: 20,
				handler: function(btn){
					pkgDetailStore.reload();
					//hostGrid.getStore().removeAll();
				}
			},{
				xtype: 'tbseparator'
			}
			,{
				xtype: 'exportbutton',
				hasMenu: true,
				gridBasename: 'Collection Scan Detail (grid)',
				storeBasename: 'Collection Scan Detail (store)',
				iconCls: 'sm-artifact-download-icon',
				text: 'Export'
			}
			,{
				xtype: 'tbfill'
			},{
				xtype: 'tbtext',
				id: 'pkgDetailGrid-totalText' + idAppend,
				text: '0 records',
				width: 80
			}]
		})
	});
	
	/**************************************************
	 THE TAB: Construct the tab, display it, and initialize the grids
	 *************************************************/
	var workspaceTitle = collectionName + ": Scan management";
	var workspaceTab = Ext.getCmp('main-tab-panel').add({
		id: 'buildScan' + idAppend,
		iconCls: 'sm-nessus-16-icon',
		title: workspaceTitle,
		closable:true,
		bodyStyle:"background-color: hsla(0, 0%, 90%, 1);",
		layout:'border',
		items: [
		{
			region: 'west'
			,split: false
			,title: "Source scan result summaries"
			,collapsible: true
			,frame: true
			,margins: '8 4 8 8'
			,minWidth: 720
			,width: 720
			,layout: 'border'
			,border: true
			,items: [
				scanSumGrid,scanDetailGrid
			]
			,bodyStyle:"background-color:transparent"
		}
		,{
			region: 'center'
			,split: false
			,width: 680
			,title: "Collection scan findings"
			,headerStyle: "height: 15px"
			,frame: true
			,margins: '8 8 8 4'
			,layout: 'border'
			,border: true
			,items: [pkgSumGrid,pkgDetailGrid]
			,bodyStyle:"background-color:transparent"
		}
		],
		listeners: {
		}			
	});
	workspaceTab.show();

	// Initalize the workspace with getting data for the scanSumGrid and the pkgSumGrid
	// via an API batch request
	workspaceTab.getEl().mask("Please wait...");
	
	var scanSummary_req = {
		req: 'scanSummary',
		reqd: {
			targetType: 'best',
			collectionId: collectionId
		}
	};
	
	var pkgScanSummary_req = {
		req: 'pkgScanSummary',
		reqd: {
			collectionId: collectionId
		}
	};
	
	Ext.Ajax.request({
		url: 'pl/handleScans.pl',
		params: { 
			req: 'batch',
			reqd: Ext.util.JSON.encode([scanSummary_req,pkgScanSummary_req])
		},				
		callback: function(options, success, response) {
			if (success){
				var resp =  Ext.util.JSON.decode(response.responseText);
				if (resp.success){
					// The batch request was successfull
					if (resp.batch[0].success){
						// The scanSummary request was successful
						scanSumGrid.store.loadData(resp.batch[0]);
						scanSumGrid.store.storeOptions({
							params: {
								req: scanSummary_req.req,
								reqd: Ext.util.JSON.encode(scanSummary_req.reqd)
							}
						});
						scanSumGrid.sm_browseType = scanSummary_req.reqd.targetType;
					} else {
						Ext.Msg.alert('Failure', resp.batch[0].errorStr);
						
					}
					if (resp.batch[1].success){
						// The pkgScanSummary request was successful
						pkgSumGrid.store.loadData(resp.batch[1]);
						pkgSumGrid.store.storeOptions({
							params: {
								req: pkgScanSummary_req.req,
								reqd: Ext.util.JSON.encode(pkgScanSummary_req.reqd)
							}
						});
					} else {
						Ext.Msg.alert('Failure', resp.batch[1].errorStr);
					}
				} else {
					Ext.Msg.alert('Failure', resp.errorStr);
				}
			} else {
				Ext.Msg.alert('Failure', o.result.message);
			}
			workspaceTab.getEl().unmask();
		}
	});


}; //end addScanManagement();
