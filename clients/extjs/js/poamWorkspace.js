/*
$Id: poamWorkspace.js 807 2017-07-27 13:04:19Z csmig $
*/


function addPoamWorkspace(conf) {

	/* conf = {
			attributes: object
			context: [collection|stig]
			idAppend:
		}
	*/

	/* Example of 'conf.attributes': 
		attributes = {
			id: "1-Acitve_Directory_Domain-stigs-stig-node"
			report: "stig"
			revId: "IE8-1-10"
			benchmarkId: "IE8"
			collectionId: "1"
			benchmarkId: "APACHE_SERVER_2.2_WINDOWS"
		}
	*/

	var idAppend = conf.idAppend;
	var title;
	if (conf.attributes.reqRar == '1') {
		title = "POAM/RAR";
	} else {
		title = "POAM";
	}
	if (conf.context == 'collection') {
		title += ' - ' + conf.attributes.collectionName;
	} else if (conf.context == 'stig') {
		title += ' - ' + conf.attributes.collectionName + ' : ' + conf.attributes.benchmarkId;
	}
		
	var collectionControlValidationSet = [];
	
//******************************************************/
// START Findings View
//******************************************************/
	var findingsFields = Ext.data.Record.create([
		{	
			name:'findingType',
			type: 'string'
		},
		{	
			name:'source',
			type: 'string'
		},
		{	
			name:'poamDone',
			type: 'integer'
		},
		{	
			name:'rarDone',
			type: 'integer'
		},
		{	
			name:'status',
			type: 'string'
		},
		{	
			name:'cat',
			type: 'string'
		},
		{	
			name:'sourceId',
			type: 'string',
			sortType: sortGroupId
		},
		// {	
			// name:'ruleId',
			// type: 'string'
		// },
		{	
			name:'title',
			type: 'string'
		},
		{	
			name:'iaControls',
			type: 'string'
		},
		{	
			name:'assets',
			type: 'string'
		},
		{	
			name:'assetCnt',
			type: 'int'
		}
	]);
	
	// var findingsProxy = new Ext.data.HttpProxy({
		// url: 'pl/getPoamFindings.pl',
		// listeners: {
			// load: function (proxy,o,options){
				// var i = o.reader.jsonData.collectionControlValidationSet.length;
				// collectionControlValidationSet.length = 0;
				// while(i--) collectionControlValidationSet[i] = [o.reader.jsonData.collectionControlValidationSet[i]];
			// }			
		// }
	// });
	
	var findingsStore = new Ext.data.JsonStore({
		url: 'pl/getPoamFindings.pl',
		// proxy: findingsProxy,		
		root: 'rows',
		id: 'findingsStore' + idAppend,
		fields: findingsFields,
		idProperty: 'sourceId',
		sortInfo: {
			field: 'sourceId',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				Ext.getCmp('findingsGrid-totalText' + idAppend).setText(records.length + ' records');
				var ourGrid = Ext.getCmp('poamFindingsGrid' + idAppend);
				ourGrid.getSelectionModel().selectFirstRow();
				var i = store.reader.jsonData.collectionControlValidationSet.length;
				collectionControlValidationSet.length = 0;
				while(i--) collectionControlValidationSet[i] = [store.reader.jsonData.collectionControlValidationSet[i]];
			}
		}
	});

	var findingsGrid = new Ext.grid.GridPanel({
		region: 'center',
		border: false,
		style: {
			borderBottomWidth: "1px"
		},
		split: true,
		id: 'poamFindingsGrid' + idAppend,
		filterState: 'All',
		//title: 'Active, approved findings',
		//split:true,
		//collapsible: true,
		store: findingsStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel ({
			singleSelect: true,
			listeners: {
				rowselect: {
					fn: function(sm,index,record) {
						handleFindingSelection(record,conf); // defined below
					}
				}
			}
		}),
		view: new Ext.grid.GridView({
			//autoFill:true,
			emptyText: 'There are no findings to display',
			// These listeners keep the grid in the same scroll position after the store is reloaded
			holdPosition: true, // HACK to be used with override
			deferEmptyText:false
		}),
		columns: [
			{ 	
				id:'poamDone' + idAppend,
				header: "POAM",
				width: 45,
				dataIndex: 'poamDone',
				renderer:renderDone,
				sortable: true,
				align: 'center'
			}
			,{ 	
				id:'rarDone' + idAppend,
				header: "RAR",
				width: 40,
				dataIndex: 'rarDone',
				renderer:renderDone,
				sortable: true,
				hidden: conf.attributes.reqRar == '0',
				align: 'center'
			}
			,{ 	
				id:'status' + idAppend,
				header: "Status",
				width: 70,
				dataIndex: 'status',
				sortable: true,
				align: 'center'
			}
			,{ 	
				id:'cat' + idAppend,
				header: "CAT",
				width: 40,
				dataIndex: 'cat',
				sortable: true,
				align: 'center'
			}
			// ,{ 	
				// id:'iaControls' + idAppend,
				// header: "Controls",
				// width: 70,
				// dataIndex: 'iaControls',
				// sortable: true,
				// align: 'left'
			// }
			,{ 	
				id:'sourceId' + idAppend,
				header: "ID",
				width: 70,
				dataIndex: 'sourceId',
				sortable: true,
				align: 'right'
			}
			// ,{ 	
				// id:'ruleId' + idAppend,
				// header: "Rule",
				// width: 120,
				// dataIndex: 'ruleId',
				// sortable: true,
				// align: 'left'
			// }
			,{ 
				id:'title' + idAppend,
				header: "Title",
				width: 10,
				dataIndex: 'title',
				renderer: columnWrap,
				sortable: true
			}
			,{ 	
				id:'assetCnt' + idAppend,
				header: "# Assets", 
				width: 80,
				align: 'center',
				dataIndex: 'assetCnt',
				sortable: true,
				renderer: function (value, metaData, record, rowIndex, colIndex, store) {
					//metaData.attr = 'ext:qdmDelay="0" ext:qtip="' + record.data.assets + '"';
					metaData.attr = 'ext:qtip="' + record.data.assets + '"';
					metaData.attr += 'ext:qdmdelay="360000"';
					return value;
				}
			}
			,{ 	
				id:'source' + idAppend,
				header: "Source",
				width: 200,
				dataIndex: 'source',
				renderer: columnWrap,
				sortable: true,
				align: 'left'
			}
		],
		autoExpandColumn:'title' + idAppend,
		//width: '33%',
		//height: '50%',
		loadMask: true,
		tbar: new Ext.Toolbar({
			cls: 'sm-toolbar',
			items: [
			{
				xtype: 'checkbox',
				id: 'cb-showUnapproved' + idAppend,
				// style: 'vertical-align: 2px;',
				// itemCls:'different-box-label',
				boxLabel: 'Include unapproved findings',
				listeners: {
					check: function (cb,checked) {
						findingsGrid.getSelectionModel().clearSelections(true);
						var lo = findingsGrid.getStore().lastOptions;
						if (checked) {
							findingsGrid.getStore().load({
								params:{
									context: lo.params.context,
									collectionId: lo.params.collectionId,
									benchmarkId: lo.params.benchmarkId,
									domain: lo.params.domain,
									dept: lo.params.dept,
									showUnapproved: 1
								}
							});
						} else {
							findingsGrid.getStore().load({
								params:{
									context: lo.params.context,
									collectionId: lo.params.collectionId,
									benchmarkId: lo.params.benchmarkId,
									domain: lo.params.domain,
									dept: lo.params.dept,
									showUnapproved: 0
								}
							});
						}
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
						collectionId:conf.attributes.collectionId,
						benchmarkId:conf.attributes.benchmarkId,
						attribute: 'dept'
					}
				}),
				listeners: {
					select: function(f,r,i) {
						findingsGrid.getSelectionModel().clearSelections(true);
						var lo = findingsGrid.getStore().lastOptions;
						findingsGrid.getStore().load({
							params:{
								context: lo.params.context,
								collectionId: lo.params.collectionId,
								benchmarkId: lo.params.benchmarkId,
								domain: lo.params.domain,
								dept: r.data.dept,
								showUnapproved: lo.params.showUnapproved
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
						collectionId:conf.attributes.collectionId,
						benchmarkId:conf.attributes.benchmarkId,
						attribute: 'domain'
					}
				}),
				listeners: {
					select: function(f,r,i) {
						findingsGrid.getSelectionModel().clearSelections(true);
						var lo = findingsGrid.getStore().lastOptions;
						findingsGrid.getStore().load({
							params:{
								context: lo.params.context,
								collectionId: lo.params.collectionId,
								benchmarkId: lo.params.benchmarkId,
								dept: lo.params.dept,
								domain: r.data.domain,
								showUnapproved: lo.params.showUnapproved
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
			,{
				xtype: 'tbbutton',
				iconCls: 'icon-excel',
				text: 'POAM',
				width: 20,
				tooltip: 'Generate and download completed eMASS POA&M template',
				handler: function(btn){
					// Show a dialog using config options:
					Ext.Msg.show({
						title:'Inclulde "Affected Assets" column?',
						msg: 'Do you wish to include an extra column to display "Affected Assets"?',
						closable: false,
						buttons: Ext.Msg.YESNO,
						buttonText: {yes: 'Include "Affected Assets"', no: "Do not include"},
						fn: function (btnId) {
							var locationUrl;
							//if (conf.context == 'stig') {
							var lo = findingsGrid.getStore().lastOptions;
								locationUrl="pl/poamGenerator.pl?collectionId=" + lo.params.collectionId + "&benchmarkId=" + lo.params.benchmarkId + "&dept=" + lo.params.dept + "&domain=" + lo.params.domain + "&showUnapproved=" + lo.params.showUnapproved;
;
							//} else {
							//	locationUrl="pl/poamGenerator.pl?collectionId=" + conf.attributes.collectionId;					
							//}
							if (btnId == 'yes') {
								locationUrl+="&includeAssets=1";
							} else {
								locationUrl+="&includeAssets=0";
							}
							window.location=locationUrl;
					   },
					   animEl: 'elId',
					   icon: Ext.MessageBox.QUESTION
					});
					// if (conf.context == 'stig') {
						// window.location="pl/poamGenerator.pl?collectionId=" + conf.attributes.collectionId + "&benchmarkId=" + conf.attributes.benchmarkId;
					// } else {
						// window.location="pl/poamGenerator.pl?collectionId=" + conf.attributes.collectionId;					
					// }
				}
			},{
				xtype: 'tbseparator',
				hidden: conf.attributes.reqRar == '0',
			}
			,{
				xtype: 'tbbutton',
				iconCls: 'icon-excel',
				text: 'RAR',
				hidden: conf.attributes.reqRar == '0',
				width: 20,
				tooltip: 'Generate and download completed RAR',
				handler: function(btn){
					var locationUrl;
					var lo = findingsGrid.getStore().lastOptions;
					locationUrl="pl/rarGenerator.pl?collectionId=" + lo.params.collectionId + "&benchmarkId=" + lo.params.benchmarkId + "&dept=" + lo.params.dept + "&domain=" + lo.params.domain + "&showUnapproved=" + lo.params.showUnapproved;
					window.location=locationUrl;
				}
			}
			,{
				xtype: 'tbseparator'
			}
			,{
				xtype: 'tbbutton',
				iconCls: 'icon-excel',
				text: 'Merged XLS',
				hidden: conf.context == 'collection',
				width: 20,
				tooltip: 'Generate and download merged XLS',
				handler: function(btn){
					var locationUrl;
					var lo = findingsGrid.getStore().lastOptions;
					locationUrl="pl/getCollectionStigExcel.pl?collectionId=" + lo.params.collectionId + "&benchmarkId=" + lo.params.benchmarkId + "&dept=" + lo.params.dept + "&domain=" + lo.params.domain + "&showUnapproved=" + lo.params.showUnapproved;
					window.location=locationUrl;
				}
			}
			
			,{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'findingsGrid-totalText' + idAppend,
				text: '0 records',
				width: 80
			}]
		})
	});
	
	function renderDone(value, metaData, record, rowIndex, colIndex, store) {
		if (value == 1) {
			return '<img src="img/greencheckt.gif">';
		} else if (value == 0){
			return '<img src="img/31.gif">';
		} else {
			return '';
		}
	};

	function handleFindingSelection(record,conf) {
		poamRarFormPanel.getEl().mask('Loading...');
		poamRarFormPanel.getForm().findingsGridRecord = record;
		poamRarFormPanel.getForm().load({
			url: 'pl/getPoamRarEntry.pl',
			iaControls: record.data.iaControls,
			params: {
				collectionId: conf.attributes.collectionId,
				findingType: record.data.findingType,
				sourceId: record.data.sourceId,
			},
			success: function(form,action) {
				poamRarFormPanel.getEl().unmask();

				// load iaControls into combo box store
				//var controls = action.options.iaControls.split(/,\s*/);
				if (record.data.iaControls != "") {
					var controls = record.data.iaControls.split(/,\s*/);
					var controlsData = [];
					for (var i=0; i<controls.length; i++) {
						controlsData.push([controls[i]])
					}
					iaControlsStore.loadData(controlsData);
				} else {
					iaControlsStore.loadData(collectionControlValidationSet);
				}
								
				// disable RAR items if status = 'Completed'
				var statusCombo = Ext.getCmp('status-combo' + idAppend);
				var status = statusCombo.getValue();
				if (status == 'Completed') {
					Ext.getCmp('residual-risk-combo' + idAppend).disable();
					Ext.getCmp('mitDesc-text' + idAppend).disable();
					Ext.getCmp('iacontrol-combo' + idAppend).enable();
					Ext.getCmp('compdate-datefield' + idAppend).enable();
					Ext.getCmp('milestone-text' + idAppend).enable();
					if (conf.attributes.reqRar == '1') {
						Ext.getCmp('likelihood-combo' + idAppend).disable();
						Ext.getCmp('recCorrAct-text' + idAppend).disable();
						Ext.getCmp('remDesc-text' + idAppend).disable();
						Ext.getCmp('rarComment-text' + idAppend).enable();
					}
				} else if (status == 'Ongoing') {
					Ext.getCmp('residual-risk-combo' + idAppend).enable();
					Ext.getCmp('iacontrol-combo' + idAppend).enable();
					Ext.getCmp('compdate-datefield' + idAppend).enable();
					Ext.getCmp('milestone-text' + idAppend).enable();
					Ext.getCmp('mitDesc-text' + idAppend).enable();
					if (conf.attributes.reqRar == '1') {
						Ext.getCmp('likelihood-combo' + idAppend).enable();
						Ext.getCmp('remDesc-text' + idAppend).enable();
						Ext.getCmp('rarComment-text' + idAppend).disable();
						// Only enable recCorrAct for Nessus findings
						if (record.data.findingType == 'nessus') {
							Ext.getCmp('recCorrAct-text' + idAppend).enable();
						} else {
							Ext.getCmp('recCorrAct-text' + idAppend).disable();
						}
					}
				} else {
					Ext.getCmp('residual-risk-combo' + idAppend).disable();
					Ext.getCmp('iacontrol-combo' + idAppend).disable();
					Ext.getCmp('compdate-datefield' + idAppend).disable();
					Ext.getCmp('milestone-text' + idAppend).disable();
					Ext.getCmp('mitDesc-text' + idAppend).disable();
					if (conf.attributes.reqRar == '1') {
						Ext.getCmp('likelihood-combo' + idAppend).disable();
						Ext.getCmp('recCorrAct-text' + idAppend).disable();
						Ext.getCmp('remDesc-text' + idAppend).disable();
						Ext.getCmp('rarComment-text' + idAppend).disable();
					}
				}
			}
		});
		
	};

//******************************************************/
// END Findings View
//******************************************************/
//******************************************************/
// START POAM Panel
//******************************************************/
	var iaControlsStore = new Ext.data.ArrayStore({
		//idIndex: 0,
		fields: [{name:'iaControl',type:'string',sortType: sortIaControls}],
		sortInfo: {
			field: 'iaControl',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		}
	});

	var resRiskStore = new Ext.data.SimpleStore({
		fields: ['cat','risk']
	});
					
	var poamRarFormPanel = new Ext.form.FormPanel({
		//baseCls: 'x-plain',
		//findingsGridRecord: {}, // STIG Manager defined property
		height: conf.attributes.reqRar == '0' ? 315 : 435,
		labelWidth: 85,
		labelAlign: 'right',
		padding: 10,
		border: false,
		style: {
			borderTopWidth: "0px"
		},
		bodyCssClass: 'sm-background-blue',
		cls: 'sm-background-blue',
		//split: true,
		collapsible: true,
		region: 'south',
		id: 'poamRarFormPanel' + idAppend,
		//cls: 'sm-background-blue',
		url:'pl/setPoamRarEntry.pl',
		monitorValid: false,
		items: [
		{
			xtype: 'hidden',
			name: 'collectionId'
		},
		{
			xtype: 'hidden',
			name: 'findingType'
		},
		{
			xtype: 'hidden',
			name: 'sourceId'
		},
		{ // start fieldset config - Status
			xtype:'fieldset',
			title: 'Finding attributes',
			items: [
			{ // start column config - Finding attributes
				layout: 'column',
				baseCls: 'x-plain',
				items: [ // start column items - Finding attrributes
				{ // start column #1 config - Finding attributes
					columnWidth: .25,
					//width: 300,
					layout: 'form',
					baseCls: 'x-plain',
					items: [
					{
						xtype: 'combo',
						id: 'status-combo' + idAppend,
						fieldLabel: 'Status',
						labelWidth: 30,
						width: 130,
						emptyText: 'Choose a status...',
						allowBlank: true,
						editable: false,
						name: 'status',
						mode: 'local',
						triggerAction: 'all',
						displayField:'status',
						listeners: {
							'select': function(combo,record,index) {
								if (record.data.status == 'Completed') { // Open
									Ext.getCmp('residual-risk-combo' + idAppend).enable();
									Ext.getCmp('iacontrol-combo' + idAppend).enable();
									Ext.getCmp('compdate-datefield' + idAppend).enable();
									Ext.getCmp('milestone-text' + idAppend).enable();
									Ext.getCmp('residual-risk-combo' + idAppend).disable();
									Ext.getCmp('mitDesc-text' + idAppend).disable();
									if (conf.attributes.reqRar == '1') {
										Ext.getCmp('likelihood-combo' + idAppend).disable();
										Ext.getCmp('recCorrAct-text' + idAppend).disable();
										Ext.getCmp('remDesc-text' + idAppend).disable();
										Ext.getCmp('rarComment-text' + idAppend).enable();
									}
								} else {
									Ext.getCmp('residual-risk-combo' + idAppend).enable();
									Ext.getCmp('iacontrol-combo' + idAppend).enable();
									Ext.getCmp('compdate-datefield' + idAppend).enable();
									Ext.getCmp('milestone-text' + idAppend).enable();
									var resRisk = Ext.getCmp('residual-risk-combo' + idAppend);
									resRisk.enable();
									//if (resRisk.value() 
									Ext.getCmp('mitDesc-text' + idAppend).enable();
									if (conf.attributes.reqRar == '1') {
										Ext.getCmp('likelihood-combo' + idAppend).enable();
										Ext.getCmp('remDesc-text' + idAppend).enable();
										Ext.getCmp('rarComment-text' + idAppend).disable();
										var findingRec = findingsGrid.getSelectionModel().getSelected();
										if (findingRec.data.findingType == 'nessus') {
											Ext.getCmp('recCorrAct-text' + idAppend).enable();
										} else {
											Ext.getCmp('recCorrAct-text' + idAppend).disable();
										}
									}
								}
							}
						},
						store: new Ext.data.SimpleStore({
							fields: ['status'],
							data : [['Ongoing'],['Completed']]
						})
					}
					,{
						xtype: 'combo',
						id: 'iacontrol-combo' + idAppend,
						cls: 'sm-enhanced-disable-textarea',
						fieldLabel: 'Control or AP Acronym',
						emptyText: 'Choose a control...',
						width: 130,
						allowBlank: true,
						editable: true,
						forceSelection: true,						
						name: 'iaControl',
						mode: 'local',
						triggerAction: 'all',
						displayField:'iaControl',
						store: iaControlsStore,
						// setValue: function(v) {
							// var one = 1;
						// }
					}
					] // end column #1 items - Finding attributes
				} // end column #1 config - Finding attributes
				,{ // start column #2 config - Finding attrubutes
					columnWidth: .25,
					layout: 'form',
					baseCls: 'x-plain',
					items: [
					{
						xtype: 'combo',
						id: 'residual-risk-combo' + idAppend,
						cls: 'sm-enhanced-disable-textarea',
						fieldLabel: 'Residual Risk',
						width: 130,
						emptyText: 'Choose the risk...',
						allowBlank: true,
						editable: false,
						name: 'residualRisk',
						hiddenName: 'residualRisk',
						mode: 'local',
						triggerAction: 'all',
						displayField:'risk',
						valueField: 'cat',
						forceSelection: true,
						store: resRiskStore,
						setValue: function (v,w) {
							var fgr = poamRarFormPanel.getForm().findingsGridRecord;
							// load residualRisk choices into combo box store
							var catData = [[1,'CAT I'],[2,'CAT II'],[3,'CAT III']];
							var resRiskData = [];
							var recordCat = fgr.data.cat;
							for (var i = 2; i >= 0 && catData[i][0] >= recordCat; i--) {
								resRiskData.push(catData[i]);
							}
							resRiskStore.loadData(resRiskData);
							// If there is no record yet, v will be null
							if (v == null) {
								v = recordCat; // default to the raw risk value
							}
							//Call the original function
							Ext.form.ComboBox.prototype.setValue.call(this, v);
						}
					}
					] // end column #2 items - Finding attributes
				} // end column #2 config - Finding attributes
				,{ // start column #3 config - Finding attrubutes
					columnWidth: .50,
					layout: 'form',
					baseCls: 'x-plain',
					items: [
					{
						layout: 'column',
						baseCls: 'x-plain',
						items: [
						{
							columnWidth: 1,
							layout: 'form',
							baseCls: 'x-plain',
							items: [
							{
								xtype: 'textarea',
								id: 'mitDesc-text' + idAppend,
								cls: 'sm-enhanced-disable-textarea',
								fieldLabel: 'Mitigations',
								anchor: '100%',
								height: 45,
								allowBlank: true,
								editable: true,
								listeners: {
									disable: function (me) {
										Ext.getCmp('mitDesc-button' + idAppend).hide();
									},
									enable: function (me) {
										Ext.getCmp('mitDesc-button' + idAppend).show();
									}
								},
								name: 'mitDesc'
							}
							]
						}
						,{
							width: 30,
							baseCls: 'x-plain',
							bodyStyle: 'padding-left: 5px',
							items: [
							{
								//BUTTON CONFIG
								xtype: 'button',
								id: 'mitDesc-button' + idAppend,
								textareaId:'mitDesc-text' + idAppend,
								iconCls: 'sm-page-white-put-icon',
								tooltip: 'Insert text from the finding source',
								handler: function (b,e) {
									showFindingTexts(Ext.getCmp(b.textareaId));
								}
							}
							]
						}
						]
					}
					] // end column #3 items - Finding attributes
				} // end column #3 config - Finding attributes
				] // end column items - Finding attributes
			} // end column config - Finding attributes
			] // end fieldset items - Finding attributes
		}, // end fieldset config - Finding attributes
		{ // start fieldset config - POAM
			xtype:'fieldset',
			title: 'POAM Fields',
			//layout: 'anchor',
			//anchor: '100% 50%',
			items: [
			{ // start column config - POAM
				layout: 'column',
				baseCls: 'x-plain',
				items: [ // start column items - POAM
				{ // start column #1 config - POAM
					columnWidth: .5,
					//width: 300,
					layout: 'form',
					baseCls: 'x-plain',
					items: [
					{
						xtype: 'datefield',
						id: 'compdate-datefield' + idAppend,
						cls: 'sm-enhanced-disable-textarea',
						format: "Y-m-d",
						fieldLabel: 'Completion Date',
						width: 150,
						emptyText: 'Pick the completion date..',
						allowBlank: true,
						editable: true,
						name: 'compDate'
					}
					] // end column #1 items - POAM
				},// end column #1 config - POAM
				{ // column #2 config - POAM
					columnWidth: .5,
					layout: 'form',
					baseCls: 'x-plain',
					items: [
					{
						layout: 'column',
						baseCls: 'x-plain',
						items: [
						{
							columnWidth: 1,
							layout: 'form',
							baseCls: 'x-plain',
							items: [
							{
								xtype: 'textarea',
								id: 'milestone-text' + idAppend,
								cls: 'sm-enhanced-disable-textarea',
								fieldLabel: 'Milestone',
								anchor: '100%',
								height: 45,
								allowBlank: true,
								editable: true,
								listeners: {
									disable: function (me) {
										Ext.getCmp('milestone-button' + idAppend).hide();
									},
									enable: function (me) {
										Ext.getCmp('milestone-button' + idAppend).show();
									}
								},
								name: 'milestone'
							}]
						}
						,{
							width: 30,
							//layout: 'form',
							baseCls: 'x-plain',
							bodyStyle: 'padding-left: 5px',
							items: [
							{
								xtype: 'button',
								id: 'milestone-button' + idAppend,
								textareaId:'milestone-text' + idAppend,
								iconCls: 'sm-page-white-put-icon',
								tooltip: 'Insert text from the finding source',
								handler: function (b,e) {
									showFindingTexts(Ext.getCmp(b.textareaId));
								}
							}]
						}]
					}
					// ,
					// {
						// layout: 'column',
						// baseCls: 'x-plain',
						// hidden: conf.attributes.reqRar == '1',
						// disabled: conf.attributes.reqRar == '1',
						// items: [
						// {
							// columnWidth: 1,
							// layout: 'form',
							// baseCls: 'x-plain',
							// items: [
							// {
								// xtype: 'textarea',
								// hidden: conf.attributes.reqRar == '1',
								// disabled: conf.attributes.reqRar == '1',
								// id: 'poamComment-text' + idAppend,
								// cls: 'sm-enhanced-disable-textarea',
								// fieldLabel: 'Comment',
								// anchor: '100%',
								// height: 45,
								// allowBlank: true,
								// editable: true,
								// listeners: {
									// disable: function (me) {
										// Ext.getCmp('poamComment-button' + idAppend).hide();
									// },
									// enable: function (me) {
										// Ext.getCmp('poamComment-button' + idAppend).show();
									// }
								// },
								// name: 'poamComment'
							// }]
						// }
						// ,{
							// width: 30,
							// baseCls: 'x-plain',
							// bodyStyle: 'padding-left: 5px',
							// items: [
							// {
								// //BUTTON CONFIG
								// xtype: 'button',
								// id: 'poamComment-button' + idAppend,
								// textareaId:'poamComment-text' + idAppend,
								// iconCls: 'sm-page-white-put-icon',
								// tooltip: 'Insert text from the finding source',
								// handler: function (b,e) {
									// showFindingTexts(Ext.getCmp(b.textareaId));
								// }
							// }]
						// }]
					// }
					]// end column #2 items - POAM
				} // end column #2 config - POAM
				]// end column items -POAM
			} // end column config - POAM
			] // end fieldset items - POAM
		} // end fieldset config - POAM
		,
		{ // start fieldset config - RAR
			xtype: conf.attributes.reqRar == '0'?'hidden':'fieldset',
			title: 'RAR Fields',
			//autoHeight:true,
			//layout: 'anchor',
			//anchor: '100% 50%',
			items: [
			{ // start column config - RAR
				layout: 'column',
				baseCls: 'x-plain',
				items: [ // start column items - RAR
				{ // start column #1 config - RAR
					columnWidth: .50,
					layout: 'form',
					baseCls: 'x-plain',
					items: [
					{
						xtype: 'combo',
						id: 'likelihood-combo' + idAppend,
						cls: 'sm-enhanced-disable-textarea',
						fieldLabel: 'Likelihood',
						width: 150,
						emptyText: 'Choose the likelihood...',
						allowBlank: true,
						editable: false,
						name: 'likelihood',
						mode: 'local',
						triggerAction: 'all',
						displayField:'likelihood',
						store: new Ext.data.SimpleStore({
							fields: ['likelihood'],
							data : [['High'],['Moderate'],['Low']]
						})
					}
					,
					{
						layout: 'column',
						baseCls: 'x-plain',
						items: [
						{
							columnWidth: 1,
							layout: 'form',
							baseCls: 'x-plain',
							items: [
							{
								//TEXTAREA CONFIG
								xtype: 'textarea',
								id: 'recCorrAct-text' + idAppend,
								cls: 'sm-enhanced-disable-textarea',
								fieldLabel: 'Recommended Corrective Action',
								anchor: '100%',
								height: 45,
								allowBlank: true,
								editable: true,
								listeners: {
									disable: function (me) {
										Ext.getCmp('recCorrAct-button' + idAppend).hide();
									},
									enable: function (me) {
										Ext.getCmp('recCorrAct-button' + idAppend).show();
									}
								},
								name: 'recCorrAct'
							}]
						}
						,{
							width: 30,
							baseCls: 'x-plain',
							bodyStyle: 'padding-left: 5px',
							items: [
							{
								//BUTTON CONFIG
								xtype: 'button',
								id: 'recCorrAct-button' + idAppend,
								textareaId:'recCorrAct-text' + idAppend,
								iconCls: 'sm-page-white-put-icon',
								tooltip: 'Insert text from the finding source',
								handler: function (b,e) {
									showFindingTexts(Ext.getCmp(b.textareaId));
								}
							}]
						}]
					}
					] // end column #1 items - RAR
				},// end column #1 config - RAR
				{ // column #2 config - RAR
					columnWidth: .50,
					layout: 'form',
					baseCls: 'x-plain',
					items: [
					{
						layout: 'column',
						baseCls: 'x-plain',
						items: [
						{
							columnWidth: 1,
							layout: 'form',
							baseCls: 'x-plain',
							items: [
							{
								//TEXTAREA CONFIG
								xtype: 'textarea',
								id: 'remDesc-text' + idAppend,
								cls: 'sm-enhanced-disable-textarea',
								fieldLabel: 'Remediation Description',
								anchor: '100%',
								height: 45,
								allowBlank: true,
								editable: true,
								listeners: {
									disable: function (me) {
										Ext.getCmp('remDesc-button' + idAppend).hide();
									},
									enable: function (me) {
										Ext.getCmp('remDesc-button' + idAppend).show();
									}
								},
								name: 'remDesc'
							}]
						}
						,{
							width: 30,
							baseCls: 'x-plain',
							bodyStyle: 'padding-left: 5px',
							items: [
							{
								//BUTTON CONFIG
								xtype: 'button',
								id: 'remDesc-button' + idAppend,
								textareaId:'remDesc-text' + idAppend,
								iconCls: 'sm-page-white-put-icon',
								tooltip: 'Insert text from the finding source',
								handler: function (b,e) {
									showFindingTexts(Ext.getCmp(b.textareaId));
								}
							}]
						}]
					}
					,{
						xtype: 'textarea',
						id: 'rarComment-text' + idAppend,
						cls: 'sm-enhanced-disable-textarea',
						fieldLabel: 'Comment',
						anchor: '100%',
						height: 45,
						allowBlank: true,
						editable: true,
						name: 'rarComment'
					}
					]// end column #2 items - RAR
				} // end column #2 config - RAR
				]// end column items -RAR
			} // end column config - RAR
			] // end fieldset items - RAR
		} // end fieldset config - RAR
		]
		,
		buttons: [
		{
			text: 'Save',
			formBind: true,
			id: 'submit-button' + idAppend,
			handler: function(){
				//poamRarFormPanel.getEl().mask('Saving...');
				thisTab.getEl().mask('Saving...');
				//Ext.getBody().mask('Saving...');
				poamRarFormPanel.getForm().submit({
					// params : {
						// collectionId: ,
					// },
					submitEmptyText : false,
					success: function (f,a) {
						f.findingsGridRecord.data.poamDone = a.result.poamDone;
						f.findingsGridRecord.data.rarDone = a.result.rarDone;
						f.findingsGridRecord.commit();
						thisTab.getEl().unmask();
					},
					failure: function(f,a) {
						Ext.Msg.alert('AJAX Failure!','AJAX call has completely failed.');
						thisTab.getEl().unmask();
					}	
				});
			}
	   }]
	});
	
	function showFindingTexts(textarea) {
		poamRarFormPanel.getEl().mask('Loading finding texts...');
		
		var lo = findingsGrid.getStore().lastOptions;

		var ftFields = Ext.data.Record.create([
			{	name:'textStr',
				type: 'string'
			},{
				name:'textSrc',
				type: 'string'
			}
		]);
		
		var ftStore = new Ext.data.JsonStore({
			url: 'pl/getFindingTexts.pl',
			fields: ftFields,
			root: 'rows',
			sortInfo: {
				field: 'textSrc',
				direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
			},
			totalProperty: 'records'
		});
		
		var ftGrid = new Ext.grid.GridPanel({
			store: ftStore,
			columns: [
				{ 	
					header: "Source", 
					width: 50,
					dataIndex: 'textSrc',
					sortable: true
				}					
				,{ 	
					header: "Text", 
					width: 100,
					dataIndex: 'textStr',
					renderer: columnWrap,
					sortable: true
				}
			],
			viewConfig: {
				forceFit: true
			},
			listeners: {
				rowdblclick: function ( grid, rowIndex, e ) {
					var comment = grid.getSelectionModel().getSelected().data.textStr;
					var myTextArea = textarea.getEl().dom;
					var textInArea = myTextArea.value;
					var textToInsert = comment;
					var caretPosition = myTextArea.selectionStart;
					myTextArea.value = textInArea.substring(0, caretPosition) + textToInsert  + textInArea.substring(caretPosition); 					
					ftWindow.close();
				}
			}
		});
		
		var ftWindow = new Ext.Window({
			title: "Finding Texts",
			modal: true,
			width: 500,
			height:440,
			layout: 'fit',
			plain:true,
			bodyStyle:'padding:5px;',
			buttonAlign:'center',
			items: ftGrid,
			buttons: [{
				text: 'Cancel',
				handler: function(){
					ftWindow.close();
				}
			},{
				text: 'Insert text',
				smGrid: ftGrid,
				handler: function(){
					var comment = this.smGrid.getSelectionModel().getSelected().data.textStr;
					var myTextArea = textarea.getEl().dom;
					var textInArea = myTextArea.value;
					var textToInsert = comment;
					var caretPosition = myTextArea.selectionStart;
					myTextArea.value = textInArea.substring(0, caretPosition) + textToInsert  + textInArea.substring(caretPosition); 					
					ftWindow.close();
				}
			}]
		});
		
		var ourGrid = Ext.getCmp('poamFindingsGrid' + idAppend);
		var record = ourGrid.getSelectionModel().getSelected();
		ftGrid.getStore().load({
			params:{
				collectionId:conf.attributes.collectionId,
				benchmarkId:conf.attributes.benchmarkId,
				sourceId:record.data.sourceId,
				showUnapproved: lo.params.showUnapproved
			},
			callback: function (r,o,s) {
				poamRarFormPanel.getEl().unmask();
				ftWindow.show(document.body);
			}
		});
		
	}; // end showFindingTexts
	

//******************************************************/
// END POAM Panel
//******************************************************/

	
	var tabItems = [
		findingsGrid,
		poamRarFormPanel
	];
	
	var thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'poamWorkspaceTab' + conf.idAppend,
		iconCls: 'sm-stig-icon',
		title: title,
		closable:true,
		layout: 'border',
		items: tabItems,
		listeners: {
		}			
	});

	thisTab.show();
	thisTab.doLayout(false,true);
	findingsStore.load({
		params:{
			context:conf.context,
			collectionId:conf.attributes.collectionId,
			benchmarkId:conf.attributes.benchmarkId,
			showUnapproved: 0
		}
	});

}; //end addReview();

