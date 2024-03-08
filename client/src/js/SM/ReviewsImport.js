Ext.ns('SM.ReviewsImport')

SM.ReviewsImport.Grid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = [
            {
                name: 'filename',
                mapping: 'checklist.sourceRef.name'
            },
            {
                name: 'fullPath',
                mapping: 'checklist.sourceRef.fullPath'
            },
            {
                name: 'date',
                mapping: 'checklist.sourceRef.lastModifiedDate'
            },
            {
                name: 'file',
                mapping: 'checklist.sourceRef'
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
                name: 'informational',
                mapping: 'checklist.stats.informational'
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
        const store = new Ext.data.GroupingStore({
            grid: this,
            root: '',
            reader: new Ext.data.JsonReader({
                fields: fields,
                // idProperty: (v) => `${v.filename}-${v.assetName}-${v.benchmarkId}`
                idProperty: (v) => `${v.checklist.sourceRef.name}-${v.taskAsset.assetProps.name}-${v.checklist.benchmarkId}`
            }),
            sortInfo: {
                field: 'assetName',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            }
        })
        const totalTextCmp = new SM.RowCountTextItem({
            store: store
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
                header: '<div class="sm-grid-result-sprite sm-result-na" exportvalue="I">I</div>',
                width: 50,
                align: 'center',
                dataIndex: 'informational',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-na" exportvalue="NR">NR</div>',
                width: 50,
                align: 'center',
                dataIndex: 'notchecked',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-na" exportvalue="NA">NA</div>',
                width: 50,
                align: 'center',
                dataIndex: 'notapplicable',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-pass" exportvalue="NF">NF</div>',
                width: 50,
                align: 'center',
                dataIndex: 'pass',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            {
                header: '<div class="sm-grid-result-sprite sm-result-fail" exportvalue="O">O</div>',
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
                groupTextTpl: '{[SM.he(values.text)]} ({[values.rs.length]} {[values.text.split(":")[0] == "Asset" ? "checklist" : "asset"]}{[values.rs.length > 1 ? "s assigned" : " assigned"]})',
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'exportbutton',
                        hasMenu: false,
                        grid: this,
                        gridBasename: this.exportButtonName ?? 'Parsed Assets',
                        storeBasename: this.exportButtonName ?? 'Parsed Assets',
                        iconCls: 'sm-export-icon',
                        text: 'CSV'
                    },
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
            getValue: () => true,
            setValue: (v) => store.loadData(v),
            validator: Ext.emptyFn,
            markInvalid: Ext.emptyFn,
            clearInvalid: Ext.emptyFn,
            isValid: () => true,
            getName: () => this.name,
            validate:Ext.emptyFn,
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
                name: 'detail',
                mapping: 'new.detail',
                type: 'string'
            },
            {
                name: 'comment',
                mapping: 'new.comment',
                type: 'string'
            },
            {
                name: 'status',
                mapping: 'new.status',
                type: 'string'
            }
        ])
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
        const totalTextCmp = new SM.RowCountTextItem({
            store: store
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
                header: 'Detail', // per docs
                menuDisabled: true,
                width: 220,
                // fixed: true,
                dataIndex: 'detail',
                renderer: columnWrap,
                sortable: false
            },
            // {
            //     header: "Status",
            //     fixed: true,
            //     width: 44,
            //     align: 'center',
            //     dataIndex: 'status',
            //     sortable: false,
            //     renderer: renderStatuses
            // }
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
            if (filter === 'resultchange' ) {
                store.filterBy(record => record.data.result !== record.data.curResult)
            } 
            else {
                store.clearFilter()
            }
        }

        let config = {
            layout: 'fit',
            isFormField: true,
            loadMask: {msg: ''},
            store: store,
            columns: columns,
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit: true
            }),
            tbar: tbar,
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'exportbutton',
                        hasMenu: false,
                        grid: this,
                        gridBasename: 'Parsed Rules',
                        storeBasename: 'Parsed Rules',
                        iconCls: 'sm-export-icon',
                        text: 'CSV'
                    },
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
            view: new SM.ColumnFilters.GridView({
                forceFit: true,
                emptyText: 'No records to display'
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'exportbutton',
                        hasMenu: false,
                        grid: this,
                        gridBasename: 'Parse Errors',
                        storeBasename: 'Parse Errors',
                        iconCls: 'sm-export-icon',
                        text: 'CSV'
                    },
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
            getValue: () => true,
            setValue: (v) => store.loadData(v),
            validator: Ext.emptyFn,
            markInvalid: Ext.emptyFn,
            clearInvalid: Ext.emptyFn,
            isValid: () => true,
            getName: () => this.name,
            validate: Ext.emptyFn
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

SM.ReviewsImport.AutoStatusComboBox = Ext.extend(SM.Global.HelperComboBox, {
    initComponent: function () {
        const _this = this
        const config = {
            displayField: 'display',
            fieldLabel: this.fieldLabel ?? 'If possible, set Review status to',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false,
            width: 120,
            helpText: SM.TipContent.ImportOptions.AutoStatus
        }
        const data = [
            ['null', 'Keep Existing'],
            ['saved', 'Saved'],
            ['submitted', 'Submitted']
        ]
        if (this.canAccept) {
            data.push(['accepted', 'Accepted'])
        }
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.AutoStatusComboBox.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})
SM.ReviewsImport.UnreviewedComboBox = Ext.extend(SM.Global.HelperComboBox, {
    initComponent: function () {
        const _this = this
        const config = {
            displayField: 'display',
            fieldLabel: this.fieldLabel ?? 'Include unreviewed rules',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false,
            width: 120,
            helpText: SM.TipContent.ImportOptions.Unreviewed
        }
        const data = [
            ['never', 'Never'],
            ['commented', 'Having comments'],
            ['always', 'Always']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.UnreviewedComboBox.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})
SM.ReviewsImport.UnreviewedCommentedComboBox = Ext.extend(SM.Global.HelperComboBox, {
    initComponent: function () {
        const _this = this
        const config = {
            displayField: 'display',
            fieldLabel: this.fieldLabel ?? 'Unreviewed with a comment is',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false,
            width: 120,
            helpText: SM.TipContent.ImportOptions.UnreviewedCommented
        }
        let data = [
            ['informational', 'Informational'],
            ['notchecked', 'Not Reviewed'],
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.UnreviewedCommentedComboBox.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})
SM.ReviewsImport.EmptyCommentComboBox = Ext.extend(SM.Global.HelperComboBox, {
    initComponent: function () {
        const _this = this
        const config = {
            displayField: 'display',
            fieldLabel: this.fieldLabel ?? `Empty ${this.commentType} text is`,
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false,
            width: 120,
            helpText: SM.TipContent.ImportOptions.EmptyComment
        }
        const data = [
            ['ignore', 'Ignored'],
            ['replace', 'Replaced'],
            ['import', 'Imported']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.EmptyCommentComboBox.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})
SM.ReviewsImport.DefaultOptions = {
    autoStatus: 'saved',
    unreviewed: 'commented',
    unreviewedCommented: 'informational',
    emptyDetail: 'replace',
    emptyComment: 'ignore',
    allowCustom: true
}
SM.ReviewsImport.ParseOptionsFieldSet = Ext.extend(Ext.form.FieldSet, {
    initComponent: function () {
        const _this = this
        this.context = this.context ?? 'manage' // 'or 'wizard'
        this.initialOptions = {...SM.ReviewsImport.DefaultOptions, ...this.initialOptions}
        this.autoStatusCombo = new SM.ReviewsImport.AutoStatusComboBox({
            value: this.initialOptions.autoStatus,
            name: 'autoStatus',
            readOnly: this.context === 'wizard',
            canAccept: this.canAccept,
            listeners: {
                select: onSelect
            }
        })
        this.unreviewedCombo = new SM.ReviewsImport.UnreviewedComboBox({
            value: this.initialOptions.unreviewed,
            name: 'unreviewed',
            readOnly: this.context === 'wizard',
            listeners: {
                select: onSelect
            }
        })
        this.unreviewedCommentedCombo = new SM.ReviewsImport.UnreviewedCommentedComboBox({
            value: this.initialOptions.unreviewedCommented,
            name: 'unreviewedCommented',
            readOnly: this.context === 'wizard',
            disabled: this.unreviewedCombo.value === 'never',
            listeners: {
                select: onSelect
            }
        })
        this.emptyDetailCombo = new SM.ReviewsImport.EmptyCommentComboBox({
            commentType: 'detail',
            name: 'emptyDetail',
            value: this.initialOptions.emptyDetail,
            readOnly: this.context === 'wizard',
            listeners: {
                select: onSelect
            }
        })
        this.emptyCommentCombo = new SM.ReviewsImport.EmptyCommentComboBox({
            commentType: 'comment',
            name: 'emptyComment',
            value: this.initialOptions.emptyComment,
            readOnly: this.context === 'wizard',
            listeners: {
                select: onSelect
            }
        })
        this.optionComboBoxes = [
            this.autoStatusCombo,
            this.unreviewedCombo,
            this.unreviewedCommentedCombo,
            this.emptyDetailCombo,
            this.emptyCommentCombo
        ]
        this.allowCustomCb = new Ext.form.Checkbox({
            boxLabel: `Options can be customized for each import`,
            checked: this.initialOptions.allowCustom,
            hideLabel: true,
            listeners: {
                check: function (cb, checked) {
                    _this.onOptionChanged?.(_this, cb, checked)
                }
            }
        })
        this.customizeCb = new Ext.form.Checkbox({
            boxLabel: `Configure custom import options`,
            height: 22,
            checked: false,
            hideLabel: true,
            listeners: {
                check: function (cb, checked) {
                    if (!checked) {
                        _this.restoreOptions()
                    }
                    for (const combo of _this.optionComboBoxes) {
                        combo.setReadOnly(!checked)
                    }
                    _this.localStorage = checked
                    if (_this.localStorage && localStorage.wizardImportOptions?.length) {
                        _this.restoreOptions(JSON.parse(localStorage.wizardImportOptions))
                    }
                    _this.onOptionChanged?.(_this, cb, checked)
                }
            }
        })

        this.noCustomizeDisplay = new Ext.form.DisplayField({
            value: '<i>Import options cannot be changed for this Collection.</i>',
            height: 22,
            hideLabel: true
        })

        function onSelect(item, record, index) {
            if (item.name === 'unreviewed') {
                _this.unreviewedCommentedCombo.setDisabled(item.value === 'never')
            }
            if (_this.localStorage) {
                localStorage.setItem('wizardImportOptions', JSON.stringify(_this.getOptions())) 
            }
            _this.onOptionChanged?.(_this, item, record, index)
        }

        this.restoreOptions = function (options = _this.initialOptions) {
            for (const combo of this.optionComboBoxes) {
                combo.setValue(options[combo.name])
            }
            _this.unreviewedCommentedCombo.setDisabled(_this.unreviewedCombo.value === 'never')
        }

        this.getOptions = function () {
            const options = {
                autoStatus: _this.autoStatusCombo.value,
                unreviewed: _this.unreviewedCombo.value,
                unreviewedCommented: _this.unreviewedCommentedCombo.value ,  
                emptyDetail: _this.emptyDetailCombo.value,
                emptyComment: _this.emptyCommentCombo.value,
                allowCustom: _this.allowCustomCb.checked
            }
            return options
        }

        const items = []
        if (this.context === 'wizard') {
            items.push(this.initialOptions.allowCustom ? this.customizeCb : this.noCustomizeDisplay)
        }
        items.push(...this.optionComboBoxes)       
        if (this.context !== 'wizard') {
            items.push(this.allowCustomCb)
        }
        const config = {
            title: 'Import options',
            labelWidth: 200,
            items
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ParseOptionsFieldSet.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.SelectFilesGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const _this = this

        function handleDragover(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            this.getElementsByClassName('x-panel-body')[0].style.border = '1px dashed red'
        }
        function handleDragleave(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            this.getElementsByClassName('x-panel-body')[0].style.border = ''

        }
        async function onFileDropped(e) {
            try {
                e.stopPropagation()
                e.preventDefault()
                this.getElementsByClassName('x-panel-body')[0].style.border = ''
                let entries = []
                if (!e.dataTransfer) {
                    throw new Error('Event is missing the dataTransfer property')
                }
                entries = await getAllFileEntries(e.dataTransfer.items)
                if (!entries.length) {
                   throw new Error('no entries error')
                }
                else {
                    const files = _this.store.getRange().map(r=>r.json)
                    for (const entry of entries) {
                        files.push(await entryFilePromise(entry))
                    }
                    _this.store.loadData(files)
                }
            }
            catch (e) {
                SM.Error.handleError(e)
            }

            async function getAllFileEntries(dataTransferItemList) {
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
                        if (entry.isFile && (entry.name.toLowerCase().endsWith('.ckl') || entry.name.toLowerCase().endsWith('.cklb') || entry.name.toLowerCase().endsWith('.xml'))) {
                            fileEntries.push(entry)
                            found++
                        } else if (entry.isDirectory) {
                            queue.push(...await readAllDirectoryEntries(entry.createReader()))
                        }
                    }
                    return fileEntries
                }
                catch (e) {
                    SM.Error.handleError(e)
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
                    SM.Error.handleError(e)
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
                    SM.Error.handleError(e)
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
                    SM.Error.handleError(e)
                }
            }
        }
        function onFileSelected(uploadField) {
            const files = _this.store.getRange().map(r=>r.json)
            files.push(...uploadField.fileInput.dom.files)
            _this.store.loadData(files)
            uploadField.fileInput.dom.value = ''
        }

        const fields = [
            {
                name: 'filename',
                type: 'string',
                mapping: 'name'
            },
            {
                name: 'size',
                type: 'integer',
                mapping: 'size'
            },
            {
                name: 'lastModified',
                type: 'integer',
                mapping: 'lastModified'
            },
            {
                name: 'lastModifiedDate',
                type: 'date',
                mapping: 'lastModifiedDate'
            },
            {
                name: 'id',
                convert: function (v, r) {
                    return `${r.name}-${r.size}-${r.lastModified}`
                }
            }
        ]
        const store = new Ext.data.ArrayStore({
            grid: this,
            root: '',
            fields: fields,         
            idProperty: 'id',
            sortInfo: {
                field: 'filename',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                datachanged: function (store, record, index) {
                    const files = store.getRange().map(r=>r.json)
                    totalTextCmp.setText(files.length + ' files')
                    _this.fireEvent('filelistchanged', files)
                }
            }
        })
        // hack override to handle setting record id as desired
        store.reader.readRecords = function(o){
            this.arrayData = o;
            let s = this.meta,
                recordType = this.recordType,
                fields = recordType.prototype.fields,
                records = [],
                success = true,
                v;
    
            let root = this.getRoot(o);
    
            for(let i = 0, len = root.length; i < len; i++) {
                let n = root[i],
                    values = {}
                for(let j = 0, jlen = fields.length; j < jlen; j++) {
                    let f = fields.items[j],
                        k = f.mapping !== undefined && f.mapping !== null ? f.mapping : j;
                    v = n[k] !== undefined ? n[k] : f.defaultValue;
                    v = f.convert(v, n);
                    values[f.name] = v;
                }
                // change second argument from id to values.id
                let record = new recordType(values, values.id);
                record.json = n;
                records[records.length] = record;
            }
    
            let totalRecords = records.length;
    
            if(s.totalProperty) {
                v = parseInt(this.getTotal(o), 10);
                if(!isNaN(v)) {
                    totalRecords = v;
                }
            }
            if(s.successProperty){
                v = this.getSuccess(o);
                if(v === false || v === 'false'){
                    success = false;
                }
            }
    
            return {
                success : success,
                records : records,
                totalRecords : totalRecords
            };
        }
        const totalTextCmp = new SM.RowCountTextItem({
            text: '0 files',
            store: store
        })
        const sm = new Ext.grid.CheckboxSelectionModel({
                singleSelect: false,
                checkOnly: false,
            listeners: {
                selectionchange: function (sm) {
                    removeBtn.setDisabled(sm.getCount() === 0)
                    SM.SetCheckboxSelModelHeaderState(sm)
                }
            }
        })
        const columns = [
            sm,
            {
                header: "Filename",
                width: 100,
                dataIndex: 'filename',
                sortable: true,
                align: 'left'
            },
            {
                header: "Size",
                width: 25,
                dataIndex: 'size',
                sortable: true
            },
            {
                header: "Last Modified",
                width: 35,
                dataIndex: 'lastModifiedDate',
                sortable: true,
                align: 'left',
				xtype: 'datecolumn',
				format:	'Y-m-d H:i:s T'
            }
        ]
        const removeBtn = new Ext.Button(                    {
            iconCls: 'icon-del',
            text: 'Remove from queue',
            disabled: true,
            handler: function () {
                const records = _this.getSelectionModel().getSelections()
                _this.suspendEvents()
                for (const record of records) {
                    _this.store.remove(record)
                }
                _this.resumeEvents()
                const files = store.getRange().map(r=>r.json)
                totalTextCmp.setText(files.length + ' files')
                _this.fireEvent('filelistchanged', files)
            }
        })

        const tbar = new Ext.Toolbar({
            items: [
                {
                    xtype: 'fileuploadfield',
                    buttonOnly: true,
                    na_this: 'importFile',
                    accept: '.xml,.ckl,.cklb',
                    webkitdirectory: false,
                    multiple: true,
                    style: 'width: 95px;',
                    buttonText: `Add files to queue...`,
                    buttonCfg: {
                        icon: "img/disc_drive.png"
                    },
                    listeners: {
                        fileselected: onFileSelected
                    }
                },
                {
                    xtype: 'tbfill'
                },
                removeBtn
            ]
        })
        const config = {
            isFormField: true,
            loadMask: {msg: ''},
            store: store,
            columns: columns,
            viewConfig: {
                emptyText: 'You may drop files here',
                deferEmptyText: false,
                forceFit: true
            },
            sm,
            tbar: tbar,
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'exportbutton',
                        hasMenu: false,
                        grid: this,
                        gridBasename: 'Source Files',
                        storeBasename: 'Source Files',
                        iconCls: 'sm-export-icon',
                        text: 'CSV'
                    },
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
                render: (panel) => {
                    const panelEl = panel.getEl().dom
                    panelEl.addEventListener('dragenter', handleDragover, false)
                    panelEl.addEventListener('dragover', handleDragover, false)
                    panelEl.addEventListener('dragleave', handleDragleave, false)
                    panelEl.addEventListener('drop', onFileDropped, false)
                },
                keydown: SM.CtrlAGridHandler
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.SelectFilesGrid.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.MultiSelectPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        const _this = this
        this.parseOptionsFieldSet = new SM.ReviewsImport.ParseOptionsFieldSet({
            height: 200,
            context: this.optionsContext,
            canAccept: true,
            initialOptions: {...SM.ReviewsImport.DefaultOptions, ...this.initialOptions}
        })
        this.selectFilesGrid = new SM.ReviewsImport.SelectFilesGrid({
            flex: 3,
            listeners: {
                filelistchanged: function(list) {
                    _this.continueBtn.setDisabled(!list.length)
                }
            }
        })
        this.continueBtn = new Ext.Button({
            text: 'Continue',
            disabled: true,
            handler: () => {
                _this.fireEvent('continue',_this)
            }
        })
        const config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20'
            },
            items: [
                {
                    html: `<div class="sm-dialog-panel-title">Queue files for import</div>`,
                    border: false
                },
                {
                    xtype: 'displayfield',
                    html: "<p>&nbsp;</p>",
                },
                this.selectFilesGrid,
                {
                    xtype: 'displayfield',
                    html: "<p>&nbsp;</p>",
                },
                this.parseOptionsFieldSet
            ],
            buttons: [this.continueBtn],
            buttonAlign: 'right',
            listeners: {
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.MultiSelectPanel.superclass.initComponent.call(this)
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

        const _this = this

        function handleDragover(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            this.style.border = "2px dashed red"
        }

        function handleDragleave(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            this.style.border = ""
        }

        this.parseOptionsFieldSet = new SM.ReviewsImport.ParseOptionsFieldSet({
            height: 200,
            context: 'wizard',
            initialOptions: this.initialOptions,
            canAccept: this.canAccept
        })


        const config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20'
            },
            items: [
                {
                    html: `<div class="sm-dialog-panel-title">Select or drop file${_this.initialConfig.multifile ? 's' : ''}</div>`,
                    width: 500,
                    border: false
                },
                {
                    xtype: 'displayfield',
                    html: "<p>&nbsp;</p>",
                },
                {
                    html: `<div id="droptarget">Drop ${_this.initialConfig.multifile ? 'one or more CKL(B)/XCCDF result files' : 'a CKL(B) or XCCDF result file'} here</div>`,
                    // border: false,
                    baseCls: 'sm-drop',
                    flex: 1,
                    listeners: {
                        render: (panel) => {
                            const panelEl = panel.getEl().dom
                            panelEl.addEventListener('dragenter', handleDragover, false)
                            panelEl.addEventListener('dragover', handleDragover, false)
                            panelEl.addEventListener('dragleave', handleDragleave, false)
                            panelEl.addEventListener('drop', function (e) {
                                _this.onFileDropped(e, this)
                            }, false)
                        }
                    }
                },
                {
                    xtype: 'displayfield',
                    html: "<p>&nbsp;</p>",
                },
                this.parseOptionsFieldSet,
                {
                    xtype: 'displayfield',
                    html: "<p>&nbsp;</p>",
                },
                {
                    xtype: 'fileuploadfield',
                    buttonOnly: true,
                    na_this: 'importFile',
                    accept: '.xml,.ckl,.cklb',
                    webkitdirectory: false,
                    multiple: _this.initialConfig.multifile,
                    style: 'width: 95px;',
                    buttonText: `Select file${_this.initialConfig.multifile ? 's' : ''}...`,
                    buttonCfg: {
                        icon: "img/disc_drive.png"
                    },
                    listeners: {
                        fileselected: _this.onFileSelected
                    }
                },


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
            newIndicator: false,
            exportButtonName: 'Duplicate Asset-STIGs'
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
                    html: '<div class="sm-dialog-panel-title">Duplicates excluded</div>There were multiple result files for some Asset/STIG pairs.<br>Results shown below <b>will not be imported</b> because they were not obtained from the most recently modified file for the Asset/STIG.',
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
                text: me.stopWizard ? 'Close' : 'Continue',
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
        const continueBtn = new Ext.Button({
            iconCls: 'sm-import-icon',
            text: 'Add to Collection...',
            margins: '0 25',
            grid: grid,
            handler: async () => {
                await me.addHandler(me.taskAssets, grid.createObjects, grid.importReviews)
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
                    html: '<div class="sm-dialog-panel-title">Import Reviews</div>If you continue, these results will be added to the Collection.<br>&nbsp;',
                    width: 500,
                    border: false
                },
                // controls,
                grid
            ],
            buttons: [
                continueBtn
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

SM.ReviewsImport.ImportStatusGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const me = this
        const fields = [
            'assetId',
            'assetName',
            { name: 'created', type: 'boolean'},
            { name: 'addedStigs', type: 'boolean'},
            'inserted',
            'updated',
            'rejected'
        ]
        const totalTextCmp = new Ext.Toolbar.TextItem({
            text: '0 records',
            width: 80
        })
        const store = new Ext.data.JsonStore({
            grid: this,
            root: '',
            fields,
            idProperty: 'assetId',
            listeners: {
                load: function (store, records) {
                    totalTextCmp.setText(store.getCount() + ' records')
                    me.view.scrollToBottom()
                },
                remove: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records')
                }
            }
        })
        const columns = [
            {
                header: "Asset",
                width: 200,
                dataIndex: 'assetName',
                sortable: true
            },
            {
                header: "Created",
                width: 50,
                dataIndex: 'created',
                xtype: 'booleancolumn',
                sortable: true,
                align: 'center'
            },
            {
                header: "Added STIGs",
                width: 50,
                dataIndex: 'addedStigs',
                xtype: 'booleancolumn',
                sortable: true,
                align: 'center'
            },
            {
                header: "Inserted",
                width: 50,
                dataIndex: 'inserted',
                sortable: true,
                align: 'center',
                renderer: SM.styledZeroRenderer
            },
            {
                header: "Updated",
                width: 50,
                dataIndex: 'updated',
                sortable: true,
                align: 'center',
                renderer: SM.styledZeroRenderer
            },
            {
                header: "Rejected",
                width: 50,
                dataIndex: 'rejected',
                sortable: true,
                align: 'center',
                renderer: function (val, record, metadata) {
                    return val?.length ?? '-'
                }
            }
        ]
        const config = {
            layout: 'fit',
            store,
            cm: new Ext.grid.ColumnModel({
                columns: columns
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true
            }),
            view: new SM.ColumnFilters.GridView({
                forceFit: true,
                emptyText: 'No records to display',
                holdPosition: true, // see overrides.js for why this is needed
                scrollToBottom: function () {
                    const dom = this.scroller.dom;
                    dom.scrollTop  = 999999;
                    dom.scrollLeft = 0;
                }
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'exportbutton',
                        hasMenu: false,
                        grid: this,
                        gridBasename: 'Import Job',
                        storeBasename: 'Import Job',
                        iconCls: 'sm-export-icon',
                        text: 'CSV'
                    },
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
            getValue: () => true,
            setValue: (v) => store.loadData(v),
            validator: Ext.emptyFn,
            markInvalid: Ext.emptyFn,
            clearInvalid: Ext.emptyFn,
            isValid: () => true,
            getName: () => this.name,
            validate: Ext.emptyFn
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        this.superclass().initComponent.call(this)
    }
})

SM.ReviewsImport.ImportRejectGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const fields = [
            'ruleId',
            'reason'
        ]
        const totalTextCmp = new Ext.Toolbar.TextItem({
            text: '0 records',
            width: 80
        })
        const store = new Ext.data.JsonStore({
            grid: this,
            root: '',
            fields,
            idProperty: 'ruleId',
            listeners: {
                load: function (store, records) {
                    totalTextCmp.setText(store.getCount() + ' records')
                },
                remove: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records')
                }
            }
        })
        const columns = [
            {
                header: "Rule",
                width: 100,
                dataIndex: 'ruleId',
                sortable: true
            },
            {
                header: "Reason",
                width: 200,
                dataIndex: 'reason'
            }
        ]
        const config = {
            layout: 'fit',
            store,
            cm: new Ext.grid.ColumnModel({
                columns: columns
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true
            }),
            view: new SM.ColumnFilters.GridView({
                forceFit: true,
                emptyText: 'No records to display',
                holdPosition: true, // see overrides.js for why this is needed
                scrollToBottom: function () {
                    const dom = this.scroller.dom;
                    dom.scrollTop  = 999999;
                    dom.scrollLeft = 0;
                }
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'exportbutton',
                        hasMenu: false,
                        grid: this,
                        gridBasename: 'Unimported Rules',
                        storeBasename: 'Unimported Rules',
                        iconCls: 'sm-export-icon',
                        text: 'CSV'
                    },
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
            getValue: () => true,
            setValue: (v) => store.loadData(v),
            validator: Ext.emptyFn,
            markInvalid: Ext.emptyFn,
            clearInvalid: Ext.emptyFn,
            isValid: () => true,
            getName: () => this.name,
            validate: Ext.emptyFn
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        this.superclass().initComponent.call(this)
    }
})

SM.ReviewsImport.ImportProgressPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        const me = this
        const pb = new Ext.ProgressBar({
            text: '',
            border: false
        })
        const st = new SM.ReviewsImport.ImportStatusGrid({
            flex: 2,
            margins: {
                top: 10,
                bottom: 0,
                left: 0,
                right: 0,
            }
        })
        const rj = new SM.ReviewsImport.ImportRejectGrid({
            flex: 1,
            title: 'Rejected reviews',
            margins: {
                top: 10,
                bottom: 0,
                left: 0,
                right: 0,
            }          
        })
        st.getSelectionModel().on('rowselect', function( sm, index, record) {
            rj.setTitle(`Rejected reviews for ${record.data.assetName}`)
            rj.store.loadData(record.data.rejected)
        })
        const doneBtn = new Ext.Button({
            text: 'Done',
            margins: '0 25',
            handler: me.doneHandler,
            disabled: true
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
                    html: '<div class="sm-dialog-panel-title">Importing results</div>',
                    width: 500,
                    border: false
                },
                pb,
                st,
                rj
            ],
            buttons: [
                doneBtn
            ],
            buttonAlign: 'right',
            pb,
            st,
            doneBtn
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        this.superclass().initComponent.call(this)
    }
})

async function showImportResultFiles(collectionId, createObjects = true) {
    try {
        const cachedCollection = SM.Cache.CollectionMap.get(collectionId)
        const userGrant = curUser.collectionGrants.find( i => i.collection.collectionId === cachedCollection.collectionId )?.accessLevel
        const canAccept = cachedCollection.settings.status.canAccept && (userGrant >= cachedCollection.settings.status.minAcceptGrant)
        const initialOptions = SM.safeJSONParse(cachedCollection.metadata.importOptions) ?? SM.ReviewsImport.DefaultOptions
        if (initialOptions?.autoStatus === 'accepted' && !canAccept) {
            initialOptions.autoStatus = 'submitted'
        }

        const vpSize = Ext.getBody().getViewSize()
        let height = vpSize.height * 0.75
        let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024

        const fp = new SM.ReviewsImport.MultiSelectPanel({
            border: false,
            height: 'auto',
            width: 'auto',
            optionsContext: 'wizard',
            initialOptions,
            canAccept,
            listeners: {
                continue: function(panel) {
                    const records = panel.selectFilesGrid.store.getRange()
                    const files = records.map( r => r.json )
                    warnOnExcessFiles(files)
                },
                filelist: function(list) {

                }
            }
        })
        const fpwindow = new Ext.Window({
            title: 'Import results from CKL(B) or XCCDF files',
            cls: 'sm-dialog-window sm-round-panel',
            modal: true,
            resizable: false,
            width,
            height,
            layout: 'fit',
            plain: true,
            bodyStyle: 'padding:5px;',
            buttonAlign: 'center',
            items: fp
        })
        fpwindow.show(document.body)

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
                task.delay(50)

                const results = await parseFiles(files, pb)
                task.cancel()

                results.stopWizard = !results.rows.length
                if (results.errors.length > 0 || results.hasDuplicates) {
                    showErrors(results)
                } else {
                    showOptions(results)
                }
            }
            catch (e) {
                SM.Error.handleError(e)
            }
        }

        async function parseFiles(files, pb) {
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

            // Get SCAP benchmarkId map
            let scapBenchmarkMap = await getScapBenchmarkMap()

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
                        const r = STIGMAN.ClientModules.reviewsFromCkl({
                            data, 
                            fieldSettings: cachedCollection.settings.fields, 
                            allowAccept: canAccept,
                            importOptions: fp.parseOptionsFieldSet.getOptions(),
                            sourceRef: file
                        })
                        parseResults.success.push(r)
                    }
                    catch (e) {
                        parseResults.fail.push({
                            file,
                            error: e.message
                        })
                    }
                }
                else if (extension === 'cklb') {
                    try {
                        const r = STIGMAN.ClientModules.reviewsFromCklb({
                            data, 
                            fieldSettings: cachedCollection.settings.fields, 
                            allowAccept: canAccept,
                            importOptions: fp.parseOptionsFieldSet.getOptions(),
                            sourceRef: file
                        })
                        parseResults.success.push(r)
                    }
                    catch (e) {
                        parseResults.fail.push({
                            file: file,
                            error: e.message
                        })
                    }
                }
                else if (extension === 'xml') {
                    try {
                        const r = STIGMAN.ClientModules.reviewsFromScc({
                            data, 
                            fieldSettings: cachedCollection.settings.fields, 
                            allowAccept: canAccept,
                            importOptions: fp.parseOptionsFieldSet.getOptions(),
                            scapBenchmarkMap,
                            sourceRef: file
                        })
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

            const taskConfig = {
                collectionId,
                createObjects,
                strictRevisionCheck: false
            } 
            const tasks = new STIGMAN.ClientModules.TaskObject({ apiAssets, apiStigs, parsedResults: parseResults.success, options: taskConfig })
            const taskErrors = tasks.errors.map( e => ({file: e.sourceRef, error: e.message}))
            // Transform into data for SM.ReviewsImport.Grid
            const results = {
                taskAssets: tasks.taskAssets,
                rows: [],
                dupedRows: [],
                errors: [...parseResults.fail, ...taskErrors],
                hasDuplicates: false
            }
            // Collate multiple checklists into duplicates and the single checklist for POSTing.
            // The parsed files are sorted in descending date order, the first
            // item in each checklists array is from the most recently dated file and we will choose this item.
            for (const taskAsset of tasks.taskAssets.values()) {
                for (const assetStigChecklists of taskAsset.checklists.values()) {
                    if (assetStigChecklists.length > 1) {
                        results.hasDuplicates = true
                        assetStigChecklists.sort((a,b) => b.sourceRef.lastModified - a.sourceRef.lastModified)
                        const dupedChecklists = assetStigChecklists.slice(1)
                        const rowsToPush = dupedChecklists.map( checklist => ({ taskAsset, checklist }))
                        results.dupedRows.push(...rowsToPush)
                    }
                    results.rows.push({ taskAsset, checklist: assetStigChecklists[0]})
                }
                for (const ignoredChecklist of taskAsset.checklistsIgnored) {
                    results.errors.push({
                        file: ignoredChecklist.sourceRef,
                        error: `Ignoring ${ignoredChecklist.benchmarkId} ${ignoredChecklist.revisionStr}. ${ignoredChecklist.ignored}`
                    })
                }
            }
            return results
        }

        function showErrors(results) {
            let pePanel = new SM.ReviewsImport.ParseErrorsPanel({
                errors: results.errors.length > 0 ? results.errors : null,
                duplicates: results.hasDuplicates ? results.dupedRows : null,
                stopWizard: results.stopWizard,
                continueHandler: results.stopWizard ? onAbort : onContinue,
                backHandler: onBack
            })
            fpwindow.removeAll()
            fpwindow.setAutoScroll(true)
            fpwindow.add(pePanel)
            fpwindow.doLayout()

            function onContinue() {
                showOptions(results)
            }

            function onAbort() {
                fpwindow.close()
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
                        updateProgress(processedCount / taskAssets.size, taskAsset.assetProps.name)
                        let importAssetResult
                        if (modifyAssets && (!taskAsset.knownAsset || taskAsset.hasNewAssignment)) {
                            importAssetResult = await importAsset(taskAsset)
                            updateStatusGrid(importAssetResult)
                            assetId = importAssetResult.assetId
                        }
                        else {
                            importAssetResult = {
                                assetId: taskAsset.assetProps.assetId,
                                assetName: taskAsset.assetProps.name,
                                created: false,
                                addedStigs: false
                            }
                        }
                        if (importReviews) {
                            let reviewsArray = []
                            for (const benchmarkId of taskAsset.checklists.keys()) {
                                reviewsArray = reviewsArray.concat(taskAsset.checklists.get(benchmarkId)[0].reviews)
                            }
                            const importReviewArrayResult = await importReviewArray(collectionId, assetId, reviewsArray)
                            updateStatusGrid({...importAssetResult, ...importReviewArrayResult})
                        }
                    }
                    catch (e) {
                        SM.Error.handleError(e)
                    }
                    finally {
                        processedCount++
                        updateProgress(processedCount / taskAssets.size, taskAsset.assetProps.name)
                    }
                }
                updateProgress(0, 'Finished')
                progressPanel.doneBtn.setDisabled(false)
                SM.Dispatcher.fireEvent('assetchanged', {collection:{collectionId}})
            }
            catch (e) {
                SM.Dispatcher.fireEvent('assetchanged', {collection:{collectionId}})
                SM.Error.handleError(e)
            }

            function updateProgress(value, text) {
                progressPanel.pb.updateProgress(value, SM.he(text))
            }

            function updateStatusGrid(status) {
                progressPanel.st.store.loadData(status, true)
            }

            async function importAsset(taskAsset) {
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

                let result, apiAsset, robj
                try {
                    result = await Ext.Ajax.requestPromise({
                        url: url,
                        method: method,
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: jsonData
                    })
                    apiAsset = JSON.parse(result.response.responseText)
                    robj = {
                        assetId: apiAsset.assetId,
                        assetName: apiAsset.name,
                        created: !taskAsset.knownAsset,
                        addedStigs: taskAsset.hasNewAssignment
                    }
                }
                catch (e) {
                    SM.Error.handleError(e)
                }

                return robj
            }

            async function importReviewArray(collectionId, assetId, reviewArray) {
                if (!reviewArray?.length) { //Don't try to POST reviews if the review Array is empty.
                    return {
                        inserted: 0,
                        updated: 0,
                        rejected: []
                    }                    
                }
                else{
                    let url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews/${assetId}`
                    let result = await Ext.Ajax.requestPromise({
                        url: url,
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: reviewArray
                    })
                    const apiReviews = JSON.parse(result.response.responseText)
                    return {
                        inserted: apiReviews.affected.inserted,
                        updated: apiReviews.affected.updated,
                        rejected: apiReviews.rejected
                    }
                }
            } 
        }
    }
    catch (e) {
        Ext.getBody().unmask()
        SM.Error.handleError(e)
    }
}

async function showImportResultFile(params) {
    try {
        const cachedCollection = SM.Cache.CollectionMap.get(params.collectionId)
        const userGrant = curUser.collectionGrants.find( i => i.collection.collectionId === cachedCollection.collectionId )?.accessLevel
        const canAccept = cachedCollection.settings.status.canAccept && (userGrant >= cachedCollection.settings.status.minAcceptGrant)
        const initialOptions = SM.safeJSONParse(cachedCollection.metadata.importOptions) ?? SM.ReviewsImport.DefaultOptions
        if (initialOptions?.autoStatus === 'accepted' && !canAccept) {
            initialOptions.autoStatus = 'submitted'
        }

        const vpSize = Ext.getBody().getViewSize()
        let height = vpSize.height * 0.75
        let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024

        const fp = new SM.ReviewsImport.SelectFilesPanel({
            border: false,
            autoScroll: true,
            multifile: false,
            optionsContext: 'wizard',
            initialOptions,
            canAccept,
            onFileSelected,
            onFileDropped
        })

        const fpwindow = new Ext.Window({
            title: `Import results (${SM.he(params.benchmarkId)} on ${SM.he(params.assetName)})`,
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

        async function onFileDropped(e, panel) {
            e.stopPropagation()
            e.preventDefault()
            panel.style.border = ""
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
            let input = uploadField.fileInput.dom
            const files = [...input.files]
            await showParseFile(files[0])
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
                    assetMatches = apiAsset.metadata.cklHostName?.toLowerCase() === r.target.metadata.cklHostName?.toLowerCase()
                    && apiAsset.metadata.cklWebDbSite?.toLowerCase() === r.target.metadata.cklWebDbSite?.toLowerCase()
                    && apiAsset.metadata.cklWebDbInstance?.toLowerCase() === r.target.metadata.cklWebDbInstance?.toLowerCase()
                } 
                else {
                    assetMatches = r.target.name.toLowerCase() === apiAsset.name.toLowerCase()
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
            const extension = file.name.substring(file.name.lastIndexOf(".") + 1)
            const data = await readTextFileAsync(file)

            let r
            if (extension === 'ckl') {
                r = STIGMAN.ClientModules.reviewsFromCkl({
                    data, 
                    fieldSettings: cachedCollection.settings.fields, 
                    allowAccept: canAccept,
                    importOptions: fp.parseOptionsFieldSet.getOptions(),
                })
            }
            else if (extension === 'cklb') {
                r = STIGMAN.ClientModules.reviewsFromCklb({
                    data, 
                    fieldSettings: cachedCollection.settings.fields, 
                    allowAccept: canAccept,
                    importOptions: fp.parseOptionsFieldSet.getOptions()
                })
            }
            else if (extension === 'xml') {
                const scapBenchmarkMap = await getScapBenchmarkMap()
                r = STIGMAN.ClientModules.reviewsFromScc({
                    data, 
                    fieldSettings: cachedCollection.settings.fields, 
                    allowAccept: canAccept,
                    importOptions: fp.parseOptionsFieldSet.getOptions(),
                    scapBenchmarkMap
                })
            }
            else {
                throw (new Error('Unknown file extension'))
            }
            return r
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
                const importReviewArrayResult = await importReviewArray(reviews)
                const commonProps = {
                    assetId: params.assetId,
                    assetName: params.assetName,
                    created: false,
                    addedStigs: false
                }
                updateStatusGrid({...commonProps, ...importReviewArrayResult})
                updateProgress(0, 'Finished')
                progressPanel.doneBtn.setDisabled(false)
                params.store.reload()
            }
            catch (e) {
                SM.Error.handleError(e)
            }

            function updateProgress(value, text) {
                progressPanel.pb.updateProgress(value, SM.he(text))
            }

            function updateStatusGrid(status) {
                progressPanel.st.store.loadData(status, true)
            }

            async function importReviewArray(reviewArray) {
                if (!reviewArray?.length) { //Don't try to POST reviews if the review Array is empty.
                    return {
                        inserted: 0,
                        updated: 0,
                        rejected: []
                    }           
                }
                else{                
                    let url = `${STIGMAN.Env.apiBase}/collections/${params.collectionId}/reviews/${params.assetId}`
                    let result = await Ext.Ajax.requestPromise({
                        url: url,
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: reviewArray
                    })
                    const apiReviews = JSON.parse(result.response.responseText)
                    return {
                        inserted: apiReviews.affected.inserted,
                        updated: apiReviews.affected.updated,
                        rejected: apiReviews.rejected
                    }
                }
            }
        }
    }
    catch (e) {
        Ext.getBody().unmask()
        SM.Error.handleError(e)
    }

}

async function getScapBenchmarkMap() {
    let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/stigs/scap-maps`,
        method: 'GET'
    })
    const apiScapMaps = JSON.parse(result.response.responseText)
    return new Map(apiScapMaps.map(apiScapMap => [apiScapMap.scapBenchmarkId, apiScapMap.benchmarkId]))
}

function readTextFileAsync(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
  
      reader.onload = () => {
        resolve(reader.result);
      };
  
      reader.onerror = reject;
  
      reader.readAsText(file);
    })
  }

