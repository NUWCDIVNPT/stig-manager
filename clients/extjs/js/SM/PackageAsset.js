'use strict'

Ext.ns('SM')

SM.PackageAssetTree = Ext.extend(Ext.tree.TreePanel, {
    loadTree: async function (nodeId, cb) {
        let match
        match = nodeId.match(/(\d+)-project-asset-tree-root/)
        if (match) {
            let packageId = parseInt(match[1])
            let result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
                method: 'GET',
                params: {
                  projection: 'assets'
                }
              })
            let r = JSON.parse(result.response.responseText)
            let content = r.assets.map(asset => ({
                id: `${packageId}-${asset.assetId}-project-asset-tree-asset-node`,
                text: asset.name,
                report: 'asset',
                packageId: packageId,
                assetId: asset.assetId,
                iconCls: 'sm-asset-icon',
                qtip: asset.name
            })
            )
            cb(content, { status: true })
            return
        }
        match = nodeId.match(/(\d+)-(\d+)-project-asset-tree-asset-node/)
        if (match) {
            let packageId = parseInt(match[1])
            let assetId = parseInt(match[2])
            let result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
                method: 'GET',
                params: {
                  projection: 'stigs'
                }
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.stigs.map(stig => ({
                id: `${packageId}-${assetId}-${stig.benchmarkId}-leaf`,
                text: stig.benchmarkId,
                leaf: true,
                report: 'review',
                iconCls: 'sm-stig-icon',
                stigName: stig.benchmarkId,
                assetName: r.name,
                stigRevStr: stig.lastRevisionStr,
                assetId: r.assetId,
                packageId: packageId,
                benchmarkId: stig.benchmarkId,
                qtip: stig.title
                })
            )
            cb(content, { status: true })
            return
        }
    },
    initComponent: function() {
        let me = this
        let config = {
            root: {
                nodeType: 'async',
                text: 'Assets',
                id: `${me.projectId}-project-asset-tree-root`,
                iconCls: 'sm-asset-icon',
                expanded: true
            },
            rootVisible: true,
            loader: new Ext.tree.TreeLoader({
                directFn: me.loadTree
            })        
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ProjectAssetTree.superclass.initComponent.call(this)
    }
})

