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

/* 
@cfg packageId 
@cfg url
*/
SM.PackageAssetGrid = Ext.extend(Ext.grid.GridPanel, {
    onAssetChanged: function (apiAsset) {
        let record = this.store.getById(apiAsset.assetId)
        this.store.loadData(apiAsset, true) // append with replace
    },
    initComponent: function() {
        let me = this
        id = Ext.id()
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
                        showAssetProps(r.get('assetId'), me.packageId);
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
                            showAssetProps( null, me.packageId);            
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
                                alert(e.stack)
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
        SM.PackageAssetGrid.superclass.initComponent.call(this)

        SM.Dispatcher.addListener('assetchanged', this.onAssetChanged, this)
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
            filteringStore: this.filteringStore || null,
            displayField: 'benchmarkId',
            valueField: 'benchmarkId',
            mode: 'local',
            forceSelection: true,
			allowBlank: false,
			typeAhead: true,
			minChars: 0,
            hideTrigger: false,
            triggerAction: 'all',
            lastQuery: '',
            listeners: {
                afterrender: (combo) => {
                    combo.getEl().dom.setAttribute('spellcheck', 'false')
                },
                // expand: (combo) => {
                //     if (combo.filteringStore) {
                //         combo.store.filterBy(
                //             function (record, id) {
                //                 return combo.filteringStore.indexOfId(id) === -1
                //             }
                //         )
                //     }
                // }
            },
            doQuery : function(q, forceAll){
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
				if (forceAll === true || (q.length >= this.minChars)){
					if (this.lastQuery !== q) {
						this.lastQuery = q;
						if (this.mode == 'local') {
							this.selectedIndex = -1
							if (forceAll) {
								this.store.clearFilter()
                            }
                            else {
                                let filters = [
                                    {
                                        fn: (record) =>  {
                                            return this.filteringStore.indexOfId(record.id) === -1
                                        },
                                        scope: this
                                    }
                                ]
                                if (q) {
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
                    else {
						this.selectedIndex = -1
						this.onLoad()
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
            saveText: 'Save',
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
            // height: 150,
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

SM.AssetStigsPanel = Ext.extend(Ext.grid.GridPanel, {
    filterStore: function () {
        let selectionsOnly = ! this.getTopToolbar().button.pressed
        let value = this.getTopToolbar().filterField.getValue()
        let sm = this.getSelectionModel()
        //var selectionsOnly = ! btnPressed;
        if (! value || value === '') {
            if (selectionsOnly) {
                this.store.filterBy(sm.isSelected, sm)
            } else {
                this.store.clearFilter()
            }
        } else {
            if (selectionsOnly) {
                this.store.filter([
                    {
                        property:'title',
                        value:value,
                        anyMatch:true,
                        caseSensitive:false
                    },{
                        fn: sm.isSelected,
                        scope: sm
                    }
                ]);
            } else {
                this.store.filter({
                    property:'title',
                    value:value,
                    anyMatch:true,
                    caseSensitive:false
                })
            }
        }
    },
    initComponent: function() {
        this.totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AssetStigsPanel.superclass.initComponent.call(this);
    }
})

/**
 * @class SM.AssetStigGrid
 * @extends Ext.grid.GridPanel
 * GridPanel class that displays Child -> STIG data
 * @constructor
 * Create a GridPanel with associated components (store, column model, view, selection model)
 * @param {Object} config The config object
 * @xtype sm-asset-stig-grid
 */
SM.AssetStigGrid = Ext.extend(Ext.grid.GridPanel, {
    filterStore: function () {
        let selectionsOnly = ! this.getTopToolbar().button.pressed
        let value = this.getTopToolbar().filterField.getValue()
        let sm = this.getSelectionModel()
        //var selectionsOnly = ! btnPressed;
        if (! value || value === '') {
            if (selectionsOnly) {
                this.store.filterBy(sm.isSelected, sm);
            } else {
                this.store.clearFilter()
            }
        } else {
            if (selectionsOnly) {
                this.store.filter([
                    {
                        property:'title',
                        value:value,
                        anyMatch:true,
                        caseSensitive:false
                    },{
                        fn: sm.isSelected,
                        scope: sm
                    }
                ]);
            } else {
                this.store.filter({property:'title',value:value,anyMatch:true,caseSensitive:false});
            }
        }
    },
    initComponent: function() {
        this.totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
        let reader = new Ext.data.JsonReader({
            idProperty: 'benchmarkId',
            root: '',
            fields: [
                {name:'benchmarkId',type:'string'},
                {name:'title',type:'string'},
                {name:'lastRevisionStr',type:'string'},
                {name:'lastRevisionDate',type:'string'}
            ]
        })
        let fields = Ext.data.Record.create([
            {name:'benchmarkId',type:'string'},
            {name:'title',type:'string'},
            {name:'lastRevisionStr',type:'string'},
            {name:'lastRevisionDate',type:'string'}
    ])
        let store = new Ext.data.JsonStore({
            url: `${STIGMAN.Env.apiBase}/stigs`,
            baseParams: {
            },
            grid: this,
            reader: reader,
            autoLoad: false,
            restful: true,
            encode: false,
            idProperty: 'benchmarkId',
            sortInfo: {
                field: 'title',
                direction: 'ASC'
            },
            fields: fields,
            listeners: {
                load: function (store,records) {
                    store.grid.filterStore.call(store.grid)
                    store.grid.totalTextCmp.setText(store.getCount() + ' records');
                },
                clear: function(){
                    store.grid.totalTextCmp.setText('0 records');
                },
                update: function(store) {
                    store.grid.totalTextCmp.setText(store.getCount() + ' records');
                },
                datachanged: function(store) {
                    store.grid.totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        let sm = new Ext.grid.CheckboxSelectionModel({
            checkOnly: true,
            header: '',
            apiCollection: this.apiCollection,
            listeners: {
            },
            onRefresh: function() {
                // override to render selections properly after a grid refresh
                var ds = this.grid.store, index;
                var s = this.getSelections();
                for(var i = 0, len = s.length; i < len; i++){
                    var r = s[i];
                    if((index = ds.indexOfId(r.id)) != -1){
                        this.grid.view.addRowClass(index, this.grid.view.selectedRowClass);
                    }
                }
            }
        })                
        let config = {
            isFormField: true,
            editingCls: 'red-panel',
            editing: false,
            layout: 'fit',
            store: store,
            listeners: {
                viewready: function(grid) {
                    // One final refresh to style filtered rows that are also selected
                    grid.view.refresh()
                },
            },
            columns: [
                sm,
                {
                    header: "BenchmarkID"
                    ,tooltip: "The DISA Benchmark ID."
                    ,width: 150
                    ,dataIndex:'benchmarkId'
                    ,sortable: true
                    ,renderer: function(value, metaData, record, rowIndex, colIndex, store){
                        return '<b>' + value + '</b>';
                    }
                },
                {
                    header: "Title"
                    ,tooltip: "The STIG title."
                    , width: 340
                    , dataIndex: 'title'
                    , sortable: true
                }
            ],
            border: true,
            // style: {
            //     borderLeftWidth: "1px"
            // },
            loadMask: true,
            stripeRows: true,
            sm: sm,
            view: new Ext.grid.GridView({
                forceFit: true,
                emptyText: 'No STIGs to display',
                selectedRowClass: 'x-grid3-row-selected-checkonly',
                listeners: {
                    // beforerefresh: function (view) {
                    //     view.grid.getEl().mask('Refreshing...')
                    // },
                    refresh: function (view) {
                        view.grid.getEl().unmask()
                    }
                }
            }),
            onEditChange: function (editing) {
                this.view.selectedRowClass = editing ? 'x-grid3-row-selected' : 'x-grid3-row-selected-checkonly'
                this.view.refresh()
                this.editing = editing
                this.fireEvent('mouseover')
            },
            tbar: new SM.SelectingGridToolbar({
                filterFn: this.filterStore,
                triggerEmptyText: 'Title filter...',
                btnText: 'Add STIGs',
                gridId: this.id
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
                        gridBasename: 'STIGs (grid)',
                        storeBasename: 'STIGs (store)',
                        iconCls: 'icon-save',
                        text: 'Export'
                    },{
                        xtype: 'tbfill'
                    },{
                        xtype: 'tbseparator'
                    },
                    this.totalTextCmp
                ]
            }),
            getValue: function() {
            },
            setValue: function (resp) {
                let sm = this.getSelectionModel()
                let stigs = resp.map(o => o.benchmarkId)
                let selectedRecords = []
                for( let i=0; i < stigs.length; i++ ) {
                    let record = store.getById( stigs[i] )
                    selectedRecords.push(record)
                }
                this.store.clearFilter(true)
                let origSilent = sm.silent
                sm.silent = true
                sm.selectRecords(selectedRecords)
                sm.silent = origSilent
                this.filterStore.call(this)       
            },
            markInvalid: function() {},
            clearInvalid: function() {},
            isValid: () => true,
            getName: () => this.name,
            validate: () => true


        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AssetStigGrid.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-asset-stig-grid', SM.AssetStigGrid)

SM.AssetProperties = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        let me = this
        let idAppend = Ext.id()
        this.stigGrid = new SM.AssetStigsGrid({
            name: 'stigs'
        })
        if (! this.initialPackageId) {
            throw ('missing property initialPackageId')
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
                            name: 'packageId',
                            value: this.initialPackageId
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


async function showAssetProps( assetId, initialPackageId ) {
    try {
        let assetPropsFormPanel = new SM.AssetProperties({
            initialPackageId: initialPackageId,
            btnHandler: async function(){
                try {
                    if (assetPropsFormPanel.getForm().isValid()) {
                        let values = assetPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        // change "packages" to "packageIds"
                        let method = assetId ? 'PUT' : 'POST'
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
                            method: method,
                            params: {
                                elevate: curUser.canAdmin,
                                projection: ['stigs', 'adminStats']
                            },
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            jsonData: values
                        })
                        const apiAsset = JSON.parse(result.response.responseText)
                        SM.Dispatcher.fireEvent('assetchanged', apiAsset)

                        //TODO: This is expensive, should update the specific record instead of reloading entire set
                        // Ext.getCmp(`assetGrid-${packageId}`).getView().holdPosition = true
                        // Ext.getCmp(`assetGrid-${packageId}`).getStore().reload()
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
                    elevate: curUser.canAdmin,
                    projection: ['stigs']
                },
                method: 'GET'
            })
            let apiAsset = JSON.parse(result.response.responseText)
            apiAsset.packageId = apiAsset.package.packageId
            delete apiAsset.package
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
