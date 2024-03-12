/*
$Id: collectionReview.js 885 2018-02-20 16:26:08Z bmassey $
*/


async function addCollectionReview ( params ) {
	let { leaf, selectedRule, selectedAsset, treePath } = params
	try {
		var idAppend = '-' + leaf.collectionId + '-' + leaf.benchmarkId.replace(".","_");
		const tab = Ext.getCmp('main-tab-panel').getItem('collection-review-tab' + idAppend);
		if (tab) {
			tab.show()
			return
		}
	
	

		/******************************************************/
		// 'Global' colAssets array of objects for reviewsGrid
		/******************************************************/
		let apiCollection = await Ext.Ajax.requestPromise({
			responseType: 'json',
			url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}`,
			method: 'GET',
		  })
		let apiFieldSettings = apiCollection.settings.fields
		let apiStatusSettings = apiCollection.settings.status
	
		let apiAssets = await Ext.Ajax.requestPromise({
			responseType: 'json',
			url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/stigs/${leaf.benchmarkId}/assets`,
			method: 'GET',
		  })	
		let colAssets = apiAssets.map( colAsset => ({
			assetId: colAsset.assetId,
			assetName: colAsset.name,
			assetLabelIds: colAsset.assetLabelIds,
			result: null,
			detail: null,
			comment: null,
			autoResult: null,
			userId: null,
			username: null,
			ts: null,
			status: null
		}))

		/******************************************************/
		// START Group Grid
		/******************************************************/
		var groupFields = Ext.data.Record.create([
			{	
				name:'oCnt',
				type: 'int',
				mapping: 'counts.results.fail'
			},{	
				name:'nfCnt',
				type: 'int',
				mapping: 'counts.results.pass'
			},{	
				name:'naCnt',
				type: 'int',
				mapping: 'counts.results.notapplicable'
			},{	
				name:'otherCnt',
				type: 'int',
				mapping: 'counts.results.other'
			},{	
				name:'approveCnt',
				type: 'int',
				mapping: 'counts.statuses.accepted'
			},{	
				name:'rejectCnt',
				type: 'int',
				mapping: 'counts.statuses.rejected'
			},{	
				name:'readyCnt',
				type: 'int',
				mapping: 'counts.statuses.submitted'
			},{	
				name:'groupId',
				type: 'string',
				sortType: sortGroupId
			},{	
				name:'ruleId',
				type: 'string'
			},{	
				name:'version',
				type: 'string'
			},{
				name:'groupTitle',
				type: 'string'
			},{
				name:'ruleTitle',
				type: 'string'
			},{
				name:'severity',
				type:'string'
			},{
				name: 'minTouchTs',
				type: 'date',
				mapping: 'timestamps.touchTs.min'
			},{
				name: 'maxTouchTs',
				type: 'date',
				mapping: 'timestamps.touchTs.max'
			}
		]);


		var groupStore = new Ext.data.JsonStore({
			proxy: new Ext.data.HttpProxy({
				url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/checklists/${leaf.benchmarkId}/${leaf.revisionStr}`,
				method: 'GET'
			}),
			root: '',
			fields: groupFields,
			idProperty: 'ruleId',
			sortInfo: {
				field: 'groupId',
				direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
			},
			listeners: {
				load: function (store,records,options) {
					var ourGrid = groupGrid;
					
					// Preselection
					if (options.preselect !== undefined) {
						if (options.preselect.ruleId !== undefined) {
							var index = store.find('ruleId',options.preselect.ruleId);
							ourGrid.getSelectionModel().selectRow(index);
							ourGrid.getView().focusRow(index);
						} else {
							ourGrid.getSelectionModel().selectFirstRow();
						}
					} else {
						ourGrid.getSelectionModel().selectFirstRow();
					}
					// Filter the store
					filterGroupStore()
					
					groupGrid?.statSprites?.setText(getGroupStatsString(store))
				},
				clear: function(){
					groupGrid?.statSprites?.setText(getGroupStatsString(store))
				},
				update: function(store) {
					groupGrid?.statSprites?.setText(getGroupStatsString(store))
				},
				datachanged: function(store) {
					groupGrid?.statSprites?.setText(getGroupStatsString(store))
				}
			}
		});

		/******************************************************/
		// Group grid menus
		/******************************************************/

		function groupRuleColHandler (item) {
			const {idProp, titleProp} = item.colProps
			const cm = groupGrid.getColumnModel()
			const colNames = ['groupId','groupTitle','ruleId','ruleTitle']
			const cols = {}
			groupGrid.titleColumnDataIndex = titleProp
			groupGrid.autoExpandColumn = titleProp + idAppend
			for (const colName of colNames) {
				const index = cm.findColumnIndex(colName)
				const hide = colName !== idProp && colName !== titleProp
				cm.setHidden(index, hide)
			}
			groupGrid.getView().autoExpand()
		}
		var groupChecklistMenu = new Ext.menu.Menu({
			id: 'groupChecklistMenu' + idAppend,
			items: [
				{
					text: 'Displayed title',
					hideOnClick: false,
					menu: {
						items: [ 
							{
								text: 'Group ID and Rule title',
								colProps: {idProp: 'groupId', titleProp: 'ruleTitle'},
								checked: true,
								group: 'titleType' + idAppend,
								handler: groupRuleColHandler
							},
							{
								text: 'Group ID and Group title',
								colProps: {idProp: 'groupId', titleProp: 'groupTitle'},
								checked: false,
								group: 'titleType' + idAppend,
								handler: groupRuleColHandler
							},
							{
								text: 'Rule ID and Rule title',
								colProps: {idProp: 'ruleId', titleProp: 'ruleTitle'},
								checked: false,
								group: 'titleType' + idAppend,
								handler: groupRuleColHandler
							}
						]
					}
				}
				,{ 
					text: 'Export result archive',
					disabled: false,
					iconCls: 'sm-export-icon',
					hideOnClick: false,
					menu: {
						items: [ 
							{
								text: 'CKL (STIG Viewer v2)',
								iconCls: 'sm-export-icon',
								tooltip: 'Download an archive with results in DISA STIG Viewer format for each asset in the collection',
								handler: function () {
									const checklists = apiAssets.map( asset => ({
										assetId: asset.assetId,
										stigs: [
											{
												benchmarkId:leaf.benchmarkId,
												revisionStr: groupGrid.sm_revisionStr
											}
										]
									}))
									SM.Exports.exportArchiveStreaming({
										format: 'ckl-mono',
										collectionId: leaf.collectionId,
										checklists
									})
								}
							},
							{
								text: 'CKLB (STIG Viewer v3)',
								iconCls: 'sm-export-icon',
								tooltip: 'Download an archive with results in DISA STIG Viewer v3 format for each asset in the collection',
								handler: function () {
									const checklists = apiAssets.map( asset => ({
										assetId: asset.assetId,
										stigs: [
											{
												benchmarkId:leaf.benchmarkId,
												revisionStr: groupGrid.sm_revisionStr
											}
										]
									}))
									SM.Exports.exportArchiveStreaming({
										format: 'cklb-mono',
										collectionId: leaf.collectionId,
										checklists
									})
								}
							},
							{
								text: 'XCCDF',
								iconCls: 'sm-export-icon',
								tooltip: 'Download an archive with results in XCCDF format for each asset in the collection',
								handler: function () {
									const checklists = apiAssets.map( asset => ({
										assetId: asset.assetId,
										stigs: [
											{
												benchmarkId:leaf.benchmarkId,
												revisionStr: groupGrid.sm_revisionStr
											}
										]
									}))
									SM.Exports.exportArchiveStreaming({
										format: 'xccdf',
										collectionId: leaf.collectionId,
										checklists
									})
								}
							}
						]
					}
				},
				'-'
			]
		});
		

		/******************************************************/
		// Group grid statistics string
		/******************************************************/
		function getGroupStatsString (store) {
			const assetCount = apiAssets.length
			const totalChecks = store.getCount()
			const stats = store.data.items.reduce((a, c) => {
				for (const prop in a) {
					a[prop] += c.data[prop]
				}
				return a
			}, {
				approveCnt: 0,
				naCnt: 0,
				nfCnt: 0,
				oCnt: 0,
				otherCnt: 0,
				readyCnt: 0,
				rejectCnt: 0
			})
			const spriteGroups = []


			spriteGroups.push(`<span class="sm-review-sprite sm-review-sprite-asset" ext:qtip="Assets">${assetCount}</span> <span class="sm-review-sprite sm-assessment-icon" ext:qtip="Required assessments">${totalChecks*assetCount}</span>`)
			
			spriteGroups.push(
				[
					`${stats.oCnt ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Open"><span class="sm-result-fail" style="font-weight:bolder;">O </span>${stats.oCnt}</span>` : ''}`,
					`${stats.nfCnt ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not a Finding"><span class="sm-result-pass" style="font-weight:bolder;">NF </span>${stats.nfCnt}</span>` : ''}`,
					`${stats.naCnt ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not Applicable"><span class="sm-result-na" style="font-weight:bolder;">NA </span>${stats.naCnt}</span>` : ''}`,
					`${stats.otherCnt ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not Reviewed or has a non-compliance result such as informational"><span class="sm-result-nr" style="font-weight:bolder;">NR+ </span>${stats.otherCnt}</span>` : ''}`
				].filter(Boolean).join(' ')
			)
			
			spriteGroups.push(
				[
					`${stats.readyCnt ? `<span class="sm-review-sprite sm-review-sprite-stat-submitted" ext:qtip="Submitted">${stats.readyCnt}</span>` : ''}`,
					`${stats.rejectCnt ? `<span class="sm-review-sprite sm-review-sprite-stat-rejected" ext:qtip="Rejected">${stats.rejectCnt}</span>` : ''}`,
					`${stats.approveCnt ? `<span class="sm-review-sprite sm-review-sprite-stat-accepted" ext:qtip="Accepted">${stats.approveCnt}</span>` : ''}`
				].filter(Boolean).join(' ')
			)
			
			return spriteGroups.filter(Boolean).join('<span class="sm-xtb-sep"></span>')
		}

		/******************************************************/
		// The group grid
		/******************************************************/
		const groupExportBtn = new Ext.ux.ExportButton({
			hasMenu: false,
			exportType: 'grid',
			gridBasename: `${leaf.benchmarkId}`,
			iconCls: 'sm-export-icon',
			text: 'CSV'
		})

		var groupGrid = new Ext.grid.GridPanel({
			stateful: true,
			stateId: `collection-review-grid-${leaf.collectionId}-${leaf.benchmarkId}`,
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
			border: false,
			region: 'north',
			sm_benchmarkId: leaf.benchmarkId,
			sm_revisionStr: leaf.revisionStr,
			filterState: 'All',
			title: 'Checklist',
			split:true,
			titleColumnDataIndex: 'ruleTitle', // STIG Manager defined property
			//collapsible: true,
			store: groupStore,
			stripeRows:true,
			listeners: {
				afterrender: {
					fn: function (grid) {
						var test = '1';
					}
				}
			},
			sm: new Ext.grid.RowSelectionModel ({
				singleSelect: true,
				listeners: {
					rowselect: {
						fn: function(sm,index,record) {
							handleGroupSelectionForCollection(record, idAppend, leaf, groupGrid.sm_benchmarkId, groupGrid.sm_revisionStr); // defined below
						}
					}
				}
			}),
			view: new SM.ColumnFilters.GridView({
				forceFit:false,
				emptyText: '',
				// These listeners keep the grid in the same scroll position after the store is reloaded
				holdPosition: true, // HACK to be used with override
				lastHide: new Date(),
				deferEmptyText:false,
				listeners: {
					filterschanged: function (view, item, value) {
						groupStore.filter(view.getFilterFns())
						const statusText = getGroupStatsString(groupStore)
						groupGrid.statSprites?.setText(statusText)
					}
				},		

				onColumnSplitterMoved : function(cellIndex, width) {
					// override that does NOT set userResized and calls autoExpand()
					// this.userResized = true;
					this.grid.colModel.setColumnWidth(cellIndex, width, true);
	
					if (this.forceFit) {
							this.fitColumns(true, false, cellIndex);
							this.updateAllColumnWidths();
					} else {
							this.updateColumnWidth(cellIndex, width);
							this.syncHeaderScroll();
					}
					this.grid.fireEvent('columnresize', cellIndex, width);
					this.autoExpand()
				}
			}),
			columns: [
				{ 	
					id:'cat' + idAppend,
					header: "CAT", 
					width: 44,
					align: 'left',
					dataIndex: 'severity',
					fixed: true,
					sortable: true,
					renderer: renderSeverity,
					filter: {
						type: 'values',
						comparer: SM.ColumnFilters.CompareFns.severity,
						renderer: SM.ColumnFilters.Renderers.severity
					}	
				},
				{ 	
					id:'version' + idAppend,
					header: "STIG Id",
					width: 105,
					dataIndex: 'version',
					sortable: true,
					hidden: true,
					hideable: true,
					align: 'left',
					renderer: (v, attrs) => {
						attrs.css = 'sm-direction-rtl'
						return v
					},	
					filter: {
						type: 'string'
					}	
				},
				{ 	
					id:'groupId' + idAppend,
					header: "Group",
					width: 85,
					dataIndex: 'groupId',
					sortable: true,
					hidden: false,
					hideable: false,
					align: 'left',
					filter: {
						type: 'string'
					}	
				},
				{ 	
					id:'ruleId' + idAppend,
					header: "Rule Id",
					width: 105,
					dataIndex: 'ruleId',
					sortable: true,
					hidden: true,
					hideable: false,
					align: 'left',
					filter: {
						type: 'string'
					}	
				},
				{ 
					id:'groupTitle' + idAppend,
					header: "Group Title",
					width: 80,
					dataIndex: 'groupTitle',
					renderer: columnWrap,
					hidden: true,
					hideable: false,
					sortable: true,
					filter: {
						type: 'string'
					}	
				},
				{ 
					id:'ruleTitle' + idAppend,
					header: "Rule Title",
					width: 80,
					dataIndex: 'ruleTitle',
					renderer: columnWrap,
					hidden: false,
					hideable: false,
					sortable: true,
					filter: {
						type: 'string'
					}	
				},
				{
					id: 'minTouchTs' + idAppend,
					header: 'Oldest',
					fixed: true,
					hidden: true,
					width: 64,
					align: 'center',
					dataIndex: 'minTouchTs',
					sortable: true,
					renderer: renderDurationToNow
				},
				{
					id: 'maxTouchTs' + idAppend,
					header: 'Newest',
					fixed: true,
					hidden: true,
					width: 64,
					align: 'center',
					dataIndex: 'maxTouchTs',
					sortable: true,
					renderer: renderDurationToNow
				},
				{ 	
					id:'oCnt' + idAppend,
					header: '<div class="sm-result-fail" style="font-weight:bolder;" exportvalue="O">O</div>', 
					width: 40,
					align: 'center',
					dataIndex: 'oCnt',
					renderer:renderOpen,
					fixed: true,
					sortable: true
				},
				{ 	
					id:'nfCnt' + idAppend,
					header: '<div class="sm-result-pass" style="font-weight:bolder;" exportvalue="NF">NF</div>', 
					width: 40,
					align: 'center',
					renderer:renderCounts,
					dataIndex: 'nfCnt',
					fixed: true,
					sortable: true
				},
				{ 	
					id:'naCnt' + idAppend,
					header: '<div class="sm-result-na" style="font-weight:bolder;" exportvalue="NA">NA</div>', 
					width: 40,
					align: 'center',
					renderer:renderCounts,
					dataIndex: 'naCnt',
					fixed: true,
					sortable: true
				},
				{ 	
					id:'otherCnt' + idAppend,
					header: '<div class="sm-result-nr" style="font-weight:bolder;" exportvalue="NR+">NR+</div>', 
					width: 44,
					align: 'center',
					renderer:renderOpen,
					dataIndex: 'otherCnt',
					fixed: true,
					sortable: true
				},
				{ 	
					id:'readyCnt' + idAppend,
					header: '<img src=img/ready-16.png width=12 height=12 exportvalue="Submitted">', 
					width: 40,
					align: 'center',
					dataIndex: 'readyCnt',
					fixed: true,
					renderer:renderStatusCounts,
					sortable: true
				},
				{ 	
					id:'rejectCnt' + idAppend,
					header: '<img src=img/rejected-16.png width=12 height=12 exportvalue="Rejected">', 
					width: 40,
					align: 'center',
					dataIndex: 'rejectCnt',
					fixed: true,
					renderer:renderStatusCounts,
					sortable: true
				},
				{ 	
					id:'approveCnt' + idAppend,
					header: '<img src=img/star.svg width=12 height=12 exportvalue="Approved">', 
					width: 40,
					align: 'center',
					dataIndex: 'approveCnt',
					fixed: true,
					renderer:renderStatusCounts,
					sortable: true
				}
			],
			autoExpandColumn:'ruleTitle' + idAppend,
			//width: '33%',
			height: '50%',
			loadMask: {msg: ''},
			tbar: new Ext.Toolbar({
				items: [
					{
						xtype: 'tbbutton',
						iconCls: 'sm-checklist-icon',  // <-- icon
						text: 'Checklist',
						menu: groupChecklistMenu
					}
				]
			}),
			bbar: [
				{
					xtype: 'tbbutton',
					iconCls: 'icon-refresh',
					tooltip: 'Reload this grid',
					width: 20,
					handler: function(btn){
						groupGrid.getStore().reload();
						Ext.getCmp('content-panel' + idAppend).update('')
						reviewsGrid.getStore().removeAll(true);
						reviewsGrid.getView().refresh();
					}
				},
				{
					xtype: 'tbseparator'
				},
				groupExportBtn,
				'->',
				{
					xtype: 'tbtext',
					ref: '../statSprites'
				},
				'-',
				new SM.RowCountTextItem({store:groupStore, noun:'rule', iconCls: 'sm-stig-icon'})
			]
		});
		
		var handleRevisionMenu = function (item, eventObject) {
			let store = groupGrid.getStore()
			store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/checklists/${leaf.benchmarkId}/${item.revisionStr}`, true)
			store.load();
			loadRevisionMenu(leaf.benchmarkId, item.revisionStr, idAppend)
			groupGrid.sm_revisionStr = item.revisionStr
		};
		
		async function loadRevisionMenu(benchmarkId, activeRevisionStr, idAppend) {
			try {
			let revisions = await Ext.Ajax.requestPromise({
				responseType: 'json',
				url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions`,
				method: 'GET'
			})
			let revisionObject = getRevisionObj(revisions, activeRevisionStr, idAppend)
			if (Ext.getCmp('revision-menuItem' + idAppend) === undefined) {
				Ext.getCmp('groupChecklistMenu' + idAppend).addItem(revisionObject.menu);
			}
			groupGrid.setTitle(SM.he(revisionObject.activeRevisionLabel));
			}
			catch (e) {
				SM.Error.handleError(e)
			}
		}
		
		let getRevisionObj = function (revisions, activeRevisionStr, idAppend) {
			let returnObject = {}
			var menu = {
			id: 'revision-menuItem' + idAppend,
			text: 'Revisions',
			hideOnClick: false,
			menu: {
				items: []
			}
			};
			for (var i = 0; i < revisions.length; i++) {
			let r = revisions[i]
			let benchmarkDateJs = new Date(r.benchmarkDate)
			let item = {
				id: `revision-submenu${r.benchmarkId}-${r.version}-${r.release}${idAppend}`,
				text: SM.he(`Version ${r.version} Release ${r.release} (${benchmarkDateJs.format('j M Y')})`),
				// revId: `${r.benchmarkId}-${r.version}-${r.release}`,
				revisionStr: r.revisionStr,
				group: 'revision-submenu-group' + idAppend,
				handler: handleRevisionMenu
			}
			if (item.revisionStr == activeRevisionStr || (activeRevisionStr === 'latest' && i === 0)) {
				item.checked = true;
				returnObject.activeRevisionLabel = item.text;
			} else {
				item.checked = false;
			}
			menu.menu.items.push(item);
			}
			returnObject.menu = menu;
			return returnObject;
		};
			
		function filterGroupStore () {
			groupStore.filter(groupGrid.getView().getFilterFns())


		}
	/******************************************************/
	// END Group Grid
	/******************************************************/

	/******************************************************/
	// START Reviews Panel
	/******************************************************/
		function getReviewsStatsString (store) {
			const stats = store.data.items.reduce((a, c) => {
				switch (c.data.result) {
					case 'fail':
						a.fail++
						break
					case 'pass':
						a.pass++
						break
					case 'notapplicable':
						a.notapplicable++
						break
					default:
						a.other++
						break
				}
				if (c.data.engineResult) a[c.data.engineResult]++
				if (c.data.status) a[c.data.status]++
				return a
			}, {
				pass: 0,
				fail: 0,
				notapplicable: 0,
				other: 0,
				saved: 0,
				submitted: 0,
				rejected: 0,
				accepted: 0,
				override: 0,
				manual: 0,
				engine: 0
			})
			const spriteGroups = []

			spriteGroups.push(
				[
					`${stats.manual ? `<span class="sm-review-sprite sm-engine-manual-icon" ext:qtip="Manual">${stats.manual}</span>` : ''}`,
					`${stats.engine ? `<span class="sm-review-sprite sm-engine-result-icon" ext:qtip="Result engine">${stats.engine}</span>` : ''}`,
					`${stats.override ? `<span class="sm-review-sprite sm-engine-override-icon" ext:qtip="Overriden result engine">${stats.override}</span>` : ''}`
				].filter(Boolean).join(' '))
			
			spriteGroups.push(
				[
					`${stats.saved ? `<span class="sm-review-sprite sm-review-sprite-stat-saved" ext:qtip="Saved">${stats.saved}</span>` : ''}`,
					`${stats.submitted ? `<span class="sm-review-sprite sm-review-sprite-stat-submitted" ext:qtip="Submitted">${stats.submitted}</span>` : ''}`,
					`${stats.rejected ? `<span class="sm-review-sprite sm-review-sprite-stat-rejected" ext:qtip="Rejected"> ${stats.rejected}</span>` : ''}`,
					`${stats.accepted ? `<span class="sm-review-sprite sm-review-sprite-stat-accepted" ext:qtip="Accepted">${stats.accepted}</span>` : ''}`
				].filter(Boolean).join(' '))

			spriteGroups.push(
				[
					`${stats.fail ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Open"><span class="sm-result-fail" style="font-weight:bolder;">O </span>${stats.fail}</span>` : ''}`,
					`${stats.pass ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not a Finding"><span class="sm-result-pass" style="font-weight:bolder;">NF </span>${stats.pass}</span>` : ''}`,
					`${stats.notapplicable ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not Applicable"><span class="sm-result-na" style="font-weight:bolder;">NA </span> ${stats.notapplicable}</span>` : ''}`,
					`${stats.other ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not Reviewed or has a non-compliance result such as informational"><span class="sm-result-nr" style="font-weight:bolder;">NR+ </span>${stats.other}</span>` : ''}`
				].filter(Boolean).join(' '))

			return spriteGroups.filter(Boolean).join('<span class="sm-xtb-sep"></span>')

		}
		function engineResultConverter (v,r) {
			const conv = r.resultEngine ? 
				(r.resultEngine.overrides?.length ? 'override' : 'engine') : 
				(r.result ? 'manual' : '')
				return conv
		}

		var reviewsFields = Ext.data.Record.create([
			{	
				name:'assetId',
				type: 'string'
			},
			{	
				name:'assetName',
				type: 'string'
			},
			{	
				name:'assetLabelIds'
			},
			{
				name:'ruleId',
				type: 'string'
			},
			{
				name:'result',
				type: 'string'
			},
	    'resultEngine',
		'touchTs',
			{
				name: 'engineResult',
				convert: engineResultConverter
			},
			{
				name:'detail',
				type:'string'
			},
			{
				name:'comment',
				type:'string'
			},
			{
				name:'autoResult',
				type:'boolean'
			},
			{
				name:'userId',
				type:'string'
			},
			{
				name:'username',
				type:'string'
			},
			{
				name:'ts',
				type:'date',
				dateFormat: 'Y-m-d H:i:s'
			},
			{
				name:'status',
				type:'string',
				mapping: 'status?.label'
			}
		]);
		
		var reviewsStore = new Ext.data.JsonStore({
			storeId: 'reviewsStore' + idAppend,
			sortInfo: {
				field: 'assetName',
				direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
			},

			root: '',
			fields: reviewsFields,
			listeners: {
				save: function ( store, batch, data ) {
					setReviewsGridButtonStates()
					reviewsGrid?.statSprites?.setText(getReviewsStatsString(store))
					Ext.getBody().unmask();
				},
				datachanged: function (store) {
					reviewsGrid?.statSprites?.setText(getReviewsStatsString(store))
				}
			},
			idProperty: 'assetId'
		});

		const sm = new Ext.grid.CheckboxSelectionModel ({
			singleSelect: false,
			checkOnly: false,
			// override selectRow to suspend events when clearing existing selections > 1
			selectRow: function (index, keepExisting, preventViewNotify) {
				if (this.isLocked() || (index < 0 || index >= this.grid.store.getCount()) || (keepExisting && this.isSelected(index))) {
					return;
				}
				var r = this.grid.store.getAt(index);
				if (r && this.fireEvent('beforerowselect', this, index, keepExisting, r) !== false) {
					if (!keepExisting || this.singleSelect) {
						if (this.selections.length > 1) {
							this.suspendEvents(false);
							this.clearSelections();
							this.resumeEvents();
						}
						else {
							this.clearSelections();
						}
					}
					this.selections.add(r);
					this.last = this.lastActive = index;
					if (!preventViewNotify) {
						this.grid.getView().onRowSelect(index);
					}
					if (!this.silent) {
						this.fireEvent('rowselect', this, index, r);
						this.fireEvent('selectionchange', this);
					}
				}
			},
			listeners: {
				selectionchange: function (sm) {
					if (sm.getCount() == 1) { //single row selected
						historyData.grid.enable()
						loadResources(sm.getSelected().data.assetId, sm.grid.currentRuleId)
						batchEditBtn.disable()
					} else {
						historyData.store.removeAll()
						historyData.grid.disable()
						attachmentsGrid.getStore().removeAll()						
						batchEditBtn.enable()

					}
					setReviewsGridButtonStates()
					SM.SetCheckboxSelModelHeaderState(sm)
				}
			}
		})
		
		var reviewsCm = new Ext.grid.ColumnModel({
			columns: [
				sm,
	      {
					header: '<div exportvalue="Engine" class="sm-engine-result-icon"></div>',
					width: 24,
					fixed: true,
					dataIndex: 'engineResult',
					sortable: true,
					renderer: renderEngineResult,
					filter: {
						type: 'values',
						renderer: SM.ColumnFilters.Renderers.engineResult
					} 
				},
				{ 	
					id:'status' + idAppend,
					header: "Status", 
					align: 'center',
					width: 50,
					fixed: true,
					dataIndex: 'status',
					sortable: true,
					renderer: renderStatuses,
					filter: {
						type: 'values',
						renderer: SM.ColumnFilters.Renderers.status
					} 
				},
				{ 	
					id:'target' + idAppend,
					header: "Asset",
					width: 50,
					//fixed: true,
					dataIndex: 'assetName',
					sortable: true,
					align: 'left',
					filter: {
						type: 'string'
					}
				},
				{
					header: "Labels",
					width: 50,
					dataIndex: 'assetLabelIds',
					sortable: false,
					filter: {
							type: 'values', 
							collectionId: apiCollection.collectionId,
							renderer: SM.ColumnFilters.Renderers.labels
					},
					renderer: function (value, metadata) {
							const labels = []
							for (const labelId of value) {
									const label = SM.Cache.CollectionMap.get(apiCollection.collectionId).labelMap.get(labelId)
									if (label) labels.push(label)
							}
							labels.sort((a,b) => a.name.localeCompare(b.name))
							metadata.attr = 'style="white-space:nowrap;text-overflow:clip;"'
							return SM.Collection.LabelArrayTpl.apply(labels)
					}
				},
				{ 
					id:'Result' + idAppend,
					header: '<span exportvalue="Result">Result<i class= "fa fa-question-circle sm-question-circle"></i></span>',
					width: 70,
					fixed: true,
					dataIndex: 'result',
					editor: new Ext.form.ComboBox({
						id: 'reviewsGrid-editor-resultCombo' + idAppend,
						mode: 'local',
						forceSelection: true,
						autoSelect: true,
						editable: false,
						store: new Ext.data.SimpleStore({
							fields: ['result', 'resultStr'],
							data: [
								['pass', 'NF'],
								['notapplicable', 'NA'],
								['fail', 'O'],
								['informational', 'I'],
								['notchecked', 'NR']
							]
						}),
						valueField:'result',
						displayField:'resultStr',
						monitorValid: false,
						listeners: {
							select: function (combo,record,index) {
								if (combo.startValue !== combo.value ) {
									combo.fireEvent("blur");
								} 
								else {
									console.log('No Change')
								}
							}
						},
						triggerAction: 'all'
					}),
					renderer: renderResult,
					sortable: true,
					filter: {
						type: 'values',
						renderer: SM.ColumnFilters.Renderers.result
					}
				},
				{ 	
					id:'Detail' + idAppend,
					header: '<span exportvalue="Detail">Detail<i class= "fa fa-question-circle sm-question-circle"></i></span>', 
					width: 100,
					dataIndex: 'detail',
					renderer: function (v) {
						v = v?.length > SM.TruncateLimit ? v.slice(0,SM.TruncateLimit) + '...' : SM.styledEmptyRenderer(v)
						return v
					},
					sortable: true,
					filter: {
						type: 'string'
					},
					editor: new Ext.form.TextArea({
						id: 'reviewsGrid-editor-detail' + idAppend,
						//height: 150
						grow: true,
						growMax: 200,
						listeners: {
							// focus and blur handlers enable/disable IE workaround
							focus: function (cmp) {
								reviewsGrid.getEl().set({
									onselectstart: 'return true;'
								});
							},
							blur: function (cmp) {
								reviewsGrid.getEl().set({
									onselectstart: 'return false;'
								});
							},
							render: function (ta) {
								ta.el.dom.maxLength = 32767
							}
						}
					})
				},
				{ 	
					id:'Comment' + idAppend,
					header: '<span exportvalue="Comment">Comment<i class= "fa fa-question-circle sm-question-circle"></i></span>', 
					width: 100,
					dataIndex: 'comment',
					renderer: function (v) {
						v = v?.length > SM.TruncateLimit ? v.slice(0,SM.TruncateLimit) + '...' : SM.styledEmptyRenderer(v)
						return v
					},
					filter: {
						type: 'string'
					},
					editor: new Ext.form.TextArea({
						id: 'reviewsGrid-editor-comment' + idAppend,
						grow: true,
						growMax: 200,
						listeners: {
							// focus and blur handlers enable/disable IE workaround
							focus: function (cmp) {
								reviewsGrid.getEl().set({
									onselectstart: 'return true;'
								});
							},
							blur: function (cmp) {
								reviewsGrid.getEl().set({
									onselectstart: 'return false;'
								});
							},
							render: function (ta) {
								ta.el.dom.maxLength = 32767
							}
						}
					}),
					sortable: true
				},
				{ 	
					id:'userName' + idAppend,
					header: "User", 
					width: 100,
					dataIndex: 'username',
					fixed: 50,
					sortable: true,
					filter: {
						type: 'values'
					}
				},
				{
					id: 'touchTs' + idAppend,
					header: '<div exportvalue="touchTs" class="sm-history-icon" ext:qtip="Last action"></div>',
					fixed: true,
					width: 48,
					align: 'center',
					dataIndex: 'touchTs',
					sortable: true,
					renderer: renderDurationToNow
				  }
			
			],
			isCellEditable: function(col, row) {
				var record = reviewsStore.getAt(row);

				if (!record.data.result  && this.getDataIndex(col) !== 'result') { // review is not created yet
					return false;
				}

				switch (this.getDataIndex(col)) {
					case 'result':
						return true
					case 'detail':
						if (apiFieldSettings.detail.enabled === 'always') {
							return true;
						}
						if (apiFieldSettings.detail.enabled === 'findings') {
							return record.data.result === 'fail'
						} 
					case 'comment':
						if (apiFieldSettings.comment.enabled === 'always') {
							return true;
						}
						if (apiFieldSettings.comment.enabled === 'findings') {
							return record.data.result === 'fail'
						} 
				}

				return Ext.grid.ColumnModel.prototype.isCellEditable.call(this, col, row);
			}
		});

		function showAcceptBtn () {
			const collectionGrant = curUser.collectionGrants.find(i => i.collection.collectionId === leaf.collectionId).accessLevel
			const grantCondition =  collectionGrant >= apiStatusSettings.minAcceptGrant
			const settingsCondition = apiStatusSettings.canAccept
			return grantCondition && settingsCondition 
		}

		const reviewsExportBtn = new Ext.ux.ExportButton({
			hasMenu: false,
			exportType: 'grid',
			gridBasename: `${leaf.benchmarkId}-Rule`,
			iconCls: 'sm-export-icon',
			text: 'CSV'
		})

		const batchEditBtn = new Ext.Button({
			disabled: true,
			iconCls: 'icon-edit',
			id: 'reviewsGrid-batchButton' + idAppend,
			text: 'Batch edit',
			handler: function (btn) {
				handleBatchEdit(btn.findParentByType('grid'))
			}
		})

		const lineIncrementBtn = new Ext.Button({
			iconCls: 'sm-line-height-up',
			tooltip: 'Increase row height',
			handler: function (btn) {
				const newLineClamp = reviewsGrid.view.lineClamp + 1
				const newRowHeight = (15*newLineClamp)+6
				reviewsGrid.view.changeRowHeight(newRowHeight, newLineClamp)
				lineDecrementBtn.setDisabled(newLineClamp <= 1)
				btn.setDisabled(newLineClamp >= 10)
			}
		})
		const lineDecrementBtn = new Ext.Button({
			iconCls: 'sm-line-height-down',
			tooltip: 'Decrease row height',
			handler: function (btn) {
				const newLineClamp = reviewsGrid.view.lineClamp - 1
				const newRowHeight = (15*newLineClamp)+6
				reviewsGrid.view.changeRowHeight(newRowHeight, newLineClamp)
				btn.setDisabled(newLineClamp <= 1)
				lineIncrementBtn.setDisabled(newLineClamp >= 10)
			}
		})

		var reviewsGrid = new Ext.grid.EditorGridPanel({
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.adjacent },
			border: false,
			region: 'center',
			layout: 'fit',
			id: 'reviewsGrid' + idAppend,
			title: 'Reviews',
			store: reviewsStore,
			stripeRows:true,
			colModel: reviewsCm,
			updateGroupStore: function (reviewsGrid) {
				let reviewRecords = reviewsGrid.getStore().getRange()
				let checklistRecord = reviewsGrid.currentChecklistRecord
				let counts = {
					oCnt: 0,
					nfCnt: 0,
					naCnt: 0,
					otherCnt: 0,
					approveCnt: 0,
					rejectCnt: 0,
					readyCnt: 0
				}
				for (const record of reviewRecords) {
					switch (record.data.result) {
						case 'pass':
							counts.nfCnt++
							break
						case 'fail':
							counts.oCnt++
							break
						case 'notapplicable':
							counts.naCnt++
							break
						default:
							counts.otherCnt++
							break
					}
					switch (record.data.status) {
						case 'submitted':
							counts.readyCnt++
							break
						case 'accepted':
							counts.approveCnt++
							break
						case 'rejected':
							counts.rejectCnt++
							break
					}
				}
				for (const key of Object.keys(counts)) {
					checklistRecord.data[key] = counts[key]
				}
				checklistRecord.commit()				
			},
			sm,
			listeners: {
				// fix weird problem shift-selecting grid rows in IE
				// have to override this if the textarea editors are focused
				afterrender: function (cmp) {
					cmp.getEl().set({
						onselectstart: 'return false;'
					});
				},
				afteredit: async function (e) {
					try {
						let jsonData = {}, apiReview
						if (e.record.data.status) {
							jsonData[e.field] = e.value
							// unset autoResult if the result has changed
							if (e.field === 'result' && e.originalValue !== e.value) {
								if (e.record.data.resultEngine) {
									jsonData.resultEngine = null
								}
								if (e.record.data.autoResult) {
									jsonData.autoResult = false
								}
							}
							apiReview = await Ext.Ajax.requestPromise({
								responseType: 'json',
								url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${e.record.data.assetId}/${e.grid.currentRuleId}`,
								method: 'PATCH',
								jsonData
							})
						}
						else {
							// new review
							jsonData = {
								result: e.record.data.result,
								detail: null,
								comment: null,
								autoResult: false,
								status: 'saved'
							}
							apiReview = await Ext.Ajax.requestPromise({
								responseType: 'json',
								url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${e.record.data.assetId}/${e.grid.currentRuleId}`,
								method: 'PUT',
								jsonData
							})
						}

						// e.grid.getStore().loadData(apiReview, true)
						const f = e.grid.store.reader.recordType.prototype.fields
						const fi = f.items
						const fl = f.length
						const newData = e.grid.store.reader.extractValues(apiReview, fi, fl)
						e.record.data = newData
						e.record.commit()

						// hack to reselect the record for setReviewsGridButtonStates()
						e.grid.getSelectionModel().onRefresh()
						loadResources(e.record.data.assetId, e.grid.currentRuleId)

						setReviewsGridButtonStates()
		
						e.grid.updateGroupStore(e.grid)
	
					}
					catch(e) {
						SM.Error.handleError(e)
					}


				},
				keydown: SM.CtrlAGridHandler
			},
			view: new SM.ColumnFilters.GridViewBuffered({
				forceFit:true,
				holdPosition: true,
				autoFill:true,
				emptyText: 'No data to display.',
				deferEmptyText:false,
				// custom row height
				rowHeight: (15*3)+6,
				lineClamp: 3,
				borderHeight: 2,
				// render rows as they come into viewable area.
				scrollDelay: false,
				listeners: {
					filterschanged: function (view, item, value) {
						reviewsStore.filter(view.getFilterFns())  
					},
					refresh: function (view) {
						// Setup the tooltips
						const columns = view.grid.getColumnModel().columns
						for( let x = 0; x < columns.length; x++ ) {
							// Look for colums with the FontAwesome class
							const tipEl = view.getHeaderCell(x).getElementsByClassName('fa')[0]
							if ( tipEl ) {
								const idPrefix = columns[x].id.split('-')[0]
								// idPrefix should be 'result', 'detail', or 'comment'
								new Ext.ToolTip({
									target: tipEl,
									showDelay: 0,
									dismissDelay: 0,
									autoWidth: true,
									tpl: SM[`${idPrefix}TipTpl`],
									data: apiFieldSettings[idPrefix.toLowerCase()] ?? {}
								}) 
							}
						}					
					}
				}
			}),
			// width: 300,
			tbar: new Ext.Toolbar({
				items: [
					{
						xtype: 'tbbutton',
						disabled: true,
						iconCls: 'sm-star-icon-16',
						id: 'reviewsGrid-approveButton' + idAppend,
						text: 'Accept',
						hidden: !showAcceptBtn(),
						handler: function (btn) {
							var selModel = reviewsGrid.getSelectionModel();
							handleStatusChange (reviewsGrid,selModel,'accepted');
						}
					},
					{
						xtype: 'tbspacer', 
						width: 10
					},
					{
						xtype: 'tbbutton',
						disabled: true,
						iconCls: 'sm-rejected-icon',
						id: 'reviewsGrid-rejectButton' + idAppend,
						text: 'Reject...',
						hidden: !showAcceptBtn(),
						handler: function (btn) {
							var selModel = reviewsGrid.getSelectionModel();
							handleStatusChange (reviewsGrid,selModel,'rejected');
						}
					},
					{
						xtype: 'tbseparator',
						hidden: !showAcceptBtn()
					},
					{
						xtype: 'tbbutton',
						disabled: true,
						icon: 'img/ready-16.png',
						id: 'reviewsGrid-submitButton' + idAppend,
						text: 'Submit',
						handler: function (btn) {
							var selModel = reviewsGrid.getSelectionModel();
							handleStatusChange (reviewsGrid,selModel,'submitted');
						}
					},
					{
						xtype: 'tbspacer', 
						width: 10
					},
					{
						xtype: 'tbbutton',
						disabled: true,
						iconCls: 'sm-disk-icon',
						id: 'reviewsGrid-unsubmitButton' + idAppend,
						text: 'Unsubmit',
						handler: function (btn) {
							var selModel = reviewsGrid.getSelectionModel();
							handleStatusChange (reviewsGrid,selModel,'saved');
						}
					},
					'-',
					batchEditBtn,
					'->',
					lineDecrementBtn,
					{xtype: 'tbspacer', width: 10},
					lineIncrementBtn
				]
			}),
			bbar: [
				reviewsExportBtn,
				'->',
				{
					xtype: 'tbtext',
					ref: '../statSprites'
				},
				'-',
				new SM.RowCountTextItem({store:reviewsStore, noun:'review', iconCls:'sm-assessment-icon'})
			],
			emptyText: 'No data to display'
		});

		reviewsGrid.on('beforeedit', beforeEdit, this );

		function onFieldSettingsChanged (collectionId, fieldSettings) {
			if (collectionId === apiCollection.collectionId) {
				apiFieldSettings = fieldSettings
				setReviewsGridButtonStates()
			}
		}
		SM.Dispatcher.addListener('statussettingschanged', onStatusSettingsChanged)
		function onStatusSettingsChanged (collectionId, statusSettings) {
			if (collectionId === apiCollection.collectionId) {
				apiStatusSettings = statusSettings
				setReviewsGridButtonStates()
			}
		}
		SM.Dispatcher.addListener('fieldsettingschanged', onFieldSettingsChanged)
	
		async function getContent(benchmarkId, revisionStr, ruleId, groupId) {
			try {
				// Content panel
				const contentPanel = Ext.getCmp('content-panel' + idAppend);
				const content = await Ext.Ajax.requestPromise({
					responseType: 'json',
					url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules/${ruleId}`,
					method: 'GET',
					params: {
						projection: ['detail','ccis','check','fix']
					}
				})
				contentPanel.update(content)
				contentPanel.setTitle('Rule for Group ' + SM.he(groupId));
			}
			catch (e) {
				SM.Error.handleError(e)
			}
		}

		async function getReviews(collectionId, record) {
			let reviewsGrid, maskTimer
			try {
				// Reviews grid
				reviewsGrid = Ext.getCmp('reviewsGrid' + idAppend);
				maskTimer = setTimeout(() => reviewsGrid.bwrap.mask(''), 150)
				let fetchedReviews = await Ext.Ajax.requestPromise({
					responseType: 'json',
					url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews`,
					method: 'GET',
					params: {
						rules: 'all',
						ruleId: record.data.ruleId,
					}
				})
				let fetchedReviewsLookup = {}
				for (const fetchedReview of fetchedReviews) {
					fetchedReviewsLookup[fetchedReview.assetId] = fetchedReview
				}
				let colReviews = colAssets.map(colAsset => {
					// Won't have a review.ruleId if there is no review for the asset yet
					if (!fetchedReviewsLookup[colAsset.assetId]) {
						return { ...colAsset, ...{ruleId: record.data.ruleId} }
					}
					else {
						return {...colAsset, ...fetchedReviewsLookup[colAsset.assetId]}
					}
				})
			
				reviewsGrid.getStore().loadData(colReviews)
				reviewsGrid.setTitle(`Reviews of ${SM.he(record.data.ruleId)}`)
				reviewsGrid.currentChecklistRecord = record
				reviewsGrid.currentRuleId = record.data.ruleId
				reviewsExportBtn.gridBasename = `${leaf.benchmarkId}-${record.data.ruleId}`
			}
			catch (e) {
				SM.Error.handleError(e)
			}
			finally {
				clearTimeout(maskTimer)
				reviewsGrid.bwrap.unmask()
			}
		}
		
		function handleGroupSelectionForCollection(record, idAppend, leaf, benchmarkId, revisionStr) {
			getContent(benchmarkId, revisionStr, record.data.ruleId, record.data.groupId)
			getReviews(leaf.collectionId, record)
			//when new group is selected, deselect rows from reviews grid (to make resources panel clear)
			reviewsGrid.getSelectionModel().clearSelections();
		}

		function isReviewComplete (result, rcomment, acomment) {
			if (!result) return false
			if (result !== 'pass' && result !== 'fail' && result !== 'notapplicable') return false
      if (apiFieldSettings.detail.required === 'always' && !rcomment) return false
      if (apiFieldSettings.detail.required === 'findings' 
        && result === 'fail'
        && !rcomment) return false
      if (apiFieldSettings.comment.required === 'always'
        && (!acomment)) return false
      if (apiFieldSettings.comment.required === 'findings'
        && result === 'fail'
        && (!acomment)) return false
      return true

		}

		function setReviewsGridButtonStates() {
			const sm = reviewsGrid.getSelectionModel();
			const approveBtn = Ext.getCmp('reviewsGrid-approveButton' + idAppend);
			const rejectBtn = Ext.getCmp('reviewsGrid-rejectButton' + idAppend);
			const submitBtn = Ext.getCmp('reviewsGrid-submitButton' + idAppend);
			const unsubmitBtn = Ext.getCmp('reviewsGrid-unsubmitButton' + idAppend);
			const resourcesTabPanel = Ext.getCmp('resources-tab-panel' + idAppend);

			const selections = sm.getSelections();
			const selLength = selections.length;
			let approveBtnEnabled = rejectBtnEnabled = submitBtnEnabled = unsubmitBtnEnabled = true;

			if (selLength === 0) {
				approveBtnEnabled = rejectBtnEnabled = submitBtnEnabled = unsubmitBtnEnabled = false
			}
			else if (selLength === 1) {
				const selection = selections[0]
				if (!selection.data.status) { // a review doesn't exist
					approveBtnEnabled = rejectBtnEnabled = submitBtnEnabled = unsubmitBtnEnabled = false
				}
				else {
					const status = selection.data.status
					switch (status) {
						case 'saved': // in progress
							if (isReviewComplete(
								selection.data.result,
								selection.data.detail,
								selection.data.comment
								)) {
									approveBtnEnabled = false
									rejectBtnEnabled = false
									submitBtnEnabled = true
									unsubmitBtnEnabled = false
				
							} else {
								approveBtnEnabled = false
								submitBtnEnabled = false
								unsubmitBtnEnabled = false
								rejectBtnEnabled = false
							}
							break
						case 'submitted':
							approveBtnEnabled = true
							submitBtnEnabled = false
							unsubmitBtnEnabled = true
							rejectBtnEnabled = true
							break
						case 'rejected':
							approveBtnEnabled = true
							submitBtnEnabled = true
							unsubmitBtnEnabled = true
							rejectBtnEnabled = true
							break
						case 'accepted':
							approveBtnEnabled = false
							submitBtnEnabled = false
							unsubmitBtnEnabled = true
							rejectBtnEnabled = false
							break
					}
				}
			} 
			else { // multiple selections
				const counts = {
					unsaved: 0,
					savedComplete:0,
					saved:0,
					submitted:0,
					rejected:0,
					accepted:0
				}
				for (i=0; i < selections.length; i++) {
					if (!selections[i].data.status) { // a review doesn't exist
						counts.unsaved++
						break
					}
					const status = selections[i].data.status
					if (status === 'saved') {
						if (isReviewComplete(
							selections[i].data.result,
							selections[i].data.detail,
							selections[i].data.comment
						)) {
							counts.savedComplete++
						} 
						else {
							counts.saved++
						}
					}
					else {
						counts[status]++
					}	
				}
				approveBtnEnabled = (counts.submitted || counts.rejected) && (!counts.unsaved && !counts.saved && !counts.savedComplete)  && (counts.accepted !== selLength)
				submitBtnEnabled = (counts.savedComplete || counts.submitted || counts.accepted || counts.rejected) && (!counts.unsaved && !counts.saved) && (counts.submitted !== selLength)
				unsubmitBtnEnabled = (counts.submitted || counts.accepted || counts.rejected) && (!counts.unsaved && !counts.saved)
				rejectBtnEnabled = counts.submitted && (!counts.unsaved && !counts.saved && !counts.savedComplete && !counts.accepted && !counts.rejected)
		
			}
			approveBtn.setDisabled(!approveBtnEnabled);
			rejectBtn.setDisabled(!rejectBtnEnabled);
			submitBtn.setDisabled(!submitBtnEnabled);
			unsubmitBtn.setDisabled(!unsubmitBtnEnabled);
		};

		async function handleBatchEdit(grid) {
			const records = grid.getSelectionModel().getSelections()
			if (!records.length) return
			const resultsSet = new Set(records.map( r => r.data.result ))
			let initialResult = null
			if (resultsSet.size === 1) {
				initialResult = records[0].data.result
			}

			const review = await SM.BatchReview.showDialog(apiFieldSettings, initialResult)
			const ruleIds = [grid.currentChecklistRecord.data.ruleId]
			const assetIds = []
			for (i = 0, l = records.length; i < l; i++) {
				if (review.resultEngine && review.result !== records[i].data.result) {
					review.resultEngine = null
				}
				assetIds.push(records[i].data.assetId)
			}
			const jsonData = {
				source: {
					review
				},
				assets: {
					assetIds
				},
				rules: {
					ruleIds
				}
			}

			grid.bwrap.mask(`Updating ${records.length} reviews`)
			try {
				await Ext.Ajax.requestPromise({
					responseType: 'json',
					url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews`,
					method: 'POST',
					jsonData
				})
			}
			catch (e) {
				SM.Error.handleError(e)
			}
			finally {
				grid.bwrap.unmask()
			}

			const record = groupGrid.getSelectionModel().getSelected()
			await getReviews(leaf.collectionId, record)
			
			// hack to reselect the records
			const sm =reviewsGrid.getSelectionModel()
			sm.onRefresh()
			sm.fireEvent('selectionchange', sm)

			grid.updateGroupStore(grid)
			setReviewsGridButtonStates()
		}

		function promptForStatusText () {
			return new Promise ((resolve, reject) => {
				const textArea = new Ext.form.TextArea({
					emptyText: 'Provide feedback explaining this rejection.',
					maxLength: 255,
					enableKeyEvents: true,
					listeners: {
						keyup: (field) => {
							if (field.isValid() && field.getValue().trim().length > 0) {
								submitBtn.enable()
							} 
							else {
								submitBtn.disable()
							}
						}
					}
				})
				const submitBtn = new Ext.Button({
					text: 'Reject with this feedback',
					action: 'reject',
					iconCls: 'sm-rejected-icon',
					disabled: true,
					handler
				})
				const cancelBtn = new Ext.Button(	{
					text: 'Cancel',
					action: 'cancel',
					handler
				})
				function handler (btn) {
					const value = textArea.getValue()
					if (btn.action === 'reject'){
						fpwindow.close()
						resolve(value)
					}
					else{
						fpwindow.close()
						reject()
					}
				}
				const fpwindow = new Ext.Window({
					title: `Reject Reviews`,
					modal: true,
					resizable: false,
					closable: false,
					width: 300,
					height: 200,
					layout: 'fit',
					plain: true,
					bodyStyle: 'padding:5px;',
					buttonAlign: 'right',
					items: [textArea],
					buttons: [cancelBtn,submitBtn]
				})
				fpwindow.show()
			})
		}
		
		async function handleStatusChange (grid, sm, status) {
			try {
				if (status === 'rejected') {
					try {
						const text = await promptForStatusText()
						status = {label: status, text}
					}
					catch (e) {
						return
					}
				}
				const selections = sm.getSelections()
				if (selections.length === 1) {
					await Ext.Ajax.requestPromise({
						url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${selections[0].data.assetId}/${grid.currentRuleId}`,
						method: 'PATCH',
						jsonData: {
							status
						}
					})
				}
				if (selections.length > 1) {
					const ruleIds = [grid.currentRuleId]
					const assetIds = selections.map( record => record.data.assetId)
					const review = {status}
					const jsonData = {
						source: {
							review
						},
						assets: {
							assetIds
						},
						rules: {
							ruleIds
						}
					}
					grid.bwrap.mask(`Updating ${selections.length} reviews`)
					await Ext.Ajax.requestPromise({
						responseType: 'json',
						url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews`,
						method: 'POST',
						jsonData
					})
				}

				if (selections.length === 1) {
					loadResources(selections[0].data.assetId, grid.currentRuleId)
				}
				// ugly code follows
				const record = groupGrid.getSelectionModel().getSelected()
				await getReviews(leaf.collectionId, record)
				
				// hack to reselect the records
				const reviewsGridSm = reviewsGrid.getSelectionModel()
				reviewsGridSm.onRefresh()
				reviewsGridSm.fireEvent('selectionchange', sm)

				grid.updateGroupStore(grid)
				setReviewsGridButtonStates()
			}
			catch (e) {
				SM.Error.handleError(e)
			}
			finally {
				grid.bwrap.unmask()
			}
		};

		function beforeEdit(e) {
			if (e.field == 'result') {
				var editor = e.grid.getColumnModel().getCellEditor(e.column,e.row);
				editor.gridRecord = e.record;
			}
		};
		
	/******************************************************/
	// END Reviews Panel
	/******************************************************/

	let contentTpl = SM.RuleContentTpl

	/******************************************************/
	// START Resources Panel
	/******************************************************/
		async function loadResources (assetId, ruleId) {
			let activeTab
			try {
				activeTab = Ext.getCmp('resources-tab-panel' + idAppend).getActiveTab()
				// activeTab.getEl().mask('Loading...')
				const attachmentsGrid = Ext.getCmp('attachmentsGrid' + idAppend)
				attachmentsGrid.assetId = assetId
				attachmentsGrid.ruleId = ruleId
        attachmentsGrid.getStore().removeAll()

				let result = await Ext.Ajax.requestPromise({
					url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${assetId}/${ruleId}`,
					method: 'GET',
					params: {
						projection: ['history']
					}
				})
				if (result.response.status === 200) {
					let apiReview = JSON.parse(result.response.responseText)
					//TODO: Set the history (does not set history on handleGroupSelectionForCollection)
					//append the current state of the review to history
					let currentReview = {
						ruleId: apiReview.ruleId,
						comment: apiReview.comment,
						resultEngine: apiReview.resultEngine,
						autoResult: apiReview.autoResult,
						rejectText: apiReview.rejectText,
						result: apiReview.result,
						detail: apiReview.detail,
						status: apiReview.status,
						ts: apiReview.ts,
						touchTs: apiReview.touchTs,
						userId: apiReview.userId,
						username: apiReview.username
					}
					apiReview.history.push(currentReview)
					Ext.getCmp('historyGrid' + idAppend).getStore().loadData(apiReview.history)
		
					// Attachments
				attachmentsGrid.loadArtifacts()	
				}
			}
			catch (e) {
				SM.Error.handleError(e)
			}
			finally {
				activeTab.getEl().unmask()
			}
		}
		
	/******************************************************/
	// START Resources Panel/History
	/******************************************************/
		var historyData = new Sm_HistoryData(idAppend);

	/******************************************************/
	// END Resources Panel/History
	/******************************************************/

  /******************************************************/
  // START Attachments Panel
  /******************************************************/
  const attachmentsGrid = new SM.Attachments.Grid({
    id: 'attachmentsGrid' + idAppend,
    title: 'Attachments',
    collectionId: leaf.collectionId
  })
  /******************************************************/
  // END Attachments Panel
  /******************************************************/

	/******************************************************/
	// END Resources Panel
	/******************************************************/

		var tabItems = [
			{
				region: 'west',
				layout: 'border',
				width: '40%',
				minWidth: 330,
				border: false,
				split:true,
				collapsible: false,
				id: 'west-panel' + idAppend,
				items: [
					groupGrid,
					{
						region: 'center',
						xtype: 'panel',
						cls: 'sm-round-panel',
						margins: { top: SM.Margin.adjacent, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
						border: false,
						split:true,
						collapsible: false,
						padding: 20,
						autoScroll: true,
						id: 'content-panel' + idAppend,
						title: 'Rule',
						tpl: contentTpl
					}
				]
			},
			{
				region: 'center',
				layout: 'border',
				border: false,
				split:true,
				collapsible: false,
				id: 'center-panel' + idAppend,
				items: [
					reviewsGrid,
					{
						region: 'south',
						xtype: 'tabpanel',
						cls: 'sm-round-panel',
						style: {
							'background-color': 'transparent'
						},
						margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
						border: false,
						id: 'resources-tab-panel' + idAppend,
						height: '33%',
						split:true,
						collapsible: false,
						activeTab: 'history',
						items: [
							{
								title: 'History',
								itemId: 'history',
								layout: 'fit',
								id: 'history-tab' + idAppend,
								items: historyData.grid
							},
							{
								title: 'Attachments',
								id: 'attachment-panel' + idAppend,
								layout: 'fit',
								items: attachmentsGrid
							}
						]
					}
				]
			}
		];
		
		let colReviewTab = new Ext.Panel ({
			id: 'collection-review-tab' + idAppend,
			iconCls: 'sm-stig-icon',
			title: '',
			collectionId: leaf.collectionId,
			benchmarkId: leaf.benchmarkId,
			collectionName: apiCollection.name,
			stigName: leaf.benchmarkId,
			closable:true,
			layout: 'border',
			border: false,
			items: tabItems,
			sm_TabType: 'asset_review',
			sm_tabMode: 'ephemeral',
			sm_treePath: treePath,
			listeners: {
				beforedestroy: () => {
					SM.Dispatcher.removeListener('fieldsettingschanged', onFieldSettingsChanged)
					SM.Dispatcher.removeListener('statussettingschanged', onStatusSettingsChanged)
				}
			}			
		})
		colReviewTab.updateTitle = function () {
			colReviewTab.setTitle(`${this.sm_tabMode === 'ephemeral' ? '<i>':''}${SM.he(this.collectionName)} / ${SM.he(this.stigName)}${this.sm_tabMode === 'ephemeral' ? '</i>':''}`)
		}
		colReviewTab.makePermanent = function () {
			colReviewTab.sm_tabMode = 'permanent'
			colReviewTab.updateTitle.call(colReviewTab)
		}
		
		let tp = Ext.getCmp('main-tab-panel')
		let ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
		let thisTab
		if (ephTabIndex !== -1) {
		  let ephTab = tp.items.itemAt(ephTabIndex)
		  tp.remove(ephTab)
		  thisTab = tp.insert(ephTabIndex, colReviewTab);
		} else {
		  thisTab = tp.add( colReviewTab )
		}
		thisTab.updateTitle.call(thisTab)
		thisTab.show();

		groupGrid.getStore().load({
			preselect: {
				ruleId: selectedRule,
				assetId: selectedAsset
			}		
		});
		loadRevisionMenu(leaf.benchmarkId, leaf.revisionStr, idAppend)
	}
	catch (e) {
		SM.Error.handleError(e)
	}

}


function renderOpen(value, metaData, record, rowIndex, colIndex, store) {
	var returnValue = value;
	if (value > 0) {
		metaData.css = 'sm-cell-red';
	} else {
		returnValue = '-';
		metaData.css = 'sm-cell-green';
	}
	return returnValue;
}

function renderCounts(value, metaData, record, rowIndex, colIndex, store) {
	var returnValue = value;
	if (value == 0) { returnValue = '-'; }
	metaData.css = 'sm-cell-grey';
	return returnValue;
}

function renderStatusCounts(value, metaData, record, rowIndex, colIndex, store) {
	var returnValue = value;
	if (value == 0) { returnValue = '-'; }
	metaData.css = 'sm-cell-status';
	return returnValue;
}
