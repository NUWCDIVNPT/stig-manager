/*
$Id: findingsSummary.js 807 2017-07-27 13:04:19Z csmig $
*/

function addFindingsSummary(collectionId, collectionName) {
	var idAppend = '-findings-summary-' + collectionId;
	var benchmarkId = '';

	var findingsGrid = new Ext.grid.GridPanel({
		id: 'findingsGrid-' + collectionId,
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
		title: 'Findings with Counts',
		region: 'center',
		height: 50,
		store: new Ext.data.JsonStore({
			proxy: new Ext.data.HttpProxy({
				url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/findings`,
				method: 'GET'
			}),
			baseParams: {
				projection: 'stigs'
			},
			sortInfo: {
				field: 'assetCount',
				direction: 'DESC'
			},
			root: '',
			fields: [
				{ name: 'severity', type: 'string' },
				{ name: 'assetCount', type: 'int' },
				{ name: 'stigs' },
				{ name: 'groupId', type: 'string', sortType: sortGroupId },
				{ name: 'ruleId', type: 'string' },
				{ name: 'title', type: 'string' },
				{ name: 'cci', type: 'string' },
				{ name: 'definition', type: 'string' },
				{ name: 'apAcronym', type: 'string' },
			],
			listeners: {
				load: function (store, records) {
					Ext.getCmp('findingsGrid-' + collectionId + '-totalText').setText(records.length + ' records');
				}
			}
		}),
		columns: [
			{ 
				header: "Severity", 
				hidden: false,
				align: 'center', 
				width: 60, 
				dataIndex: 'severity', 
				sortable: true, 
				renderer: renderSeverity
			 },
			 { 
				header: "Group", 
				hidden: false,
				width: 80, 
				dataIndex: 'groupId', 
				sortable: true, 
				id: 'findingsGrid-' + collectionId + 'groupId' 
			},
			{ 
				header: "Rule", 
				hidden: true,
				width: 80, 
				dataIndex: 'ruleId', 
				sortable: true, 
				id: 'findingsGrid-' + collectionId + 'ruleId' 
			},
			{ 
				header: "CCI", 
				hidden: true,
				width: 80, 
				dataIndex: 'cci', 
				sortable: true, 
				id: 'findingsGrid-' + collectionId + 'cci' 
			},
			{ 
				header: "AP Acronym", 
				hidden: true,
				width: 80, 
				dataIndex: 'apAcronym', 
				sortable: true, 
				id: 'findingsGrid-' + collectionId + 'apAcronym' 
			},
			{ 
				header: "Title", 
				hidden: false,
				width: 270, 
				dataIndex: 'title', 
				renderer: columnWrap, 
				sortable: true, 
				id: 'findingsGrid-' + collectionId + 'title' 
			},
			{ 
				header: "Definition", 
				hidden: true,
				width: 135, 
				dataIndex: 'definition', 
				renderer: columnWrap, 
				sortable: true, 
				id: 'findingsGrid-' + collectionId + 'definition' 
			},
			{ 
				header: "Assets", 
				hidden: false,
				width: 75, 
				align: 'center', 
				dataIndex: 'assetCount', 
				sortable: true 
			},
			{ 
				header: "STIGs",
				hidden: false,
				width: 40, 
				dataIndex: 'stigs', 
				renderer: v => {
					return columnWrap(v.join('\n'))
				}, 
				sortable: true, 
				id: 'findingsGrid-' + collectionId + 'stigs'
			}
			//{header: "Rule",width:25,dataIndex:'ruleId',sortable:true},
		],
		autoExpandColumn: 'findingsGrid-' + collectionId + 'stigs',
		border: false,
		style: {
			borderBottomWidth: "1px"
		},
		loadMask: true,
		stripeRows: true,
		view: new Ext.grid.GridView({
			forceFit: false,
			emptyText: 'No records found.',
			getRowClass: function (record, rowIndex, rp, ds) { // rp = rowParams
				if (record.data.severity == 'high') {
					return 'sm-grid3-row-red';
				} else if (record.data.severity == 'medium') {
					return 'sm-grid3-row-orange';
				} else {
					return 'sm-grid3-row-green';
				}
			}
		}),
		sm: new Ext.grid.RowSelectionModel({
			singleSelect: true,
			listeners: {
				rowselect: {
					fn: function (sm, index, record) {
						var lo = findingsGrid.getStore().lastOptions;
						hostGrid.getStore().load({
							params: {
								groupId: record.data.groupId,
								collectionId: collectionId,
								benchmarkId: lo.params.benchmarkId,
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
			// hidden: (curUser.accessLevel !== 3),
			items: [
				{
					xtype: 'tbtext',
					text: 'Aggregate by'
				},
				{
					xtype: 'combo',
					id: 'combo-aggregator' + idAppend,
					cls: 'sm-enhanced-disable-textarea',
					width: 150,
					forceSelection: true,
					editable: false,
					mode: 'local',
					triggerAction: 'all',
					displayField:'display',
					valueField: 'aggregator',
					store: new Ext.data.SimpleStore({
						fields: ['display', 'aggregator'],
						data : [['Group', 'groupId'],['Rule', 'ruleId'],['CCI', 'cci']]
					}),
					listeners: {
						select: (combo, record, index) => {
							findingsGrid.getSelectionModel().clearSelections(true)
							hostGrid.getStore().removeAll()
							let params = {
								aggregator: record.data.aggregator
							}
							let benchmarkId = Ext.getCmp('combo-stig' + idAppend).getValue()
							if (benchmarkId !== Ext.getCmp('combo-stig' + idAppend).includeAllItem) {
								params.benchmarkId = benchmarkId
							}
							findingsGrid.getStore().load({
								params: params
							})
						}
					} 
				},
				{
					xtype: 'tbtext',
					text: 'STIG:  '
				},
				{
					xtype: 'sm-stig-selection-field',
					id: 'combo-stig' + idAppend,
					url: `${STIGMAN.Env.apiBase}/collections/${collectionId}?projection=stigs`,
					autoLoad: true,
					includeAllItem: '--- All Collection STIGs ---',
					root: 'stigs',
					width: 300,
					triggerAction: 'all',
					allowBlank: true,
					editable: false,
					forceSelection: true,
					value: '--- All Collection STIGs ---',
					listeners: {
						select: function (f, r, i) {
							findingsGrid.getSelectionModel().clearSelections(true)
							hostGrid.getStore().removeAll()
							let params = {
								aggregator: 'groupId'
							}
							if (r.data.benchmarkId !== f.includeAllItem) {
								params.benchmarkId = r.data.benchmarkId
							}
							findingsGrid.getStore().load({
								params: params
							})
						}
					}
				},
				{
					xtype: 'tbseparator'
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
					handler: function (btn) {
						findingsGrid.getStore().reload();
					}
				},
				{
					xtype: 'tbseparator'
				},
				{
					xtype: 'exportbutton',
					hasMenu: false,
					gridBasename: 'Findings',
					storeBasename: 'Findings (store)',
					iconCls: 'sm-export-icon',
					text: 'Export'
				},
				{
					xtype: 'tbfill'
				},
				{
					xtype: 'tbseparator'
				},
				{
					xtype: 'tbtext',
					id: 'findingsGrid-' + collectionId + '-totalText',
					text: '0 records',
					width: 80
				}
			]
		})
	});

	var expander = new Ext.ux.grid.RowExpander({
		tpl: new Ext.XTemplate(
		)
	});

	var hostGrid = new Ext.grid.GridPanel({
		id: 'hostsByFindingGrid-' + collectionId,
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
		parent: findingsGrid,
		height: 300,
		title: 'Finding details',
		region: 'south',
		// plugins: expander,
		split: true,
		collapsible: true,
		layout: 'fit',
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
				{ name: 'ruleId', type: 'string' },
				//'userName',
				'benchmarkId',
				'ruleId',
				'statusStr',
				{ name: 'ts', type: 'date', dateFormat: 'Y-m-d H:i:s' }
			],
			listeners: {
				load: function (store, records) {
					Ext.getCmp('hostsByFindingGrid-' + collectionId + '-totalText').setText(records.length + ' records');
					Ext.getCmp('hostsByFindingGrid-' + collectionId + '-csvBtn').enable();
					Ext.getCmp('hostsByFindingGrid-' + collectionId + '-refreshBtn').enable();
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
				clear: function (store, records) {
					// delete auditGrid.classification;
					// auditGrid.setTitle(auditGrid.emptyTitle);
					// setTabTitle();
				}
			}
		}),
		columns: [
			//	expander,
			{ header: "Asset", width: 40, dataIndex: 'assetName', sortable: true },
			{ header: "Dept", width: 5, dataIndex: 'dept', sortable: true },
			{ header: "AssetGroup", width: 40, dataIndex: 'domain', sortable: true },
			{ header: "STIG", width: 40, dataIndex: 'benchmarkId', sortable: true },
			{ header: "Rule", width: 25, dataIndex: 'ruleId', sortable: true },
			{ header: "Status", width: 50, dataIndex: 'statusStr', sortable: true },
			{ header: "Status changed", width: 50, dataIndex: 'ts', xtype: 'datecolumn', format: 'Y-m-d', sortable: true }
		],
		view: new Ext.grid.GridView({
			forceFit: true,
			emptyText: 'Please select a row in the table above.',
			deferEmptyText: false
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
					id: 'hostsByFindingGrid-' + collectionId + '-refreshBtn',
					iconCls: 'icon-refresh',
					tooltip: 'Reload this grid',
					disabled: true,
					width: 20,
					handler: function (btn) {
						hostGrid.getStore().reload();
					}
				}, {
					xtype: 'tbseparator'
				},
				{
					xtype: 'exportbutton',
					hasMenu: false,
					gridBasename: 'Assets (grid)',
					storeBasename: 'Assets (store)',
					iconCls: 'sm-export-icon',
					text: 'Export'
				},
					{
					xtype: 'tbfill'
				}, {
					xtype: 'tbseparator'
				}, {
					xtype: 'tbtext',
					id: 'hostsByFindingGrid-' + collectionId + '-totalText',
					text: '0 records',
					width: 80
				}]
		}),
		sm: new Ext.grid.RowSelectionModel({
			singleSelect: true
		}),
		listeners: {
			rowdblclick: {
				fn: function (grid, rowIndex, e) {
					Ext.getCmp('main-tabs').setActiveTab('tab-reviews');
					var r = grid.getStore().getAt(rowIndex);
					fakeLeaf = new Object();
					fakeLeaf.assetId = r.get('assetId');
					fakeLeaf.assetName = r.get('assetName');
					fakeLeaf.benchmarkId = r.get('benchmarkId');
					fakeLeaf.stigName = r.get('benchmarkId');
					fakeLeaf.revId = r.get('revId');
					addReview(fakeLeaf, r.get('ruleId'));

					//Ext.getCmp('groupGrid').getStore().load({params:{assetId:assetId, revId:revId}});
				}
			}
		}
	});

	var thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'findingsTab-' + collectionId,
		collectionId: collectionId,
		collectionName: collectionName,
		iconCls: 'sm-report-icon',
		title: 'Findings Summary (' + collectionName + ')',
		closable: true,
		layout: 'border',
		items: [findingsGrid, hostGrid]
	});
	thisTab.updateTitle = function () {
		this.setTitle(`${this.collectionName} : Findings`)
	}
	thisTab.updateTitle.call(thisTab)
	thisTab.show();

	findingsGrid.getStore().load({
		params: {
			aggregator: 'groupId'
		}
	})

}; //end addCompletionReport();
