var statusText;

function renderPct ( v ) {
	const mercuryCls = v >= 100 ? 'sm-cell-mercury-low' : v >= 50 ? 'sm-cell-mercury-medium' : 'sm-cell-mercury-high'
	let markup = `
	<div class="sm-cell-thermometer-text">
		${v}%
	</div>
	<div class="sm-cell-thermometer-bg">
		<div class="${mercuryCls}" style="width: ${v}%;">&nbsp;</div>
	</div>`
	return markup
}

function getUnlockPrompt(unlockLevel, unlockObject, grid){
	//==========================================================
	//Determine the scope portion of the message based on the 
	//scope provided.
	//==========================================================
	var unlockScopeString = "";
	var unlockPrompt = "You are about to reset one or more review statuses back to 'Unsubmitted'. Select the statuses to reset.";
	//===========================================================================
	//Create and Display the Prompt Box
	//===========================================================================
	var promptWindow = new Ext.Window({
		id: "unlockPromptWindow",
		modal: 	true,
		closable: false,
		width: 400,
		height: 170,
		resizable: false,
		layout: "absolute",
		layoutConfig: {columns: 2},
		items: [{
				x: 30,
				y: 25,
				anchor: "90%",
				xtype: 	"label",
				id: 	"promptText",
				html: 	unlockPrompt,
				style: {fontWeight:"bold", fontSize: "9pt", textAlign:"center"},
				colspan: 2
			},{
				x: 110,
				y: 85,
				xtype: 	"combo",
				id: 	"unlockCombo",
				store: 	[["SELECT", "Choose Reset Type..."],["S", "Submitted"],["A", "Approved"],["SA", "Submitted/Approved"]],
				triggerAction: "all",
				emptyText: "Choose Reset Type....",
				//allowBlank: false,
				editable: false,
				forceSelection: true,
				listeners: {
					select: function(c,r,i){
						if(c.getValue()=='SELECT'){
							Ext.getCmp('unlockButton').disable();
							Ext.getCmp('promptText').setText("You are about to Reset One or More Reviews. Select a Reset Type to Proceed.");
						}else{
							Ext.getCmp('unlockButton').enable();
							//====================================================
							//Enable unlock button if user selects a choice.
							//Disable if user selects nothing
							//====================================================
							switch (Ext.getCmp('unlockCombo').getValue()){
								case "S":
									unlockScopeString = "Submitted";
									break;
								case "SA":
									unlockScopeString = "Submitted or Approved";
									break;
								case "A":
									unlockScopeString = "Approved";
									break;
							}
							//==========================================================
							//Determine the prompt Message to Display based on level
							//and scope.
							//==========================================================
							switch(unlockLevel){
								case "PACKAGE":
									Ext.getCmp('promptText').setText('Do you want to reset ALL ' + unlockScopeString + ' reviews for ALL assets in Collection, "' + unlockObject.collectionName + '"?');
									break;
								case "STIG":
									Ext.getCmp('promptText').setText('Do you want to reset ALL ' + unlockScopeString + ' reviews for ANY rule associated with ANY revision of STIG, "' + unlockObject.benchmarkId + '", for ALL assets in this Collection?');
									break;
								case "ASSET":
									Ext.getCmp('promptText').setText('Do you want to reset ALL ' + unlockScopeString + ' reviews for asset, "' + unlockObject.assetName + '"?');
									break;
								case "STIG-ASSET":
									Ext.getCmp('promptText').setText('Do you want to reset ALL ' + unlockScopeString + ' reviews for ANY revision of "' + unlockObject.benchmarkId + '" for asset, "' + unlockObject.assetName + '"?');
									break;
							}
						}
					}
				}//End of Combo Listeners
			},{
				x: 85,
				y: 115,
				width: 100,
				xtype: 		"button",
				text: 		"Reset",
				id: 		"unlockButton",
				disabled: 	true,
				listeners: 	{
					click: function(t, e){
						//=======================================================
						//Action Confirmed. Proceed with Batch Reset
						//=======================================================
						unlockObject.unlockDepth = Ext.getCmp('unlockCombo').getValue();
						batchReviewUnlock(unlockObject);
						//=======================================================
						//If a grid was specified, reload it.
						//=======================================================
						if (typeof grid == 'object'){
							if (grid.getXType() == 'grid'){
								grid.getStore().reload();
							}
						}
						//========================================================
						//Close Prompt Window
						//========================================================
						Ext.getCmp("unlockPromptWindow").close();
					}
				}
			},{
				x: 215,
				y: 115,
				width: 90,
				xtype: 	"button",
				text: 	"Cancel",
				id: 	"cancelButton",
				listeners:{
					click: function(t,e){
					//=======================================================
					//Action aborted. Close the Window
					//=======================================================
						Ext.getCmp("unlockPromptWindow").close();
					}
				}
		}]//End of Window Items
	});

	//===================================================
	//Display the window
	//===================================================
	promptWindow.show();
}

function initProgress (title,text,storeId,iframe) {
	var pb = new Ext.ProgressBar({
		text: text
		,id: 'pbar1'
		,flex: 0
		,textLog: ''
		,listeners: {
			destroy: function () {
				var one = 1;
			}
		}
	});
	
	var st = new Ext.form.TextArea({
		id: 'statusText1'
		,cls: 'sm-progress-textarea'
		,readOnly: true
		,flex: 3
		,margins: {
			top: 10
			,bottom: 0
			,left: 0
			,right: 0
		}
	});
	//	pb.reset();

	var pbWindow = new Ext.Window({
		title: title,
		modal: true,
		closable: true, // 'false' for production
		width: '50%',
		height: 600,
		id: 'uploadWindow',
		layout: {
			type: 'vbox',
			align: 'stretch'
		},
		plain:true,
		bodyStyle:'padding:5px;',
		listeners: {
			close: function () {
				if (storeId != undefined) {
					reloadStore(storeId);
				}
			}
		},
		buttons: [{
			xtype: 'tbbutton'
			,text: 'Save log...'
			,download: 'log.txt'
			,disabled: false
			,handler: function(btn,e) {
				let logtext = Ext.getCmp("statusText1").getRawValue();
				let blob = new Blob([logtext],{type:"text/plain;charset=utf-8"});
				if (window.navigator.msSaveOrOpenBlob){
					navigator.msSaveOrOpenBlob(blob,btn.download);
				} else {
					let a = window.document.createElement("a");
					a.style.display="none";
					a.href = window.URL.createObjectURL(blob);
					a.download = btn.download;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					//let href = encodeURI("data:text/plain;charset=utf-8," + logtext)
					//btn.setHref(href);
				}
			}
		},{
			text: 'Close'
			,disabled: false
			,handler: function(btn,e){
				pbWindow.close();
			}
		}],
		buttonAlign:'center',
		items: [pb,st]
	});
	statusText = '';
	pbWindow.show(document.body);

}

