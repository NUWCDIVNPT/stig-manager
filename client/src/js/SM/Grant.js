Ext.ns('SM.Grant')

SM.Grant.GranteeTreePanel = Ext.extend(Ext.tree.TreePanel, {
  initComponent: function () {
    const _this = this
    const timestampRef = Math.floor(new Date().getTime() / 1000)

    const activeFilterComboBox = new Ext.form.ComboBox({
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      width: 120,
      store: new Ext.data.ArrayStore({
          fields: [
              'earliestTimestamp',
              'displayText'
          ],
          data: [
            [0, 'All'],
            [timestampRef - (86400 * 30), 'Active last 30 days'],
            [timestampRef - (86400 * 60), 'Active last 60 days'],
            [timestampRef - (86400 * 90), 'Active last 90 days'],
          ]
      }),
      valueField: 'earliestTimestamp',
      value: 0,
      displayField: 'displayText',
      listeners: {
        select: function (unused, record) {
          filters.earliestTimestamp = record.data.earliestTimestamp
          _this.root.cascade(filterNodes)
        }
      }
    })

    const nameFilterTextField = new SM.ColumnFilters.StringMatchTextField({
      emptyText: 'Filter names',
      height: 20,
      enableKeyEvents:true,
      listeners: {
        input: function (field,e) {
          _this.filters.nameFilter = field.getValue().toLowerCase()
          _this.root.cascade(filterNodes)
          return false
        }
      }
    })

    function shouldHideNode ({text, lastAccess}) {
      let passLastAccess = true
      if (lastAccess !== undefined) {
        passLastAccess = lastAccess >= filters.earliestTimestamp
      }
      const passName = text?.toLowerCase().includes(filters.nameFilter)
      return !(passLastAccess && passName)
    }

    function filterNodes (node) {
      const attr = node.attributes
      if (attr.type !== 'user' && attr.type !== 'user-group') {
        return true
      }
      if (shouldHideNode({text: attr.text, lastAccess: attr.user?.lastAccess})) {
        node.ui.hide()
        if (attr.checked && !_this.radio) {
          node.ui.toggleCheck(false)
        }
      }
      else {
        node.ui.show()
      }
      return true
    }

    const filters = {
      nameFilter: '',
      earliestTimestamp: activeFilterComboBox.getValue()
    }

    const tbar = new Ext.Toolbar({
      items: [
        'Users:&nbsp;&nbsp;',
        activeFilterComboBox,
        '-',
        nameFilterTextField
      ]
    })

    const config = {
      autoScroll: true,
      filters,
      shouldHideNode,
      bodyStyle: 'padding:5px;',
      minSize: 220,
      root: {
        nodeType: 'async',
        id: `grantee-root`,
        expanded: true
      },
      rootVisible: false,
      loader: new Ext.tree.TreeLoader({
        directFn: this.loadTree
      }),
      loadMask: { msg: '' },
      listeners: {
        beforeexpandnode: function (n) {
          // n.loaded = false; // always reload from the server
        },
        expandnode: function (n) {
          console.log(`enpandnode ${n.id}`)
        }
      },
      tbar
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)

    if (this.radio) {
      // Override the Ext delegateClick() method to handle radio buttons correctly
      this.eventModel.delegateClick = function(e, t){
        if (this.beforeEvent(e)) {
            // the original method looks for type=checkbox
            if (e.getTarget('input[type=radio]', 1)) {
              this.onCheckboxClick(e, this.getNode(e))
            }
            else if (e.getTarget('.x-tree-ec-icon', 1)) {
              this.onIconClick(e, this.getNode(e));
            } else if (this.getNodeTarget(e)) {
              this.onNodeClick(e, this.getNode(e));
            }
        }
        else{
          this.checkContainerEvent(e, 'click');
        }
      }
    }
  },
  loadTree: async function (nodeId, cb) {
    try {
      const tp = this.ownerTree
      const existingGrants = tp.existingGrants ?? []
      const selectedGrant = tp.selectedGrant ?? {}
      const excludedUserIds = existingGrants.filter( g => g.userId && g.userId !== selectedGrant.userId).map(u=>u.userId)
      const excludedGroupIds = existingGrants.filter( g => g.userGroupId && g.userGroupId !== selectedGrant.userGroupId).map(g=>g.userGroupId)
      let match
      // Root
      if (nodeId === 'grantee-root') {
        const content = [
          {
            id: `grantee-user-groups-node`,
            type: 'user-groups-root',
            text: 'User Groups',
            iconCls: 'sm-users-icon',
            expanded: true
          },
          {
            id: `grantee-users-node`,
            type: 'users-root',
            text: 'Users',
            iconCls: 'sm-user-icon',
            expanded: true
          }
        ]
        cb(content, { status: true })
        return
      }
      // UserGroups
      if (nodeId === 'grantee-user-groups-node') {
        const apiUserGroups = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/user-groups`,
          method: 'GET'
        })
        const availUserGroups = apiUserGroups.filter( userGroup => !excludedGroupIds.includes(userGroup.userGroupId))

        const content = availUserGroups.map(userGroup => ({
          id: `${userGroup.userGroupId}-user-groups-group-node`,
          text: SM.he(userGroup.name),
          // hidden: !(SM.he(userGroup.name).includes(tp.filter.nameFilter)),
          hidden: tp.shouldHideNode({text: SM.he(userGroup.name)}),
          userGroup,
          type: 'user-group',
          iconCls: 'sm-users-icon',
          checked: userGroup.userGroupId === selectedGrant.userGroupId,
          qtip: SM.he(userGroup.description)
        }))
        cb(content, { status: true })
        return
      }
      // UserGroups-User
      match = nodeId.match(/^(\d+)-user-groups-group-node$/)
      if (match) {
        const userGroupId = match[1]
        const apiUsers = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/user-groups/${userGroupId}`,
          method: 'GET',
          params: {
            projection: 'users'
          }
        })
        const content = apiUsers.users.map(user => ({
          id: `${userGroupId}-${user.userId}-user-group-user-leaf`,
          text: SM.he(user.displayName),
          leaf: true,
          type: 'user-group-user',
          iconCls: 'sm-user-icon',
          user,
          qtip: `Rules: ${SM.he(user.username)}`
        }))
        cb(content, { status: true })
        return
      }

      // Users
      if (nodeId === 'grantee-users-node') {
        const apiUsers = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/users`,
          method: 'GET'
        })
        const availUsers = apiUsers.filter( user => !excludedUserIds.includes(user.userId))

        const content = availUsers.map(user => ({
          id: `users-${user.userId}-user-leaf`,
          text: SM.he(user.displayName),
          hidden: tp.shouldHideNode({text: SM.he(user.displayName), lastAccess: user.lastAccess || 0}),
          user,
          type: 'user',
          leaf: true,
          checked: user.userId === selectedGrant.userId,
          iconCls: 'sm-user-icon',
          qtip: SM.he(user.username)
        }))
        cb(content, { status: true })
        return
      }
    }
    catch (e) {
      SM.Error.handleError(e)
    }
  }
})

SM.Grant.GranteeAddBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      disabled: true,
      height: 30,
      width: 150,
      margins: "10 10 10 10",
      icon: 'img/right-arrow-16.png',
      iconAlign: 'right',
      cls: 'x-btn-text-icon'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.GranteeRemoveBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      disabled: true,
      height: 30,
      width: 150,
      margins: "10 10 10 10",
      icon: 'img/left-arrow-16.png',
      iconAlign: 'left',
      cls: 'x-btn-text-icon'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.GrantGrid = Ext.extend(Ext.grid.EditorGridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
      'grantTarget',
      'grantTargetId',
      'title',
      'subtitle',
      'roleId',
      'recordId',
      'grantee'
    ]

    const store = new Ext.data.JsonStore({
      grid: this,
      root: '',
      fields,
      idProperty: 'recordId',
      sortInfo: {
        field: 'title',
        direction: 'ASC'
      }
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'grant',
      iconCls: 'sm-lock-icon'
    })
    const roleField = new SM.RoleComboBox({
      submitValue: false,
      grid: this,
      includeOwnerRole: this.canModifyOwners,
      listeners: {
        select: function (combo) {
          if (combo.startValue !== combo.value ) {
            combo.fireEvent("blur");
          } 
        }
      }
    })
    const colModel = new Ext.grid.ColumnModel({
      columns: [
        {
          header: "Grantee",
          width: 150,
          dataIndex: 'title',
          sortable: true,
          renderer: function (v, m, r) {
            const icon = r.data.grantTarget === 'user' ? 'sm-user-icon' : 'sm-users-icon'
            return `<div class="x-combo-list-item ${icon} sm-combo-list-icon" exportValue="${r.data.title ?? ''}:${r.data.subtitle ?? ''}"><span style="font-weight:600;">${r.data.title ?? ''}</span><br>${r.data.subtitle ?? ''}</div>`
          }
        },
        {
          header: '<span exportvalue="Role">Role<i class= "fa fa-question-circle sm-question-circle"></i></span>',
          width: 70,
          dataIndex: 'roleId',
          sortable: true,
          renderer: (v) => SM.RoleStrings[v],
          editor: roleField
        }
      ]
    })
    const selModel = new Ext.grid.RowSelectionModel({
      singleSelect: false
    })
    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        refresh: function (view) {
          // Setup the tooltip for column 'role'
          const index = view.grid.getColumnModel().findColumnIndex('roleId')
          const tipEl = view.getHeaderCell(index).getElementsByClassName('fa')[0]
          if (tipEl) {
            new Ext.ToolTip({
              target: tipEl,
              showDelay: 0,
              dismissDelay: 0,
              maxWidth: 600,
              html: SM.TipContent.Roles
            })
          }
        },
      },
    })
    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'CollectionGrants',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        }, {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })
    function viewready (grid) {
      // Setup the tooltip for column 'role'
      const index = grid.getColumnModel().findColumnIndex('roleId')
      const tipEl = grid.view.getHeaderCell(index).getElementsByClassName('fa')[0]
      if (tipEl) {
        new Ext.ToolTip({
          target: tipEl,
          showDelay: 0,
          dismissDelay: 0,
          maxWidth: 600,
          html: SM.TipContent.Roles
        })
      }
    }
    function getValue () {
      let grants = []
      store.data.items.forEach(i => {
        if (i.data.grantTarget === 'user')
          grants.push({
            userId: i.data.grantTargetId,
            roleId: i.data.roleId
          })
        else
          grants.push({
            userGroupId: i.data.grantTargetId,
            roleId: i.data.roleId
          })
      })
      return grants
    }
    function setValue (v) {
      const data = v.map(g => {
        if (g.user) return {
          grantTarget: 'user',
          grantTargetId: g.user.userId,
          subtitle: g.user.username,
          title: g.user.displayName,
          roleId: g.roleId,
          recordId: `U${g.user.userId}`

        }
        return {
          grantTarget: 'user-group',
          grantTargetId: g.userGroup.userGroupId,
          title: g.userGroup.name,
          subtitle: g.userGroup.description,
          roleId: g.roleId,
          recordId: `UG${g.userGroup.userGroupId}`
        }
      })
      store.loadData(data)
    }
    
    const config = {
      name: 'grants',
      allowBlank: false,
      layout: 'fit',
      height: 150,
      store,
      colModel,
      selModel,
      view,
      bbar,
      listeners: {
        viewready
      },
      getValue,
      setValue
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})
Ext.reg('sm-grant-grantgrid', SM.Grant.GrantGrid)

SM.Grant.RoleMenuPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const config = {}

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.NewGrantPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    function handleTreeCheck(node) {
      const checkedNodes = granteeTp.getChecked()
      addBtn.setDisabled(!checkedNodes.length)
    }

    const granteeTp = new SM.Grant.GranteeTreePanel({
      panel: this,
      role: 'available',
      title: 'Available Grantees',
      width: 320,
      existingGrants: this.existingGrants,
      listeners: {
        checkchange: handleTreeCheck
      }
    })
    granteeTp.getSelectionModel().on('beforeselect', function (sm, newNode, oldNode) {
      newNode.ui.toggleCheck()
      return false
    })
  
    new Ext.tree.TreeSorter(granteeTp, {
      dir: "asc"
    })

    const grantGrid = new SM.Grant.GrantGrid({
      title: 'New Grants',
      // emptyText: 'An Owner grant is required',
      iconCls: 'sm-lock-icon',
      headerCssClass: 'sm-selections-panel-header',
      role: 'selections',
      flex: 1
    })
    grantGrid.getSelectionModel().on('selectionchange', function (sm) {
      removeBtn.setDisabled(sm.getSelected()?.length)
    })

    function handleAddBtnItem (menuItem) {
      const checkedNodes = granteeTp.getChecked()
      const data = checkedNodes.map( node => {
        if (node.attributes.user) {
          return {
            grantTarget: 'user',
            grantTargetId: node.attributes.user.userId,
            subtitle: node.attributes.user.username,
            title: node.attributes.user.displayName,
            roleId: menuItem.roleId,
            recordId: `U${node.attributes.user.userId}`,
            grantee: node.attributes.user
          } 
        }
        else {
          return {
            grantTarget: 'user-group',
            grantTargetId: node.attributes.userGroup.userGroupId,
            title: node.attributes.userGroup.name,
            subtitle: node.attributes.userGroup.description,
            roleId: menuItem.roleId,
            recordId: `UG${node.attributes.userGroup.userGroupId}`,
            grantee: node.attributes.userGroup
          }
        }
      })
      for (const node of checkedNodes) {
        node.remove()
      }
      grantGrid.store.loadData(data, true)
      addBtn.disable()
    }

    const addBtnMenuItems = [
      {text: 'Role: Restricted', iconCls: 'sm-add-assignment-icon', roleId: 1, handler: handleAddBtnItem},
      {text: 'Role: Full', iconCls: 'sm-add-assignment-icon', roleId: 2, handler: handleAddBtnItem},
      {text: 'Role: Manage', iconCls: 'sm-add-assignment-icon', roleId: 3, handler: handleAddBtnItem},
      {text: 'Role: Owner', iconCls: 'sm-add-assignment-icon', roleId: 4, handler: handleAddBtnItem},
    ]

    const addBtn = new Ext.Button({
      iconCls: 'sm-add-assignment-icon',
      text: 'Add',
      margins: "10 0 10 0",
      disabled: true,
      menu: new Ext.menu.Menu({
        items: addBtnMenuItems
      })
    })

    const removeBtn = new Ext.Button({
      iconCls: 'sm-remove-assignment-icon',
      text: 'Remove',
      disabled: true,
      handler: function (btn) {
        const selectedRecords = grantGrid.getSelectionModel().getSelections()
        for (const record of selectedRecords) {
          const data = record.data
          if (data.grantTarget === 'user-group') {
            const node = new Ext.tree.AsyncTreeNode({
              id: `${data.grantTargetId}-user-groups-group-node`,
              text: SM.he(data.title),
              userGroup: data.grantee,
              hidden: granteeTp.shouldHideNode({text: SM.he(data.title), lastAccess:data.lastAccess}),
              type: 'user-group',
              iconCls: 'sm-users-icon',
              checked: false,
              qtip: SM.he(data.subtitle)
            })
            const parentNode = granteeTp.getNodeById('grantee-user-groups-node')
            parentNode.appendChild(node)
            if (!parentNode.isExpanded()) parentNode.expand({anim: false})
          }
          else if (data.grantTarget === 'user') {
            const node = new Ext.tree.TreeNode({
              id: `users-${data.grantTargetId}-user-leaf`,
              text: SM.he(data.title),
              hidden: granteeTp.shouldHideNode({text: SM.he(data.title), lastAccess:data.grantee.lastAccess}),
              user: data.grantee,
              type: 'user',
              iconCls: 'sm-user-icon',
              checked: false,
              qtip: SM.he(data.subtitle)
            })
            const parentNode = granteeTp.getNodeById('grantee-users-node')
            parentNode.appendChild(node)
            // if (!parentNode.isExpanded()) parentNode.expand({anim: false})
          }
        }
        grantGrid.store.remove(selectedRecords)
        btn.disable()
      }
    })

    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      width: 120,
      layout: {
        type: 'vbox',
        pack: 'center',
        align: 'center',
      },
      items: [
        addBtn,
        removeBtn
      ]
    })

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      border: false,
      items: [
        granteeTp,
        buttonPanel,
        grantGrid
      ],
      granteeTp,
      grantGrid,
      buttonPanel
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Grant.showNewGrantWindow = function ({collectionId, existingGrants, canModifyOwners, elevate = false}) {
  try {
    async function saveHandler () {
      try {
        const grants = panel.grantGrid.getValue()
        await SM.Grant.Api.postGrantsByCollection({collectionId, grants, elevate})
      }
      catch (e) {
        SM.Error.handleError(e)
      }
      finally {
        panelWindow.close()
      }
    }
      
    const panel = new SM.Grant.NewGrantPanel({existingGrants, canModifyOwners})

    const saveBtn = new Ext.Button({
      text: 'Save',
      disabled: true,
      id: 'submit-button',
      handler: saveHandler
    })

    panel.grantGrid.store.on('add', grantGridStoreHandler)
    panel.grantGrid.store.on('remove', grantGridStoreHandler)

    function grantGridStoreHandler () {
      const action = panel.grantGrid.store.data.items.length ? saveBtn.enable : saveBtn.disable
      action.call(saveBtn)
    }

    const panelWindow = new Ext.Window({
      title: `New Grants for ${collectionId}`,
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      hidden: true,
      width: 800,
      height: 600,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:20px;',
      buttonAlign: 'right',
      items: panel,
      buttons: [
        {
          text: 'Cancel',
          handler: function () {
            panelWindow.close();
          }
        },
        saveBtn
      ]
    })
    panel.panelWindow = panelWindow
    panelWindow.render(Ext.getBody())
    Ext.getBody().unmask()
    panelWindow.show()
  }
  catch (e) {
    if (typeof e === 'object') {
      if (e instanceof Error) {
        e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
      }
      else {
        e = JSON.stringify(e);
      }
    }
    SM.Error.handleError(e)
    Ext.getBody().unmask()
  }
}

SM.Grant.showEditGrantWindow = function ({existingGrants, selectedGrant, includeOwnerRole, cb = Ext.emptyFn}) {
  const roleComboBox = new SM.RoleComboBox({
    fieldLabel: 'Role',
    width: 80,
    padding: '5 0 0 0',
    value: selectedGrant.roleId, 
    includeOwnerRole
  })

  let selectedNode
  
  function handleTreeCheck(node) {
    if (node.attributes.checked) {
      granteeDisplayField.setValue(renderGranteeNode(node.attributes))
      selectedNode = node
    }
  }

  function onInitialExpandNode(node) {
    if (node.attributes.id === 'grantee-users-node') {
      const checkedNode = granteeTp.getNodeById(document.querySelector('input[name="rg"]:checked').parentElement.getAttribute("ext:tree-node-id"))
      handleTreeCheck(checkedNode)
      granteeTp.removeListener('expandnode', onInitialExpandNode)
    }
  }

  const granteeTp = new SM.Grant.GranteeTreePanel({
    title: 'Available Grantees',
    flex: 1,
    margins: '0 0 10 0',
    radio: true,
    // width: 240,
    existingGrants,
    selectedGrant,
    listeners: {
      checkchange: handleTreeCheck,
      expandnode: onInitialExpandNode
    }
  })

  granteeTp.getSelectionModel().on('beforeselect', function (unused, newNode) {
    newNode.ui.toggleCheck(true)
    return false
  })

  function saveHandler () {
    const checkedAttributes = selectedNode.attributes
    const role = roleComboBox.getValue()
    const modifiedGrant = {
      roleId: role
    }
    modifiedGrant[checkedAttributes.user ? 'userId' : 'userGroupId'] = checkedAttributes.user?.userId|| checkedAttributes.userGroup?.userGroupId
    cb(modifiedGrant)
    panelWindow.close()
  }

  const renderGranteeNode = function (attr) {
    const icon = attr.user ? 'sm-user-icon' : 'sm-users-icon'
    const title = attr.user ? attr.user.displayName : attr.userGroup.name
    const subtitle = attr.user ? attr.user.username : attr.userGroup.description
    return `<div class="${icon}" style="border: #3d4245 1px solid; border-radius: 6px;    background-position:left; background-position-x: 5px; padding: 5px 5px 5px 25px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;"><span style="font-weight:600;">${title}</span><br>${subtitle}</div>`
  }

  const granteeDisplayField = new Ext.form.DisplayField({
    fieldLabel: 'Grantee',
    style: 'padding-bottom: 5px;',
    html: renderGranteeNode({user: {username: '--', displayName: '--'}})
  })

  const grantPanel = new Ext.Panel({
    title: 'Modified Grant',
    headerCssClass: 'sm-selections-panel-header',
    layout: 'form',
    layoutConfig: {
      labelWidth: 50
    },
    bodyStyle: 'padding: 9px;',
    height: 120,
    items: [
      granteeDisplayField,
      roleComboBox
    ]
  })

  const panelWindow = new Ext.Window({
    title: `Edit Grant`,
    cls: 'sm-dialog-window sm-round-panel',
    modal: true,
    hidden: true,
    width: 350,
    height: 550,
    layout: 'vbox',
    layoutConfig: {
      align: 'stretch',
    },
    plain: true,
    bodyStyle: 'padding:20px;',
    buttonAlign: 'right',
    items: [
      granteeTp,
      grantPanel
    ],
    buttons: [
      {
        text: 'Cancel',
        handler: () => panelWindow.close()
      },
      {
        text: 'Save',
        id: 'submit-button',
        handler: saveHandler
      }
    ]
  })
  // panelWindow.render(Ext.getBody())
  // Ext.getBody().unmask()
  panelWindow.show()
}

Ext.ns('SM.Grant.Api')

SM.Grant.Api.putGrantByCollectionGrant = async function ({collectionId, grantId, body, elevate}) {
  const params = elevate ? { elevate } : {}
  const api = await Ext.Ajax.requestPromise({
    responseType: 'json',
    url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/${grantId}`,
    params,
    method: 'PUT',
    jsonData: body
  })
  SM.Dispatcher.fireEvent('grant.updated', {collectionId, grantId, api})
  return api
}

SM.Grant.Api.deleteGrantByCollectionGrant = async function ({collectionId, grantId, elevate}) {
  const elevateParam = elevate ? '?elevate=true' : ''
  const api = await Ext.Ajax.requestPromise({
    responseType: 'json',
    url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/${grantId}${elevateParam}`,
    method: 'DELETE'
  })
  SM.Dispatcher.fireEvent('grant.deleted', {collectionId, grantId, api})
  return api
}

SM.Grant.Api.postGrantsByCollection = async function({collectionId, grants, elevate}) {
  const params = elevate ? { elevate } : {}
  const api = await Ext.Ajax.requestPromise({
    responseType: 'json',
    url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants`,
    params,
    method: 'POST',
    jsonData: grants
  })
  SM.Dispatcher.fireEvent('grant.created', {collectionId, api})
  return api
}