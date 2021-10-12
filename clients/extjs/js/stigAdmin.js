function addStigAdmin( params ) {
	let { treePath } = params
	const tab = Ext.getCmp('main-tab-panel').getItem('stig-admin-tab')
	if (tab) {
		tab.show()
		return
	}

	var stigFields = Ext.data.Record.create([
		{	name:'benchmarkId',
			type: 'string'
		},
		{
			name: 'title',
			type: 'string'
		},
		{
			name: 'status',
			type: 'string'
		},
		{
			name: 'lastRevisionStr',
			type: 'string'
		},
		{
			name: 'lastRevisionDate',
			type: 'date',
			dateFormat: 'Y-m-d'
		},
		{
			name: 'ruleCount',
			type: 'integer'
		},
		{
			name: 'autoCount',
			type: 'integer'
		}
	]);

	var stigStore = new Ext.data.JsonStore({
		proxy: new Ext.data.HttpProxy({
			url: `${STIGMAN.Env.apiBase}/stigs`,
			method: 'GET'
		}),
		root: '',
		fields: stigFields,
		totalProperty: 'records',
		idProperty: 'benchmarkId',
		sortInfo: {
			field: 'benchmarkId',
			direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
			load: function (store,records) {
				store.isLoaded = true
				stigGrid.getSelectionModel().selectFirstRow();
			}
		}
	});

	const totalTextCmp = new SM.RowCountTextItem({store:stigStore})
	var stigGrid = new Ext.grid.GridPanel({
		id: 'stigGrid',
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
		region: 'center',
		store: stigStore,
		stripeRows:true,
		sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
		columns: [{ 	
				header: "Benchmark ID",
				width: 300,
				dataIndex: 'benchmarkId',
				sortable: true,
				filter: {type: 'string'}
			},{ 	
				header: "Title",
				id: 'stigGrid-title-column',
				width: 350,
				dataIndex: 'title',
				sortable: true,
				filter: {type: 'string'}
			},{ 	
				header: "Status",
				width: 150,
        align: "center",
				dataIndex: 'status',
				sortable: true,
				filter: {type: 'values'}
			},{ 	
				header: "Current revision",
				width: 150,
        align: "center",
				dataIndex: 'lastRevisionStr',
				sortable: true
			},{ 	
				header: "Revision date",
				width: 150,
        align: "center",
				dataIndex: 'lastRevisionDate',
				xtype: 'datecolumn',
				format: 'Y-m-d',
				sortable: true
			},{ 	
				header: "Rules",
				width: 150,
        align: "center",
				dataIndex: 'ruleCount',
				sortable: true
			},{ 	
				header: "SCAP Rules",
				width: 150,
        align: "center",
				dataIndex: 'autoCount',
				sortable: true,
				renderer: (v) => v ? v : '--'
			}
		],
		autoExpandColumn: 'stigGrid-title-column',
		view: new SM.ColumnFilters.GridView({
			forceFit:false,
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
				},
				filterschanged: function (view, item, value) {
					stigStore.filter(view.getFilterFns())  
				}
			},
			deferEmptyText:false
		}),
		listeners: {
			// rowdblclick: {
			// 	fn: function(grid,rowIndex,e) {
			// 		var r = grid.getStore().getAt(rowIndex);
			// 		Ext.getBody().mask('Getting assignments for ' + r.get('benchmarkId') + '...');
			// 		showStigAssignments(r.get('benchmarkId'));
			// 	}
			// }
		},
		tbar: [
			{
				iconCls: 'sm-import-icon',
				text: 'Import STIGs',
				disabled: false,
				handler: function() {
					uploadStigs();
				}
			}
		],
		bbar: new Ext.Toolbar({
			items: [
			{
				xtype: 'exportbutton',
				hasMenu: false,
				gridBasename: 'Installed-STIGs',
				exportType: 'grid',
				iconCls: 'sm-export-icon',
				text: 'CSV'
			},
			{
				xtype: 'tbfill'
			},{
				xtype: 'tbseparator'
			},
			totalTextCmp]
		}),
		loadMask: true
	});

	var thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'stig-admin-tab',
		sm_treePath: treePath,
		iconCls: 'sm-stig-icon',
		title: 'STIG checklists',
		closable:true,
		layout: 'border',
		items: [stigGrid]
	});

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
			
							await window.oidcProvider.updateToken(10)
							let response = await fetch(`${STIGMAN.Env.apiBase}/stigs`, {
							method: 'POST',
							headers: new Headers({
								'Authorization': `Bearer ${window.oidcProvider.token}`
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
	
								await window.oidcProvider.updateToken(10)
								let response = await fetch(`${STIGMAN.Env.apiBase}/stigs`, {
									method: 'POST',
									headers: new Headers({
										'Authorization': `Bearer ${window.oidcProvider.token}`
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
							updateStatusText (`Error processing ZIP: ${e.message}`)
							updateStatusText ('------------------------------------')
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
			cls: 'sm-dialog-window sm-round-panel',
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
	
	// Show the tab
	thisTab.show();
	stigGrid.getStore().load();
} // end addStigAdmin()