function updateProgress (value,text) {
	var pb = Ext.getCmp("pbar1");
	pb.updateProgress(value,Ext.util.Format.htmlEncode(text));
}

function updateStatusText (text, noNL, replace) {
	var noNL = noNL || false;
	var st = Ext.getCmp("statusText1");
	if (noNL) {
		statusText += text;
	} else {
		statusText += text + "\n";
	}
	st.setRawValue(statusText);
	st.getEl().dom.scrollTop = 99999; // scroll to bottom
}

function resetProgress () {
	var pb = Ext.getCmp("pbar1");
	pb.updateProgress(0,"");
}

function closeProgress () {
	var uw = Ext.getCmp("uploadWindow");
	uw.close();
}

function reloadStore (id) {
	var store = Ext.StoreMgr.lookup(id);
	store.reload();
}

function ip2num(dot) 
{
    var d = dot.split('.');
    return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
}


function Sm_StigAssetView (conf) {

	var idAppend = conf.idAppend;
	var storeUrl = conf.storeUrl;
	var gridTitle = conf.gridTitle;
	var gridCls = conf.gridCls;
	var gridAnchor = conf.gridAnchor;
	
	var fields = Ext.data.Record.create([
		{
			name:'saId',
			type: 'number'
		},{
			name:'assetName',
			type: 'string'
		},{
			name:'dept',
			type: 'string'
		},{
			name:'stigName',
			type: 'string'
		}
	]);
	
	 var store = new Ext.data.GroupingStore({
		url: storeUrl,		
		groupField: 'stigName',
		filterField: 'stigName', //custom property
		reader:	new Ext.data.JsonReader({
			fields: fields,
			root: 'rows',
			idProperty: 'saId'
		})
	});

	var sm = new Ext.grid.CheckboxSelectionModel({
		checkOnly: true,
		onRefresh: function() {
			// ORIGINAL PRIVATE METHOD BELOW
			// var ds = this.grid.store, index;
			// var s = this.getSelections();
			// this.clearSelections(true);
			// for(var i = 0, len = s.length; i < len; i++){
				// var r = s[i];
				// if((index = ds.indexOfId(r.id)) != -1){
					// this.selectRow(index, true);
				// }
			// }
			// if(s.length != this.selections.getCount()){
				// this.fireEvent('selectionchange', this);
			// }
			
			var ds = this.grid.store, index;
			var s = this.getSelections();
			for(var i = 0, len = s.length; i < len; i++){
				var r = s[i];
				if((index = ds.indexOfId(r.id)) != -1){
					this.grid.view.addRowClass(index, this.grid.view.selectedRowClass);
				}
			}
		}
		,onHdMouseDown : function(e, t) {
			// Redefinition of private method
			// The original method cleared existing selections
			//
			// ORIGINAL PRIVATE METHOD BELOW
			// if(t.className == 'x-grid3-hd-checker'){
				// e.stopEvent();
				// var hd = Ext.fly(t.parentNode);
				// var isChecked = hd.hasClass('x-grid3-hd-checker-on');
				// if(isChecked){
					// hd.removeClass('x-grid3-hd-checker-on');
					// this.clearSelections();
				// }else{
					// hd.addClass('x-grid3-hd-checker-on');
					// this.selectAll();
				// }
			// }
			
			// Our method doesn't call clearSelections() or selectAll(),
			// both of which clear all existing selections
			if(t.className == 'x-grid3-hd-checker'){
				e.stopEvent();
				var hd = Ext.fly(t.parentNode);
				var isChecked = hd.hasClass('x-grid3-hd-checker-on');
				if(isChecked){
					hd.removeClass('x-grid3-hd-checker-on');
					if(this.isLocked()){
						return;
					}
					for(var i = 0, len = this.grid.store.getCount(); i < len; i++){
						this.deselectRow(i);
					}
				}else{
					hd.addClass('x-grid3-hd-checker-on');
					if(this.isLocked()){
						return;
					}
					for(var i = 0, len = this.grid.store.getCount(); i < len; i++){
						this.selectRow(i, true);
					}
				}
			}
		}
	});
	
	var grid = new Ext.grid.GridPanel({
		title: gridTitle,
		hideHeaders: false,
		anchor: gridAnchor,
		cls: gridCls,
		id: 'stigAssetsGrid' + idAppend,
		store: store,
		contextMenu: new Ext.menu.Menu({
			groupField: '',
			groupValue: '',
			//id: 'context-menu' + idAppend,
			items: [{
				//id: 'select-group' + idAppend,
				iconCls: 'sm-hbss-disabled-icon',
				text: 'Select group'
			}
			,{
				//id: 'deselect-group' + idAppend,
				iconCls: 'sm-hbss-enabled-icon',
				text: 'Deselect group'
			}],
			listeners: {
				itemclick: function(item) {
					var records = store.query(this.groupField,this.groupValue,false,true);
					switch (item.text) {
						case 'Select group':
							records.each(function (item) {
								sm.selectRow(store.indexOf(item),true);
							});
							break;
						case 'Deselect group':
							records.each(function (item) {
								sm.deselectRow(store.indexOf(item));
							});
							break;
					}
				}
			}
		}),
			
		columns: [
			sm,
			{ 
				header: "Asset", 
				width: 120,
				dataIndex: 'assetName',
				sortable: true
			},
			{
				header: "STIG", 
				width: 320,
				dataIndex: 'stigName',
				sortable: true
			}
		],
		view: new Ext.grid.GroupingView({
			enableGrouping:true,
			hideGroupedColumn:true,
			//startCollapsed: true,
			forceFit:true,
			emptyText: 'No records found.',
			groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "items" : "item"]})'
		}),
		listeners: {
			groupcontextmenu: function (grid, groupField, groupValue, e ) {
				grid.contextMenu.groupField = groupField;
				grid.contextMenu.groupValue = groupValue;
				
				grid.contextMenu.showAt(e.getXY());
				// var records = store.query(groupField,groupValue,false,true);
				// records.each(function (item) {
					// sm.selectRow(store.indexOf(item),true);
				// });
			}
		},
		sm: sm,
		setValue: function(v) {
			var selRecords = [];
			for(y=0;y<v.length;y++) {
				var record = store.getById(v[y]);
				selRecords.push(record);
			}
			sm.selectRecords(selRecords);
		},
		getValue: function() {},
		markInvalid: function() {},
		clearInvalid: function() {},
		isValid: function() { return true},
		disabled: false,
		getName: function() {return this.name},
		validate: function() { return true},
		hideLabel: true,
		isFormField: true,
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
						toggleGroup: 'stigAsset-groupBy',
						enableToggle:true,
						allowDepress: true,
						pressed: true,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('stigAssetGrid-expandButton' + idAppend).enable();
								Ext.getCmp('stigAssetGrid-collapseButton' + idAppend).enable();
								store.groupBy('stigName');
							} else {
								Ext.getCmp('stigAssetGrid-expandButton' + idAppend).disable();
								Ext.getCmp('stigAssetGrid-collapseButton' + idAppend).disable();
								store.clearGrouping();
							}
						}
					},{
						xtype: 'tbbutton',
						icon: 'img/mycomputer1-16.png',
						tooltip: 'Group by asset',
						toggleGroup: 'stigAsset-groupBy',
						enableToggle:true,
						allowDepress: true,
						width: 20,
						handler: function(btn){
							if (btn.pressed) {
								Ext.getCmp('stigAssetGrid-expandButton' + idAppend).enable();
								Ext.getCmp('stigAssetGrid-collapseButton' + idAppend).enable();
								store.groupBy('assetName');
							} else {
								Ext.getCmp('stigAssetGrid-expandButton' + idAppend).disable();
								Ext.getCmp('stigAssetGrid-collapseButton' + idAppend).disable();
								store.clearGrouping();
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron.png',
						icon: 'img/minus-grey.png',
						id: 'stigAssetGrid-collapseButton' + idAppend,
						tooltip: 'Collapse all groups',
						width: 20,
						handler: function(btn){
							grid.getView().collapseAllGroups();
						}
					},{
						xtype: 'tbbutton',
						//icon: 'img/chevron_expand.png',
						icon: 'img/plus-grey.png',
						id: 'stigAssetGrid-expandButton' + idAppend,
						tooltip: 'Expand all groups',
						width: 20,
						handler: function(btn){
							grid.getView().expandAllGroups();
						}
					}]
				// END Grouping control
				},{
				// START Filter control
					xtype: 'buttongroup',
					title: 'Filtering',
					items: [
					{
						xtype: 'tbbutton',
						icon: 'img/security_firewall_on.png',
						tooltip: 'Filter by STIG',
						toggleGroup: 'stigAsset-filterBy',
						enableToggle:true,
						allowDepress: true,
						pressed: false,
						width: 20,
						handler: function(btn){
							var filterField = Ext.getCmp('stigAssetGrid-filterField' + idAppend);
							if (btn.pressed) {
								filterField.enable();
								store.filterField = 'stigName';
								if (filterField.getRawValue() == '') {
									filterField.emptyText = 'Enter a STIG filter...';
									filterField.setRawValue(filterField.emptyText);
								} else {
									filterField.emptyText = 'Enter a STIG filter...';
								}
								filterStigAssetStore();
							} else {
								filterField.disable();
								//filterField.setValue('');
								filterStigAssetStore();
							}
						}
					},{
						xtype: 'tbbutton',
						icon: 'img/mycomputer1-16.png',
						tooltip: 'Filter by asset',
						toggleGroup: 'stigAsset-filterBy',
						enableToggle:true,
						allowDepress: true,
						width: 20,
						handler: function(btn){
							var filterField = Ext.getCmp('stigAssetGrid-filterField' + idAppend);
							if (btn.pressed) {
								filterField.enable();
								store.filterField = 'assetName';
								if (filterField.getRawValue() == '') {
									filterField.emptyText = 'Enter an asset filter...';
									filterField.setRawValue(filterField.emptyText);
								} else {
									filterField.emptyText = 'Enter an asset filter...';
								}
								filterStigAssetStore();
							} else {
								filterField.disable();
								//filterField.setValue('');
								filterStigAssetStore();
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'trigger',
						fieldLabel: 'Filter',
						triggerClass: 'x-form-clear-trigger',
						onTriggerClick: function() {
							this.triggerBlur();
							this.blur();
							this.setValue('');
							filterStigAssetStore();
						},
						id: 'stigAssetGrid-filterField' + idAppend,
						width: 140,
						submitValue: false,
						disabled: true,
						enableKeyEvents:true,
						emptyText:'Filter string...',
						listeners: {
							keyup: function (field,e) {
								filterStigAssetStore();
								return false;
							}
						}
					},{
						xtype: 'tbseparator'
					},{
						xtype: 'tbbutton',
						icon: 'img/list-remove-16.png',
						tooltip: 'Show disabled items only',
						id: 'stigAssetGrid-filterButton' + idAppend,
						toggleGroup: 'stigAsset-selector',
						enableToggle:true,
						allowDepress: true,
						toggleHandler: function (btn,state) {
							filterStigAssetStore();
						}
					}
					// ,{
						// xtype: 'tbbutton',
						// icon: 'img/remove-grey.png',
						// tooltip: 'Clear filter string',
						// width: 20,
						// handler: function(btn){
							// Ext.getCmp('users-stigAssetGrid-filterField').setValue('');
							// filterStigAssetStore();
						// }
					// }
					]
				}
			]
		}),
		name: 'stigAssets'			

	});

	function filterStigAssetStore () {
		var value = Ext.getCmp('stigAssetGrid-filterField' + idAppend).getValue();
		var selectionsOnly = Ext.getCmp('stigAssetGrid-filterButton' + idAppend).pressed;
		if (value == '' || Ext.getCmp('stigAssetGrid-filterField' + idAppend).disabled) { // filter field is empty or diabled
			if (selectionsOnly) {
				store.filter([
					{
						fn: filterDept // defined in stigmanUtils.js
					},
					{
						fn: filterChecked, // defined in stigmanUtils.js
						scope: sm
					}
				]);
			} else {
				store.filter([
					{
						fn: filterDept
					}
				]);
			}
		} else {
			if (selectionsOnly) {
				store.filter([
					{
						fn: filterDept
					},
					{
						property:store.filterField,
						value:value,
						anyMatch:true,
						caseSensitive:false
					},{
						fn: filterChecked,
						scope: sm
					}
				]);
			} else {
				store.filter([
					{
						fn: filterDept
					},
					{
						property:store.filterField,
						value:value,
						anyMatch:true,
						caseSensitive:false
					}
				]);
			}
		}
	};
	
	this.grid = grid;
	this.store = store;
	this.sm = sm;
	this.filterFn = filterStigAssetStore;
	
}

