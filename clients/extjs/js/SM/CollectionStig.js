'use strict'

Ext.ns('SM')

SM.CollectionStigsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        let me = this
        const id = Ext.id()
        let fieldsConstructor = Ext.data.Record.create([
            {name: 'benchmarkId', type: 'string'},
            {name: 'title', type: 'string'},
            {name: 'lastRevisionStr', type: 'string'},
            {name: 'lastRevisionDate', type: 'string'},
            {name: 'ruleCount', type: 'integer'},
            {name: 'assetCount', type: 'integer'},
            {
                name: 'checkCount',
                type: 'integer',
                convert: (v, r) => r.ruleCount * r.assetCount
            },
            {
                name: 'acceptedPct',
                type: 'integer',
                convert: (v, r) => Math.round((r.acceptedCount/(r.ruleCount * r.assetCount)) * 100)
            },
            {
                name: 'submittedPct',
                type: 'integer',
                convert: (v, r) => Math.round(((r.acceptedCount + r.submittedCount)/(r.ruleCount * r.assetCount)) * 100)
            },
            {
                name: 'savedPct',
                type: 'integer',
                convert: (v, r) => Math.round(((r.acceptedCount + r.submittedCount + r.savedCount)/(r.ruleCount * r.assetCount)) * 100)
            }

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
            smMaskDelay: 250,
            proxy: this.proxy,
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
			// },{ 	
			// 	header: "Title",
			// 	width: 150,
            //     dataIndex: 'title',
			// 	sortable: true
			},{ 	
				header: "Revision",
				width: 50,
                dataIndex: 'lastRevisionStr',
                align: "center",
                sortable: true
			},{ 	
				header: "Date",
				width: 50,
				dataIndex: 'lastRevisionDate',
                align: "center",
				sortable: true
			},{
                header: 'Rules',
                width: 70,
                fixed: true,
                dataIndex: 'ruleCount',
                align: "center",
                sortable: true
            },{
                header: 'Assets',
                width: 70,
                fixed: true,
                dataIndex: 'assetCount',
                align: "center",
                sortable: true
            },{
                header: 'Checks',
                width: 70,
                fixed: true,
                dataIndex: 'checkCount',
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
            store: stigStore,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    selectionchange: function (sm) {
                        Ext.getCmp(`stigGrid-${id}-modifyBtn`).setDisabled(!sm.hasSelection());
                        Ext.getCmp(`stigGrid-${id}-deleteBtn`).setDisabled(!sm.hasSelection());
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
                        showCollectionStigProps( r.get('benchmarkId'), grid );
                    }
                }
            },
            tbar: new Ext.Toolbar({
                items: [
                    {
                        iconCls: 'icon-add',
                        text: 'Assign STIG...',
                        grid: me,
                        handler: function(btn) {
                            showCollectionStigProps( null, btn.grid );            
                        }
                    }
                    ,'-'
                    ,{
                        iconCls: 'sm-export-icon',
                        id: `stigGrid-${id}-exportBtn`,
                        text: 'Export CKLs...',
                        disabled: false,
                        handler: function() {
                            showExportCklFiles( me.collectionId, me.collectionName, 'stig' );            
                        }
                    }
                    ,'-'
                    , {
                        ref: '../removeBtn',
                        iconCls: 'icon-del',
                        id: `stigGrid-${id}-deleteBtn`,
                        text: 'Unassign STIG',
                        disabled: true,
                        handler: function() {
                            try {
                                var confirmStr="Removing this STIG will remove all related Asset assignments. If the STIG is added in the future, the assignments will need to be established again.";
                                Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
                                    if (btn == 'yes') {
                                        let stigRecord = me.getSelectionModel().getSelected()
                                        let result = await Ext.Ajax.requestPromise({
                                            url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/stigs/${stigRecord.data.benchmarkId}/assets`,
                                            method: 'PUT',
                                            jsonData: []
                                        })
                                        me.store.remove(stigRecord)
                                        SM.Dispatcher.fireEvent('stigassetschanged', me.collectionId, stigRecord.data.benchmarkId, [] )
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
                        id: `stigGrid-${id}-modifyBtn`,
                        text: 'Change STIG targets...',
                        handler: function() {
                            var r = me.getSelectionModel().getSelected();
                            showCollectionStigProps(r.get('benchmarkId'), me);
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
                        gridBasename: 'STIGs (grid)',
                        storeBasename: 'STIGs (store)',
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
            // header: '',
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
                        iconCls: 'sm-export-icon',
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
                return JSON.parse(encodeSm(sm,'assetId'))
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
            isValid: () => {
                return this.getSelectionModel().getCount() > 0
            },
            getName: () => this.name,
            validate: () => true
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.StigAssetsGrid.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-stig-assets-grid', SM.StigAssetsGrid)

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
        let stigField
        if (this.benchmarkId) {
            stigField = new Ext.form.TextField({
                fieldLabel: 'BenchmarkId',
                allowBlank: true,
                // width: 350,
                anchor: '100%',
                readOnly: true,
                name: 'benchmarkId',
                value: this.benchmarkId
            })
        }
        else {
            stigField = new SM.StigSelectionField({
                name: 'benchmarkId',
                submitValue: false,
                fieldLabel: 'BenchmarkId',
                hideTrigger: false,
                anchor: '100%',
                // width: 350,
                autoLoad: true,
                allowBlank: false,
                filteringStore: this.stigFilteringStore
            })
        }
 
        let config = {
            baseCls: 'x-plain',
            // height: 400,
            labelWidth: 80,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<b>STIG information</b>',
                    items: [
                        stigField
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '<b>Asset Assignments</b>',
                    anchor: "100% -70",
                    layout: 'fit',
                    items: [
                        this.stigAssetsGrid
                    ]
                }

            ],
            buttons: [{
                text: this.btnText || 'Save',
                collectionId: me.collectionId,
                formBind: true,
                handler: this.btnHandler || function () {}
            }]
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.CollectionStigProperties.superclass.initComponent.call(this)

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

async function showCollectionStigProps( benchmarkId, parentGrid ) {
    try {
        let collectionId = parentGrid.collectionId
        let stigPropsFormPanel = new SM.CollectionStigProperties({
            collectionId: collectionId,
            benchmarkId: benchmarkId,
            stigFilteringStore: parentGrid.store,
            btnHandler: async function( btn ){
                try {
                    if (stigPropsFormPanel.getForm().isValid()) {
                        let values = stigPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${btn.collectionId}/stigs/${values.benchmarkId}/assets`,
                            method: 'PUT',
                            params: {
                                elevate: curUser.privileges.canAdmin
                            },
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            jsonData: values.assets
                        })
                        const apiStigAssets = JSON.parse(result.response.responseText)
                        parentGrid.getStore().reload()
                        SM.Dispatcher.fireEvent('stigassetschanged', btn.collectionId, values.benchmarkId, apiStigAssets)
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
            title: 'STIG Targets, Collection ID ' + collectionId,
            modal: true,
            hidden: true,
            width: 510,
            height:660,
            layout: 'fit',
            plain:true,
            bodyStyle:'padding:5px;',
            buttonAlign:'right',
            items: stigPropsFormPanel
        });
        
        appwindow.render(document.body)
        await stigPropsFormPanel.initPanel() // Load asset grid store

        let apiStigAssets
        if (benchmarkId) {
            let result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
                params: {
                    elevate: curUser.privileges.canAdmin
                },
                method: 'GET'
            })
            apiStigAssets = JSON.parse(result.response.responseText)            
        }
        else {
            apiStigAssets = []
        }

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
