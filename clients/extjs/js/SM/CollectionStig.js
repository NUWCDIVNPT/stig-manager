'use strict'

Ext.ns('SM')

SM.CollectionStigsGrid = Ext.extend(Ext.grid.GridPanel, {
    onCollectionStigsChanged: function () {
    },
    initComponent: function() {
        let me = this
        id = Ext.id()
        let fieldsConstructor = Ext.data.Record.create([
            {name: 'benchmarkId', type: 'string'},
            {name: 'title', type: 'string'},
            {name: 'lastRevisionStr', type: 'string'},
            {name: 'lastRevisionDate', type: 'string'},
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
        let stigStore = new Ext.data.JsonStore({
            grid: this,
            proxy: this.proxy,
            baseParams: {
                collectionId: this.collectionId,
                projection: ['stigs']
            },
            root: '',
            fields: fieldsConstructor,
            idProperty: 'benchmarkId',
            sortInfo: {
                field: 'benchmarkId',
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
				header: "BenchmarkId",
				width: 100,
                dataIndex: 'benchmarkId',
				sortable: true
			},{ 	
				header: "Title",
				width: 150,
                dataIndex: 'title',
				sortable: true
			},{ 	
				header: "Latest Revision",
				width: 50,
                dataIndex: 'lastRevisionStr',
                align: "center",
                sortable: true
			},{ 	
				header: "Date",
				width: 50,
				dataIndex: 'lastRevisionDate',
				sortable: true
			}
        ]
        let config = {
            layout: 'fit',
            loadMask: true,
            store: stigStore,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
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
                        showCollectionStigProps(r.get('benchmarkId'), me.collectionId);
                    }
                }
            },
            tbar: new Ext.Toolbar({
                items: [
                    {
                        iconCls: 'icon-add',
                        text: 'Assign new STIG',
                        handler: function() {
                            showCollectionStigProps( null, me.collectionId);            
                        }
                    }
                    ,'-'
                    , {
                        ref: '../removeBtn',
                        iconCls: 'icon-del',
                        id: `assetGrid-${id}-deleteBtn`,
                        text: 'Remove STIG',
                        disabled: true,
                        handler: function() {
                            try {
                                var confirmStr="Removing this STIG will remove all related Asset assignments. If the STIG is added in the future, the assignments will need to be established again.";
                                Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
                                    if (btn == 'yes') {
                                        let asset = me.getSelectionModel().getSelected()
                                        let result = await Ext.Ajax.requestPromise({
                                            url: `${STIGMAN.Env.apiBase}`,
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
                        iconCls: 'sm-stig-icon',
                        disabled: true,
                        id: `assetGrid-${id}-modifyBtn`,
                        text: 'Modify STIG assignments',
                        handler: function() {
                            var r = me.getSelectionModel().getSelected();
                            showCollectionStigProps(r.get('benchmarkId'), me.collectionId);
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
        SM.CollectionStigsGrid.superclass.initComponent.call(this)

        SM.Dispatcher.addListener('collectionstigschanged', this.onCollectionStigsChanged, this)
    }   
})
Ext.reg('sm-collection-stigs-grid', SM.CollectionStigsGrid)

SM.StigAssetSelectionField = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let stigStore = new Ext.data.JsonStore({
            fields: [
                {	name:'assetId',
                    type: 'string'
                },{
                    name:'name',
                    type: 'string'
                }
            ],
            autoLoad: true,
            url: `${STIGMAN.Env.apiBase}/assets`,
            baseParams: {
                elevate: curUser.privileges.canAdmin,
                collectionId: this.collectionId,
                benchmarkId: this.benchmarkId
            },
            root: '',
            sortInfo: {
                field: 'name',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'assetId'
        })
        let config = {
            store: stigStore,
            filteringStore: this.filteringStore || null,
            displayField: 'name',
            valueField: 'assetId',
            mode: 'local',
            forceSelection: true,
			allowBlank: false,
			typeAhead: true,
			minChars: 0,
            hideTrigger: false,
            triggerAction: 'query',
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
        SM.StigAssetSelectionField.superclass.initComponent.call(this)
    }
})

/**
 * @class SM.StigAssetsGrid
 * @extends Ext.grid.GridPanel
 * GridPanel class that displays STIG -> Assets data
 * @constructor
 * Create a GridPanel with associated components (store, column model, view, selection model)
 * @param {Object} config The config object
 * @xtype sm-asset-stig-grid
 */
SM.StigAssetsGrid = Ext.extend(Ext.grid.GridPanel, {
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
                        property:'name',
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
                {name:'assetId',type:'string'},
                {name:'name',type:'string'}
            ]
        })
        let fields = Ext.data.Record.create([
            {name:'assetId',type:'string'},
            {name:'name',type:'string'}
        ])
        let store = new Ext.data.JsonStore({
            url: `${STIGMAN.Env.apiBase}/assets`,
            baseParams: {
                elevate: curUser.privileges.canAdmin,
                collectionId: this.collectionId
            },
            grid: this,
            reader: reader,
            autoLoad: false,
            restful: true,
            encode: false,
            idProperty: 'assetId',
            sortInfo: {
                field: 'name',
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
                    header: "Asset"
                    ,width: 150
                    ,dataIndex:'name'
                    ,sortable: true
                    ,renderer: function(value, metaData, record, rowIndex, colIndex, store){
                        return '<b>' + value + '</b>';
                    }
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
                emptyText: 'No Assets to display',
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
                triggerEmptyText: 'Name filter...',
                btnText: 'Assign Assets',
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
            }),
            getValue: function() {
            },
            setValue: function (resp) {
                let sm = this.getSelectionModel()
                let stigs = resp.map(o => o.assetId)
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
        SM.StigAssetsGrid.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-stig-assets-grid', SM.StigAssetsGrid)

SM.StigAssetsComboGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = [
            {	name:'assetId',
                type: 'string'
            },
            {	name:'name',
                type: 'string'
            }
        ]
        this.newRecordConstructor = Ext.data.Record.create(fields)
        const totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })

        const assetAssignedStore = new Ext.data.JsonStore({
            grid: this,
            root: '',
            fields: fields,
            idProperty: 'assetId',
            sortInfo: {
                field: 'assetId',
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
        const assetSelectionField = new SM.StigAssetSelectionField({
            collectionId: this.collectionId,
            benchmarkId: this.benchmarkId,
            submitValue: false,
            allowBlank: false,
            filteringStore: assetAssignedStore
        })
        const columns = [
            { 	
                header: "Asset", 
                width: 375,
                dataIndex: 'name',
                sortable: true,
                editor: assetSelectionField
            }
        ]
        this.editor =  new Ext.ux.grid.RowEditor({
            saveText: 'OK',
            grid: this,
            assetSelectionField: assetSelectionField,
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
            store: assetAssignedStore,
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
                itemString: 'Asset',
                editor: this.editor,
                gridId: this.id,
                deleteProperty: 'assetId',
                newRecord: this.newRecordConstructor
            }),
            getValue: function() {
                let assets = []
                assetAssignedStore.data.items.forEach((i) => {
                    assets.push(i.data.assetId)
                })
                return assets
            },
            setValue: function(v) {
                const data = v.map( (asset) => ({
                    assetId: asset.assetId,
                    name: asset.name
                }))
                assetAssignedStore.loadData(data)
            },
            markInvalid: function() {},
            clearInvalid: function() {},
            isValid: () => true,
            getName: () => this.name,
            validate: () => true
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.StigAssetsComboGrid.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-stig-assets-combo-grid', SM.StigAssetsComboGrid)

SM.CollectionStigProperties = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        let me = this
        let idAppend = Ext.id()
        this.stigAssetsGrid = new SM.StigAssetsGrid({
            name: 'assets',
            benchmarkId: this.benchmarkId,
            collectionId: this.collectionId
        })
        if (! this.collectionId) {
            throw ('missing property collectionId')
        }
 
        let config = {
            baseCls: 'x-plain',
            // height: 400,
            labelWidth: 70,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<b>STIG information</b>',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: 'BenchmarkId',
                            width: 150,
                            emptyText: 'Enter benchmarkId...',
                            allowBlank: false,
                            name: 'benchmarkId'
                        },
                        {
                            xtype: 'hidden',
                            name: 'collectionId',
                            value: this.collectionId
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '<b>Asset Assignments</b>',
                    anchor: "100% -270",
                    layout: 'fit',
                    items: [
                        this.stigAssetsGrid
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
        SM.CollectionStigProperties.superclass.initComponent.call(this)

        // this.getForm().getFieldValues = function(dirtyOnly, getDisabled){
        //     var o = {},
        //         n,
        //         key,
        //         val;
        //     this.items.each(function(f) {
        //         // Added condition for f.submitValue
        //         if ( f.submitValue && (!f.disabled || getDisabled) && (dirtyOnly !== true || f.isDirty())) {
        //             n = f.getName();
        //             key = o[n];
        //             val = f.getValue();
    
        //             if(Ext.isDefined(key)){
        //                 if(Ext.isArray(key)){
        //                     o[n].push(val);
        //                 }else{
        //                     o[n] = [key, val];
        //                 }
        //             }else{
        //                 o[n] = val;
        //             }
        //         }
        //     });
        //     return o;
        // }
    

    },
    initPanel: async function () {
        try {
            await this.stigAssetsGrid.store.loadPromise()
        }
        catch (e) {
            alert (e)
        }
    }
})


async function showCollectionStigProps( benchmarkId, collectionId ) {
    try {
        let stigPropsFormPanel = new SM.CollectionStigProperties({
            collectionId: collectionId,
            benchmarkId: benchmarkId,
            btnHandler: async function(){
                try {
                    if (stigPropsFormPanel.getForm().isValid()) {
                        let values = stigPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        // change "collections" to "collectionIds"
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
                            method: 'PUT',
                            params: {
                                elevate: curUser.privileges.canAdmin
                            },
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            jsonData: values
                        })
                        const apiStigAsset = JSON.parse(result.response.responseText)
                        SM.Dispatcher.fireEvent('stig-assets-changed', apiStigAsset)

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
            title: 'STIG Assignments, Collection ID ' + collectionId,
            modal: true,
            hidden: true,
            width: 660,
            height:660,
            layout: 'fit',
            plain:true,
            bodyStyle:'padding:5px;',
            buttonAlign:'right',
            items: stigPropsFormPanel
        });
        
        appwindow.render(document.body)
        await stigPropsFormPanel.initPanel()

        let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/assets`,
            params: {
                elevate: curUser.privileges.canAdmin,
                collectionId: collectionId,
                benchmarkId: benchmarkId
            },
            method: 'GET'
        })
        let apiStigAssets = JSON.parse(result.response.responseText)
        stigPropsFormPanel.getForm().setValues({
            benchmarkId: benchmarkId,
            assets: apiStigAssets
        })
                
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
}
