//======================================================================================
//NAME: 		showUserProperties.js
//CREATED: 		October 20, 2016 @ 10:33 
//UPDATED: 		January 10, 2017 @ 14:40 
//AUTHOR(S):	BRANDON MASSEY
//PURPOSE: 		Displays and manages user information and their Asset-STIG assignments 
//=======================================================================================
async function showUserProperties(id, grid){
	//==========================================================
	//The structure for records in the record store for 
	//assignments. We use it to create new records as well as 
	//defining the fields in the JSON Store.
	//==========================================================
	var assignmentFieldArray = [
		{name: 'benchmarkId', type: 'string'},
		{name: 'assetId', type: 'integer'},
		{name: 'assetName', type: 'string'},
		{name: 'assetDept', type: 'string'}
	];
	var assignmentStore = new Ext.data.JsonStore({
		//===========================================================
		//ASSIGNMENTS DATA STORE
		//===========================================================
		fields: assignmentFieldArray,
		root: '',
		idProperty: v => `${v.benchmarkId}-${v.assetId}`,
		sortInfo: {
			field: 'benchmarkId',
			direction: 'ASC'
		},
		listeners: {
			add: function(){
				assignmentGrid.setTitle('Asset-STIG Assignments (' + assignmentStore.getCount() + ')');
			}, 
			remove: function(){
				assignmentGrid.setTitle('Asset-STIG Assignments (' + assignmentStore.getCount() + ')');
				//==========================================================
				//DISABLE THE REMOVAL BUTTON AFTER EACH REMOVAL OF ASSIGMENTS
				//==========================================================
				Ext.getCmp('userPropsRemoveAssignmentButton').disable();
			}
			
		}
	});
	
	//===========================================================
	//ASSIGNMENT GRID ROW SELECTION MODEL
	//===========================================================
	var selectionModel = new Ext.grid.RowSelectionModel({
		singleSelect: false,
		listeners: {
			rowselect: function(theSelModel, theRowIndex, therecord){
				//assignmentGrid.getView().getRowClass(theRowIndex, true);
				Ext.getCmp('userPropsRemoveAssignmentButton').enable();
			},
			rowdeselect: function(theSelModel, theRowIndex, therecord){
				//assignmentGrid.getView().getRowClass(theRowIndex, false);
				if (Ext.getCmp('assignmentGrid').getSelectionModel().getCount()<1){
					//==============================================
					//WHEN THERE ARE NO MORE SELECTIONS, DISABLE THE 
					//"REMOVE ASSIGNMENTS" BUTTON
					//==============================================
					Ext.getCmp('userPropsRemoveAssignmentButton').disable();
				}
			}
		}
		
	});		

	//===========================================================
	//ASSIGNMENTS GRID PANEL
	//===========================================================
	var assignmentGrid= new Ext.grid.GridPanel({
		id:'assignmentGrid',
		name: 'stigReviews',
		isFormField: true,
		setValue: function(stigAssets) {
			let assignmentData = stigAssets.map(stigAsset => ({
				benchmarkId: stigAsset.benchmarkId,
				assetId: stigAsset.asset.assetId,
				assetName: stigAsset.asset.name,
				assetDept: stigAsset.asset.dept.name
			}))
			assignmentStore.loadData(assignmentData);
		},
		getValue: function() {
			let stigReviews = [];
			assignmentStore.each(function(record){
				stigReviews.push({
					benchmarkId: record.data.benchmarkId,
					assetId: record.data.assetId
				})
			})
			return stigReviews
		},
		markInvalid: function() {},
		clearInvalid: function() {},
		isValid: function() { return true},
		disabled: false,
		getName: function() {return this.name},
		validate: function() { return true},
		title: 'Asset-STIG Assignments',
		flex: 3.8,
		store: assignmentStore,
		stripeRows: true,
		sm: selectionModel,
		viewConfig: {
			forceFit:true,
			getRowClass: function(record, rowIndex, rp, ds) {
				if (curUser.accessLevel === 2 && !curUser.canAdmin) {
					if (record.data.assetDeptId !== curUser.deptId) {
						return 'x-stigman-cross-department'
					}
				}
			}
		},
		columns:[
			{
				id:'stigColumn',
				header: `<img src="img/security_firewall_on.png" style="vertical-align: bottom;"> STIG`, 
				dataIndex: 'benchmarkId',
				sortable: true,
				width: 350
			},
			{
				id:'assetColumn',
				header: `<img src="img/mycomputer1-16.png" style="vertical-align: bottom;"> Asset`, 
				dataIndex: 'assetName',
				sortable: true,
				width: 250
			},{
				id:'assetColumn',
				header: 'Dept', 
				dataIndex: 'assetDept',
				sortable: true,
				width: 200
			}
		]
		
	});

	let deptStore = new Ext.data.JsonStore({
		listeners: {
			load: function () {
				let one = 1
			}
		},
		fields: [{
			name: 'deptId',
			type: 'integer'
		},{
			name: 'name',
			type: 'string'
		}],
		url: `${STIGMAN.Env.apiBase}/departments?elevate=${curUser.canAdmin}`,
		root: '',
		sortInfo: {
			field: 'name',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		idProperty: 'deptId'
	})
	
	let userPropsFormPanel = new Ext.form.FormPanel({
		baseCls: 'x-plain',
		labelWidth: 70,
		monitorValid: true,
		items: [
		{ // start fieldset config
			xtype:'fieldset',
			title: 'User Information',
			autoHeight:true,
			items: [ // start fieldset items
			{ // start column layout config
				layout: 'column',
				baseCls: 'x-plain',
				items: [ // start column items
				{ // start column #1 config
					//columnWidth: .65,
					width: 340,
					layout: 'form',
					baseCls: 'x-plain',
					items: [ // start column #1 items
					{
						xtype: 'textfield',
						fieldLabel: 'Account',
						width: 250,
						disabled: !(curUser.canAdmin),
						emptyText: 'Enter account name...',
						allowBlank: false,
						name: 'username'
					},{
						xtype: 'textfield',
						fieldLabel: 'Display',
						width: 250,
						emptyText: 'Enter display name...',
						allowBlank: false,
						name: 'display'
					},{
						xtype: 'checkbox',
						name: 'canAdmin',
						disabled: !(curUser.canAdmin),
						boxLabel: 'Administrator'
					}
					] // end column #1 items
				}, //end column #1 config
				{ // start column #2 config
					//columnWidth: .35,
					width: 185,
					layout: 'form',
					baseCls: 'x-plain',
					items: [ // start column #2 items
					{
						xtype: 'combo',
						fieldLabel: 'Department',
						width: 100,
						disabled: !(curUser.canAdmin),
						emptyText: 'Department...',
						allowBlank: false,
						editable: false,
						forceSelection: true,
						name: 'deptId',
						mode: 'local',
						triggerAction: 'all',
						displayField:'name',
						valueField: 'deptId',
						store: deptStore
					},
					{
						xtype: 'combo',
						id: 'userPropsLevelCombo',
						disabled: !(curUser.canAdmin),
						fieldLabel: 'Level',
						width: 100,
						emptyText: 'Level...',
						allowBlank: false,
						editable: false,
						forceSelection: true,
						name: 'accessLevel',
						hiddenName: 'accessLevel',
						mode: 'local',
						triggerAction: 'all',
						displayField:'accessLevel',
						valueField:'accessLevel',
						store: new Ext.data.ArrayStore({
							fields: ['accessLevel'],
							data : [[1],[2],[3]]
						}),
						listeners: {
							select: function ( combo, record, index ) {
								toggleAssignmentAccess(record.data.accessLevel);
							}
							
						}
					}
					]// end column #2 items
				}, // end column #2 config
				{	//=========================START COLUMN 3===========================
					xtype: 'container',
					autoEl: {
						tag: 'div'//,
						//style:  'border: 5px solid blue;'
					},
					items: [{
						xtype: 'box',

						autoHeight:true,
						autoEl:{
							tag: 'img',
							src: 'img/user-group-large.png',
							style: 'width:70px;height:auto; padding-left: 55px;'
						}
					}]
						
					//}] // end column #3 items
				}	//==========================END COLUMN 3============================
				]// end asset column items
			} // end asset column config
			
			] // end fieldset items
		},{// end fieldset config
			//=========================================================================
			//STIG-ASSET ASSIGNMENT SECTION
			//=========================================================================
			xtype: 'panel',
			id: 'userProps_assignment_box',
			bodyStyle: 'background:transparent;border:none',
			layout: 'hbox',
			anchor: '100% -130',
			layoutConfig: {
				align: 'stretch'
			},
			items: [
				{
					//=================================================================
					//                   STIG-ASSET ASSIGNMENT TREE
					//=================================================================
					xtype: 'treepanel',
					id: 'user-assignments-nav-tree',
					height: 400,
					flex: 2.3,
					contextMenu: new Ext.menu.Menu({
						id: 'assignContextMenu',
						items: [{
								id: 'assign-package',
								text: 'Assign all Assets in this Package',
								iconCls: 'sm-assign-icon', 
								iconAlign: 'left'									
							},{
								id: 'assign-assets-asset',
								text: 'Assign all STIGS of this Asset',
								iconCls: 'sm-assign-icon' 
							},{
								id: 'assign-stigs-stig',
								text: 'Assign this STIG for all Associated Assets',
								iconCls: 'sm-assign-icon' 
							},{
								id: 'assign-asset-stig',
								text: 'Assign this STIG-ASSET Combination',
								iconCls: 'sm-assign-icon' 
							}
						],
						listeners: {
							itemclick: function(item){
								//=============================================
								//MAKE ASSIGNMENTS BASED ON THE SELECTED NODE
								//=============================================
								makeAssignments(item.parentMenu.contextNode);
							}
						}
					}),
					rootVisible: false,
					autoScroll: true,
					title: 'Assets/STIGs',
					bodyStyle:'padding:5px;',
					root: {
						nodeType: 'async',
						id: 'assignment-root',
						text: ''
					},
					loader: new Ext.tree.TreeLoader ({
						directFn: loadTree
					}),
					listeners: {
						contextmenu: function(node, e) {
							node.select();
							//====================================================
							//When the context menu for a node is triggered, we
							//add an attribute to the context menu to indicate
							//what node is associated to the context menu
							//====================================================
							var nodeContextMenu = node.getOwnerTree().contextMenu;
							nodeContextMenu.contextNode = node;
							//====================================================
							//NEXT, WE DETERMINE WHICH CONTEXT MENU ITEMS TO SHOW
							//====================================================
							switch (node.attributes.node){
								case 'package':
									Ext.getCmp('addButton').enable();
									Ext.getCmp('assign-package').show();
									Ext.getCmp('assign-assets-asset').hide();
									Ext.getCmp('assign-stigs-stig').hide();
									Ext.getCmp('assign-asset-stig').hide();
									break;
								case 'stigs-stig':
									Ext.getCmp('addButton').enable();
									Ext.getCmp('assign-package').hide();
									Ext.getCmp('assign-assets-asset').hide();
									Ext.getCmp('assign-stigs-stig').show();
									Ext.getCmp('assign-asset-stig').hide();
									break;
								case 'assets-asset':
									Ext.getCmp('addButton').enable();
									Ext.getCmp('assign-package').hide();
									Ext.getCmp('assign-assets-asset').show();
									Ext.getCmp('assign-stigs-stig').hide();
									Ext.getCmp('assign-asset-stig').hide();
									break;
								case 'asset-stig':
								case 'stig-asset':
									Ext.getCmp('addButton').enable();
									Ext.getCmp('assign-package').hide();
									Ext.getCmp('assign-assets-asset').hide();
									Ext.getCmp('assign-stigs-stig').hide();
									Ext.getCmp('assign-asset-stig').show();
									break;
								default:
									Ext.getCmp('addButton').disable();
									Ext.getCmp('assign-package').hide();
									Ext.getCmp('assign-assets-asset').hide();
									Ext.getCmp('assign-stigs-stig').hide();
									Ext.getCmp('assign-asset-stig').hide();
									break;
							}
							node.getOwnerTree().contextMenu.showAt(e.getXY());
						},
						click: function(node, e) {
								switch (node.attributes.node){
									case 'package':
									case 'stigs-stig':
									case 'assets-asset':
									case 'asset-stig':
									case 'stig-asset':
										Ext.getCmp('addButton').enable();
										break;
									default:
										Ext.getCmp('addButton').disable();
										break;
								}
							}
					}
				},
				{
					//==========================================================
					//ASSIGN/UNASSIGN BUTTONS
					//==========================================================
					xtype: 'panel',
					bodyStyle: 'background-color:transparent;border:none',
					layout: {
						type: 'vbox',
						pack: 'center'//,
						//padding: "10 10 10 10"
						},
					items: [
						{
							//================================================
							//ADDS THE ASSIGNMENT(S)
							//================================================
							xtype: 'button',
							id: 'addButton',
							disabled: true,
							text: 'Add Assignment ',
							height: 30,
							width: 150,
							margins: "10 10 10 10",
							icon: 'img/right-arrow-16.png',
							iconAlign: 'right',
							cls: 'x-btn-text-icon',
							listeners:{
								click: function(){
									//================================================
									//DETERMINE THE SELECTED NODE AND MAKE Assignments
									//================================================
									var selectedNode = Ext.getCmp('user-assignments-nav-tree').getSelectionModel().getSelectedNode();
									makeAssignments(selectedNode);
								}
							}
						},
						{
							//================================================
							//REMOVES THE ASSIGNMENT(S)
							//================================================
							xtype: 'button',
							id: 'userPropsRemoveAssignmentButton',
							text: ' Remove Assignment',
							disabled: true,
							height: 30,
							width: 150,
							margins: "10 10 10 10",
							icon: 'img/left-arrow-16.png',
							iconAlign: 'left',
							cls: 'x-btn-text-icon',
							listeners:{
							click: function(){
									var assigmentsToPurge = Ext.getCmp('assignmentGrid').getSelectionModel().getSelections();
									Ext.getCmp('assignmentGrid').getStore().remove(assigmentsToPurge);
								}
							}
						}
					]
				},
				//==========================================================
				//					   ASSIGNMENT GRID
				//==========================================================
				assignmentGrid
			]
		//=========================================================================
		//END OF STIG-ASSET ASSIGNMENT SECTION
		//=========================================================================	
		}],
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
					let values = userPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
					let url, method
					if (id) {
						url = `${STIGMAN.Env.apiBase}/users/${id}?elevate=${curUser.canAdmin}`
						method = 'PUT'
					}
					else {
						url = `${STIGMAN.Env.apiBase}/users?elevate=${curUser.canAdmin}`
						method = 'POST'
					}
					let result = await Ext.Ajax.requestPromise({
						url: url,
						method: method,
						headers: { 'Content-Type': 'application/json;charset=utf-8' },
						jsonData: values
					})
					userAsset = JSON.parse(result.response.responseText)

					//TODO: This is expensive, should update the specific record instead of reloading entire set
					grid.getView().holdPosition = true
					grid.getStore().reload()
					appwindow.close()
				}
				catch (e) {
					alert(e.response.responseText)
					// appwindow.close()
				}
			}
	   }]
	})
	
	async function loadTree (node, cb) {
		try {
		let match
		// Root node
		if (node === 'assignment-root') {
			let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/packages`,
			method: 'GET'
			})
			let r = JSON.parse(result.response.responseText)
			let content = r.map( package => ({
				id: `${package.packageId}-assignment-package-node`,
				node: 'package',
				text: package.name,
				packageId: package.packageId,
				packageName: package.name,
				iconCls: 'sm-package-icon',
				reqRar: package.reqRar,
				children: [{
					id: `${package.packageId}-assignment-assets-node`,
					node: 'assets',
					text: 'Assets',
					iconCls: 'sm-asset-icon'
				},{
					id: `${package.packageId}-assignment-stigs-node`,
					node: 'stigs',
					text: 'STIGs',
					iconCls: 'sm-stig-icon'
				}]
			})
			)
			cb(content, {status: true})
			return
		}
		// Package-Assets node
		match = node.match(/(\d+)-assignment-assets-node/)
		if (match) {
			let packageId = match[1]
			let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
			method: 'GET',
			params: {
				projection: 'assets'
			}
			})
			let r = JSON.parse(result.response.responseText)
			let content = r.assets.map( asset => ({
				id: `${packageId}-${asset.assetId}-assignment-assets-asset-node`,
				text: asset.name,
				node: 'assets-asset',
				packageId: packageId,
				assetId: asset.assetId,
				iconCls: 'sm-asset-icon',
				qtip: asset.name
			})
			)
			cb(content, {status: true})
			return
		}
		// Package-Assets-STIG node
		match = node.match(/(\d+)-(\d+)-assignment-assets-asset-node/)
		if (match) {
			let packageId = match[1]
			let assetId = match[2]
			let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
			method: 'GET',
			params: {
				projection: 'stigs'
			}
			})
			let apiAsset = JSON.parse(result.response.responseText)
			let content = apiAsset.stigs.map( stig => ({
				id: `${packageId}-${assetId}-${stig.benchmarkId}-assignment-leaf`,
				text: stig.benchmarkId,
				leaf: true,
				node: 'asset-stig',
				iconCls: 'sm-stig-icon',
				stigName: stig.benchmarkId,
				assetName: apiAsset.name,
				assetDept: apiAsset.dept.name,
				stigRevStr: stig.lastRevisionStr,
				assetId: apiAsset.assetId,
				benchmarkId: stig.benchmarkId,
				qtip: stig.title
			})
			)
			cb(content, {status: true})
			return
		}
		
			// Package-STIGs node
		match = node.match(/(\d+)-assignment-stigs-node/)
		if (match) {
			let packageId = match[1]
			let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
			method: 'GET',
			params: {
				projection: 'stigs'
			}
			})
			let r = JSON.parse(result.response.responseText)
			let content = r.stigs.map( stig => ({
				packageId: packageId,
				text: stig.benchmarkId,
				node: 'stigs-stig',
				packageName: r.name,
				report: 'stig',
				iconCls: 'sm-stig-icon',
				reqRar: r.reqRar,
				stigRevStr: stig.lastRevisionStr,
				id: `${packageId}-${stig.benchmarkId}-assignment-stigs-stig-node`,
				benchmarkId: stig.benchmarkId,
				qtip: stig.title
			})
			)
			cb(content, {status: true})
			return
			}
			// Package-STIGs-Asset node
		match = node.match(/(\d+)-(.*)-assignment-stigs-stig-node/)
		if (match) {
			// TODO: Call API /stigs endpoint when it is implemented
			let packageId = match[1]
			let benchmarkId = match[2]
			let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/assets`,
			method: 'GET',
			params: {
				packageId: packageId,
				benchmarkId: benchmarkId,
				projection: 'stigs'
			}
			})
			let apiAssets = JSON.parse(result.response.responseText)
			let content = apiAssets.map( asset => ({
				id: `${packageId}-${benchmarkId}-${asset.assetId}-assignment-leaf`,
				text: asset.name,
				leaf: true,
				node: 'stig-asset',
				iconCls: 'sm-asset-icon',
				stigName: benchmarkId,
				assetName: asset.name,
				stigRevStr: asset.stigs[0].lastRevisionStr, // BUG: relies on exclusion of other assigned stigs from /assets
				assetId: asset.assetId,
				benchmarkId: benchmarkId,
				assetDept: asset.dept.name,
				qtip: asset.name
			})
			)
			cb(content, {status: true})
			return
			}
		
	
		}
		catch (e) {
		Ext.Msg.alert('Status', 'AJAX request failed in loadTree()');
		}
	}

	async function assignPackage(theNode){
		//=======================================================================
		//Assigns the whole package to a user
		//=======================================================================
		try {
			let result = await Ext.Ajax.requestPromise({
				url: `${STIGMAN.Env.apiBase}/assets/`,
				method: 'GET',
				params: { 
					elevate: `${curUser.canAdmin}`,
					packageId: theNode.attributes.packageId,
					projection: 'stigs'
				}
			})
			let assets = Ext.util.JSON.decode(result.response.responseText)
			let assignments = []
			assets.forEach(asset => {
				asset.stigs.forEach(stig => {
					assignments.push({
						benchmarkId: stig.benchmarkId,
						assetName: asset.name,
						assetDept: asset.dept.name,
						assetId: asset.assetId
					})
				})
			})
			assignmentStore.loadData(assignments, true)	
		}
		catch(e) {
			alert(e.message)
		}
	}
	
	async function assignAsset(theNode){
		//=======================================================
		// Assigns all of the STIGS of a specific Asset (in a)
		// specific package to a user.
		//=======================================================
		try {
			let assetIdMatches = theNode.id.match(/\d+-(\d+)-assignment-assets-asset-node/);
			let assetId = assetIdMatches[1];
			let result = await Ext.Ajax.requestPromise({
				url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
				method: 'GET',
				params: { 
					elevate: `${curUser.canAdmin}`,
					projection: 'stigs'
				}
			})
			let asset = Ext.util.JSON.decode(result.response.responseText)
			let assignments = asset.stigs.map(stig => ({
				benchmarkId: stig.benchmarkId,
				assetName: asset.name,
				assetDept: asset.dept.name,
				assetId: assetId
			}))
			assignmentStore.loadData(assignments, true);	
		}
		catch(e) {
			alert(e.message)
		}
	}	
	
	async function assignStig(theNode){
		//=======================================================
		// Assigns all of the ASSETS associated to this STIG IN a
		// specific package to a user.
		//=======================================================
		try {
			let result = await Ext.Ajax.requestPromise({
				url: `${STIGMAN.Env.apiBase}/assets/`,
				method: 'GET',
				params: { 
					elevate: `${curUser.canAdmin}`,
					packageId: theNode.attributes.packageId,
					benchmarkId: theNode.attributes.benchmarkId,
					projection: 'stigs'
				}
			})
			let assets = Ext.util.JSON.decode(result.response.responseText)
			let assignments = []
			assets.forEach(asset => {
				asset.stigs.forEach(stig => {
					assignments.push({
						benchmarkId: stig.benchmarkId,
						assetName: asset.name,
						assetDept: asset.dept.name,
						assetId: asset.assetId
					})
				})
			})
			assignmentStore.loadData(assignments, true)	
		}
		catch(e) {
			alert(e.message)
		}
	}

	function toggleAssignmentAccess(accessLevel){
		if (accessLevel == 1) {
			Ext.getCmp('userProps_assignment_box').enable();
		} else {
			Ext.getCmp('userProps_assignment_box').disable();
		}
	}
	
	function makeAssignments(selectedNode){
	//==========================================================
	//This function takes the selected Node and makes STIG-ASSET
	//assignments accordingly.  All information is pulled from
	//the tree.  So first a check is needed to determine if we 
	//must first expand the tree further so that we may get the 
	//assignment information needed.
	//=========================================================

		//=========================================================
		//DETERMINE IF WE'LL DO A BULK ASSIGNMENT OR JUST ONE.
		//MAY NEED TO EXPAND TREE FOR BULK OPERATIONS.
		//=========================================================
		switch (selectedNode.attributes.node){
			case 'package':
				//=================================================
				//A Package was selected
				//=================================================
				assignPackage(selectedNode);
				break;
			case 'stigs-stig':
				//=================================================
				//A STIG in the list of Package STIGS was selected
				//=================================================
				assignStig(selectedNode);
				break;
			case 'assets-asset':
				assignAsset(selectedNode);
				//=================================================
				//An asset in the list of Package Assets was selected
				//=================================================
				break;
			case 'asset-stig':
			case 'stig-asset':
				//=================================================
				//A STIG under the ASSETS node was selected or 
				//an ASSET under the STIG node was selected
				//=================================================
				var newAssignmentRecord = {
					benchmarkId:selectedNode.attributes.benchmarkId, 
					assetId:selectedNode.attributes.assetId, 
					assetName: selectedNode.attributes.assetName,
					assetDept: selectedNode.attributes.assetDept,
				}
				assignmentStore.loadData(newAssignmentRecord, true);
				break;
		}	
	}
	//===================================================
	//CREATES THE DIALOG WINDOW THAT CONTAINS ALL OF THE 
	//USER PROPERTY COMPONENTS
	//===================================================
	let appwindow = new Ext.Window({
		id: 'userPropsWindow',
		title: 'User Properties (ID: ' + id + ')',
		modal: true,
		hidden: true,
		width: 785,
		height:560,
		layout: 'fit',
		plain:true,
		bodyStyle:'padding:5px;',
		buttonAlign:'right',
		items: userPropsFormPanel
	});		

	// Get departments for the combo box
	let resultDept = await Ext.Ajax.requestPromise({
		url: `${STIGMAN.Env.apiBase}/departments`,
		params: {
			elevate: curUser.canAdmin
		},
		method: 'GET'
	})
	deptStore.loadData(JSON.parse(resultDept.response.responseText))

	appwindow.render(document.body);
	//===================================================
	//LOAD THE FORM WITH THE USER PROPERTIES
	//===================================================

	if (id) {
		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/users/${id}`,
			params: {
				elevate: curUser.canAdmin,
				projection: ['stigReviews']
			},
			method: 'GET'
		})
		let apiUser = JSON.parse(result.response.responseText)
		apiUser.deptId = apiUser.dept.deptId
		userPropsFormPanel.getForm().setValues(apiUser)
		toggleAssignmentAccess(apiUser.accessLevel)
	}
	else {
		// For new user, set default department
		userPropsFormPanel.getForm().setValues({
			deptId: curUser.canAdmin ? 0 : curUser.dept.deptId
		})
	}

	Ext.getBody().unmask();
	appwindow.show(document.body);
}