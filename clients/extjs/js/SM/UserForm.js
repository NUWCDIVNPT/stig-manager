Ext.ns('SM')

SM.UserProperties = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        let me = this
        let idAppend = Ext.id()
        this.stigGrid = new SM.AssetStigsGrid({
            name: 'stigs'
        })
        if (! this.initialCollectionId) {
            throw ('missing property initialCollectionId')
        }
 
        let config = {
            baseCls: 'x-plain',
            // height: 400,
            region: 'south',
            labelWidth: 70,
            monitorValid: true,
            trackResetOnLoad: true,
            items: [
                {
                    xtype: 'fieldset',
                    title: '<b>Asset information</b>',
                    items: [
                        {
                            layout: 'column',
                            baseCls: 'x-plain',
                            border: false,
                            items: [
                                {
                                    columnWidth: .4,
                                    layout: 'form',
                                    border: false,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'Name',
                                            width: 150,
                                            emptyText: 'Enter asset name...',
                                            allowBlank: false,
                                            name: 'name'
                                        }
                                    ]
                                },
                                {
                                    columnWidth: .4,
                                    layout: 'form',
                                    border: false,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: 'IP address',
                                            width: 130,
                                            emptyText: 'Enter asset IP address...',
                                            allowBlank: true,
                                            vtype: 'IPAddress',
                                            name: 'ip'
                                        }
                                    ]
                                },
                                {
                                    columnWidth: .2,
                                    layout: 'form',
                                    border: false,
                                    hideLabels: true,
                                    items: [
                                        {
                                            xtype: 'checkbox',
                                            name: 'noncomputing',
                                            checked: false,
                                            boxLabel: 'Non-computing'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: 'Description',
                            anchor: '100%',
                            emptyText: 'Enter asset description...',
                            allowBlank: true,
                            name: 'description'
                        },
                        {
                            xtype: 'sm-metadata-grid',
                            submitValue: true,
                            fieldLabel: 'Metadata',
                            name: 'metadata',
                            anchor: '100%'
                        },
                        {
                            xtype: 'hidden',
                            name: 'collectionId',
                            value: this.initialCollectionId
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '<b>STIG Assignments</b>',
                    anchor: "100% -240",
                    layout: 'fit',
                    items: [
                        this.stigGrid
                    ]
                }

            ],
            buttons: [{
                text: this.btnText || 'Save',
                formBind: true,
                handler: this.btnHandler || function () {}
            }]
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AssetProperties.superclass.initComponent.call(this)

        this.getForm().addListener('beforeadd', (fp, c, i) => {
            let one = c
        })

        this.getForm().getFieldValues = function(dirtyOnly, getDisabled){
            // Override to support submitValue boolean
            var o = {},
                n,
                key,
                val;
            this.items.each(function(f) {
                // Added condition for f.submitValue
                if ( f.submitValue && (!f.disabled || getDisabled) && (dirtyOnly !== true || f.isDirty())) {
                    n = f.getName();
                    key = o[n];
                    val = f.getValue();
    
                    if(Ext.isDefined(key)){
                        if(Ext.isArray(key)){
                            o[n].push(val);
                        }else{
                            o[n] = [key, val];
                        }
                    }else{
                        o[n] = val;
                    }
                }
            });
            return o;
        }
    

    },
    // initPanel: async function () {
    //     try {
    //         await this.stigGrid.store.loadPromise()
    //     }
    //     catch (e) {
    //         alert (e)
    //     }
    // }
})
