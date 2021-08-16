'use strict'

Ext.ns('SM')

SM.CollectionSelectionField = Ext.extend( Ext.form.ComboBox, {
    initComponent: function() {
        let me = this
        this.proxy = new Ext.data.HttpProxy({
            restful: true,
            url: this.url || `${STIGMAN.Env.apiBase}/collections`,
            method: 'GET',
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
        const collectionStore = new Ext.data.JsonStore({
            fields: [
                {	name:'collectionId',
                    type: 'string'
                },{
                    name:'name',
                    type: 'string'
                }
            ],
            proxy: this.proxy,
            autoLoad: this.autoLoad,
            baseParams: {
                elevate: curUser.privileges.canAdmin
            },
            root: this.root || '',
            sortInfo: {
                field: 'name',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            idProperty: 'collectionId'
        })
        const config = {
            store: collectionStore,
            filteringStore: this.filteringStore || null,
            displayField: 'name',
            valueField: 'collectionId',
            mode: 'local',
            forceSelection: true,
			allowBlank: true,
			typeAhead: true,
			minChars: 0,
            hideTrigger: false,
            triggerAction: this.triggerAction || 'query',
            lastQuery: '',
            validator: (v) => {
                // Don't keep the form from validating when I'm not active
                if (me.grid.editor.editing == false) {
                    return true
                }
                if (v === "") { return "Blank values no allowed" }
            },
			doQuery : function(q, forceAll){
                // Custom re-implementation of the original ExtJS method
                // Initial lines were retained
				q = Ext.isEmpty(q) ? '' : q;
				var qe = {
					query: q,
					forceAll: forceAll,
					combo: this,
					cancel:false
				};
				if ( this.fireEvent('beforequery', qe) === false || qe.cancel ) {
					return false;
				}
				q = qe.query;
				forceAll = qe.forceAll;
				if ( forceAll === true || (q.length >= this.minChars) ) {
					// Removed test against this.lastQuery
                    if (this.mode == 'local') {
                        this.selectedIndex = -1
                        if (forceAll) {
                            this.store.clearFilter()
                        }
                        else {
                            // Build array of filter functions
                            let filters = []
                            if (this.filteringStore) {
                                // Include records from the combo store that are NOT in filteringStore
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
                                        property: this.displayField,
                                        value: q
                                    }
                                )
                            }
                            this.store.filter(filters)
                        }
                        this.onLoad()
                    } 
                    else {
                        this.store.baseParams[this.queryParam] = q
                        this.store.load({
                            params: this.getParams(q)
                        })
                        this.expand()
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
        SM.CollectionSelectionField.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-collection-selection-field', SM.CollectionSelectionField);

SM.CollectionGrantsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        const me = this
        const newFields = [
            { 
                name: 'collectionId'
            },
            {
                name: 'name'
            },
            {
                name: 'accessLevel'
            }
        ]
        this.newRecordConstructor = Ext.data.Record.create(newFields)
        const totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
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
        const grantStore = new Ext.data.JsonStore({
            grid: this,
            proxy: this.proxy,
            baseParams: this.baseParams,
            root: '',
            fields: newFields,
            idProperty: 'collectionId',
            sortInfo: {
                field: 'name',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store,records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store,record,index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                    store.grid.fireEvent('grantschanged', store.grid)
                }
            }
        })
        const collectionSelectionField = new SM.CollectionSelectionField({
            submitValue: false,
            grid: this,
            filteringStore: grantStore,
            autoLoad: true
        })
        const accessLevelField = new SM.AccessLevelField({
            submitValue: false,
            grid: this
        })
        const columns = [
            { 	
				header: "Collection",
				width: 150,
                dataIndex: 'name',
                sortable: true,
                editor: collectionSelectionField
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
        this.editor =  new Ext.ux.grid.RowEditor({
            saveText: 'Save',
            grid: this,
            collectionSelectionField: collectionSelectionField,
            accessLevelField: accessLevelField,
            clicksToEdit: 2,
            errorSummary: false, // don't display errors during validation monitoring
            listeners: {
                validateedit: function (editor, changes, record, index) {
                    // RowEditor unhelpfully sets changes.name to the collectionId value. 
                    if (changes.hasOwnProperty('name')) {
                        let collEditor = editor.collectionSelectionField
                        let collRecord = collEditor.store.getAt(collEditor.selectedIndex) 
                        changes.name = collRecord.data.name
                        changes.collectionId = collRecord.data.collectionId
                    }
                },
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
                    // Corrects the bug where new records don't deselect when clicking away
                    let mc = record.store.data
                    let generatedId = record.id
                    record.id = record.data.userId
                    record.phantom = false
                    record.dirty = false
                    delete mc.map[generatedId]
                    mc.map[record.id] = record
                    for (let x=0,l=mc.keys.length; x<l; x++) {
                        if (mc.keys[x] === generatedId) {
                            mc.keys[x] = record.id
                        }
                    }
                    editor.grid.fireEvent('grantschanged', editor.grid)
                }

            }
        })
        const config = {
            //title: this.title || 'Parent',
            isFormField: true,
            submitValue: true,
            allowBlank: false,
            forceSelection: true,
            allowBlank: true,
            layout: 'fit',
            height: 150,
            plugins: [this.editor],
            store: grantStore,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true,
                listeners: {
                    selectionchange: function (sm) {
                    }
                }
            }),
            view: new Ext.grid.GridView({
                emptyText: this.emptyText || 'No records to display',
                deferEmptyText: false,
                forceFit: true,
                markDirty: false
            }),
            listeners: {
            },
            tbar: new SM.RowEditorToolbar({
                itemString: 'Grant',
                editor: this.editor,
                gridId: this.id,
                deleteProperty: 'userId',
                newRecord: this.newRecordConstructor
            }),

            getValue: function() {
                let grants = []
                grantStore.data.items.forEach((i) => {
                    grants.push({
                        collectionId: i.data.collectionId,
                        accessLevel: i.data.accessLevel
                    })
                })
                return grants
            },
            setValue: function(v) {
                const data = v.map( (g) => ({
                    collectionId: g.collection.collectionId,
                    name: g.collection.name,
                    accessLevel: g.accessLevel
                }))
                grantStore.loadData(data)
            },
            markInvalid: function() {},
            clearInvalid: function() {},
            isValid: () => true,
            getName: () => this.name,
            validate: () => true
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.CollectionGrantsGrid.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-collection-grants-grid', SM.CollectionGrantsGrid);

SM.UserProperties = Ext.extend(Ext.form.FormPanel, {
    initComponent: function () {
        let me = this
        this.colGrid = new SM.CollectionGrantsGrid({
            name: 'collectionGrants'
        })
        const registeredUserItems =  [
            {
                layout: 'column',
                baseCls: 'x-plain',
                border: false,
                items: [
                    {
                        columnWidth: .5,
                        layout: 'form',
                        border: false,
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: 'Username',
                                readOnly: true,
                                anchor: '-20',
                                name: 'username'
                            }
                        ]
                    },
                    {
                        columnWidth: .5,
                        layout: 'form',
                        border: false,
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: 'Name',
                                readOnly: true,
                                anchor: '100%',
                                name: 'name'
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'textfield',
                fieldLabel: 'Email',
                anchor: '100%',
                readOnly: true,
                name: 'email'
            },
            {
                // xtype: 'compositefield',
                fieldLabel: 'Privileges',
                allowBlank: true,
                anchor: '100%',
                layout: 'hbox',
                border: false,
                items: [
                    {
                        xtype: 'checkbox',
                        name: 'canCreateCollection',
                        boxLabel: 'Create collection',
                        flex: 1,
                        readOnly: true
                    },
                    {
                        xtype: 'checkbox',
                        name: 'canAdmin',
                        checked: false,
                        boxLabel: 'Administrator',
                        flex: 1,
                        readOnly: true
                    }        
                ]
            },
            {
                xtype: 'displayfield',
                allowBlank: true,
                style: 'border: 1px solid #C1C1C1',
                fieldLabel: 'Last Claims',
                autoScroll: true,
                border: true,
                name: 'lastClaims',
                height: 150,
                anchor: '100%',
                setValue: function (v) {
                    if (Object.keys(v).length === 0 && v.constructor === Object) {
                        return
                    }
                    const tree = JsonView.createTree(v)
                    const el = this.getEl().dom
                    JsonView.render(tree, el)
                    JsonView.expandChildren(tree)
                }
            }
        ]
        const preregisteredUserItems =  [
            {
                xtype: 'textfield',
                fieldLabel: 'Username',
                allowBlank: false,
                anchor: '100%',
                name: 'username'
            }
        ]
       
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
                    title: '<b>User information</b>',
                    items: this.registeredUser ? registeredUserItems : preregisteredUserItems
                },
                {
                    xtype: 'fieldset',
                    title: '<b>Collection Grants</b>',
                    height: 270,
                    layout: 'fit',
                    items: [
                        this.colGrid
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
        SM.UserProperties.superclass.initComponent.call(this)

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
    

    }
})

async function showUserProps( userId ) {
    try {
        let userPropsFormPanel = new SM.UserProperties({
            registeredUser: userId,
            padding: '10px 15px 10px 15px',
            btnHandler: async function(){
                try {
                    if (userPropsFormPanel.getForm().isValid()) {
                        let values = userPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                        let jsonData = {collectionGrants: values.collectionGrants}

                        let method = userId ? 'PATCH' : 'POST'
                        let url = userId ? `${STIGMAN.Env.apiBase}/users/${userId}` : `${STIGMAN.Env.apiBase}/users`
                        if (!userId) {
                            jsonData.username = values.username
                        }
                        let result = await Ext.Ajax.requestPromise({
                            url: url,
                            method: method,
                            params: {
                                elevate: curUser.privileges.canAdmin,
                                projection: ['collectionGrants', 'statistics']
                            },
                            headers: { 'Content-Type': 'application/json;charset=utf-8' },
                            jsonData: jsonData
                        })
                        const apiUser = JSON.parse(result.response.responseText)
                        const event = userId ? 'userchanged' : 'usercreated'
                        SM.Dispatcher.fireEvent(event, apiUser)
                        appwindow.close()
                    }
                }
                catch (e) {
                    alert(e.message)
                }
            }
        })

        /******************************************************/
        // Form window
        /******************************************************/
        var appwindow = new Ext.Window({
            title: userId ? 'User Grants, ID ' + userId : 'Pre-register User Grants',
            modal: true,
            hidden: true,
            width: 660,
            height: userId ? 650 : 440,
            layout: 'fit',
            plain:true,
            bodyStyle:'padding:5px;',
            buttonAlign:'right',
            items: userPropsFormPanel
        });

        
        appwindow.render(document.body)

        const privilegeGetter = new Function("obj", "return obj?." + STIGMAN.Env.oauth.claims.privileges + " || [];");

        if (userId) {
            let result = await Ext.Ajax.requestPromise({
                url: `${STIGMAN.Env.apiBase}/users/${userId}`,
                params: {
                    elevate: curUser.privileges.canAdmin,
                    projection: ['statistics', 'collectionGrants']
                },
                method: 'GET'
            })
            let apiUser = JSON.parse(result.response.responseText)
            ;['iat', 'exp', 'auth_time'].forEach( claim => {
                if (apiUser.statistics.lastClaims[claim]) {
                    apiUser.statistics.lastClaims[claim] = new Date(apiUser.statistics.lastClaims[claim] * 1000)
                }
            })
            if (apiUser.statistics.lastClaims.scope) {
                apiUser.statistics.lastClaims.scope = apiUser.statistics.lastClaims.scope.split(' ')
            }
            let formValues = {
                username: apiUser.username,
                name: apiUser.statistics.lastClaims?.[STIGMAN.Env.oauth.claims.name],
                email: apiUser.statistics.lastClaims?.[STIGMAN.Env.oauth.claims.email],
                canCreateCollection: privilegeGetter(apiUser.statistics.lastClaims).includes('create_collection'),
                canAdmin: privilegeGetter(apiUser.statistics.lastClaims).includes('admin'),
                lastClaims: apiUser.statistics.lastClaims,
                collectionGrants: apiUser.collectionGrants || []
            }
            userPropsFormPanel.getForm().setValues(formValues)
        }
                
        Ext.getBody().unmask();
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