function Sm_HistoryData (idAppend) {
	this.fields = Ext.data.Record.create([
		{
			name:'result',
			type: 'string'
		},
		{
			name:'resultComment',
			type:'string'
		},
		{
			name:'action',
			type:'string'
		},{
			name:'actionComment',
			type:'string'
		},
		{
			name:'autoResult',
			type:'boolean'
		},
		{
			name:'userId',
			type:'string'
		},{
			name:'username',
			type:'string'
		},
		{
			name:'ts',
			type:'date',
			dateFormat: 'c'
		},
		{
			name:'status',
			type:'string'
		}	
	]);

	this.store = new Ext.data.JsonStore({
		root: '',
		storeId: 'historyStore' + idAppend,
		fields: this.fields,
		sortInfo: {
			field: 'ts',
			direction: 'DESC' // or 'DESC' (case sensitive for local sorting)
		},
		idProperty: (v) => {
			return v.ts + v.status
		}
	});

	expander = new Ext.ux.grid.RowExpander({
		tpl: new Ext.XTemplate(
		  '<p><b>Result Comment:</b> {resultComment}</p>',
		  '<tpl if="action">',
		  '<p><b>Action:</b> {action}</p>',
		  '</tpl>',
		  '<tpl if="actionComment">',
		  '<p><b>Action Comment:</b> {actionComment}</p>',
		  '</tpl>'
		)
	  })

	
	this.grid = new Ext.grid.GridPanel({
		layout: 'fit',
    enableDragDrop: true,
    ddGroup: 'gridDDGroup',
		plugins: expander,
		border: false,
		id: 'historyGrid' + idAppend,
		store: this.store,
		stripeRows:true,
		view: new Ext.grid.GridView({
			forceFit:true,
			emptyText: 'No history to display.',
			deferEmptyText:false
		}),
		columns: [
			expander,
			{ 	
				header: "Timestamp",
				width: 120,
				resizeable: false,
				dataIndex: 'ts',
				sortable: true,
				align: 'left',
				xtype: 'datecolumn',
				format:	'Y-m-d H:i:s T'
			},
			{ 	
				header: "Status", 
				width: 50,
				fixed: true,
				dataIndex: 'status',
				sortable: true,
				renderer: renderStatuses
			},
			{ 
				id:'result' + idAppend,
				header: "Result",
				width: 50,
				fixed: true,
				dataIndex: 'result',
				renderer: function (val) {
					switch (val) {
						case 'fail':
							return '<div style="color:red;font-weight:bolder;text-align:center">O</div>';
							break;
						case 'pass':
							return '<div style="color:green;font-weight:bolder;text-align:center">NF</div>';
							break;
						case 'notapplicable':
							return '<div style="color:grey;font-weight:bolder;text-align:center">NA</div>';
							break;
					}
				},
				sortable: true
			},
			{ 	
				header: "User", 
				width: 50,
				dataIndex: 'username',
				sortable: true
			},

			// { 	
			// 	header: "Result comment", 
			// 	width: 100,
			// 	dataIndex: 'resultComment',
			// 	renderer: columnWrap,
			// 	sortable: true
			// },
			// { 	
			// 	header: "Action", 
			// 	width: 80,
			// 	fixed: true,
			// 	dataIndex: 'action',
			// 	renderer: function (val) {
			// 		let actions = {
			// 			remediate: 'Remediate',
			// 			mitigate: 'Mitigate',
			// 			exception: 'Exception'
			// 		}
			// 		return actions[val];
			// 	},
			// 	sortable: true
			// },
			// { 	
			// 	header: "Action comment", 
			// 	width: 100,
			// 	dataIndex: 'actionComment',
			// 	renderer: columnWrap,
			// 	sortable: true
			// }
		]
	});
}

