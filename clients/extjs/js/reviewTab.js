// $Id: reviewTab.js 885 2018-02-20 16:26:08Z bmassey $

function getReviewItems() {
	return [{
		region: 'west',
		xtype: 'treepanel',
		id: 'reviews-nav-tree',
		contextMenu: new Ext.menu.Menu({
			items: [{
				id: 'open-package-review',
				text: 'Open Approval workspace',
				iconCls: 'sm-application-go-icon'  
			}
			,{
				id: 'open-poam-workspace',
				text: 'Open POAM/RAR workspace',
				iconCls: 'sm-application-go-icon'  
			}
			,{
				id: 'reviews-nav-tree-separator-1',
				xtype: 'menuseparator'
			}
			,{
				id: 'open-hbss-control',
				text: 'Disable HBSS SCAP imports...',
				iconCls: 'sm-list-remove-16-icon'  
			}
			,{
				id: 'reviews-nav-tree-separator-2',
				xtype: 'menuseparator'
			}
			,{
				id: 'unlock-all-package-reviews',
				text: 'Reset reviews...',
				iconCls: 'sm-unlock-icon'  
			}
			,{
				id: 'reviews-nav-tree-separator-3',
				xtype: 'menuseparator'
			}
			,{
				id: 'unlock-package-stig-reviews',
				text: 'Reset reviews...',
				iconCls: 'sm-unlock-icon'  
			},{
				id: 'reviews-nav-tree-separator-4',
				xtype: 'menuseparator'
			}
			,{
				id: 'unlock-package-asset-reviews',
				text: 'Reset reviews...',
				iconCls: 'sm-unlock-icon'  
			}
			
			],
			listeners: {
				itemclick: function(item) {
					var n = item.parentMenu.contextNode;
					switch (item.id) {
						case 'open-package-review':
							openPackageReview(n);
							break;
						case 'open-poam-workspace':
							openPoamWorkspace(n);
							break;
						case 'open-hbss-control':
							openHbssControl(n);
							break;
						case 'unlock-all-package-reviews':
							//====================================================
							//RESET ALL REVIEWS FOR PACKAGE AFTER PROMPTING USER.
							//====================================================
							var unlockObject = new Object;
							getUnlockInfo(n, unlockObject);
							getUnlockPrompt("PACKAGE", unlockObject, undefined);
							break;
						case 'unlock-package-stig-reviews':
							//====================================================
							//RESET ALL REVIEWS FOR THE STIG IN SPECIFIC PACKAGE.
							//====================================================
							var unlockObject = new Object;
							getUnlockInfo(n, unlockObject);
							getUnlockPrompt("STIG", unlockObject, undefined);
							break;
						case 'unlock-package-asset-reviews':
							//====================================================
							//UNLOCK ALL REVIEWS FOR ASSET IN SPECIFIC PACKAGE.
							//====================================================
							var unlockObject = new Object;
							getUnlockInfo(n, unlockObject);
							getUnlockPrompt("ASSET", unlockObject, undefined);
							break;
					}
				}
			}
		}),
		rootVisible: false,
		autoScroll: true,
		split: true,
		collapsible: true,
		title: 'STIG Manager Reviews',
		bodyStyle:'padding:5px;',
		width: 220,
		minSize: 160,
		root: {
			nodeType: 'async',
			id: 'reviews-root',
			text: '',
			expanded: true
		},
		loader: new Ext.tree.TreeLoader ({
			dataUrl: 'pl/reviewsNavTree.pl'
			// listeners: {
				// beforeload: function (l,n,c) {
					// Ext.getCmp('reviews-nav-tree').setTitle("<img src='img/loadingTree.gif' height=12 width=12> Loading your reviews...");
				// },
				// load : function(l,n,r) {
					// Ext.getCmp('reviews-nav-tree').setTitle('STIG Manager Reviews');
				// }
			// }
		}),
		rootVisible: false,
		loadMask: 'Loading...',
		
		listeners: {
			click: reviewsTreeClick,
			//dblclick: reviewsTreeClickNode,
			contextmenu: function(node, e) {
	//          Register the context node with the menu so that a Menu Item's handler function can access
	//          it via its parentMenu property.
				node.select();
				//===============================================
				//HIDE ALL BATCH RESET OPTIONS FROM THE ONSET
				//===============================================
				Ext.getCmp('open-package-review').hide();
				Ext.getCmp('open-poam-workspace').hide();
				Ext.getCmp('reviews-nav-tree-separator-1').hide();
				Ext.getCmp('open-hbss-control').hide();
				Ext.getCmp('reviews-nav-tree-separator-2').hide();
				Ext.getCmp('unlock-all-package-reviews').hide();
				Ext.getCmp('reviews-nav-tree-separator-3').hide();
				Ext.getCmp('unlock-package-stig-reviews').hide();
				Ext.getCmp('reviews-nav-tree-separator-4').hide();
				Ext.getCmp('unlock-package-asset-reviews').hide();
					
				if ((node.attributes.node == 'package' || node.attributes.report == 'stig' || node.attributes.report == 'asset') && (curUser.role == 'Staff'  || curUser.canAdmin)) {
					var c = node.getOwnerTree().contextMenu;
					c.contextNode = node;
					if (node.attributes.node == 'package') {
						Ext.getCmp('open-poam-workspace').show();   //Open Poam workspace
						Ext.getCmp('reviews-nav-tree-separator-1').show(); //Disable HBSS SCAP Imports
						Ext.getCmp('open-hbss-control').show();
						if (curUser.role == 'Staff'){
							//===============================================
							//Include package-level reset options
							//===============================================
							Ext.getCmp('reviews-nav-tree-separator-2').show();
							Ext.getCmp('unlock-all-package-reviews').show();
						}
						c.showAt(e.getXY());
					} else if (node.attributes.report == 'stig') {
						Ext.getCmp('open-package-review').show(); //Open Approval Workspace
						Ext.getCmp('open-poam-workspace').show();
						if (curUser.role == 'Staff'){
							//===============================================
							//Include STIG-level unlock options
							//===============================================
							Ext.getCmp('reviews-nav-tree-separator-3').show();
							Ext.getCmp('unlock-package-stig-reviews').show();
						}
						c.showAt(e.getXY());
					}else{
						if (curUser.role == 'Staff'){
							//===============================================
							//Include ASSET-level reset options
							//===============================================
							Ext.getCmp('unlock-package-asset-reviews').show();
							c.showAt(e.getXY());
						}
					}
				}
			},
			beforeexpandnode: function (n) {
				n.loaded=false; // always reload from the server
			}
		}
	},{
		region: 'center',
		xtype: 'tabpanel',
		id: 'reviews-center-tab',
		title: 'STIGManager',
		enableTabScroll:true,
		activeTab: 0,
		listeners: {
			beforetabchange: function (tabPanel,newTab,currentTab) {
			// For IE: Keep the panels in the same scroll position after tab changes
				if (Ext.isIE) {
					if (Ext.isDefined(currentTab)) {
						if (currentTab.sm_TabType == 'asset_review') {
							var vCur = currentTab.sm_GroupGridView;
							vCur.scrollTop = vCur.scroller.dom.scrollTop;
							vCur.scrollHeight = vCur.scroller.dom.scrollHeight;
						}
					}
					if (Ext.isDefined(newTab)) {
						if (newTab.sm_TabType == 'asset_review') {
							var vNew = newTab.sm_GroupGridView;
							if (Ext.isDefined(vNew.scroller)) { 
								setTimeout(function() { 
									vNew.scroller.dom.scrollTop = vNew.scrollTop + (vNew.scrollTop == 0 ? 0 : vNew.scroller.dom.scrollHeight - vNew.scrollHeight);
								}, 100);				
							}						
						}
					}
				}
			}
		},
		items: []
	}];
}

