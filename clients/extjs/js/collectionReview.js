/*
$Id: collectionReview.js 885 2018-02-20 16:26:08Z bmassey $
*/


async function addCollectionReview ( params ) {
	let { leaf, selectedRule, selectedAsset, treePath } = params
	try {
		var idAppend = '-' + leaf.collectionId + '-' + leaf.benchmarkId.replace(".","_");

		/******************************************************/
		// 'Global' colAssets array of objects for reviewsGrid
		/******************************************************/
		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}`,
			method: 'GET',
		  })
		let apiCollection = JSON.parse(result.response.responseText)
		result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/stigs/${leaf.benchmarkId}/assets`,
			method: 'GET',
		  })
		let apiAssets = JSON.parse(result.response.responseText)
	
		let colAssets = apiAssets.map( colAsset => ({
			assetId: colAsset.assetId,
			assetName: colAsset.name,
			result: null,
			resultComment: null,
			action: null,
			actionComment: null,
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
				name:'nrCnt',
				type: 'int',
				mapping: 'counts.results.notchecked'
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
				name:'groupTitle',
				type: 'string'
			},{
				name:'ruleTitle',
				type: 'string'
			},{
				name:'severity',
				type:'string'
			},{
				name:'autoCheckAvailable',
				type:'boolean'
			}
		]);


		var groupStore = new Ext.data.JsonStore({
			proxy: new Ext.data.HttpProxy({
				url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/checklists/${leaf.benchmarkId}/latest`,
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
					
					Ext.getCmp('groupGrid-totalText' + idAppend).setText(getStatsString(store));
				},
				clear: function(){
					Ext.getCmp('groupGrid-totalText' + idAppend).setText('0 checks');
				},
				update: function(store) {
					Ext.getCmp('groupGrid-totalText' + idAppend).setText(getStatsString(store));
				},
				datachanged: function(store) {
					Ext.getCmp('groupGrid-totalText' + idAppend).setText(getStatsString(store));
				},
				exception: function(misc) {
					var ourView = groupGrid.getView();
					var response = misc.events.exception.listeners[1].fn.arguments[4];
					if (response.status != 0) {
						ourView.emptyText = 'Load failed: ' + response.responseText;
					} else {
						ourView.emptyText = 'HTTP Server Error: ' + response.statusText;
					}
					ourView.refresh();
				}
			}
		});

		/******************************************************/
		// Group grid menus
		/******************************************************/
		var groupChecklistMenu = new Ext.menu.Menu({
			id: 'groupChecklistMenu' + idAppend,
			items: [
				{
					text: 'Displayed title',
					hideOnClick: false,
					menu: {
						items: [ 
							{
								id: 'groupFileMenu-title-groupItem' + idAppend,
								text: 'Group ID and title',
								checked: false,
								group: 'titleType' + idAppend,
								handler: function(item,eventObject){
									var cm = groupGrid.getColumnModel();
									var groupTitleIndex = cm.findColumnIndex('groupTitle');
									var ruleTitleIndex = cm.findColumnIndex('ruleTitle');
									var groupIdIndex = cm.findColumnIndex('groupId');
									var ruleIdIndex = cm.findColumnIndex('ruleId');
									var titleWidth = cm.getColumnWidth(ruleTitleIndex);
									var idWidth = cm.getColumnWidth(ruleIdIndex);
									cm.setColumnWidth(groupTitleIndex,titleWidth);
									cm.setColumnWidth(groupIdIndex,idWidth);
									groupGrid.titleColumnDataIndex = 'groupTitle';
									filterGroupStore();
									cm.setHidden(ruleTitleIndex,true);
									cm.setHidden(ruleIdIndex,true);
									cm.setHidden(groupTitleIndex,false);
									cm.setHidden(groupIdIndex,false);
									groupGrid.autoExpandColumn = 'groupTitle' + idAppend;
								}
							},{
								id: 'groupFileMenu-title-ruleItem' + idAppend,
								text: 'Rule ID and title',
								checked: true,
								group: 'titleType' + idAppend,
								handler: function(item,eventObject){
									var cm = groupGrid.getColumnModel();
									var groupTitleIndex = cm.findColumnIndex('groupTitle');
									var ruleTitleIndex = cm.findColumnIndex('ruleTitle');
									var groupIdIndex = cm.findColumnIndex('groupId');
									var ruleIdIndex = cm.findColumnIndex('ruleId');
									var titleWidth = cm.getColumnWidth(groupTitleIndex);
									var idWidth = cm.getColumnWidth(groupIdIndex);
									cm.setColumnWidth(ruleTitleIndex,titleWidth);
									cm.setColumnWidth(ruleIdIndex,idWidth);
									groupGrid.titleColumnDataIndex = 'ruleTitle';
									filterGroupStore();
									cm.setHidden(groupTitleIndex,true);
									cm.setHidden(groupIdIndex,true);
									cm.setHidden(ruleTitleIndex,false);
									cm.setHidden(ruleIdIndex,false);
									groupGrid.autoExpandColumn = 'ruleTitle' + idAppend;
								}
							}
						]
					}
				}
				,{ 
					text: 'Export Results',
					disabled: false,
					iconCls: 'sm-export-icon',
					hideOnClick: false,
					menu: {
						items: [ 
							{
								text: 'CKL (Zip archive)',
								iconCls: 'sm-export-icon',
								tooltip: 'Download an archive with a checklist in DISA STIG Viewer format for each asset in the collection',
								handler: exportCkls
							}
						]
					}
				},
				{
					text: 'Reset reviews...',
					iconCls: 'sm-unlock-icon',
					handler: function(){
						//===================================================
						//UNLOCKS ALL RULE REVIEWS FOR A SPECIFIC STIG
						//===================================================
						Ext.Msg.show({
							title: 'Confirm review reset',
							msg: 'Do you want to reset ALL approved reviews<br/>for ANY rule associated with<br/>ANY revision of STIG "' + leaf.benchmarkId + '"<br/>for ALL aseets in this Collection?',
							buttons: {yes: "&nbsp;Reset reviews&nbsp;", no: "Cancel"},
							icon: Ext.MessageBox.QUESTION,
							closable: false,
							fn: function(buttonId){
								if (buttonId == 'yes'){
									//===============================================
									//GATHER INFORMATION ACCORDINGLY AND EXECUTE
									//THE REVIEW RESET.
									//===============================================
									var unlockObject = new Object;
									unlockObject.benchmarkId = leaf.benchmarkId;
									//unlockObject.stigName = leaf.benchmarkId;
									unlockObject.assetId = -1;
									unlockObject.assetName = '';
									unlockObject.collectionId =leaf.collectionId;
									// unlockObject.collectionName=apiCollection.name;
									unlockObject.gridTorefresh = groupGrid;
									batchReviewUnlock(unlockObject);
									//===============================================
									//REFRESH THE INTERFACE
									//===============================================
									//groupGrid.getStore().reload();
									// Ext.getCmp('content-panel' + idAppend).update('')
									// reviewsGrid.getStore().removeAll(true);
									// reviewsGrid.getView().refresh();
								}
							}
						});
					}
					
				}
				,
				'-'
			]
		});
		
		var groupFilterMenu = new Ext.menu.Menu({
			id: 'groupFilterMenu' + idAppend,
			items: [
				{
					text: 'All checks',
					checked: true,
					group: 'checkType' + idAppend,
					handler: function(item,eventObject){
						groupGrid.filterState = 'All',
						filterGroupStore();
						Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('All checks');
					}
				},'-',{ 
					text: 'Manual checks',
					checked: false,
					group: 'checkType' + idAppend,
					handler: function(item,eventObject){
						groupGrid.filterState = 'Manual',
						filterGroupStore();
						Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('Manual checks');
					}
				},{
					text: 'SCAP checks',
					checked: false,
					group: 'checkType' + idAppend,
					handler: function(item,eventObject){
						groupGrid.filterState = 'SCAP',
						filterGroupStore();
						Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('SCAP checks');
					}
				}
			]
		});

		async function exportCkls () {
			try {
				const zip = new JSZip()
				initProgress("Exporting checklists", "Initializing...")
				let fetched = 0
				const assetCount = apiAssets.length
				for (const apiAsset of apiAssets) {
					updateProgress(fetched/assetCount, `Fetching CKL for ${apiAsset.name}`)
					updateStatusText (`Fetching checklist for ${apiAsset.name}: `, true)
					await window.keycloak.updateToken(10)
					const url = `${STIGMAN.Env.apiBase}/assets/${apiAsset.assetId}/checklists/${leaf.benchmarkId}/${groupGrid.sm_revisionStr}?format=ckl`
					let response = await fetch( url, {
					  method: 'GET',
					  headers: new Headers({
						'Authorization': `Bearer ${window.keycloak.token}`
					  })
					})
					const contentDispo = response.headers.get("content-disposition")
					//https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
					const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
					console.log(filename)
					const blob = await response.blob()
					updateStatusText (`Fetched ${filename}`)
					fetched++
					zip.file( filename, blob )
				}
				updateProgress(1, 'Generating Zip archive...')
				updateStatusText('Generating Zip archive...')
				const blob = await zip.generateAsync({
					type:"blob",
					compression: "DEFLATE",
					compressionOptions: {
						level: 6
					}
				}, (metadata) => {
					updateProgress(metadata.percent/100, `Compressing ${metadata.currentFile}`)
				})
				updateProgress(1, 'Done')
				updateStatusText('Done')
				saveAs(blob, `${apiCollection.name}-${leaf.benchmarkId}.zip`)
			}
			catch (e) {
				alert (`${e.message}\n${e.stack}`)
			}
		}
		
		/******************************************************/
		// Group grid statistics string
		/******************************************************/
		var getStatsString = function (store) {
			let assetCount = apiAssets.length
			var totalChecks = store.getCount();
			var checksManual = 0;
			var checksSCAP = 0;
			store.data.each(function(item, index, totalItems ) {
				switch (item.data.autoCheckAvailable) {
					case false:
						checksManual++;
						break;
					case true:
						checksSCAP++;
						break;
				}
			});
			var totalWord = ' checks';
			if (totalChecks == 1) {
				totalWord = ' check';
			}
			var assetWord = ' assets';
			if (assetCount == 1) {
				assetWord = ' asset';
			}
			
			return assetCount + assetWord + ' assigned ' + totalChecks + totalWord + ' (' + checksManual + ' Manual, ' + checksSCAP + ' SCAP)';
		};

		/******************************************************/
		// The group grid
		/******************************************************/
		var groupGrid = new Ext.grid.GridPanel({
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
			border: false,
			region: 'north',
			sm_benchmarkId: leaf.benchmarkId,
			sm_revisionStr: 'latest',
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
			view: new Ext.grid.GridView({
				forceFit:false,
				emptyText: '',
				// These listeners keep the grid in the same scroll position after the store is reloaded
				holdPosition: true, // HACK to be used with override
				listeners: {
					// beforerefresh: function(v) {
					// v.scrollTop = v.scroller.dom.scrollTop;
					// v.scrollHeight = v.scroller.dom.scrollHeight;
					// },
					// refresh: function(v) {
						// setTimeout(function() { 
							// v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
						// }, 100);
					// }
				},
				deferEmptyText:false,
				getRowClass: function (record,index) {
					var autoCheckAvailable = record.get('autoCheckAvailable');
					if (autoCheckAvailable === true) {
						return 'sm-scap-grid-item';
					}
				}
			}),
			columns: [
				{ 	
					id:'cat' + idAppend,
					header: "CAT", 
					width: 48,
					align: 'center',
					dataIndex: 'severity',
					fixed: true,
					sortable: true,
					renderer: renderSeverity
				},
				{ 	
					id:'groupId' + idAppend,
					header: "Group",
					width: 95,
					dataIndex: 'groupId',
					sortable: true,
					hidden: true,
					hideable: false,
					align: 'left'
				},
				{ 	
					id:'ruleId' + idAppend,
					header: "Rule Id",
					width: 95,
					dataIndex: 'ruleId',
					sortable: true,
					hideable: false,
					align: 'left'
				},
				{ 
					id:'groupTitle' + idAppend,
					header: "Group Title",
					width: 80,
					hidden: false,
					dataIndex: 'groupTitle',
					renderer: columnWrap,
					hidden: true,
					hideable: false,
					sortable: true
				},
				{ 
					id:'ruleTitle' + idAppend,
					header: "Rule Title",
					width: 80,
					dataIndex: 'ruleTitle',
					renderer: columnWrap,
					hideable: false,
					sortable: true
				},
				{ 	
					id:'oCnt' + idAppend,
					header: '<div style="color:red;font-weight:bolder;">O</div>', 
					width: 32,
					align: 'center',
					dataIndex: 'oCnt',
					renderer:renderOpen,
					fixed: true,
					sortable: true
				},
				{ 	
					id:'nfCnt' + idAppend,
					header: '<div style="color:green;font-weight:bolder;">NF</div>', 
					width: 32,
					align: 'center',
					renderer:renderCounts,
					dataIndex: 'nfCnt',
					fixed: true,
					sortable: true
				},
				{ 	
					id:'naCnt' + idAppend,
					header: '<div style="color:grey;font-weight:bolder;">NA</div>', 
					width: 32,
					align: 'center',
					renderer:renderCounts,
					dataIndex: 'naCnt',
					fixed: true,
					sortable: true
				},
				{ 	
					id:'nrCnt' + idAppend,
					header: "NR", 
					width: 32,
					align: 'center',
					renderer:renderOpen,
					dataIndex: 'nrCnt',
					fixed: true,
					sortable: true
				},
				{ 	
					id:'readyCnt' + idAppend,
					header: "<img src=img/ready-16.png width=12 height=12>", 
					width: 32,
					align: 'center',
					renderer:renderOpen,
					dataIndex: 'readyCnt',
					fixed: true,
					renderer:renderStatusCounts,
					sortable: true
				},
				{ 	
					id:'rejectCnt' + idAppend,
					header: "<img src=img/rejected-16.png width=12 height=12>", 
					width: 32,
					align: 'center',
					renderer:renderOpen,
					dataIndex: 'rejectCnt',
					fixed: true,
					renderer:renderStatusCounts,
					sortable: true
				},
				{ 	
					id:'approveCnt' + idAppend,
					header: "<img src=img/lock-16.png width=12 height=12>", 
					width: 32,
					align: 'center',
					renderer:renderOpen,
					dataIndex: 'approveCnt',
					fixed: true,
					renderer:renderStatusCounts,
					sortable: true
				}
			],
			autoExpandColumn:'ruleTitle' + idAppend,
			//width: '33%',
			height: '50%',
			loadMask: true,
			tbar: new Ext.Toolbar({
				items: [
					{
						xtype: 'tbbutton',
						iconCls: 'sm-checklist-icon',  // <-- icon
						text: 'Checklist',
						menu: groupChecklistMenu
					},'-',{
						xtype: 'tbbutton',
						id: 'groupGrid-tb-filterButton' + idAppend,
						iconCls: 'sm-filter-icon',  // <-- icon
						text: 'All checks',
						menu: groupFilterMenu
					}
					,{
						xtype: 'trigger',
						fieldLabel: 'Filter',
						triggerClass: 'x-form-clear-trigger',
						onTriggerClick: function() {
							this.triggerBlur();
							this.blur();
							this.setValue('');
							filterGroupStore();
						},
						id: 'groupGrid-filterTitle' + idAppend,
						width: 140,
						submitValue: false,
						disabled: false,
						enableKeyEvents:true,
						emptyText:'Title filter...',
						listeners: {
							keyup: function (field,e) {
								filterGroupStore();
								return false;
							}
						}
					},
					'->',
					{
						xtype: 'tbitem',
						html: '<div class="sm-toolbar-legend-box sm-scap-grid-item"></div>'
					},
					{
						xtype: 'tbtext',
						text: ' SCAP available',
						style: 'margin-right: 15px;'
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
						groupGrid.getStore().reload();
						Ext.getCmp('content-panel' + idAppend).update('')
						reviewsGrid.getStore().removeAll(true);
						reviewsGrid.getView().refresh();
					}
				},{
					xtype: 'tbseparator'
				},{
					xtype: 'tbtext',
					id: 'groupGrid-totalText' + idAppend,
					text: '',
					width: 80
				}]
			})
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
			let result = await Ext.Ajax.requestPromise({
				url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions`,
				method: 'GET'
			})
			let revisions = JSON.parse(result.response.responseText)
			let revisionObject = getRevisionObj(revisions, activeRevisionStr, idAppend)
			if (Ext.getCmp('revision-menuItem' + idAppend) === undefined) {
				Ext.getCmp('groupChecklistMenu' + idAppend).addItem(revisionObject.menu);
			}
			groupGrid.setTitle(revisionObject.activeRevisionLabel);
			}
			catch (e) {
			alert(e.message)
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
				text: `Version ${r.version} Release ${r.release} (${benchmarkDateJs.format('j M Y')})`,
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
			var filterArray = [];
			// Filter menu
			if (groupGrid.filterState === 'SCAP' || groupGrid.filterState === 'Manual') {
				filterArray.push({
					property: 'autoCheckAvailable',
					value: groupGrid.filterState === 'SCAP'
				});
			}
			// Title textfield
			var titleValue = Ext.getCmp('groupGrid-filterTitle' + idAppend).getValue();
			if (titleValue.length > 0) {
				filterArray.push({
					property: groupGrid.titleColumnDataIndex,
					value: titleValue,
					anyMatch: true,
					caseSensitive: false
				});
			}
			
			groupStore.filter(filterArray);

		}
	/******************************************************/
	// END Group Grid
	/******************************************************/

	/******************************************************/
	// START Reviews Panel
	/******************************************************/
		var reviewsFields = Ext.data.Record.create([
			{	
				name:'assetId',
				type: 'string'
			},,{	
				name:'assetName',
				type: 'string'
			},{
				name:'ruleId',
				type: 'string'
			},{
				name:'result',
				type: 'string'
			},{
				name:'resultComment',
				type:'string'
			},{
				name:'action',
				type:'string'
			},{
				name:'actionComment',
				type:'string'
			},,{
				name:'autoResult',
				type:'boolean'
			},{
				name:'userId',
				type:'string'
			},{
				name:'username',
				type:'string'
			},{
				name:'ts',
				type:'date',
				dateFormat: 'Y-m-d H:i:s'
			},{
				name:'status',
				type:'string'
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
					var ourGrid = Ext.getCmp('reviewsGrid' + idAppend);
					setReviewsGridButtonStates(ourGrid.getSelectionModel());
					Ext.getBody().unmask();
				}
			},
			idProperty: 'assetId'
		});

		var editor = new Ext.ux.grid.RowEditor({
			saveText: 'Update',
			height: 200,
			listeners: {
				beforeedit: function (editor,rowIdx) {
				}
			}
		});
		
		var reviewsCm = new Ext.grid.ColumnModel({
			columns: [
				{ 	
					id:'status' + idAppend,
					header: "Status", 
					width: 50,
					fixed: true,
					dataIndex: 'status',
					sortable: true,
					renderer: renderStatuses
				},
				{ 	
					id:'target' + idAppend,
					header: "Asset",
					width: 50,
					//fixed: true,
					dataIndex: 'assetName',
					sortable: true,
					align: 'left'
				}
				,{ 
					id:'result' + idAppend,
					header: 'Result<i class= "fa fa-question-circle sm-question-circle"></i>',
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
							data: [['pass', 'NF'], ['notapplicable', 'NA'], ['fail', 'O']]
						}),
						valueField:'result',
						displayField:'resultStr',
						monitorValid: false,
						listeners: {
							select: function (combo,record,index) {
								//if (this.gridEditor.gridRecord.result == 4 && record.data.result != 4) { // Open result has been changed 
								if (combo.startValue == 'fail' && combo.value != 'fail') { // Open result has been changed 
									if ((combo.gridEditor.gridRecord.data.action != 0 && combo.gridEditor.gridRecord.data.action != undefined) || combo.gridEditor.gridRecord.data.actionComment != '') {
										combo.suspendEvents(false);
										var confirmStr="You are closing an Open finding in a review that contains an existing Recommended Action. If you continue, the Action and Action Comment will be permanently deleted from the review.<BR><BR>Do you want to continue closing this finding?";
										// the default z-index is 11000, which puts it above the mask used by Ext.Msg 
										combo.gridEditor.el.setStyle('z-index','8000'); 
										Ext.Msg.confirm("Confirm",confirmStr,function (btn,text) {
											if (btn == 'yes') {
												combo.gridEditor.gridRecord.data.action = null;
												combo.gridEditor.gridRecord.data.actionComment = '';
												combo.gridEditor.gridRecord.commit(false); // don't fire 'write' event on the store
												
												combo.resumeEvents();
												combo.fireEvent("blur");
											} else {
												combo.setValue(combo.startValue);
												combo.resumeEvents();
												combo.fireEvent("blur");
											}
										});
									} else {
										combo.fireEvent("blur");
									}
								} else {
									combo.fireEvent("blur");
								}
							}
						},
						triggerAction: 'all'
					}),
					renderer: function (val) {
						let returnStr
						switch (val) {
							case 'fail':
								returnStr = '<div style="color:red;font-weight:bolder;text-align:center">O</div>';
								break;
							case 'pass':
								returnStr = '<div style="color:green;font-weight:bolder;text-align:center">NF</div>';
								break;
							case 'notapplicable':
								returnStr = '<div style="color:grey;font-weight:bolder;text-align:center">NA</div>';
								break;
						}
						return SM.styledEmptyRenderer(returnStr)
					},
					sortable: true
				}
				,{ 	
					id:'resultComment' + idAppend,
					header: 'Result comment<i class= "fa fa-question-circle sm-question-circle"></i>', 
					width: 100,
					dataIndex: 'resultComment',
					renderer: function (v) {
						return columnWrap(SM.styledEmptyRenderer(v))
					},
					sortable: true,
					editor: new Ext.form.TextArea({
						id: 'reviewsGrid-editor-resultComment' + idAppend,
						//height: 150
						grow: true,
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
							}
						}
					})
				}
				,{ 	
					id:'action' + idAppend,
					header: 'Action<i class= "fa fa-question-circle sm-question-circle"></i>', 
					width: 80,
					fixed: true,
					dataIndex: 'action',
					renderer: function (val) {
						let actions = {
							remediate: 'Remediate',
							mitigate: 'Mitigate',
							exception: 'Exception'
						}
						return SM.styledEmptyRenderer(actions[val])
					},
					editor: new Ext.form.ComboBox({
						id: 'reviewsGrid-editor-actionCombo' + idAppend,
						mode: 'local',
						tpl: new Ext.XTemplate(
							'<tpl for=".">',
								'<tpl if="action == null">',
								'<div ext:qtip="Delete this action from the database" class="x-combo-list-item" style="color:grey;font-style:italic;">Delete</div>',
								'</tpl>',
								'<tpl if="action != null">',
								'<div class="x-combo-list-item">{actionStr}</div>',
								'</tpl>',
							'</tpl>'
						),
						valueNotFoundText: null,
						forceSelection: true,
						autoSelect: true,
						editable: false,
						store: new Ext.data.SimpleStore({
							fields: ['action', 'actionStr'],
							data: [['remediate', 'Remediate'], ['mitigate', 'Mitigate'], ['exception', 'Exception']]
						}),
						displayField:'actionStr',
						valueField: 'action',
						listeners: {
							select: function () {
								this.fireEvent("blur");
							}
						},
						triggerAction: 'all'
					}),
					sortable: true
				}
				,{ 	
					id:'actionComment' + idAppend,
					header: 'Action comment<i class= "fa fa-question-circle sm-question-circle"></i>', 
					width: 100,
					dataIndex: 'actionComment',
					renderer: function (v) {
						return columnWrap(SM.styledEmptyRenderer(v))
					},
					editor: new Ext.form.TextArea({
						id: 'reviewsGrid-editor-actionComment' + idAppend,
						grow: true,
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
							}
						}
					}),
					sortable: true
				}
				// ,{ 	
					// id:'userName' + idAppend,
					// header: "User", 
					// width: 100,
					// dataIndex: 'userName',
					// fixed: 50,
					// sortable: true
				// }
			],
			isCellEditable: function(col, row) {
				var record = reviewsStore.getAt(row);

				if (!record.data.result  && this.getDataIndex(col) !== 'result') { // review is not created yet
					return false;
				}

				switch (this.getDataIndex(col)) {
					case 'result':
					case 'resultComment':
						if (record.data.autoResult == 1) {
							return false;
						} else {
							return true;
						}
						break;
					case 'action':
					case 'actionComment':
						if (record.data.result == 'fail') {
							return true;
						} else {
							return false;
						}
						break;
				}

				return Ext.grid.ColumnModel.prototype.isCellEditable.call(this, col, row);
			}
		});

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
					nrCnt: 0,
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
							counts.nrCnt++
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
			sm: new Ext.grid.RowSelectionModel ({
				singleSelect: false,
				id: 'reviewsSm' + idAppend,
				listeners: {
					rowselect: function(sm,index,record) {
						if (sm.getCount() == 1) { //single row selected
							metadataGrid.enable();
							// attachGrid.enable();
							historyData.grid.enable();
							loadResources(record);
						} else {
							metadataStore.removeAll();
							metadataGrid.disable();
							// attachStore.removeAll();
							// attachGrid.disable();
							historyData.store.removeAll();
							historyData.grid.disable();
							setRejectButtonState();
						}
						setReviewsGridButtonStates(sm);
					},
					rowdeselect: function(sm,index,deselectedRecord) {
						if (sm.getCount() == 1) { //single row selected
							selectedRecord = sm.getSelected();
							metadataGrid.enable();
							// attachGrid.enable();
							historyData.grid.enable();
							loadResources(selectedRecord);
						} else {
							metadataStore.removeAll();
							metadataGrid.disable();
							// attachStore.removeAll();
							// attachGrid.disable();
							historyData.store.removeAll();
							historyData.grid.disable();
							setRejectButtonState();
						}
						setReviewsGridButtonStates(sm);
					}
				}
			}),
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
						let jsonData = {}, result
						if (e.record.data.status) {
							// review exists, set status to saved
							jsonData[e.field] = e.value
							jsonData.status = 'saved'
							result = await Ext.Ajax.requestPromise({
								url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${e.record.data.assetId}/${e.record.data.ruleId}`,
								method: 'PATCH',
								jsonData: jsonData
							})
						}
						else {
							// new review
							jsonData = {
								result: e.record.data.result,
								resultComment: null,
								action: null,
								actionComment: null,
								autoResult: false,
								status: 'saved'
							}
							result = await Ext.Ajax.requestPromise({
								url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${e.record.data.assetId}/${e.record.data.ruleId}`,
								method: 'PUT',
								jsonData: jsonData
							})
						}
						let apiReview = JSON.parse(result.response.responseText)
						e.grid.getStore().loadData(apiReview, true)
						// hack to reselect the record for setReviewsGridButtonStates()
						e.grid.getSelectionModel().selectRow(e.grid.getStore().indexOfId(apiReview.assetId))
						// e.record.commit()
		
						e.grid.updateGroupStore(e.grid)
						// setReviewsGridButtonStates();
	
					}
					catch(e) {
						alert(e.message)
					}


				}
			},
			view: new Ext.grid.GridView({
				forceFit:true,
				holdPosition: true,
				autoFill:true,
				emptyText: 'No data to display.',
				deferEmptyText:false,
				listeners: {
					refresh: function (view) {
						// Setup the tooltips
						const columns = view.grid.getColumnModel().columns
						for( let x = 0; x < columns.length; x++ ) {
							// Look for colums with the FontAwesome class
							const tipEl = view.getHeaderCell(x).getElementsByClassName('fa')[0]
							if ( tipEl ) {
								const idPrefix = columns[x].id.split('-')[0]
								// idPrefix should be 'result', 'resultComment', 'action' or 'actionCommnt'
								new Ext.ToolTip({
									target: tipEl,
									showDelay: 0,
									dismissDelay: 0,
									autoWidth: true,
									html: SM[`${idPrefix}TipText`]
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
						icon: 'img/lock-16.png',
						id: 'reviewsGrid-approveButton' + idAppend,
						text: 'Accept',
						hidden: leaf.collectionGrant !== 4,
						handler: function (btn) {
							var selModel = reviewsGrid.getSelectionModel();
							handleStatusChange (reviewsGrid,selModel,'accepted');
						}
					}
					,{
						xtype: 'tbseparator',
						hidden: leaf.collectionGrant !== 4
					}
					,{
						xtype: 'tbbutton',
						disabled: true,
						icon: 'img/ready-16.png',  // <-- icon
						id: 'reviewsGrid-submitButton' + idAppend,
						text: 'Submit',
						handler: function (btn) {
							var selModel = reviewsGrid.getSelectionModel();
							handleStatusChange (reviewsGrid,selModel,'submitted');
						}
					}
				]
			}),
			// bbar: new Ext.Toolbar({
			// 	items: [
			// 	{
			// 		xtype: 'tbbutton',
			// 		iconCls: 'icon-refresh',
			// 		tooltip: 'Reload this grid',
			// 		width: 20,
			// 		handler: function(btn){
			// 			reviewsGrid.getStore().reload();
			// 		}
			// 	}]
			// }),
			loadMask: true,
			emptyText: 'No data to display'
		});

		reviewsGrid.on('beforeedit', beforeEdit, this );

		async function getContent(benchmarkId, revisionStr, ruleId, groupId) {
			try {
				// Content panel
				let contentPanel = Ext.getCmp('content-panel' + idAppend);
				let contentReq = await Ext.Ajax.requestPromise({
					url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules/${ruleId}`,
					method: 'GET',
					params: {
						projection: ['details','cci','checks','fixes']
					}
				})
				let content = JSON.parse(contentReq.response.responseText)
				contentPanel.update(content)
				contentPanel.setTitle('Rule for Group ' + groupId);
			}
			catch (e) {
				alert(e.message)
			}
		}

		async function getReviews(collectionId, record) {
			try {
				// Reviews grid
				let reviewsGrid = Ext.getCmp('reviewsGrid' + idAppend);
				let reviewsReq = await Ext.Ajax.requestPromise({
					url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews`,
					method: 'GET',
					params: {
						rules: 'all',
						ruleId: record.data.ruleId,
					}
				})
				let fetchedReviews = JSON.parse(reviewsReq.response.responseText)
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
				reviewsGrid.setTitle(`Reviews of ${record.data.ruleId}`)
				reviewsGrid.currentChecklistRecord = record
			}
			catch (e) {
				alert (e.message)
			}
		}
		
		function handleGroupSelectionForCollection(record, idAppend, leaf, benchmarkId, revisionStr) {
			getContent(benchmarkId, revisionStr, record.data.ruleId, record.data.groupId)
			getReviews(leaf.collectionId, record)

			// // Content panel
			// let contentPanel = Ext.getCmp('content-panel' + idAppend);
			// let contentReq = await Ext.Ajax.requestPromise({
			// 	url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules/${record.data.ruleId}`,
			// 	method: 'GET',
			// 	params: {
			// 		projection: ['details','cci','checks','fixes']
			// 	}
			// })
			// let content = JSON.parse(contentReq.response.responseText)
			// contentPanel.update(content)
			// contentPanel.setTitle('Rule for Group ' + record.data.groupId);
		
			// // Reviews grid
			// let reviewsGrid = Ext.getCmp('reviewsGrid' + idAppend);
			// let reviewsReq = await Ext.Ajax.requestPromise({
			// 	url: `${STIGMAN.Env.apiBase}/reviews`,
			// 	method: 'GET',
			// 	params: {
			// 		collectionId: leaf.collectionId,
			// 		ruleId: record.data.ruleId,
			// 	}
			// })
			// let fetchedReviews = JSON.parse(reviewsReq.response.responseText)
			// let fetchedReviewsLookup = {}
			// for (const fetchedReview of fetchedReviews) {
			// 	fetchedReviewsLookup[fetchedReview.assetId] = fetchedReview
			// }
			// let colReviews = colAssets.map(colAsset => {
			// 	return {...colAsset, ...fetchedReviewsLookup[colAsset.assetId]}
			// })
		
			// reviewsGrid.getStore().loadData(colReviews)
		}

		function setReviewsGridButtonStates() {
			const sm = reviewsGrid.getSelectionModel();
			const approveBtn = Ext.getCmp('reviewsGrid-approveButton' + idAppend);
			const submitBtn = Ext.getCmp('reviewsGrid-submitButton' + idAppend);
			const selections = sm.getSelections();
			const selLength = selections.length;
			let approveBtnDisabled = false;
			let submitBtnDisabled = false;
			let rejectFormDisabled = false;
			let approveBtnEnabled = true;
			let submitBtnEnabled = true;
			let rejectFormEnabled = true;

			if (selLength === 0) {
				approveBtnEnabled = false
				submitBtnEnabled = false
				rejectFormEnabled = false
			}
			else if (selLength === 1) {
				const selection = selections[0]
				if (!selection.data.status) { // a review doesn't exist
					approveBtnEnabled = false
					submitBtnEnabled = false
					rejectFormEnabled = false
				}
				else {
					const status = selection.data.status
					switch (status) {
						case 'saved': // in progress
							approveBtnDisabled = true;
							if (isReviewComplete(
								selection.data.result,
								selection.data.resultComment,
								selection.data.action,
								selection.data.actionComment
								)) {
									approveBtnEnabled = false
									submitBtnEnabled = true
									rejectFormEnabled = false
				
							} else {
								approveBtnEnabled = false
								submitBtnEnabled = false
								rejectFormEnabled = false
							}
							break
						case 'submitted':
							approveBtnEnabled = true
							submitBtnEnabled = false
							rejectFormEnabled = true
							break
						case 'rejected':
							approveBtnEnabled = true
							submitBtnEnabled = true
							rejectFormEnabled = true
							break
						case 'accepted':
							approveBtnEnabled = false
							submitBtnEnabled = true
							rejectFormEnabled = false
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
				for (i=0; i<selLength; i++) {
					if (!selections[i].data.status) { // a review doesn't exist
						counts.unsaved++
						break
					}
					const status = selections[i].data.status
					if (status === 'saved') {
						if (isReviewComplete(
							selections[i].data.result,
							selections[i].data.resultComment,
							selections[i].data.action,
							selections[i].data.actionComment
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
				rejectFormEnabled = counts.submitted && (!counts.unsaved && !counts.saved && !counts.savedComplete && !counts.accepted && !counts.rejected)
		
			}
			approveBtn.setDisabled(!approveBtnEnabled);
			submitBtn.setDisabled(!submitBtnEnabled);
			rejectFormPanel.setDisabled(!rejectFormEnabled);
		};
		
		async function handleStatusChange (grid,sm,status) {
			try {
				const selections = sm.getSelections()
				const results = []
				let i, l
				for (i = 0, l = selections.length; i < l; i++) {
					const record = selections[i]
					Ext.getBody().mask(`Updating ${i+1}/${l} Reviews`)
					try {
						const result = await Ext.Ajax.requestPromise({
							url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${record.data.assetId}/${record.data.ruleId}`,
							method: 'PATCH',
							jsonData: {
								status: status
							}
						})
						results.push({
							success: true,
							result: result
						})
					}
					catch (e) {
						results.push({
							success: false,
							result: e
						})
					}
				}

				for (i=0, l=selections.length; i < l; i++) {
					if (results[i].success) {
						selections[i].data.status = status
						selections[i].commit()
					}
				}
				grid.updateGroupStore(grid)
				setReviewsGridButtonStates()
			}
			catch (e) {
				alert(e.message)
			}
			finally {
				Ext.getBody().unmask()
			}
		};

		function beforeEdit(e) {
			if (e.field == 'result') {
				var editor = e.grid.getColumnModel().getCellEditor(e.column,e.row);
				editor.gridRecord = e.record;
			}
		};

		function afterEdit(e) {
		};
		
	/******************************************************/
	// END Reviews Panel
	/******************************************************/

	let contentTpl = new Ext.XTemplate(
		'<div class=cs-home-header-top>{ruleId}',
		  '<span class="sm-content-sprite sm-severity-{severity}">',
			`<tpl if="severity == 'high'">CAT 1</tpl>`,
			`<tpl if="severity == 'medium'">CAT 2</tpl>`,
			`<tpl if="severity == 'low'">CAT 3</tpl>`, 
		  '</span>',
		'</div>',
		'<div class=cs-home-header-sub>{title}</div>',
		'<div class=cs-home-body-title>Manual Check',
		'<div class=cs-home-body-text>',
		'<tpl for="checks">',
		  '<pre>{[values.content.trim()]}</pre>',
		'</tpl>',
		'</div>',
		'</div>',
		'<div class=cs-home-body-title>Fix',
		'<div class=cs-home-body-text>',
		'<tpl for="fixes">',
		'<pre>{[values.text.trim()]}</pre>',
		'</tpl>',
		'</div>',
		'</div>',
		'<div class=cs-home-header-sub></div>',
		'<div class=cs-home-body-title>Other Data',
		'<div class=cs-home-body-text><b>Vulnerability Discussion</b><br><br>',
		'<pre>{[values.vulnDiscussion.trim()]}</pre>',
		'</div>',
		'<div class=cs-home-body-text><b>Documentable: </b>{documentable}</div>',
		`<tpl if="typeof(responsibility) != 'undefined'">`,
		  '<div class=cs-home-body-text><b>Responsibility: </b>{responsibility}</div>',
		'</tpl>',
		'<tpl if="values.ccis.length === 0">',
		  '<div class=cs-home-body-text><b>Controls: </b>No mapped controls</div>',
		'</tpl>',
		'<tpl if="values.ccis.length !== 0">',
		  '<div class=cs-home-body-text><b>Controls: </b><br>',
		  '<table class=cs-home-body-table border="1">',
		  '<tr><td><b>CCI</b></td><td><b>AP Acronym</b></td><td><b>Control</b></td></tr>',
		  '<tpl for="ccis">',
		  '<tr><td>{cci}</td><td>{apAcronym}</td><td>{control}</td></tr>',
		  '</tpl>',
		  '</table>',
		  '</div>',
		'</tpl>',
		'</div>'
	  )

	/******************************************************/
	// START Resources Panel
	/******************************************************/
		async function loadResources (record) {
			let activeTab
			try {
				activeTab = Ext.getCmp('resources-tab-panel' + idAppend).getActiveTab()
				activeTab.getEl().mask('Loading...')
				let result = await Ext.Ajax.requestPromise({
					url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${record.data.assetId}/${record.data.ruleId}`,
					method: 'GET',
					params: {
						projection: 'history'
					}
				})
				if (result.response.status === 200) {
					let apiReview = JSON.parse(result.response.responseText)
					//TODO: Set the history
					Ext.getCmp('historyGrid' + idAppend).getStore().loadData(apiReview.history)
	
					// Reject text
					const rejectFp = Ext.getCmp('rejectFormPanel' + idAppend)
					rejectFp.getForm().setValues(apiReview)
					setRejectButtonState()
	
					// Metadata
					let metadata = []
					for (const [key, value] of Object.entries(apiReview)) {
						if (key !== 'history') {
							metadata.push({
								property: key,
								value: value
							})
						}
					}
					Ext.getCmp('metadataGrid' + idAppend).getStore().loadData(metadata)	
				}
			}
			catch (e) {
				alert (e.message)
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
	// START Resources Panel/Metadata
	/******************************************************/

		var metadataFields = Ext.data.Record.create([
			{	
				name:'property',
				type: 'string'
			},{
				name: 'value',
				type: 'string'
			}
		]);
		
		var metadataStore = new Ext.data.JsonStore({
			fields: metadataFields,
			root: '',
			idProperty: 'property'
		});
		
		var metadataGrid = new Ext.grid.GridPanel({
			id: 'metadataGrid' + idAppend,
			sm: new Ext.grid.RowSelectionModel ({singleSelect: true}),
			loadMask: true,
			stripeRows: true,
			border: false,
			view: new Ext.grid.GridView({forceFit:true}),
			store: metadataStore,
			columns: [
			{ 	
				id:'metadataGrid-property' + idAppend,
				header: "Property", 
				width: 150,
				fixed: true,
				dataIndex: 'property',
				sortable: true
			},
			{ 	
				id:'metadataGrid-value' + idAppend,
				header: "Value", 
				width: 150,
				dataIndex: 'value',
				sortable: true
			}]
		});
		
	/******************************************************/
	// END Resources Panel/Metadata
	/******************************************************/
	/******************************************************/
	// START Resources Panel/Feedback
	/******************************************************/

		var rejectOtherPanel = new Ext.Panel ({
			layout: 'fit',
			id: 'rejectOtherPanel' + idAppend,
			title: 'Rejected review feedback',
			bodyCssClass: 'sm-background-blue',
			padding: '5',
			flex: 50,
			items: [{
				xtype: 'textarea',
				id: 'rejectTextArea' + idAppend,
				enableKeyEvents: true,
				emptyText: 'Provide feedback explaining this rejection.',
				name: 'rejectText',
				listeners: {
					keyup: setRejectButtonState
				}
			}]
		});
		
		var rejectFormPanel = new Ext.form.FormPanel({
			baseCls: 'x-plain',
			id: 'rejectFormPanel' + idAppend,
			cls: 'sm-background-blue',
			labelWidth: 95,
			url:'pl/setReviewRejection.pl',
			monitorValid: false,
			items: [
			{
				layout: 'hbox',
				anchor: '100% -1',
				padding: '10',
				baseCls: 'x-plain',
				border: false,
				layoutConfig: {
					align: 'stretch'
				},
				items: [rejectOtherPanel]
			}],
			buttons: [{
				text: 'Reject review with this feedback',
				id: 'rejectSubmitButton' + idAppend,
				iconCls: 'sm-rejected-icon',
				reviewsGrid: reviewsGrid,
				handler: handleRejections
			}]
		});
		
		async function handleRejections() {
			try {
				Ext.getBody().mask('Rejecting')
				const status = 'rejected'
				const values = rejectFormPanel.getForm().getFieldValues()
				const selections = reviewsGrid.getSelectionModel().getSelections()
				const requests = []
				for (const record of selections) {
					requests.push(
						Ext.Ajax.requestPromise({
							url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${record.data.assetId}/${record.data.ruleId}`,
							method: 'PATCH',
							jsonData: {
								status: status,
								rejectText: values.rejectText,
								rejectUserId: curUser.userId
							}
						})
					)
				}
				let results = await Promise.allSettled(requests)
				for (i=0, l=selections.length; i < l; i++) {
					if (results[i].status === 'fulfilled') {
						selections[i].data.status = status
						selections[i].commit()
					}
				}
				reviewsGrid.updateGroupStore(reviewsGrid)
				setReviewsGridButtonStates()
				Ext.getBody().unmask()
			}
			catch (e) {
				alert(e.message)
			}
			finally {

			}

		}

		function setRejectButtonState () {
			var btn = Ext.getCmp('rejectSubmitButton' + idAppend);
			var text = Ext.getCmp('rejectTextArea' + idAppend);
			var reviewsCount = reviewsGrid.getSelectionModel().getCount();
			if (reviewsCount > 1) {
				btn.setText("Reject " + reviewsCount + " reviews with this feedback");
			} else {
				btn.setText("Reject review with this feedback");
			}
			if (text.getValue() == '') {
				btn.disable();
			} else {
				btn.enable();
			}
		}

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
							'background-color': '#eeeeee'
						},
						margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
						border: true,
						id: 'resources-tab-panel' + idAppend,
						height: '33%',
						split:true,
						collapsible: false,
						activeTab: 'feedback-panel' + idAppend,
						items: [{
							title: 'Feedback',
							id: 'feedback-panel' + idAppend,
							layout: 'fit',
							items: rejectFormPanel
						},
						// {
						// 	title: 'Attachments',
						// 	layout: 'fit',
						// 	items: attachGrid
						// },
						{
							title: 'Metadata',
							id: 'metadata-panel' + idAppend,
							layout: 'fit',
							items: metadataGrid
						},{
							title: 'History',
							layout: 'fit',
							id: 'history-tab' + idAppend,
							items: historyData.grid
						}]
					}
				]
			}
		];
		
		let colReviewTab = new Ext.Panel ({
			id: 'collection-review-tab' + idAppend,
			iconCls: 'sm-collection-tab-icon',
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
			}			
		})
		colReviewTab.updateTitle = function () {
			colReviewTab.setTitle(`${this.sm_tabMode === 'ephemeral' ? '<i>':''}${this.collectionName} / ${this.stigName}${this.sm_tabMode === 'ephemeral' ? '</i>':''}`)
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
		loadRevisionMenu(leaf.benchmarkId, 'latest', idAppend)
	}
	catch (e) {
		alert (e.message)
	}

}; //end addReview();


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
