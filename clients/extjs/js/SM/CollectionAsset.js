'use strict'

Ext.ns('SM')

/* 
@cfg collectionId 
@cfg url
*/
SM.CollectionAssetGrid = Ext.extend(Ext.grid.GridPanel, {
    onAssetChangedOrCreated: function (apiAsset) {
        if (apiAsset.collection.collectionId === this.collectionId) {
            this.store.loadData(apiAsset, true) // append with replace
            const sortState = this.store.getSortState()
            this.store.sort(sortState.field, sortState.direction)    
        }
    },
    initComponent: function() {
        const me = this
        const id = Ext.id()
        const fieldsConstructor = Ext.data.Record.create([
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
                mapping: 'statusStats.ruleCount'
            },
            {
                name: 'stigCount',
                type: 'integer',
                mapping: 'statusStats.stigCount'
            },
            {
                name: 'savedPct',
                convert: (v, r) => r.statusStats.ruleCount ? ((r.statusStats.savedCount + r.statusStats.submittedCount + r.statusStats.acceptedCount + r.statusStats.rejectedCount)/r.statusStats.ruleCount) * 100 : 0
            },
            {
                name: 'submittedPct',
                convert: (v, r) => r.statusStats.ruleCount ?((r.statusStats.submittedCount + r.statusStats.acceptedCount + r.statusStats.rejectedCount)/r.statusStats.ruleCount) * 100 : 0
            },
            {
                name: 'acceptedPct',
                convert: (v, r) => r.statusStats.ruleCount ? (r.statusStats.acceptedCount/r.statusStats.ruleCount) * 100 : 0
            },
            {
                name: 'rejectedPct',
                convert: (v, r) => r.statusStats.ruleCount ? (r.statusStats.rejectedCount/r.statusStats.ruleCount) * 100 : 0
            },
            {
                name: 'stigUnassignedCount',
                type: 'integer',
                convert: (v, r) => r.statusStats.stigCount - r.statusStats.stigAssignedCount
            },
            {
                name: 'minTs',
                type: 'date',
                mapping: 'statusStats.minTs'
            },
            {
                name: 'maxTs',
                type: 'date',
                mapping: 'statusStats.maxTs'
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
        const assetStore = new Ext.data.JsonStore({
            grid: this,
            smMaskDelay: 250,
            proxy: this.proxy,
            baseParams: {
                collectionId: this.collectionId,
                projection: ['statusStats']
            },
            root: '',
            fields: fieldsConstructor,
            idProperty: 'assetId',
            sortInfo: {
                field: 'name',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            }
        })
        me.totalTextCmp = new SM.RowCountTextItem ({
            store: assetStore
        })

        const columns = [
            { 	
				header: "Asset",
				width: 100,
                dataIndex: 'name',
				sortable: true,
                filter: {type: 'string'}
			},
            { 	
				header: "FQDN",
				width: 100,
                dataIndex: 'fqdn',
				sortable: true,
                hidden: true,
                renderer: SM.styledEmptyRenderer,
                filter: {type: 'string'}
			},
            { 	
				header: "IP",
                fixed: true,
				width: 100,
                dataIndex: 'ip',
				sortable: true,
                renderer: SM.styledEmptyRenderer
			},
            { 	
				header: "MAC",
                hidden: true,
                fixed: true,
				width: 110,
                dataIndex: 'mac',
				sortable: true,
                renderer: SM.styledEmptyRenderer,
                filter: {type: 'string'}
			},
            { 	
				header: "STIGs",
				width: 50,
                fixed: true,
				dataIndex: 'stigCount',
				align: "center",
				tooltip:"Total STIGs Assigned",
				sortable: true
			},
            { 	
				header: "Checks",
				width: 50,
                fixed: true,
				dataIndex: 'ruleCount',
				align: "center",
				sortable: true
			},
            {
                header: 'Oldest',
                width: 50,
                fixed: true,
                dataIndex: 'minTs',
                align: 'center',
                sortable: true,
                renderer: renderDurationToNow
            },
            {
                header: 'Newest',
                width: 50,
                fixed: true,
                dataIndex: 'maxTs',
                align: 'center',
                sortable: true,
                renderer: renderDurationToNow
            },
            { 	
				header: "Reviewed",
				width: 100,
                fixed: true,
				dataIndex: 'savedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},
            { 	
				header: "Submitted",
				width: 100,
                fixed: true,
				dataIndex: 'submittedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},
            { 	
				header: "Accepted",
				width: 100,
                fixed: true,
				dataIndex: 'acceptedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},
            { 	
				header: "Rejected",
				width: 100,
                fixed: true,
				dataIndex: 'rejectedPct',
				align: "center",
				sortable: true,
                renderer: renderPctAllHigh
			}
        ]
        const exportCklBtn = new Ext.Button({
            iconCls: 'sm-export-icon',
            text: 'Export CKLs...',
            disabled: true,
            handler: function() {
                showExportCklFiles( me.collectionId, me.collectionName, 'asset', me.getSelectionModel().getSelections().map( r => r.data ) )            
            }
        })
        const deleteBtn = new Ext.Button(                    {
            iconCls: 'icon-del',
            text: 'Delete...',
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
        })
        const transferBtn = new SM.TransferAssets.TransferBtn(                    {
            iconCls: 'sm-collection-icon',
            disabled: true,
            srcCollectionId: me.collectionId,
            text: 'Transfer To',
            onItemClick: async function (item) {
                try {
                    const srcAssets = item.parentMenu.srcAssets
                    const isMulti = srcAssets?.length > 1
                    var confirmStr=`Transfering ${isMulti ? 'these assets' : 'this asset'} to ${item.text} will <b>transfer all data</b> associated with the asset${isMulti ? 's' : ''}. This includes all the corresponding STIG assessments.<br><br>Do you wish to continue?`
                    const btn = await SM.confirmPromise('Confirm transfer', confirmStr)
                    if (btn == 'yes') {
                      const l = srcAssets?.length || 0
                      for (let i=0; i < l; i++) {
                          Ext.getBody().mask(`Transferring ${i+1}/${l} Assets`)
                          // Edge case to handle when the selected record was changed (e.g., stats updated) 
                          // while still selected, then is transferred
                          const thisRecord = me.store.getById(srcAssets[i].assetId)
                          let result = await Ext.Ajax.requestPromise({
                              url: `${STIGMAN.Env.apiBase}/assets/${thisRecord.data.assetId}`,
                              method: 'PATCH',
                              params: {
                                  projection: ['stigs', 'statusStats']
                              },
                              jsonData: {
                                  collectionId: item.collectionId
                              }
                          })
                          let apiAsset = JSON.parse(result.response.responseText)
                          me.store.remove(thisRecord)
                          SM.Dispatcher.fireEvent('assetdeleted', {...apiAsset, ...{collection: {collectionId: me.collectionId}}})
                          SM.Dispatcher.fireEvent('assetcreated', apiAsset)
                      }
                    }
                  }
                  catch (e) {
                      alert(e.stack)
                  }
                  finally {
                      Ext.getBody().unmask()
                  }
        
            },
            handler: function(btn) {
                const assetRecords = me.getSelectionModel().getSelections()
                btn.setSrcAssets(assetRecords.map( r => r.data))
            }
        })
        const modifyBtn = new Ext.Button(                    {
            iconCls: 'sm-asset-icon',
            disabled: true,
            text: 'Properties...',
            handler: function() {
                var r = me.getSelectionModel().getSelected();
                Ext.getBody().mask('Getting properties...');
                showAssetProps(r.get('assetId'), me.collectionId);
            }
        })
        const config = {
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
                        modifyBtn.setDisabled(sm.getCount() !== 1)
                        const hasSelection = sm.hasSelection()
                        let someSelectionsHaveStigs = false
                        if (hasSelection) {
                            const selectedRecords = sm.getSelections()
                            someSelectionsHaveStigs = selectedRecords.some( i => i.data.stigCount > 0)
                        }
                        for (const btn of [deleteBtn, transferBtn]) {
                            btn.setDisabled(!hasSelection)
                        }
                        exportCklBtn.setDisabled(!(hasSelection && someSelectionsHaveStigs))
                    }
                }
            }),
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true,
                listeners: {
                    filterschanged: function (view, item, value) {
                      assetStore.filter(view.getFilterFns())  
                    }
                }		    
            }),
            listeners: {
                rowdblclick: function(grid,rowIndex,e) {
                    var r = grid.getStore().getAt(rowIndex);
                    Ext.getBody().mask('Getting properties...');
                    showAssetProps(r.get('assetId'), me.collectionId);
                },
                beforedestroy: function(grid) {
                    SM.Dispatcher.removeListener('assetchanged', me.onAssetChangedOrCreated, me)
                    SM.Dispatcher.removeListener('assetcreated', me.onAssetChangedOrCreated, me)
                }
            },
            tbar: new Ext.Toolbar({
                items: [
                    {
                        iconCls: 'icon-add',
                        text: 'Create...',
                        handler: function() {
                            showAssetProps( null, me.collectionId);            
                        }
                    },
                    '-',

                    {
                        iconCls: 'sm-import-icon',
                        text: 'Import CKL or SCAP...',
                        handler: function() {
                            showImportResultFiles( me.collectionId, {fieldSettings: me.apiFieldSettings} );            
                        }
                    },
                    '-',
                    exportCklBtn,
                    '-',
                    deleteBtn,
                    '-',
                    transferBtn,
                    '-',
                    modifyBtn
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
                        text: 'CSV'
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

        SM.Dispatcher.addListener('assetchanged', this.onAssetChangedOrCreated, this)
        SM.Dispatcher.addListener('assetcreated', this.onAssetChangedOrCreated, this)
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
                if (me.grid && me.grid.editor && !me.grid.editor.editing) {
                    return true
                }
                if (v === "") { return "Blank values not allowed" }
            }     
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.StigSelectionField.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-stig-selection-field', SM.StigSelectionField)

SM.AssetStigsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const fields = [
            {	name:'benchmarkId',
                type: 'string'
            },
            {	name:'ruleCount',
                type: 'integer'
            }
        ]
        this.newRecordConstructor = Ext.data.Record.create(fields)
        const stigAssignedStore = new Ext.data.JsonStore({
            grid: this,
            root: '',
            fields: fields,
            idProperty: 'benchmarkId',
            sortInfo: {
                field: 'benchmarkId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            }
        })
        // const totalTextCmp = new SM.RowCountTextItem ({
        //     store: stigAssignedStore
        // })


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
                editor: stigSelectionField,
                filter: {type:'string'}
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
            onRowDblClick: Ext.emptyFn, // do nothing
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
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true,
                markDirty: false,
                listeners: {
                    filterschanged: function (view, item, value) {
                        stigAssignedStore.filter(view.getFilterFns())  
                    }
                }		    
            }),
            listeners: {
            },
            tbar: tbar,
            // bbar: ['->', totalTextCmp],
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
            markInvalid: Ext.emptyFn,
            clearInvalid: Ext.emptyFn,
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
        this.stigGrid = new SM.AssetStigsGrid({
            name: 'stigs'
        })
        if (! this.initialCollectionId) {
            throw (new Error('missing property initialCollectionId'))
        }
 
        let config = {
            baseCls: 'x-plain',
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
                handler: this.btnHandler || Ext.emptyFn
            }]
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AssetProperties.superclass.initComponent.call(this)

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
    

    }
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
                                projection: ['stigs', 'statusStats']
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
            cls: 'sm-dialog-window sm-round-panel',
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

        
        appwindow.render(Ext.getBody())
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