SM.PackageAssetGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        let me = this
        id = Ext.id()
        let fieldsConstructor = Ext.data.Record.create([
            {name: 'assetId', type: 'integer'},
            {name: 'name', type: 'string'},
            {name: 'ip', type: 'string'},
            {name: 'nonnetwork', type: 'boolean'},
            {
                name: 'stigCount',
                type: 'integer',
                mapping: 'adminStats.stigCount'
            },{
                name: 'stigUnassignedCount',
                type: 'integer',
                convert: (v, r) => r.adminStats.stigCount - r.adminStats.stigAssignedCount
            },
            {name: 'metadata'}
        ])
        this.proxy = new Ext.data.HttpProxy({
            restful: true,
            url: this.url,
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            listeners: {
                exception: function ( proxy, type, action, options, response, arg ) {
                    let message
                    if (response.responseText) {
                        message = response.responseText
                    } else {
                        message = "Unknown error"
                    }
                    Ext.Msg.alert('Error', message);
                }
            }
        })
        me.totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
        let assetStore = new Ext.data.JsonStore({
            grid: this,
            proxy: this.proxy,
            baseParams: {
                packageId: this.packageId,
                projection: ['adminStats']
            },
            root: '',
            fields: fieldsConstructor,
            idProperty: 'assetId',
            sortInfo: {
                field: 'name',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store,records) {
                    me.totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store,record,index) {
                    me.totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        let columns = [
            { 	
				header: "Asset",
				width: 15,
                dataIndex: 'name',
                editor   : new Ext.form.TextField(),
				sortable: true
			},{ 	
				header: "IP",
				width: 10,
                dataIndex: 'ip',
                editor   : new Ext.form.TextField(),
				sortable: true
			},{ 	
				header: "Not Networked",
				width: 5,
                dataIndex: 'nonnetwork',
                editor   : new Ext.form.Checkbox(),
				align: "center",
				tooltip:"Is the asset connected to a network",
				renderer: function(value, metaData, record, rowIndex, colIndex, store) {
				  return value ? 'X' : '';
				},
				sortable: true
			},{ 	
				header: "STIGs",
				width: 5,
				dataIndex: 'stigCount',
				align: "center",
				tooltip:"Total STIGs Assigned",
				sortable: true
			},{ 	
				header: "Unassigned",
				width: 7,
				dataIndex: 'stigUnassignedCount',
				align: "center",
				tooltip:"STIGs Missing User Assignments",
				sortable: true
			}
        ]
        let config = {
            layout: 'fit',
            loadMask: true,
            store: assetStore,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    selectionchange: function (sm) {
                        Ext.getCmp(`assetGrid-${id}-modifyBtn`).setDisabled(!sm.hasSelection());
                        Ext.getCmp(`assetGrid-${id}-deleteBtn`).setDisabled(!sm.hasSelection());
                    }
                }
            }),
               view: new Ext.grid.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true
            }),
            listeners: {
                rowdblclick: {
                    fn: function(grid,rowIndex,e) {
                        var r = grid.getStore().getAt(rowIndex);
                        Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
                        showAssetProps(r.get('assetId'));
                    }
                }
            },
            tbar: new Ext.Toolbar({
                items: [
                    {
                        iconCls: 'icon-add',
                        text: 'New asset',
                        handler: function() {
                            Ext.getBody().mask('Loading form...');
                            showAssetProps();            
                        }
                    }
                    ,'-'
                    , {
                        ref: '../removeBtn',
                        iconCls: 'icon-del',
                        id: `assetGrid-${id}-deleteBtn`,
                        text: 'Delete asset',
                        disabled: true,
                        handler: function() {
                            try {
                                var confirmStr="Deleteing this asset will <b>permanently remove</b> all data associated with the asset. This includes all the asset's existing STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to delete the asset?";
                                Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
                                    if (btn == 'yes') {
                                        let asset = me.getSelectionModel().getSelected()
                                        let result = await Ext.Ajax.requestPromise({
                                            url: `${STIGMAN.Env.apiBase}/assets/${asset.data.assetId}`,
                                            method: 'DELETE'
                                        })
                                        me.store.remove(asset)
                                    }
                                })
                            }
                            catch (e) {
                                alert(e.message)
                            }
                        }
                    }
                    ,'-'
                    ,{
                        iconCls: 'sm-asset-icon',
                        disabled: true,
                        id: `assetGrid-${id}-modifyBtn`,
                        text: 'Modify asset properties',
                        handler: function() {
                            var r = me.getSelectionModel().getSelected();
                            Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
                            showAssetProps(r.get('assetId'));
                        }
                    }                    
                ]
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'tbbutton',
                        grid: this,
                        iconCls: 'icon-refresh',
                        tooltip: 'Reload this grid',
                        width: 20,
                        handler: function(btn){
                            btn.grid.store.reload();
                        }
                    },{
                        xtype: 'tbseparator'
                    },{
                        xtype: 'exportbutton',
                        hasMenu: false,
                        gridBasename: 'Vendors (grid)',
                        storeBasename: 'Vendors (store)',
                        iconCls: 'icon-save',
                        text: 'Export'
                    },{
                        xtype: 'tbfill'
                    },{
                        xtype: 'tbseparator'
                    },
                    this.totalTextCmp
                ]
            })
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PackageAssetGrid.superclass.initComponent.call(this);
    }   
})


SM.PackageAssetProperties = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        let me = this
        let idAppend = Ext.id()
        let config = {
            baseCls: 'x-plain',
            height: 400,
            region: 'south',
            labelWidth: 70,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'textfield',
                    fieldLabel: 'Name',
                    width: 150,
                    emptyText: 'Enter asset name...',
                    allowBlank: false,
                    name: 'name'
                },
                {
                    xtype: 'textfield',
                    fieldLabel: 'IP address',
                    id: `asset-props-${idAppend}`,
                    width: 150,
                    emptyText: 'Enter asset IP address...',
                    allowBlank: true,
                    vtype: 'IPAddress',
                    name: 'ip'
                },
                {
                    xtype: 'checkbox',
                    name: 'nonnetwork',
                    value: 'off',
                    //disabled: !(curUser.canAdmin),
                    boxLabel: 'Not networked',
                    handler: function (cb,checked){
                        var tf_ip = Ext.getCmp(`asset-props-${idAppend}`)
                        tf_ip.setDisabled(checked)
                        tf_ip.allowBlank = false
                        if (checked){
                            tf_ip.setValue('')
                        }
                    }
                }
            ]
        }       
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PackageAssetProperties.superclass.initComponent.call(this);
    }
})