function sortGroupId (groupId) {
	function padZero(a,b){
		return(1e15+a+"").slice(-b)
	};
	var vNum = groupId.match(/^V-(\d+)/);
	if (vNum == null) {
		return groupId;
	} else {
		return padZero(vNum[1],8);
	}
}

function sortRuleId (ruleId) {
	function padZero(a,b){
		return(1e15+a+"").slice(-b)
	};
	var vNum = ruleId.match(/^SV-(\d+)r*/);
	if (vNum == null) {
		return ruleId;
	} else {
		return padZero(vNum[1],8);
	}
}

function sortSeverity (severity) {
	switch (severity) {
		case 'mixed':
			return 0
		case 'low':
			return 1
		case 'medium':
			return 2
		case 'high':
			return 3
	}
}

function sortIpAddress (v){
	var parts = String(v).split('.');
	for(var i = 0, len = parts.length; i < len; i++){
		parts[i] = String.leftPad(parts[i], 3, '0');
	}
	return parts.join('.');
}

function sortIaControls (control){
	function padZero(a,b){
		return(1e15+a+"").slice(-b)
	};

	var parts = control.match(/((?:[A-Z]{2})-)(\d+)(?:\((\d+)\))?(?:\.*)(\d+)?/);
	//parts Indices: prefix: 1, control#: 2, enhancement:3, ap: 4

	var sortValue = parts[1]+padZero(parts[2],4);
	
	if (parts[3]){
		sortValue = sortValue + "(" + padZero(parts[3],4);
	} 
	else {
		sortValue = sortValue + "(0000)";
	}
	if (parts[4]){
		sortValue = sortValue + "." + padZero(parts[4],4);
	}
	// sortValue = sortValue.replace(".","!");
	return sortValue;
}

function getFileIcon (filename) {
	var extension = filename.substr((~-filename.lastIndexOf(".") >>> 0) + 2).toLowerCase(); //http://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/1203361#1203361
	switch (extension) {
		case 'doc':
		case 'docx':
			return 'img/page_word.png';
			break;
		case 'pdf':
			return 'img/page_white_acrobat.png';
			break;
		case 'jpg':
		case 'gif':
		case 'bmp':
			return 'img/page_white_camera.png';
			break;
		case 'xls':
		case 'xlsx':
			return 'img/page_excel.png';
			break;
		case 'ppt':
		case 'pptx':
			return 'img/page_white_powerpoint.png';
			break;
		case 'zip':
			return 'img/page_white_compressed.png';
			break;
		default:
			return 'img/page.png';
			break;
	}
}

function isReviewComplete (state,resultComment,action,actionComment) {
	if (state === 'fail') { // Open
		if (resultComment != '' && undefined != resultComment) {
			if (action != null && action != '') {
				if (actionComment != '' && actionComment != null) {
					return true;
				}
			}
		}
	} else { // not Open
		if (resultComment != '' && resultComment != null) {
			return true;
		}
	}			
	return false;
}

function duplicateRecords (srcStore,dstStore) {
	var records = [];
	srcStore.each(function(r){
		records.push(r.copy());
	});
	dstStore.removeAll();
	dstStore.add(records);
}

// filterChecked(): Boolean
// returns true for records that are selected in the selectionModle sm
function filterChecked (record,sm) {
	return this.isSelected(record);
}

