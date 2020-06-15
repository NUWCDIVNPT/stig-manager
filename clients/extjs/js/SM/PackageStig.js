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
        this.newFields = [
            {name: 'name', type: 'string'},
            {name: 'ip', type: 'string'},
            {name: 'nonnetwork', type: 'boolean'}
        ]
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
        this.newRecordConstructor = Ext.data.Record.create(this.newFields)
        this.editor =  new Ext.ux.grid.RowEditor({
            saveText: 'Save',
            grid: this,
            clicksToEdit: 2,
            errorSummary: false, // don't display errors during validation monitoring
            listeners: {
                canceledit: function (editor,forced) {
                    if (editor.record.phantom === true) { // was the edit on a new record?
                        this.grid.store.suspendEvents(false);
                        this.grid.store.remove(editor.record);
                        this.grid.store.resumeEvents();
                        this.grid.getView().refresh();
                    }
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
            plugins: [this.editor],
            loadMask: true,
            store: assetStore,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            view: new Ext.grid.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true
            }),
            tbar: new SM.RowEditorToolbar({
                itemString: this.itemString,
                editor: this.editor,
                gridId: this.id,
                deleteProperty: this.deleteProperty,
                newRecord: this.newRecordConstructor
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