SM.StigSelectionField = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let stigStore = new Ext.data.JsonStore({
            fields: [
                {	name:'benchmarkId',
                    type: 'string'
                },{
                    name:'title',
                    type: 'string'
                },{
                    name: 'lastRevisionStr',
                    type: 'string'
                },{
                    name: 'lastRevisionDate',
                    type: 'string'
                }
            ],
            autoLoad: true,
            url: `${STIGMAN.Env.apiBase}/stigs`,
            root: '',
            sortInfo: {
                field: 'benchmarkId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'benchmarkId'
        })
        let config = {
            store: stigStore,
            displayField: 'benchmarkId',
            valueField: 'benchmarkId',
            mode: 'local',
            forceSelection: true,
			allowBlank: true,
			typeAhead: true,
			minChars: 0,
            hideTrigger: false,
            triggerAction: 'all',
            lastQuery: '',
			doQuery : function(q, forceAll){
                // Reimplementation to search anywhere in string
				q = Ext.isEmpty(q) ? '' : q;
				var qe = {
					query: q,
					forceAll: forceAll,
					combo: this,
					cancel:false
				};
				if(this.fireEvent('beforequery', qe)===false || qe.cancel){
					return false;
				}
				q = qe.query;
				forceAll = qe.forceAll;
				if(forceAll === true || (q.length >= this.minChars)){
					if(this.lastQuery !== q){
						this.lastQuery = q;
						if(this.mode == 'local'){
							this.selectedIndex = -1;
							if(forceAll){
								this.store.clearFilter();
							}else{
								this.store.filter(this.displayField, q, false, false);
							}
							this.onLoad();
						}else{
							this.store.baseParams[this.queryParam] = q;
							this.store.load({
								params: this.getParams(q)
							});
							this.expand();
						}
					}else{
						this.selectedIndex = -1;
						this.onLoad();
					}
                }
            },
            listeners: {
                afterrender: (combo) => {
                    combo.getEl().dom.setAttribute('spellcheck', 'false')
                }
            }       
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.StigSelectionField.superclass.initComponent.call(this)
    }
})

SM.PackageAssetStigGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        let me = this
        let stigAssignedStore = new Ext.data.JsonStore({
            fields: [
                {	name:'benchmarkId',
                    type: 'string'
                },{
                    name:'title',
                    type: 'string'
                },{
                    name: 'reviewers'
                },{
                    name: 'icon'
                }
            ],
            autoLoad: false,
            root: '',
            sortInfo: {
                field: 'title',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'benchmarkId'
        })
        let stigSelectionField = new SM.StigSelectionField({width: 350})
        let config = {
            name: 'stigReviewers',
            title:'STIG assignments',
            store: stigAssignedStore,
            hideHeaders: true,
            anchor: '100% 100%',
            hideLabel: true,
            isFormField: true,
            cls: 'custom-stig-users',
            columns: [
                { 	
                    header: "Checklists", 
                    width: 375,
                    dataIndex: 'benchmarkId',
                    sortable: true
                },
                { 
                    header: "Icon",
                    width: 30,
                    dataIndex: 'icon'
                }
            ],
            viewConfig: {
                forceFit: true
            },
            setValue: function(stigReviewers) {
                stigAssignedStore.loadData(stigReviewers)
            },
            getValue: function() {
                // TODO
            },
            markInvalid: function() {},
            clearInvalid: function() {},
            validate: function() { return true},
            isValid: function() { return true;},
            getName: function() {return this.name},
            tbar: new Ext.Toolbar({
                items: [
                    stigSelectionField
                ]
            })
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PackageAssetStigGrid.superclass.initComponent.call(this)

    }
})

