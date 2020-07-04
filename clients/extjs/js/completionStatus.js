/*
$Id: completionStatus.js 807 2017-07-27 13:04:19Z csmig $
*/

function addCompletionStatus(collectionId,collectionName) {

	var groupRow = [
		{header: ' ', colspan: 2, align: 'center'},
		{header: 'Total', colspan: 2, align: 'center'},
		{header: 'Manual', colspan: 2, align: 'center'},
		{header: 'SCAP', colspan: 2, align: 'center'},
		{header: 'Findings', colspan: 3, align: 'center'}
	];

	var summary = new Ext.ux.grid.GroupSummary();

	var completionGrid = new Ext.grid.GridPanel({
		id: 'completionGrid-' + collectionId,
        plugins: summary,
		//title: 'Checklist Status (' + collectionName + ')',
		region:'center',
		layout:'fit',
		store: new Ext.data.GroupingStore ({
			url: 'pl/getCompletionStatus.pl',
			sortInfo: {
				field: 'assetName'
			},
			groupField: 'assetName',
			reader: new Ext.data.JsonReader({
				root: 'rows',
				totalProperty: 'records',
				fields: [
					{name:'id',type:'int'},
					{name:'assetId',type:'int'},
					{name:'benchmarkId',type:'string'},
					{name:'revId',type:'string'},

					{name:'checksManual',type:'int'},
					{name:'checksScap',type:'int'},
					{name:'checksTotal',type:'int'},
					
					{name:'unreviewedManual',type:'int'},
					{name:'unreviewedScap',type:'int'},
					{name:'unreviewedTotal',type:'int'},

					{name:'inProgressManual',type:'int'},
					{name:'inProgressScap',type:'int'},
					{name:'inProgressTotal',type:'int'},

					{name:'submittedManual',type:'int'},
					{name:'submittedScap',type:'int'},
					{name:'submittedTotal',type:'int'},

					{name:'rejectedManual',type:'int'},
					{name:'rejectedScap',type:'int'},
					{name:'rejectedTotal',type:'int'},

					{name:'approvedManual',type:'int'},
					{name:'approvedScap',type:'int'},
					{name:'approvedTotal',type:'int'},

					{name:'cat1Count',type:'int'},
					{name:'cat2Count',type:'int'},
					{name:'cat3Count',type:'int'},
					'assetName','stigTitle'
				]
			}),
			listeners: {
				load: function (store,records) {
					Ext.getCmp('completionGrid-' + collectionId + '-totalText').setText(records.length + ' records');
				}
			}
		}),
		columns: [
			{header: "Asset",width:35,dataIndex:'assetName',sortable:true,
				summaryRenderer: function(v, params, data){
                    return "Checklist totals";
                },
			},
			{header: "Checklist",width:35,dataIndex:'benchmarkId',sortable:true,id:'completionGrid-'+ collectionId + 'becnhmarkId',
				summaryRenderer: function(v, params, data){
                    return "Asset totals";
                },
			},
			{header: "Checks",width:10,dataIndex:'checksTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "Not Reviewed",width:10,dataIndex:'unreviewedTotal',sortable:true,align:'right',renderer:renderCat23,summaryType: 'sum'},
			{header: "In Progress",width:10,dataIndex:'inProgressTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "<img src=img/ready-16.png width=12 height=12> Submitted",width:10,dataIndex:'submittedTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "<img src=img/rejected-16.png width=12 height=12> Returned",width:10,dataIndex:'rejectedTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "<img src=img/lock-16.png width=12 height=12> Approved",width:10,dataIndex:'approvedTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "Cat 1",width:10,dataIndex:'cat1Count',sortable:true,align:'right',renderer:renderCat1,summaryType: 'sum'},			
			{header: "Cat 2",width:10,dataIndex:'cat2Count',sortable:true,align:'right',renderer:renderCat23,summaryType: 'sum'},			
			{header: "Cat 3",width:10,dataIndex:'cat3Count',sortable:true,align:'right',renderer:renderCat23,summaryType: 'sum'}
			
		],
		//autoExpandColumn:'completionGrid-'+ collectionId + 'becnhmarkId',
		//border: false,
		//style: {
		//	borderBottomWidth: "1px"
		//},
		loadMask: true,
		stripeRows: true,
		view: new Ext.grid.GroupingView({
			enableGrouping:true,
			hideGroupedColumn: true,
			forceFit:true,
			emptyText: 'No records found.',
			groupTextTpl: '{text} ({[values.rs.length]} {[values.text.split(":")[0] == "Asset" ? "checklist" : "asset"]}{[values.rs.length > 1 ? "s assigned" : " assigned"]})',
			getRowClass: function(record, rowIndex, rp, ds){ // rp = rowParams
				if (record.data.stigTitle == '!! NO STIG ASSIGNMENTS !!') {
					return 'sm-grid3-row-black';
				}
				// if(record.data.noreviewCount == '0'){
					// return 'sm-grid3-row-green';
				// } else if (record.data.noreviewCount != record.data.checkCount) {
					// return 'sm-grid3-row-orange';
				// } else {
					// return 'sm-grid3-row-red';
				// }
			}
		}),
		sm: new Ext.grid.RowSelectionModel ({
		}),
		listeners: {
			rowdblclick: {
				fn: function(grid,rowIndex,e) {
					var r = grid.getStore().getAt(rowIndex);
					if (r.get('stigTitle') != '!! NO STIG ASSIGNMENTS !!') {
						Ext.getCmp('main-tabs').setActiveTab('tab-reviews');
						var n = new Object();
						var attributes = new Object();
						attributes.report = "review";
						attributes.assetId = r.get('assetId');
						attributes.assetName = r.get('assetName');
						attributes.benchmarkId = r.get('benchmarkId');
						attributes.stigName = r.get('benchmarkId');
						attributes.revId = r.get('revId');
						n.attributes = attributes;
						reviewsTreeClick(n);
					}
					//Ext.getCmp('groupGrid').getStore().load({params:{assetId:assetId, revId:revId}});
				}
			}
		},
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
						toggleGroup: 'completionGrid-groupBy' + collectionId,
						enableToggle:true,
						allowDepress: false,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('completionGrid-expandButton' + collectionId).enable();
								Ext.getCmp('completionGrid-collapseButton' + collectionId).enable();
								completionGrid.getView().group
								completionGrid.getStore().groupBy('benchmarkId');
							} else {
								Ext.getCmp('completionGrid-expandButton' + collectionId).disable();
								Ext.getCmp('completionGrid-collapseButton' + collectionId).disable();
								completionGrid.getStore().clearGrouping();
							}
						}
					},{
						xtype: 'tbbutton',
						icon: 'img/mycomputer1-16.png',
						tooltip: 'Group by asset',
						toggleGroup: 'completionGrid-groupBy' + collectionId,
						enableToggle:true,
						allowDepress: false,
						pressed: true,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('completionGrid-expandButton' + collectionId).enable();
								Ext.getCmp('completionGrid-collapseButton' + collectionId).enable();
								completionGrid.getStore().groupBy('assetName');
							} else {
								Ext.getCmp('completionGrid-expandButton' + collectionId).disable();
								Ext.getCmp('completionGrid-collapseButton' + collectionId).disable();
								completionGrid.getStore().clearGrouping();
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron.png',
						icon: 'img/minus-grey.png',
						id: 'completionGrid-collapseButton' + collectionId,
						tooltip: 'Collapse all groups',
						width: 20,
						handler: function(btn){
							completionGrid.getView().collapseAllGroups();
						}
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron_expand.png',
						icon: 'img/plus-grey.png',
						id: 'completionGrid-expandButton' + collectionId,
						tooltip: 'Expand all groups',
						width: 20,
						handler: function(btn){
							completionGrid.getView().expandAllGroups();
						}
					}]
				// END Grouping control
				}
				// ,{
				// // START Filter control
					// xtype: 'buttongroup',
					// title: 'Filtering',
					// items: [
					// {
						// xtype: 'tbbutton',
						// icon: 'img/security_firewall_on.png',
						// tooltip: 'Filter by STIG id',
						// toggleGroup: 'completionGrid-filterBy' + collectionId,
						// enableToggle:true,
						// allowDepress: true,
						// pressed: false,
						// width: 20,
						// handler: function(btn){
							// var filterField = Ext.getCmp('completionGrid-filterField' + collectionId);
							// if (btn.pressed) {
								// filterField.enable();
								// completionGrid.getStore().filterField = 'benchmarkId';
								// if (filterField.getRawValue() == '') {
									// filterField.emptyText = 'Enter a STIG filter...';
									// filterField.setRawValue(filterField.emptyText);
								// } else {
									// filterField.emptyText = 'Enter a STIG filter...';
								// }
								// filterStatusChangesStore();
							// } else {
								// filterField.disable();
								// //filterField.setValue('');
								// filterStatusChangesStore();
							// }
						// }
					// },{
						// xtype: 'tbbutton',
						// icon: 'img/mycomputer1-16.png',
						// tooltip: 'Filter by asset name',
						// toggleGroup: 'completionGrid-filterBy' + collectionId,
						// enableToggle:true,
						// allowDepress: true,
						// width: 20,
						// handler: function(btn){
							// var filterField = Ext.getCmp('completionGrid-filterField' + collectionId);
							// if (btn.pressed) {
								// filterField.enable();
								// completionGrid.getStore().filterField = 'assetName';
								// if (filterField.getRawValue() == '') {
									// filterField.emptyText = 'Enter an asset filter...';
									// filterField.setRawValue(filterField.emptyText);
								// } else {
									// filterField.emptyText = 'Enter an asset filter...';
								// }
								// filterStatusChangesStore();
							// } else {
								// filterField.disable();
								// //filterField.setValue('');
								// filterStatusChangesStore();
							// }
						// }
					// },{
						// xtype: 'tbseparator'
					// },{
						// xtype: 'trigger',
						// fieldLabel: 'Filter',
						// triggerClass: 'x-form-clear-trigger',
						// onTriggerClick: function() {
							// this.triggerBlur();
							// this.blur();
							// this.setValue('');
							// filterStatusChangesStore();
						// },
						// id: 'completionGrid-filterField' + collectionId,
						// width: 140,
						// submitValue: false,
						// disabled: true,
						// enableKeyEvents:true,
						// emptyText:'Filter string...',
						// listeners: {
							// keyup: function (field,e) {
								// filterStatusChangesStore();
								// return false;
							// }
						// }
					// }
					// ]
				// }
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
					completionGrid.getStore().reload();
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
					// var ourStore = completionGrid.getStore();
					// var lo = ourStore.lastOptions;
					// window.location=ourStore.url + '?xls=1&collectionId=' + lo.params.collectionId;
				// }
			// }
			,{
				xtype: 'tbbutton',
				iconCls: 'sm-export-icon',
				width: 20,
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				handler: function(btn){
					var ourStore = completionGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&collectionId=' + lo.params.collectionId;
				}
			},{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'completionGrid-' + collectionId + '-totalText',
				text: '0 records',
				width: 80
			}]
		})
	});
	
	var thisTab = Ext.getCmp('reports-center-tab').add({
		id: 'completionTab-' + collectionId,
		iconCls: 'sm-report-icon',
		title: 'Completion Status (' + collectionName + ')',
		closable:true,
		layout: 'border',
		items: [completionGrid]
	});
	thisTab.show();
	
	completionGrid.getStore().load({params:{collectionId: collectionId}});

}; //end addCompletionReport();

