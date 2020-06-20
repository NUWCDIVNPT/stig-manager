'use strict'

Ext.ns('SM')

SM.PackageStigsGrid = Ext.extend(Ext.grid.GridPanel, {
    onPackageStigsChanged: function () {
    },
    initComponent: function() {
        let me = this
        id = Ext.id()
        let fieldsConstructor = Ext.data.Record.create([
            {name: 'benchmarkId', type: 'string'},
            {name: 'title', type: 'string'},
            {name: 'lastRevisionStr', type: 'string'},
            {name: 'lastRevisionDate', type: 'string'},
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
            proxy: this.proxy,
            baseParams: {
                packageId: this.packageId,
                projection: ['stigs']
            },
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
				width: 10,
                dataIndex: 'benchmarkId',
				sortable: true
			},{ 	
				header: "Title",
				width: 15,
                dataIndex: 'title',
				sortable: true
			},{ 	
				header: "Latest Revision",
				width: 5,
                dataIndex: 'lastRevisionStr',
                align: "center",
                sortable: true
			},{ 	
				header: "Date",
				width: 5,
				dataIndex: 'lastRevisionDate',
				sortable: true
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
                        Ext.getBody().mask('Getting properties of ' + r.get('name') + '...');
                        showStigAssignments(r.get('benchmarkId'), me.packageId);
                    }
                }
            },
            tbar: new Ext.Toolbar({
                items: [
                    {
                        iconCls: 'icon-add',
                        text: 'Assign new STIG',
                        handler: function() {
                            Ext.getBody().mask('Loading form...');
                            showStigAssignments( null, me.packageId);            
                        }
                    }
                    ,'-'
                    , {
                        ref: '../removeBtn',
                        iconCls: 'icon-del',
                        id: `assetGrid-${id}-deleteBtn`,
                        text: 'Remove STIG',
                        disabled: true,
                        handler: function() {
                            try {
                                var confirmStr="Removing this STIG will remove all related asset assignments. If the STIG is added in the future, the assignments will need to be established again.";
                                Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
                                    if (btn == 'yes') {
                                        let asset = me.getSelectionModel().getSelected()
                                        let result = await Ext.Ajax.requestPromise({
                                            url: `${STIGMAN.Env.apiBase}`,
                                            method: 'DELETE'
                                        })
                                        me.store.remove(asset)
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
                        iconCls: 'sm-stig-icon',
                        disabled: true,
                        id: `assetGrid-${id}-modifyBtn`,
                        text: 'Modify STIG assignments',
                        handler: function() {
                            var r = me.getSelectionModel().getSelected();
                            Ext.getBody().mask('Loading form...');
                            showStigAssignments(r.get('benchmarkId'), me.packageId);
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
                            btn.grid.store.reload();
                        }
                    },{
                        xtype: 'tbseparator'
                    },{
                        xtype: 'exportbutton',
                        hasMenu: false,
                        gridBasename: 'Vendors (grid)',
                        storeBasename: 'Vendors (store)',
                        iconCls: 'icon-save',
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
        SM.PackageStigsGrid.superclass.initComponent.call(this)

        SM.Dispatcher.addListener('packagestigschanged', this.onPackageStigsChanged, this)
    }   
})
Ext.reg('sm-package-stigs-grid', SM.PackageStigsGrid)
