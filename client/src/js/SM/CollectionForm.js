'use strict'

Ext.ns('SM')
Ext.ns('SM.Collection')

SM.CollectionDescriptionTextArea = Ext.extend(Ext.form.TextArea, {
    initComponent: function () {
        const _this = this
        const config = {
            cls: 'sm-review-result-textarea',
            lastSavedData: "",
            allowBlank: true,
            fieldLabel: 'Description',
            labelSeparator: '',
            autoScroll: 'auto',
            enableKeyEvents: true
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.CollectionDescriptionTextArea.superclass.initComponent.call(this)
    }
})

SM.AccessLevelStrings = [
    'Undefined',
    'Restricted',
    'Full',
    'Manage',
    'Owner'
]

SM.AccessLevelField = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let _this = this
        this.includeOwnerGrant = !!this.includeOwnerGrant
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false,
            validator: (v) => {
                // Don't keep the form from validating when I'm not active
                if (_this.grid.editor.editing == false) {
                    return true
                }
                if (v === "") { return "Blank values not allowed" }
            }
        }

        let data = [
            [1, SM.AccessLevelStrings[1]],
            [2, SM.AccessLevelStrings[2]],
            [3, SM.AccessLevelStrings[3]]
        ]
        if (this.includeOwnerGrant) {
            data.push([4, SM.AccessLevelStrings[4]])
        } 
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(store.getAt(0).get('value'))
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AccessLevelField.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})
Ext.reg('sm-accesslevel-field', SM.AccessLevelField);

