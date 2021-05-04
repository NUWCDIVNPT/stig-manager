Ext.ns('SM.ReviewsImport')

SM.ReviewsImport.Grid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = [
            {
                name: 'filename',
                mapping: 'checklist.file.name'
            },
            {
                name: 'fullPath',
                mapping: 'checklist.file.fullPath'
            },
            {
                name: 'date',
                mapping: 'checklist.file.lastModifiedDate'
            },
            {
                name: 'file',
                mapping: 'checklist.file'
            },
            {
                name: 'assetId',
                mapping: 'taskAsset.assetProps.assetId'
            },
            {
                name: 'assetName',
                mapping: 'taskAsset.assetProps.name'
            },
            {
                name: 'ip',
                mapping: 'taskAsset.assetProps.ip'
            },
            {
                name: 'noncomputing',
                mapping: 'taskAsset.assetProps.noncomputing'
            },
            {
                name: 'metadata',
                mapping: 'taskAsset.assetProps.metadata'
            },
            {
                name: 'benchmarkId',
                mapping: 'checklist.benchmarkId'
            },
            {
                name: 'newAssignment',
                mapping: 'checklist.newAssignment'
            },
            {
                name: 'notchecked',
                mapping: 'checklist.stats.notchecked'
            },
            {
                name: 'pass',
                mapping: 'checklist.stats.pass'
            },
            {
                name: 'fail',
                mapping: 'checklist.stats.fail'
            },
            {
                name: 'notapplicable',
                mapping: 'checklist.stats.notapplicable'
            },
            {
                name: 'reviews',
                mapping: 'checklist.reviews'
            },
            'taskAsset',
            'checklist'
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
                // idProperty: (v) => `${v.filename}-${v.assetName}-${v.benchmarkId}`
                idProperty: (v) => `${v.checklist.file.name}-${v.taskAsset.assetProps.name}-${v.checklist.benchmarkId}`
            }),
            sortInfo: {
                field: 'assetName',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store) {
                    totalTextCmp.setText(store.getCount() + ' records')
                },
                datachanged: function (store) {
                    totalTextCmp.setText(store.getCount() + ' records')
                },
                remove: function (store) {
                    totalTextCmp.setText(store.getCount() + ' records')
                }
            }
        })
        const columns = [
            {
                header: "Asset",
                width: 150,
                dataIndex: 'assetName',
                sortable: true,
                renderer: (v, m, r) => {
                    if (r.data.assetId) {
                        return v
                    }
                    else {
                        return `(+) ${v}`
                    }
                }
            },
            {
                header: "IP",
                hidden: true,
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
                    if (r.data.newAssignment) {
                        return `(+) ${v}`
                    }
                    else {
                        return v
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
            createObjects: true,
            importReviews: true,
            enableCreateObjects: (enabled = true) => {
                me.createObjects = enabled
                if (enabled) {
                    me.store.clearFilter()
                }
                else {
                    const filter = (record) => record.data.assetId && !record.data.newAssignment
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
            displayField: 'display',
            valueField: 'filter',
            store: new Ext.data.SimpleStore({
                fields: ['display', 'filter'],
                data: [['All results', 'all'], ['Updated results only', 'resultchange']]
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
        ])
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
                    totalTextCmp.setText(records.length + ' records')
                },
                datachanged: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records')
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
                ' ', ' ', ' ',
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
                    store.filterBy(record => record.data.result !== record.data.curResult)
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
                forceFit: true
            }),
            listeners: {
            },
            tbar: tbar,
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'tbfill'
                    }, {
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
                    totalTextCmp.setText(records.length + ' records')
                },
                remove: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records')
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

SM.ReviewsImport.WarningPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        const me = this
        let config = {
            border: false,
            layout: 'vbox',
            layoutConfig: {
                // align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            items: [
                {
                    html: `<div class="sm-dialog-panel-title">${me.contentTitle}</div>`,
                    border: false
                },
                {
                    html: `<div class="sm-dialog-panel-content">${me.contentText}</div>`,
                    width: 500,
                    border: false,
                }
            ],
            buttons: [{
                xtype: 'button',
                text: 'Continue',
                handler: me.continueHandler
            }],
            buttonAlign: 'right'
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.WarningPanel.superclass.initComponent.call(this)
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
                width: 500,
                border: false
            }
        ]

        let config = {
            border: false,
            layout: 'vbox',
            layoutConfig: {
                // align: 'stretch',
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
                            grid.enableCreateObjects(checked)
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
                        await me.addHandler(me.taskAssets, grid.createObjects, grid.importReviews)
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
            getValue: function () { },
            setValue: function () { },
            markInvalid: function () { },
            clearInvalid: function () { },
            validate: () => true,
            getName: () => this.name,
            isValid: function () {
                return this.getStore().getCount() > 0
            },
            panel: this
        })
        const currentReviewsArray = me.checklistFromApi.map(i => [i.ruleId, i])
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
                    matchingData.push({ new: review, current: currentReviews[review.ruleId] })
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
            items.push({
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
                        const reviews = matchingGrid.store.getRange().map(r => r.data.new)
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

class TaskObject {
    constructor({ apiAssets = [], apiStigs = [], parsedResults = [], collectionId }) {
        // An array of results from the parsers
        this.parsedResults = parsedResults
        this.collectionId = collectionId
        // An array of assets from the API
        this.apiAssets = apiAssets
        // Create Maps of the assets by assetName and metadata.cklHostName
        this.mappedAssetNames = new Map()
        this.mappedCklHostnames = new Map()
        for (const apiAsset of apiAssets) {
            // Update .stigs to an array of benchmarkId strings
            apiAsset.stigs = apiAsset.stigs.map(stig => stig.benchmarkId)
            this.mappedAssetNames.set(apiAsset.name.toLowerCase(), apiAsset)
            if (apiAsset.metadata?.cklHostName) {
                const v = this.mappedCklHostnames.get(apiAsset.metadata.cklHostName.toLowerCase())
                if (v) {
                    v.push(apiAsset)
                }
                else {
                    this.mappedCklHostnames.set(apiAsset.metadata.cklHostName.toLowerCase(), [apiAsset])
                }
            }
        }

        // A Map() of the installed benchmarkIds return by the API
        // key: benchmarkId, value: array of revisionStr
        this.mappedStigs = new Map()
        for (const apiStig of apiStigs) {
            this.mappedStigs.set(apiStig.benchmarkId, apiStig.revisionStrs)
        }

        // An array of accumulated errors
        this.errors = []

        // A Map() of assets to be processed by the writer
        this.taskAssets = this._createTaskAssets()
    }

    _findAssetFromParsedTarget(target) {
        if (!target.metadata.cklHostName) {
            return this.mappedAssetNames.get(target.name.toLowerCase())
        }
        const matchedByCklHostname = this.mappedCklHostnames.get(target.metadata.cklHostName.toLowerCase())
        if (!matchedByCklHostname) return null
        const matchedByAllCklMetadata = matchedByCklHostname.find(
            asset => asset.metadata.cklWebDbInstance === target.metadata.cklWebDbInstance
                && asset.metadata.cklWebDbSite === target.metadata.cklWebDbSite)
        if (!matchedByAllCklMetadata) return null
        return matchedByAllCklMetadata
    }

    _createTaskAssets() {
        // taskAssets is a Map() keyed by mapKey, the values are
        // {
        //   newAsset: false, // does the asset need to be created?
        //   assetProps: parseResult.target, // asset properties from the parsed results
        //   hasNewBenchmarkIds: false, //  are there new STIG assignments?
        //   stigsIgnored: [], // benchmarkIds ignored because no updates allowed
        //   reviews: [] // the reviews to be posted
        // }

        const taskAssets = new Map()
        for (const parsedResult of this.parsedResults) {
            // Generate mapping key
            let mapKey, tMeta = parsedResult.target.metadata
            if (!tMeta.cklHostName) {
                mapKey = parsedResult.target.name.toLowerCase()
            }
            else {
                const appends = [tMeta.cklHostName]
                appends.push(tMeta.cklWebDbSite ?? 'NA')
                appends.push(tMeta.cklWebDbInstance ?? 'NA')
                mapKey = appends.join('-')
            }

            // Try to find the asset in the API response
            const apiAsset = this._findAssetFromParsedTarget(parsedResult.target)
            if (!apiAsset && ! true) {
                // Bail if the asset doesn't exist and we won't create it
                this.errors.push({
                    file: parsedResult.file,
                    message: `asset does not exist for target`,
                    target: parsedResult.target
                })
                continue
            }
            // Try to find the target in our Map()
            let taskAsset = taskAssets.get(mapKey)

            if (!taskAsset) {
                // This is our first encounter with this assetName, initialize Map() value
                taskAsset = {
                    knownAsset: false,
                    assetProps: null, // an object suitable for put/post to the API 
                    hasNewAssignment: false,
                    newAssignments: [],
                    checklists: [], // the vetted result checklists
                    checklistsIgnored: [], // the ignored checklists
                    reviews: [] // the vetted reviews
                }
                if (!apiAsset) {
                    // The asset does not exist in the API. Set assetProps from this parseResult.
                    if (!tMeta.cklHostName) {
                        taskAsset.assetProps = { ...parsedResult.target, collectionId: this.collectionId, stigs: [] }
                    }
                    else {
                        taskAsset.assetProps = { ...parsedResult.target, name: mapKey, collectionId: this.collectionId, stigs: [] }
                    }
                }
                else {
                    // The asset exists in the API. Set assetProps from the apiAsset.
                    taskAsset.knownAsset = true
                    taskAsset.assetProps = { ...apiAsset, collectionId: this.collectionId }
                }
                // Insert the asset into taskAssets
                taskAssets.set(mapKey, taskAsset)
            }

            // Helper functions
            const stigIsInstalled = ({ benchmarkId, revisionStr }) => {
                const revisionStrs = this.mappedStigs.get(benchmarkId)
                if (revisionStrs) {
                    if (revisionStr) return revisionStrs.includes(revisionStr)
                    return true
                }
                else {
                    return false
                }
            }
            const stigIsAssigned = ({ benchmarkId }) => {
                return taskAsset.assetProps.stigs.includes(benchmarkId)
            }
            const assignStig = (benchmarkId) => {
                if (!stigIsAssigned(benchmarkId)) {
                    taskAsset.hasNewAssignment = true
                    taskAsset.newAssignments.push(benchmarkId)
                    taskAsset.assetProps.stigs.push(benchmarkId)
                }
            }
            const stigIsNewlyAssigned = (benchmarkId) => taskAsset.newAssignments.includes(benchmarkId)

            // Vet the checklists in this parseResult 
            for (const checklist of parsedResult.checklists) {
                checklist.file = parsedResult.file
                if (stigIsInstalled(checklist)) {
                    if (stigIsAssigned(checklist)) {
                        checklist.newAssignment = stigIsNewlyAssigned(checklist.benchmarkId)
                        taskAsset.checklists.push(checklist)
                    }
                    else if (true) {
                        assignStig(checklist.benchmarkId)
                        checklist.newAssignment = true
                        taskAsset.checklists.push(checklist)
                    }
                    else {
                        checklist.ignored = `STIG is not assigned`
                        taskAsset.checklistsIgnored.push(checklist)
                    }
                }
                else {
                    checklist.ignored = `STIG is not installed`
                    taskAsset.checklistsIgnored.push(checklist)
                }
            }

        }
        return taskAssets
    }
}

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
            try {
                e.currentTarget.innerText = `Searching for result files...`
                e.stopPropagation()
                e.preventDefault()
                this.style.border = ""
                let entries = []
                let files = []
                if (!e.dataTransfer) {
                    throw ('Event is missing the dataTransfer property')
                }
                entries = await getAllFileEntries(e.dataTransfer.items, e.currentTarget)
                for (const entry of entries) {
                    files.push(await entryFilePromise(entry))
                }
                files.sort((a, b) => a.lastModified - b.lastModified)
                warnOnExcessFiles(files)    
            }
            catch (e) {
                alert(e)
            }

            async function getAllFileEntries(dataTransferItemList, el) {
                try {
                    let searched = 0, found = 0
                    let fileEntries = []
                    // Use BFS to traverse entire directory/file structure
                    let queue = []
                    // Unfortunately dataTransferItemList is not iterable i.e. no forEach
                    for (let i = 0; i < dataTransferItemList.length; i++) {
                        queue.push(dataTransferItemList[i].webkitGetAsEntry())
                    }
                    while (queue.length > 0) {
                        let entry = queue.shift()
                        searched++
                        if (entry.isFile && entry.name.toLowerCase().endsWith('.ckl')) {
                            fileEntries.push(entry)
                            found++
                            el.innerText = `Searching... Searched ${searched} files, found ${found} results files`
                        } else if (entry.isDirectory) {
                            queue.push(...await readAllDirectoryEntries(entry.createReader()))
                        }
                    }
                    el.innerText = `Finished. Searched ${searched} files, found ${found} results files`
                    return fileEntries
                }
                catch (e) {
                    alert(e)
                }
            }

            // Get all the entries (files or sub-directories) in a directory 
            // by calling readEntries until it returns empty array
            async function readAllDirectoryEntries(directoryReader) {
                try {
                    let entries = []
                    let readEntries = await readEntriesPromise(directoryReader)
                    while (readEntries?.length > 0) {
                        entries.push(...readEntries)
                        readEntries = await readEntriesPromise(directoryReader)
                    }
                    return entries;   
                }
                catch (e) {
                    alert(e)
                }
            }

            // Wrap readEntries in a promise to make working with readEntries easier
            // readEntries will return only some of the entries in a directory
            // e.g. Chrome returns at most 100 entries at a time
            async function readEntriesPromise(directoryReader) {
                try {
                    return await new Promise((resolve, reject) => {
                        directoryReader.readEntries(resolve, reject)
                    })
                } catch (e) {
                    alert(e)
                }
            }

            // Wrap entry.file() in a promise
            async function entryFilePromise(entry) {
                try {
                    return await new Promise((resolve, reject) => {
                        let fullPath = entry.fullPath

                        entry.file(file => {
                            file.fullPath = fullPath
                            resolve(file)
                        }, reject)
                    })
                } catch (e) {
                    alert(e)
                }
            }
        }

        async function onFileSelected(uploadField) {
            try {
                let input = uploadField.fileInput.dom
                const files = [...input.files]
                // Sort files oldest to newest
                files.sort((a, b) => a.lastModified - b.lastModified)
                warnOnExcessFiles(files)
            }
            catch (e) {
                throw e
            }
        }

        function warnOnExcessFiles(files) {
            if (files.length >= 250) {
                let warnPanel = new SM.ReviewsImport.WarningPanel({
                    continueHandler: onContinue,
                    contentTitle: `<b>We notice you have selected ${files.length} files to process.</b>`,
                    contentText: `This browser app is not optimized for parsing a large number of files and performance is highly dependent on your available client resources.<br><br>
                    <b>Recommendations</b><br><br>
                    <ul>
                    <li>Process your files in smaller batches.</li>
                    <li>Consider using STIG Manager Watcher</li>
                    </ul>
                    <div class="sm-dialog-panel-callout">
                    <img src="img/watcher-icon.svg" width=40px height=40px align="left" style="padding-right: 16px;"/>
                    If you have an on-going requirement to process large batches of files you should use STIG Manager Watcher, a CLI client that
                    can monitor your file system, process large numbers of test result files asynchronously, and post the results to your Collection.<br><br>
                    Watcher is suitable for use as a service or daemon, as a scheduled task, in automated testing pipelines, or from the command line. 
                    Available from <a href="https://github.com/NUWCDIVNPT/stigman-watcher">https://github.com/NUWCDIVNPT/stigman-watcher</a> 
                    and as an NPM module.</div>`
                    // contentText: '<ul><l1>One</li><li>Two</li></ul>'
                })
                fpwindow.removeAll()
                fpwindow.setAutoScroll(true)
                fpwindow.add(warnPanel)
                fpwindow.doLayout()
            }
            else {
                onContinue()
            }

            function onContinue() {
                showParseFiles(files)
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
                            const r = reviewsFromCkl(data, { ignoreNr: true })
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
                            const r = reviewsFromScc(data, { ignoreNotChecked: false })
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

                const tasks = new TaskObject({ apiAssets, apiStigs, parsedResults: parseResults.success, collectionId })
                // Transform into data for SM.ReviewsImport.Grid
                const results = {
                    taskAssets: tasks.taskAssets,
                    rows: [],
                    errors: parseResults.fail
                }
                for (const taskAsset of tasks.taskAssets.values()) {
                    for (const checklist of taskAsset.checklists) {
                        const data = {
                            checklist: checklist,
                            taskAsset: taskAsset
                        }
                        results.rows.push(data)
                    }
                    for (const ignoredChecklist of taskAsset.checklistsIgnored) {
                        results.errors.push({
                            file: ignoredChecklist.file,
                            error: `Ignoring ${ignoredChecklist.benchmarkId}, ${ignoredChecklist.ignored}`
                        })
                    }
                }

                let assetStigPairs = results.rows.reduce((a, v, i) => {
                    const key = `${v.taskAsset.assetProps.name.toUpperCase()}-${v.checklist.benchmarkId}`
                    if (a[key]) {
                        a[key].push(i)
                    }
                    else {
                        a[key] = [i]
                    }
                    return a
                }, {})
                results.hasDuplicates = Object.keys(assetStigPairs).some(key => assetStigPairs[key].length > 1)
                results.pairs = assetStigPairs
                return results
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
                taskAssets: results.taskAssets,
                addHandler: showImportProgress
            })
            fpwindow.removeAll()
            fpwindow.add(optionsPanel)
            fpwindow.doLayout()
        }

        async function showImportProgress(taskAssets, modifyAssets, importReviews) {
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

                let processedCount = 0
                for (const taskAsset of taskAssets.values()) {
                    try {
                        let assetId = taskAsset.assetProps.assetId
                        let sentRequest = false
                        updateProgress(processedCount / taskAssets.size, taskAsset.assetProps.name)
                        if (modifyAssets && (!taskAsset.knownAsset || taskAsset.hasNewAssignment)) {
                            assetId = await importAsset(taskAsset)
                            updateStatusText(` OK (${taskAsset.assetProps.name}, id: ${assetId})`)
                            sentRequest = true
                        }
                        if (importReviews) {
                            let reviewsArray = []
                            for (let checklist of taskAsset.checklists) {
                                reviewsArray = reviewsArray.concat(checklist.reviews)
                            }
                            await importReviewArray(collectionId, assetId, reviewsArray)
                            updateStatusText(' OK')
                            sentRequest = true
                        }
                        if (sentRequest) {
                            // Get the updated apiAsset
                            const result = await Ext.Ajax.requestPromise({
                                url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
                                method: 'GET',
                                params: {
                                    projection: ['stigs', 'adminStats']
                                },
                                headers: { 'Content-Type': 'application/json;charset=utf-8' }
                            })
                            apiAsset = JSON.parse(result.response.responseText)
                            SM.Dispatcher.fireEvent('assetchanged', apiAsset)
                        }
                        else {
                            updateStatusText(` Nothing to do for ${taskAsset.assetProps.name}`)
                        }
                    }
                    catch (e) {
                        updateStatusText(` ERROR (${e.message})`)
                    }
                    finally {
                        processedCount++
                        updateProgress(processedCount / taskAssets.size, taskAsset.assetProps.name)
                    }
                }
                updateProgress(0, 'Finished')
            }
            catch (e) {
                alert(e.message)
            }

            function updateProgress(value, text) {
                progressPanel.pb.updateProgress(value, Ext.util.Format.htmlEncode(text))
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

            async function importAsset(taskAsset) {
                try {
                    let url, method, jsonData
                    if (taskAsset.knownAsset && taskAsset.hasNewAssignment) {
                        url = `${STIGMAN.Env.apiBase}/assets/${taskAsset.assetProps.assetId}`
                        method = 'PATCH'
                        jsonData = {
                            collectionId: taskAsset.assetProps.collectionId,
                            stigs: taskAsset.assetProps.stigs
                        }
                    }
                    else {
                        url = `${STIGMAN.Env.apiBase}/assets`
                        method = 'POST'
                        jsonData = taskAsset.assetProps
                    }
                    updateStatusText(`${method} ${taskAsset.assetProps.name}`, true)

                    let result = await Ext.Ajax.requestPromise({
                        url: url,
                        method: method,
                        params: {
                            projection: ['stigs', 'adminStats']
                        },
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: jsonData
                    })
                    const apiAsset = JSON.parse(result.response.responseText)
                    let event = method === 'POST' ? 'assetcreated' : 'assetchanged'
                    SM.Dispatcher.fireEvent(event, apiAsset)

                    return apiAsset.assetId
                }
                finally { }
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
                finally { }
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
                e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
            }
            else {
                // payload = JSON.stringify(payload, null, 2)
                e = JSON.stringify(e)
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
                            files.push(file)
                            if (reading === 0) {
                                resolve(files)
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
                            resolve(files)
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


            const [apiAssetResponse, r] = await Promise.all([
                Ext.Ajax.requestPromise({
                    url: `${STIGMAN.Env.apiBase}/assets/${params.assetId}`,
                    method: 'GET'
                }),
                parseFile(file, pb)
            ])
            const apiAsset = JSON.parse(apiAssetResponse.response.responseText)
            let assetMatches = false
            if (r.target.metadata.cklHostName || apiAsset.metadata.cklHostName) {
                assetMatches = apiAsset.metadata.cklHostName === r.target.metadata.cklHostName
                && apiAsset.metadata.cklWebDbSite === r.target.metadata.cklWebDbSite
                && apiAsset.metadata.cklWebDbInstance === r.target.metadata.cklWebDbInstance
            } 
            else {
                assetMatches = r.target.name === apiAsset.name
            }
            if (!assetMatches) {
                let errorStr
                if (r.target.metadata.cklHostName || apiAsset.metadata.cklHostName) {
                    errorStr = `CKL elements and values:<br><br>
                    &lt;WEB_DB_SITE&gt; = ${r.target.metadata.cklWebDbSite ?? '<span style="color:grey;font-style:italic">No value</span>'}<br>
                    &lt;WEB_DB_INSTANCE&gt = ${r.target.metadata.cklWebDbInstance ?? '<span style="color:grey;font-style:italic">No value</span>'}<br><br>
                    Asset metadata properties and values:<br><br>
                    cklWebDbSite = ${apiAsset.metadata.cklWebDbSite ?? '<span style="color:grey;font-style:italic">No property</span>'}<br>
                    cklWebDbInstance = ${apiAsset.metadata.cklWebDbInstance ?? '<span style="color:grey;font-style:italic">No property</span>'}<br><br>
                    The corresponding values do not match.
                    </div>`
                }
                else {
                    errorStr = `The CKL file contains reviews for ${r.target.name}`
                }
                throw (new Error(`<b>The file does not include reviews for this asset.</b><br><div class="sm-dialog-panel-callout">${errorStr}</div>`))
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
                r = reviewsFromCkl(data, { ignoreNr: false })
            }
            if (extension === 'xml') {
                r = reviewsFromScc(data, { ignoreNotChecked: false })
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
            progressPanel.pb.updateProgress(value, Ext.util.Format.htmlEncode(text))
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
