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
        const assetSelectionPanel = new SM.AssetSelection.SelectingPanel({
            name: 'assets',
            collectionId: this.collectionId,
            isFormField: true,
            listeners: {
                assetselectionschanged: setButtonState
            }
        })
        const stigField = new SM.StigSelectionField({
            name: 'benchmarkId',
            submitValue: false,
            fieldLabel: 'BenchmarkId',
            hideTrigger: false,
            width: 350,
            autoLoad: false,
            allowBlank: false,
            filteringStore: this.stigFilteringStore,
            initialBenchmarkId: this.benchmarkId,
            fireSelectOnSetValue: true,
            enableKeyEvents: true,
            valid: false,
            listeners: {
                select: function (combo, record, index) {
                    const revisions = [['latest', 'Most recent revision'], ...record.data.revisions.map( rev => [rev.revisionStr, `${rev.revisionStr} (${rev.benchmarkDate})`])]
                    revisionComboBox.store.loadData(revisions)
                    revisionComboBox.setValue(record.data.benchmarkId === _this.benchmarkId ? _this.defaultRevisionStr : 'latest')
                    assetSelectionPanel.trackedProperty = { dataProperty: 'benchmarkIds', value: record.data.benchmarkId }
                    stigField.valid = true
                    setButtonState()
                },
                invalid: function (field) {
                    field.valid = false
                    setButtonState()
                },
                valid: function (field) {
                    field.valid = true
                    setButtonState()
                },
                blur: function (field) {
                    this.setValue(this.getRawValue())
                },
                render: function (field) {
                    field.el.dom.addEventListener('blur', () => field.fireEvent('blur'))
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
            if (!stigField.valid) {
                assetFieldSet.disable()
                saveBtn.disable()
                return
            }
            assetFieldSet.enable()
            const currentBenchmarkId = stigField.getRawValue()
            const currentRevisionStr = revisionComboBox.getValue()
            const currentAssetIds = assetSelectionPanel.getValue()
            const originalAssetIds = assetSelectionPanel.originalAssetIds

            if (!currentAssetIds.length) {
                saveBtn.disable()
                return
            }

            const revisionUnchanged = currentBenchmarkId === _this.benchmarkId && currentRevisionStr === _this.defaultRevisionStr
            const assetsUnchanged = currentAssetIds.length === originalAssetIds.length && originalAssetIds.every( assetId => currentAssetIds.includes(assetId))

            saveBtn.setDisabled(revisionUnchanged && assetsUnchanged)
        }

        const assetFieldSet = new Ext.form.FieldSet({
            title: '<span class="sm-asset-assignments-title">Asset assignments</span>',
            anchor: "100% -95",
            layout: 'fit',
            items: [assetSelectionPanel]
        })
        let config = {
            baseCls: 'x-plain',
            // height: 400,
            labelWidth: 100,
            monitorValid: false,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<span class="sm-stig-information-title">STIG information</span>',
                    items: [
                        stigField,
                        revisionComboBox
                    ]
                },
                assetFieldSet
            ],
            buttons: [saveBtn],
            stigField,
            revisionComboBox,
            assetSelectionPanel
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.CollectionStigProperties.superclass.initComponent.call(this)

    },
    initPanel: async function ({collectionId, benchmarkId}) {
        try {
            this.el.mask('')
            const promises = [
                this.stigField.store.loadPromise(),
                this.assetSelectionPanel.initPanel({benchmarkId})
            ]
            await Promise.all(promises)
            this.getForm().setValues({benchmarkId})
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
        const height = Ext.getBody().getHeight() - 80
        const width = Math.min(Math.floor(Ext.getBody().getWidth() * 0.75), 1280)
        appwindow = new Ext.Window({
            title: 'STIG Assignments',
            resizable: true,
            cls: 'sm-dialog-window sm-round-panel',
            modal: true,
            hidden: true,
            width,
            height,
            minWidth: 810,
            minHeight: 460,
            maximizable: true,
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