SM.MetadataGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const _this = this
        const fields = ['key', 'value']
        const newFields = ['key', 'value']
        const fieldsConstructor = Ext.data.Record.create(fields)
        this.newRecordConstructor = Ext.data.Record.create(newFields)
        this.editor = new Ext.ux.grid.RowEditor({
            saveText: 'Save',
            grid: this,
            clicksToEdit: 2,
            errorSummary: false, // don't display errors during validation monitoring
            listeners: {
                canceledit: function (editor, forced) {
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
                    let mc = record.store.data
                    let generatedId = record.id
                    record.id = record.data.key
                    record.phantom = false

                    delete mc.map[generatedId]
                    mc.map[record.id] = record
                    for (let x = 0, l = mc.keys.length; x < l; x++) {
                        if (mc.keys[x] === generatedId) {
                            mc.keys[x] = record.id
                        }
                    }
                    editor.grid.fireEvent('metadatachanged', editor.grid)
                }
            }
        })
        const writer = new Ext.data.DataWriter()
        const tbar = new SM.RowEditorToolbar({
            itemString: 'key',
            editor: this.editor,
            gridId: this.id,
            deleteProperty: 'key',
            newRecord: this.newRecordConstructor
        })
        const store = new Ext.data.ArrayStore({
            grid: this,
            writer: writer,
            autoSave: false,
            fields: fieldsConstructor,
            sortInfo: {
                field: 'key',
                direction: 'ASC'
            },
            root: '',
            restful: true,
            idProperty: 'key',
            listeners: {
                remove: (store, record, index) => {
                    store.grid.fireEvent('metadatachanged', store.grid)
                }
            }
        })
        const totalTextCmp = new SM.RowCountTextItem ({
            store,
            noun: 'key',
            iconCls: 'sm-database-save-icon'
        })
        const bbar = new Ext.Toolbar({
            items: [
                {
                    xtype: 'exportbutton',
                    hasMenu: false,
                    gridBasename: 'Metadata',
                    exportType: 'grid',
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
        })
        const view = new SM.ColumnFilters.GridView({
            emptyText: this.emptyText || 'No records to display',
            deferEmptyText: false,
            forceFit: true
        })
        const sm = new Ext.grid.RowSelectionModel({
            singleSelect: true,
            listeners: {
                selectionchange: function (sm) {
                    tbar.delButton.setDisabled(!sm.hasSelection())
                }
            }
        })
        const cm = new Ext.grid.ColumnModel({
            columns: [
                {
                    header: "Key",
                    dataIndex: 'key',
                    sortable: true,
                    width: 150,
                    editor: new Ext.form.TextField({
                        grid: this,
                        submitValue: false,
                        validator: function (v) {
                            // Don't keep the form from validating when I'm not active
                            if (this.grid.editor.editing == false) return true
                            
                            // blanks
                            if (v === "") return "Blank values not allowed"

                            // duplicates
                            // already in store?
                            const searchIdx = this.grid.store.findExact('key', v)
                            // is it this record?
                            const isMe = this.grid.selModel.isSelected(searchIdx)
                            if (!(searchIdx == -1 || isMe)) return "Duplicate keys not allowed"

                            // ignored key
                            if (_this.ignoreKeys.includes(v)) return "Reserved keys not allowed"

                            return true
                        }
                    })
                },
                {
                    header: "Value",
                    dataIndex: 'value',
                    sortable: false,
                    width: 250,
                    editor: new Ext.form.TextField({
                        submitValue: false
                    })
                }
            ]
        })
        tbar.delButton.disable()
        const config = {
            isFormField: true,
            ignoreKeys: _this.ignoreKeys || [],
            allowBlank: true,
            layout: 'fit',
            height: 150,
            plugins: [this.editor],
            store,
            view,
            sm,
            cm,
            tbar,
            bbar,
            getValue: function () {
                let value = {}
                this.store.data.items.forEach((i) => {
                    value[i.data.key] = i.data.value
                })
                return value
            },
            markInvalid: function () { },
            clearInvalid: function () { },
            isValid: function () {
                return true
            },
            disabled: false,
            getName: function () { return this.name },
            validate: function () { return true },
            setValue: function (v) {
                const entries = _this.ignoreKeys.length ? Object.entries(v).filter(entry =>  !_this.ignoreKeys.includes(entry[0])) : Object.entries(v)
                this.store.loadData(entries)
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.MetadataGrid.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-metadata-grid', SM.MetadataGrid)

SM.UserSelectionField = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let _this = this
        const userStore = new Ext.data.JsonStore({
            fields: [
                'userId',
                'username',
                'displayName'
            ],
            autoLoad: true,
            url: `${STIGMAN.Env.apiBase}/users`,
            root: '',
            sortInfo: {
                field: 'displayName',
                direction: 'ASC'
            },
            idProperty: 'userId'
        })
        const tpl = new Ext.XTemplate(
            '<tpl for=".">',
                '<div class="x-combo-list-item sm-users-icon sm-combo-list-icon"><span style="font-weight:600;">{[this.highlightQuery(values.displayName)]}</span><br>{[this.highlightQuery(values.username)]}</div>',
            '</tpl>',
            {
                highlightQuery: function (text) {
                    const re = new RegExp(_this.el.dom.value,'gi')
                    return text.replace(re,'<span class="sm-text-highlight">$&</span>')
                }
            }
        )
        const config = {
            store: userStore,
            tpl,
            filteringStore: this.filteringStore || null,
            displayField: 'displayName',
            valueField: 'userId',
            mode: 'local',
            forceSelection: true,
            typeAhead: true,
            minChars: 0,
            hideTrigger: false,
            triggerAction: 'query',
            validator: (v) => {
                // Don't keep the form from validating when I'm not active
                if (_this.grid.editor.editing == false) {
                    return true
                }
                if (v === "") { return "Blank values not allowed" }
            },
            onTypeAhead: function () {},
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
                                fn: (record) =>  this.filteringStore.indexOfId(record.id) === -1,
                                scope: this
                            }
                        )
                    }
                    if (q) {
                        // Include records that partially match the combo value
                        filters.push(
                            {
                                fn: (record) => record.data.displayName.includes(q) || record.data.username.includes(q),
                                scope: this
                            }
                        )
                    }
                    this.store.filter(filters)
                    this.onLoad()
				}
            },
            listeners: {
                afterrender: (combo) => {
                    combo.getEl().dom.setAttribute('spellcheck', 'false')
                }
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.UserSelectionField.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-user-selection-field', SM.UserSelectionField);

SM.UserGrantsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const _this = this
        this.canModifyOwners = !!this.canModifyOwners
        const newFields = [
            'userId',
            'username',
            'displayName',
            'accessLevel'
        ]
        this.newRecordConstructor = Ext.data.Record.create(newFields)

        this.proxy = new Ext.data.HttpProxy({
            restful: true,
            url: this.url,
            headers: { 'Content-Type': 'application/json;charset=utf-8' }
        })
        const grantStore = new Ext.data.JsonStore({
            grid: this,
            proxy: this.proxy,
            baseParams: this.baseParams,
            root: '',
            fields: newFields,
            idProperty: 'userId',
            sortInfo: {
                field: 'displayName',
                direction: 'ASC'
            },
            listeners: {
                load: function (store, records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                    store.grid.fireEvent('grantsremoved', store.grid)
                }
            }
        })
        const totalTextCmp = new SM.RowCountTextItem ({
            store: grantStore,
            noun: 'grant',
            iconCls: 'sm-users-icon'
        })
        const userSelectionField = new SM.UserSelectionField({
            submitValue: false,
            grid: this,
            getListParent: function() {
                return this.grid.editor.el;
            },
            filteringStore: grantStore
        })
        const accessLevelField = new SM.AccessLevelField({
            submitValue: false,
            grid: this,
            getListParent: function() {
                return this.grid.editor.el;
            },
            includeOwnerGrant: this.canModifyOwners
        })
        const columns = [
            {
                header: "User",
                width: 150,
                dataIndex: 'userId',
                sortable: true,
                renderer: function (v, m, r) {
                    return `<div class="x-combo-list-item sm-users-icon sm-combo-list-icon" exportValue="${r.data.displayName ?? ''}:${r.data.username ?? ''}"><span style="font-weight:600;">${r.data.displayName ?? ''}</span><br>${r.data.username ?? ''}</div>`
                },
                editor: userSelectionField
            },
            {
                header: '<span exportvalue="Access Level">Access Level<i class= "fa fa-question-circle sm-question-circle"></i></span>',
                width: 50,
                dataIndex: 'accessLevel',
                sortable: true,
                renderer: (v) => SM.AccessLevelStrings[v],
                editor: accessLevelField
            }
        ]
        this.editor = new Ext.ux.grid.RowEditor({
            saveText: 'Save',
            grid: this,
            userSelectionField: userSelectionField,
            accessLevelField: accessLevelField,
            clicksToEdit: 2,
            errorSummary: false, // don't display errors during validation monitoring
            listeners: {
                validateedit: function (editor, changes, record, index) {
                    // RowEditor unhelpfully sets changes.username to the userId value. 
                    if (changes.hasOwnProperty('username')) {
                        let userEditor = editor.userSelectionField
                        let userRecord = userEditor.store.getAt(userEditor.selectedIndex)
                        changes.username = userRecord.data.username
                        changes.userId = userRecord.data.userId
                    }
                },
                canceledit: function (editor, forced) {
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

                    const userComboBoxRecord = editor.userSelectionField.store.getById(record.data.userId)
                    const mc = record.store.data
                    const generatedId = record.id
                    record.id = record.data.userId
                    record.data.username = userComboBoxRecord.data.username
                    record.data.displayName = userComboBoxRecord.data.displayName
                    record.phantom = false
                    record.dirty = false
                    delete mc.map[generatedId]
                    mc.map[record.id] = record
                    for (let x = 0, l = mc.keys.length; x < l; x++) {
                        if (mc.keys[x] === generatedId) {
                            mc.keys[x] = record.id
                        }
                    }
                    if (_this.showAccessBtn) {
                        _this.accessBtn.setDisabled(record.data.accessLevel != 1)
                    }
                    editor.grid.fireEvent('grantschanged', editor.grid)
                },
                beforeedit: function (editor, rowIndex) {
                    if (editor.grid.store.getAt(rowIndex).data.accessLevel === 4 && !_this.canModifyOwners) {
                        return false
                    }
                    editor.userSelectionField.store.clearFilter()
                    editor.userSelectionField.setDisabled(!!editor.grid.store.getAt(rowIndex).data.userId)
                }
            }
        })
        const tbar = new SM.RowEditorToolbar({
            itemString: 'Grant',
            editor: this.editor,
            gridId: this.id,
            deleteProperty: 'userId',
            newRecord: this.newRecordConstructor
        })
        if (this.showAccessBtn) {
            tbar.addSeparator()
            this.accessBtn = tbar.addButton({
                iconCls: 'sm-asset-icon',
                disabled: true,
                text: 'User access...',
                handler: function () {
                    var r = _this.getSelectionModel().getSelected();
                    Ext.getBody().mask('Getting access list for ' + r.get('username') + '...');
                    showUserAccess(_this.collectionId, r.get('userId'));
                }
            })
        }
        const config = {
            isFormField: true,
            name: 'grants',
            allowBlank: false,
            layout: 'fit',
            height: 150,
            plugins: [this.editor],
            store: grantStore,
            cm: new Ext.grid.ColumnModel({
                columns: columns
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    selectionchange: function (sm) {
                        if (sm.hasSelection()){

                            let record = sm.getSelected()
                            if (_this.showAccessBtn) {
                                _this.accessBtn.setDisabled(record.data.accessLevel != 1)
                            }
                            if (record.data.accessLevel === 4 && !_this.canModifyOwners){
                                tbar.delButton.setDisabled(true)
                            }
                            else{
                                tbar.delButton.setDisabled(false)
                            }                            
                        }
                        else{
                            tbar.delButton.setDisabled(true)
                            _this.accessBtn?.setDisabled(true)
                        }
                }                    
                }
            }),
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit: true,
                markDirty: false,
                listeners: {
                refresh: function (view) {
                    // Setup the tooltip for column 'accessLevel'
                    const index = view.grid.getColumnModel().findColumnIndex('accessLevel')
                    const tipEl = view.getHeaderCell(index).getElementsByClassName('fa')[0]
                    if (tipEl) {
                      new Ext.ToolTip({
                        target: tipEl,
                        showDelay: 0,
                        dismissDelay: 0,
                        maxWidth: 600,
                        html: SM.TipContent.AccessLevels
                      })
                    }
                  },                 
                },
            }),
            tbar: tbar,
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'exportbutton',
                        hasMenu: false,
                        gridBasename: 'CollectionGrants',
                        exportType: 'grid',
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

            listeners: {
                viewready: function (grid) {
                  // Setup the tooltip for column 'accessLevel'
                  const index = grid.getColumnModel().findColumnIndex('accessLevel')
                  const tipEl = grid.view.getHeaderCell(index).getElementsByClassName('fa')[0]
                  if (tipEl) {
                    new Ext.ToolTip({
                      target: tipEl,
                      showDelay: 0,
                      dismissDelay: 0,
                      maxWidth: 600,
                      html: SM.TipContent.AccessLevels
                    })
                  }
                }
              },   

            getValue: function () {
                let grants = []
                grantStore.data.items.forEach((i) => {
                    grants.push({
                        userId: i.data.userId,
                        accessLevel: i.data.accessLevel
                    })
                })
                return grants
            },
            setValue: function (v) {
                const data = v.map((g) => ({
                    userId: g.user.userId,
                    username: g.user.username,
                    displayName: g.user.displayName,
                    accessLevel: g.accessLevel
                }))
                grantStore.loadData(data)
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
                const value = _this.getValue()
                const owners = value.filter(g => g.accessLevel === 4)
                return owners.length > 0
            },
            getName: () => this.name,
            validate: function () {
                let one = 1
            }
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.UserGrantsGrid.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-user-grants-grid', SM.UserGrantsGrid);

