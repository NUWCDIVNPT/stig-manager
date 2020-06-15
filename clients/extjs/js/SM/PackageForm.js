'use strict'

Ext.ns('SM')

SM.WorkflowComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function() {
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false      
        }
        let me = this
        let data = [
            ['continuous','Continuous'],
            ['emass', 'RMF Package']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value','display']
        })
        this.store.on('load',function(store){
            me.setValue(store.getAt(0).get('value'))
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.WorkflowComboBox.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})


SM.PackageMetadataGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        let id = Ext.id()
        let fields = ['key','value']
        let newFields = ['key','value']
        let fieldsConstructor = Ext.data.Record.create(fields) 
        this.newRecordConstructor = Ext.data.Record.create(newFields)
        this.editor =  new Ext.ux.grid.RowEditor({
            saveText: 'Save',
            grid: this,
            clicksToEdit: 2,
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
                },
                afteredit: function (editor, changes, record, index) {
                    // "Save" the record by reconfiguring the store's data collection
                    let mc = record.store.data
                    let generatedId = record.id
                    record.id = record.data.key
                    record.phantom = false

                    delete mc.map[generatedId]
                    mc.map[record.id] = record
                    for (let x=0,l=mc.keys.length; x<l; x++) {
                        if (mc.keys[x] === generatedId) {
                            mc.keys[x] = record.id
                        }
                    }
                }

            }
        })
        this.totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
        let writer = new Ext.data.DataWriter()
        let config = {
            //title: this.title || 'Parent',
            isFormField: true,
            allowBlank: true,
            layout: 'fit',
            height: 150,
            border: true,
            plugins: [this.editor],
            style: {
            },
            listeners: {
            },
            store: new Ext.data.ArrayStore ({
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
                }
            }),
            view: new Ext.grid.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit:true
            }),
            sm: new Ext.grid.RowSelectionModel ({
                singleSelect: true,
                listeners: {
                    // rowselect: function(sm,index,record) {
                    //     // If the editor is active the new record will be a phantom
                    //     if (record.phantom !== true) {
                    //         let loadObj = {
                    //             params: {}
                    //         }
                    //         //loadObj.params[sm.grid.child.store.idProperty] = record.data[sm.grid.child.store.idProperty]
                    //         loadObj.params[sm.grid.store.idProperty] = record.data[sm.grid.store.idProperty]
                    //         // clear selections from control grid
                    //         sm.grid.child.child.apiResponse([{}])
                    //         sm.grid.child.store.removeAll(true)
                    //         sm.grid.child.store.load(loadObj)
                    //     }
                    // }
                }
            }),
            cm: new Ext.grid.ColumnModel ({
                columns: [
                    {
                        header: "Key", 
                        dataIndex: 'key',
                        sortable: true,
                        width: 150,
                        editor: new Ext.form.TextField({
                            grid: this,
                            submitValue:false,
                            validator: function (v) {
                                // Don't keep the form from validating when I'm not active
                                if (this.grid.editor.editing == false) {
                                    return true
                                }
                                if (v === "") { return "Blank values no allowed" }
                                // Is there an item oin the store like me?
                                let searchIdx = this.grid.store.findExact('key',v)
                                // Is it me?
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
                            submitValue:false
                        })
                    }
                ]   
            }),
            bbar: new SM.RowEditorToolbar({
                itemString: 'key',
                editor: this.editor,
                gridId: this.id,
                deleteProperty: 'key',
                newRecord: this.newRecordConstructor
            }),
            getValue: function() {
                let value = {}
                this.store.data.items.forEach((i) => {
                    value[i.data.key] = i.data.value
                })
                return value
            },
            markInvalid: function() {},
            clearInvalid: function() {},
            isValid: function() { 
                return true
            },
            disabled: false,
            getName: function() {return this.name},
            validate: function() { return true},
            setValue: function(v) {
                this.store.loadData(Object.entries(v))
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PackageMetadataGrid.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-package-metadata-grid', SM.PackageMetadataGrid)


SM.PackageForm = Ext.extend(Ext.form.FormPanel, {
    initComponent: function() {
        let config = {
            baseCls: 'x-plain',
            border: false,
            labelWidth: 100,
            monitorValid: true,
            getFieldValues: function (dirtyOnly) {
                // Override Ext.form.FormPanel implementation to check submitValue
                let o = {}, n, key, val;
                this.items.each(function(f) {
                    if (f.submitValue !== false && !f.disabled && (dirtyOnly !== true || f.isDirty())) {
                        n = f.getName()
                        key = o[n]
                        val = f.getValue()   
                        if (Ext.isDefined(key)){
                            if (Ext.isArray(key)){
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
                xtype: 'fieldset',
                title: '<b>Package information</b>',
                items: [
                    {
                        xtype: 'textfield',
                        fieldLabel: 'Name',
                        name: 'name',
                        allowBlank: false,
                        anchor:'100%'  // anchor width by percentage
                    },{
                        xtype: 'sm-workflow-combo',
                        fieldLabel: 'Workflow',
                        name: 'workflow',
                        margins: '0 10 0 0',
                        width: 200
                    },{
                        xtype: 'sm-package-metadata-grid',
                        fieldLabel: 'Metadata',
                        name: 'metadata',
                        anchor: '100%'
                    }
                ]
            }],
            buttons: [{
                text: this.btnText || 'Save',
                formBind: true,
                handler: this.btnHandler || function () {}
            }]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PackageForm.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-package-form', SM.PackageForm);
Ext.reg('sm-workflow-combo', SM.WorkflowComboBox);
