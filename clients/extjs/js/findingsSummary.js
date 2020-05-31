/*
$Id: findingsSummary.js 807 2017-07-27 13:04:19Z csmig $
*/

function addFindingsSummary(packageId,packageName) {
	var idAppend = '-findings-summary-' + packageId;
	var stigId = '';
	
	var findingsGrid = new Ext.grid.GridPanel({
		id: 'findingsGrid-' + packageId,
		title: 'Findings with Counts',
		region:'center',
		height:50,
		store: new Ext.data.JsonStore ({
			url: 'pl/getFindings.pl',
			sortInfo: {
				field: 'cnt',
				direction: 'DESC'
			},
			root: 'rows',
			totalProperty: 'records',
			sortInfo: {
				field: 'cnt',
				direction: 'DESC' // or 'DESC' (case sensitive for local sorting)
			},
			fields: [
				{name:'cnt',type:'int'},
				{name:'stigIds',type:'string'},
				{name:'groupId',type:'string',sortType: sortGroupId},
				{name:'ruleId',type:'string'},
				{name:'severity',type:'string'},
				{name:'title',type:'string'}
			],
			listeners: {
				load: function (store,records) {
					Ext.getCmp('findingsGrid-' + packageId + '-totalText').setText(records.length + ' records');
				}
			}
		}),
		columns: [
			{header: "Severity",align:'center',width:10,dataIndex:'severity',sortable:true,renderer:renderSeverity},
			{header: "Group",width:15,dataIndex:'groupId',sortable:true},
			{header: "Rule Title",width:45,dataIndex:'title',renderer:columnWrap,sortable:true,id:'findingsGrid-'+ packageId + 'title'},
			{header: "# Assets",width:15,align:'right',dataIndex:'cnt',sortable:true},
			{header: "STIGs",width:40,dataIndex:'stigIds',renderer:columnWrap,sortable:true,id:'findingsGrid-'+ packageId + 'stigIds'}
			//{header: "Rule",width:25,dataIndex:'ruleId',sortable:true},
		],
		autoExpandColumn:'findingsGrid-'+ packageId + 'stigIds',
		border: false,
		style: {
			borderBottomWidth: "1px"
		},
		loadMask: true,
		stripeRows: true,
		view: new Ext.grid.GridView({
			forceFit:true,
			emptyText: 'No records found.',
			getRowClass: function(record, rowIndex, rp, ds){ // rp = rowParams
				if(record.data.severity == 'high'){
					return 'sm-grid3-row-red';
				} else if (record.data.severity == 'medium') {
					return 'sm-grid3-row-orange';
				} else {
					return 'sm-grid3-row-green';
				}
			}
		}),
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: true,
			listeners: {
				rowselect: {
					fn: function(sm,index,record) {
						var lo = findingsGrid.getStore().lastOptions;
						hostGrid.getStore().load({
							params:{
								groupId: record.data.groupId, 
								packageId: packageId,
								stigId: lo.params.stigId,
								dept: lo.params.dept,
								domain: lo.params.domain,
								status: lo.params.status
							}
						});
						hostGrid.curTitleBase = 'Host details for \'' + record.data.groupId + '\'';
						hostGrid.setTitle(hostGrid.curTitleBase);
					}
				}
			}
		}),
		tbar: new Ext.Toolbar({
			hidden: (curUser.role.roleId !== 4), 
			items: [
			{
				xtype: 'tbtext',
				text: 'STIG:  '
			}
			,{
				xtype: 'combo',
				id: 'combo-stig' + idAppend,
				width: 150,
				allowBlank: true,
				editable: false,
				forceSelection: true,
				name: 'stigId',
				mode: 'remote',
				triggerAction: 'all',
				displayField:'stigId',
				value: '--Any--',
				store: new Ext.data.JsonStore({
					fields: ['stigId'],
					url: 'pl/getStigsForFindings.pl',
					root: 'rows',
					baseParams: {
						packageId:packageId
					}
				}),
				listeners: {
					select: function(f,r,i) {
						findingsGrid.getSelectionModel().clearSelections(true);
						hostGrid.getStore().removeAll();
						var lo = findingsGrid.getStore().lastOptions;
						findingsGrid.getStore().load({
							params:{
								context: lo.params.context,
								packageId: lo.params.packageId,
								stigId: r.data.stigId,
								domain: lo.params.domain,
								dept: lo.params.dept
							}
						});
					}
				}
			}
			,{
				xtype: 'tbseparator'
			}
			,{
				xtype: 'tbtext',
				text: 'Department:  '
			}
			,{
				xtype: 'combo',
				id: 'combo-dept' + idAppend,
				width: 100,
				allowBlank: true,
				editable: false,
				forceSelection: true,
				name: 'dept',
				mode: 'remote',
				triggerAction: 'all',
				displayField:'dept',
				value: '--Any--',
				store: new Ext.data.JsonStore({
					fields: ['dept'],
					url: 'pl/getAssetAttrForFindings.pl',
					root: 'rows',
					baseParams: {
						workspace: 'report',
						packageId:packageId,
						stigId:stigId,
						attribute: 'dept'
					}
				}),
				listeners: {
					select: function(f,r,i) {
						findingsGrid.getSelectionModel().clearSelections(true);
						hostGrid.getStore().removeAll();
						var lo = findingsGrid.getStore().lastOptions;
						findingsGrid.getStore().load({
							params:{
								context: lo.params.context,
								packageId: lo.params.packageId,
								stigId: lo.params.stigId,
								domain: lo.params.domain,
								dept: r.data.dept
							}
						});
					}
				}
			}
			,{
				xtype: 'tbseparator'
			}
			,{
				xtype: 'tbtext',
				text: 'Asset Group:  '
			}
			,{
				xtype: 'combo',
				id: 'combo-domain' + idAppend,
				width: 100,
				//emptyText: 'Department...',
				allowBlank: true,
				editable: false,
				forceSelection: true,
				name: 'domain',
				mode: 'remote',
				triggerAction: 'all',
				displayField:'domain',
				value: '--Any--',
				store: new Ext.data.JsonStore({
					fields: ['domain'],
					url: 'pl/getAssetAttrForFindings.pl',
					root: 'rows',
					baseParams: {
						workspace: 'report',
						packageId:packageId,
						stigId:stigId,
						attribute: 'domain'
					}
				}),
				listeners: {
					select: function(f,r,i) {
						findingsGrid.getSelectionModel().clearSelections(true);
						hostGrid.getStore().removeAll();
						var lo = findingsGrid.getStore().lastOptions;
						findingsGrid.getStore().load({
							params:{
								context: lo.params.context,
								packageId: lo.params.packageId,
								stigId: lo.params.stigId,
								dept: lo.params.dept,
								domain: r.data.domain
							}
						});
					}
				}
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
					findingsGrid.getStore().reload();
				}
			},{
				xtype: 'tbseparator'
			}
			// ,{
				// xtype: 'tbbutton',
				// iconCls: 'icon-excel',
				// tooltip: 'Download an enhanced Audits report spreadsheet',
				// //text: 'Enhanced',
				// width: 20,
				// handler: function(btn){
					// var ourStore = findingsGrid.getStore();
					// var lo = ourStore.lastOptions;
					// window.location=ourStore.url + '?xls=1&packageId=' + lo.params.packageId;
				// }
			// }
			,{
				xtype: 'tbbutton',
				iconCls: 'icon-save',
				width: 20,
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				handler: function(btn){
					var ourStore = findingsGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&packageId=' + lo.params.packageId;
				}
			},{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'findingsGrid-' + packageId + '-totalText',
				text: '0 records',
				width: 80
			}]
		})
	});

	var expander = new Ext.ux.grid.RowExpander({
		tpl : new Ext.XTemplate(
		)
	});
	
	var hostGrid = new Ext.grid.GridPanel({
		id: 'hostsByFindingGrid-' + packageId,
		parent: findingsGrid,
		height:300,
		title:'Finding details',
		region:'south',
       // plugins: expander,
		split:true,
		collapsible: true,
		layout:'fit',
		store: new Ext.data.JsonStore({
			url: 'pl/getHostsByFinding.pl',
			root: 'rows',
			sortInfo: {
				field: 'assetName',
				direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
			},
			fields: [
				'assetId',
				'assetName',
				'dept',
				'domain',
				{name:'ruleId',type:'string'},
				//'userName',
				'stigId',
				'ruleId',
				'statusStr',
				{name:'ts',type:'date',dateFormat:'Y-m-d H:i:s'}
			],
			listeners: {
				load: function (store,records) {
					Ext.getCmp('hostsByFindingGrid-' + packageId + '-totalText').setText(records.length + ' records');
					Ext.getCmp('hostsByFindingGrid-' + packageId + '-csvBtn').enable();
					Ext.getCmp('hostsByFindingGrid-' + packageId + '-refreshBtn').enable();
					// if (records.length > 0) {
						// Ext.getCmp(network + '-hostAuditGrid-csvBtn').enable();
						// Ext.getCmp(network + '-hostAuditGrid-refreshBtn').enable();
					// } else {
						// Ext.getCmp(network + '-hostAuditGrid-csvBtn').disable();
						// Ext.getCmp(network + '-hostAuditGrid-refreshBtn').disable();
					// }
					// auditGrid.classification = store.reader.jsonData.classification;
					// auditGrid.setTitle('(' + auditGrid.classification  + ') ' + auditGrid.curTitleBase);
					// setTabTitle();					
				},
				clear: function (store,records) {
					// delete auditGrid.classification;
					// auditGrid.setTitle(auditGrid.emptyTitle);
					// setTabTitle();
				}
			}
		}),
		columns: [
		//	expander,
			{header: "Asset",width:40,dataIndex:'assetName',sortable:true},
			{header: "Dept",width:5,dataIndex:'dept',sortable:true},
			{header: "AssetGroup",width:40,dataIndex:'domain',sortable:true},
			{header: "STIG", width:40, dataIndex: 'stigId', sortable: true},
			{header: "Rule", width: 25, dataIndex: 'ruleId', sortable: true},
			{header: "Status", width:50, dataIndex: 'statusStr', sortable: true},
			{header: "Status changed", width: 50, dataIndex: 'ts', xtype: 'datecolumn',format:'Y-m-d',sortable: true}
		],
		view: new Ext.grid.GridView({
			forceFit:true,
			emptyText: 'Please select a row in the table above.',
			deferEmptyText:false
		}),
		border: false,
		style: {
			borderTopWidth: "1px"
		},
		loadMask: true,
		stripeRows: true,
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				id: 'hostsByFindingGrid-' + packageId + '-refreshBtn',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				disabled:true,
				width: 20,
				handler: function(btn){
					hostGrid.getStore().reload();
				}
			},{
				xtype: 'tbseparator'
			},			{
				xtype: 'tbbutton',
				id: 'hostsByFindingGrid-' + packageId + '-csvBtn',
				iconCls: 'icon-save',
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				disabled:true,
				width: 20,
				handler: function(btn){
					var ourStore = hostGrid.getStore();
					var lo = ourStore.lastOptions;
					// window.location=ourStore.url + '?csv=1&db=' + lo.params.db + '&type=' + lo.params.type + '&ip=' + lo.params.ip;
					window.location=ourStore.url + '?csv=1&packageId=' + lo.params.packageId + '&ruleId=' + lo.params.ruleId;					
				}
			},{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'hostsByFindingGrid-' + packageId + '-totalText',
				text: '0 records',
				width: 80
			}]
		}),
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: true
		}),
		listeners: {
			rowdblclick: {
				fn: function(grid,rowIndex,e) {
					Ext.getCmp('main-tabs').setActiveTab('tab-reviews');
					var r = grid.getStore().getAt(rowIndex);
					fakeLeaf = new Object();
					fakeLeaf.assetId = r.get('assetId');
					fakeLeaf.assetName = r.get('assetName');
					fakeLeaf.stigId = r.get('stigId');
					fakeLeaf.stigName = r.get('stigId');
					fakeLeaf.revId = r.get('revId');
					addReview(fakeLeaf,r.get('ruleId'));
					
					//Ext.getCmp('groupGrid').getStore().load({params:{assetId:assetId, revId:revId}});
				}
			}
		}
	});

	var thisTab = Ext.getCmp('reports-center-tab').add({
		id: 'findingsTab-' + packageId,
		iconCls: 'sm-report-icon',
		title: 'Findings Summary (' + packageName + ')',
		closable:true,
		layout: 'border',
		items: [findingsGrid,hostGrid]
	});
	thisTab.show();
	
	findingsGrid.getStore().load({params:{packageId: packageId}});

}; //end addCompletionReport();

// function renderSeverity(value, metaData, record, rowIndex, colIndex, store) {
// 	if (value == 'high') {
// 		return 'Cat 1';
// 	} else if (value == 'medium') {
// 		return 'Cat 2';
// 	} else if (value == 'low') {
// 		return 'Cat 3';
// 	} 
// }