SM.Collection.CreateForm = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        const _this = this
        this.showGrantsOnly = this.showGrantsOnly ?? false
        const nameField = new Ext.form.TextField({
            fieldLabel: 'Name',
            labelStyle: 'font-weight: 600;',
            name: 'name',
            allowBlank: false,
            anchor: '100%',
            enableKeyEvents: true,
            keys: [
                {
                    key: Ext.EventObject.ENTER,
                    fn: (a, b, c) => {
                        let one = a
                        nameField.getEl().blur()
                    }
                }
            ],
            listeners: {
                specialkey: (field, e) => {
                    if (e.getKey() == e.ENTER) {
                        field.getEl().blur()
                    }
                },
                change: async (field, newValue, oldValue) => {
                    if (!newValue?.trim()) { // only spaces
                        field.setValue(oldValue)
                        return
                    }
                }
            }
        })
        const descriptionField = new Ext.form.TextArea({
            fieldLabel: 'Description',
            labelStyle: 'font-weight: 600;',
            name: 'description',
            anchor: '100% 0',
        })
        const metadataGrid = new SM.MetadataGrid({
            title: 'Metadata',
            iconCls: 'sm-database-save-icon',
            name: 'metadata',
            anchor: '100% 0',
            border: true,
            hidden: true
        })
        const settingsReviewFields = new SM.Collection.FieldSettings.ReviewFields({
            iconCls: 'sm-stig-icon',
            border: true,
            autoHeight: true
        })
        const settingsStatusFields = new SM.Collection.StatusSettings.StatusFields({
            iconCls: 'sm-star-icon-16',
            border: true,
            autoHeight: true
        })
        const settingsHistoryFields = new SM.Collection.HistorySettings.HistoryFields({
            iconCls: 'sm-history-icon',
            border: true,
            autoHeight: true
        })
        const grantGrid = new SM.UserGrantsGrid({
            iconCls: 'sm-users-icon',
			showAccessBtn: false,
            canModifyOwners: true,
			title: 'Grants',
			border: true,
            listeners: {
				grantschanged: grid => {
                    grid.getView().refresh()
				}
			}
		})
        const labelGrid = new SM.Collection.LabelsGrid({
			collectionId: 0,
            iconCls: 'sm-label-icon',
            title: 'Labels',
            border: true
        })

        const tabPanelItems = this.showGrantsOnly ? [grantGrid] : [
            grantGrid,
            {
                xtype: 'panel',
                title: 'Settings',
                layout: 'form',
                iconCls: 'sm-setting-icon',
                border: true,
                padding: 10,
                items: [
                    settingsReviewFields,
                    settingsStatusFields,
                    settingsHistoryFields
                ]
            },
            metadataGrid,
            labelGrid
        ]


        let config = {
            baseCls: 'x-plain',
            cls: 'sm-collection-manage-layout sm-round-panel',
            bodyStyle: 'padding: 9px;',
            border: false,
            labelWidth: 100,
            monitorValid: true,
            setFieldValues: function (apiCollection) {
                nameField.setValue(apiCollection.name)
                descriptionField.setValue(apiCollection.description)
                metadataGrid.setValue(apiCollection.metadata)
                settingsReviewFields.setValues(apiCollection.settings.fields)
                settingsStatusFields.setValues(apiCollection.settings.status)
                settingsHistoryFields.setValues(apiCollection.settings.history)
                grantGrid.setValue(apiCollection.grants)
                labelGrid.setValue(apiCollection.labels)
            },
            getFieldValues: function (dirtyOnly) {
                // Override Ext.form.FormPanel implementation to check submitValue
                // and to create metadata from the review fields configuration
                let o = {}, n, key, val;
                this.items.each(function (f) {
                    if (f.submitValue !== false && !f.disabled && (dirtyOnly !== true || f.isDirty())) {
                        n = f.getName()
                        key = o[n]
                        val = f.getValue()
                        if (Ext.isDefined(key)) {
                            if (Ext.isArray(key)) {
                                o[n].push(val);
                            } else {
                                o[n] = [key, val]
                            }
                        } else {
                            o[n] = val
                        }
                    }
                })
                o.settings = {
                    fields: settingsReviewFields.serialize(),
                    status: settingsStatusFields.serialize(),
                    history: settingsHistoryFields.serialize()
                }
                delete o.commentEnabled
                delete o.commentRequired
                delete o.detailEnabled
                delete o.detailRequired
                delete o.canAccept
                delete o.minAcceptGrant
                delete o.resetCriteria
                delete o.maxReviews
                delete o['undefined']

                o.metadata = o.metadata ?? metadataGrid.getValue()
                o.labels = o.labels ?? labelGrid.getValue()

                return o
            },
            items: [
                {
                    layout: 'border',
                    anchor: '100% 0',
                    hideLabels: true,
                    border: false,
                    baseCls: 'x-plain',
                    items: [
                        {
                            layoutConfig: {
                                getLayoutTargetSize : function() {
                                  var target = this.container.getLayoutTarget(), ret = {};
                                  if (target) {
                                      ret = target.getViewSize();
                          
                                      // IE in strict mode will return a width of 0 on the 1st pass of getViewSize.
                                      // Use getStyleSize to verify the 0 width, the adjustment pass will then work properly
                                      // with getViewSize
                                      if (Ext.isIE9m && Ext.isStrict && ret.width == 0){
                                          ret =  target.getStyleSize();
                                      }
                                      ret.width -= target.getPadding('lr');
                                      ret.height -= target.getPadding('tb');
                                      // change in this override to account for space used by 
                                      // the Result combo box and the 4px bottom-margin of each textarea
                                      ret.height -= 30 
                                  }
                                  return ret;
                                }
                            }, 
                            xtype: 'fieldset',
                            region: 'north',
                            height: 180,
                            split: false,
                            title: 'Information',
                            items: [ nameField, descriptionField]
                        },
                        {
                            xtype: 'tabpanel',
                            style: {
                                paddingTop: "10px"
                            },
                            region: 'center',
                            activeTab: 0,
                            border: false,
                            items: tabPanelItems
                        }
                    ]
                }
            ],
            buttons: [{
                text: this.btnText || 'Save',
                formBind: true,
                handler: this.btnHandler || function () { }
            }]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.CreateForm.superclass.initComponent.call(this);
    }
})