function addReviewHome() {
	var idAppend = '-user-' + curUser.id;
	
	var statusChangesFields = Ext.data.Record.create([
		{	
			name:'assetId',
			type: 'int'
		}
		,{	
			name:'assetName',
			type: 'string'
		}
		,{	
			name:'ruleId',
			type: 'string'
		}
		,{	
			name:'groupId',
			type: 'string',
			sortType: sortGroupId
		}
		,{
			name:'title',
			type: 'string'
		}
		,{
			name: 'stigId',
			type: 'string'
		}
		,{
			name: 'revId',
			type: 'string'
		}
		,{
			name: 'packageName',
			type: 'string'
		}
		,{
			name: 'packageId',
			type: 'int'
		}
	]);
	
	var statusChangesStore = new Ext.data.GroupingStore({
		//url: 'pl/getLastStatusChanges.pl',
		url: 'pl/getRejectedReviews.pl',
		// baseParams: {
			// rejectOnly: 1
		// },
		autoLoad: false,
		groupField: 'assetName',
		storeId: 'statusChangesStore' + idAppend,
		sortInfo: {
			field: 'stigId',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		reader:	new Ext.data.JsonReader({
			fields: statusChangesFields,
			root: 'rows',
			idProperty: 'checkId'
		}),
		listeners: {
			load: function () {
				filterStatusChangesStore();
			}
		}
	});

	if (curUser.role != 'Staff') {
		//var statusChangesGridTitle = 'Rejected reviews assigned to ' + curUser.name;
		var statusChangesGridTitle = 'Returned reviews associated with ' + curUser.name;
	} else {
		var statusChangesGridTitle = 'Status changes';
	}

	var statusChangesGrid = new Ext.grid.GridPanel({
		id: 'statusChangesGrid' + idAppend,
		title: statusChangesGridTitle,
		store: statusChangesStore,
		flex: 1,
		stripeRows:true,
		loadMask: true,
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: true
		}),
		view: new Ext.grid.GroupingView({
			enableGrouping: true,
			//forceFit: true,
			//autoFill: true,
			emptyText: 'No returned reviews.',
			hideGroupedColumn: true,
			deferEmptyText: false,
			groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "changes" : "change"]})'
		}),
		autoExpandColumn:'statusChangesGrid-title' + idAppend,
		columns: [
		{
			header: "",
			width: 35,
			dataIndex: 'none',
			align: 'center',
			renderer: function () {
				return '<img src="img/rejected-16.png" width=12 height=12 ext:qtip="Returned">';
			}
		}
		,{ 	
			id:'statusChangesGrid-packageName' + idAppend,
			header: "Package",
			width: 170,
			dataIndex: 'packageName',
			sortable: true,
			align: 'left'
		}
		,{ 
			id:'statusChangesGrid-assetName' + idAppend,
			header: "Asset",
			width: 120,
			dataIndex: 'assetName',
			sortable: true,
			align: 'left'
		}
		,{ 
			id:'statusChangesGrid-stigId' + idAppend,
			header: "STIG",
			width: 170,
			dataIndex: 'stigId',
			sortable: true,
			align: 'left'
		}
		,{ 
			id:'statusChangesGrid-groupId' + idAppend,
			header: "Group",
			width: 70,
			dataIndex: 'groupId',
			sortable: true,
			align: 'left'
		}
		,{ 
			id:'statusChangesGrid-ruleId' + idAppend,
			header: "Rule",
			width: 95,
			dataIndex: 'ruleId',
			sortable: true,
			align: 'left'
		}
		,{ 
			id:'statusChangesGrid-title' + idAppend,
			header: "Title",
			width: 100,
			dataIndex: 'title',
			sortable: true,
			align: 'left'
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
					statusChangesStore.load({
						callback: function (records,options,success) {
							if (success) {
								var recordCount = records.length;
								Ext.getCmp('reviewHome-html' + idAppend).load({
									url: 'pl/getReviewsHomeHtml.pl',
									params: {
										recordCount:recordCount
									}
								});
							}
						}
					});
				}
			}]
		}),
		tbar: new Ext.Toolbar({
			items: [
				// START Grouping control
				{
					xtype: 'buttongroup',
					title: 'Grouping',
					items: [
					{
						xtype: 'tbbutton',
						icon: 'img/security_firewall_on.png',
						tooltip: 'Group by STIG',
						toggleGroup: 'statusChangesGrid-groupBy',
						enableToggle:true,
						allowDepress: true,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('statusChangesGrid-expandButton').enable();
								Ext.getCmp('statusChangesGrid-collapseButton').enable();
								statusChangesGrid.getStore().groupBy('stigId');
							} else {
								Ext.getCmp('statusChangesGrid-expandButton').disable();
								Ext.getCmp('statusChangesGrid-collapseButton').disable();
								statusChangesGrid.getStore().clearGrouping();
							}
						}
					},{
						xtype: 'tbbutton',
						icon: 'img/mycomputer1-16.png',
						tooltip: 'Group by asset',
						toggleGroup: 'statusChangesGrid-groupBy',
						enableToggle:true,
						allowDepress: true,
						pressed: true,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('statusChangesGrid-expandButton').enable();
								Ext.getCmp('statusChangesGrid-collapseButton').enable();
								statusChangesGrid.getStore().groupBy('assetName');
							} else {
								Ext.getCmp('statusChangesGrid-expandButton').disable();
								Ext.getCmp('statusChangesGrid-collapseButton').disable();
								statusChangesGrid.getStore().clearGrouping();
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron.png',
						icon: 'img/minus-grey.png',
						id: 'statusChangesGrid-collapseButton',
						tooltip: 'Collapse all groups',
						width: 20,
						handler: function(btn){
							statusChangesGrid.getView().collapseAllGroups();
						}
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron_expand.png',
						icon: 'img/plus-grey.png',
						id: 'statusChangesGrid-expandButton',
						tooltip: 'Expand all groups',
						width: 20,
						handler: function(btn){
							statusChangesGrid.getView().expandAllGroups();
						}
					}]
				// END Grouping control
				},{
				// START Filter control
					xtype: 'buttongroup',
					title: 'Filtering',
					items: [
					{
						xtype: 'tbbutton',
						icon: 'img/security_firewall_on.png',
						tooltip: 'Filter by STIG id',
						toggleGroup: 'statusChangesGrid-filterBy',
						enableToggle:true,
						allowDepress: true,
						pressed: false,
						width: 20,
						handler: function(btn){
							var filterField = Ext.getCmp('statusChangesGrid-filterField');
							if (btn.pressed) {
								filterField.enable();
								statusChangesStore.filterField = 'stigId';
								if (filterField.getRawValue() == '') {
									filterField.emptyText = 'Enter a STIG filter...';
									filterField.setRawValue(filterField.emptyText);
								} else {
									filterField.emptyText = 'Enter a STIG filter...';
								}
								filterStatusChangesStore();
							} else {
								filterField.disable();
								//filterField.setValue('');
								filterStatusChangesStore();
							}
						}
					},{
						xtype: 'tbbutton',
						icon: 'img/mycomputer1-16.png',
						tooltip: 'Filter by asset name',
						toggleGroup: 'statusChangesGrid-filterBy',
						enableToggle:true,
						allowDepress: true,
						width: 20,
						handler: function(btn){
							var filterField = Ext.getCmp('statusChangesGrid-filterField');
							if (btn.pressed) {
								filterField.enable();
								statusChangesStore.filterField = 'assetName';
								if (filterField.getRawValue() == '') {
									filterField.emptyText = 'Enter an asset filter...';
									filterField.setRawValue(filterField.emptyText);
								} else {
									filterField.emptyText = 'Enter an asset filter...';
								}
								filterStatusChangesStore();
							} else {
								filterField.disable();
								//filterField.setValue('');
								filterStatusChangesStore();
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'trigger',
						fieldLabel: 'Filter',
						triggerClass: 'x-form-clear-trigger',
						onTriggerClick: function() {
							this.triggerBlur();
							this.blur();
							this.setValue('');
							filterStatusChangesStore();
						},
						id: 'statusChangesGrid-filterField',
						width: 140,
						submitValue: false,
						disabled: true,
						enableKeyEvents:true,
						emptyText:'Filter string...',
						listeners: {
							keyup: function (field,e) {
								filterStatusChangesStore();
								return false;
							}
						}
					}
					]
				}
			]
		}),
		listeners: {
			rowdblclick: {
				fn: function(grid,rowIndex,e) {
					var r = grid.getStore().getAt(rowIndex);
					var idAppend,tab;
					if (curUser.role == 'Staff') {
						idAppend = '-package_review-' + r.data.packageId + '-' + r.data.stigId.replace(".","_");
						tab = Ext.getCmp('packageReviewTab' +  idAppend);
						if (Ext.isDefined(tab)) {
							tab.show();
						} else {
							fakeLeaf = new Object();
							fakeLeaf.stigId = r.get('stigId');
							fakeLeaf.revId = r.get('revId');
							fakeLeaf.packageId = r.get('packageId');
							fakeLeaf.packageName = r.get('packageName');
							//fakeLeaf.stigName = r.get('stigId');
							addPackageReview(fakeLeaf,r.data.ruleId,r.data.assetId);
						}
					} else {
						idAppend = '-' + r.data.assetId + '-' + r.data.stigId.replace(".","_");
						tab = Ext.getCmp('reviewTab' +  idAppend);
						if (Ext.isDefined(tab)) {
							tab.show();
							var groupGrid = Ext.getCmp('groupGrid' +  idAppend);
							var resourcesTabs = Ext.getCmp('resources-tabs' +  idAppend);
							var index = groupGrid.getStore().find('ruleId',r.data.ruleId);
							groupGrid.getSelectionModel().selectRow(index);

							if (Ext.isIE) { // delay necessary for IE?!
								setTimeout(function() { 
									var rowEl = groupGrid.getView().getRow(index);
									//rowEl.scrollIntoView(groupGrid.getGridEl(), false);
									rowEl.scrollIntoView();
									}, 100);
							} else {
								var rowEl = groupGrid.getView().getRow(index);
								//rowEl.scrollIntoView(groupGrid.getGridEl(), false);
								rowEl.scrollIntoView();
							}

							//groupGrid.getView().focusRow(index);

							resourcesTabs.setActiveTab('feedback-tab' +  idAppend);
						} else {
							fakeLeaf = new Object();
							fakeLeaf.assetId = r.get('assetId');
							fakeLeaf.assetName = r.get('assetName');
							fakeLeaf.stigId = r.get('stigId');
							fakeLeaf.revId = r.get('revId');
							//fakeLeaf.stigName = r.get('stigId');
							//Ext.getCmp('main-tabs').setActiveTab('tab-reviews');
							addReview(fakeLeaf,r.get('ruleId'),'feedback-tab' +  idAppend);
						}
					}
				}
			}
		}
	});

	function filterStatusChangesStore () {
		var value = Ext.getCmp('statusChangesGrid-filterField').getValue();
		var filterFunction = null;
		// if (Ext.getCmp('statusChangesGrid-ready-filterButton').pressed) {
			// filterFunction = filterReady;
		// }
		// if (Ext.getCmp('statusChangesGrid-reject-filterButton').pressed) {
			// filterFunction = filterReject;
		// }
		// if (Ext.getCmp('statusChangesGrid-approve-filterButton').pressed) {
			// filterFunction = filterApprove;
		// }
		
		if (value == '' || Ext.getCmp('statusChangesGrid-filterField').disabled) {
			if (filterFunction != null) {
				statusChangesStore.filterBy(filterFunction);
			}else {
				statusChangesStore.clearFilter();
			}
		} else {
			if (filterFunction != null) {
				statusChangesStore.filter([
					{
						property:statusChangesStore.filterField,
						value:value,
						anyMatch:true,
						caseSensitive:false
					},{
						fn: filterFunction
					}
				]);
			} else {
				statusChangesStore.filter({property:statusChangesStore.filterField,value:value,anyMatch:true,caseSensitive:false});
			}
		}
	};
	
	function filterReady (record,sm) {
		return (record.get('newStatus') == 1);
	};
	function filterReject (record,sm) {
		return (record.get('newStatus') == 2);
	};
	function filterApprove (record,sm) {
		return (record.get('newStatus') == 3);
	};

	var thisTab = Ext.getCmp('reviews-center-tab').add({
		id: 'reviewHome' + idAppend,
		sm_TabType: 'review_home',
		iconCls: 'sm-stig-icon',
		closable:false,
		title: 'Home',
		padding: 20,
		bodyCssClass: 'sm-reviews-home-background',
		autoScroll:true,
		layout:'vbox',
		layoutConfig: {
			align : 'stretch',
			pack  : 'start'
		},
		items: [
		{
			id: 'reviewHome-html' + idAppend,
			border: false,
			height:180,
			bodyCssClass: 'sm-reviews-home-background'
		}
		,	statusChangesGrid
		]
	});

	thisTab.show();
	statusChangesStore.load({
		callback: function (records,options,success) {
			if (success) {
				var recordCount = records.length;
				Ext.getCmp('reviewHome-html' + idAppend).load({
					url: 'pl/getReviewsHomeHtml.pl',
					params: {
						recordCount:recordCount
					}
				});
			}
		}
	});
	

}; //end addReviewHome();

