Ext.ns('SM.UserGroup')

SM.UserGroup.UserSpriteHtml = `<span class="sm-label-sprite {extraCls}" style="color:black;background-color:#888;">{[SM.he(values)]}</span>`

SM.UserGroup.UserTpl = new Ext.XTemplate(
  SM.UserGroup.GroupSpriteHtml
)
SM.UserGroup.UserArrayTpl = new Ext.XTemplate(
    '<tpl for=".">',
    `${SM.UserGroup.GroupSpriteHtml} `,
    '</tpl>'
)

SM.UserGroup.UserGroupGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = Ext.data.Record.create([
      {
        name: 'userGroupId',
        type: 'string'
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
        name: 'created',
        type: 'date',
        mapping: 'attributions.created.ts'
      },
      {
        name: 'userCount',
        type: 'integer',
        convert: (v, r) => r.users.length
      },
      {
        name: 'collectionCount',
        type: 'integer',
        convert: (v, r) => r.collections.length

      }
    ])
    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/user-groups`,
        method: 'GET'
      }),
      baseParams: {
        elevate: curUser.privileges.admin,
        projection: ['users', 'collections', 'attributions']
      },
      root: '',
      fields,
      idProperty: 'userGroupId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        load: function () {
          _this.selModel.selectRow(0)
        }
      }
    })
    const columns = [
      {
        header: "Name", 
        width: 150,
        dataIndex: 'name',
        sortable: true,
        filter: {type: 'string'}
      },
      { 	
        header: "Description",
        width: 150,
        dataIndex: 'description',
        sortable: true,
        filter: {type: 'string'}
      },
      { 	
        header: "Created",
        xtype: 'datecolumn',
        format: 'Y-m-d H:i T',
        width: 150,
        dataIndex: 'created',
        sortable: true
      },
      { 	
        header: "# Users",
        width: 100,
        align: 'center',
        dataIndex: 'userCount',
        sortable: true,
        renderer: SM.styledEmptyRenderer
      },
      { 	
        header: "# Collections",
        width: 100,
        align: 'center',
        dataIndex: 'collectionCount',
        sortable: true,
        renderer: SM.styledEmptyRenderer
      }
    ]
    const view = new SM.ColumnFilters.GridView({
      forceFit:true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())  
        },
        // These listeners keep the grid in the same scroll position after the store is reloaded
        beforerefresh: function(v) {
           v.scrollTop = v.scroller.dom.scrollTop;
           v.scrollHeight = v.scroller.dom.scrollHeight;
        },
        refresh: function(v) {
          setTimeout(function() { 
            v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
          }, 100);
        }
      },
      deferEmptyText:false
    })
    const sm = new Ext.grid.RowSelectionModel({ 
      singleSelect: true,
      listeners: {
        selectionchange: function (sm) {
          const hasSelection = sm.hasSelection()
          removeBtn.setDisabled(!hasSelection)
          modifyBtn.setDisabled(!hasSelection)
        }
      }
    })

    const removeBtn = new Ext.Button({
      iconCls: 'icon-del',
      disabled: true,
      text: 'Delete Group',
      handler: function() {
        let selRec = _this.getSelectionModel().getSelected()
        let buttons = {yes: 'Delete', no: 'Cancel'}
        let confirmStr=`Delete group ${selRec.data.name}?<br><br>This action will delete all Collection Grants for the user group.`;
        
        Ext.Msg.show({
          title: 'Confirm delete action',
          icon: Ext.Msg.WARNING,
          msg: confirmStr,
          buttons: buttons,
          fn: async function (btn,text) {
            try {
              if (btn == 'yes') {
                const apiUserGroup = await Ext.Ajax.requestPromise({
                  responseType: 'json',
                  url: `${STIGMAN.Env.apiBase}/user-groups/${selRec.data.userGroupId}?elevate=${curUser.privileges.admin}`,
                  method: 'DELETE'
                })
                store.remove(selRec)
                SM.Dispatcher.fireEvent('usergroupdeleted', apiUserGroup)
              }
            }
            catch (e) {
              SM.Error.handleError(e)
            }
          }
        })
      }
    })

    const modifyBtn = new Ext.Button({
      iconCls: 'icon-edit',
      disabled: true,
      text: 'Modify Group',
      handler: function() {
        SM.UserGroup.showUserGroupProps(sm.getSelected().get('userGroupId'))
      }
    })
    const tbar = [
      {
        iconCls: 'icon-add',
        text: 'Add Group',
        handler: function() {
          Ext.getBody().mask('');
          SM.UserGroup.showUserGroupProps(0);            
        }
      },
      modifyBtn,
      '-',
      removeBtn,
      '-',
      
    ]
    const totalTextCmp = new SM.RowCountTextItem({store})
    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function(btn){
            store.reload()
          }
        },
        {
          xtype: 'tbseparator'
        },
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'UserGroup-Info',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this     
        },	
        {
          xtype: 'tbfill'
        },{
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })
    const config = {
      store,
      sm,
      columns,
      view,
      tbar,
      bbar,
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.UserGroup.UserSelectingGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'userId',
      'username',
      'displayName',
      // { 
      //   name: 'userGroups', 
      //   convert: (v, r) => r.userGroups.map(userGroup => userGroup.name)
      // }
    ]
    const sm = new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
      listeners: {
        selectionchange: function (sm) {
          SM.SetCheckboxSelModelHeaderState(sm)
        }
      }
    })
    const columns = [
      sm,
      {
        header: "User",
        width: 150,
        dataIndex: 'displayName',
        sortable: true,
        renderer: function (v, m, r) {
          return `<div exportValue="${r.data.displayName ?? ''}:${r.data.username ?? ''}"><span style="font-weight:600;">${r.data.displayName ?? ''}</span><br>${r.data.username ?? ''}</div>`
        }
      },
      // {
      //   header: "Groups",
      //   width: 50,
      //   align: 'center',
      //   dataIndex: 'userGroups',
      //   sortable: true,
      //   hidden: false,
      //   filter: { type: 'values' },
      //   renderer: function (value, metadata, record) {
      //     let qtipWidth = 230
      //     if (value.length > 0) {
      //       let longest = Math.max(...(value.map(el => el.length)))
      //       qtipWidth = longest * 8
      //     }
      //     metadata.attr = ` ext:qwidth=${qtipWidth} ext:qtip="<b>${record.data.name} Members</b><br>${value.join('<br>')}"`
      //     return `<i>${value.length}</i>`
      //   }
      // }
    ]
    const store = new Ext.data.JsonStore({
      fields,
      idProperty: 'userId',
      sortInfo: {
        field: 'displayName',
        direction: 'ASC'
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'user',
      iconCls: 'sm-user-icon'
    })
    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddText: '{0} selected User{1}',
      bodyCssClass: 'sm-grid3-draggable',
      ddGroup: `SM.UserGroup.UserSelectingGrid-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No Users to display',
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          }
        }
      }),
      bbar: new Ext.Toolbar({
        items: [
          {
            xtype: 'exportbutton',
            grid: this,
            hasMenu: false,
            gridBasename: 'Users (grid)',
            storeBasename: 'Users (store)',
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
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.UserGroup.UserSelectingPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    function setupDragZone(grid) {
      const gridDragZone = grid.getView().dragZone
      const originalGetDragData = gridDragZone.getDragData
      gridDragZone.getDragData = function (e) {
        const t = Ext.lib.Event.getTarget(e)
        if (t.className === 'x-grid3-row-checker') {
          return false
        }
        return originalGetDragData.call(gridDragZone, e)
      }

      const originalStartDrag = gridDragZone.startDrag
      gridDragZone.startDrag = function (x, y) {
        Ext.getBody().addClass('sm-grabbing')
        return originalStartDrag.call(gridDragZone, x, y)
      }

      const originalOnDragDrop = gridDragZone.onDragDrop
      gridDragZone.onDragDrop = function (e, id) {
        Ext.getBody().removeClass('sm-grabbing')
        return originalOnDragDrop.call(gridDragZone, e, id)
      }

      const originalOnInvalidDrop = gridDragZone.onInvalidDrop
      gridDragZone.onInvalidDrop = function (e, id) {
        Ext.getBody().removeClass('sm-grabbing')
        return originalOnInvalidDrop.call(gridDragZone, e)
      }

    }
    const availableGrid = new SM.UserGroup.UserSelectingGrid({
      title: 'Available Users',
      iconCls: 'sm-user-icon',
      headerCssClass: 'sm-available-panel-header',
      role: 'available',
      flex: 1,
      listeners: {
        render: function (grid) {
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: selectionsGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelected(selectionsGrid, selectedRecords, availableGrid)
              return true
            }
          })
        },

      }
    })
    const selectionsGrid = new SM.UserGroup.UserSelectingGrid({
      title: 'Group Members',
      iconCls: 'sm-user-icon',
      headerCssClass: 'sm-selections-panel-header',
      role: 'selections',
      flex: 1,
      listeners: {
        render: function (grid) {
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: availableGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelected(availableGrid, selectedRecords, selectionsGrid)
              return true
            }
          })
        }
      }
    })
    availableGrid.getSelectionModel().on('selectionchange', handleSelections, selectionsGrid)
    selectionsGrid.getSelectionModel().on('selectionchange', handleSelections, availableGrid)

    const addBtn = new Ext.Button({
      iconCls: 'sm-add-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = availableGrid.getSelectionModel().getSelections()
        changeSelected(availableGrid, selectedRecords, selectionsGrid)
        btn.disable()
      }
    })
    const removeBtn = new Ext.Button({
      iconCls: 'sm-remove-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = selectionsGrid.getSelectionModel().getSelections()
        changeSelected(selectionsGrid, selectedRecords, availableGrid)
        btn.disable()
      }
    })
    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      width: 60,
      layout: {
        type: 'vbox',
        pack: 'center',
        align: 'center',
        padding: "10 10 10 10"
      },
      items: [
        addBtn,
        removeBtn,
        { xtype: 'panel', border: false, html: '<i>or drag</i>' }
      ]
    })

    function handleSelections() {
      const sm = this.selModel
      if (sm.hasSelection()) {
        sm.suspendEvents()
        sm.clearSelections()
        sm.resumeEvents()
        SM.SetCheckboxSelModelHeaderState(sm)
      }
      const availableSelected = availableGrid.selModel.hasSelection()
      const selectionsSelected = selectionsGrid.selModel.hasSelection()
      addBtn.setDisabled(!availableSelected)
      removeBtn.setDisabled(!selectionsSelected)
    }

    async function initPanel(apiUserGroup) {
      const apiAvailableUsers = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/users`,
        method: 'GET'
      })

      // const promises = [
      //   Ext.Ajax.requestPromise({
      //     responseType: 'json',
      //     url: `${STIGMAN.Env.apiBase}/users`,
      //     params: {
      //       elevate: curUser.privileges.admin,
      //       projection: ['userGroups']
      //     },
      //     method: 'GET'
      //   })]
      // if (userGroupId) {
      //   promises.push(Ext.Ajax.requestPromise({
      //     responseType: 'json',
      //     url: `${STIGMAN.Env.apiBase}/user-groups/${userGroupId}`,
      //     params: {
      //       elevate: curUser.privileges.admin,
      //       projection: ['users']
      //     },
      //     method: 'GET'
      //   }))
      // }
      // const [apiAvailableUsers, apiUserGroup] = await Promise.all(promises)
      const assignedUserIds = apiUserGroup?.users?.map(user => user.userId) ?? []
      _this.originalUserIds = assignedUserIds
      const availableUsers = []
      const assignedUsers = []
      apiAvailableUsers.reduce((accumulator, user) => {
        const property = assignedUserIds.includes(user.userId) ? 'assignedUsers' : 'availableUsers'
        accumulator[property].push(user)
        return accumulator
      }, { availableUsers, assignedUsers })

      availableGrid.store.loadData(availableUsers)
      selectionsGrid.store.loadData(assignedUsers)
      // _this.trackedProperty = { dataProperty: 'userGroups', value: apiUserGroup.name }

    }

    function fireSelectedChanged () {
      _this.fireEvent('selectedchanged', selectionsGrid.store.getRange().map( r => r.data.userId ))
    }

    function changeSelected(srcGrid, records, dstGrid) {
      srcGrid.store.suspendEvents()
      dstGrid.store.suspendEvents()
      srcGrid.store.remove(records)
      dstGrid.store.add(records)
      const { field, direction } = dstGrid.store.getSortState()
      dstGrid.store.sort(field, direction)
      dstGrid.getSelectionModel().selectRecords(records)
      srcGrid.store.resumeEvents()
      dstGrid.store.resumeEvents()

      srcGrid.store.fireEvent('datachanged', srcGrid.store)
      dstGrid.store.fireEvent('datachanged', dstGrid.store)
      srcGrid.store.fireEvent('update', srcGrid.store)
      dstGrid.store.fireEvent('update', dstGrid.store)
      dstGrid.store.filter(dstGrid.getView().getFilterFns())
      dstGrid.getView().focusRow(dstGrid.store.indexOfId(records[0].data.assetId))

      fireSelectedChanged ()
    }

    function getValue() {
      const records = selectionsGrid.store.snapshot?.items ?? selectionsGrid.store.getRange()
      return records.map(record => record.data.userId)
    }

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      name: 'users',
      border: false,
      items: [
        availableGrid,
        buttonPanel,
        selectionsGrid
      ],
      availableGrid,
      selectionsGrid,
      initPanel,
      getValue,
      // need fns below so Ext handles us like a form field
      setValue: () => { },
      markInvalid: function () { },
      clearInvalid: function () { },
      isValid: () => true,
      getName: () => this.name,
      validate: () => true
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.UserGroup.UserGroupFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const usersPanel = new SM.UserGroup.UserSelectingPanel({
      hideLabel: true,
      border: true,
      anchor: '0 -110',
      isFormField: true,
      submitValue: true,
      listeners: {
        selectedchanged: function (userGroupIds) {
          _this.fireEvent('propsupdate', 'userIds', userGroupIds)
        }
      }
    })
    const userGroupItems = [
      {
        xtype: 'textfield',
        fieldLabel: 'Group Name',
        allowBlank: false,
        anchor: '100%',
        name: 'name',
        enableKeyEvents: true,
        listeners: {
          change: (field, newValue, oldValue) => {
            if (!newValue?.trim()) { // only spaces
              field.setValue(oldValue)
              return
            }
            _this.fireEvent('propsupdate', 'name', newValue)
          }
        }
      },
      {
        xtype: 'textfield',
        fieldLabel: 'Description',
        allowBlank: true,
        anchor: '100%',
        name: 'description',
        enableKeyEvents: true,
        listeners: {
          change: (field, newValue, oldValue) => {
            _this.fireEvent('propsupdate', 'description', newValue)
          }
        }
      }
    ]

    const config = {
      baseCls: 'x-plain',
      labelWidth: 70,
      items: [
        {
          xtype: 'fieldset',
          title: '<b>User Group information</b>',
          items: userGroupItems
        },
        usersPanel
      ],
      usersPanel
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)

    // this.getForm().getFieldValues = function (dirtyOnly, getDisabled) {
    //   // Override to support submitValue boolean
    //   var o = {},
    //     n,
    //     key,
    //     val;
    //   this.items.each(function (f) {
    //     // Added condition for f.submitValue
    //     if (f.submitValue && (!f.disabled || getDisabled) && (dirtyOnly !== true || f.isDirty())) {
    //       n = f.getName();
    //       key = o[n];
    //       val = f.getValue();

    //       if (Ext.isDefined(key)) {
    //         if (Ext.isArray(key)) {
    //           o[n].push(val);
    //         } else {
    //           o[n] = [key, val];
    //         }
    //       } else {
    //         o[n] = val;
    //       }
    //     }
    //   });
    //   return o;
    // }
  }
})

SM.UserGroup.showUserGroupProps = async function (userGroupId) {
  try {
    const listeners = {}
    if (userGroupId) {
      listeners.propsupdate = onPropsUpdate //live updates for existing groups
    }
    else {
      listeners.clientvalidation = onClientValidation
    }

    const fp = new SM.UserGroup.UserGroupFormPanel({
      padding: '10px 15px 10px 15px',
      listeners,
      monitorValid: !userGroupId //fires clientvalidation event for new groups,

      // btnHandler: async function () {
      //   try {
      //     if (fp.getForm().isValid()) {
      //       const values = fp.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
      //       const jsonData = { name: values.name, description: values.description, userIds: values.users }

      //       const method = userGroupId ? 'PATCH' : 'POST'
      //       const url = userGroupId ? `${STIGMAN.Env.apiBase}/user-groups/${userGroupId}` : `${STIGMAN.Env.apiBase}/user-groups`
      //       const result = await Ext.Ajax.requestPromise({
      //         url,
      //         method,
      //         params: {
      //           elevate: curUser.privileges.admin,
      //           projection: ['users', 'collections', 'attributions']
      //         },
      //         headers: { 'Content-Type': 'application/json;charset=utf-8' },
      //         jsonData
      //       })
      //       const apiUserGroup = JSON.parse(result.response.responseText)
      //       const event = userGroupId ? 'usergroupchanged' : 'usergroupcreated'
      //       SM.Dispatcher.fireEvent(event, apiUserGroup)
      //       appwindow.close()
      //     }
      //   }
      //   catch (e) {
      //     SM.Error.handleError(e)
      //   }
      // }
    })

    async function onPropsUpdate(property, value) {
      const apiUser = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/user-groups/${userGroupId}`,
        method: 'PATCH',
        params: {
          elevate: curUser.privileges.admin,
          projection: ['users', 'collections', 'attributions']
        },
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        jsonData: {
          [property]: value
        }
      })
      SM.Dispatcher.fireEvent('usergroupchanged', apiUser)
    }

    function onClientValidation(formPanel, isValid) {
      formPanel.ownerCt.buttons[0].setDisabled(!isValid)
    }

    async function windowBtnHandler(btn) {
      if (btn.action === 'close') {
        appwindow.close()
      }
      else if (btn.action === 'save') {
        try {
          if (fp.getForm().isValid()) {
            const values = fp.getForm().getFieldValues()
            values.userIds = values.users
            delete values.users
            const apiUserGroup = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/user-groups`,
              method: 'POST',
              params: {
                elevate: curUser.privileges.admin,
                projection: ['users', 'collections', 'attributions']
              },
              headers: { 'Content-Type': 'application/json;charset=utf-8' },
              jsonData: values
            })
            const event = userGroupId ? 'usergroupchanged' : 'usergroupcreated'
            SM.Dispatcher.fireEvent(event, apiUserGroup)
            appwindow.close()
          }
        }
        catch (e) {
          SM.Error.handleError(e)
        }

      }
    }

    const appwindow = new Ext.Window({
      title: userGroupId ? 'Group ID ' + userGroupId : 'New Group',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      hidden: true,
      width: 660,
      height: 650,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: fp,
      buttons: [{
        text: userGroupId ? 'Close' : 'Save',
        action: userGroupId ? 'close' : 'save',
        handler: windowBtnHandler
      }]
    })


    appwindow.show(Ext.getBody());

    let apiUserGroup
    if (userGroupId) {
      apiUserGroup = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/user-groups/${userGroupId}`,
        params: {
          elevate: curUser.privileges.admin,
          projection: ['users']
        },
        method: 'GET'
      })
      fp.getForm().setValues(apiUserGroup)
    }
    await fp.usersPanel.initPanel(apiUserGroup)

    Ext.getBody().unmask();
  }
  catch (e) {
    Ext.getBody().unmask()
    SM.Error.handleError(e)
  }
}

