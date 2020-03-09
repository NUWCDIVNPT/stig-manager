//======================================================================================
//NAME: 		showUserProperties.js
//PURPOSE: 		Displays and manages user information and their Asset-STIG assignments 
//=======================================================================================
function showUserProperties(id, grid){
	//==========================================================
	//The structure for records in the record store for 
	//assignments. We use it to create new records as well as 
	//defining the fields in the JSON Store.
	//==========================================================
	var assignmentFieldArray = [
		{name: 'saId', type: 'string'},
		{name: 'stigId', type: 'string'},
		{name: 'title', type: 'string'},
		//{name: 'assetId', type: 'number'},
		{name: 'name', type: 'string'}
	];
	var assignmentStore = new Ext.data.JsonStore({
		//===========================================================
		//ASSIGNMENTS DATA STORE
		//===========================================================
		url: 'pl/getUserProperties.pl',
		fields: assignmentFieldArray,
		root: 'rows',
		idProperty: 'saId',
		sortInfo: {
			field: 'stigId',
			direction: 'ASC'
		},
		listeners: {
			datachanged: function(){
				assignmentGrid.setTitle('Asset-STIG Assignments (' + assignmentStore.getCount() + ')');
			},
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
		name: 'currentAssignments',
		isFormField: true,
		setValue: function(v) {
			assignmentStore.loadData(v);
		},
		getValue: function() {},
		markInvalid: function() {},
		clearInvalid: function() {},
		isValid: function() { return true},
		disabled: false,
		getName: function() {return this.name},
		validate: function() { return true},
		title: 'Asset-STIG Assignments',
		flex: 2.8,
		store: assignmentStore,
		stripeRows: true,
		sm: selectionModel,
		viewConfig: {
			forceFit:true,
			getRowClass: function(rowIndex, isSelected){
				if(typeof rowIndex == 'number'){
					if (isSelected==true){
						//alert('Row ' + rowIndex + ' was Selected.');
						return 'assignment-grid-item-selected';
					}else if (isSelected==false){
						//alert('Row ' + rowIndex + ' was Deselected.');
						return '';
					}
				}
			}
		},
		columns:[
			{
				id:'assetColumn',
				header: "Asset", 
				dataIndex: 'name',
				sortable: true,
				width: 250
			},
			{
				id:'stigColumn',
				header: "STIG", 
				dataIndex: 'title',
				sortable: true,
				width: 350
			}
		]
		
	});
	
	var userPropsFormPanel = new Ext.form.FormPanel({
		baseCls: 'x-plain',
		labelWidth: 65,
		url:'pl/updateUserProperties.pl',
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
						name: 'cn'
					},{
						xtype: 'textfield',
						fieldLabel: 'Display',
						width: 250,
						emptyText: 'Enter display name...',
						allowBlank: false,
						name: 'name'
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
						name: 'dept',
						mode: 'local',
						triggerAction: 'all',
						displayField:'dept',
						store: new Ext.data.SimpleStore({
							fields: ['dept'],
							data : [['10'],['20'],['30'],['40'],['50'],['60'],['70'],['80']]
						})
					},
					{
						xtype: 'combo',
						id: 'userPropsRoleCombo',
						disabled: !(curUser.canAdmin),
						fieldLabel: 'Role',
						width: 100,
						emptyText: 'Role...',
						allowBlank: false,
						editable: false,
						forceSelection: true,
						name: 'roleId',
						hiddenName: 'roleId',
						mode: 'local',
						triggerAction: 'all',
						displayField:'roleDisplay',
						valueField:'roleId',
						store: new Ext.data.ArrayStore({
							fields: ['roleId','roleDisplay'],
							data : [['2','IA Workforce'],['3','IA Officer'],['4','IA Staff']]
						}),
						listeners: {
							select: function ( combo, record, index ) {
								toggleAssignmentAccess(record.data.roleId);
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
					dataUrl: 'pl/assignmentNavTree.pl',
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
		}], buttons: [{
			text: 'Cancel',
			handler: function(){
				window.close();
			}
		},{
			text: 'Save',
			formBind: true,
			id: 'submit-button',
			handler: function(){
				//==============================================================
				//Submit the form.  Send the user ID, the assignments and the 
				//STIG-ASSET assignments as parameters. The field values (i.e. "cn")
				//are sent automatically by ExtJs.
				//==============================================================
				//window.getEl().mask("Saving...");
				userPropsFormPanel.getForm().submit({
					params : {
						id: id,
						saIds: getPendingAssignments(),
						req: 'update'
					},
					waitMsg: 'Saving changes...',
					success: function (f,a) {
						if (a.result.success == true) {
							grid.getView().holdPosition = true; //sets variable used in override in varsUtils.js
							grid.getStore().reload();
							Ext.Msg.alert('Success', a.result.response);
							window.close();
						}
					},
					failure: function(f,a) {
						Ext.Msg.alert('Update Failed!', a.result.response);
						window.close();
					}	
				});
			}
	   }]
	   
});
	
	function getPendingAssignments(){
	//===========================================================
	//Gathers all assignments in the assignment grid and returns 
	//an array of STIG-ASSET ID values 
	//===========================================================
	var saIdArray = [];
	assignmentStore.each(function(theRecord){
		saIdArray.push(theRecord.get("saId"));
	});
	return Ext.util.JSON.encode(saIdArray);
}

	function assignPackage(theNode){
		//=======================================================================
		//Assigns the whole package to a user
		//=======================================================================
		Ext.Ajax.request({
			url: 'pl/getStigAssetPairs.pl',
			params: { 
				level: 'package',
				packageId: theNode.attributes.packageId
			},				
			success: function(response, params) {                               
				var responseObj = Ext.util.JSON.decode(response.responseText);
				assignmentStore.loadData(responseObj.data, true);
			}
		});
	}
	
	function assignAsset(theNode){
	//=======================================================
	// Assigns all of the STIGS of a specific Asset (in a)
	// specific package to a user.
	//=======================================================
	var assetIdMatches = theNode.id.match(/\d+-(\d+)-assignment-assets-asset-node/);
	var assetId = assetIdMatches[1];
	Ext.Ajax.request({
		url: 'pl/getStigAssetPairs.pl',
		params: { 
			level: 'asset',
			assetId: assetId
		},				
		success: function(response, params) {                               
			var responseObj = Ext.util.JSON.decode(response.responseText);
			assignmentStore.loadData(responseObj.data, true);
		}
	});
}
	
	function assignStig(theNode){
	//=======================================================
	// Assigns all of the ASSETS associated to this STIG IN a
	// specific package to a user.
	//=======================================================
	// var assetIdMatches = theNode.id.match(/\d+-(\d+)-assignment-assets-asset-node/);
	// var assetId = assetIdMatches[1];
	Ext.Ajax.request({
		url: 'pl/getStigAssetPairs.pl',
		params: { 
			level: 'stig',
			stigId: theNode.attributes.stigId,
			packageId: theNode.attributes.packageId
		},				
		success: function(response, params) {                               
			var responseObj = Ext.util.JSON.decode(response.responseText);
			assignmentStore.loadData(responseObj.data, true);
		}
	});
}
	function toggleAssignmentAccess(p_roleId){
		if (p_roleId == 2) {
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
				var newAssignmentRecord = {rows:[
					{
						saId:selectedNode.attributes.saId,
						stigId:selectedNode.attributes.stigId, 
						title:selectedNode.attributes.stigId, 
						name: selectedNode.attributes.assetName,
					}
				]};
				assignmentStore.loadData(newAssignmentRecord, true);
				break;
		}	
	}
	//===================================================
	//CREATES THE DIALOG WINDOW THAT CONTAINS ALL OF THE 
	//USER PROPERTY COMPONENTS
	//===================================================
	var window = new Ext.Window({
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

	window.render(document.body);
	//===================================================
	//LOAD THE FORM WITH THE USER PROPERTIES
	//===================================================
	userPropsFormPanel.getForm().load({
		url: 'pl/getUserProperties.pl',
		params: {
			id: id
		},
		success: function(f, action) {
			//=============================================
			//ASSIGNMENTS AND DISPLAY THE PROPERTIES WINDOW	
			//=============================================				
			Ext.getBody().unmask();
			window.show(document.body);
			//=============================================
			//LOCK ASSIGNMENT SECTION BASED VALUE OF 
			//MODIFIED USER'S SELECTED ROLE
			//=============================================	
			toggleAssignmentAccess(action.result.data.roleId);
		}
	});
}