'use strict'

Ext.ns('SM')

SM.CollectionAssetTree = Ext.extend(Ext.tree.TreePanel, {
    loadTree: async function (nodeId, cb) {
        let match
        match = nodeId.match(/(\d+)-project-asset-tree-root/)
        if (match) {
            let collectionId = parseInt(match[1])
            let result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
                method: 'GET',
                params: {
                  projection: 'assets'
                }
              })
            let r = JSON.parse(result.response.responseText)
            let content = r.assets.map(asset => ({
                id: `${collectionId}-${asset.assetId}-project-asset-tree-asset-node`,
                text: asset.name,
                report: 'asset',
                collectionId: collectionId,
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
            let collectionId = parseInt(match[1])
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
                id: `${collectionId}-${assetId}-${stig.benchmarkId}-leaf`,
                text: stig.benchmarkId,
                leaf: true,
                report: 'review',
                iconCls: 'sm-stig-icon',
                stigName: stig.benchmarkId,
                assetName: r.name,
                stigRevStr: stig.lastRevisionStr,
                assetId: r.assetId,
                collectionId: collectionId,
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

/* 
@cfg collectionId 
@cfg url
*/
SM.CollectionAssetGrid = Ext.extend(Ext.grid.GridPanel, {
    onAssetChanged: function (apiAsset) {
        this.store.loadData(apiAsset, true) // append with replace
    },
    onAssetCreated: function (apiAsset) {
        this.store.loadData(apiAsset, true) // append with replace
    },
    initComponent: function() {
        let me = this
        const id = Ext.id()
        let fieldsConstructor = Ext.data.Record.create([
            {name: 'assetId', type: 'string'},
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
                collectionId: this.collectionId,
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
                    me.totalTextCmp.setText(store.getCount() + ' records');
                },
                remove: function (store,record,index) {
                    me.totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        let columns = [
            { 	
				header: "Asset",
				width: 150,
                dataIndex: 'name',
				sortable: true
			},{ 	
				header: "IP",
				width: 100,
                dataIndex: 'ip',
				sortable: true
			},{ 	
				header: "Not Networked",
				width: 50,
                dataIndex: 'nonnetwork',
				align: "center",
				tooltip:"Is the asset connected to a network",
				renderer: function(value, metaData, record, rowIndex, colIndex, store) {
				  return value ? 'X' : '';
				},
				sortable: true
			},{ 	
				header: "STIGs",
				width: 50,
				dataIndex: 'stigCount',
				align: "center",
				tooltip:"Total STIGs Assigned",
				sortable: true
			},{ 	
				header: "Unassigned",
				width: 70,
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
                        showAssetProps(r.get('assetId'), me.collectionId);
                    }
                }
            },
            tbar: new Ext.Toolbar({
                items: [
                    {
                        iconCls: 'icon-add',
                        text: 'Create Asset...',
                        handler: function() {
                            Ext.getBody().mask('Loading form...');
                            showAssetProps( null, me.collectionId);            
                        }
                    }
                    ,'-'
                    , {
                        ref: '../removeBtn',
                        iconCls: 'icon-del',
                        id: `assetGrid-${id}-deleteBtn`,
                        text: 'Delete Asset',
                        disabled: true,
                        handler: async function () {
                            try {
                                var confirmStr="Deleteing this asset will <b>permanently remove</b> all data associated with the asset. This includes all the asset's existing STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to delete the asset?";
                                Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
                                    if (btn == 'yes') {
                                        let assetRecord = me.getSelectionModel().getSelected()
                                        let result = await Ext.Ajax.requestPromise({
                                            url: `${STIGMAN.Env.apiBase}/assets/${assetRecord.data.assetId}`,
                                            method: 'DELETE'
                                        })
                                        let apiAsset = JSON.parse(result.response.responseText)
                                        me.store.remove(assetRecord)
                                        SM.Dispatcher.fireEvent('assetdeleted', apiAsset)
                                    }
                                })
                            }
                            catch (e) {
                                alert(e.stack)
                            }
                        },
                    
                    }
                    ,'-'
                    ,{
                        iconCls: 'sm-asset-icon',
                        disabled: true,
                        id: `assetGrid-${id}-modifyBtn`,
                        text: 'Change Asset properties...',
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
                        gridBasename: 'Assets (grid)',
                        storeBasename: 'Assets (store)',
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
        SM.CollectionAssetGrid.superclass.initComponent.call(this)

        SM.Dispatcher.addListener('assetchanged', this.onAssetChanged, this)
        SM.Dispatcher.addListener('assetcreated', this.onAssetCreated, this)
    }   
})
Ext.reg('sm-collection-asset-grid', SM.CollectionAssetGrid)


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
            autoLoad: this.autoLoad,
            url: this.url || `${STIGMAN.Env.apiBase}/stigs`,
            root: this.root || '',
            sortInfo: {
                field: 'benchmarkId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'benchmarkId'
        })
        let config = {
            store: stigStore,
            filteringStore: this.filteringStore || null,
            displayField: 'benchmarkId',
            valueField: 'benchmarkId',
            mode: 'local',
            forceSelection: true,
			allowBlank: false,
			typeAhead: true,
			minChars: 0,
            triggerAction: this.triggerAction || 'query',
            listeners: {
                afterrender: (combo) => {
                    combo.getEl().dom.setAttribute('spellcheck', 'false')
                },
            },
            doQuery : (q, forceAll) => {
                // Custom re-implementation of the original ExtJS method
                // Initial lines were retained
				q = Ext.isEmpty(q) ? '' : q;
				var qe = {
					query: q,
					forceAll: forceAll,
					combo: this,
					cancel:false
				};
				if ( this.fireEvent('beforequery', qe) === false || qe.cancel ) {
					return false;
				}
				q = qe.query;
				forceAll = qe.forceAll;
				if ( forceAll === true || (q.length >= this.minChars) ) {
					// Removed test against this.lastQuery
                    if (this.mode == 'local') {
                        this.selectedIndex = -1
                        if (forceAll) {
                            this.store.clearFilter()
                        }
                        else {
                            // Build array of filter functions
                            let filters = []
                            if (this.filteringStore) {
                                // Include records from the combo store that are NOT in filteringStore
                                filters.push(
                                    {
                                        fn: (record) =>  this.filteringStore.indexOfId(record.id) === -1,
                                        scope: this
                                    }
                                )
                            }
                            if (q) {
                                // Include records that partially match the combo value
                                filters.push(
                                    {
                                        property: this.displayField,
                                        value: q
                                    }
                                )
                            }
                            this.store.filter(filters)
                        }
                        this.onLoad()
                    } 
                    else {
                        this.store.baseParams[this.queryParam] = q
                        this.store.load({
                            params: this.getParams(q)
                        })
                        this.expand()
                    }
				}
            },
            validator: (value) => {
                let index = this.store.indexOfId(value)
                return (index !== -1)
            }     
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.StigSelectionField.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-stig-selection-field', SM.StigSelectionField)

SM.AssetStigsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = [
            {	name:'benchmarkId',
                type: 'string'
            }
        ]
        this.newRecordConstructor = Ext.data.Record.create(fields)
        const totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })

        const stigAssignedStore = new Ext.data.JsonStore({
            grid: this,
            root: '',
            fields: fields,
            idProperty: 'benchmarkId',
            sortInfo: {
                field: 'benchmarkId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store,records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store,record,index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        const stigSelectionField = new SM.StigSelectionField({
            submitValue: false,
            autoLoad: true,
            allowBlank: false,
            filteringStore: stigAssignedStore
        })
        const columns = [
            { 	
                header: "BenchmarkId", 
                width: 375,
                dataIndex: 'benchmarkId',
                sortable: true,
                editor: stigSelectionField
            }
        ]
        this.editor =  new Ext.ux.grid.RowEditor({
            saveText: 'OK',
            grid: this,
            stigSelectionField: stigSelectionField,
            clicksToEdit: 2,
            errorSummary: false, // don't display errors during validation monitoring
            listeners: {
                canceledit: function (editor,forced) {
                    // The 'editing' property is set by RowEditorToolbar.js
                    if (editor.record.editing === true) { // was the edit on a new record?
                        this.grid.store.suspendEvents(false);
                        this.grid.store.remove(editor.record);
                        this.grid.store.resumeEvents();
                        this.grid.getView().refresh();
                    }
                },
                afteredit: function (editor, changes, record, index) {
                    // "Save" the record by reconfiguring the store's data collection
                    // Corrects the bug where new records don't deselect when clicking away
                    let mc = record.store.data
                    let generatedId = record.id
                    record.id = record.data.benchmarkId
                    record.phantom = false
                    record.dirty = false
                    delete mc.map[generatedId]
                    mc.map[record.id] = record
                    for (let x=0,l=mc.keys.length; x<l; x++) {
                        if (mc.keys[x] === generatedId) {
                            mc.keys[x] = record.id
                        }
                    }
                }
            }
        })

        let config = {
            isFormField: true,
            submitValue: true,
            allowBlank: false,
            forceSelection: true,
            layout: 'fit',
            plugins: [this.editor],
            border: true,
            store: stigAssignedStore,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    selectionchange: function (sm) {
                    }
                }
            }),
            view: new Ext.grid.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true,
                markDirty: false
            }),
            listeners: {
            },
            bbar: new SM.RowEditorToolbar({
                itemString: 'STIG',
                editor: this.editor,
                gridId: this.id,
                deleteProperty: 'benchmarkId',
                newRecord: this.newRecordConstructor
            }),
            getValue: function() {
                let stigs = []
                stigAssignedStore.data.items.forEach((i) => {
                    stigs.push(i.data.benchmarkId)
                })
                return stigs
            },
            setValue: function(v) {
                const data = v.map( (sr) => ({
                    benchmarkId: sr.benchmarkId,
                }))
                stigAssignedStore.loadData(data)
            },
            markInvalid: function() {},
            clearInvalid: function() {},
            isValid: () => true,
            getName: () => this.name,
            validate: () => true
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AssetStigsGrid.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-asset-stigs-grid', SM.AssetStigsGrid)

SM.AssetProperties = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        let me = this
        let idAppend = Ext.id()
        this.stigGrid = new SM.AssetStigsGrid({
            name: 'stigs'
        })
        if (! this.initialCollectionId) {
            throw ('missing property initialCollectionId')
        }
 
        let config = {
            baseCls: 'x-plain',
            // height: 400,
            region: 'south',
            labelWidth: 70,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<b>Asset information</b>',
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
                            //disabled: !(curUser.privileges.canAdmin),
                            boxLabel: 'Not networked',
                            handler: function (cb,checked){
                                var tf_ip = Ext.getCmp(`asset-props-${idAppend}`)
                                tf_ip.setDisabled(checked)
                                tf_ip.allowBlank = false
                                if (checked){
                                    tf_ip.setValue('')
                                }
                            }
                        },
                        {
                            xtype: 'sm-metadata-grid',
                            submitValue: true,
                            fieldLabel: 'Metadata',
                            name: 'metadata',
                            anchor: '100%'
                        },
                        {
                            xtype: 'hidden',
                            name: 'collectionId',
                            value: this.initialCollectionId
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '<b>STIG Assignments</b>',
                    anchor: "100% -270",
                    layout: 'fit',
                    items: [
                        this.stigGrid
                        // {
                        //     xtype: 'sm-asset-stig-grid',
                        //     name: 'stigGrants',
                        //     fieldLabel: 'STIGs',
                        //     // anchor: '100%'
                        // }
                    ]
                }

            ],
            buttons: [{
                text: this.btnText || 'Save',
                formBind: true,
                handler: this.btnHandler || function () {}
            }]
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AssetProperties.superclass.initComponent.call(this)

        this.getForm().getFieldValues = function(dirtyOnly, getDisabled){
            var o = {},
                n,
                key,
                val;
            this.items.each(function(f) {
                // Added condition for f.submitValue
                if ( f.submitValue && (!f.disabled || getDisabled) && (dirtyOnly !== true || f.isDirty())) {
                    n = f.getName();
                    key = o[n];
                    val = f.getValue();
    
                    if(Ext.isDefined(key)){
                        if(Ext.isArray(key)){
                            o[n].push(val);
                        }else{
                            o[n] = [key, val];
                        }
                    }else{
                        o[n] = val;
                    }
                }
            });
            return o;
        }
    

    },
    // initPanel: async function () {
    //     try {
    //         await this.stigGrid.store.loadPromise()
    //     }
    //     catch (e) {
    //         alert (e)
    //     }
    // }
})


