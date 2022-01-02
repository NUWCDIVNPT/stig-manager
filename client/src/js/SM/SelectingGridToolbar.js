'use strict'

Ext.ns('SM')

/**
 * @class SM.SelectingGridToolbar
 * @extends Ext.Toolbar
 * Toolbar class that embeds a toggle button to enable/disable adding selections 
 * to a grid and a text field for filtering by a single column
 * @cfg {Function} filterFn The function to call when filtering should occur
 * @cfg {String} triggerId The id of the trigger 
 * @cfg {String} triggerEmptyText The filter field's empty text
 * @cfg {String} btnId The id of the button 
 * @cfg {String} btnText The button's text
 * @cfg {String} btnTooltipText The button tooltip's text
 * @cfg {Function} btnToggledFn The function to call when the button is toggled, usually a grid's method
 * @cfg {String} gridId The id of the grid to which we're attached 
 * @cfg {Array} prependItems The Ext.Components to insert after this class's toolbar items 
 * @cfg {Array} appendItems The Ext.Components to insert before this class's toolbar items 
 * @constructor
 * Create a new toolbar
 * @param {Object} config The config object
 * @xtype cmsat-new-button
 */
SM.SelectingGridToolbar = Ext.extend(Ext.Toolbar, {
    initComponent: function() {
        this.filterField = new Ext.form.TriggerField ({
            id: this.triggerId || undefined,
            toolbar: this,
            hidden: true,
            triggerClass: 'x-form-clear-trigger',
            onTriggerClick: function() {
                this.triggerBlur()
                this.blur()
                this.setValue('')
                this.toolbar.filterFn.call( Ext.getCmp(this.toolbar.gridId), '', ! this.toolbar.button.pressed ) 
            },
            width: 200,
            submitValue: false,
            enableKeyEvents:true,
            emptyText: this.triggerEmptyText,
            listeners: {
                keyup: function (field,e) {
                    this.toolbar.filterFn.call( Ext.getCmp(this.toolbar.gridId), this.getValue(), this.toolbar.button.pressed ) 
                    return false
                }
            }

        })
        this.separator = new Ext.Toolbar.Separator ({
            hidden: true
        }) 
        this.button = new Ext.Button ({
            id: this.btnId || undefined,
            icon: 'img/tick_white.png',
            toolbar: this,
            text: this.btnText || 'Select items',
            style: {
                marginRight: '10px'
            },
            tooltip: this.btnTooltipText || 'Select items',
            toggleGroup: 'record-selector',
            enableToggle:true,
            allowDepress: true,
            toggleHandler: function (btn,pressed) {
                if (pressed) {
                    this.toolbar.filterField.show()
                    this.toolbar.separator.show()
                } else {
                    this.toolbar.filterField.setValue('')
                    this.toolbar.filterField.hide()
                    this.toolbar.separator.hide()
                }
                //this.toolbar.filterFn( this.toolbar.filterField.getValue(), this.pressed ) 
                this.toolbar.filterFn.call( Ext.getCmp(this.toolbar.gridId), this.toolbar.filterField.getValue(), this.pressed ) 
                Ext.getCmp(this.toolbar.gridId).onEditChange(pressed)
            }

        })
        let baseItems = [
            {
                xtype: 'tbfill'
            },
            this.filterField,
            {
                xtype: 'tbseparator',
                hidden: true
            },
            this.button
        ]
        this.appendItems = this.appendItems || []
        this.prependItems = this.prependItems || []
        let items = this.prependItems.concat(baseItems).concat(this.appendItems)
        let config = {
            items: items
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.SelectingGridToolbar.superclass.initComponent.call(this);
    }
})
Ext.reg('sm-sel-grid-toolbar', SM.SelectingGridToolbar);