SM.Collection.ManagePanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        let _this = this
        this.canModifyOwners = !!this.canModifyOwners
        async function apiPatchSettings(value) {
            const apiCollection = await Ext.Ajax.requestPromise({
                responseType: 'json',
                url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
                method: 'PATCH',
                jsonData: {
                    settings: value
                }
            })
            return apiCollection || undefined
        }
        async function apiPutImportOptions(value) {
            await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/metadata/keys/importOptions`,
                method: 'PUT',
                jsonData: JSON.stringify(value)
            })
            SM.Dispatcher.fireEvent('importoptionschanged', _this.collectionId, value)
        }
        async function updateSettings() {
            const apiCollection =  await apiPatchSettings({
                fields: settingsReviewFields.serialize(),
                status: settingsStatusFields.serialize(),
                history: settingsHistoryFields.serialize()                 
            })
            return apiCollection
        }

        const nameField = new Ext.form.TextField({
            fieldLabel: 'Name',
            labelStyle: 'font-weight: 600;',
            value: _this.apiCollection?.name,
            name: 'name',
            allowBlank: false,
            anchor: '-5',
            enableKeyEvents: true,
            keys: [
                {
                    key: Ext.EventObject.ENTER,
                    fn: (a, b, c) => {
                        let one = a
                        nameField.getEl().blur()
                    }
                }
            ],
            listeners: {
                specialkey: (field, e) => {
                    if (e.getKey() == e.ENTER) {
                        field.getEl().blur()
                    }
                },
                change: async (field, newValue, oldValue) => {
                    if (!newValue?.trim()) { // only spaces
                        field.setValue(oldValue)
                        return
                    }
                    try {
                        let apiCollection = await Ext.Ajax.requestPromise({
                            responseType: 'json',
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
                            method: 'PATCH',
                            params: {
                                projection: 'labels'
                            },
                            jsonData: {
                                name: newValue.trim()
                            }
                        })
                        SM.Dispatcher.fireEvent('collectionchanged', apiCollection)
                    }
                    catch (e) {
                        field.setValue(oldValue)
                        SM.Error.handleError(e)
                    }
                }
            }
        })          
        const descriptionField = new Ext.form.TextArea({
            fieldLabel: 'Description',
            labelStyle: 'font-weight: 600;',
            value: _this.apiCollection?.description,
            name: 'description',
            anchor: '-5 -35',
            listeners: {
                change: async (field, newValue, oldValue) => {
                    try {
                        await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
                            method: 'PATCH',
                            jsonData: {
                                description: newValue.trim()
                            }
                        })
                    }
                    catch (e) {
                        field.setValue(oldValue)
                        SM.Error.handleError(e)
                    }
                }
            }
        })
        const metadataGrid = new SM.MetadataGrid({
            title: 'Metadata',
            iconCls: 'sm-database-save-icon',
            name: 'metadata',
            border: false,
            listeners: {
                metadatachanged: async grid => {
                    try {
                        const data = grid.getValue()
                        const result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/metadata`,
                            method: 'PUT',
                            jsonData: data
                        })
                        const sortstate = grid.store.getSortState()
                        grid.store.sort([sortstate])
                    }
                    catch (e) {
                        SM.Error.handleError(e)
                    }
                }
            }

        })
        metadataGrid.setValue(_this.apiCollection.metadata)

        const settingsReviewFields = new SM.Collection.FieldSettings.ReviewFields({
            iconCls: 'sm-stig-icon',
            fieldSettings: _this.apiCollection?.settings?.fields,
            border: true,
            onFieldSelect: async function (fieldset) {
                try {
                    const apiCollection = await updateSettings()
                    SM.Dispatcher.fireEvent('fieldsettingschanged', _this.apiCollection.collectionId, apiCollection.settings.fields)
                    SM.Dispatcher.fireEvent('collectionchanged', apiCollection)
                }
                catch (e) {
                    SM.Error.handleError(e)
                }
            }
        })
        const settingsStatusFields = new SM.Collection.StatusSettings.StatusFields({
            iconCls: 'sm-star-icon-16',
            statusSettings: _this.apiCollection?.settings?.status,
            border: true,
            autoHeight: true,
            onFieldsUpdate: async function (fieldset) {
                try {
                    const apiCollection = await updateSettings()
                    SM.Dispatcher.fireEvent('statussettingschanged', _this.apiCollection.collectionId, apiCollection.settings.status)
                    SM.Dispatcher.fireEvent('collectionchanged', apiCollection)
                }
                catch (e) {
                    SM.Error.handleError(e)
                }
            }
        })
        const settingsHistoryFields = new SM.Collection.HistorySettings.HistoryFields({
            iconCls: 'sm-history-icon',
            historySettings: _this.apiCollection?.settings?.history,
            border: true,
            autoHeight: true,
            onFieldsUpdate: async function (fieldset) {
                try {
                    const apiCollection = await updateSettings()
                    SM.Dispatcher.fireEvent('collectionchanged', apiCollection)
                }
                catch (e) {
                    SM.Error.handleError(e)
                }
            }
        })
        const settingsImportOptions = new SM.ReviewsImport.ParseOptionsFieldSet({
            iconCls: 'sm-import-icon',
            initialOptions: SM.safeJSONParse(_this.apiCollection?.metadata?.importOptions),
            canAccept: true,
            onOptionChanged: async function (fieldset) {
                try {
                    await apiPutImportOptions(JSON.stringify(fieldset.getOptions()))
                }
                catch (e) {
                    SM.Error.handleError(e)
                }
            }
        })

        const grantHandler = async grid => {
            try {
                let data = grid.getValue()
                let result = await Ext.Ajax.requestPromise({
                    url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}?projection=grants`,
                    method: 'PATCH',
                    jsonData: {
                        grants: data
                    }
                })
                let collection = JSON.parse(result.response.responseText)
                grid.setValue(collection.grants)
            }
            catch (e) {
                SM.Error.handleError(e)
            }
        }

        const grantGrid = new SM.UserGrantsGrid({
			collectionId: _this.apiCollection.collectionId,
            iconCls: 'sm-users-icon',
			showAccessBtn: true,
            canModifyOwners: this.canModifyOwners,
			url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}`,
			baseParams: {
				projection: 'grants'
			},
			title: 'Grants',
			border: false,
			listeners: {
				grantschanged: grantHandler,
                grantsremoved: grantHandler
			}
		})
		grantGrid.setValue(_this.apiCollection.grants)

        this.labelGrid = new SM.Collection.LabelsGrid({
			collectionId: _this.apiCollection.collectionId,
            iconCls: 'sm-label-icon',
            title: 'Labels',
            border: false,
            listeners: {
                labeldeleted: async (labelId) => {
                    try {
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}/labels/${labelId}`,
                            method: 'DELETE'
                        })

                        // Let the rest of the app know
                        SM.Dispatcher.fireEvent('labeldeleted', _this.apiCollection.collectionId, labelId)
                    }
                    catch (e) {
                        SM.Error.handleError(e)
                    }
				},
				labelchanged: async (grid, record) => {
                    try {
                        const {labelId, uses, ...labelData} = record.data
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}/labels/${labelId}`,
                            method: 'PATCH',
                            jsonData: labelData
                        })
                        const sortState = grid.store.getSortState()
                        grid.store.sort(sortState.field, sortState.direction)

                        // Let the rest of the app know
                        const newlabel = JSON.parse(result.response.responseText)
                        SM.Dispatcher.fireEvent('labelchanged',  _this.apiCollection.collectionId, newlabel)
                    }
                    catch (e) {
                        SM.Error.handleError(e)
                    }
				},
                labelcreated: async (grid, record) => {
                    try {
                        const {labelId, uses, ...labelData} = record.data
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}/labels`,
                            method: 'POST',
                            jsonData: labelData
                        })
                        const label = JSON.parse(result.response.responseText)
                        record.data.labelId = label.labelId
                        record.data.uses = label.uses
                        record.commit()
                        const sortState = grid.store.getSortState()
                        grid.store.sort(sortState.field, sortState.direction)

                        // Let the rest of the app know
                        const modlabel = JSON.parse(result.response.responseText)
                        // modlabel.collectionId = _this.apiCollection.collectionId
                        SM.Dispatcher.fireEvent('labelcreated', _this.apiCollection.collectionId, modlabel)
                        
                    }
                    catch (e) {
                        SM.Error.handleError(e)
                    }
                }
            }
        })
        this.labelGrid.setValue(_this.apiCollection.labels)

        const tools = []
        if (this.allowDelete) {
            tools.push({
                id: 'trash',
                qtip: 'Delete',
                handler: async function () {
                    try {
                        var confirmStr = "Deleting this Collection will <b>permanently remove</b> all data associated with the Collection. This includes all Assets and their associated assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to delete the Collection?";
                        Ext.Msg.confirm("Confirm", confirmStr, async function (btn, text) {
                            if (btn == 'yes') {
                                let result = await Ext.Ajax.requestPromise({
                                    url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
                                    method: 'DELETE'
                                })
                                let apiCollection = JSON.parse(result.response.responseText)
                                SM.Dispatcher.fireEvent('collectiondeleted', apiCollection.collectionId)
                            }
                        })
                    }
                    catch (e) {
                        SM.Error.handleError(e)
                    }
                }
            })
        }
        if (this.allowClone) {
            tools.push({
                id: 'clone',
                qtip: 'Clone',
                handler: async function () {
                    try {
                        await SM.CollectionClone.showCollectionClone({
                            collectionId: _this.collectionId,
                            sourceName: nameField.getValue()
                        })
                    }
                    catch (e) {
                        SM.Error.handleError(e)
                    }
                }
            })
        }
   
        let config = {
            title: this.title || 'Collection properties',
            collapseFirst: false,
            tools,
            layout: 'border',
            cls: 'sm-collection-manage-layout sm-round-panel',
            getFieldValues: function (dirtyOnly) {
                // Override Ext.form.FormPanel implementation to check submitValue
                let o = {}, n, key, val;
                this.items.each(function (f) {
                    if (f.submitValue !== false && !f.disabled && (dirtyOnly !== true || f.isDirty())) {
                        n = f.getName()
                        key = o[n]
                        val = f.getValue()
                        if (Ext.isDefined(key)) {
                            if (Ext.isArray(key)) {
                                o[n].push(val);
                            } else {
                                o[n] = [key, val]
                            }
                        } else {
                            o[n] = val
                        }
                    }
                })
                return o
            },
            items: [
                {
                    xtype: 'panel',
                    border: false,
                    region: 'north',
                    height: 160,
                    layout: 'form',
                    margins: '15 15 15 15',
                    items: [ nameField, descriptionField]
                },
                {
                    xtype: 'tabpanel',
                    region: 'center',
                    activeTab: 0,
                    border: false,
                    items: [ 
                        grantGrid,
                        {
                            xtype: 'panel',
                            bodyStyle: {
                                overflowY: 'auto',
                                overflowX: 'hidden'
                            },
                            title: 'Settings',
                            layout: 'form',
                            iconCls: 'sm-setting-icon',
                            border: false,
                            padding: 10,
                            items: [
                                settingsReviewFields,
                                settingsStatusFields,
                                settingsHistoryFields,
                                settingsImportOptions
                            ]
                        },
                        metadataGrid,
                        this.labelGrid
                    ]      
                        
                }

            ]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.ManagePanel.superclass.initComponent.call(this);
    }
})


Ext.reg('sm-collection-panel', SM.Collection.ManagePanel);

Ext.ns('SM.Collection.FieldSettings')

SM.Collection.FieldSettings.FieldEnabledComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false
        }
        let _this = this
        let data = [
            ['always', 'Always'],
            ['findings', 'Findings only']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.FieldSettings.FieldEnabledComboBox.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})
Ext.reg('sm-field-enabled-combo', SM.Collection.FieldSettings.FieldEnabledComboBox)

SM.Collection.FieldSettings.FieldRequiredComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let _this = this
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false
        }
        let dataAlways = [
            ['always', 'Always'],
            ['findings', 'Findings only'],
            ['optional', 'Optional']
        ]
        let dataFails = [
            ['findings', 'Findings only'],
            ['optional', 'Optional']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        this.setListByEnabledValue = function (enabledValue) {
            const currentValue = _this.value || 'always'
            if (enabledValue === 'findings') {
                _this.store.loadData(dataFails)
                if (currentValue === 'always') {
                    _this.setValue('findings')
                }
                else {
                    _this.setValue(currentValue)
                }
            }
            else {
                _this.store.loadData(dataAlways)
                _this.setValue(currentValue)
            }
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.FieldSettings.FieldRequiredComboBox.superclass.initComponent.call(this)

        this.setListByEnabledValue(this.enabledField?.value || 'always')

    }
})
Ext.reg('sm-field-required-combo', SM.Collection.FieldSettings.FieldRequiredComboBox)

SM.Collection.FieldSettings.ReviewFields = Ext.extend(Ext.form.FieldSet, {
    initComponent: function () {
        const _this = this
        _this.fieldSettings = _this.fieldSettings ?? {
            detail: {
                enabled: 'always',
                required: 'always'
            },
            comment: {
                enabled: 'findings',
                required: 'findings'
            }
        }
        const detailEnabledCombo = new SM.Collection.FieldSettings.FieldEnabledComboBox({
            name: 'detailEnabled',
            value: _this.fieldSettings.detail.enabled,
            anchor: '-10',
            listeners: {
                select: onSelect
            }
        })
        const detailRequiredCombo = new SM.Collection.FieldSettings.FieldRequiredComboBox({
            name: 'detailRequired',
            enabledField: detailEnabledCombo,
            value: _this.fieldSettings.detail.required,
            anchor: '-5',
            listeners: {
                select: onSelect
            }
        })
        detailEnabledCombo.requiredField = detailRequiredCombo

        const commentEnabledCombo = new SM.Collection.FieldSettings.FieldEnabledComboBox({
            name: 'commentEnabled',
            value: _this.fieldSettings.comment.enabled,
            anchor: '-10',
            listeners: {
                select: onSelect
            }
        })
        const commentRequiredCombo = new SM.Collection.FieldSettings.FieldRequiredComboBox({
            name: 'commentRequired',
            enabledField: commentEnabledCombo,
            value: _this.fieldSettings.comment.required,
            anchor: '-5',
            listeners: {
                select: onSelect
            }
        })
        commentEnabledCombo.requiredField = commentRequiredCombo

        _this.serialize = function () {
            return {
                comment: {
                    enabled: commentEnabledCombo.value,
                    required: commentRequiredCombo.value
                },
                detail: {
                    enabled: detailEnabledCombo.value,
                    required: detailRequiredCombo.value
                }
            }
        }

        _this.setValues = function (values) {
            detailEnabledCombo.setValue(values.detail.enabled)
            detailRequiredCombo.setValue(values.detail.required)
            commentEnabledCombo.setValue(values.comment.enabled)
            commentRequiredCombo.setValue(values.comment.required)
        }

        function onSelect(item, record, index) {
            if (item.name === 'detailEnabled' || item.name === 'commentEnabled') {
                item.requiredField.setListByEnabledValue(item.value)
            }
            _this.onFieldSelect && _this.onFieldSelect(_this, item, record, index)
        }

        let config = {
            title: _this.title || 'Review fields',
            labelWidth: 0,
            hideLabels: true,
            items: [
                {
                    layout: 'column',
                    baseCls: 'x-plain',
                    items: [
                        {
                            width: 140,
                            layout: 'form',
                            hideLabels: true,
                            border: false,
                            items: [
                                {
                                    xtype: 'displayfield',
                                    submitValue: false,
                                    value: '<span style="font-weight: 600;">Field</span>'
                                },
                                {
                                    xtype: 'displayfield',
                                    submitValue: false,
                                    value: 'Detail',
                                    height: 22
                                },

                                {
                                    xtype: 'displayfield',
                                    submitValue: false,
                                    value: 'Comment',
                                    height: 22
                                }
                            ]
                        },
                        {
                            columnWidth: .5,
                            border: false,
                            hideLabels: true,
                            layout: 'form',
                            items: [
                                {
                                    xtype: 'displayfield',
                                    submitValue: false,
                                    value: '<span style="font-weight: 600;">Enabled</span>'
                                },
                                detailEnabledCombo,
                                commentEnabledCombo
                            ]
                        },
                        {
                            columnWidth: .5,
                            layout: 'form',
                            hideLabels: true,
                            border: false,
                            items: [
                                {
                                    xtype: 'displayfield',
                                    submitValue: false,
                                    value: '<span style="font-weight: 600;">Required to submit</span>'
                                },
                                detailRequiredCombo,
                                commentRequiredCombo,
                            ]
                        }
                    ]
                }
            ]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.FieldSettings.ReviewFields.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-collection-settings-review-fields', SM.Collection.FieldSettings.ReviewFields)

Ext.ns('SM.Collection.StatusSettings')
SM.Collection.StatusSettings.AcceptCheckbox = Ext.extend(Ext.form.Checkbox, {
    initComponent: function () {
        const _this = this
        const config = {
            boxLabel: this.boxLabel || 'Accept or Reject reviews'
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.StatusSettings.AcceptCheckbox.superclass.initComponent.call(this)
    }
})

SM.Collection.StatusSettings.GrantComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false
        }
        let _this = this
        let data = [
            [3, 'Manage or Owner'],
            [4, 'Owner']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.StatusSettings.GrantComboBox.superclass.initComponent.call(this)
        this.store.loadData(data)
    }
})

SM.Collection.StatusSettings.CriteriaComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false
        }
        let _this = this
        let data = [
            ['result', 'Review result'],
            ['any', 'any Review field']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        this.store.on('load', function (store) {
            _this.setValue(_this.value)
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.StatusSettings.CriteriaComboBox.superclass.initComponent.call(this)
        this.store.loadData(data)
    }
})

SM.Collection.StatusSettings.StatusFields = Ext.extend(Ext.form.FieldSet, {
    initComponent: function () {
        const _this = this
        _this.statusSettings = _this.statusSettings ?? {
            canAccept: true,
            minAcceptGrant: 3,
            resetCriteria: 'result'
        }
        const canAcceptCheckbox = new SM.Collection.StatusSettings.AcceptCheckbox({
            name: 'canAccept',
            ctCls: 'sm-cb',
            hideLabel: true,
            boxLabel: 'Reviews can be Accepted or Rejected',
            checked: _this.statusSettings.canAccept,
            listeners: {
                check: onStatusCheck
            }
        })
        const grantComboBox = new SM.Collection.StatusSettings.GrantComboBox({
            name: 'minAcceptGrant',
            fieldLabel: '<span>Grant required to set Accept or Reject</span>', 
            disabled: !_this.statusSettings.canAccept,
            width: 125,
            value: _this.statusSettings.minAcceptGrant,
            listeners: {
                select: onComboSelect
            }
        })

        const criteriaComboBox = new SM.Collection.StatusSettings.CriteriaComboBox({
            name: 'resetCriteria',
            fieldLabel: 'Reset to <img src="img/save-icon.svg" width=12 height=12 ext:qtip="Saved" style="padding: 1px 3px 0px 0px;vertical-align:text-top;"/>Saved upon change to', 
            width: 125,
            value: _this.statusSettings.resetCriteria || 'result',
            listeners: {
                select: onComboSelect
            }
        })

        _this.serialize = function () {
            const output = {}
            const items = [
                criteriaComboBox,
                canAcceptCheckbox,
                grantComboBox
            ]
            for (const item of items) {
                output[item.name] = item.getValue()
            }
            return output
        }

        _this.setValues = function (values) {
            criteriaComboBox.setValue(values.resetCriteria || 'result')
            canAcceptCheckbox.setValue(values.canAccept || false)
            grantComboBox.setValue(values.minAcceptGrant || 3)
            grantComboBox.setDisabled(!values.canAccept)
        }

        function onStatusCheck(item, checked) {
            grantComboBox.setDisabled(!checked)
            _this.onFieldsUpdate && _this.onFieldsUpdate(_this, item, checked)
        }

        function onComboSelect(item, record, index) {
            _this.onFieldsUpdate && _this.onFieldsUpdate(_this, item, record)
        }

        let config = {
            title: _this.title || 'Review status',
            labelWidth: 220,
            items: [
                criteriaComboBox,
                canAcceptCheckbox,
                grantComboBox      
            ]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.StatusSettings.StatusFields.superclass.initComponent.call(this);
    }
})

Ext.ns('SM.Collection.HistorySettings')
SM.Collection.HistorySettings.MaxReviewsComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false
        }
        let _this = this
        let data = [
            [0, 'disabled']
        ]
        for (let limit = 1; limit < 16; limit++) {
            data.push([limit, `capped at ${limit}`])
        }
        this.store = new Ext.data.SimpleStore({
            fields: ['value', 'display']
        })
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.HistorySettings.MaxReviewsComboBox.superclass.initComponent.call(this)
        this.store.loadData(data)
    }
})
SM.Collection.HistorySettings.HistoryFields = Ext.extend(Ext.form.FieldSet, {
    initComponent: function () {
        const _this = this
        _this.historySettings = _this.historySettings ?? {
            maxReviews: 5
        }
        const maxReviewsComboBox = new SM.Collection.HistorySettings.MaxReviewsComboBox({
            name: 'maxReviews',
            fieldLabel: 'Asset/Rule history records are', 
            width: 125,
            value: _this.historySettings.maxReviews,
            listeners: {
                select: onComboSelect
            }
        })

        _this.serialize = function () {
            const output = {}
            const items = [
                maxReviewsComboBox
            ]
            for (const item of items) {
                output[item.name] = item.getValue()
            }
            return output
        }

        _this.setValues = function (values) {
            maxReviewsComboBox.setValue(values.maxReviews || 5)
        }

        function onComboSelect(item, record, index) {
            _this.onFieldsUpdate && _this.onFieldsUpdate(_this, item, record)
        }

        let config = {
            title: _this.title || 'Review history',
            labelWidth: 200,
            items: [
                maxReviewsComboBox      
            ]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.HistorySettings.HistoryFields.superclass.initComponent.call(this);
    }
})

SM.getContrastYIQ = function (hexcolor){
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);
	var yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? '#080808' : '#f7f7f7';
}

SM.Collection.LabelSpriteHtml = `<span class="sm-label-sprite {extraCls}" style="color:
    {[SM.getContrastYIQ(values.color)]};background-color: #{color};" 
    ext:qtip="{[SM.he(SM.he(values.description))]}">
    <tpl if="values.isUnlabeled===true"><i></tpl>
    {[SM.he(values.name)]}
    <tpl if="values.isUnlabeled===true"></i></tpl>
    </span>`

SM.Collection.LabelTpl = new Ext.XTemplate(
    SM.Collection.LabelSpriteHtml
)
SM.Collection.LabelArrayTpl = new Ext.XTemplate(
    '<tpl for=".">',
    `${SM.Collection.LabelSpriteHtml} `,
    '</tpl>'
)

SM.Collection.LabelSpritesByCollectionLabelId = function (collectionId, labelIds) {
    let labels = []
    let includeUnlabeled = false
    for (const labelId of labelIds) {
        if (labelId === null) {
            includeUnlabeled = true
        }
        const label = SM.Cache.getCollectionLabel(collectionId, labelId)
        if (label) labels.push(label)
    }
    labels.sort((a, b) => a.name.localeCompare(b.name))
    if (includeUnlabeled) {
        labels = [
            {
                color: '000000',
                name: 'no label',
                isUnlabeled: true
            },
            ...labels
        ]
    }
    return SM.Collection.LabelArrayTpl.apply(labels)
}

SM.Collection.LabelEditTpl = new Ext.XTemplate(
    '<span class=sm-label-sprite style="color:{[SM.getContrastYIQ(values.color)]};background-color:#{color};">{[SM.he(values.name)]}</span><img class="sm-label-edit-color" src="img/color-picker.svg" width="12" height="12">'
)

SM.Collection.ColorMenu = Ext.extend(Ext.menu.Menu, {
    enableScrolling : false,
    hideOnClick : true,
    cls : 'x-color-menu',
    paletteId : null,
    
    initComponent : function(){
        Ext.apply(this, {
            plain: true,
            showSeparator: false,
            items: this.palette = new Ext.ColorPalette(Ext.applyIf({
                id: this.paletteId,
                renderTo: null,
                colors: [
                    '4568F2', '7000FF', 'E46300', '8A5000', '019900', 'DF584B', 
                    '99CCFF', 'D1ADFF', 'FFC399', 'FFF699', 'A3EA8F', 'F5A3A3', 
                ]
            }, this.initialConfig))
        })
        this.palette.purgeListeners()
        Ext.menu.ColorMenu.superclass.initComponent.call(this)
        this.relayEvents(this.palette, ['select'])
        this.on('select', this.menuHide, this);
        if(this.handler){
            this.on('select', this.handler, this.scope || this)
        }
    },

    menuHide : function(){
        if(this.hideOnClick){
            this.hide(true)
        }
    }
})


SM.Collection.LabelNameEditor = Ext.extend(Ext.form.Field, {
    defaultAutoCreate : {tag: "div"},
    submitValue: false,
    initComponent: function () {
        SM.Collection.LabelNameEditor.superclass.initComponent.call(this)
    },
    setValue: function () {
        if (this.rendered) {
            const data = this.ownerCt.record.data
            this.namefield.setValue(data.name)
            this.previewfield.update({
                name: data.name,
                color: data.color
            })
            this.previewfield.color = data.color
        }
    },
    getValue: function () {
        return {
            name: this.namefield.getValue(),
            color: this.previewfield.color
        }
    },
    onRender: function (ct, position) {
        SM.Collection.LabelNameEditor.superclass.onRender.call(this, ct, position);
        const _this = this
        const cpm = new SM.Collection.ColorMenu({
            submitValue: false,
            renderTo: this.grid.editor.el,
            listeners: {
                select: function (palette, color) {
                    _this.previewfield.color = color
                    _this.previewfield.update({
                        name: _this.namefield.getValue(),
                        color
                    })
                },
                mouseover: function (menu, e, item) {
                    let one = 1
                },
                beforeshow: function (menu) {
                    let one = 1
                }
            }
        })
        this.grid.editor.cpm = cpm
        this.namefield = new Ext.form.TextField({
            value: this.ownerCt.record.data.name,
            anchor: '100%',
            align: 'stretch',
            allowBlank: false,
            maxLength: 16,
            enableKeyEvents: true,
            validator: function (v) {
                // Don't keep the form from validating when I'm not active
                if (_this.grid.editor.editing == false) {
                    return true
                }
                if (v === "") { return "Blank values not allowed" }
                // Is there an item in the store like _this?
                let searchIdx = _this.grid.store.findExact('name', v)
                // Is it _this?
                let isMe = _this.grid.selModel.isSelected(searchIdx)
                if (searchIdx == -1 || isMe) {
                    return true
                } else {
                    return "Duplicate names not allowed"
                }
            },
            listeners: {
                keyup: function (field, e) {
                    _this.previewfield.update({
                        name: field.getValue(),
                        color: _this.previewfield.color
                    })
                }
            }
        })
        this.isValid = function (preventMark) {
            return this.namefield.isValid(preventMark)
        }

        this.previewfield = new Ext.form.DisplayField({
            submitValue: false,
            tpl: SM.Collection.LabelEditTpl,
            data: {
                name: this.ownerCt.record.data.name,
                color: this.ownerCt.record.data.color
            },
            color: this.ownerCt.record.data.color,
            anchor: '100%',
            getValue: function () { 
                return this.color
            },
            listeners: {
                render: function (field, owner) {
                    field.el.addListener('click', (e) => {
                        if (e.target.tagName === 'IMG') {
                            cpm.showAt(e.xy)
                            cpm.palette.select(_this.previewfield.color, true) //suppress event
                        }
                    })
                }
            }
        })

        this.panel = new Ext.Panel({
            renderTo: this.el,
            height: 50,
            width: this.width,
            border: false,
            layout: 'form',
            layoutConfig: {
                hideLabels: true
            },
            bodyStyle: 'background-color: transparent;',
            items: [
                this.namefield,
                this.previewfield
            ]
        })
    },
    focus : function(selectText, delay){
        if(delay){
            this.focusTask = new Ext.util.DelayedTask(this.focus, this, [selectText, false]);
            this.focusTask.delay(Ext.isNumber(delay) ? delay : 10);
            return this;
        }
        if(this.rendered && !this.isDestroyed){
            this.namefield.el.focus();
            if(selectText === true){
                this.namefield.el.dom.select();
            }
        }
        return this;
    }
})

SM.Collection.LabelsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function () {
        const _this = this
        let fields = [
            {
                name: 'labelId',
                type: 'string',
            },
            {
                name: 'name',
                type: 'string'
            },
            {
                name: 'description',
                type: 'string'
            },
            {
                name: 'color',
               type: 'string'
            },
            {
                name: 'uses',
               type: 'integer'
            }
       ]
        this.newRecordConstructor = Ext.data.Record.create([            {
            name: 'name',
            type: 'string'
        },
        {
            name: 'description',
            type: 'string'
        },
        {
             name: 'color',
            type: 'string'
        }
        ])
        this.editor = new Ext.ux.grid.RowEditor({
            saveText: 'Save',
            grid: this,
            clicksToEdit: 2,
            errorSummary: false, // don't display errors during validation monitoring
            listeners: {
                validateedit: function (editor, changes, record, index) {
                    // transform record
                    changes.color = changes.name.color
                    changes.name = changes.name.name
                },
                canceledit: function (editor, forced) {
                    // The 'editing' property is set by RowEditorToolbar.js
                    if (editor.record.editing === true) { // was the edit on a new record?
                        this.grid.store.suspendEvents(false);
                        this.grid.store.remove(editor.record);
                        this.grid.store.resumeEvents();
                        this.grid.getView().refresh();
                    }
                },
                afteredit: function (editor, changes, record, index) {
                    editor.grid.fireEvent(
                        record.data.labelId ? 'labelchanged' : 'labelcreated',
                        editor.grid,
                        record
                    )
                }
            }
        })
        const labelStore = new Ext.data.JsonStore({
            grid: this,
            baseParams: this.baseParams,
            root: '',
            fields,
            idProperty: 'labelId',
            sortInfo: {
                field: 'name',
                direction: 'ASC'
            },
            listeners: {
                remove: function (store, record, index) {
                    _this.fireEvent('labeldeleted', record.data.labelId)
                }
            }
        })

        const columns = [
            {
                header: "Name",
                width: 50,
                dataIndex: 'name',
                sortable: true,
                renderer: function (v, params, record) {
                    return SM.Collection.LabelTpl.apply({
                        color: record.data.color,
                        name: v,
                        description: ''
                    })
                },
                editor: new SM.Collection.LabelNameEditor({
                    grid: this
                })
            },
            {
                header: "Description",
                width: 70,
                dataIndex: 'description',
                sortable: false,
                editor: new Ext.form.TextField({submitValue: false})
            },
            {
                header: '<img exportValue= "AssetCount" src="img/target.svg" width=12 height=12>',
                width: 15,
                dataIndex: 'uses',
                align: 'center',
                sortable: true,
                renderer: SM.styledZeroRenderer
            }
        ]
        const tbar = new SM.RowEditorToolbar({
            itemString: 'Label',
            editor: this.editor,
            gridId: this.id,
            deleteProperty: 'name',
            newRecord: this.newRecordConstructor,
            newRecordValues: {
                name: '',
                description: '',
                color: '99CCFF'
            }
        })
        tbar.addSeparator()
        this.assetBtn = tbar.addButton({
            iconCls: 'sm-asset-icon',
            disabled: true,
            text: 'Tag Assets...',
            handler: function () {
                var r = _this.getSelectionModel().getSelected();
                SM.Collection.showLabelAssetsWindow(_this.collectionId, r.get('labelId'));
            }
        })

        const cm = new Ext.grid.ColumnModel({
            columns
        })
        const sm = new Ext.grid.RowSelectionModel({
            singleSelect: true,
            listeners: {
                selectionchange: function (sm) {
                    tbar.delButton.setDisabled(!sm.hasSelection())
                    _this.assetBtn.setDisabled(!sm.hasSelection())
                }
            }
        })
        const view = new SM.ColumnFilters.GridView({
            emptyText: this.emptyText || 'No records to display',
            deferEmptyText: false,
            forceFit: true,
            markDirty: false
        })
        const totalTextCmp = new SM.RowCountTextItem ({
            store: labelStore,
            noun: 'label',
            iconCls: 'sm-label-icon'
        })
        const bbar = new Ext.Toolbar({
            items: [
                {
                    xtype: 'exportbutton',
                    hasMenu: false,
                    gridBasename: 'CollectionLabels',
                    exportType: 'grid',
                    iconCls: 'sm-export-icon',
                    text: 'CSV',
                    gridSource: this
                },
                {
                    xtype: 'tbfill'
                },
                {
                    xtype: 'tbseparator'
                },
                totalTextCmp
            ]
        })

        const config = {
            isFormField: true,
            name: 'labels',
            allowBlank: false,
            layout: 'fit',
            height: 150,
            plugins: [this.editor],
            store: labelStore,
            cm,
            sm,
            view,
            tbar,
            bbar,
            getValue: function () {
                const labels = []
                labelStore.data.items.forEach((i) => {
                    const { uses, ...labelfields } = i.data
                    labels.push(labelfields)
                })
                return labels
            },
            setValue: function (v) {
                labelStore.loadData(v)
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
        SM.Collection.LabelsGrid.superclass.initComponent.call(this)
    }
})

SM.Collection.LabelsMenu = Ext.extend(Ext.menu.Menu, {
    initComponent: function () {
        const _this = this
        this.addEvents('applied')
        const config = {
            items: [],
            listeners: {
                itemclick: this.onItemClick,
            }    
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.LabelsMenu.superclass.initComponent.call(this)
        this.refreshItems(this.labels)
    },
    onItemClick: function (item, e) {
        if (item.hideOnClick) { // only the Apply item
            const labelIds = this.getCheckedLabelIds()
            this.fireEvent('applied', labelIds)
        }
    },
    getCheckedLabelIds: function (excludeUnused = false) {
        const checked = this.items.items.reduce( function (labelIds, item) {
            if (item.checked) {
                if (excludeUnused && item.label.uses === 0) {
                    return labelIds
                }
                labelIds.push(item.labelId)
            }
            return labelIds
        }, [])
        return checked
    },
    getLabelItemConfig: function (label, checked = false) {
        return {
            xtype: 'menucheckitem',
            hideOnClick: false,
            text: SM.Collection.LabelTpl.apply(label),
            labelId: label?.labelId ?? null,
            label,
            checked,
            listeners: {
                checkchange: function (item, checked) {
                    item.parentMenu.fireEvent('itemcheckchanged', item, checked)
                }
            }
        }
    },
    getTextItemConfig: function (text = '<b>FILTER</b>') {
        return {
            hideOnClick : false,
            activeClass: '',
            text,
            iconCls: 'sm-menuitem-filter-icon',
            cls: 'sm-menuitem-filter-label'
        }
    },

    getActionItemConfig: function (text = '<b>Apply</b>') {
        return {
            xtype: 'menuitem',
            text,
            icon: 'img/change.svg'
        }
    },
    setLabelsChecked: function (labelIds, checked) {
        for (const labelId of labelIds) {
            this.find('labelId', labelId)[0]?.setChecked(checked, true) //suppressEvent = true
        }
    },
    updateLabel: function (label) {
        const item = this.find('labelId', label.labelId)[0]
        if (item) {
            if (label.uses === 0 && this.ignoreUnusedLabels) {
                this.removeLabel(label)
            }
            else {
                item.label = label
                item.setText(SM.Collection.LabelTpl.apply(label))
                this.items.sort('ASC', this.sorter)
                this.rerender()
            }    
        }    
    },
    addLabel: function (label) {
        if (label.uses === 0 && this.ignoreUnusedLabels) return
        this.addItem(this.getLabelItemConfig(label))
        this.items.sort('ASC', this.sorter)
        this.rerender()
    },
    removeLabel: function (labelId) {
        const item = this.find('labelId', labelId)[0]
        if (item) {
            this.remove(item)
        }
    },
    sorter: function (a, b) {
        return a.label.name.localeCompare(b.label.name)
    },
    refreshItems: function (labels) {
        const labelIdSet = new Set(this.getCheckedLabelIds())
        this.removeAll()
        if (this.showHeader) {
            this.addItem(this.getTextItemConfig())
        }
        labels.sort((a,b) => {
            if (a.name === null) return -1 
            return a.name.localeCompare(b.name)
        })
        for (const label of labels) {
            if (label.uses === 0 && this.ignoreUnusedLabels) continue
            const checked = labelIdSet.has(label.labelId)
            if (label.labelId === null) {
                this.addItem(this.getLabelItemConfig({
                    color: '000000',
                    name: 'no label',
                    isUnlabeled: true
                }, checked))     
            }
            else {
                this.addItem(this.getLabelItemConfig(label, checked))
            }
        }
        if (this.showApply) {
            this.addItem('-')
            this.addItem(this.getActionItemConfig())
        }
    },
    rerender: function () {
        if (this.rendered) {
            this.el.remove()
            delete this.el
            delete this.ul
            this.rendered = false
            this.render()
            this.doLayout.call(this, false, true)
        }       
    }
})

SM.Collection.LabelAssetsForm = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        let _this = this
        if (! this.collectionId) {
            throw ('missing property collectionId')
        }
        const assetSelectionPanel = new SM.AssetSelection.SelectingPanel({
            name: 'assets',
            collectionId: this.collectionId,
            isFormField: true,
            selectionsGridTitle: 'Tagged'
        })
        const labelData = {...SM.Cache.getCollectionLabel(this.collectionId, this.labelId)}
        labelData.extraCls = 'sm-jumbo-sprite'
        const labelSpan = SM.Collection.LabelTpl.apply(labelData)
        const labelField = new Ext.form.DisplayField({
            fieldLabel: 'Label',
            hideLabel: true,
            anchor: '100%',
            value: labelSpan
        })
 
        const config = {
            baseCls: 'x-plain',
            labelWidth: 80,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<span class="sm-label-title">Label</span>',
                    items: [
                        labelField
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '<span class="sm-asset-assignments-title">Tagged Assets</span>',
                    anchor: "100% -70",
                    layout: 'fit',
                    items: [
                        assetSelectionPanel
                    ]
                }

            ],
            buttons: [{
                text: this.btnText || 'Save',
                collectionId: _this.collectionId,
                formBind: true,
                handler: this.btnHandler || function () {}
            }],
            assetSelectionPanel
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.LabelAssetsForm.superclass.initComponent.call(this)

    },
    initPanel: async function () {
        try {
            this.el.mask('')
            await this.assetSelectionPanel.initPanel({labelId: this.labelId})
        }
        catch (e) {
            SM.Error.handleError(e)
        }
        finally {
            this.el.unmask()
        }
    }
})

SM.Collection.showLabelAssetsWindow = async function ( collectionId, labelId ) {
    try {
        let labelAssetsFormPanel = new SM.Collection.LabelAssetsForm({
            collectionId,
            labelId,
            btnHandler: async function( btn ){
                try {
                    let values = labelAssetsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                    let result = await Ext.Ajax.requestPromise({
                        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/labels/${labelId}/assets`,
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: values.assets
                    })
                    const apiLabelAssets = JSON.parse(result.response.responseText)
                    SM.Dispatcher.fireEvent('labelassetschanged', collectionId, labelId, apiLabelAssets)
                    appwindow.close()
                }
                catch (e) {
                    SM.Error.handleError(e)
                }
            }
        })

        /******************************************************/
        // Form window
        /******************************************************/
        const height = Ext.getBody().getHeight() - 80
        const width = Math.min(Math.floor(Ext.getBody().getWidth() * 0.75), 1280)
        var appwindow = new Ext.Window({
            title: 'Tagged Assets',
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
            items: labelAssetsFormPanel
        });
        
        appwindow.show(Ext.getBody())
        await labelAssetsFormPanel.initPanel() // Load asset grid store

               
        appwindow.show(document.body);
    }
    catch (e) {
        Ext.getBody().unmask()
        SM.Error.handleError(e)
    }
}


