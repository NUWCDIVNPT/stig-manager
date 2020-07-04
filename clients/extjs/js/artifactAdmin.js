/* 
$Id: artifactAdmin.js 807 2017-07-27 13:04:19Z csmig $
*/

function addArtifactAdmin() {

	var artifactFields = Ext.data.Record.create([
		{
			name: 'artId',
			type: 'int'
		},{	
			name:'filename',
			type: 'string'
		},{
			name:'userName',
			type: 'string'
		},{
			name:'deptId',
			type: 'string'
		},{
			name:'sha1',
			type: 'string'
		},{
			name:'description',
			type: 'string'
		},{
			name: 'ts',
			type: 'date',
			dateFormat: 'Y-m-d H:i:s'
		},{
			name:'inUse',
			type: 'int'
		}
	]);

	var artifactStore = new Ext.data.JsonStore({
		url: 'pl/getArtifacts.pl',
		baseParams: {
			fromAdminTab: 1
		},
		root: 'rows',
		fields: artifactFields,
		totalProperty: 'records',
		idProperty: 'artId',
		sortInfo: {
			field: 'filename',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				store.isLoaded = true,
				Ext.getCmp('artifactGrid-totalText').setText(records.length + ' records');
				artifactGrid.getSelectionModel().selectFirstRow();
			},
			remove: function (store,record,index) {
				Ext.getCmp('artifactGrid-totalText').setText(store.getCount() + ' records');
			}
		}
	});

	var artifactGrid = new Ext.grid.GridPanel({
		id: 'artifact-admin',
		store: artifactStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [
			{ 	
				header: "Filename",
				width: 100,
				dataIndex: 'filename',
				sortable: true,
				align: 'left',
				renderer: function(value, metadata, record) {
					var returnStr = '<img src="' + getFileIcon(value) + '" class="sm-artifact-file-icon">' + value;
					return returnStr;
				}
			}
			,{
				header: "Description",
				id: 'artifact-description',
				width: 100,
				dataIndex: 'description',
				sortable: true,
				align: 'left',
			}
			,{
				header: "Uploaded by",
				width: 50,
				dataIndex: 'userName',
				sortable: true,
				align: 'left',
			}
			,{
				header: "Dept",
				width: 30,
				dataIndex: 'dept',
				sortable: true,
				align: 'left',
			}
			,{
				header: "Upload time",
				width: 60,
				dataIndex: 'ts',
				sortable: true,
				align: 'left',
				xtype: 'datecolumn',
				format:	'Y-m-d H:i:s'
			}
			,{
				header: "Uses",
				width: 30,
				dataIndex: 'inUse',
				sortable: true,
				align: 'left'
			}
			,{
				header: "SHA1",
				width: 60,
				dataIndex: 'sha1',
				sortable: true,
				align: 'left'
			}

		],
		autoExpandColumn: 'artifact-description',
		view: new Ext.grid.GridView({
			//forceFit:true,
			autoFill:true,
			// These listeners keep the grid in the same scroll position after the store is reloaded
			listeners: {
				beforerefresh: function(v) {
				   v.scrollTop = v.scroller.dom.scrollTop;
				   v.scrollHeight = v.scroller.dom.scrollHeight;
				},
				refresh: function(v) {
					setTimeout(function() { 
						v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
					}, 100);
				}
			},
			deferEmptyText:false
		}),
		listeners: {
			// rowdblclick: {
				// fn: function(grid,rowIndex,e) {
					// var r = grid.getStore().getAt(rowIndex);
					// Ext.getBody().mask('Getting properties of ' + r.get('collectionName') + '...');
					// showCollectionProps(r.get('collectionId'));
				// }
			// }
		},
		tbar: [{
			iconCls: 'icon-add',
			text: 'Upload...',
			handler: function() {
				uploadArtifact();            
			}
		}
		,'-'
		,{
			ref: '../removeBtn',
			iconCls: 'icon-del',
			text: 'Delete',
			handler: function() {
				var r = artifactGrid.getSelectionModel().getSelected();
				deleteArtifact(r);
			}
		}
		,'-'
		,{
			iconCls: 'sm-artifact-edit-icon',
			text: 'Edit description',
			handler: function() {
				var r = artifactGrid.getSelectionModel().getSelected();
				updateArtifactDescription(r);
			}
		}
		,'-'
		,{
			iconCls: 'sm-artifact-download-icon',
			text: 'Download',
			handler: function() {
				var r = artifactGrid.getSelectionModel().getSelected();
				window.location='pl/getArtifact.pl?artId=' + r.data.artId;
			}
		}
		],
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'tbbutton',
				id: 'stigGrid-csvBtn',
				iconCls: 'sm-export-icon',
				tooltip: 'Download this table\'s data as Comma Separated Values (CSV)',
				width: 20,
				handler: function(btn){
					var ourStore = stigGrid.getStore();
					var lo = ourStore.lastOptions;
					window.location=ourStore.url + '?csv=1&xaction=read';
				}
			}
			,{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				id: 'artifactGrid-totalText',
				text: '0 records',
				width: 80
			}]
		}),
		loadMask: true
	});

	var thisTab = Ext.getCmp('admin-center-tab').add({
		id: 'artifact-admin-tab',
		iconCls: 'sm-artifact-icon',
		title: 'Artifacts',
		closable:true,
		layout: 'fit',
		items: [artifactGrid]
		});
	thisTab.show();
	
	artifactGrid.getStore().load();
	
	
	function updateArtifactDescription(r) {
		var title = 'Update description';
		var msg = 'Description for "' + r.data.filename + '"';
		Ext.Msg.prompt(title,msg,callback,this,true,r.data.description);
		function callback (btn,text) {
			if (btn == 'ok') {
				Ext.Ajax.request({
					url: 'pl/updateArtifactDescription.pl',
					params: { 
						artId: r.data.artId,
						desc: text
					},				
					success: function(response, request) {                               
						var responseObj = Ext.util.JSON.decode(response.responseText);
						if (responseObj.success) {
							r.data.description = text;
							r.commit();
						}
					}
				});
			}
		};
	};

	function deleteArtifact(r) {
		var confirmStr = "";
		if (r.data.inUse > 0) {
			confirmStr += 'WARNING: The artifact "' + r.data.filename +  '" is attached to one or more reviews.<br><br>';
		}
		confirmStr += 'Remove artifact "' + r.data.filename + '"?';
		Ext.Msg.confirm("Confirm remove",confirmStr,function (btn,text) {
			if (btn == 'yes') {
				Ext.Ajax.request({
					url: 'pl/deleteArtifact.pl',
					params: { 
						artId: r.data.artId
					},
					success: function(response, request) {                               
						var responseObj = Ext.util.JSON.decode(response.responseText);
						if (responseObj.success) {
							artifactStore.remove(r);
						}
					},
					failure: function(results, request) {
					}
				});
			}
		});
		
	};

	function uploadArtifact() {
		var fp = new Ext.FormPanel({
			fileUpload: true,
			baseCls: 'x-plain',
			monitorValid: true,
			autoHeight: true,
			bodyStyle: 'padding: 10px 10px 0 10px;',
			labelWidth: 60,
			defaults: {
				anchor: '100%',
				allowBlank: false
				//msgTarget: 'side'
			},
			items: [
			{
				xtype: 'fileuploadfield',
				id: 'form-file',
				emptyText: 'Browse for a file...',
				fieldLabel: 'Artifact',
				name: 'importFile',
				buttonText: 'Browse...',
				buttonCfg: {
					icon: "img/disc_drive.png"
				}
			},
			{
				xtype: 'textarea',
				height: 150,
				emptyText: "Please describe the artifact's purpose.",
				fieldLabel: "Description",
				name: 'desc'
			}],
			buttons: [{
				text: 'Upload',
				icon: 'img/page_white_get.png',
				tooltip: 'Upload an artifact to STIG Manager.',
				formBind: true,
				handler: function(){
					if(fp.getForm().isValid()){
						fp.getForm().submit({
							url: 'pl/uploadArtifact.pl',
							waitMsg: 'Uploading artifact...',
							success: function(f, o){
								window.close();
								//Ext.Msg.alert('Status', o.result.message);
								artifactStore.loadData(o.result.artifacts,true); // append new record
								artifactStore.sort('filename');
								f.reset();
							},
							failure: function(f, o){
								window.close();
								Ext.Msg.alert('Failure', o.result.message);
								f.reset();
							}
						});
					}
				}
			}]
		});

		var window = new Ext.Window({
			title: 'Upload artifact',
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

		window.show(document.body);
	};
	
	
	
	
	
	
	

} // end addAttachAdmin()