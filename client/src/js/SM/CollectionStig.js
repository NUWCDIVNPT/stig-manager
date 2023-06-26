'use strict'

Ext.ns('SM')

SM.CollectionStigsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        let _this = this
        let fieldsConstructor = Ext.data.Record.create([
            { name: 'benchmarkId', type: 'string' },
            { name: 'revisionStr', type: 'string' },
            { name: 'revisionPinned', type: 'boolean' },
            { name: 'assets', type: 'integer' },
            { name: 'ruleCount', type: 'integer'},
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
            }
        ])
        this.proxy = new Ext.data.HttpProxy({
            restful: true,
            url: this.url,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        })
        let store = new Ext.data.JsonStore({
            grid: this,
            smMaskDelay: 250,
            proxy: this.proxy,
            root: '',
            fields: fieldsConstructor,
            idProperty: 'benchmarkId',
            sortInfo: {
                field: 'benchmarkId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            }
        })
        this.totalTextCmp = new SM.RowCountTextItem ({
            store: store,
            noun: 'STIG',
            iconCls: 'sm-stig-icon'
        })
        const sm = new Ext.grid.CheckboxSelectionModel({
            singleSelect: false,
            checkOnly: false,
            listeners: {
                selectionchange: function (sm) {
                    modifyBtn.setDisabled(sm.getCount() !== 1)
                    deleteBtn.setDisabled(sm.getCount() !== 1)
                    exportBtn.setDisabled(!sm.hasSelection())
                    SM.SetCheckboxSelModelHeaderState(sm)
                }
            }
        })
        const benchmarkColumnId = Ext.id()
        let columns = [
            sm,
            { 	
				header: "BenchmarkId",
                id: benchmarkColumnId,
				width: 300,
                dataIndex: 'benchmarkId',
				sortable: true,
                filter: {type:'string'}
			},
            { 	
				header: "Revision",
				width: 70,
                dataIndex: 'revisionStr',
                // align: "center",
                sortable: false,
                renderer: function (v, md, r) {
                    return `${r.data.revisionStr}${r.data.revisionPinned ? '<img src="img/pin.svg" width="12" height="12" style="margin-left: 8px;">' : ''}`
                }
			},
            {
                header: 'Rules',
                width: 70,
                dataIndex: 'ruleCount',
                align: "center",
                sortable: true
            },
            {
                header: 'Assets',
                width: 70,
                dataIndex: 'assets',
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
                SM.Exports.showExportTree( _this.collectionId, _this.collectionName, 'stig', _this.getSelectionModel().getSelections().map( r => r.data )  );            
            }
        })
        const modifyBtn = new Ext.Button({
            iconCls: 'sm-stig-icon',
            disabled: true,
            text: 'Modify...',
            handler: function() {
                const r = _this.getSelectionModel().getSelected().data
                showCollectionStigProps(r.benchmarkId, r.revisionPinned ? r.revisionStr : 'latest', _this);
            }
        })
        const deleteBtn = new Ext.Button({
            iconCls: 'icon-del',
            text: 'Unassign STIG...',
            disabled: true,
            handler: function() {
                try {
                    var confirmStr="Removing this STIG will remove all related Asset assignments. If the STIG is added in the future, the assignments will need to be established again.";
                    Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
                        if (btn == 'yes') {
                            const stigRecord = _this.getSelectionModel().getSelected()
                            await Ext.Ajax.requestPromise({
                                url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/stigs/${stigRecord.data.benchmarkId}/assets`,
                                method: 'PUT',
                                jsonData: []
                            })
                            _this.store.remove(stigRecord)
                            SM.Dispatcher.fireEvent('stigassetschanged', _this.collectionId, stigRecord.data.benchmarkId, [] )
                        }
                    })
                }
                catch (e) {
                    SM.Error.handleError(e)
                }
            }
        })
        let config = {
            layout: 'fit',
            loadMask: {msg: ''},
            store: store,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm,
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true,
                listeners: {
                    filterschanged: function (view, item, value) {
                        store.filter(view.getFilterFns())  
                    }
                }		    
            }),
            listeners: {
                rowdblclick: {
                    fn: function(grid,rowIndex,e) {
                        const r = grid.getStore().getAt(rowIndex).data
                        showCollectionStigProps(r.benchmarkId, r.revisionPinned ? r.revisionStr : 'latest', _this);
                    }
                },
                keydown: SM.CtrlAGridHandler
            },
            tbar: new Ext.Toolbar({
                items: [
                    {
                        iconCls: 'icon-add',
                        text: 'Assign STIG...',
                        grid: this,
                        handler: function(btn) {
                            showCollectionStigProps( null, null, btn.grid );            
                        }
                    },
                    '-',
                    exportBtn,
                    '-',
                    deleteBtn,
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
                        gridBasename: 'STIGs (grid)',
                        storeBasename: 'STIGs (store)',
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
        SM.CollectionStigsGrid.superclass.initComponent.call(this)
    }   
})
Ext.reg('sm-collection-stigs-grid', SM.CollectionStigsGrid)

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
                this.store.filter({property:'name',value:value,anyMatch:true,caseSensitive:false});
            }
        }
    },
    initComponent: function() {
        const _this = this
        let fields = Ext.data.Record.create([
            {name:'assetId',type:'string'},
            {name:'name',type:'string'},
            {name:'labelIds'},
            {name:'collection'}
        ])
        let store = new Ext.data.JsonStore({
            url: `${STIGMAN.Env.apiBase}/assets`,
            baseParams: {
                collectionId: this.collectionId
            },
            grid: this,
            // reader: reader,
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
                }
            }
        })
        const totalTextCmp = new SM.RowCountTextItem ({
            store: store,
            noun: 'asset',
            iconCls: 'sm-asset-icon'
        })
        let sm = new Ext.grid.CheckboxSelectionModel({
            checkOnly: false,
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
                },
                {
                    header: "Labels",
                    width: 120,
                    dataIndex: 'labelIds',
                    sortable: false,
                    filter: {
                        type: 'values', 
                        collectionId: _this.collectionId,
                        renderer: SM.ColumnFilters.Renderers.labels
                    },
                    renderer: function (value, metadata, record) {
                        const labels = []
                        for (const labelId of value) {
                            const label = SM.Cache.CollectionMap.get(_this.collectionId).labelMap.get(labelId)
                            if (label) labels.push(label)
                        }
                        labels.sort((a,b) => a.name.localeCompare(b.name))
                        metadata.attr = 'style="white-space:normal;"'
                        return SM.Collection.LabelArrayTpl.apply(labels)
                    }
                }    
            ],
            border: true,
            loadMask: false,
            stripeRows: true,
            sm: sm,
            view: new SM.ColumnFilters.GridView({
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
                        iconCls: 'sm-export-icon',
                        text: 'CSV'
                    },{
                        xtype: 'tbfill'
                    },{
                        xtype: 'tbseparator'
                    },
                    totalTextCmp
                ]
            }),
            getValue: function() {
                return JSON.parse(encodeSm(sm,'assetId'))
            },
            setValue: function (apiAssets) {
                const sm = this.getSelectionModel()
                const assetIds = apiAssets.map(o => o.assetId)
                const selectedRecords = []
                for( let i=0; i < assetIds.length; i++ ) {
                    let record = store.getById( assetIds[i] )
                    selectedRecords.push(record)
                }
                this.store.clearFilter(true)
                const origSilent = sm.silent
                sm.silent = true
                sm.selectRecords(selectedRecords)
                sm.silent = origSilent
                this.filterStore.call(this)
                this.originalAssetIds = assetIds
            },
            markInvalid: function() {},
            clearInvalid: function() {},
            getName: () => this.name,
            validate: () => true
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.StigAssetsGrid.superclass.initComponent.call(this);
    },
    isValid: function ()  {
        return this.getSelectionModel().getCount() > 0
    }
})
Ext.reg('sm-stig-assets-grid', SM.StigAssetsGrid)

SM.StigRevisionComboBox = Ext.extend(SM.Global.HelperComboBox, {
    initComponent: function () {
      const _this = this

      this.store = new Ext.data.SimpleStore({
        fields: ['value', 'display']
      })

      const data = []

      const config = {
        displayField: 'display',
        valueField: 'value',
        triggerAction: 'all',
        mode: 'local',
        editable: false,
        helpText: SM.TipContent.DefaultRevision
      }

      Ext.apply(this, Ext.apply(this.initialConfig, config))
      this.superclass().initComponent.call(this)

      this.store.loadData(data)
    }
})

SM.CollectionStigProperties = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        const _this = this
        if (! this.collectionId) {
            throw ('missing property collectionId')
        }
        const stigAssetsGrid = new SM.StigAssetsGrid({
            name: 'assets',
            benchmarkId: this.benchmarkId,
            collectionId: this.collectionId
        })
        stigAssetsGrid.getSelectionModel().addListener('selectionchange', setButtonState)
        const stigField = new SM.StigSelectionField({
            name: 'benchmarkId',
            submitValue: false,
            fieldLabel: 'BenchmarkId',
            hideTrigger: false,
            anchor: '100%',
            // width: 350,
            autoLoad: false,
            allowBlank: false,
            filteringStore: this.stigFilteringStore,
            initialBenchmarkId: this.benchmarkId,
            fireSelectOnSetValue: true,
            listeners: {
                select: function (combo, record, index) {
                    const revisions = [['latest', 'Most recent revision'], ...record.data.revisions.map( rev => [rev.revisionStr, `${rev.revisionStr} (${rev.benchmarkDate})`])]
                    revisionComboBox.store.loadData(revisions)
                    revisionComboBox.setValue(record.data.benchmarkId === _this.benchmarkId ? _this.defaultRevisionStr : 'latest')
                    setButtonState()
                }
            }
        })
        const revisionComboBox = new SM.StigRevisionComboBox({
            name: 'defaultRevisionStr',
            fieldLabel: 'Default revision',
            listeners: {
                select: setButtonState
            }
        })

        const saveBtn = new Ext.Button({
            text: 'Update',
            disabled: true,
            collectionId: this.collectionId,
            formBind: true,
            handler: this.btnHandler || function () {}
        })
 
        function setButtonState () {
            const currentAssetIds = stigAssetsGrid.getValue()
            const currentBenchmarkId = stigField.getValue()
            const currentRevisionStr = revisionComboBox.getValue()
            const originalAssetIds = stigAssetsGrid.originalAssetIds

            if (!currentAssetIds.length || currentBenchmarkId === '' || currentRevisionStr === '') {
                saveBtn.disable()
                return
            }

            const revisionUnchanged = currentBenchmarkId === _this.benchmarkId && currentRevisionStr === _this.defaultRevisionStr
            const assetsUnchanged = currentAssetIds.length === originalAssetIds.length && originalAssetIds.every( assetId => currentAssetIds.includes(assetId))

            saveBtn.setDisabled(revisionUnchanged && assetsUnchanged)
        }

        let config = {
            baseCls: 'x-plain',
            // height: 400,
            labelWidth: 100,
            monitorValid: false,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<b>STIG information</b>',
                    items: [
                        stigField,
                        revisionComboBox
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '<b>Asset Assignments</b>',
                    anchor: "100% -95",
                    layout: 'fit',
                    items: [stigAssetsGrid]
                }

            ],
            buttons: [saveBtn],
            stigField,
            revisionComboBox,
            stigAssetsGrid
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.CollectionStigProperties.superclass.initComponent.call(this)

    },
    initPanel: async function ({collectionId, benchmarkId}) {
        try {
            this.el.mask('')
            const promises = [
                this.stigField.store.loadPromise(),
                this.stigAssetsGrid.store.loadPromise()
            ]
            if (benchmarkId) {
                promises.push(Ext.Ajax.requestPromise({
                    responseType: 'json',
                    url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
                    method: 'GET'
                }))
            }
            const results = await Promise.all(promises)
            
            this.getForm().setValues({
                benchmarkId,
                assets: results[2] || []
            })
        }
        finally {
            this.el.unmask()
        }
    }
})

async function showCollectionStigProps( benchmarkId, defaultRevisionStr, parentGrid ) {
    let appwindow
    try {
        const collectionId = parentGrid.collectionId
        const stigPropsFormPanel = new SM.CollectionStigProperties({
            collectionId,
            benchmarkId,
            defaultRevisionStr,
            stigFilteringStore: parentGrid.store,
            btnHandler: async function( btn ){
                try {
                    if (stigPropsFormPanel.getForm().isValid()) {
                        stigPropsFormPanel.el.mask('Updating')
                        const values = stigPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        const jsonData = {}
                        if (values.defaultRevisionStr) {
                            jsonData.defaultRevisionStr = values.defaultRevisionStr
                        }
                        if (values.assets) {
                            jsonData.assetIds = values.assets
                        }
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${btn.collectionId}/stigs/${values.benchmarkId}`,
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            jsonData
                        })
                        const apiStigAssets = JSON.parse(result.response.responseText)
                        SM.Dispatcher.fireEvent('stigassetschanged', btn.collectionId, values.benchmarkId, apiStigAssets)
                        appwindow.close()
                    }
                }
                catch (e) {
                    SM.Error.handleError(e)
                }
                finally {
                    stigPropsFormPanel.el.unmask()
                }
            }
        })

        /******************************************************/
        // Form window
        /******************************************************/
        appwindow = new Ext.Window({
            title: 'STIG Assignments',
            cls: 'sm-dialog-window sm-round-panel',
            modal: true,
            hidden: true,
            width: 510,
            height:660,
            layout: 'fit',
            plain:true,
            bodyStyle:'padding:10px;',
            buttonAlign:'right',
            items: stigPropsFormPanel
        });
        
        appwindow.show(document.body)

        await stigPropsFormPanel.initPanel({
            benchmarkId,
            collectionId
        })
    }
    catch (e) {
        SM.Error.handleError(e)
        if (appwindow) {
            appwindow.close()
        }
    }	
}
