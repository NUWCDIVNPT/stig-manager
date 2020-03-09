
function addCompletionStatus(packageId,packageName) {

	var groupRow = [
		{header: ' ', colspan: 2, align: 'center'},
		{header: 'Total', colspan: 2, align: 'center'},
		{header: 'Manual', colspan: 2, align: 'center'},
		{header: 'SCAP', colspan: 2, align: 'center'},
		{header: 'Findings', colspan: 3, align: 'center'}
	];

	var summary = new Ext.ux.grid.GroupSummary();

	var completionGrid = new Ext.grid.GridPanel({
		id: 'completionGrid-' + packageId,
        plugins: summary,
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
					{name:'stigId',type:'string'},
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
					Ext.getCmp('completionGrid-' + packageId + '-totalText').setText(records.length + ' records');
				}
			}
		}),
		columns: [
			{header: "Asset",width:35,dataIndex:'assetName',sortable:true,
				summaryRenderer: function(v, params, data){
                    return "Checklist totals";
                },
			},
			{header: "Checklist",width:35,dataIndex:'stigId',sortable:true,id:'completionGrid-'+ packageId + 'becnhmarkId',
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
						attributes.stigId = r.get('stigId');
						attributes.stigName = r.get('stigId');
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
						toggleGroup: 'completionGrid-groupBy' + packageId,
						enableToggle:true,
						allowDepress: false,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('completionGrid-expandButton' + packageId).enable();
								Ext.getCmp('completionGrid-collapseButton' + packageId).enable();
								completionGrid.getView().group
								completionGrid.getStore().groupBy('stigId');
							} else {
								Ext.getCmp('completionGrid-expandButton' + packageId).disable();
								Ext.getCmp('completionGrid-collapseButton' + packageId).disable();
								completionGrid.getStore().clearGrouping();
							}
						}
					},{
						xtype: 'tbbutton',
						icon: 'img/mycomputer1-16.png',
						tooltip: 'Group by asset',
						toggleGroup: 'completionGrid-groupBy' + packageId,
						enableToggle:true,
						allowDepress: false,
						pressed: true,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('completionGrid-expandButton' + packageId).enable();
								Ext.getCmp('completionGrid-collapseButton' + packageId).enable();
								completionGrid.getStore().groupBy('assetName');
							} else {
								Ext.getCmp('completionGrid-expandButton' + packageId).disable();
								Ext.getCmp('completionGrid-collapseButton' + packageId).disable();
								completionGrid.getStore().clearGrouping();
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron.png',
						icon: 'img/minus-grey.png',
						id: 'completionGrid-collapseButton' + packageId,
						tooltip: 'Collapse all groups',
						width: 20,
						handler: function(btn){
							completionGrid.getView().collapseAllGroups();
						}
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron_expand.png',
						icon: 'img/plus-grey.png',
						id: 'completionGrid-expandButton' + packageId,
						tooltip: 'Expand all groups',
						width: 20,
						handler: function(btn){
							completionGrid.getView().expandAllGroups();
						}
					}]
				// END Grouping control
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
					completionGrid.getStore().reload();
				}
			},{
				xtype: 'tbseparator'
			}
			,{
				xtype: 'tbbutton',
				iconCls: 'icon-save',
				width: 20,
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				handler: function(btn){
					var ourStore = completionGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&packageId=' + lo.params.packageId;
				}
			},{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'completionGrid-' + packageId + '-totalText',
				text: '0 records',
				width: 80
			}]
		})
	});
	
	var thisTab = Ext.getCmp('reports-center-tab').add({
		id: 'completionTab-' + packageId,
		iconCls: 'sm-report-icon',
		title: 'Completion Status (' + packageName + ')',
		closable:true,
		layout: 'border',
		items: [completionGrid]
	});
	thisTab.show();
	
	completionGrid.getStore().load({params:{packageId: packageId}});

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

