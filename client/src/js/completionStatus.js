function addCompletionStatus( params) {
	const { collectionId, collectionName, treePath } = params

	var summary = new Ext.ux.grid.GroupSummary();

	const statusStore = new Ext.data.GroupingStore ({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/status`,
			method: 'GET',
		}),
		sortInfo: {
			field: 'assetName'
		},
		groupField: 'benchmarkId',
		reader: new Ext.data.JsonReader({
			root: '',
			fields: [
				{name:'assetId',type:'int'},
				'assetName',
				'assetLabelIds',
				{name:'benchmarkId',type:'string'},
	
				{name:'rulesTotal', type:'int', mapping: 'rules.total'},
				

				{name:'savedTotal',type:'int', mapping: 'status.saved.total'},
	
				{name:'submittedTotal',type:'int', mapping: 'status.submitted.total'},
	
				{name:'rejectedTotal',type:'int', mapping: 'status.rejected.total'},
	
				{name:'acceptedTotal',type:'int', mapping: 'status.accepted.total'},
	
				{name:'highCount',type:'int', mapping: 'findings.high'},
				{name:'mediumCount',type:'int', mapping: 'findings.medium'},
				{name:'lowCount',type:'int', mapping: 'findings.low'},
				{name:'minTs',type:'date'},
				{name:'maxTs',type:'date'},
				{name:'notCheckedTotal',type:'int', convert: function (v, r) { 
					return r.rules.total - (r.status.saved.total + r.status.submitted.total + r.status.rejected.total + r.status.accepted.total) 
				} },

			],
			idProperty: (v) => {
				return v.assetId + v.benchmarkId
			}	
		})
	})
	const totalTextCmp = new SM.RowCountTextItem({store:statusStore})

	var completionGrid = new Ext.grid.GridPanel({
		id: 'completionGrid-' + collectionId,
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
        plugins: summary,
		region:'center',
		layout:'fit',
		store: statusStore,
		columns: [
			{
				header: "Asset",width:35,dataIndex:'assetName',sortable:true,
				summaryRenderer: function(v, params, data){
          return "Totals";
        },
			},
			{
				header: "Labels",
				id: `status-labels-${collectionId}`,
				width: 30,
				dataIndex: 'assetLabelIds',
				sortable: false,
				renderer: function (value, metadata) {
						const labels = []
						for (const labelId of value) {
								const label = SM.Cache.getCollectionLabel(collectionId, labelId)
								if (label) labels.push(label)
						}
						labels.sort((a,b) => a.name.localeCompare(b.name))
						metadata.attr = 'style="white-space:normal;"'
						return SM.Collection.LabelArrayTpl.apply(labels)
				}
			},
			{
				header: "Checklist",width:35,dataIndex:'benchmarkId',sortable:true,id:'completionGrid-'+ collectionId + 'becnhmarkId',
				summaryRenderer: function(v, params, data){
          return "Totals";
        },
			},
			{header: "Checks",width:10,dataIndex:'rulesTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "Not Checked",width:10,dataIndex:'notCheckedTotal',sortable:true,align:'right',renderer:renderCat23,summaryType: 'sum'},
			{header: "Oldest",width:10,dataIndex:'minTs',sortable:true,align:'center',renderer:renderDurationToNow,summaryType: 'min'},
			{header: "Newest",width:10,dataIndex:'maxTs',sortable:true,align:'center',renderer:renderDurationToNow,summaryType: 'max'},
			{header: "Saved",width:10,dataIndex:'savedTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "<img src=img/ready-16.png width=12 height=12 exportvalue='Submitted'> Submitted",width:10,dataIndex:'submittedTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "<img src=img/rejected-16.png width=12 height=12 exportvalue='Rejected'> Rejected",width:10,dataIndex:'rejectedTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "<img src=img/star.svg width=12 height=12 exportvalue='Accepted'> Accepted",width:10,dataIndex:'acceptedTotal',sortable:true,align:'right',renderer:renderGrey,summaryType: 'sum'},
			{header: "Cat 1",width:10,dataIndex:'highCount',sortable:true,align:'right',renderer:renderCat1,summaryType: 'sum'},			
			{header: "Cat 2",width:10,dataIndex:'mediumCount',sortable:true,align:'right',renderer:renderCat23,summaryType: 'sum'},			
			{header: "Cat 3",width:10,dataIndex:'lowCount',sortable:true,align:'right',renderer:renderCat23,summaryType: 'sum'}
			
		],
		loadMask: {msg: ''},
		stripeRows: true,
		view: new Ext.grid.GroupingView({
			enableGrouping:true,
			hideGroupedColumn: true,
			forceFit:true,
			emptyText: 'No records found.',
			groupTextTpl: '{[SM.he(values.text)]} ({[values.rs.length]} {[values.text.split(":")[0] == "Asset" ? "checklist" : "asset"]}{[values.rs.length > 1 ? "s assigned" : " assigned"]})',
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
				fn: function (grid, rowIndex) {
					const r = grid.getStore().getAt(rowIndex);
					if (r.get('stigTitle') != '!! NO STIG ASSIGNMENTS !!') {
						const leaf = {
							collectionId, 
							assetId: r.data.assetId,
							assetName: r.data.assetName,
							assetLabelIds: r.data.assetLabelIds,
							benchmarkId: r.data.benchmarkId,
							stigName: r.data.benchmarkId,
						}
						addReview({leaf})
					}
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
						iconCls: 'sm-stig-icon',
						tooltip: 'Group by STIG',
						toggleGroup: 'completionGrid-groupBy' + collectionId,
						enableToggle:true,
						allowDepress: false,
						pressed: true,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('completionGrid-expandButton' + collectionId).enable();
								Ext.getCmp('completionGrid-collapseButton' + collectionId).enable();
								completionGrid.getStore().groupBy('benchmarkId');
								const cm = completionGrid.getColumnModel() 
								cm.setHidden(cm.getIndexById(`status-labels-${collectionId}`), false)

							} else {
								Ext.getCmp('completionGrid-expandButton' + collectionId).disable();
								Ext.getCmp('completionGrid-collapseButton' + collectionId).disable();
								completionGrid.getStore().clearGrouping();
							}
						}
					},{
						xtype: 'tbbutton',
						iconCls: 'sm-asset-icon',
						tooltip: 'Group by asset',
						toggleGroup: 'completionGrid-groupBy' + collectionId,
						enableToggle:true,
						allowDepress: false,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('completionGrid-expandButton' + collectionId).enable();
								Ext.getCmp('completionGrid-collapseButton' + collectionId).enable();
								completionGrid.getStore().groupBy('assetName');
								const cm = completionGrid.getColumnModel() 
								cm.setHidden(cm.getIndexById(`status-labels-${collectionId}`), true)

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
						icon: 'img/minus-grey.png',
						id: 'completionGrid-collapseButton' + collectionId,
						tooltip: 'Collapse all groups',
						width: 20,
						handler: function(btn){
							completionGrid.getView().collapseAllGroups();
						}
					},{
						xtype: 'tbbutton',
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
				xtype: 'exportbutton',
				hasMenu: false,
				exportType: 'grid',
				gridBasename: 'Status (grid)',
				iconCls: 'sm-export-icon',
				text: 'CSV'
			},
			{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},
			totalTextCmp]
		})
	})

	let statusTab = new Ext.Panel({
		id: 'completionTab-' + collectionId,
		collectionId: collectionId,
		collectionName: collectionName,
		iconCls: 'sm-report-icon',
		title: '',
		closable:true,
		layout: 'border',
		sm_tabMode: 'permanent',
		sm_treePath: treePath,
		items: [completionGrid]
	})

	statusTab.updateTitle = function () {
		statusTab.setTitle(`${statusTab.sm_tabMode === 'ephemeral' ? '<i>':''}${SM.he(statusTab.collectionName)} / Status${statusTab.sm_tabMode === 'ephemeral' ? '</i>':''}`)
	}
	statusTab.makePermanent = function () {
		statusTab.sm_tabMode = 'permanent'
		statusTab.updateTitle()
	}

	let tp = Ext.getCmp('main-tab-panel')
	let ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
	let thisTab
	if (ephTabIndex !== -1) {
	  let ephTab = tp.items.itemAt(ephTabIndex)
	  tp.remove(ephTab)
	  thisTab = tp.insert(ephTabIndex, statusTab);
	} else {
	  thisTab = tp.add( statusTab )
	}
	thisTab.updateTitle.call(thisTab)
	thisTab.show();
	
	completionGrid.getStore().load();

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