function renderGrey(value, metaData, record, rowIndex, colIndex, store) {
	metaData.css = 'sm-cell-grey';
	return value;
}
function renderDays(value, metaData, record, rowIndex, colIndex, store) {
	metaData.css = 'sm-cell-grey';
	if (isNaN(value)) {
		return '-';
	} else if (value == 0) {
		return 'Today';
	} else if (value == 1) {
		return value + ' day';
	} else {
		return value + ' days';
	}
}

function renderCat1(value, metaData, record, rowIndex, colIndex, store) {
	if (value > 0) {
		metaData.css = 'sm-cell-red';
	} else {
		metaData.css = 'sm-cell-green';
	}
	return value;
}

function renderCat23(value, metaData, record, rowIndex, colIndex, store) {
	if (value > 0) {
		metaData.css = 'sm-cell-orange';
	} else {
		metaData.css = 'sm-cell-green';
	}
	return value;
}

function renderUndone(value, metaData, record, rowIndex, colIndex, store) {
	if (value == 0) {
		metaData.css = 'sm-cell-green';
	} else {
		metaData.css = 'sm-cell-red';
	}
	return value
}
function renderDone(value, metaData, record, rowIndex, colIndex, store) {
	if (value == record.data.totalCheckCount) {
		metaData.css = 'sm-cell-green';
	} else {
		metaData.css = 'sm-cell-red';
	}
	return value
}

function renderChecklist(value, metaData, record, rowIndex, colIndex, store) {
	metaData.css = 'sm-cell-checklist';
	return value;
}

function renderAsset(value, metaData, record, rowIndex, colIndex, store) {
	metaData.css = 'sm-cell-asset';
	return value;
}