function filterDept (record,sm) {
	if (curUser.privileges.canAdmin) {
		return true;
	}
	if (record.data.deptId == curUser.deptId) {
		return true;
	} else {
		return false;
	}
}


// encodeSm(): String
// returns JSON encoded array
function encodeSm (sm,field) {
	var myArray = new Array;
	var selArray = sm.getSelections();
	for (var i=0; i < selArray.length; i++) {
		myArray.push(selArray[i].data[field]);
	}
	return Ext.util.JSON.encode(myArray);
}

// encodeSm(): String
// returns JSON encoded array
function encodeSmExtend (sm,parentField,childField) {
	var myArray = new Array;
	var selArray = sm.getSelections();
	for (var i=0; i < selArray.length; i++) {
		var myObject = new Object;
		myObject.parent = selArray[i].data[parentField];
		myObject.children = selArray[i].data[childField];
		myArray.push(myObject);
	}
	return Ext.util.JSON.encode(myArray);
}

//encodeStore: JSON Object (String)
//returns specified fields in store as JSON encoded array
function encodeStore(store,field){
	var myArray = new Array;
	var selArray = store.getRange();
	for (var i=0; i < selArray.length; i++) {
		myArray.push(selArray[i].data[field]);
	}
	return Ext.util.JSON.encode(myArray);
}

//encodeStore: JSON Object (String)
//returns specified fields in store as JSON encoded array
function encodeStoreDone(store,field){
	var myArray = new Array;
	var selArray = store.getRange();
	for (var i=0; i < selArray.length; i++) {
		if (selArray[i].data.done == 1){
			myArray.push(selArray[i].data[field]);
		}
	}
	return Ext.util.JSON.encode(myArray);
}