function reviewsTreeClick(n) {
	var idAppend;
	var tab;
	
	if (n.attributes.report == 'review') {
		idAppend = '-' + n.attributes.assetId + '-' + n.attributes.stigId.replace(".","_");
		tab = Ext.getCmp('reviews-center-tab').getItem('reviewTab' + idAppend);
		if (tab) {
			tab.show();
		} else {
			addReview(n.attributes);
		}
	}
	if (n.attributes.action == 'import') {
		uploadArchive(n);
	}

	if (n.attributes.action == 'nessus') {
		idAppend = "-scan-mgmt-" + n.attributes.packageId;
		tab = Ext.getCmp('reviews-center-tab').getItem('buildScan' + idAppend);
		if (tab) {
			tab.show();
		} else {
			addScanManagement(n);
		}
	}
	
	// else if (n.attributes.report == 'stig' && (curUser.role == 'Staff' || curUser.canAdmin)) {
		// var idAppend = '-' + n.attributes.packageId + '-' + n.attributes.stigId.replace(".","_");
		// var tab = Ext.getCmp('reviews-center-tab').getItem('packageReviewTab' + idAppend);
		// if (tab) {
			// tab.show();
		// } else {
			// addPackageReview(n.attributes);
		// }
	// }
}

function openPackageReview(n) {
	if (n.attributes.report == 'stig' && (curUser.role == 'Staff' || curUser.canAdmin)) {
		var idAppend = '-' + n.attributes.packageId + '-' + n.attributes.stigId.replace(".","_");
		var tab = Ext.getCmp('reviews-center-tab').getItem('packageReviewTab' + idAppend);
		if (tab) {
			tab.show();
		} else {
			addPackageReview(n.attributes);
		}
	}
}