async function showAssetProps(assetId) {
    try {
        let stigGrid = new SM.PackageAssetStigGrid()

        /******************************************************/
        // Form panel
        /******************************************************/
        let assetPropsFormPanel = new Ext.form.FormPanel({
            baseCls: 'x-plain',
            labelWidth: 70,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
            { // start fieldset config
                xtype:'fieldset',
                title: 'Asset Information',
                autoHeight:true,
                items: [
                { // start asset column config
                    layout: 'column',
                    baseCls: 'x-plain',
                    items: [ // start asset column items
                    { // start column #1 config
                        columnWidth: .50,
                        layout: 'form',
                        baseCls: 'x-plain',
                        items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Name',
                            width: 150,
                            emptyText: 'Enter asset name...',
                            allowBlank: false,
                            //disabled: !(curUser.canAdmin),
                            name: 'name'
                        },{
                            xtype: 'textfield',
                            id: 'assetProps-ip',
                            fieldLabel: 'IP address',
                            width: 150,
                            emptyText: 'Enter asset IP address...',
                            allowBlank: true,
                            vtype: 'IPAddress',
                            name: 'ip'
                        }
                        ] // end column #1 items
                    },// end column #1 config
                    { // column #2 config
                        columnWidth: .50,
                        layout: 'form',
                        baseCls: 'x-plain',
                        items: [
                        {
                            xtype: 'checkbox',
                            id: 'assetProps-nonnetwork',
                            name: 'nonnetwork',
                            value: 'off',
                            //disabled: !(curUser.canAdmin),
                            boxLabel: 'Not networked',
                            handler: function (cb,checked){
                                var tf_ip = Ext.getCmp('assetProps-ip');
                                tf_ip.setDisabled(checked);
                                tf_ip.allowBlank = false;
                                if (checked){
                                    tf_ip.setValue('');
                                }
                            }
                        }
                        ]// end column #2 items
                    } // end column #2 config
                    ]// end asset column items
                } // end asset column config
                ] // end fieldset items
            } // end fieldset config
            ,
            {
                layout: 'hbox',
                anchor: '100% -130',
                baseCls: 'x-plain',
                border: false,
                layoutConfig: {
                    align: 'stretch'
                },
                items: [
                    stigGrid
                ]
            }
            ], // end form items
            buttons: [{
                text: 'Cancel',
                handler: function(){
                    appwindow.close();
                }
            },{
                text: 'Save',
                formBind: true,
                id: 'submit-button',
                handler: async function(){
                    try {
                        if (assetPropsFormPanel.getForm().isValid()) {
                            let values = assetPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                            // change "packages" to "packageIds"
                            delete Object.assign(values, {['packageIds']: values['packages'] })['packages']
                            let url, method
                            if (assetId) {
                                url = `${STIGMAN.Env.apiBase}/assets/${assetId}?elevate=${curUser.canAdmin}`
                                method = 'PUT'
                            }
                            else {
                                url = `${STIGMAN.Env.apiBase}/assets?elevate=${curUser.canAdmin}`
                                method = 'POST'
                            }
                            let result = await Ext.Ajax.requestPromise({
                                url: url,
                                method: method,
                                headers: { 'Content-Type': 'application/json;charset=utf-8' },
                                jsonData: values
                            })
                            apiAsset = JSON.parse(result.response.responseText)

                            //TODO: This is expensive, should update the specific record instead of reloading entire set
                            Ext.getCmp(`assetGrid-${packageId}`).getView().holdPosition = true
                            Ext.getCmp(`assetGrid-${packageId}`).getStore().reload()
                            appwindow.close()
                        }
                    }
                    catch (e) {
                        alert(e.message)
                    }
                }
        }]
        });

        /******************************************************/
        // Form window
        /******************************************************/
        var appwindow = new Ext.Window({
            id: 'assetPropsWindow',
            title: assetId ? 'Asset Properties, ID ' + assetId : 'Create new Asset',
            modal: true,
            hidden: true,
            width: 730,
            height:520,
            layout: 'fit',
            plain:true,
            bodyStyle:'padding:5px;',
            buttonAlign:'right',
            items: assetPropsFormPanel
        });
        
        appwindow.render(document.body);

        if (assetId) {
            let result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
                params: {
                    elevate: curUser.canAdmin,
                    projection: ['stigReviewers']
                },
                method: 'GET'
            })
            let apiAsset = JSON.parse(result.response.responseText)
            assetPropsFormPanel.getForm().setValues(apiAsset)

            var nonnetworked = Ext.getCmp('assetProps-nonnetwork').getValue();
            var tf_ip = Ext.getCmp('assetProps-ip');
            
            tf_ip.setDisabled(nonnetworked);
            if (nonnetworked ){
                tf_ip.setValue('');
            }
        }
                
        Ext.getBody().unmask();
        appwindow.show(document.body);
    }
    catch (e) {
        alert(e.message)
        Ext.getBody().unmask()
    }	
} //end showAssetProps


SM.PackageAssetPanel = Ext.extend(Ext.Panel, {
    initComponent: function() {
        let gridCfg = this.gridCfg || {}
        let formCfg = this.formCfg || {}

        this.grid = new SM.PackageAssetGrid ( gridCfg )

        formCfg.parent = this.grid
        this.form = new SM.PackageAssetProperties ( formCfg )
        this.grid.child = this.form

        let config = {
            layout: 'border',
            border: false,
            items: [
                this.grid
                ,this.form 
            ]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PackageAssetPanel.superclass.initComponent.call(this);
    }
})