async function showAssetProps( assetId, initialCollectionId ) {
    try {
        let assetPropsFormPanel = new SM.AssetProperties({
            initialCollectionId: initialCollectionId,
            btnHandler: async function(){
                try {
                    if (assetPropsFormPanel.getForm().isValid()) {
                        let values = assetPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        let method = assetId ? 'PUT' : 'POST'
                        let url = assetId ? `${STIGMAN.Env.apiBase}/assets/${assetId}` : `${STIGMAN.Env.apiBase}/assets`
                        let result = await Ext.Ajax.requestPromise({
                            url: url,
                            method: method,
                            params: {
                                elevate: curUser.privileges.canAdmin,
                                projection: ['stigs', 'adminStats']
                            },
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            jsonData: values
                        })
                        const apiAsset = JSON.parse(result.response.responseText)
                        const event = assetId ? 'assetchanged' : 'assetcreated'
                        SM.Dispatcher.fireEvent(event, apiAsset)
                        appwindow.close()
                    }
                }
                catch (e) {
                    alert(e.stack)
                }
            }
        })

        /******************************************************/
        // Form window
        /******************************************************/
        var appwindow = new Ext.Window({
            id: 'assetPropsWindow',
            title: assetId ? 'Asset Properties, ID ' + assetId : 'Create new Asset',
            modal: true,
            hidden: true,
            width: 660,
            height:660,
            layout: 'fit',
            plain:true,
            bodyStyle:'padding:5px;',
            buttonAlign:'right',
            items: assetPropsFormPanel
        });
        
        appwindow.render(document.body)
        // await assetPropsFormPanel.initPanel()

        if (assetId) {
            let result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
                params: {
                    elevate: curUser.privileges.canAdmin,
                    projection: ['stigs']
                },
                method: 'GET'
            })
            let apiAsset = JSON.parse(result.response.responseText)
            apiAsset.collectionId = apiAsset.collection.collectionId
            delete apiAsset.collection
            assetPropsFormPanel.getForm().setValues(apiAsset)
        }
                
        Ext.getBody().unmask();
        appwindow.show(document.body);
    }
    catch (e) {
        if(typeof e === 'object') {
            if (e instanceof Error) {
              e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
            }
            else {
              // payload = JSON.stringify(payload, null, 2);
              e = JSON.stringify(e);
            }
          }        
        alert(e)
        Ext.getBody().unmask()
    }	
} //end showAssetProps