function openPoamWorkspace(n) {
	var conf = {};
	if (n.attributes.node == 'package') {
		conf.context = 'package';
		conf.idAppend = '-' + n.attributes.packageId;
	} else if (n.attributes.report == 'stig') {
		conf.context = 'stig';
		conf.idAppend = '-' + n.attributes.packageId + '-' + n.attributes.stigId.replace(".","_");
	}
	var tab = Ext.getCmp('reviews-center-tab').getItem('poamWorkspaceTab' + conf.idAppend);
	if (tab) {
		tab.show();
	} else {
		conf.attributes = n.attributes;
		addPoamWorkspace(conf);
	}
}

function openHbssControl(n) {
	var saView = new Sm_StigAssetView({
		idAppend: '-hbssControl',
		storeUrl: 'pl/getStigAssetForHbss.pl',
		gridTitle: 'Assignments with SCAP checks',
		gridAnchor: '100% -20',
		gridCls: 'hbss-control'
	});
	
	var hbssControlFormPanel = new Ext.form.FormPanel({
		baseCls: 'x-plain',
		//layout: 'fit',
		labelWidth: 65,
		url:'pl/updateHbssControl.pl',
		items: [saView.grid],
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
				hbssControlFormPanel.getForm().submit({
					params : {
						packageId: n.attributes.packageId,
						saIds: encodeSm(saView.sm,'saId'),
						req: 'update'
					},
					success: function (f,a) {
						if (a.result.success == 'true') {
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

	var window = new Ext.Window({
		id: 'hbssControlWindow',
		title: 'Disable HBSS SCAP imports',
		modal: true,
		hidden: true,
		width: 560,
		height:560,
		layout: 'fit',
		plain:true,
		bodyStyle:'padding:5px;',
		buttonAlign:'right',
		items: hbssControlFormPanel
	});
	
	window.render(document.body);
	Ext.getBody().mask('Getting STIG/asset assignments for this package');
	saView.store.load({
		params: {
			packageId: n.attributes.packageId
		},
		callback: function (r,o,s) {
			hbssControlFormPanel.getForm().load({
				url: 'pl/getHbssControl.pl',
				params: {
					packageId: n.attributes.packageId
				},
				success: function(f, action) {
					saView.filterFn();
					Ext.getBody().unmask();
					window.show(document.body);
				}
			});
		}
	});

}