SM.UserGroup.addUserGroupAdmin = function ({treePath}) {
	const tab = Ext.getCmp('main-tab-panel').getItem('user-group-admin-tab')
	if (tab) {
		tab.show()
		return
	}

	const userGroupGrid = new SM.UserGroup.UserGroupGrid({
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
		region: 'center',
		stripeRows:true,
		loadMask: {msg: ''},
    listeners: {
      rowdblclick: function (grid, rowIndex) {
        SM.UserGroup.showUserGroupProps(grid.getStore().getAt(rowIndex).get('userGroupId'))
      }
    }
	})

	const onUserGroupChanged = function (apiUserGroup) {
		userGroupGrid.store.loadData(apiUserGroup, true)
		const sortState = userGroupGrid.store.getSortState()
		userGroupGrid.store.sort(sortState.field, sortState.direction)
		userGroupGrid.getSelectionModel().selectRow(userGroupGrid.store.findExact('userGroupId',apiUserGroup.userGroupId))
	}
	SM.Dispatcher.addListener('usergroupchanged', onUserGroupChanged)
	SM.Dispatcher.addListener('usergroupcreated', onUserGroupChanged)


	const thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'user-group-admin-tab',
		sm_treePath: treePath, 
		iconCls: 'sm-users-icon',
		title: 'User Groups',
		closable:true,
		layout: 'border',
		border: false,
		items: [userGroupGrid],
		listeners: {
			// beforedestroy: function(grid) {
			// 	SM.Dispatcher.removeListener('userchanged', onUserChanged)
			// 	SM.Dispatcher.removeListener('usercreated', onUserChanged)
			// }
		}
	})
	thisTab.show()
	
	userGroupGrid.getStore().load()
}
