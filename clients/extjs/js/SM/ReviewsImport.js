Ext.ns('SM.ReviewsImport')

SM.ReviewsImport.Grid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = [
            {
                name: 'filename',
                mapping: 'file.name'
            },
            {
                name: 'fullPath',
                mapping: 'file.fullPath'
            },
            {
                name: 'date',
                mapping: 'file.lastModifiedDate'
            },
            'file',
            'assetId',
            'assetName',
            'ip',
            'noncomputing',
            'metadata',
            'benchmarkId',
            'stigAttached',
            'notchecked',
            'pass',
            'fail',
            'notapplicable',
            'reviews',
            'apiAsset'
        ]
        const totalTextCmp = new Ext.Toolbar.TextItem({
            text: '0 records',
            width: 80
        })
        const store = new Ext.data.GroupingStore({
            grid: this,
            root: '',
            reader: new Ext.data.JsonReader({
                fields: fields,
                idProperty: (v) => `${v.filename}-${v.assetName}-${v.benchmarkId}`
            }),
            sortInfo: {
                field: 'assetName',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store, records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        const columns = [
            {
                header: "Asset",
                width: 100,
                dataIndex: 'assetName',
                sortable: true,
                renderer: (v, m, r) => {
                    if (r.data.assetId) {
                        return v
                    }
                    else {
                        return `${v} (+)`
                    }
                }
            },
            {
                header: "IP",
                width: 100,
                dataIndex: 'ip',
                sortable: true,
                renderer: SM.styledEmptyRenderer
            },
            {
                xtype: 'booleancolumn',
                trueText: '&#x2714;',
                falseText: '',
                header: "Non-computing",
                width: 75,
                dataIndex: 'noncomputing',
                align: "center",
                sortable: true,
                hidden: true
            },
            {
                header: "STIG",
                width: 150,
                dataIndex: 'benchmarkId',
                sortable: true,
                renderer: (v, m, r) => {
                    if (r.data.stigAttached) {
                        return v
                    }
                    else {
                        return `${v} (+)`
                    }
                }
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-na">NR</div></div>',
                width: 50,
                align: 'center',
                dataIndex: 'notchecked',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-na">NA</div></div>',
                width: 50,
                align: 'center',
                dataIndex: 'notapplicable',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-pass">NF</div></div>',
                width: 50,
                align: 'center',
                dataIndex: 'pass',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-fail">O</div></div>',
                width: 50,
                align: 'center',
                dataIndex: 'fail',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: "File",
                width: 150,
                dataIndex: 'filename',
                sortable: true,
                renderer: (v, m, r) => {
                    m.attr = `ext:qtip="${r.data.fullPath}"`
                    return v
                }
            },
            {
                xtype: 'datecolumn',
                format: 'Y-m-d H:i:s',
                header: "Date",
                width: 100,
                dataIndex: 'date',
                sortable: true
            }
        ]
        const config = {
            //title: this.title || 'Parent',
            isFormField: true,
            name: 'imports',
            allowBlank: false,
            layout: 'fit',
            store: store,
            cm: new Ext.grid.ColumnModel({
                columns: columns
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true
            }),
            view: new Ext.grid.GroupingView({
                enableGrouping: true,
                hideGroupedColumn: true,
                forceFit: true,
                emptyText: 'No records to display',
                groupTextTpl: '{text} ({[values.rs.length]} {[values.text.split(":")[0] == "Asset" ? "checklist" : "asset"]}{[values.rs.length > 1 ? "s assigned" : " assigned"]})',
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'tbfill'
                    },
                    {
                        xtype: 'tbseparator'
                    },
                    totalTextCmp
                ]
            }),
            listeners: {
            },
            getValue: function () {
                return true
            },
            setValue: function (v) {
                store.loadData(v)
            },
            validator: function (v) {
                let one = 1
            },
            markInvalid: function () {
                let one = 1
            },
            clearInvalid: function () {
                let one = 1
            },
            isValid: function () {
                return true
            },
            getName: () => this.name,
            validate: function () {
                let one = 1
            },
            newAssetStig: true,
            importReviews: true,
            enableNewAssetStig: (enabled = true) => {
                me.newAssetStig = enabled
                if (enabled) {
                    me.store.clearFilter()
                }
                else {
                    const filter = (record) => record.data.assetId && record.data.stigAttached
                    me.store.filterBy(filter)
                }
            },
            enableImportReviews: (enabled = true) => {
                me.importReviews = enabled
                me.getView().refresh()
            }
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.Grid.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ReviewsFilterCombo = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let me = this
        let config = {
            width: 140,
            forceSelection: true,
            editable: false,
            mode: 'local',
            triggerAction: 'all',
            displayField:'display',
            valueField: 'filter',
            store: new Ext.data.SimpleStore({
                fields: ['display', 'filter'],
                data : [['All results', 'all'],['Updated results only', 'resultchange']]
            })
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ReviewsFilterCombo.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-reviews-filter-combo', SM.ReviewsImport.ReviewsFilterCombo)

SM.ReviewsImport.ReviewsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = Ext.data.Record.create([
            'new',
            {
                name: 'groupId',
                type: 'string',
                mapping: 'current.groupId',
                sortType: sortGroupId
            },
            {
                name: 'ruleId',
                type: 'string',
                mapping: 'new.ruleId',
                sortType: sortRuleId
            },
            {
                name: 'groupTitle',
                mapping: 'current.groupTitle',
                type: 'string'
            },
            {
                name: 'ruleTitle',
                mapping: 'current.ruleTitle',
                type: 'string'
            },
            {
                name: 'severity',
                type: 'string',
                mapping: 'current.severity',
                sortType: sortSeverity
            },
            {
                name: 'result',
                mapping: 'new.result',
                type: 'string'
            },
            {
                name: 'curResult',
                mapping: 'current.result',
                type: 'string'
            },
            {
                name: 'resultComment',
                mapping: 'new.resultComment',
                type: 'string'
            },
            {
                name: 'action',
                mapping: 'new.action',
                type: 'string'
            },
            {
                name: 'actionComment',
                mapping: 'new.actionComment',
                type: 'string'
            },
            {
                name: 'status',
                mapping: 'new.status',
                type: 'string'
            }
        ]);
        const totalTextCmp = new Ext.Toolbar.TextItem({
            text: '0 records',
            width: 80
        })
        const store = new Ext.data.JsonStore({
            grid: this,
            root: '',
            fields: fields,
            idProperty: 'ruleId',
            sortInfo: {
                field: 'ruleId',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store, records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                datachanged: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        const columns = [
              {
                header: "<b>Rule</b>",
                width: 150,
                fixed: true,
                dataIndex: 'ruleId',
                sortable: true,
                renderer: v => `<b>${v}</b>`,
                align: 'left'
              },
              {
                header: "Rule Title",
                width: 220,
                fixed: true,
                dataIndex: 'ruleTitle',
                renderer: columnWrap,
                sortable: false
              },
              {
                header: "Group",
                width: 55,
                dataIndex: 'groupId',
                fixed: true,
                sortable: true,
                align: 'left'
              },
              {
                header: "CAT",
                fixed: true,
                width: 48,
                align: 'center',
                dataIndex: 'severity',
                sortable: true,
                renderer: renderSeverity
              },
              {
                header: 'Current', // per docs
                align: 'center',
                menuDisabled: true,
                width: 64,
                fixed: true,
                dataIndex: 'curResult',
                sortable: true,
                renderer: renderResult
              },
              {
                header: 'New', // per docs
                align: 'center',
                menuDisabled: true,
                width: 64,
                fixed: true,
                dataIndex: 'result',
                sortable: true,
                renderer: renderResult
              },
              {
                header: 'Comment', // per docs
                menuDisabled: true,
                width: 220,
                // fixed: true,
                dataIndex: 'resultComment',
                renderer: columnWrap,
                sortable: false
              },
              {
                header: "Status",
                fixed: true,
                width: 44,
                align: 'center',
                dataIndex: 'status',
                sortable: false,
                renderer: renderStatuses
              }
        ]
        const tbar = new Ext.Toolbar({
			items: [
				{
					xtype: 'tbtext',
                    text: 'Filter:'                    
                },
                ' ',' ',' ',
				{
                    xtype: 'sm-reviews-filter-combo',
                    value: 'all',
                    listeners: {
                        select: function (f, r, i) {
                            me.filterValue = f.getValue()
                            me.fireEvent('filterchanged', me.filterValue)
                        }
                    }
				}
			]
        })
        const onFilterChanged = (filter) => {
            switch (filter) {
                case 'resultchange':
                    store.filterBy( record => record.data.result !== record.data.curResult )
                    break
                default:
                    store.clearFilter()
            }
        }

        let config = {
            layout: 'fit',
            isFormField: true,
            loadMask: true,
            store: store,
            columns: columns,
            view: new Ext.grid.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true
            }),
            listeners: {
            },
            tbar: tbar,
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'tbfill'
                    },{
                        xtype: 'tbseparator'
                    },
                    totalTextCmp
                ]
            }),
            listeners: {
                filterchanged: onFilterChanged
            },

        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ReviewsGrid.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ParseErrorsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = [
            {
                name: 'file'
            },
            {
                name: 'filename',
                mapping: 'file.name'
            },
            {
                name: 'error'
            }
        ]
        const totalTextCmp = new Ext.Toolbar.TextItem({
            text: '0 records',
            width: 80
        })
        const store = new Ext.data.GroupingStore({
            grid: this,
            root: '',
            reader: new Ext.data.JsonReader({
                fields: fields,
                idProperty: 'filename'
            }),
            sortInfo: {
                field: 'filename',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store, records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        const columns = [
            {
                header: "File",
                width: 100,
                dataIndex: 'filename',
                sortable: true
            },
            {
                header: "Error",
                width: 150,
                dataIndex: 'error',
                sortable: true
            }
        ]
        const config = {
            //title: this.title || 'Parent',
            isFormField: true,
            name: 'imports',
            allowBlank: false,
            layout: 'fit',
            store: store,
            cm: new Ext.grid.ColumnModel({
                columns: columns
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true
            }),
            view: new Ext.grid.GridView({
                forceFit: true,
                emptyText: 'No records to display'
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'tbfill'
                    },
                    {
                        xtype: 'tbseparator'
                    },
                    totalTextCmp
                ]
            }),
            listeners: {
            },
            getValue: function () {
                return true
            },
            setValue: function (v) {
                store.loadData(v)
            },
            validator: function (v) {
                let one = 1
            },
            markInvalid: function () {
                let one = 1
            },
            clearInvalid: function () {
                let one = 1
            },
            isValid: function () {
                return true
            },
            getName: () => this.name,
            validate: function () {
                let one = 1
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ParseErrorsGrid.superclass.initComponent.call(this)
    }
})

/**
 * @class SM.ReviewsImport.SelectFilesPanel
 * @extends Ext.Panel
 * Panel class that accepts dropped or selected files
 * @constructor
 * Create a Panel that accepts dropped or selected files
 * @param {Object} config The config object
 * @cfg {Boolean} multifile Support multiple file selections
 * @cfg {Function} onFileSelected Function called on file selection(s)
 * @cfg {Function} onFileDropped Function called on dropped file(s)
 */
SM.ReviewsImport.SelectFilesPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {

        let me = this

        function handleDragover(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            // e.target.style.border = "2px dashed red"
            this.style.border = "2px dashed red"
        }

        function handleDragleave(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            // e.target.style.border = ""
            this.style.border = ""
        }

        let config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20'
            },
            items: [
                {
                    html: `<div class="sm-dialog-panel-title">Select or drop file${me.initialConfig.multifile ? 's' : ''}</div>`,
                    width: 500,
                    border: false
                },
                {
                    html: `<div id="droptarget">Drop ${me.initialConfig.multifile ? 'one or more CKL/XCCDF result files' : 'a CKL or XCCDF result file'} here</div>`,
                    // border: false,
                    baseCls: 'sm-drop',
                    flex: 1,
                    listeners: {
                        render: (panel) => {
                            const panelEl = panel.getEl().dom
                            panelEl.addEventListener('dragenter', handleDragover, false)
                            panelEl.addEventListener('dragover', handleDragover, false)
                            panelEl.addEventListener('dragleave', handleDragleave, false)
                            panelEl.addEventListener('drop', me.onFileDropped, false)
                        }
                    }
                },
                {
                    xtype: 'displayfield',
                    html: "<p>&nbsp;</p>",
                },
                {
                    xtype: 'fileuploadfield',
                    buttonOnly: true,
                    name: 'importFile',
                    accept: '.xml,.ckl',
                    webkitdirectory: false,
                    multiple: me.initialConfig.multifile,
                    style: 'width: 95px;',
                    buttonText: `Select file${me.initialConfig.multifile ? 's' : ''}...`,
                    buttonCfg: {
                        icon: "img/disc_drive.png"
                    },
                    listeners: {
                        fileselected: this.onFileSelected
                    }
                }
            ],
            listeners: {
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.SelectFilesPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ParseErrorsPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        let me = this
        me.errorsGrid = new SM.ReviewsImport.ParseErrorsGrid({
            flex: 1
        })
        me.duplicatesGrid = new SM.ReviewsImport.Grid({
            flex: 1,
            newIndicator: false
        })
        let items = []
        if (me.errors) {
            items.push(
                {
                    html: '<div class="sm-dialog-panel-title">Errors and warnings</div>',
                    width: 500,
                    border: false
                },
                me.errorsGrid
            )
            me.errorsGrid.store.loadData(me.errors)
        }
        if (me.duplicates) {
            items.push(
                {
                    html: '<div class="sm-dialog-panel-title">Duplicates excluded</div>',
                    width: 500,
                    border: false
                },
                me.duplicatesGrid
            )
            me.duplicatesGrid.store.loadData(me.duplicates)
        }
        let config = {
            border: false,
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            items: items,
            buttons: [{
                xtype: 'button',
                text: 'Continue',
                handler: me.continueHandler
            }],
            buttonAlign: 'right'
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ParseErrorsPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ParseErrorPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        let me = this
        const items = [
            {
                html: `<div class="sm-dialog-panel-title">There is a problem with your file</div>`,
                border: false
            },
            {
                html: me.error,
                border: false
            }
        ]

        let config = {
            border: false,
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            items: items,
            buttons: [{
                xtype: 'button',
                text: 'Exit',
                handler: me.exitHandler
            }],
            buttonAlign: 'right'
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ParseErrorPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.OptionsPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        const me = this
        const grid = new SM.ReviewsImport.Grid({
            border: true,
            flex: 1,
            panel: this
        })
        grid.store.loadData(me.gridData)
        const controls = new Ext.Panel({
            region: 'south',
            border: false,
            height: 40,
            layout: 'hbox',
            layoutConfig: {
                align: 'middle',
                defaultMargins: '0 5',
                pack: 'start'
            },
            items: [
                {
                    xtype: 'checkbox',
                    checked: true,
                    boxLabel: 'Create or update Assets and STIG associations',
                    margins: '0 15 -2 0',
                    listeners: {
                        check: function (cb, checked) {
                            grid.enableNewAssetStig(checked)
                        }
                    }
                },
                {
                    xtype: 'checkbox',
                    checked: true,
                    boxLabel: 'Import reviews',
                    margins: '0 0 -2 0',
                    listeners: {
                        check: function (cb, checked) {
                            grid.enableImportReviews(checked)
                        }
                    }
                }
            ]
        })
        const config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            border: false,
            items: [
                {
                    html: '<div class="sm-dialog-panel-title">Choose options</div>',
                    width: 500,
                    border: false
                },
                controls,
                grid
            ],
            buttons: [
                {
                    xtype: 'button',
                    iconCls: 'sm-import-icon',
                    text: 'Add to Collection...',
                    margins: '0 25',
                    grid: grid,
                    handler: async () => {
                        await me.addHandler(grid.store.getRange(), grid.newAssetStig, grid.importReviews)
                    }
                }
            ],
            buttonAlign: 'right',
            grid: grid
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.OptionsPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ReviewsPanel = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        const me = this
        const matchingGrid = new SM.ReviewsImport.ReviewsGrid({
            border: true,
            name: 'reviews',
            flex: 1,
            emptyText: 'No reviews found',
            getValue: function() {},
            setValue: function() {},
            markInvalid: function() {},
            clearInvalid: function() {},
            validate: () => true,
            getName: () => this.name,
            isValid: function () {
                return this.getStore().getCount() > 0
            },
            panel: this
        })
        const currentReviewsArray = me.checklistFromApi.map( i => [i.ruleId, i]) 
        const currentReviews = Object.fromEntries(currentReviewsArray)

        //Create object for SM.ReviewImport.ReviewsGrid
        const matchingData = []
        const unmatchedData = []
        const notCheckedData = []
        for (const review of me.checklistFromFile.reviews) {
            if (currentReviews[review.ruleId]) {
                if (review.result === 'notchecked') {
                    notCheckedData.push(review.ruleId)
                } else {
                    matchingData.push({ new: review, current:  currentReviews[review.ruleId] })
                }
            } else {
                unmatchedData.push(review.ruleId)
            }
        }

        matchingGrid.store.loadData(matchingData)
        const items = [
            {
                html: `<div class="sm-dialog-panel-title">Reviews matched against ${me.benchmarkId} ${me.revisionStr}</div>`,
                // html: `<div class="sm-dialog-panel-title">Reviews matched</div>`,
                // width: 500,
                border: false
            },
            matchingGrid
        ]
        if (notCheckedData.length > 0 || unmatchedData.length > 0) {
            const errorItems = [
                {
                    html: '<div class="sm-dialog-panel-title">Not reviewed</div>',
                    border: false
                },
                new Ext.form.TextArea({
                    border: true,
                    emptyText: 'No unreviewed rules',
                    readOnly: true,
                    value: notCheckedData.join('\n'),
                    margins: '0 20 0 0',
                    flex: 1
                }),
                {
                    html: '<div class="sm-dialog-panel-title">Unmatched rules</div>',
                    border: false
                },
                new Ext.form.TextArea({
                    border: true,
                    emptyText: 'No unmatched rules',
                    readOnly: true,
                    value: unmatchedData.join('\n'),
                    flex: 1
                })
            ]
            items.push( {
                flex: 0.25,
                layout: 'hbox',
                margins: '20 0 0 0',
                layoutConfig: {
                    align: 'stretch',
                    pack: 'start'
                },
                border: false,
                items: errorItems,                
            })
        }



        const config = {
            monitorValid: true,
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            border: false,
            items: items,
            buttons: [
                {
                    formBind: true,
                    iconCls: 'sm-import-icon',
                    text: 'Import matched reviews',
                    margins: '0 25',
                    grid: matchingGrid,
                    handler: async () => {
                        const reviews = matchingGrid.store.getRange().map ( r => r.data.new )
                        await me.importHandler(reviews)
                    }
                }
            ],
            buttonAlign: 'right',
            grid: matchingGrid
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ReviewsPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ImportProgressPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        const me = this
        const pb = new Ext.ProgressBar({
            text: '',
            border: false
        })
        const st = new Ext.form.TextArea({
            cls: 'sm-progress-textarea'
            , readOnly: true
            , flex: 3
            , margins: {
                top: 10
                , bottom: 0
                , left: 0
                , right: 0
            }
        })

        const config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            border: false,
            items: [
                {
                    html: '<div class="sm-dialog-panel-title">Importing data</div>',
                    width: 500,
                    border: false
                },
                pb,
                st
            ],
            buttons: [
                {
                    xtype: 'button',
                    text: 'Done',
                    margins: '0 25',
                    handler: me.doneHandler
                }
            ],
            buttonAlign: 'right',
            pb: pb,
            st: st
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ImportProgressPanel.superclass.initComponent.call(this)
    }
})

async function showImportResultFiles(collectionId, el) {
    try {
        const fp = new SM.ReviewsImport.SelectFilesPanel({
            border: false,
            autoScroll: true,
            multifile: true,
            onFileSelected: onFileSelected,
            onFileDropped: onFileDropped
        })

        const vpSize = Ext.getBody().getViewSize()
        let height = vpSize.height * 0.75
        let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024

        const fpwindow = new Ext.Window({
            title: 'Import results from CKL or XCCDF files',
            modal: true,
            resizable: false,
            // renderTo: el,
            // autoScroll: true,
            width: width,
            height: height,
            layout: 'fit',
            plain: true,
            bodyStyle: 'padding:5px;',
            buttonAlign: 'center',
            items: fp
        })
        fpwindow.show()

        async function onFileDropped(e) {
            e.stopPropagation()
            e.preventDefault()
            this.style.border = ""
            let entries = []
            let files = []
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                entries.push(e.dataTransfer.items[i].webkitGetAsEntry())
            }

            for (const entry of entries) {
                const entryContent = await readEntryContentAsync(entry)
                files.push(...entryContent)
            }
            files.sort((a, b) => a.lastModified - b.lastModified)
            showParseFiles(files)

            function readEntryContentAsync(entry) {
                return new Promise((resolve, reject) => {
                    let reading = 0
                    const files = []
                    readEntry(entry)
                    function readEntry(entry) {
                        if (entry.isFile) {
                            reading++
                            let fullPath = entry.fullPath
                            entry.file(file => {
                                reading--
                                file.fullPath = fullPath
                                files.push(file);
                                if (reading === 0) {
                                    resolve(files);
                                }
                            })
                        } else if (entry.isDirectory) {
                            readReaderContent(entry.createReader())
                        }
                    }
                    function readReaderContent(reader) {
                        reading++
                        reader.readEntries(function (entries) {
                            reading--
                            for (const entry of entries) {
                                readEntry(entry)
                            }
                            if (reading === 0) {
                                resolve(files);
                            }
                        })
                    }
                })
            }
        }

        async function onFileSelected(uploadField) {
            try {
                let input = uploadField.fileInput.dom
                const files = [...input.files]
                // Sort files oldest to newest
                files.sort((a, b) => a.lastModified - b.lastModified)
                showParseFiles(files)
            }
            catch (e) {
                throw e
            }
        }

        async function showParseFiles(files) {
            try {
                const pb = new Ext.ProgressBar({
                    text: '',
                    // margins: '0 30',
                    border: false
                })
                const pbPanel = new Ext.Panel({
                    layout: 'vbox',
                    layoutConfig: {
                        align: 'stretch',
                        pack: 'start',
                        padding: '0 20 20 20'
                    },
                    border: false,
                    items: [
                        {
                            html: '<div class="sm-dialog-panel-title">Parsing your files</div>',
                            width: 500,
                            margins: '0 0',
                            border: false
                        },
                        pb
                    ]
                })

                const task = new Ext.util.DelayedTask(function () {
                    fpwindow.removeAll()
                    fpwindow.add(pbPanel)
                    fpwindow.doLayout()
                })
                task.delay(250)

                const results = await parseFiles(files, pb)
                task.cancel()

                let dupedRows

                // TEMPORARY: keep only the latest member of each duplicate set from parseResults.rows
                // Permananet solution should invoke a UI for duplicate handling
                if (results.hasDuplicates) {
                    let indexes = []
                    for (const i of Object.values(results.pairs)) {
                        if (i.length > 1) {
                            // Don't incude the last item (the latest file timestamp)
                            // Assumes the items of results.rows are sorted by file timestamp ascending
                            indexes.push(i.slice(0, -1))
                        }
                    }
                    // Use a Set because .has is O(1)
                    let indexSet = new Set(indexes.flat())
                    let dedupedRows = results.rows.filter((v, i) => !indexSet.has(i))
                    results.dupedRows = results.rows.filter((v, i) => indexSet.has(i))
                    results.rows = dedupedRows
                }

                if (results.errors.length > 0 || results.hasDuplicates) {
                    showErrors(results)
                } else {
                    showOptions(results)
                }
            }
            catch (e) {
                alert(e)
            }
        }

        async function parseFiles(files, pb) {
            try {
                // Get collection assets for matching
                let apiAssetsResult = Ext.Ajax.requestPromise({
                    url: `${STIGMAN.Env.apiBase}/assets`,
                    params: {
                        collectionId: collectionId,
                        projection: 'stigs'
                    },
                    method: 'GET'
                })

                // Get installed STIGs for matching
                let apiStigsResult = Ext.Ajax.requestPromise({
                    url: `${STIGMAN.Env.apiBase}/stigs`,
                    method: 'GET'
                })

                let filesHandled = 0
                const parseResults = {
                    success: [],
                    fail: []
                }

                // Raw parsing of each file
                for (const file of files) {
                    pb.updateText(file.name)
                    let extension = file.name.substring(file.name.lastIndexOf(".") + 1)
                    let data = await readTextFileAsync(file)
                    if (extension === 'ckl') {
                        try {
                            const r = reviewsFromCkl(data)
                            r.file = file
                            parseResults.success.push(r)
                        }
                        catch (e) {
                            parseResults.fail.push({
                                file: file,
                                error: e.message
                            })
                        }
                    }
                    if (extension === 'xml') {
                        try {
                            const r = reviewsFromScc(data)
                            r.file = file
                            parseResults.success.push(r)
                        }
                        catch (e) {
                            parseResults.fail.push({
                                file: file,
                                error: e.message
                            })
                        }
                    }
                    filesHandled++
                    pb.updateProgress(filesHandled / files.length)
                }

                apiAssetsResult = await apiAssetsResult
                const apiAssets = JSON.parse(apiAssetsResult.response.responseText)

                apiStigsResult = await apiStigsResult
                const apiStigs = JSON.parse(apiStigsResult.response.responseText)
                const apiBenchmarkIds = new Set(apiStigs.map(stig => stig.benchmarkId))

                // Transform into data for SM.ReviewsImport.Grid
                const gridData = {
                    rows: [],
                    errors: parseResults.fail
                }
                for (const parseResult of parseResults.success) {
                    // Try to find this asset by name
                    let apiAsset = apiAssets.find(apiAsset => apiAsset.name.toUpperCase() === parseResult.target.name.toUpperCase())
                    let assetId, name, assetBenchmarkIds = []
                    if (apiAsset) {
                        assetId = apiAsset.assetId
                        name = apiAsset.name
                        assetBenchmarkIds = apiAsset.stigs.map(stig => stig.benchmarkId)
                    }
                    for (const checklist of parseResult.checklists) {
                        if (apiBenchmarkIds.has(checklist.benchmarkId)) {
                            // Try to find this STIG by benchmarkId
                            let stigAttached = false
                            if (assetBenchmarkIds.length > 0) {
                                stigAttached = assetBenchmarkIds.includes(checklist.benchmarkId)
                            }
                            const data = {
                                file: parseResult.file,
                                assetId: assetId,
                                assetName: name || parseResult.target.name,
                                apiAsset: apiAsset,
                                ip: parseResult.target.ip,
                                noncomputing: parseResult.target.noncomputing,
                                metadata: parseResult.target.metadata,
                                benchmarkId: checklist.benchmarkId,
                                stigAttached: stigAttached,
                                pass: checklist.stats.pass,
                                fail: checklist.stats.fail,
                                notchecked: checklist.stats.notchecked,
                                notapplicable: checklist.stats.notapplicable,
                                reviews: checklist.reviews
                            }
                            gridData.rows.push(data)
                        }
                        else {
                            gridData.errors.push({
                                file: parseResult.file,
                                error: `Ignoring ${checklist.benchmarkId}, which is not installed`
                            })
                        }
                    }
                }
                let assetStigPairs = gridData.rows.reduce((a, v, i) => {
                    const key = `${v.assetName.toUpperCase()}-${v.benchmarkId}`
                    if (a[key]) {
                        a[key].push(i)
                    }
                    else {
                        a[key] = [i]
                    }
                    return a
                }, {})
                gridData.hasDuplicates = Object.keys(assetStigPairs).some(key => assetStigPairs[key].length > 1)
                gridData.pairs = assetStigPairs
                return gridData
            }
            catch (e) {
                throw (e)
            }
        }

        function showErrors(results) {
            let pePanel = new SM.ReviewsImport.ParseErrorsPanel({
                errors: results.errors.length > 0 ? results.errors : null,
                duplicates: results.hasDuplicates ? results.dupedRows : null,
                continueHandler: onContinue,
                backHandler: onBack
            })
            fpwindow.removeAll()
            fpwindow.setAutoScroll(true)
            fpwindow.add(pePanel)
            fpwindow.doLayout()

            function onContinue() {
                showOptions(results)
            }

            function onBack() {

            }
        }

        function showOptions(results) {
            let optionsPanel = new SM.ReviewsImport.OptionsPanel({
                gridData: results.rows,
                addHandler: showImportProgress
            })
            fpwindow.removeAll()
            fpwindow.add(optionsPanel)
            fpwindow.doLayout()
        }

        async function showImportProgress(records, modifyAssets, importReviews) {
            let statusText = ''
            let progressPanel
            try {
                progressPanel = new SM.ReviewsImport.ImportProgressPanel({
                    doneHandler: () => {
                        fpwindow.close()
                    }
                })
                fpwindow.removeAll()
                fpwindow.add(progressPanel)
                fpwindow.doLayout()

                let assets = recordsToAssets(records)
                let entries = Object.entries(assets)
                let processedCount = 0
                for (const [name, assetObj] of entries) {
                    try {
                        let apiAsset
                        updateProgress(processedCount / entries.length, assetObj.name)
                        if (modifyAssets) {
                            apiAsset = await importAsset(collectionId, assetObj)
                            assetObj.assetId = apiAsset.assetId
                            // updateStatusText(JSON.stringify(apiAsset, null, 2))
                            updateStatusText(` OK (${assetObj.name}, id: ${apiAsset.assetId})`)
                        }
                        if (importReviews) {
                            for (let reviewArray of assetObj.reviews) {
                                // Remove 'notchecked' reviews
                                reviewArray = reviewArray.filter( review => review.result !== 'notchecked')
                                let apiReviews = await importReviewArray(collectionId, assetObj.assetId, reviewArray)
                                // updateStatusText(JSON.stringify(apiReviews, null, 2))
                                updateStatusText(' OK')
                            }
                            // Get the updated apiAsset
                            const result = await Ext.Ajax.requestPromise({
                                url: `${STIGMAN.Env.apiBase}/assets/${assetObj.assetId}`,
                                method: 'GET',
                                params: {
                                    projection: ['stigs', 'adminStats']
                                },
                                headers: { 'Content-Type': 'application/json;charset=utf-8' }
                            })
                            apiAsset = JSON.parse(result.response.responseText)
                            SM.Dispatcher.fireEvent('assetchanged', apiAsset)  
                        }
                    }
                    catch (e) {
                        updateStatusText(` ERROR (${e.message})`)
                    }
                    finally {
                        processedCount++
                        updateProgress(processedCount / entries.length, assetObj.name)
                    }
                }
                updateProgress(0, 'Finished')
            }
            catch (e) {
                alert(e.message)
            }

            function updateProgress(value, text) {
                progressPanel.pb.updateProgress(value, Ext.util.Format.htmlEncode(text));
            }

            function updateStatusText(text, noNL, replace) {
                var noNL = noNL || false
                if (noNL) {
                    statusText += text
                } else {
                    statusText += text + "\n"
                }
                progressPanel.st.setRawValue(statusText)
                progressPanel.st.getEl().dom.scrollTop = 99999; // scroll to bottom
            }

            function recordsToAssets(records) {
                let data = records.map(r => r.data)
                data.sort((a, b) => a.file.lastModified - b.file.lastModified) // ascending date
                let assets = {}
                for (const r of data) {
                    if (!assets[r.assetName]) {
                        if (r.apiAsset) {
                            assets[r.assetName] = {
                                assetId: r.apiAsset.assetId,
                                name: r.assetName,
                                description: r.apiAsset.description || '',
                                ip: r.apiAsset.ip,
                                noncomputing: r.apiAsset.noncomputing,
                                metadata: r.apiAsset.metadata,
                                stigs: r.apiAsset.stigs.map(s => s.benchmarkId),
                                reviews: []
                            }
                        }
                        else {
                            assets[r.assetName] = {
                                assetId: null,
                                name: r.assetName,
                                description: '',
                                ip: null,
                                noncomputing: null,
                                metadata: null,
                                stigs: [],
                                reviews: []
                            }
                        }
                    }
                    if (r.ip) { assets[r.assetName].ip = r.ip }
                    assets[r.assetName].noncomputing = r.noncomputing
                    assets[r.assetName].metadata = { ...assets[r.assetName].metadata, ...r.metadata }
                    if (!r.stigAttached) { assets[r.assetName].stigs.push(r.benchmarkId) }
                    if (r.reviews.length) { assets[r.assetName].reviews.push(r.reviews) }
                }
                return assets
            }

            async function importAsset(collectionId, assetObj) {
                try {
                    const { reviews, ...assetData } = assetObj
                    const { assetId, ...values } = assetData
                    values.collectionId = collectionId
                    let url, method
                    if (assetId) {
                        url = `${STIGMAN.Env.apiBase}/assets/${assetId}`
                        method = 'PUT'
                    }
                    else {
                        url = `${STIGMAN.Env.apiBase}/assets`
                        method = 'POST'
                    }
                    updateStatusText(`${method} ${values.name}`, true)

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
                    let event = method === 'POST' ? 'assetcreated' : 'assetchanged'
                    SM.Dispatcher.fireEvent(event, apiAsset)

                    return apiAsset
                }
                finally{}
            }

            async function importReviewArray(collectionId, assetId, reviewArray) {
                try {
                    let url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews/${assetId}`
                    updateStatusText(`POST reviews for assetId ${assetId}`, true)
                    let result = await Ext.Ajax.requestPromise({
                        url: url,
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: reviewArray
                    })
                    const apiReviews = JSON.parse(result.response.responseText)
                    return apiReviews
                }
               finally {}
            }
        }
    }
    catch (e) {
        if (typeof e === 'object') {
            if (e instanceof Error) {
                e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
            }
            else {
                e = JSON.stringify(e)
            }
        }
        alert(e)
        Ext.getBody().unmask()
    }
}

async function showImportResultFile(params) {
    let fpWindow
    try {
        const fp = new SM.ReviewsImport.SelectFilesPanel({
            border: false,
            autoScroll: true,
            multifile: false,
            onFileSelected: onFileSelected,
            onFileDropped: onFileDropped
        })

        const vpSize = Ext.getBody().getViewSize()
        let height = vpSize.height * 0.75
        let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024

        fpwindow = new Ext.Window({
            title: `Import results (${params.benchmarkId} on ${params.assetName})`,
            modal: true,
            resizable: false,
            // renderTo: el,
            // autoScroll: true,
            width: width,
            height: height,
            layout: 'fit',
            plain: true,
            bodyStyle: 'padding:5px;',
            buttonAlign: 'center',
            items: fp
        })

        fpwindow.show()
    }
    catch (e) {
        if (typeof e === 'object') {
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
    async function onFileDropped(e) {
        e.stopPropagation()
        e.preventDefault()
        this.style.border = ""
        let entries = []
        let files = []
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
            entries.push(e.dataTransfer.items[i].webkitGetAsEntry())
        }

        for (const entry of entries) {
            const entryContent = await readEntryContentAsync(entry)
            files.push(...entryContent)
        }
        showParseFile(files[0])

        function readEntryContentAsync(entry) {
            return new Promise((resolve, reject) => {
                let reading = 0
                const files = []
                readEntry(entry)
                function readEntry(entry) {
                    if (entry.isFile) {
                        reading++
                        let fullPath = entry.fullPath
                        entry.file(file => {
                            reading--
                            file.fullPath = fullPath
                            files.push(file);
                            if (reading === 0) {
                                resolve(files);
                            }
                        })
                    } else if (entry.isDirectory) {
                        readReaderContent(entry.createReader())
                    }
                }
                function readReaderContent(reader) {
                    reading++
                    reader.readEntries(function (entries) {
                        reading--
                        for (const entry of entries) {
                            readEntry(entry)
                        }
                        if (reading === 0) {
                            resolve(files);
                        }
                    })
                }
            })
        }
    }

    async function onFileSelected(uploadField) {
        try {
            let input = uploadField.fileInput.dom
            const files = [...input.files]
            showParseFile(files[0])
        }
        catch (e) {
            throw e
        }
    }

    async function showParseFile(file) {
        let task
        try {
            const pb = new Ext.ProgressBar({
                text: file.name,
                // margins: '0 30',
                border: false
            })
            const pbPanel = new Ext.Panel({
                layout: 'vbox',
                layoutConfig: {
                    align: 'stretch',
                    pack: 'start',
                    padding: '0 20 20 20'
                },
                border: false,
                items: [
                    {
                        html: '<div class="sm-dialog-panel-title">Parsing your file</div>',
                        width: 500,
                        margins: '0 0',
                        border: false
                    },
                    pb
                ]
            })

            task = new Ext.util.DelayedTask(function () {
                fpwindow.removeAll()
                fpwindow.add(pbPanel)
                fpwindow.doLayout()
            })
            task.delay(250)

            const r = await parseFile(file, pb)

            const assetMatches = r.target.name === params.assetName
            if (!assetMatches) {
                throw (new Error(`The file does not include reviews for asset: <b>${params.assetName}</b><br>The file includes reviews for: ${r.target.name}</p>`))
            }
            const checklistFromFile = r.checklists.filter(checklist => checklist.benchmarkId === params.benchmarkId)[0]
            if (!checklistFromFile) {
                throw (new Error(`The file does not include reviews for STIG: <b>${params.benchmarkId}</b><br>The file includes reviews for: ${r.checklists[0].benchmarkId}</p>`))
            }
            // Note: Only the CKL parser returns the revisionStr property
            if (checklistFromFile.revisionStr && checklistFromFile.revisionStr !== params.revisionStr) {
                throw (new Error(`The file does not include reviews for STIG: <b>${params.benchmarkId}, revision ${params.revisionStr}</b><br>The file includes reviews for revision: ${checklistFromFile.revisionStr}</p>`))
            }
            const apiResult = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/assets/${params.assetId}/checklists/${params.benchmarkId}/${params.revisionStr}`,
                method: 'GET'
            })
            const checklistFromApi = JSON.parse(apiResult.response.responseText)
            task.cancel()
            showReviews(checklistFromFile, checklistFromApi, params.benchmarkId, params.revisionStr)
        }
        catch (e) {
            task.cancel()
            showError(e)
        }
    }

    async function parseFile(file, pb) {
        try {
            let extension = file.name.substring(file.name.lastIndexOf(".") + 1)
            let data = await readTextFileAsync(file)
            let r
            if (extension === 'ckl') {
                r = reviewsFromCkl(data)
            }
            if (extension === 'xml') {
                r = reviewsFromScc(data)
            }
            r.file = file
            return r
        }
        catch (e) {
            throw (e)
        }
    }

    function showError(e) {
        let pePanel = new SM.ReviewsImport.ParseErrorPanel({
            error: e.message,
            exitHandler: onExit,
        })
        fpwindow.removeAll()
        fpwindow.setAutoScroll(true)
        fpwindow.add(pePanel)
        fpwindow.doLayout()

        function onExit() {
            fpwindow.close()
        }
    }

    function showReviews(checklistFromFile, checklistFromApi, benchmarkId, revisionStr) {
        let reviewsPanel = new SM.ReviewsImport.ReviewsPanel({
            checklistFromFile: checklistFromFile,
            checklistFromApi: checklistFromApi,
            benchmarkId: benchmarkId,
            revisionStr: revisionStr,
            importHandler: showImportProgress
        })
        fpwindow.removeAll()
        fpwindow.add(reviewsPanel)
        fpwindow.doLayout()


    }

    async function showImportProgress(reviews) {
        let statusText = ''
        let progressPanel
        try {
            progressPanel = new SM.ReviewsImport.ImportProgressPanel({
                doneHandler: () => {
                    fpwindow.close()
                }
            })
            fpwindow.removeAll()
            fpwindow.add(progressPanel)
            fpwindow.doLayout()

            updateProgress('Importing...')
            let apiReviews = await importReviewArray(reviews)
            updateStatusText(JSON.stringify(apiReviews, null, 2))
            updateStatusText(' OK')
            updateProgress(0, 'Finished')
            params.store.reload()
        }
        catch (e) {
            alert(e.message)
        }

        function updateProgress(value, text) {
            progressPanel.pb.updateProgress(value, Ext.util.Format.htmlEncode(text));
        }

        function updateStatusText(text, noNL, replace) {
            var noNL = noNL || false
            if (noNL) {
                statusText += text
            } else {
                statusText += text + "\n"
            }
            progressPanel.st.setRawValue(statusText)
            progressPanel.st.getEl().dom.scrollTop = 99999; // scroll to bottom
        }

        async function importReviewArray(reviewArray) {
            try {
                let url = `${STIGMAN.Env.apiBase}/collections/${params.collectionId}/reviews/${params.assetId}`
                updateStatusText(`POST reviews for assetId ${params.assetId}`, true)
                let result = await Ext.Ajax.requestPromise({
                    url: url,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json;charset=utf-8' },
                    jsonData: reviewArray
                })
                apiReviews = JSON.parse(result.response.responseText)
                return apiReviews
            }
            catch (e) {
                throw (e)
            }
        }

    }
}
