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
            [3, SM.AccessLevelStrings[3]],
            [4, SM.AccessLevelStrings[4]],
        ]
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
        let fields = ['key', 'value']
        let newFields = ['key', 'value']
        let fieldsConstructor = Ext.data.Record.create(fields)
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
        this.totalTextCmp = new Ext.Toolbar.TextItem({
            text: '0 records',
            width: 80
        })
        let writer = new Ext.data.DataWriter()
        let tbar = new SM.RowEditorToolbar({
            itemString: 'key',
            editor: this.editor,
            gridId: this.id,
            deleteProperty: 'key',
            newRecord: this.newRecordConstructor
        })
        tbar.delButton.disable()
        let config = {
            //title: this.title || 'Parent',
            isFormField: true,
            ignoreKeys: _this.ignoreKeys || [],
            allowBlank: true,
            layout: 'fit',
            height: 150,
            border: true,
            plugins: [this.editor],
            style: {
            },
            listeners: {
            },
            store: new Ext.data.ArrayStore({
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
            }),
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit: true
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    selectionchange: function (sm) {
                        tbar.delButton.setDisabled(!sm.hasSelection())
                    }
                }
            }),
            cm: new Ext.grid.ColumnModel({
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
                                if (this.grid.editor.editing == false) {
                                    return true
                                }
                                if (v === "") { return "Blank values not allowed" }
                                // Is there an item in the store like _this?
                                let searchIdx = this.grid.store.findExact('key', v)
                                // Is it _this?
                                let isMe = this.grid.selModel.isSelected(searchIdx)
                                if (searchIdx == -1 || isMe) {
                                    return true
                                } else {
                                    return "Duplicate keys not allowed"
                                }
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
            }),
            tbar: tbar,
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
                {
                    name: 'userId',
                    type: 'string'
                }, {
                    name: 'username',
                    type: 'string'
                }
            ],
            autoLoad: true,
            url: `${STIGMAN.Env.apiBase}/users`,
            root: '',
            sortInfo: {
                field: 'username',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'userId'
        })
        const config = {
            store: userStore,
            filteringStore: this.filteringStore || null,
            displayField: 'username',
            valueField: 'userId',
            mode: 'local',
            forceSelection: true,
            typeAhead: true,
            minChars: 0,
            hideTrigger: false,
            triggerAction: 'all',
            lastQuery: '',
            validator: (v) => {
                // Don't keep the form from validating when I'm not active
                if (_this.grid.editor.editing == false) {
                    return true
                }
                if (v === "") { return "Blank values not allowed" }
            },
            doQuery: function (q, forceAll) {
                q = Ext.isEmpty(q) ? '' : q;
                var qe = {
                    query: q,
                    forceAll: forceAll,
                    combo: this,
                    cancel: false
                };
                if (this.fireEvent('beforequery', qe) === false || qe.cancel) {
                    return false;
                }
                q = qe.query;
                forceAll = qe.forceAll;
                if (forceAll === true || (q.length >= this.minChars)) {
                    if (this.lastQuery !== q) {
                        this.lastQuery = q;
                        if (this.mode == 'local') {
                            this.selectedIndex = -1;
                            if (forceAll) {
                                this.store.clearFilter();
                            } else {
                                this.store.filter(this.displayField, q, false, false);
                            }
                            this.onLoad();
                        } else {
                            this.store.baseParams[this.queryParam] = q;
                            this.store.load({
                                params: this.getParams(q)
                            });
                            this.expand();
                        }
                    } else {
                        this.selectedIndex = -1;
                        this.onLoad();
                    }
                }
            },
            listeners: {
                afterrender: (combo) => {
                    combo.getEl().dom.setAttribute('spellcheck', 'false')
                },
                expand: (combo) => {
                    if (combo.filteringStore) {
                        combo.store.filterBy(
                            function (record, id) {
                                return combo.filteringStore.indexOfId(id) === -1
                            }
                        )
                    }
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
        const newFields = [
            {
                name: 'userId'
            },
            {
                name: 'username'
            },
            {
                name: 'accessLevel'
            }
        ]
        this.newRecordConstructor = Ext.data.Record.create(newFields)
        const totalTextCmp = new Ext.Toolbar.TextItem({
            text: '0 records',
            width: 80
        })
        this.proxy = new Ext.data.HttpProxy({
            restful: true,
            url: this.url,
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            listeners: {
                exception: function (proxy, type, action, options, response, arg) {
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
        const grantStore = new Ext.data.JsonStore({
            grid: this,
            proxy: this.proxy,
            baseParams: this.baseParams,
            root: '',
            fields: newFields,
            idProperty: 'userId',
            sortInfo: {
                field: 'username',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store, records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store, record, index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                    store.grid.fireEvent('grantschanged', store.grid)
                }
            }
        })
        const userSelectionField = new SM.UserSelectionField({
            submitValue: false,
            grid: this,
            filteringStore: grantStore
        })
        const accessLevelField = new SM.AccessLevelField({
            submitValue: false,
            grid: this
        })
        const columns = [
            {
                header: "Username",
                width: 150,
                dataIndex: 'username',
                sortable: true,
                editor: userSelectionField
            },
            {
                header: "Access Level",
                width: 100,
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
                    let mc = record.store.data
                    let generatedId = record.id
                    record.id = record.data.userId
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
            //title: this.title || 'Parent',
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
                    rowselect: function (sm, index, record) {
                        if (_this.showAccessBtn) {
                            _this.accessBtn.setDisabled(record.data.accessLevel != 1)
                        }
                    },
                    selectionchange: function (sm) {
                        tbar.delButton.setDisabled(!sm.hasSelection());
                    }
                }
            }),
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit: true,
                markDirty: false
            }),
            listeners: {
            },
            tbar: tbar,

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
            ignoreKeys: ['fieldSettings', 'statusSettings'],
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
        const grantGrid = new SM.UserGrantsGrid({
            iconCls: 'sm-users-icon',
			showAccessBtn: false,
			title: 'Grants',
			border: true
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
                    settingsStatusFields
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
                    status: settingsStatusFields.serialize()
                }
                delete o.commentEnabled
                delete o.commentRequired
                delete o.detailEnabled
                delete o.detailRequired
                delete o.canAccept
                delete o.minAcceptGrant
                delete o.resetCriteria
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
                    // style: 'background-color: white;',
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
                            // style: 'background-color: white;',
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
    },
    serializeFieldSettings: function (o) {
        return {
            comment: {
                enabled: o.commentEnabled,
                required: o.commentRequired
            },
            detail: {
                enabled: o.detailEnabled,
                required: o.detailRequired
            }
        }        
    },
    serializeStatusSettings: ({canAccept,minAcceptGrant,resetCriteria}) => ({canAccept,minAcceptGrant,resetCriteria})
})

SM.Collection.ManagePanel = Ext.extend(Ext.form.FormPanel, {
    // SM.Collection.ManagePanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        let _this = this
        async function patchSettings(value) {
            const result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
                method: 'PATCH',
                jsonData: {
                    settings: value
                }
            })
            return result.response.responseText ? JSON.parse(result.response.responseText).settings : undefined
        }
        async function updateSettings() {
            return await patchSettings({
                fields: settingsReviewFields.serialize(),
                status: settingsStatusFields.serialize()
            })
        }

        const nameField = new Ext.form.TextField({
            fieldLabel: 'Name',
            labelStyle: 'font-weight: 600;',
            value: _this.apiCollection?.name,
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
                    try {
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
                            method: 'PATCH',
                            params: {
                                projection: 'labels'
                            },
                            jsonData: {
                                name: newValue.trim()
                            }
                        })
                        let apiCollection = JSON.parse(result.response.responseText)
                        SM.Dispatcher.fireEvent('collectionchanged', apiCollection)
                    }
                    catch (e) {
                        alert("Name update failed")
                        field.setValue(oldValue)
                    }
                }
            }
        })          
        const delButton = new Ext.Button({
            iconCls: 'sm-trash-icon',
            // cls: 'sm-bare-button',
            width: 25,
            template: new Ext.Template(
                '<table id="{4}" cellspacing="0" class="x-btn {3}"><tbody class="{1}">',
                '<tr><td class="x-btn-tl" style="background-image:none;"><i>&#160;</i></td><td class="x-btn-tc" style="background-image:none;"></td><td class="x-btn-tr" style="background-image:none;"><i>&#160;</i></td></tr>',
                '<tr><td class="x-btn-ml" style="background-image:none;"><i>&#160;</i></td><td class="x-btn-mc" style="background-image:none;"><em class="{2} x-unselectable" unselectable="on"><button type="{0}"></button></em></td><td class="x-btn-mr" style="background-image:none;"><i>&#160;</i></td></tr>',
                '<tr><td class="x-btn-bl" style="background-image:none;"><i>&#160;</i></td><td class="x-btn-bc" style="background-image:none;"></td><td class="x-btn-br" style="background-image:none;"><i>&#160;</i></td></tr>',
                '</tbody></table>'),
            border: false,
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
                    alert(e.mes)
                }
            }
        })
        const descriptionField = new Ext.form.TextArea({
            fieldLabel: 'Description',
            labelStyle: 'font-weight: 600;',
            value: _this.apiCollection?.description,
            name: 'description',
            anchor: '100% 0',
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
                        alert("Description update failed")
                        field.setValue(oldValue)
                    }
                }
            }
        })
        const metadataGrid = new SM.MetadataGrid({
            title: 'Metadata',
            iconCls: 'sm-database-save-icon',
            name: 'metadata',
            ignoreKeys: ['fieldSettings', 'statusSettings'],
            anchor: '100% 0',
            border: true,
            listeners: {
                metadatachanged: async grid => {
                    try {
                        let data = grid.getValue()
                        let result = await Ext.Ajax.requestPromise({
                            url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/metadata`,
                            method: 'PATCH',
                            jsonData: data
                        })
                        // let collection = JSON.parse(result.response.responseText)
                        // grid.setValue(collection.metadata)
                        const sortstate = grid.store.getSortState()
                        grid.store.sort([sortstate])
                    }
                    catch (e) {
                        alert ('Metadata save failed')
                    }
                }
            }

        })
        metadataGrid.setValue(_this.apiCollection.metadata)

        const settingsReviewFields = new SM.Collection.FieldSettings.ReviewFields({
            iconCls: 'sm-stig-icon',
            fieldSettings: _this.apiCollection?.settings?.fields,
            border: true,
            autoHeight: true,
            onFieldSelect: async function (fieldset) {
                try {
                    const newSettings = await updateSettings()
                    SM.Dispatcher.fireEvent('fieldsettingschanged', _this.apiCollection.collectionId, newSettings.fields)
                }
                catch (e) {
                    alert(e.message)
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
                    const newSettings = await updateSettings()
                    SM.Dispatcher.fireEvent('statussettingschanged', _this.apiCollection.collectionId, newSettings.status)
                }
                catch (e) {
                    alert(e.message)
                }
            }
        })

        let firstItem = nameField
        if (this.allowDelete) {
            nameField.flex = 1
            firstItem = {
                xtype: 'compositefield',
                labelStyle: 'font-weight: 600;',
                items: [
                    nameField,
                    delButton
                ]
            }
        }

        const grantGrid = new SM.UserGrantsGrid({
			collectionId: _this.apiCollection.collectionId,
            iconCls: 'sm-users-icon',
			showAccessBtn: true,
			url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}`,
			baseParams: {
				projection: 'grants'
			},
			title: 'Grants',
			border: true,
			listeners: {
				grantschanged: async grid => {
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
                        alert ('Grants save failed')
                    }
				}
			}
		})
		grantGrid.getStore().loadData(_this.apiCollection.grants.map( g => ({
			userId: g.user.userId,
			username: g.user.username,
			accessLevel: g.accessLevel
		})))

        this.labelGrid = new SM.Collection.LabelsGrid({
			collectionId: _this.apiCollection.collectionId,
            iconCls: 'sm-label-icon',
            title: 'Labels',
            border: true,
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
                        alert ('Label delete failed')
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
                        alert ('Label update failed')
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
                        alert ('Label create failed')
                    }
                }
            }
        })
        this.labelGrid.setValue(_this.apiCollection.labels)

        let config = {
            title: this.title || 'Collection properties',
            layout: 'form',
            cls: 'sm-collection-manage-layout sm-round-panel',
            labelWidth: 100,
            padding: 15,
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
                    layout: 'border',
                    anchor: '100% 0',
                    hideLabels: true,
                    border: false,
                    baseCls: 'x-plain',
                    // style: 'background-color: white;',
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
                            // style: 'background-color: white;',
                            xtype: 'fieldset',
                            region: 'north',
                            height: 200,
                            split: true,
                            title: 'Information',
                            items: [ firstItem, descriptionField]
                        },
                        {
                            xtype: 'tabpanel',
                            style: {
                                paddingTop: "10px"
                            },
                            region: 'center',
                            activeTab: 0,
                            border: false,
                            items: [ 
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
                                        settingsStatusFields
                                    ]
                                },
                                metadataGrid,
                                this.labelGrid
                            ]      
                                
                        }
                               
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
            anchor: '100%',
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
            anchor: '100%',
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
                            columnWidth: .34,
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
                            columnWidth: .33,
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
                            columnWidth: .33,
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
            fieldLabel: '<span style="padding-left: 18px;">Grant required to set Accept or Reject</span>', 
            disabled: !_this.statusSettings.canAccept,
            width: 125,
            value: _this.statusSettings.minAcceptGrant,
            listeners: {
                select: onComboSelect
            }
        })

        const criteriaComboBox = new SM.Collection.StatusSettings.CriteriaComboBox({
            name: 'resetCriteria',
            fieldLabel: 'Reset to <img src="img/disk-16.png" width=12 height=12 ext:qtip="Saved" style="padding: 1px 3px 0px 0px;vertical-align:text-top;"/>Saved upon change to', 
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
SM.getContrastYIQ = function (hexcolor){
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);
	var yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? '#080808' : '#f7f7f7';
}

SM.Collection.LabelSpriteHtml = `<span class=sm-label-sprite style="color:{[SM.getContrastYIQ(values.color)]};background-color: #{color};" ext:qtip="{[SM.he(SM.he(values.description))]}">{[SM.he(values.name)]}</span>`

SM.Collection.LabelTpl = new Ext.XTemplate(
    SM.Collection.LabelSpriteHtml
)
SM.Collection.LabelArrayTpl = new Ext.XTemplate(
    '<tpl for=".">',
    `${SM.Collection.LabelSpriteHtml} `,
    '</tpl>'
)
SM.Collection.LabelEditTpl = new Ext.XTemplate(
    '<span class=sm-label-sprite style="color:{[SM.getContrastYIQ(values.color)]};background-color:#{color};">{[SM.he(values.name)]}</span><img class="sm-label-edit-color" src="img/color-picker.svg" width="12" height="12">'
)


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
        const cpm = new Ext.menu.ColorMenu({
            submitValue: false,
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
        cpm.palette.colors = [
            '4568F2', '7000FF', 'E46300', '8A5000', '019900', 'DF584B', 
            '99CCFF', 'D1ADFF', 'FFC399', 'FFF699', 'A3EA8F', 'F5A3A3', 
        ]
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
                header: '<img src="img/target.svg" width=12 height=12>',
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
                // Ext.getBody().mask('Getting asset list for ' + r.get('name') + '...');
                SM.Collection.showLabelAssetsWindow(_this.collectionId, r.get('labelId'));
            }
        })

        const config = {
            isFormField: true,
            name: 'labels',
            allowBlank: false,
            layout: 'fit',
            height: 150,
            plugins: [this.editor],
            store: labelStore,
            cm: new Ext.grid.ColumnModel({
                columns: columns
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    selectionchange: function (sm) {
                        tbar.delButton.setDisabled(!sm.hasSelection())
                        _this.assetBtn.setDisabled(!sm.hasSelection())
                    }
                }
            }),
            view: new SM.ColumnFilters.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit: true,
                markDirty: false
            }),
            listeners: {
                // instances should handle 'labelchanged'
                // instances should handle 'labelcreated'
                // instances should handle 'labelremoved'
            },
            tbar: tbar,

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

        const items = []
        if (this.showHeader) {
            items.push(this.getTextItemConfig())
        }
        for (const label of this.initialConfig.labels) {
            if (label.uses === 0 && this.ignoreUnusedLabels) continue
            items.push(this.getLabelItemConfig(label))
        }
        if (this.showApply) {
            items.push('-', this.getActionItemConfig())
        }
        const config = {
            items,
            listeners: {
                itemclick: this.onItemClick,
                hide: function (menu) {
                    const labelIds = menu.getCheckedLabelIds()
                    this.fireEvent('applied', labelIds)
                }
            }    
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Collection.LabelsMenu.superclass.initComponent.call(this)
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
            labelId: label.labelId,
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
            this.find('labelId', labelId)[0].setChecked(checked, true) //suppressEvent = true
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
        labels.sort((a,b) => a.name.localeCompare(b.name))
        for (const label of labels) {
            if (label.uses === 0 && this.ignoreUnusedLabels) continue
            const checked = labelIdSet.has(label.labelId)
            this.addItem(this.getLabelItemConfig(label, checked))
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
        let me = this
        this.assetsGrid = new SM.StigAssetsGrid({
            name: 'assets',
            collectionId: this.collectionId,
            isValid: () => {
                // override of SM.StigAssetsGrid
                return true
            },
        })
        this.assetsGrid.getSelectionModel().addListener('rowselect', function (sm, rowIndex, record) {
            if (!record.data.labelIds.includes(me.labelId)) {
                record.data.labelIds.push(me.labelId)
                record.commit()    
            }
        })
        this.assetsGrid.getSelectionModel().addListener('rowdeselect', function (sm, rowIndex, record) {
            record.data.labelIds = record.data.labelIds.filter( i => i !== me.labelId)
            record.commit()
        })
        if (! this.collectionId) {
            throw ('missing property collectionId')
        }
        const labelSpan = SM.Collection.LabelTpl.apply(SM.Cache.CollectionMap.get(this.collectionId).labelMap.get(this.labelId))
        const labelField = new Ext.form.DisplayField({
            fieldLabel: 'Label',
            hideLabel: true,
            anchor: '100%',
            value: labelSpan
        })
 
        const config = {
            baseCls: 'x-plain',
            // height: 400,
            labelWidth: 80,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<b>Label</b>',
                    items: [
                        labelField
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '<b>Tagged Assets</b>',
                    anchor: "100% -70",
                    layout: 'fit',
                    items: [
                        this.assetsGrid
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
        SM.Collection.LabelAssetsForm.superclass.initComponent.call(this)

    },
    initPanel: async function () {
        try {
            await this.assetsGrid.store.loadPromise()
        }
        catch (e) {
            alert (e)
        }
    }
})

SM.Collection.showLabelAssetsWindow = async function ( collectionId, labelId ) {
    try {
        let labelAssetsFormPanel = new SM.Collection.LabelAssetsForm({
            collectionId,
            labelId: labelId,
            btnHandler: async function( btn ){
                try {
                    if (labelAssetsFormPanel.getForm().isValid()) {
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
            title: 'Tagged Assets, Label ID ' + labelId,
            cls: 'sm-dialog-window sm-round-panel',
            modal: true,
            hidden: true,
            width: 510,
            height:660,
            layout: 'fit',
            plain:true,
            bodyStyle:'padding:10px;',
            buttonAlign:'right',
            items: labelAssetsFormPanel
        });
        
        appwindow.render(Ext.getBody())
        await labelAssetsFormPanel.initPanel() // Load asset grid store

        let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/assets`,
            method: 'GET',
            params: {
                collectionId,
                labelId
            }
        })
        const apiLabelAssets = JSON.parse(result.response.responseText)            
        labelAssetsFormPanel.getForm().setValues({
            labelId,
            assets: apiLabelAssets
        })
                
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


