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
    onLabelChanged: function (collectionId, label) {
        if (collectionId === this.collectionId) {
            this.getView().refresh()
        }
    },
    onLabelDeleted: function (collectionId, labelId) {
        if (collectionId === this.collectionId) {
            this.getStore().reload()
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
                name: 'labelIds',
                convert: (v, r) => r.labels.map((label)=>label.labelId) 
            },
            {
                name: 'assessments',
                type: 'integer',
                mapping: 'metrics.assessments'
            },
            {
                name: 'stigCount', 
                convert: (v, r) => r.benchmarkIds.length
            },
            {
                name: 'assessedPct',
                convert: (v, r) => r.metrics.assessments ? r.metrics.assessed / r.metrics.assessments * 100 : 0
            },
            {
                name: 'savedPct',
                convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.saved + r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
            },
            {
                name: 'submittedPct',
                convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
            },
            {
                name: 'acceptedPct',
                convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.accepted / r.metrics.assessments) * 100 : 0
            },
            {
                name: 'rejectedPct',
                convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.rejected / r.metrics.assessments) * 100 : 0
            },
            {
                name: 'minTs',
                type: 'date',
                mapping: 'metrics.minTs'
            },
            {
                name: 'maxTs',
                type: 'date',
                mapping: 'metrics.maxTs'
            },
            {
                name: 'maxTouchTs',
                type: 'date',
                mapping: 'metrics.maxTouchTs'
            },
            {name: 'metadata'}
        ])
        this.proxy = new Ext.data.HttpProxy({
            restful: true,
            url: this.url,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        })
        const assetStore = new Ext.data.JsonStore({
            grid: this,
            smMaskDelay: 250,
            proxy: this.proxy,
            root: '',
            fields: fieldsConstructor,
            idProperty: 'assetId',
            sortInfo: {
                field: 'name',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            }
        })
        me.totalTextCmp = new SM.RowCountTextItem ({
            store: assetStore,
            noun: 'asset',
            iconCls: 'sm-asset-icon'
        })
        const sm = new Ext.grid.CheckboxSelectionModel({
            singleSelect: false,
            checkOnly: false,
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
                    exportBtn.setDisabled(!(hasSelection && someSelectionsHaveStigs))
                    SM.SetCheckboxSelModelHeaderState(sm)
                }
            }
        })
        const assetColumnId = Ext.id()
        const columns = [
            sm,
            { 	
				header: "Asset",
                id: assetColumnId,
				width: 175,
                dataIndex: 'name',
				sortable: true,
                filter: {type: 'string'}
			},
            {
                header: "Labels",
                width: 220,
                dataIndex: 'labelIds',
                sortable: false,
                filter: {
                    type: 'values', 
                    collectionId: me.collectionId,
                    renderer: SM.ColumnFilters.Renderers.labels
                },
                renderer: function (value, metadata) {
                    const labels = []
                    for (const labelId of value) {
                        const label = SM.Cache.CollectionMap.get(me.collectionId).labelMap.get(labelId)
                        if (label) labels.push(label)
                    }
                    labels.sort((a,b) => a.name.localeCompare(b.name))
                    metadata.attr = 'style="white-space:nowrap;text-overflow:clip;"'
                    return SM.Collection.LabelArrayTpl.apply(labels)
                }
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
				width: 100,
                dataIndex: 'ip',
                hidden: true,
				sortable: true,
                renderer: SM.styledEmptyRenderer
			},
            { 	
				header: "MAC",
                hidden: true,
				width: 110,
                dataIndex: 'mac',
				sortable: true,
                renderer: SM.styledEmptyRenderer,
                filter: {type: 'string'}
			},
            { 	
				header: "STIGs",
				width: 50,
				dataIndex: 'stigCount',
				align: "center",
				tooltip:"Total STIGs Assigned",
				sortable: true
			},
            { 	
				header: "Rules",
				width: 50,
				dataIndex: 'assessments',
				align: "center",
				sortable: true
			},
            {
                header: 'Oldest',
                width: 50,
                dataIndex: 'minTs',
                align: 'center',
                sortable: true,
                renderer: renderDurationToNow
            },
            {
                header: 'Newest',
                width: 50,
                dataIndex: 'maxTs',
                align: 'center',
                sortable: true,
                renderer: renderDurationToNow
            },
            { 	
				header: "Assessed",
				width: 100,
				dataIndex: 'assessedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},
            { 	
				header: "Submitted",
				width: 100,
				dataIndex: 'submittedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},
            { 	
				header: "Accepted",
				width: 100,
				dataIndex: 'acceptedPct',
				align: "center",
				sortable: true,
                renderer: renderPct
			},
            { 	
				header: "Rejected",
				width: 100,
				dataIndex: 'rejectedPct',
				align: "center",
				sortable: true,
                renderer: renderPctAllHigh
			}
        ]
        const exportBtn = new Ext.Button({
            iconCls: 'sm-export-icon',
            text: 'Export results...',
            disabled: true,
            handler: function() {
                SM.Exports.showExportTree( me.collectionId, me.collectionName, 'asset', me.getSelectionModel().getSelections().map( r => r.data ) )            
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
                    const confirmStr=`Deleting ${multiDelete ? '<b>multiple assets</b>' : 'this asset'} will <b>permanently remove</b> all data associated with the asset${multiDelete ? 's' : ''}. This includes all the corresponding STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to continue?`;
                    let btn = await SM.confirmPromise("Confirm Delete", confirmStr)
                    if (btn == 'yes') {
                        const assetIds = assetRecords.map( r => r.data.assetId)
                        Ext.getBody().mask(`Deleting ${assetRecords.length} Assets`)
                        await Ext.Ajax.requestPromise({
                            responseType: 'json',
                            url: `${STIGMAN.Env.apiBase}/assets?collectionId=${me.collectionId}`,
                            method: 'PATCH',
                            jsonData: {
                                operation: 'delete',
                                assetIds
                            }
                        })
                        me.store.suspendEvents(false)
                        // Might need to handle edge case when the selected record was changed (e.g., stats updated) while still selected, then is deleted
                        me.store.remove(assetRecords)
                        me.store.resumeEvents()

                        SM.Dispatcher.fireEvent('assetdeleted', {collection: {collectionId: me.collectionId}}) // mock an Asset for collectionManager.onAssetEvent
                    }
                }
                catch (e) {
                    SM.Error.handleError(e)
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
                          let returnedAsset = await Ext.Ajax.requestPromise({
                            responseType: 'json',
                            url: `${STIGMAN.Env.apiBase}/assets/${thisRecord.data.assetId}`,
                            method: 'PATCH',
                            jsonData: {
                                collectionId: item.collectionId
                            }
                          })
                          let apiAsset = await Ext.Ajax.requestPromise({
                            responseType: 'json',
                            url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/metrics/summary/asset`,
                            method: 'GET',
                            params: {
                                assetId: thisRecord.data.assetId
                            }
                          })
                          apiAsset.collection = returnedAsset.collection
                          me.store.remove(thisRecord)
                          SM.Cache.updateCollectionLabels(returnedAsset.collection.collectionId)
                          SM.Dispatcher.fireEvent('assetdeleted', {...apiAsset, ...{collection: {collectionId: me.collectionId}}})
                          SM.Dispatcher.fireEvent('assetcreated', apiAsset)
                      }
                    }
                  }
                  catch (e) {
                    SM.Error.handleError(e)
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
            text: 'Modify...',
            handler: function() {
                var r = me.getSelectionModel().getSelected();
                Ext.getBody().mask('Getting properties...');
                showAssetProps(r.get('assetId'), me.collectionId);
            }
        })
        const config = {
            layout: 'fit',
            loadMask: {msg:''},
            store: assetStore,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm,
            view: new SM.ColumnFilters.GridViewBuffered({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit: true,
                autoExpandColumn: assetColumnId,
                // custom row height
                rowHeight: 21,
                borderHeight: 2,
                // render rows as they come into viewable area.
                scrollDelay: false,
                
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
                    SM.Dispatcher.removeListener('labelchanged', me.onLabelChanged, me)
                    SM.Dispatcher.removeListener('labeldeleted', me.onLabelDeleted, me)
                },
                keydown: SM.CtrlAGridHandler
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
                        text: 'Import CKL(B) or XCCDF...',
                        tooltip: SM.TipContent.ImportFromCollectionManager,
                        handler: function() {
                            showImportResultFiles(me.collectionId);            
                        }
                    },
                    '-',
                    exportBtn,
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
        SM.Dispatcher.addListener('labelchanged', this.onLabelChanged, this)
        SM.Dispatcher.addListener('labeldeleted', this.onLabelDeleted, this)
    }   
})
Ext.reg('sm-collection-asset-grid', SM.CollectionAssetGrid)

SM.AssetLabelField = Ext.extend(Ext.form.Field, {
    defaultAutoCreate : {tag: "div"},
    initComponent: function () {
        const _this = this
        this.labelIds = this.labelIds || []
        const cachedCollection = SM.Cache.CollectionMap.get(this.collectionId)
        this.labelsMenu = new SM.Collection.LabelsMenu({
            // menuTitle: 'Manage labels',
            labels: cachedCollection.labels,
            listeners: {
                itemcheckchanged: function (item, checked) {
                    const cachedCollection = SM.Cache.CollectionMap.get(_this.collectionId)
                    _this.labelIds = item.parentMenu.getCheckedLabelIds()
                    const assetLabels = cachedCollection.labels.filter( label => _this.labelIds.includes(label.labelId))
                    _this.previewfield.update(assetLabels)
                },
                applied: function (labelIds) {
                    const cachedCollection = SM.Cache.CollectionMap.get(_this.collectionId)
                    const assetLabels = cachedCollection.labels.filter( label => labelIds.includes(label.labelId))
                    _this.previewfield.update(assetLabels)
                    _this.labelIds = labelIds
                }
            }
        })
        this.menuBtn = new Ext.Button({
            menu: this.labelsMenu
        })
        this.previewfield = new Ext.form.DisplayField({
            tpl: SM.Collection.LabelArrayTpl,
            data: [],
        })
        const config = {
            name: 'labelIds'
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AssetLabelField.superclass.initComponent.call(this)
    },
    setValue: function (labelIds) {
            this.labelIds = labelIds
            this.labelsMenu.setLabelsChecked(labelIds, true)

            const cachedCollection = SM.Cache.CollectionMap.get(this.collectionId)
            const assetLabels = cachedCollection.labels.filter( function (label) {
                return labelIds.includes(label.labelId)
            })
            this.previewfield.update(assetLabels)
    },
    getValue: function () {
        return this.labelIds
    },
    onRender: function (ct, position) {
        SM.AssetLabelField.superclass.onRender.call(this, ct, position);
        const _this = this

        this.panel = new Ext.Panel({
            renderTo: this.el,
            // height: 50,
            // width: this.width,
            border: false,
            layout: 'hbox',
            layoutConfig: {
                align: 'middle'
            },
            bodyStyle: 'background-color: transparent;',
            items: [
                this.menuBtn,
                this.previewfield
            ]
        })
    }
})
Ext.reg('sm-asset-label-field', SM.AssetLabelField)


SM.StigSelectionField = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let _this = this
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
                },
                'revisionStrs',
                'revisions'
            ],
            autoLoad: this.autoLoad,
            url: this.url || `${STIGMAN.Env.apiBase}/stigs?projection=revisions`,
            root: this.root || '',
            sortInfo: {
                field: 'benchmarkId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'benchmarkId',
            listeners: {
                load: (store) => {
                    if (_this.includeAllItem) {
                        store.suspendEvents()
                        let allRecord = {
                            benchmarkId: _this.includeAllItem
                        }
                        store.loadData( _this.root ? { [_this.root]: allRecord } : allRecord , true)
                        store.sort('benchmarkId', 'ASC')
                        store.resumeEvents()
                    }
                }
            }
        })
        const tpl = new Ext.XTemplate(
            '<tpl for=".">',
                '<div class="x-combo-list-item">{[this.highlightQuery(values.benchmarkId)]}</div>',
            '</tpl>',
            {
                highlightQuery: function (text) {
                    const re = new RegExp(_this.el.dom.value,'gi')
                    return text.replace(re,'<span class="sm-text-highlight">$&</span>')
                }
            }
        )
        let config = {
            store: stigStore,
            tpl,
            filteringStore: this.filteringStore || null,
            displayField: 'benchmarkId',
            valueField: 'benchmarkId',
            mode: 'local',
            forceSelection: true,
			typeAhead: false,
			minChars: 0,
            triggerAction: 'all',
            listeners: {
                afterrender: (combo) => {
                    combo.getEl().dom.setAttribute('spellcheck', 'false')
                },
                ...this.listeners
            },
            doQuery : (q, forceAll) => {
                // Custom re-implementation of the original ExtJS method
				q = Ext.isEmpty(q) ? '' : q;
				if ( forceAll === true || (q.length >= this.minChars) ) {
					// Removed test against this.lastQuery
                    this.selectedIndex = -1
                    let filters = []
                    if (this.filteringStore) {
                        // Exclude records from the combo store that are in the filteringStore
                        filters.push(
                            {
                                fn: (record) =>  record.id === this.initialBenchmarkId || this.filteringStore.indexOfId(record.id) === -1,
                                scope: this
                            }
                        )
                    }
                    if (q) {
                        // Include records that partially match the combo value
                        filters.push(
                            {
                                property: this.displayField,
                                value: q,
                                anyMatch: true
                            }
                        )
                    }
                    this.store.filter(filters)
                    this.onLoad()
				}
            },
            validator: (v) => {
                // Don't keep the form from validating when I'm not active
                if (_this.grid && _this.grid.editor && !_this.grid.editor.editing) {
                    return true
                }
                if (v === "") { 
                    return "Blank values not allowed"
                }
                if (v !== _this.initialBenchmarkId && _this.store.indexOfId(v) === -1) { 
                    return "Value must be a benchmarkId"
                }
                return true
            }     
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.StigSelectionField.superclass.initComponent.call(this)
    },
    
    // Re-implement validateBur() to always return false. The framework's implementation always returned true
    // and selecting an item from the droplist would mimic a blur even when the <input> remained focused. This
    // prevented the droplist from expanding when characters were typed following a droplist selection
    validateBlur: function () { return false },
    
    // Re-implement onTriggerClick() to select the value in the droplist
    onTriggerClick : function() {
        if(this.readOnly || this.disabled){
            return;
        }
        if(this.isExpanded()){
            this.collapse();
            this.el.focus();
        }else {
            this.onFocus({});
            if(this.triggerAction == 'all') {
                this.doQuery(this.allQuery, true);
                // added line below for this override
                this.selectByValue(this.value, true);
            } else {
                this.doQuery(this.getRawValue());
            }
            this.el.focus();
        }
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
            filteringStore: stigAssignedStore,
            getListParent: function() {
                return this.grid.editor.el;
            }
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
        let assetLabelField
        if (SM.Cache.CollectionMap.get(this.initialCollectionId).labels.length) {
            assetLabelField = {
                xtype: 'sm-asset-label-field',
                collectionId: this.initialCollectionId,
                fieldLabel: 'Labels'
            }
        }
        else {
            assetLabelField = {
                xtype: 'displayfield',
                fieldLabel: 'Labels',
                value: '<i>Asset labels are not defined for this Collection</i>'
            }
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
                            xtype: 'checkbox',
                            name: 'noncomputing',
                            hideLabel: false,
                            checked: false,
                            boxLabel: 'Non-computing'
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
                        assetLabelField,
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
                    anchor: "100% -290",
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
            initialCollectionId,
            btnHandler: async function(){
                try {
                    if (assetPropsFormPanel.getForm().isValid()) {
                        let values = assetPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        // //TODO: getFieldValues should not return 'undefined' 
                        delete values.undefined
                        const method = assetId ? 'PUT' : 'POST'
                        const url = assetId ? `${STIGMAN.Env.apiBase}/assets/${assetId}` : `${STIGMAN.Env.apiBase}/assets`
                        const returnedAsset = await Ext.Ajax.requestPromise({
                            responseType: 'json',
                            url,
                            method,
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            jsonData: values
                        })
                        const apiAsset = await Ext.Ajax.requestPromise({
                            responseType: 'json',
                            url: `${STIGMAN.Env.apiBase}/collections/${initialCollectionId}/metrics/summary/asset`,
                            method: 'GET',
                            params: {
                                assetId: returnedAsset.assetId
                            }
                          })
                        apiAsset.collection = returnedAsset.collection
                        const event = assetId ? 'assetchanged' : 'assetcreated'
                        SM.Dispatcher.fireEvent(event, apiAsset)
                        appwindow.close()
                    }
                }
                catch (e) {
                    if (e.responseText) {
                      const response = SM.safeJSONParse(e.responseText)
                      if (response?.detail === 'Duplicate name exists.') {
                        Ext.Msg.alert('Name unavailable', 'The Asset name is already used in this Collection. Please try a different name.')
                      }
                      else {
                        appwindow.close()
                        await SM.Error.handleError(e)
                      }
                    }
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
            let apiAsset = await Ext.Ajax.requestPromise({
                responseType: 'json',
                url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
                params: {
                    projection: ['stigs']
                },
                method: 'GET'
            })
            apiAsset.collectionId = apiAsset.collection.collectionId
            delete apiAsset.collection
            assetPropsFormPanel.getForm().setValues(apiAsset)
        }
                
        Ext.getBody().unmask();
        appwindow.show(document.body);
    }
    catch (e) {
        Ext.getBody().unmask()
        SM.Error.handleError(e)
    }	
} //end showAssetProps