async function handleGroupSelectionForAsset (groupGridRecord, collectionId, assetId, idAppend, benchmarkId, revisionStr) {
	try {
		// CONTENT
		let contentPanel = Ext.getCmp('content-panel' + idAppend)
		let contentReq = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules/${groupGridRecord.data.ruleId}`,
			method: 'GET',
			params: {
				projection: ['details','cci','checks','fixes']
				// projection: 'details'
			}
		})
		let content = JSON.parse(contentReq.response.responseText)
		contentPanel.update(content)
		contentPanel.setTitle('Rule for Group ' + groupGridRecord.data.groupId)

		// REVIEW
		let reviewsReq = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews`,
			method: 'GET',
			params: {
				rules: 'all',
				ruleId: groupGridRecord.data.ruleId
			}
		})
		let reviews = Ext.util.JSON.decode(reviewsReq.response.responseText)
		let review = reviews.filter(review => review.assetId == assetId)[0] || {}
		let otherReviews = reviews.filter(review => review.assetId != assetId)

		// load review
		let reviewForm = Ext.getCmp('reviewForm' + idAppend)
		let form = reviewForm.getForm()
		form.reset();
		reviewForm.isLoaded = false
		
		// Set the legacy editStr property
		if (review.ts) {
			let extDate = new Date(review.ts)
			review.editStr = `${extDate.format('Y-m-d H:i T')} by ${review.username}`
		}

		// Display the review
		form.setValues(review)

		reviewForm.groupGridRecord = groupGridRecord
		reviewForm.isLoaded = true
		let resultCombo = form.findField('result-combo' + idAppend)
		let resultComment = form.findField('result-comment' + idAppend)
		let actionCombo = form.findField('action-combo' + idAppend)
		let actionComment = form.findField('action-comment' + idAppend)

		// Initialize the lastSavedData properties
		if ( resultCombo.value === null ) { resultCombo.value = '' }
		resultCombo.lastSavedData = resultCombo.value
		if (review.resultComment === null) {
			resultComment.lastSavedData = ""
		} else {
			resultComment.lastSavedData = resultComment.getValue()
		}
		if ( actionCombo.value === null ) { actionCombo.value = '' }
		actionCombo.lastSavedData = actionCombo.value
		if (review.actionComment === null) {
			actionComment.lastSavedData = ""
		} else {
			actionComment.lastSavedData = actionComment.getValue()
		}


		// load others
		Ext.getCmp('otherGrid' + idAppend).getStore().loadData(otherReviews);

		// History
		let historyReq = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews/${assetId}/${groupGridRecord.data.ruleId}`,
			method: 'GET',
			params: { 
				projection: 'history'
			}
		})
		let reviewWithHistory = Ext.util.JSON.decode(historyReq.response.responseText)
		if (! reviewWithHistory) {
			Ext.getCmp('historyGrid' + idAppend).getStore().removeAll()
		}
		else if (reviewWithHistory.history) {
			Ext.getCmp('historyGrid' + idAppend).getStore().loadData(reviewWithHistory.history)
		}
		// Feedback
		Ext.getCmp(`feedback-tab${idAppend}`).update(reviewWithHistory.rejectText)

		reviewForm.setReviewFormItemStates(reviewForm)
	}
	catch (e) {
		if (e.response) {
			alert (e.response.responseText)
		}
		else {
			alert (e)
		}
	}	
}	

function checked(val) {
	if (val == 'X') {
		return '<img src="img/greencheckt.gif">';
	} else if (val == 'O'){
		return '<img src="img/31.gif">';
	} else {
		return '';
	}
}

// function renderResult(val, metaData, record, rowIndex, colIndex, store) {
// 	if (val == 'pass') {
// 		return '<div style="color:green;font-weight:bolder;text-align:center;">NF</div>';
// 	} else if (val == 'fail'){
// 		return '<div style="color:red;font-weight:bolder;text-align:center">O</div>';
// 	} else if (val == 'notapplicable'){
// 		return '<div style="color:grey;font-weight:bolder;text-align:center">NA</div>';
// 	} else {
// 		return '';
// 	}
// }

function renderResult(val, metaData, record, rowIndex, colIndex, store) {
	switch (val) {
		case 'pass':
			return '<div class="sm-grid-result-sprite sm-result-pass">NF</div>'
		case 'fail':
			return '<div class="sm-grid-result-sprite sm-result-fail">O</div>'
		case 'notapplicable':
			return '<div class="sm-grid-result-sprite sm-result-na">NA</div>'
		case 'notchecked':
			return '<div class="sm-grid-result-sprite sm-result-nr">NR</div>'
		default:
			return ''
	}
}



function renderStatuses(val, metaData, record, rowIndex, colIndex, store) {
	var statusIcons = '';
	switch (record.data.status) {
		case 'saved':
			statusIcons += '<img src="img/disk-16.png" width=12 height=12 ext:qtip="Saved" style="padding-top: 1px;">';
			break;
		case 'submitted':
			statusIcons += '<img src="img/ready-16.png" width=12 height=12 ext:qtip="Submitted" style="padding-top: 1px;">';
			break;
		case 'rejected':
			statusIcons += '<img src="img/rejected-16.png" width=12 height=12 ext:qtip="Rejected" style="padding-top: 1px;">';
			break;
		case 'accepted':
			statusIcons += '<img src="img/lock-16.png" width=12 height=12 ext:qtip="Accepted" style="padding-top: 1px;">';
			break;
		default:
			statusIcons += '<img src="img/pixel.gif" width=12 height=12>';
			break;
	}
	statusIcons += '<img src="img/pixel.gif" width=4 height=12>';
	if (record.data.hasAttach) {
		statusIcons += '<img src="img/attach-16.png" width=12 height=12 ext:qtip="Has attachments" style="padding-top: 1px;">';
	} else {
		statusIcons += '<img src="img/pixel.gif" width=12 height=12>';
	}
	return statusIcons;
}

function renderStatus(val) {
	switch (val) {
		case 'submitted':
			return '<img src="img/ready-16.png" width=12 height=12 ext:qtip="Submitted">';
			break;
		case 'rejected':
			return '<img src="img/rejected-16.png" width=12 height=12 ext:qtip="Rejected">';
			break;
		case 'accepted':
			return '<img src="img/lock-16.png" width=12 height=12 ext:qtip="Accepted">';
			break;
		default:
			return '<img src="img/pixel.gif" width=12 height=12>';
			break;
	}
}

// function renderSeverity(val) {
// 	switch (val) {
// 		case 'high':
// 			return '1';
// 		case 'medium':
// 			return '2';
// 		case 'low':
// 			return '3';
// 		case 'mixed':
// 			return 'M';
// 		default:
// 			return 'U';
// 	}
// }

const renderSeverity = (val) => {
	switch (val) {
		case 'high':
			return '<span class="sm-grid-sprite sm-severity-high">CAT 1</span>'
		case 'medium':
			return '<span class="sm-grid-sprite sm-severity-medium">CAT 2</span>'
		case 'low':
			return '<span class="sm-grid-sprite sm-severity-low">CAT 3</span>'
		case 'mixed':
			return '<span class="sm-grid-sprite sm-severity-low">Mixed</span>'
		default:
			return '<span class="sm-grid-sprite sm-severity-low">U</span>'
	}
}


function columnWrap(val){
	if (undefined != val) {
		val = val.replace(/\n/g, "<br//>");
	}
    return '<div style="white-space:normal !important;">'+ val +'</div>';
}

function commentColumn (value, metaData, record, rowIndex, colIndex, store) {
	if (undefined != value) {
		value = value.replace(/\n/g, "<br//>");
	}
	var formattedString;
	formattedString = '<b>Feedback from: ' + record.data.userName + '</b> (' + record.data.date.format("Y-m-d H:i:s") + ')';
	formattedString += '<div style="white-space:normal !important;">';
	formattedString += '<br>' + value + '<br>';
	if (undefined != record.data.ackName && record.data.ackName != '') {
		formattedString += '<br><b><img src="img/feedback-ack-16.gif"> Acknowledged: ' + record.data.ackName + '</b> (' + record.data.ackDate.format("Y-m-d H:i:s") + ')<br>&nbsp;';
	} else {
		formattedString += '<br><img src="img/feedback-16.gif"> <b>Unacknowledged</b> <i>(right-click to acknowledge)</i><br>&nbsp;';
	}
	formattedString += '</div>';
	return formattedString;
}

function feedbackContextMenu(grid,rowIndex,event){
	var gridId = grid.getId();
	grid.ctxRecord = grid.store.getAt(rowIndex);
	if (!grid.contextMenu) {
		grid.contextMenu = new Ext.menu.Menu({
			id: gridId + '-gridCtxMenu',
			myGrid: grid,
			items: [{
				text: 'Acknowledge this feedback',
				iconCls: 'sm-feedback-ack-icon',
				scope:grid,
				handler: function () {
					//'this' is the grid
					Ext.Ajax.request({
						url: 'pl/updateCommentAck.pl',
						params: { 
							commentId: this.ctxRecord.data.commentId,
							ack: 1
						},
						success: function(response, request) {                               
							var responseObj = Ext.util.JSON.decode(response.responseText);
							if (responseObj.success) {
								grid.ctxRecord.data.ackName = responseObj.ackName;
								grid.ctxRecord.data.ackDate = new Date(responseObj.ackDate);
								// handle date as well
								grid.ctxRecord.commit();
							}
						},
						failure: function(results, request) {
							alert('Error');
						}
					});

				}
			},{
				text: 'Unacknowledge this feedback',
				iconCls: 'sm-feedback-unack-icon',
				scope:grid,
				handler: function () {
					//'this' is the grid
					Ext.Ajax.request({
						url: 'pl/updateCommentAck.pl',
						params: { 
							commentId: this.ctxRecord.data.commentId,
							ack: 0
						},
						success: function(response, request) {                               
							var responseObj = Ext.util.JSON.decode(response.responseText);
							if (responseObj.success) {
								grid.ctxRecord.data.ackName = '';
								// handle date as well
								grid.ctxRecord.commit();
							}
						},
						failure: function(results, request) {
							alert('Error');
						}
					});

				}
			}]
		});
	}
	event.stopEvent();
	var xy = event.getXY();
	grid.contextMenu.showAt(xy);
}

function handleFeedbackCtxAck (menu,e) {
}

function getSelectedFieldValues (sm, field) {
	var selections = sm.getSelections();
	var selLength = selections.length;
	var selectedFieldValues = [];
	for (var i = 0; i < selLength; i++) {
		selectedFieldValues.push(selections[i].data[field]);
	}
	return selectedFieldValues;
}

function updateStores(field,value,sourceStore,sourceRecord) {
	Ext.StoreMgr.each(function (curStore,i,l) {
		var curRecord = curStore.getAt(curStore.find(field,value));
	});
}

function getUuid () {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}

function uploadArchive(n) {
	var fp = new Ext.FormPanel({
		standardSubmit: false,
		fileUpload: true,
		baseCls: 'x-plain',
		monitorValid: true,
		autoHeight: true,
		//bodyStyle: 'padding: 10px 10px 0 10px;',
		labelWidth: 1,
		hideLabel: true,
		defaults: {
			anchor: '100%',
			allowBlank: false
			//msgTarget: 'side'
		},
		baseParams: {
			collectionId: n.attributes.collectionId
		},					
		items: [
		{
			xtype: 'hidden',
			id: 'import-filename',
			name: 'filename'
		},
		{
			xtype: 'hidden',
			id: 'import-filesize',
			name: 'filesize'
		},
		{
			xtype: 'hidden',
			id: 'import-modified',
			name: 'modified'
		},
		{
			xtype: 'hidden',
			id: 'import-uuid',
			name: 'uuid'
		},
		{ // start fieldset config
			xtype:'fieldset',
			title: 'Instructions',
			autoHeight:true,
			items: [
			{
				xtype: 'displayfield',
				id: 'infoText1',
				// emptyText: 'Browse for a file... asset:' + leaf.assetId,
				// fieldLabel: 'Import',
				name: 'infoText',
				html: "Please browse for a ZIP archive containing one or more CKL files (generated by DISA's STIG Viewer) and/or XCCDF files (from SPAWAR's SCAP Compliance Checker (SCC)).<br><br>The archive must contain results for the collection <b>" + n.attributes.collectionName + '</b>',
				// buttonText: 'Browse...',
				// buttonCfg: {
					// icon: "img/disc_drive.png"
				// }
			}]
		},
		// { // start fieldset config
			// xtype:'fieldset',
			// title: 'Select file',
			// autoHeight:true,
			// items: [
			{
				xtype: 'fileuploadfield',
				id: 'form-file',
				emptyText: 'Browse for a file...',
				//fieldLabel: 'Import',
				name: 'importFile',
				accept: '.zip',
				buttonText: 'Browse...',
				buttonCfg: {
					icon: "img/disc_drive.png"
				},
				listeners: {
					fileselected: function(field,filename){
						var i = field.fileInput.dom.files[0];
						var extension = i.name.substr(i.name.lastIndexOf('.')+1).toLowerCase();
						if (extension != 'zip') {
							field.setValue("");
							alert("Invalid file extension");
							return;
						}
						Ext.getCmp('import-filesize').setValue(i.size);
						Ext.getCmp('import-filename').setValue(i.name);
						Ext.getCmp('import-modified').setValue(Math.floor(i.lastModified/1000));
						Ext.getCmp('import-uuid').setValue(getUuid());
					}
				}
			},
			{
				xtype: 'displayfield',
				id: 'infoText2',
				// emptyText: 'Browse for a file... asset:' + leaf.assetId,
				// fieldLabel: 'Import',
				name: 'infoText',
				html: "<i><b>IMPORTANT: Results from the imported file will overwrite any existing results!</b></i>",
				// buttonText: 'Browse...',
				// buttonCfg: {
					// icon: "img/disc_drive.png"
				// }
			}]
		//}]
		,
		buttonAlign: 'center',
		buttons: [{
			text: 'Import',
			icon: 'img/page_white_get.png',
			tooltip: 'Import the archive',
			formBind: true,
			handler: async function(){
				if(fp.getForm().isValid()){
					let formEl = fp.getForm().getEl().dom
					let input = document.getElementById("form-file-file")
					processZip(input.files[0])
					// let reader = new FileReader()
					// reader.onload = function (e) {
					//   let data = e.target.result
					//   processZip(data)
					// //   data = new Uint8Array(data)
					// }
					// reader.readAsArrayBuffer(input.files[0])
				}

				async function processZip (f) {
					try {
						let zip = new JSZip()
						// zip.loadAsync( f /* = file blob */)
						// .then(function(zip) {
						// 	// process ZIP file content here
						// 	alert("OK")
						// }, function() {alert("Not a valid zip file")}); 
				   
						let contents = await zip.loadAsync(f)
						let members = []
						Object.keys(contents.files).forEach( filename => {
							members.push(filename)
						})
						for (let x = 0, l = members.length; x < l; x++) {
							let fn = members[x]
							console.log(fn)
							let data = await zip.files[fn].async("blob")
							let fd = new FormData()
							fd.append('importFile', data, fn)
							// fd.append('assetId', null)
							// fd.append('benchmarkId', null)
							fd.append('collectionId', n.attributes.collectionId)
							fd.append('source', 'collection')

							await window.keycloak.updateToken(10)
							let response = await fetch(`${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews`, {
								method: 'POST',
								headers: new Headers({
								  'Authorization': `Bearer ${window.keycloak.token}`
								}),
								body: fd
							  })
							let one = 1


						}
					}
					catch (e) {
						alert(e.message)
					}
				  
				}
			}
		},
		{
			text: 'Cancel',
			handler: function(){appwindow.close();}
		}
		]
	});

	var appwindow = new Ext.Window({
		title: 'Import ZIP archive of results in CKL or XCCDF format',
		modal: true,
		width: 500,
		//height:140,
		//minWidth: 500,
		//minHeight: 140,
		layout: 'fit',
		plain:true,
		bodyStyle:'padding:5px;',
		buttonAlign:'center',
		items: fp
	});

	appwindow.show(document.body);


}; //end uploadArchive();

function uploadStigs(n) {
	var fp = new Ext.FormPanel({
		padding: 10,
		standardSubmit: false,
		fileUpload: true,
		baseCls: 'x-plain',
		monitorValid: true,
		autoHeight: true,
		labelWidth: 1,
		hideLabel: true,
		defaults: {
			anchor: '100%',
			allowBlank: false
		},
		items: [
			{ 
				xtype:'fieldset',
				title: 'Instructions',
				autoHeight:true,
				items: [
				{
					xtype: 'displayfield',
					id: 'infoText1',
					name: 'infoText',
					html: "Please browse for STIG",
				}]
			},
			{
				xtype: 'fileuploadfield',
				id: 'form-file',
				emptyText: 'Browse for a file...',
				name: 'importFile',
				accept: '.zip,.xml',
				buttonText: 'Browse...',
				buttonCfg: {
					icon: "img/disc_drive.png"
				}
			},
			{
				xtype: 'displayfield',
				id: 'infoText2',
				name: 'infoText',
				html: "<i><b>IMPORTANT: Results from the imported file will overwrite any existing results!</b></i>",
			}
		],
		buttonAlign: 'center',
		buttons: [{
			text: 'Import',
			icon: 'img/page_white_get.png',
			tooltip: 'Import the archive',
			formBind: true,
			handler: async function(){
				try {
					let input = document.getElementById("form-file-file")
					let file = input.files[0]
					let extension = file.name.substring(file.name.lastIndexOf(".")+1)
					if (extension.toLowerCase() === 'xml') {
						let formEl = fp.getForm().getEl().dom
						let formData = new FormData(formEl)
						formData.set('replace', 'true')
						appwindow.close();
						initProgress("Importing file", "Initializing...");
						updateStatusText (file.name)
		
						await window.keycloak.updateToken(10)
						let response = await fetch(`${STIGMAN.Env.apiBase}/stigs`, {
						method: 'POST',
						headers: new Headers({
							'Authorization': `Bearer ${window.keycloak.token}`
						}),
						body: formData
						})
						let json = await response.json()
						updateStatusText (JSON.stringify(json, null, 2))
						updateStatusText ('------------------------------------')
						updateStatusText ('Done')
						updateProgress(0, 'Done')
					}
					else if (extension === 'zip') {
						appwindow.close()
						initProgress("Importing file", "Initializing...");
						await processZip(input.files[0])
						updateStatusText ('Done')
						updateProgress(0, 'Done')
					} else {
						alert(`No handler for ${extension}`)
					}
				}
				catch (e) {
					alert(e)
				}
				finally {
					Ext.getCmp('stigGrid').getStore().reload()
				}

				async function processZip (f) {
					try {
						let parentZip = new JSZip()
		   
						let contents = await parentZip.loadAsync(f)
						let fns = Object.keys(contents.files)
						let xmlMembers = fns.filter( fn => fn.toLowerCase().endsWith('.xml'))
						let zipMembers = fns.filter( fn => fn.toLowerCase().endsWith('.zip') )
						for (let x=0,l=xmlMembers.length; x<l; x++) {
							let xml = xmlMembers[x]
							updateStatusText (xml)
							let data = await parentZip.files[xml].async("blob")
							let fd = new FormData()
							fd.append('importFile', data, xml)
							fd.append('replace', 'true')

							await window.keycloak.updateToken(10)
							let response = await fetch(`${STIGMAN.Env.apiBase}/stigs`, {
								method: 'POST',
								headers: new Headers({
									'Authorization': `Bearer ${window.keycloak.token}`
								}),
								body: fd
							})
							let json = await response.json()
							updateStatusText (JSON.stringify(json, null, 2))
							updateStatusText ('------------------------------------')

						}
						for (let x=0, l=zipMembers.length; x<l; x++) {
							let zip = zipMembers[x]
							updateProgress((x+1)/l, zip.slice(zip.lastIndexOf('/') + 1))
							updateStatusText (`Extracting member ${zip}`)
							let data = await parentZip.files[zip].async("blob")
							updateStatusText (`Processing member ${zip}`)
							await processZip(data)
						}
						updateProgress(0, "")

					}
					catch (e) {
						throw (e)
					}
				  
				}
			}
		},
		{
			text: 'Cancel',
			handler: function() {
				appwindow.close()
			}
		}
		]
	});

	var appwindow = new Ext.Window({
		title: 'Import STIG ZIP archive or XCCDF file',
		modal: true,
		width: 500,
		//height:140,
		//minWidth: 500,
		//minHeight: 140,
		layout: 'fit',
		plain:true,
		bodyStyle:'padding:5px;',
		buttonAlign:'center',
		items: fp
	});

	appwindow.show(document.body);


}; //end uploadStigs();

async function fetchStigs() {
	let r = await fetch('https://public.cyber.mil/stigs/compilations/', {
		mode: 'no-cors'
	})
	let body = await r.text()
	let one = 1
}

//=================================================
//TAKES IN APPROPRIATE TREE NODE AND PULLS THE 
//PACKAGE ID, STIG ID AND ASSET ID.  THE VALUES
//ARE RETURNED IN THE RESET OBJECT THAT IS PASSED
//IN BY REFERENCE.
//=================================================
function getUnlockInfo(n, unlockObject){
	
	if (n.attributes.node== 'collection'){
		//=============================================
		//THIS IS A PACKAGE-LEVEL RESET
		//=============================================
		unlockObject.collectionId = n.attributes.collectionId;
		unlockObject.collectionName = n.attributes.collectionName;
		unlockObject.assetId = -1;
		unlockObject.assetName = '';
		unlockObject.benchmarkId = '';
		//unlockObject.stigName = '';
	}
	else {
		//=============================================
		//THIS IS A EITHER A STIG OR ASSET-LEVEL RESET
		//=============================================
		if (n.attributes.report == 'stig'){
			//========================================
			//STIG-LEVEL NODE. GET STIG ID
			//========================================
			unlockObject.collectionId = n.attributes.collectionId;
			unlockObject.collectionName = '';
			unlockObject.benchmarkId = n.attributes.benchmarkId;
			//unlockObject.stigName = n.attributes.text;
			unlockObject.assetId = -1;
			unlockObject.assetName = '';
			}
		else if (n.attributes.report == 'asset'){
			//=========================================
			//ASSET-LEVEL NODE. GET ASSET ID
			//=========================================
			unlockObject.collectionId = n.attributes.collectionId;
			unlockObject.collectionName = '';
			unlockObject.assetId = n.attributes.assetId;
			unlockObject.assetName = n.attributes.text;
			unlockObject.benchmarkId = '';
			//unlockObject.stigName = '';
		}
	}
	//================================================
	//REGARDLESS OF THE RESET TYPE, THE RESET Depth
	//will determine whether the reset should be 
	//for only submitted reviews or submitted and 
	//approved reviews.
	//================================================
	unlockObject.unlockDepth = '';
}

//===================================================
//TAKES AN RESET OBJECT AND RESETS THE REVIEWS From
//A PACKAGE, ASSET IN THE PACKAGE, OR STIG IN THE 
//PACKAGE BASED ON THE VALUES IN THE reset OBJECT.
//===================================================
function batchReviewUnlock(unlockObject){
	Ext.getBody().mask('Unlocking reviews...');
	Ext.Ajax.request({
		url:'pl/batchReviewUnlock.pl',
		params:{
			collectionId: unlockObject.collectionId,
			collectionName: unlockObject.collectionName,
			assetId: unlockObject.assetId,
			assetName: unlockObject.assetName,
			benchmarkId: unlockObject.benchmarkId,
			unlockDepth: unlockObject.unlockDepth
			//stigName: unlockObject.stigName
		},
		success:function(response, request){
			Ext.getBody().unmask();
			//========================================
			//IF A GRID WAS SPECIFIED, REFRESH IT
			//========================================
			if (unlockObject.gridTorefresh){
				unlockObject.gridTorefresh.getStore().reload();
			}
			//========================================
			//RESPOND TO THE USER OF SUCCESSFUL RESET
			//========================================
			var responseObj = Ext.util.JSON.decode(response.responseText);
			Ext.Msg.alert(responseObj.responseTitle, responseObj.responseMsg);
		}, 
		failure: function (response,request){
			Ext.getBody().unmask();
			//========================================
			//INFORM USER OF FAILED reset
			//========================================
			Ext.Msg.alert('Batch Review Reset Failed!', 'Problems Encountered During Batch Reset.<br/>Please Contact an Administrator.');
		}
	});
}
