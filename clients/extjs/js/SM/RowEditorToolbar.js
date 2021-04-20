'use strict'

Ext.ns('SM')

/**
 * @class SM.RowEditorToolbar
 * @extends Ext.Toolbar
 * Toolbar class that embeds New and Delete buttons
 * @cfg {String} itemString The name that will be appended to label strings
 * @cfg {String} editor The editor to invoke
 * @cfg {String} gridId The id of the grid to which the button is attached 
 * @cfg {String} newRecord The constructor for a new Record as returned by Ext.data.Record.create() 
 * @constructor
 * Create a toolbar
 * @param {Object} config The config object
 * @xtype sm-row-editor-toolbar
 */
SM.RowEditorToolbar = Ext.extend(Ext.Toolbar, {
    initComponent: function() {
        this.newButton = new SM.RowEditorNewBtn({
            toolbar: this,
            itemString: this.itemString,
            title: this.newTitle,
            editor: this.editor,
            gridId: this.gridId,
            newRecord: this.newRecord
        })
        this.delButton = new SM.RowEditorDelBtn({
            itemString: this.itemString,
            title: this.deleteTitle,
            deleteProperty: this.deleteProperty,
            editor: this.editor,
            gridId: this.gridId,
            disabled: true
        })
        let config = {
            newRecordValues: this.newRecordValues || {},
            items: [
                {
                    xtype: 'tbspacer'
                },
                this.newButton,
                '-',
                this.delButton
            ]
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.RowEditorToolbar.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-row-editor-toolbar', SM.RowEditorToolbar);

/**
 * @class SM.RowEditorNewBtn
 * @extends Ext.Button
 * Simple Button class that invokes an editor
 * @cfg {String} newTitle The title of the add button
 * @cfg {String} deleteTitle The title of the delete button
 * @cfg {String} itemString The name that will be appended to label strings
 * @cfg {String} itemString The name that will be appended to label strings
 * @cfg {String} editor The editor to invoke
 * @cfg {String} gridId The id of the grid to which the button is attached 
 * @cfg {String} newRecord The constructor for the new Record as returned by Ext.data.Record.create() 
 * @constructor
 * Create a new button
 * @param {Object} config The config object
 * @xtype sm-new-button
 */
SM.RowEditorNewBtn = Ext.extend(Ext.Button, {
    initComponent: function() {
        let config = {
            iconCls: 'icon-add',
            text: this.title ?? `New ${this.itemString}`,
            handler: this.btnHandler
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.RowEditorNewBtn.superclass.initComponent.call(this);
    },
    btnHandler: function (button, event) {
        this.grid = Ext.getCmp(this.gridId) // grid should exist by the time we're rendered
        this.editor.stopEditing(false) // don't save changes
        this.grid.store.suspendEvents(false) // don't queue events
        let r = new this.newRecord( {...this.toolbar.newRecordValues} )
        r.editing = true
        // this.grid.store.insert(0, new this.newRecord(this.toolbar.newRecordValues)) // will create a phantom record
        this.grid.store.insert(0, r) // will create a phantom record
        this.grid.store.resumeEvents()
        this.grid.getView().refresh()
        this.grid.getSelectionModel().selectRow(0)
        this.editor.startEditing(0)
    }
})
Ext.reg('sm-new-button', SM.RowEditorNewBtn);

/**
 * @class SM.RowEditorDelBtn
 * @extends Ext.Button
 * Simple Button class that invokes an editor
 * @cfg {String} itemString The name that will be appended to label strings
 * @cfg {String} deleteProperty The record property that will be used in the delete confirmation
 * @cfg {String} editor The editor to invoke
 * @cfg {String} gridId The id of the grid to which the button is attached 
 * @constructor
 * Create a new button
 * @param {Object} config The config object
 * @xtype sm-del-button
 */
SM.RowEditorDelBtn = Ext.extend(Ext.Button, {
    initComponent: function() {
        let config = {
            iconCls: 'icon-del',
            text: this.title ?? `Delete ${this.itemString}`,
            itemString: this.itemString,
            deleteProperty: this.deleteProperty,
            handler: this.btnHandler
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.RowEditorDelBtn.superclass.initComponent.call(this);
    },
    btnHandler: function (button, event) {
        this.grid = Ext.getCmp(this.gridId) // grid should exist by the time we're rendered
        this.editor.stopEditing()
        let r = this.grid.getSelectionModel().getSelections()
        let deleteItem = r[0].data[this.deleteProperty]
        Ext.Msg.show({
            title: `Delete ${this.itemString}?`,
            store: this.grid.store,
            record: r[0],
            msg: `You are about to delete ${this.itemString} "${deleteItem}". Do you wish to continue?`,
            buttons: Ext.Msg.YESNO,
            fn: function (buttonId, text, options) {
                if (buttonId === 'ok' || buttonId === 'yes') {
                    options.store.remove(options.record)
                }
            },
            icon: Ext.MessageBox.QUESTION
         })
        //this.grid.store.remove(r[0])
    }
})
Ext.reg('sm-del-button', SM.RowEditorDelBtn);

