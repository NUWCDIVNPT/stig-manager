'use strict'

Ext.ns('SM')

/* 
@cfg collectionId 
@cfg url
*/
SM.CollectionAssetGrid = Ext.extend(Ext.grid.GridPanel, {
    onAssetChanged: function (apiAsset) {
        this.store.loadData(apiAsset, true) // append with replace
        const sortState = this.store.getSortState()
        this.store.sort(sortState.field, sortState.direction)
    },
    onAssetCreated: function (apiAsset) {
        this.store.loadData(apiAsset, true) // append with replace
        const sortState = this.store.getSortState()
        this.store.sort(sortState.field, sortState.direction)
    },
    initComponent: function() {
        let me = this
        const id = Ext.id()
        let fieldsConstructor = Ext.data.Record.create([
            {name: 'assetId', type: 'string'},
            {name: 'name', type: 'string'},
            {name: 'fqdn', type: 'string'},
            {name: 'description', type: 'string'},
            {name: 'ip', type: 'string'},
            {name: 'mac', type: 'string'},
            {name: 'noncomputing', type: 'boolean'},
            {
                name: 'ruleCount',
                type: 'integer',
                mapping: 'adminStats.ruleCount'
            },
            {
                name: 'stigCount',
                type: 'integer',
                mapping: 'adminStats.stigCount'
            },
            {
                name: 'savedPct',
                type: 'integer',
                convert: (v, r) => r.adminStats.ruleCount ? Math.round(((r.adminStats.savedCount + r.adminStats.submittedCount + r.adminStats.acceptedCount)/r.adminStats.ruleCount) * 100) : 0
            },
            {
                name: 'submittedPct',
                type: 'integer',
                convert: (v, r) => r.adminStats.ruleCount ? Math.round(((r.adminStats.submittedCount + r.adminStats.acceptedCount)/r.adminStats.ruleCount) * 100) : 0
            },
            {
                name: 'acceptedPct',
                type: 'integer',
                convert: (v, r) => r.adminStats.ruleCount ? Math.round((r.adminStats.acceptedCount/r.adminStats.ruleCount) * 100) : 0
            },
            {
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
            smMaskDelay: 250,
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
				width: 70,
                dataIndex: 'name',
				sortable: true
			},{ 	
				header: "FQDN",
				width: 100,
                dataIndex: 'fqdn',
				sortable: true,
                renderer: SM.styledEmptyRenderer
			},{ 	
				header: "IP",
                fixed: true,
				width: 100,
                dataIndex: 'ip',
				sortable: true,
                renderer: SM.styledEmptyRenderer
			},{ 	
				header: "MAC",
                fixed: true,
				width: 110,
                dataIndex: 'mac',
				sortable: true,
                renderer: SM.styledEmptyRenderer
			},{ 	
				header: "STIGs",
				width: 70,
                fixed: true,
				dataIndex: 'stigCount',
				align: "center",
				tooltip:"Total STIGs Assigned",
				sortable: true
			},{ 	
				header: "Checks",
				width: 70,
                fixed: true,
				dataIndex: 'ruleCount',
				align: "center",
				sortable: true
			},{ 	
				header: "Reviewed",
				width: 100,
                fixed: true,
				dataIndex: 'savedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},{ 	
				header: "Submitted",
				width: 100,
                fixed: true,
				dataIndex: 'submittedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},{ 	
				header: "Accepted",
				width: 100,
                fixed: true,
				dataIndex: 'acceptedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
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
                singleSelect: false,
                listeners: {
                    selectionchange: function (sm) {
                        Ext.getCmp(`assetGrid-${id}-modifyBtn`).setDisabled(sm.getCount() !== 1)
                        Ext.getCmp(`assetGrid-${id}-deleteBtn`).setDisabled(!sm.hasSelection())
                    }
                }
            }),
            view: new Ext.grid.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true
            }),
            listeners: {
                rowdblclick: function(grid,rowIndex,e) {
                    var r = grid.getStore().getAt(rowIndex);
                    Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
                    showAssetProps(r.get('assetId'), me.collectionId);
                },
                beforedestroy: function(grid) {
                    SM.Dispatcher.removeListener('assetchanged', me.onAssetChanged, me)
                    SM.Dispatcher.removeListener('assetcreated', me.onAssetCreated, me)
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
                    },
                    '-',

                    {
                        iconCls: 'sm-import-icon',
                        text: 'Import CKL or SCAP...',
                        handler: function() {
                            let el = Ext.getCmp(`${me.collectionId}-collection-manager-tab`)
                            showImportResultFiles( me.collectionId, el.getEl().dom );            
                        }
                    },
                    '-',
                    {
                        iconCls: 'sm-export-icon',
                        id: `assetGrid-${id}-exportBtn`,
                        text: 'Export CKLs...',
                        disabled: false,
                        handler: function() {
                            showExportCklFiles( me.collectionId, me.collectionName );            
                        }
                    },
                    '-',
                    {
                        ref: '../removeBtn',
                        iconCls: 'icon-del',
                        id: `assetGrid-${id}-deleteBtn`,
                        text: 'Delete Assets',
                        disabled: true,
                        handler: async function () {
                            try {
                                let assetRecords = me.getSelectionModel().getSelections()
                                const multiDelete = assetRecords.length > 1
                                var confirmStr=`Deleting ${multiDelete ? '<b>multiple assets</b>' : 'this asset'} will <b>permanently remove</b> all data associated with the asset${multiDelete ? 's' : ''}. This includes all the corresponding STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to continue?`;
                                let btn = await SM.confirmPromise("Confirm Delete", confirmStr)
                                if (btn == 'yes') {
                                    const l = assetRecords.length
                                    for (let i=0; i < l; i++) {
                                        Ext.getBody().mask(`Deleting ${i+1}/${l} Assets`)
                                        // Edge case to handle when the selected record was changed (e.g., stats updated) 
                                        // while still selected, then is deleted
                                        const thisRecord = me.store.getById(assetRecords[i].id)
                                        let result = await Ext.Ajax.requestPromise({
                                            url: `${STIGMAN.Env.apiBase}/assets/${thisRecord.data.assetId}`,
                                            method: 'DELETE'
                                        })
                                        let apiAsset = JSON.parse(result.response.responseText)
                                        me.store.remove(thisRecord)
                                        SM.Dispatcher.fireEvent('assetdeleted', apiAsset)
                                    }
                                }
                            }
                            catch (e) {
                                alert(e.stack)
                            }
                            finally {
                                Ext.getBody().unmask()
                            }
                        }
                    },
                    '-',                    {
                        iconCls: 'sm-asset-icon',
                        disabled: true,
                        id: `assetGrid-${id}-modifyBtn`,
                        text: 'Change Asset properties...',
                        handler: function() {
                            var r = me.getSelectionModel().getSelected();
                            Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
                            showAssetProps(r.get('assetId'), me.collectionId);
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
                            const savedSmMaskDelay = btn.grid.store.smMaskDelay
                            btn.grid.store.smMaskDelay = 0
                            btn.grid.store.reload();
                            btn.grid.store.smMaskDelay = savedSmMaskDelay
                        }
                    },{
                        xtype: 'tbseparator'
                    },{
                        xtype: 'exportbutton',
                        hasMenu: false,
                        gridBasename: 'Assets (grid)',
                        storeBasename: 'Assets (store)',
                        iconCls: 'sm-export-icon',
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
        let me = this
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
                },{
                    name: 'ruleCount',
                    type: 'integer'
                }
            ],
            autoLoad: this.autoLoad,
            url: this.url || `${STIGMAN.Env.apiBase}/stigs`,
            root: this.root || '',
            sortInfo: {
                field: 'benchmarkId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'benchmarkId',
            listeners: {
                load: (store, records, options) => {
                    if (me.includeAllItem) {
                        store.suspendEvents()
                        let allRecord = {
                            benchmarkId: me.includeAllItem
                        }
                        store.loadData( me.root ? { [me.root]: allRecord } : { allRecord }, true)
                        store.sort('benchmarkId', 'ASC')
                        store.resumeEvents()
                    }
                }
            }
        })
        let config = {
            store: stigStore,
            filteringStore: this.filteringStore || null,
            displayField: 'benchmarkId',
            valueField: 'benchmarkId',
            mode: 'local',
            forceSelection: true,
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
            validator: (v) => {
                // Don't keep the form from validating when I'm not active
                if (me.grid && me.grid.editor && me.grid.editor.editing == false) {
                    return true
                }
                if (v === "") { return "Blank values no allowed" }
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
            },
            {	name:'ruleCount',
                type: 'integer'
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
            grid: this,
            filteringStore: stigAssignedStore
        })
        const columns = [
            { 	
                header: "BenchmarkId", 
                width: 375,
                dataIndex: 'benchmarkId',
                sortable: true,
                editor: stigSelectionField
            },
            { 	
                header: "Rules", 
                width: 125,
                dataIndex: 'ruleCount',
                align: 'center',
                sortable: true,
                // editor: new Ext.form.DisplayField({submitValue: false})
            }
        ]
        this.editor =  new Ext.ux.grid.RowEditor({
            saveText: 'OK',
            grid: this,
            stigSelectionField: stigSelectionField,
            clicksToEdit: 2,
            onRowDblClick: function () {}, // do nothing
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
                    // Editor must remove the form fields it created; otherwise the
                    // form validation continues to include those fields
                    // editor.removeAll(false)
                    // editor.initialized = false
                },
                validateedit: function (editor, changes, record, index) {
                    // Get the stigSelection combo
                    let combo = editor.items.items[0]
                    // Lookup ruleCount for the selectedIndex
                    changes.ruleCount = combo.store.getAt(combo.selectedIndex).data.ruleCount
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
                    editor.removeAll(false)
                    editor.initialized = false
                }
            }
        })

        let tbar = new SM.RowEditorToolbar({
            itemString: 'STIG',
            newTitle: 'Assign STIG',
            deleteTitle: 'Unassign STIG',
            editor: this.editor,
            gridId: this.id,
            deleteProperty: 'benchmarkId',
            newRecord: this.newRecordConstructor
        })
        tbar.delButton.disable()

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
                        tbar.delButton.setDisabled(!sm.hasSelection())
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
            tbar: tbar,
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
                    ruleCount: sr.ruleCount
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
                            layout: 'column',
                            baseCls: 'x-plain',
                            border: false,
                            items: [
                                {
                                    columnWidth: .4,
                                    layout: 'form',
                                    padding: '0px 10px 0px 0px',
                                    border: false,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'Name',
                                            anchor: '100%',
                                            emptyText: 'Enter asset name...',
                                            allowBlank: false,
                                            name: 'name'
                                        }
                                    ]
                                },
                                {
                                    columnWidth: .6,
                                    layout: 'form',
                                    border: false,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'Description',
                                            anchor: '100%',
                                            emptyText: 'Enter asset description...',
                                            allowBlank: true,
                                            name: 'description'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            layout: 'column',
                            baseCls: 'x-plain',
                            border: false,
                            items: [
                                {
                                    columnWidth: .5,
                                    layout: 'form',
                                    padding: '0px 10px 0px 0px',
                                    border: false,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            anchor: '100%',
                                            fieldLabel: 'FQDN',
                                            emptyText: 'Enter FQDN',
                                            allowBlank: true,
                                            name: 'fqdn'
                                        }
                                    ]
                                },
                                {
                                    columnWidth: .25,
                                    layout: 'form',
                                    border: false,
                                    padding: '0px 10px 0px 0px',
                                    labelWidth: 20,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'IP',
                                            anchor: '100%',
                                            emptyText: 'Enter IP',
                                            allowBlank: true,
                                            name: 'ip'
                                        }
                                    ]
                                },
                                {
                                    columnWidth: .25,
                                    layout: 'form',
                                    border: false,
                                    // padding: '0px 10px 0px 0px',
                                    labelWidth: 30,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'MAC',
                                            anchor: '100%',
                                            emptyText: 'Enter MAC',
                                            allowBlank: true,
                                            name: 'mac'
                                        }
                                    ]
                                },
                            ]
                        },
                        {
                            xtype: 'checkbox',
                            name: 'noncomputing',
                            hideLabel: false,
                            checked: false,
                            boxLabel: 'Non-computing'
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
                    anchor: "100% -260",
                    layout: 'fit',
                    items: [
                        this.stigGrid
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

        this.getForm().addListener('beforeadd', (fp, c, i) => {
            let one = c
        })

        this.getForm().getFieldValues = function(dirtyOnly, getDisabled){
            // Override to support submitValue boolean
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
            id: 'dev-test',
            padding: '10px 15px 10px 15px',
            initialCollectionId: initialCollectionId,
            btnHandler: async function(){
                try {
                    if (assetPropsFormPanel.getForm().isValid()) {
                        let values = assetPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        // //TODO: getFieldValues should not return 'undefined' 
                        delete values.undefined
                        let method = assetId ? 'PUT' : 'POST'
                        let url = assetId ? `${STIGMAN.Env.apiBase}/assets/${assetId}` : `${STIGMAN.Env.apiBase}/assets`
                        let result = await Ext.Ajax.requestPromise({
                            url: url,
                            method: method,
                            params: {
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
                    alert(e.message)
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
            height:666,
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

