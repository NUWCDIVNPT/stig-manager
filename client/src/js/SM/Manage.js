'use strict'

Ext.ns('SM')
Ext.ns('SM.Manage')

Ext.ns('SM.Manage.FieldSettings')
SM.Manage.FieldSettings.FieldEnabledComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }
    const _this = this
    const data = [
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
    this.superclass().initComponent.call(this)

    this.store.loadData(data)
  }
})

SM.Manage.FieldSettings.FieldRequiredComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const _this = this
    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }
    const dataAlways = [
      ['always', 'Always'],
      ['findings', 'Findings only'],
      ['optional', 'Optional']
    ]
    const dataFails = [
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
    this.superclass().initComponent.call(this)

    this.setListByEnabledValue(this.enabledField?.value || 'always')

  }
})

SM.Manage.FieldSettings.ReviewFieldSet = Ext.extend(Ext.form.FieldSet, {
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
    const detailEnabledCombo = new SM.Manage.FieldSettings.FieldEnabledComboBox({
      name: 'detailEnabled',
      value: _this.fieldSettings.detail.enabled,
      anchor: '-10',
      listeners: {
        select: onSelect
      }
    })
    const detailRequiredCombo = new SM.Manage.FieldSettings.FieldRequiredComboBox({
      name: 'detailRequired',
      enabledField: detailEnabledCombo,
      value: _this.fieldSettings.detail.required,
      anchor: '-5',
      listeners: {
        select: onSelect
      }
    })
    detailEnabledCombo.requiredField = detailRequiredCombo

    const commentEnabledCombo = new SM.Manage.FieldSettings.FieldEnabledComboBox({
      name: 'commentEnabled',
      value: _this.fieldSettings.comment.enabled,
      anchor: '-10',
      listeners: {
        select: onSelect
      }
    })
    const commentRequiredCombo = new SM.Manage.FieldSettings.FieldRequiredComboBox({
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

    const config = {
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
    this.superclass().initComponent.call(this);
  }
})

Ext.ns('SM.Manage.StatusSettings')
SM.Manage.StatusSettings.AcceptCheckbox = Ext.extend(Ext.form.Checkbox, {
  initComponent: function () {
    const config = {
      boxLabel: this.boxLabel || 'Accept or Reject reviews'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Manage.StatusSettings.GrantComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }
    const _this = this
    const data = [
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
    this.superclass().initComponent.call(this)
    this.store.loadData(data)
  }
})

SM.Manage.StatusSettings.CriteriaComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }
    const _this = this
    const data = [
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
    this.superclass().initComponent.call(this)
    this.store.loadData(data)
  }
})

SM.Manage.StatusSettings.StatusFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const _this = this
    _this.statusSettings = _this.statusSettings ?? {
      canAccept: true,
      minAcceptGrant: 3,
      resetCriteria: 'result'
    }
    const canAcceptCheckbox = new SM.Manage.StatusSettings.AcceptCheckbox({
      name: 'canAccept',
      ctCls: 'sm-cb',
      hideLabel: true,
      boxLabel: 'Reviews can be Accepted or Rejected',
      checked: _this.statusSettings.canAccept,
      listeners: {
        check: onStatusCheck
      }
    })
    const grantComboBox = new SM.Manage.StatusSettings.GrantComboBox({
      name: 'minAcceptGrant',
      fieldLabel: '<span>Grant required to set Accept or Reject</span>',
      disabled: !_this.statusSettings.canAccept,
      width: 125,
      value: _this.statusSettings.minAcceptGrant,
      listeners: {
        select: onComboSelect
      }
    })

    const criteriaComboBox = new SM.Manage.StatusSettings.CriteriaComboBox({
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

    const config = {
      title: _this.title || 'Review status',
      labelWidth: 220,
      items: [
        criteriaComboBox,
        canAcceptCheckbox,
        grantComboBox
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

Ext.ns('SM.Manage.HistorySettings')
SM.Manage.HistorySettings.MaxReviewsComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }
    const data = [
      [0, 'disabled']
    ]
    for (let limit = 1; limit < 16; limit++) {
      data.push([limit, `capped at ${limit}`])
    }
    this.store = new Ext.data.SimpleStore({
      fields: ['value', 'display']
    })
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.store.loadData(data)
  }
})

SM.Manage.HistorySettings.HistoryFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const _this = this
    _this.historySettings = _this.historySettings ?? {
      maxReviews: 5
    }
    const maxReviewsComboBox = new SM.Manage.HistorySettings.MaxReviewsComboBox({
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

    const config = {
      title: _this.title || 'Review history',
      labelWidth: 200,
      items: [
        maxReviewsComboBox
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

Ext.ns('SM.Manage.Collection')
SM.Manage.Collection.ApiAddOrUpdate = async function (collectionId, collectionObj, options = {}) {
  let url, method
  if (options.elevate && collectionId) {
      delete collectionObj.settings
      delete collectionObj.metadata
      delete collectionObj.labels
  }
  let elevateParam = options.elevate === true || options.elevate === false ? `?elevate=${options.elevate}` : ''
  if (collectionId) {
    url = `${STIGMAN.Env.apiBase}/collections/${collectionId}${elevateParam}`
    method = 'PATCH'
  }
  else {
    url = `${STIGMAN.Env.apiBase}/collections${elevateParam}`,
    method = 'POST'
  }
  let apiCollection = await Ext.Ajax.requestPromise({
    responseType: 'json',
    url,
    method,
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    params: {
      projection: ['owners', 'statistics', 'labels']
    },
    jsonData: collectionObj
  })
  SM.Cache.updateCollection(apiCollection)
  // Refresh the curUser global
  await SM.GetUserObject()
  
  let event = collectionId ? 'collectionchanged' : 'collectioncreated'
  SM.Dispatcher.fireEvent( event, apiCollection, options )
  return apiCollection
}

SM.Manage.Collection.MetadataGrid = Ext.extend(Ext.grid.GridPanel, {
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
    const totalTextCmp = new SM.RowCountTextItem({
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
        const entries = _this.ignoreKeys.length ? Object.entries(v).filter(entry => !_this.ignoreKeys.includes(entry[0])) : Object.entries(v)
        this.store.loadData(entries)
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.Manage.Collection.GrantsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    this.canModifyOwners = !!this.canModifyOwners
    const fields = [
      'grantId',
      'user',
      'userGroup',
      'roleId',
      {
        name: 'name',
        convert: (v, r) => r.user?.displayName ?? r.userGroup.name
      }
    ]

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: this.url,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      proxy: this.proxy,
      baseParams: this.baseParams,
      root: '',
      fields,
      idProperty: 'grantId',
      sortInfo: {
        field: 'name',
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
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'grant',
      iconCls: 'sm-lock-icon'
    })

    let toolsMarkup = '<span class="sm-grid-cell-tool" style="padding-right:4px"><img data-action="showEditGrant" ext:qtip="Edit grant" src="img/edit.svg" width="14" height="14"></span>'
    if (this.context !== 'admin') {
      toolsMarkup += '<span class="sm-grid-cell-tool" style="padding-right:4px"><img data-action="editAcl" ext:qtip="Edit ACL" src="img/target.svg" width="14" height="14"></span>'
    }
    toolsMarkup += '<span class="sm-grid-cell-tool"><img data-action="removeGrant" ext:qtip="Remove grant" src="img/trash.svg" width="14" height="14"></span>'
    
    const colModel = new Ext.grid.ColumnModel({
      columns: [
        {
          header: '<span exportvalue="Role">Role<i class= "fa fa-question-circle sm-question-circle"></i></span>',
          width: 50,
          dataIndex: 'roleId',
          sortable: true,
          renderer: (v) => `<div class="sm-grid-cell-role">${SM.RoleStrings[v]}</div>`
        },
        {
          header: "User or Group",
          width: 150,
          dataIndex: 'name',
          sortable: true,
          renderer: function (v, m, r) {
            const icon = r.data.user ? 'sm-user-icon' : 'sm-users-icon'
            const subtitle = r.data.user?.username ?? r.data.userGroup.description
            // const title = r.data.user?.displayName ?? r.data.userGroup.name
            return `
            <div class="sm-grid-cell-with-toolbar-2">
              <div class="sm-dynamic-width">
                <div class="sm-info">
                  <div class="x-combo-list-item ${icon} sm-combo-list-icon" exportValue="${v}:${subtitle}"><span style="font-weight:600;">${v}</span><br>${subtitle}</div>
                </div>
              </div>
              <div class="sm-static-width" style="top: 25%">
              ${r.data.roleId !== 4 || _this.canModifyOwners || _this.context === 'admin' ? toolsMarkup : ''}
              </div>
            </div>`   
          }
        }
      ]
    })

    function showEditGrant (grantData, record) {
      console.log(`changeGrantee ${JSON.stringify(grantData)}`)
      const selectedGrant = {
        grantId: grantData.grantId,
        roleId: grantData.roleId,
        userId: grantData.user?.userId,
        userGroupId: grantData.userGroup?.userGroupId
      }
      SM.Grant.showEditGrantWindow ({existingGrants: _this.getValue(), selectedGrant, includeOwnerRole: _this.canModifyOwners, cb})

      function cb (grant) {
        console.log(grant)
        _this.fireEvent('grantchange', grantData.grantId, grant)
      }
    }

    function editAcl (grantData) {
      SM.Acl.showAccess(_this.collectionId, grantData)
    }
    function removeGrant (grantData, record) {
      Ext.Msg.show({
        title: `Delete?`,
        msg: `You are about to delete the grant for "${SM.he(grantData.name)}". Do you wish to continue?`,
        buttons: Ext.Msg.YESNO,
        fn: (buttonId) => {
          if (buttonId === 'ok' || buttonId === 'yes') {
            _this.fireEvent('grantremove', grantData)
          }
        },
        icon: Ext.MessageBox.QUESTION
     })
    }

    const toolHandlers = {
      showEditGrant,
      editAcl,
      removeGrant
    }

    function cellclick(grid, rowIndex, columnIndex, e) {
      if (e.target.tagName === "IMG") {
        const record = grid.getStore().getAt(rowIndex)
        toolHandlers[e.target.dataset.action](record.data, record)
      }
    }

    const newGrantButton = new Ext.Button( {
      text: 'Add Grants...',
      iconCls: 'icon-add',
      handler: function () {
        SM.Grant.showNewGrantWindow({
          collectionId: _this.collectionId,
          existingGrants: _this.getValue(),
          canModifyOwners: _this.canModifyOwners,
          elevate: _this.context === 'admin'
        })
      }
    })
    const tbarItems = [
      newGrantButton,
    ]
    const tbar = new Ext.Toolbar({
      items: tbarItems
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      cellSelectorDepth: 0,
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        refresh: function (view) {
          // Setup the tooltip for column 'roleId'
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
          text: 'CSV',
          grid: this     
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

    function setValue (v, append = false) {
      store.loadData(v, append)
    }

    function getValue () {
      return store.data.items.map(i => i.data.user ? {
          userId: i.data.user.userId,
          roleId: i.data.roleId
        } : {
          userGroupId: i.data.userGroup.userGroupId,
          roleId: i.data.roleId
        }
      )
      // return store.data.items.map(i => i.data.user ?? i.data.userGroup)
    }

    const config = {
      name: 'grants',
      disableSelection: true,
      layout: 'fit',
      store,
      colModel,
      view,
      tbar,
      bbar,
      listeners: {
        viewready,
        cellclick
      },
      setValue,
      getValue
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Manage.Collection.UsersGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
      'grantees',
      {
        name: 'userId',
        mapping: 'user.userId'
      },
      {
        name: 'username',
        mapping: 'user.username'
      },
      'roleId',
      {
        name: 'displayName',
        mapping: 'user.displayName'
      }
    ]

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: this.url,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      proxy: this.proxy,
      baseParams: this.baseParams,
      root: 'users',
      fields,
      idProperty: 'userId',
      sortInfo: {
        field: 'username',
        direction: 'ASC'
      },
      listeners: {
        load: function (store, records) {
          totalTextCmp.setText(records.length + ' records');
        }
      }
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'user',
      iconCls: 'sm-user-icon'
    })
    const columns = [
      {
        header: "User",
        width: 150,
        dataIndex: 'username',
        sortable: true,
        renderer: function (v, m, r) {
          const icon = 'sm-user-icon'
          return `
            <div class="sm-grid-cell-with-toolbar-2">
              <div class="sm-dynamic-width">
                <div class="sm-info">         
                  <div class="x-combo-list-item ${icon} sm-combo-list-icon" exportValue="${r.data.displayName ?? ''}:${r.data.username ?? ''}"><span style="font-weight:600;">${r.data.displayName ?? ''}</span><br>${r.data.username ?? ''}</div>
                </div>
              </div>
              <div class="sm-static-width" style="top: 25%">
                <span class="sm-grid-cell-tool" style="padding-right:4px"><img data-action="showEffectiveAcl" ext:qtip="Show access" src="img/target.svg" width="14" height="14"></span>                
              </div>
            </div>`
        }
      },
      {
        header: '<span exportvalue="Grantee">Grantee<i class= "fa fa-question-circle sm-question-circle"></i></span>',
        width: 150,
        dataIndex: 'grantees',
        sortable: false,
        renderer: function (grantees) {
          const divs = []
          for (const grantee of grantees) {
            const icon = grantee.userId ? 'sm-user-icon' : 'sm-users-icon'
            const title = grantee.userId ? 'Direct' : grantee.name
            divs.push(`<div class="x-combo-list-item ${icon} sm-combo-list-icon" exportValue="${title}">
                        <span style="font-weight:600;">${title}</span></div>`)
          }
          return divs.join('')
        }
      },
      {
        header: '<span exportvalue="Role">Role<i class= "fa fa-question-circle sm-question-circle"></i></span>',
        width: 100,
        dataIndex: 'roleId',
        sortable: true,
        renderer: (v) => SM.RoleStrings[v],
      }
    ]

    // function showEffectiveAcl  () {}

    function cellclick(grid, rowIndex, columnIndex, e) {
      if (e.target.tagName === "IMG") {
        const r = grid.getStore().getAt(rowIndex)
        const defaultAccess = r.data.roleId === 1 ? 'none' : 'rw'
        SM.User.showCollectionAcl({ collectionId: _this.collectionId, userId: r.data.userId, displayName: r.data.displayName, defaultAccess })
      }
    }

    const viewAclBtn = new Ext.Button({
      iconCls: 'sm-asset-icon',
      disabled: true,
      text: 'View Effective Access List...',
      handler: function () {
        const r = _this.getSelectionModel().getSelected()
        const defaultAccess = r.data.roleId === 1 ? 'none' : 'rw'
        SM.User.showCollectionAcl({ collectionId: _this.collectionId, userId: r.data.userId, displayName: r.data.displayName, defaultAccess })
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'CollectionUsers',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this     
        }, {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const config = {
      name: 'users',
      allowBlank: false,
      disableSelection: true,
      stripeRows: true,
      layout: 'fit',
      height: 150,
      store,
      columns,
      view: new SM.ColumnFilters.GridView({
        emptyText: this.emptyText || 'No records to display',
        cellSelectorDepth: 0,
        deferEmptyText: false,
        forceFit: true,
        markDirty: false,
        listeners: {
          refresh: function (view) {
            // Setup the tooltip for column 'roleId'
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
      }),
      bbar,
      listeners: {
        viewready: function (grid) {
          // Setup the tooltip for column 'roleId'
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
        },
        cellclick
      },

      setValue: function (v) {
        store.loadData(v)
      }
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Manage.Collection.AdminGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'collectionId',
      'name',
      'description',
      'metadata',
      'owners',
      {
        name: 'assets',
        type: 'integer',
        mapping: 'statistics.assetCount'
      },
      {
        name: 'users',
        type: 'integer',
        mapping: 'statistics.userCount'
      },
      {
        name: 'checklists',
        type: 'integer',
        mapping: 'statistics.checklistCount'
      },
      {
        name: 'created',
        type: 'date',
        mapping: 'statistics.created'
      }
    ]
    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/collections`,
        method: 'GET'
      }),
      baseParams: {
        elevate: curUser.privileges.admin,
        projection: ['owners', 'statistics']
      },
      root: '',
      fields,
      isLoaded: false, // custom property
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        load: function (store, records) {
          store.isLoaded = true
        }
      }
    })

    const colModel = new Ext.grid.ColumnModel([
      {
        header: "Name",
        width: 150,
        dataIndex: 'name',
        sortable: true,
        filter: {type: 'string'}
      },
      {
        header: "Description",
        hidden: true,
        width: 300,
        dataIndex: 'description',
        sortable: true,
        filter: {type: 'string'}
      },
      {
        header: "Owners",
        width: 150,
        dataIndex: 'owners',
        sortable: true,
        renderer: function (v) {
          // assigning to v, used elsewhere, does not work here? v = v.map(i => i.username).join('\n')
          arguments[0] = v.map(u => u.username || u.name).join('\n')
          return columnWrap.apply(this, arguments)
        }
      },
      {
        header: "Users",
        width: 150,
        dataIndex: 'users',
        sortable: true
      },
      {
        header: "Assets",
        width: 150,
        dataIndex: 'assets',
        sortable: true
      },
      {
        header: "Checklists",
        width: 150,
        dataIndex: 'checklists',
        sortable: true
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
        header: "ID",
        width: 150,
        dataIndex: 'collectionId',
        sortable: true
      }
    ])

    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      // These listeners keep the grid in the same scroll position after the store is reloaded
      listeners: {
        filterschanged: function (view, item, value) {
          store.filter(view.getFilterFns())  
        },
        beforerefresh: function (v) {
          v.scrollTop = v.scroller.dom.scrollTop;
          v.scrollHeight = v.scroller.dom.scrollHeight;
        },
        refresh: function (v) {
          setTimeout(function () {
            v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
          }, 100);
        }
      },
      deferEmptyText: false
    })

    const selModel = new Ext.grid.RowSelectionModel({ singleSelect: true })
    const totalTextCmp = new SM.RowCountTextItem({store})

    const tbar = new Ext.Toolbar({
      items: [
        {
          iconCls: 'icon-add',
          text: 'New Collection',
          disabled: !(curUser.privileges.admin),
          handler: function () {
            showAdminCreatePanel(0);
          }
        },
        '-',
        {
          ref: '../removeBtn',
          iconCls: 'icon-del',
          text: 'Delete Collection',
          disabled: !(curUser.privileges.admin),
          handler: function () {
            let record = selModel.getSelected()
            let confirmStr = `Delete "${record.data.name}"?`

            Ext.Msg.confirm("Confirm", confirmStr, async function (btn, text) {
              try {
                if (btn == 'yes') {
                  Ext.getBody().mask('Deleting collection')
                  await Ext.Ajax.requestPromise({
                    url: `${STIGMAN.Env.apiBase}/collections/${record.data.collectionId}?elevate=true`,
                    method: 'DELETE'
                  })
                  SM.Dispatcher.fireEvent( 'collectiondeleted', record.data.collectionId )
                }
              }
              catch (e) {
                SM.Error.handleError(e)
              }
              finally {
                Ext.getBody().unmask()
              }
            });
          }
        }
      ]
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            store.reload()
          }
        },
        {
          xtype: 'tbseparator'
        }, 
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'Collection-Info',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this     
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
      selModel,
      colModel,
      view,
      store,
      tbar,
      bbar
  }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Manage.Collection.AdminPropertiesPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      labelStyle: 'font-weight: 600;',
      name: 'name',
      // allowBlank: false,
      anchor: '100%',
      enableKeyEvents: true,
      listeners: {
        change: async (field, newValue, oldValue) => {
          if (!newValue?.trim()) { // only spaces
            field.setValue(oldValue)
            return
          }
          try {
            const apiCollection = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
              method: 'PATCH',
              params: {
                elevate: true,
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
      name: 'description',
      anchor: '100% -30',
      listeners: {
        change: async (field, newValue, oldValue) => {
          try {
            const apiCollection = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}`,
              method: 'PATCH',
              params: {
                elevate: true,
                projection: 'labels'
              },
              jsonData: {
                description: newValue.trim()
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
    function grantChangeHandler (grantId, data) {
      return SM.Grant.Api.putGrantByCollectionGrant({
        collectionId: _this.collectionId,
        grantId,
        body: data,
        elevate: true
      })
    }
    function grantRemoveHandler (data) {
      return SM.Grant.Api.deleteGrantByCollectionGrant({
        collectionId: _this.collectionId,
        grantId: data.grantId,
        elevate: true
      })
    }
    function onGrantDeleted ({collectionId, grantId}) {
      if (collectionId === _this.collectionId) {
        const index = grantStore.findExact('grantId', grantId)
        if (index !== -1) grantStore.removeAt(index)
      }
    }
    function onGrantUpdated({collectionId, api}) {
      if (collectionId === _this.collectionId) {
        grantStore.loadData(api, true)
        const sortState = grantStore.getSortState()
        grantStore.sort(sortState.field, sortState.direction)
        const index = grantStore.findExact('grantId', api.grantId ?? api[0].grantId)
        grantGrid.getView().ensureVisible(index)
      }
    }

    function setFieldValues (apiCollection) {
      nameField.setValue(apiCollection.name)
      descriptionField.setValue(apiCollection.description)
      grantGrid.setValue(apiCollection.grants)
      _this.collectionId = apiCollection.collectionId
      grantGrid.collectionId = _this.collectionId
      _this.collectionName = apiCollection.name
    }

    const grantGrid = new SM.Manage.Collection.GrantsGrid({
      iconCls: 'sm-lock-icon',
      margins: '10 0 0 0',
      canModifyOwners: true,
      context: 'admin',
      title: 'Grants',
      border: true,
      region: 'center',
      flex: 1,
      listeners: {
        grantchange: grantChangeHandler,
        grantremove: grantRemoveHandler
      }
    })
    const grantStore = grantGrid.store
    SM.Dispatcher.addListener('grant.deleted', onGrantDeleted)
    SM.Dispatcher.addListener('grant.updated', onGrantUpdated)
    SM.Dispatcher.addListener('grant.created', onGrantUpdated)


    const config = {
      layout: 'vbox',
      layoutConfig: {
        align: 'stretch'
      },
      bodyStyle: 'padding: 9px;',
      border: false,
      setFieldValues,
      items: [
        {
          xtype: 'fieldset',
          labelWidth: 100,
          height: 120,
          title: 'Information',
          items: [nameField, descriptionField]
        },
        grantGrid
      ],
      listeners: {
        beforedestroy: () => {
          SM.Dispatcher.removeListener('grant.deleted', onGrantDeleted)
          SM.Dispatcher.removeListener('grant.updated', onGrantUpdated)
          SM.Dispatcher.removeListener('grant.created', onGrantUpdated)
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.Manage.Collection.AdminCreatePanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      labelStyle: 'font-weight: 600;',
      name: 'name',
      allowBlank: false,
      anchor: '100%',
    })
    const descriptionField = new Ext.form.TextArea({
      fieldLabel: 'Description',
      labelStyle: 'font-weight: 600;',
      name: 'description',
      anchor: '100% -30'
    })
    const newGrantPanel = new SM.Grant.NewGrantPanel({
      iconCls: 'sm-lock-icon',
      margins: '10 0 0 0',
      canModifyOwners: true,
      context: 'admin',
      border: true,
      region: 'center'
    })

    function getFieldValues () {
      return {
        name: nameField.getValue(),
        description: descriptionField.getValue(),
        grants: newGrantPanel.grantGrid.getValue()
      }
    }
    
    const config = {
      // baseCls: 'x-plain',
      cls: 'sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      labelWidth: 100,
      monitorValid: true,
      setFieldValues: function (apiCollection) {
        nameField.setValue(apiCollection.name)
        descriptionField.setValue(apiCollection.description)
        grantGrid.setValue(apiCollection.grants)
        _this.collectionId = apiCollection.collectionId
        _this.collectionName = apiCollection.name
      },
      getFieldValues,
      items: [
        {
          layout: 'border',
          anchor: '100% 0',
          hideLabels: true,
          border: false,
          // baseCls: 'x-plain',
          items: [
            {
              xtype: 'fieldset',
              region: 'north',
              height: 120,
              split: false,
              title: 'Information',
              items: [nameField, descriptionField]
            },
            newGrantPanel
          ]
        }
      ],
      buttons: [{
        text: this.btnText || 'Create Collection',
        formBind: true,
        handler: this.btnHandler || function () { }
      }]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.Manage.Collection.Panel = Ext.extend(Ext.Panel, {
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
      const apiCollection = await apiPatchSettings({
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
          fn: () => {
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
    const metadataGrid = new SM.Manage.Collection.MetadataGrid({
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

    const settingsReviewFields = new SM.Manage.FieldSettings.ReviewFieldSet({
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
    const settingsStatusFields = new SM.Manage.StatusSettings.StatusFieldSet({
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
    const settingsHistoryFields = new SM.Manage.HistorySettings.HistoryFieldSet({
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

    const grantChangeHandler = (grantId, data) => {
      return SM.Grant.Api.putGrantByCollectionGrant({
        collectionId: _this.apiCollection.collectionId,
        grantId,
        body: data
      })
    }

    const grantRemoveHandler = (data) => {
      return SM.Grant.Api.deleteGrantByCollectionGrant({
        collectionId: _this.apiCollection.collectionId,
        grantId: data.grantId
      })
    }

    const grantGrid = new SM.Manage.Collection.GrantsGrid({
      collectionId: _this.apiCollection.collectionId,
      iconCls: 'sm-lock-icon',
      canModifyOwners: this.canModifyOwners,
      url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}`,
      baseParams: {
        projection: 'grants'
      },
      title: 'Grants',
      border: false,
      listeners: {
        grantchange: grantChangeHandler,
        grantremove: grantRemoveHandler
      }
    })
    grantGrid.setValue(_this.apiCollection.grants)
    const grantStore = grantGrid.store

    function onGrantDeleted ({collectionId, grantId}) {
      if (collectionId === _this.apiCollection.collectionId) {
        const index = grantStore.findExact('grantId', grantId)
        if (index !== -1) grantStore.removeAt(index)
      }
    }
    function onGrantUpdated({collectionId, api}) {
      if (collectionId === _this.apiCollection.collectionId) {
        grantStore.loadData(api, true)
        const sortState = grantStore.getSortState()
        grantStore.sort(sortState.field, sortState.direction)
        const index = grantStore.findExact('grantId', api.grantId ?? api[0].grantId)
        grantGrid.getView().ensureVisible(index)
      }
    }
    SM.Dispatcher.addListener('grant.deleted', onGrantDeleted)
    SM.Dispatcher.addListener('grant.updated', onGrantUpdated)
    SM.Dispatcher.addListener('grant.created', onGrantUpdated)

    const usersGrid = new SM.Manage.Collection.UsersGrid({
      iconCls: 'sm-user-icon',
      title: 'Users',
      border: false,
      collectionId: _this.apiCollection.collectionId,
      url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}`,
      baseParams: {
        projection: 'users'
      }
    })
    // usersGrid.setValue(_this.apiCollection.users)


    this.labelGrid = new SM.Manage.Collection.LabelsGrid({
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
            const { labelId, uses, ...labelData } = record.data
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/collections/${_this.apiCollection.collectionId}/labels/${labelId}`,
              method: 'PATCH',
              jsonData: labelData
            })
            const sortState = grid.store.getSortState()
            grid.store.sort(sortState.field, sortState.direction)

            // Let the rest of the app know
            const newlabel = JSON.parse(result.response.responseText)
            SM.Dispatcher.fireEvent('labelchanged', _this.apiCollection.collectionId, newlabel)
          }
          catch (e) {
            SM.Error.handleError(e)
          }
        },
        labelcreated: async (grid, record) => {
          try {
            const { labelId, uses, ...labelData } = record.data
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

    const tp = new Ext.TabPanel({
      region: 'center',
      activeTab: 0,
      border: false,
      items: [
        grantGrid,
        usersGrid,
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
      ],
      listeners: {
        tabchange: function (tp, tab) {
          if (tab.title === 'Users') {
            usersGrid.store.load()
          }
        }
      }
    })

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
          items: [nameField, descriptionField]
        },
        tp
      ],
      listeners: {
        beforedestroy: () => {
          SM.Dispatcher.removeListener('grant.deleted', onGrantDeleted)
          SM.Dispatcher.removeListener('grant.updated', onGrantUpdated)
          SM.Dispatcher.removeListener('grant.created', onGrantUpdated)
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.Manage.Collection.LabelSpriteHtml = `<span class="sm-label-sprite {extraCls}" style="color:
    {[SM.getContrastYIQ(values.color)]};background-color: #{color};" 
    ext:qtip="{[SM.he(SM.he(values.description))]}">
    <tpl if="values.isUnlabeled===true"><i></tpl>
    {[SM.he(values.name)]}
    <tpl if="values.isUnlabeled===true"></i></tpl>
    </span>`

SM.Manage.Collection.LabelTpl = new Ext.XTemplate(
  SM.Manage.Collection.LabelSpriteHtml
)
SM.Manage.Collection.LabelArrayTpl = new Ext.XTemplate(
  '<tpl for=".">',
  `${SM.Manage.Collection.LabelSpriteHtml} `,
  '</tpl>'
)

SM.Manage.Collection.GetLabelSprites = function (collectionId, labelIds) {
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
  return SM.Manage.Collection.LabelArrayTpl.apply(labels)
}

SM.Manage.Collection.LabelEditTpl = new Ext.XTemplate(
  '<span class=sm-label-sprite style="color:{[SM.getContrastYIQ(values.color)]};background-color:#{color};">{[SM.he(values.name)]}</span><img class="sm-label-edit-color" src="img/color-picker.svg" width="12" height="12">'
)

SM.Manage.Collection.ColorMenu = Ext.extend(Ext.menu.Menu, {
  enableScrolling: false,
  hideOnClick: true,
  cls: 'x-color-menu',
  paletteId: null,

  initComponent: function () {
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
    this.superclass().initComponent.call(this)
    this.relayEvents(this.palette, ['select'])
    this.on('select', this.menuHide, this);
    if (this.handler) {
      this.on('select', this.handler, this.scope || this)
    }
  },

  menuHide: function () {
    if (this.hideOnClick) {
      this.hide(true)
    }
  }
})

SM.Manage.Collection.LabelNameEditor = Ext.extend(Ext.form.Field, {
  defaultAutoCreate: { tag: "div" },
  submitValue: false,
  initComponent: function () {
    this.superclass().initComponent.call(this)
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
    SM.Manage.Collection.LabelNameEditor.superclass.onRender.call(this, ct, position);
    const _this = this
    const cpm = new SM.Manage.Collection.ColorMenu({
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
      tpl: SM.Manage.Collection.LabelEditTpl,
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
  focus: function (selectText, delay) {
    if (delay) {
      this.focusTask = new Ext.util.DelayedTask(this.focus, this, [selectText, false]);
      this.focusTask.delay(Ext.isNumber(delay) ? delay : 10);
      return this;
    }
    if (this.rendered && !this.isDestroyed) {
      this.namefield.el.focus();
      if (selectText === true) {
        this.namefield.el.dom.select();
      }
    }
    return this;
  }
})

SM.Manage.Collection.LabelsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
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
    this.newRecordConstructor = Ext.data.Record.create([{
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
          return SM.Manage.Collection.LabelTpl.apply({
            color: record.data.color,
            name: v,
            description: ''
          })
        },
        editor: new SM.Manage.Collection.LabelNameEditor({
          grid: this
        })
      },
      {
        header: "Description",
        width: 70,
        dataIndex: 'description',
        sortable: false,
        editor: new Ext.form.TextField({ submitValue: false })
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
        const r = _this.getSelectionModel().getSelected()
        SM.Manage.Collection.showLabelAssetsWindow(_this.collectionId, r.get('labelId'))
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
    const totalTextCmp = new SM.RowCountTextItem({
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
          grid: this
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
    this.superclass().initComponent.call(this)
  }
})

SM.Manage.Collection.LabelsMenu = Ext.extend(Ext.menu.Menu, {
  initComponent: function () {
    this.addEvents('applied')
    const config = {
      items: [],
      listeners: {
        itemclick: this.onItemClick,
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.refreshItems(this.labels)
  },
  onItemClick: function (item, e) {
    if (item.hideOnClick) { // only the Apply item
      const labelIds = this.getCheckedLabelIds()
      this.fireEvent('applied', labelIds)
    }
  },
  getCheckedLabelIds: function (excludeUnused = false) {
    const checked = this.items.items.reduce(function (labelIds, item) {
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
      text: SM.Manage.Collection.LabelTpl.apply(label),
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
      hideOnClick: false,
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
        item.setText(SM.Manage.Collection.LabelTpl.apply(label))
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
    labels.sort((a, b) => {
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

SM.Manage.Collection.LabelAssetsFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    if (!this.collectionId) {
      throw new Error('missing property collectionId')
    }
    const assetSelectionPanel = new SM.AssetSelection.SelectingPanel({
      name: 'assets',
      collectionId: this.collectionId,
      isFormField: true,
      selectionsGridTitle: 'Tagged'
    })
    const labelData = { ...SM.Cache.getCollectionLabel(this.collectionId, this.labelId) }
    labelData.extraCls = 'sm-jumbo-sprite'
    const labelSpan = SM.Manage.Collection.LabelTpl.apply(labelData)
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
        handler: this.btnHandler || function () { }
      }],
      assetSelectionPanel
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)

  },
  initPanel: async function () {
    try {
      this.el.mask('')
      await this.assetSelectionPanel.initPanel({ labelId: this.labelId })
    }
    catch (e) {
      SM.Error.handleError(e)
    }
    finally {
      this.el.unmask()
    }
  }
})

SM.Manage.Collection.showLabelAssetsWindow = async function (collectionId, labelId) {
  try {
    let labelAssetsFormPanel = new SM.Manage.Collection.LabelAssetsFormPanel({
      collectionId,
      labelId,
      btnHandler: async function (btn) {
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
      plain: true,
      bodyStyle: 'padding:10px;',
      buttonAlign: 'right',
      items: labelAssetsFormPanel
    });

    appwindow.show(Ext.getBody())
    await labelAssetsFormPanel.initPanel() // Load asset grid store


    appwindow.show(Ext.getBody());
  }
  catch (e) {
    Ext.getBody().unmask()
    SM.Error.handleError(e)
  }
}

SM.Manage.Collection.CreateFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      labelStyle: 'font-weight: 600;',
      name: 'name',
      allowBlank: false,
      anchor: '100%'
    })
    const descriptionField = new Ext.form.TextArea({
      fieldLabel: 'Description',
      labelStyle: 'font-weight: 600;',
      name: 'description',
      anchor: '100% -30',
    })
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      labelWidth: 100,
      monitorValid: true,
      items: [
        {
          xtype: 'fieldset',
          region: 'north',
          height: 180,
          split: false,
          title: 'Information',
          items: [nameField, descriptionField]
        }
      ],
      buttons: [{
        text: this.btnText || 'Save',
        formBind: true,
        handler: this.btnHandler || function () { }
      }]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.Manage.Collection.showCreateWindow = function () {
  const fp = new SM.Manage.Collection.CreateFormPanel({
    btnHandler: async () => {
      try {
        let values = fp.getForm().getFieldValues()
        values.grants = [{userId: curUser.userId, roleId: 4}]
        values.metadata = {}
        await SM.Manage.Collection.ApiAddOrUpdate(0, values, {
          showManager: true
        })
      }
      catch (e) {
        if (e.responseText) {
          const response = SM.safeJSONParse(e.responseText)
          if (response?.detail === 'Duplicate name exists.') {
            Ext.Msg.alert('Name unavailable', 'The Collection name is unavailable. Please try a different name.')
          }
          else {
            appwindow.close()
            await SM.Error.handleError(e)
          }
        }
      }
      finally {
        panelWindow.close()
      }
    }
  })

  const panelWindow = new Ext.Window({
    id: 'window-project-info',
    cls: 'sm-dialog-window sm-round-panel',
    title: 'Create Collection',
    modal: true,
    width: 460,
    height:260,
    layout: 'fit',
    plain: false,
    // bodyStyle:'padding:5px;',
    buttonAlign:'right',
    items: fp
  })
  panelWindow.show(Ext.getBody())
}

Ext.ns('SM.Manage.Asset')
Ext.ns('SM.Manage.Stig')

SM.Manage.Asset.showAssetProps = async function (assetId, initialCollectionId) {
  try {
    let assetPropsFormPanel = new SM.Manage.Asset.PropertiesFormPanel({
      id: 'dev-test',
      padding: '10px 15px 10px 15px',
      initialCollectionId,
      btnHandler: async function () {
        try {
          if (assetPropsFormPanel.getForm().isValid()) {
            let values = assetPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
            values.labelNames = values.labelIds
            delete values.labelIds
            // //TODO: getFieldValues should not return 'undefined' 
            delete values.undefined
            const method = assetId ? 'PUT' : 'POST'
            const url = assetId ? `${STIGMAN.Env.apiBase}/assets/${assetId}` : `${STIGMAN.Env.apiBase}/assets`
            const returnedAsset = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url,
              method,
              headers: { 'Content-Type': 'application/json;charset=utf-8' },
              jsonData: values
            })
            const apiAsset = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/collections/${initialCollectionId}/metrics/summary/asset`,
              method: 'GET',
              params: {
                assetId: returnedAsset.assetId
              }
            })
            apiAsset.collection = returnedAsset.collection
            const event = assetId ? 'assetchanged' : 'assetcreated'
            SM.Dispatcher.fireEvent(event, apiAsset)
            appwindow.close()
          }
        }
        catch (e) {
          if (e.responseText) {
            const response = SM.safeJSONParse(e.responseText)
            if (response?.detail === 'Duplicate name exists.') {
              Ext.Msg.alert('Name unavailable', 'The Asset name is already used in this Collection. Please try a different name.')
            }
            else {
              appwindow.close()
              await SM.Error.handleError(e)
            }
          }
        }
      }
    })

    /******************************************************/
    // Form window
    /******************************************************/
    const appwindow = new Ext.Window({
      id: 'assetPropsWindow',
      cls: 'sm-dialog-window sm-round-panel',
      title: assetId ? 'Asset Properties, ID ' + assetId : 'Create new Asset',
      modal: true,
      hidden: true,
      width: 800,
      height: 800,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: assetPropsFormPanel
    });


    appwindow.render(Ext.getBody())
    // await assetPropsFormPanel.initPanel()

    if (assetId) {
      let apiAsset = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
        params: {
          projection: ['stigs']
        },
        method: 'GET'
      })
      apiAsset.collectionId = apiAsset.collection.collectionId
      delete apiAsset.collection
      assetPropsFormPanel.getForm().setValues(apiAsset)
      assetPropsFormPanel.stigSelectingPanel.initPanel(apiAsset)
    }
    else {
      assetPropsFormPanel.stigSelectingPanel.initPanel({stigs: []})
    }

    Ext.getBody().unmask();
    appwindow.show(Ext.getBody());
  }
  catch (e) {
    Ext.getBody().unmask()
    SM.Error.handleError(e)
  }
}

SM.Manage.Asset.Grid = Ext.extend(Ext.grid.GridPanel, {
  onAssetChangedOrCreated: function (apiAsset) {
    if (apiAsset.collection.collectionId === this.collectionId) {
      this.store.loadData(apiAsset, true) // append with replace
      const sortState = this.store.getSortState()
      this.store.sort(sortState.field, sortState.direction)
    }
  },
  onLabelChanged: function (collectionId, label) {
    if (collectionId === this.collectionId) {
      this.getView().refresh()
    }
  },
  onLabelDeleted: function (collectionId, labelId) {
    if (collectionId === this.collectionId) {
      this.getStore().reload()
    }
  },
  initComponent: function () {
    const me = this
    const fieldsConstructor = Ext.data.Record.create([
      { name: 'assetId', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'fqdn', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'ip', type: 'string' },
      { name: 'mac', type: 'string' },
      { name: 'noncomputing', type: 'boolean' },
      {
        name: 'labelIds',
        convert: (v, r) => r.labels.map((label) => label.labelId)
      },
      {
        name: 'assessments',
        type: 'integer',
        mapping: 'metrics.assessments'
      },
      {
        name: 'stigCount',
        convert: (v, r) => r.benchmarkIds.length
      },
      {
        name: 'assessedPct',
        convert: (v, r) => r.metrics.assessments ? r.metrics.assessed / r.metrics.assessments * 100 : 0
      },
      {
        name: 'savedPct',
        convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.saved + r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
      },
      {
        name: 'submittedPct',
        convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
      },
      {
        name: 'acceptedPct',
        convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.accepted / r.metrics.assessments) * 100 : 0
      },
      {
        name: 'rejectedPct',
        convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.rejected / r.metrics.assessments) * 100 : 0
      },
      {
        name: 'minTs',
        type: 'date',
        mapping: 'metrics.minTs'
      },
      {
        name: 'maxTs',
        type: 'date',
        mapping: 'metrics.maxTs'
      },
      {
        name: 'maxTouchTs',
        type: 'date',
        mapping: 'metrics.maxTouchTs'
      },
      { name: 'metadata' }
    ])
    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: this.url,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    })
    const assetStore = new Ext.data.JsonStore({
      grid: this,
      smMaskDelay: 250,
      proxy: this.proxy,
      root: '',
      fields: fieldsConstructor,
      idProperty: 'assetId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    me.totalTextCmp = new SM.RowCountTextItem({
      store: assetStore,
      noun: 'asset',
      iconCls: 'sm-asset-icon'
    })
    const sm = new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
      listeners: {
        selectionchange: function (sm) {
          modifyBtn.setDisabled(sm.getCount() !== 1)
          const hasSelection = sm.hasSelection()
          let someSelectionsHaveStigs = false
          if (hasSelection) {
            const selectedRecords = sm.getSelections()
            someSelectionsHaveStigs = selectedRecords.some(i => i.data.stigCount > 0)
          }
          for (const btn of [deleteBtn, transferBtn]) {
            btn.setDisabled(!hasSelection)
          }
          exportBtn.setDisabled(!(hasSelection && someSelectionsHaveStigs))
          SM.SetCheckboxSelModelHeaderState(sm)
        }
      }
    })
    const assetColumnId = Ext.id()
    const columns = [
      sm,
      {
        header: "Asset",
        id: assetColumnId,
        width: 175,
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Labels",
        width: 220,
        dataIndex: 'labelIds',
        sortable: false,
        filter: {
          type: 'values',
          collectionId: me.collectionId,
          comparer: function (a, b) {
            return SM.ColumnFilters.CompareFns.labelIds(a, b, me.collectionId)
          },
          renderer: SM.ColumnFilters.Renderers.labels
        },
        renderer: function (value, metadata) {
          const labels = []
          for (const labelId of value) {
            const label = SM.Cache.getCollectionLabel(me.collectionId, labelId)
            if (label) labels.push(label)
          }
          labels.sort((a, b) => a.name.localeCompare(b.name))
          metadata.attr = 'style="white-space:nowrap;text-overflow:clip;"'
          return SM.Manage.Collection.LabelArrayTpl.apply(labels)
        }
      },
      {
        header: "FQDN",
        width: 100,
        dataIndex: 'fqdn',
        sortable: true,
        hidden: true,
        renderer: SM.styledEmptyRenderer,
        filter: { type: 'string' }
      },
      {
        header: "IP",
        width: 100,
        dataIndex: 'ip',
        hidden: true,
        sortable: true,
        renderer: SM.styledEmptyRenderer
      },
      {
        header: "MAC",
        hidden: true,
        width: 110,
        dataIndex: 'mac',
        sortable: true,
        renderer: SM.styledEmptyRenderer,
        filter: { type: 'string' }
      },
      {
        header: "STIGs",
        width: 50,
        dataIndex: 'stigCount',
        align: "center",
        tooltip: "Total STIGs Assigned",
        sortable: true
      },
      {
        header: "Rules",
        width: 50,
        dataIndex: 'assessments',
        align: "center",
        sortable: true
      },
      {
        header: 'Oldest',
        width: 50,
        dataIndex: 'minTs',
        align: 'center',
        sortable: true,
        renderer: renderDurationToNow
      },
      {
        header: 'Newest',
        width: 50,
        dataIndex: 'maxTs',
        align: 'center',
        sortable: true,
        renderer: renderDurationToNow
      },
      {
        header: "Assessed",
        width: 100,
        dataIndex: 'assessedPct',
        align: "center",
        sortable: true,
        renderer: renderPct
      },
      {
        header: "Submitted",
        width: 100,
        dataIndex: 'submittedPct',
        align: "center",
        sortable: true,
        renderer: renderPct
      },
      {
        header: "Accepted",
        width: 100,
        dataIndex: 'acceptedPct',
        align: "center",
        sortable: true,
        renderer: renderPct
      },
      {
        header: "Rejected",
        width: 100,
        dataIndex: 'rejectedPct',
        align: "center",
        sortable: true,
        renderer: renderPctAllHigh
      }
    ]
    const exportBtn = new Ext.Button({
      iconCls: 'sm-export-icon',
      text: 'Export results...',
      disabled: true,
      handler: function () {
        SM.Exports.showExportTree(me.collectionId, me.collectionName, 'asset', me.getSelectionModel().getSelections().map(r => r.data))
      }
    })
    const deleteBtn = new Ext.Button({
      iconCls: 'icon-del',
      text: 'Delete...',
      disabled: true,
      handler: async function () {
        try {
          let assetRecords = me.getSelectionModel().getSelections()
          const multiDelete = assetRecords.length > 1
          const confirmStr = `Deleting ${multiDelete ? '<b>multiple assets</b>' : 'this asset'} will <b>permanently remove</b> all data associated with the asset${multiDelete ? 's' : ''}. This includes all the corresponding STIG assessments. The deleted data <b>cannot be recovered</b>.<br><br>Do you wish to continue?`;
          let btn = await SM.confirmPromise("Confirm Delete", confirmStr)
          if (btn == 'yes') {
            const assetIds = assetRecords.map(r => r.data.assetId)
            Ext.getBody().mask(`Deleting ${assetRecords.length} Assets`)
            await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/assets?collectionId=${me.collectionId}`,
              method: 'PATCH',
              jsonData: {
                operation: 'delete',
                assetIds
              }
            })
            me.store.suspendEvents(false)
            // Might need to handle edge case when the selected record was changed (e.g., stats updated) while still selected, then is deleted
            me.store.remove(assetRecords)
            me.store.resumeEvents()

            SM.Dispatcher.fireEvent('assetdeleted', { collection: { collectionId: me.collectionId } }) // mock an Asset for collectionManager.onAssetEvent
          }
        }
        catch (e) {
          SM.Error.handleError(e)
        }
        finally {
          Ext.getBody().unmask()
        }
      }
    })
    const transferBtn = new SM.TransferAssets.TransferBtn({
      iconCls: 'sm-collection-icon',
      disabled: true,
      srcCollectionId: me.collectionId,
      text: 'Transfer To',
      onItemClick: async function (item) {
        try {
          const srcAssets = item.parentMenu.srcAssets
          const isMulti = srcAssets?.length > 1
          var confirmStr = `Transfering ${isMulti ? 'these assets' : 'this asset'} to ${item.text} will <b>transfer all data</b> associated with the asset${isMulti ? 's' : ''}. This includes all the corresponding STIG assessments.<br><br>Do you wish to continue?`
          const btn = await SM.confirmPromise('Confirm transfer', confirmStr)
          if (btn == 'yes') {
            const l = srcAssets?.length || 0
            for (let i = 0; i < l; i++) {
              Ext.getBody().mask(`Transferring ${i + 1}/${l} Assets`)
              // Edge case to handle when the selected record was changed (e.g., stats updated) 
              // while still selected, then is transferred
              const thisRecord = me.store.getById(srcAssets[i].assetId)
              let returnedAsset = await Ext.Ajax.requestPromise({
                responseType: 'json',
                url: `${STIGMAN.Env.apiBase}/assets/${thisRecord.data.assetId}`,
                method: 'PATCH',
                jsonData: {
                  collectionId: item.collectionId
                }
              })
              let apiAsset = await Ext.Ajax.requestPromise({
                responseType: 'json',
                url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/metrics/summary/asset`,
                method: 'GET',
                params: {
                  assetId: thisRecord.data.assetId
                }
              })
              apiAsset.collection = returnedAsset.collection
              me.store.remove(thisRecord)
              SM.Cache.updateCollectionLabels(returnedAsset.collection.collectionId)
              SM.Dispatcher.fireEvent('assetdeleted', { ...apiAsset, ...{ collection: { collectionId: me.collectionId } } })
              SM.Dispatcher.fireEvent('assetcreated', apiAsset)
            }
          }
        }
        catch (e) {
          SM.Error.handleError(e)
        }
        finally {
          Ext.getBody().unmask()
        }

      },
      handler: function (btn) {
        const assetRecords = me.getSelectionModel().getSelections()
        btn.setSrcAssets(assetRecords.map(r => r.data))
      }
    })
    const modifyBtn = new Ext.Button({
      iconCls: 'sm-asset-icon',
      disabled: true,
      text: 'Modify...',
      handler: function () {
        var r = me.getSelectionModel().getSelected();
        Ext.getBody().mask('Getting properties...');
        SM.Manage.Asset.showAssetProps(r.get('assetId'), me.collectionId);
      }
    })
    const config = {
      layout: 'fit',
      loadMask: { msg: '' },
      store: assetStore,
      cm: new Ext.grid.ColumnModel({
        columns: columns
      }),
      sm,
      view: new SM.ColumnFilters.GridViewBuffered({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        autoExpandColumn: assetColumnId,
        // custom row height
        rowHeight: 21,
        borderHeight: 2,
        // render rows as they come into viewable area.
        scrollDelay: false,

        listeners: {
          filterschanged: function (view, item, value) {
            assetStore.filter(view.getFilterFns())
          }
        }
      }),
      listeners: {
        rowdblclick: function (grid, rowIndex, e) {
          var r = grid.getStore().getAt(rowIndex);
          Ext.getBody().mask('Getting properties...');
          SM.Manage.Asset.showAssetProps(r.get('assetId'), me.collectionId);
        },
        beforedestroy: function (grid) {
          SM.Dispatcher.removeListener('assetchanged', me.onAssetChangedOrCreated, me)
          SM.Dispatcher.removeListener('assetcreated', me.onAssetChangedOrCreated, me)
          SM.Dispatcher.removeListener('labelchanged', me.onLabelChanged, me)
          SM.Dispatcher.removeListener('labeldeleted', me.onLabelDeleted, me)
        },
        keydown: SM.CtrlAGridHandler
      },
      tbar: new Ext.Toolbar({
        items: [
          {
            iconCls: 'icon-add',
            text: 'Create...',
            handler: function () {
              SM.Manage.Asset.showAssetProps(null, me.collectionId);
            }
          },
          '-',

          {
            iconCls: 'sm-import-icon',
            text: 'Import CKL(B) or XCCDF...',
            tooltip: SM.TipContent.ImportFromCollectionManager,
            handler: function () {
              showImportResultFiles(me.collectionId);
            }
          },
          '-',
          exportBtn,
          '-',
          deleteBtn,
          '-',
          transferBtn,
          '-',
          modifyBtn
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
            handler: function (btn) {
              const savedSmMaskDelay = btn.grid.store.smMaskDelay
              btn.grid.store.smMaskDelay = 0
              btn.grid.store.reload();
              btn.grid.store.smMaskDelay = savedSmMaskDelay
            }
          }, {
            xtype: 'tbseparator'
          }, {
            xtype: 'exportbutton',
            hasMenu: false,
            gridBasename: 'Assets (grid)',
            storeBasename: 'Assets (store)',
            iconCls: 'sm-export-icon',
            text: 'CSV',
            grid: this      
          }, {
            xtype: 'tbfill'
          }, {
            xtype: 'tbseparator'
          },
          this.totalTextCmp
        ]
      })
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)

    SM.Dispatcher.addListener('assetchanged', this.onAssetChangedOrCreated, this)
    SM.Dispatcher.addListener('assetcreated', this.onAssetChangedOrCreated, this)
    SM.Dispatcher.addListener('labelchanged', this.onLabelChanged, this)
    SM.Dispatcher.addListener('labeldeleted', this.onLabelDeleted, this)
  }
})

SM.Manage.Asset.LabelField = Ext.extend(Ext.form.Field, {
  defaultAutoCreate: { tag: "div" },
  initComponent: function () {
    const _this = this
    this.labelIds = this.labelIds || []
    this.labelNames = this.labelNames || []
    const cachedCollection = SM.Cache.CollectionMap.get(this.collectionId)
    this.labelsMenu = new SM.Manage.Collection.LabelsMenu({
      // menuTitle: 'Manage labels',
      labels: cachedCollection.labels,
      listeners: {
        itemcheckchanged: function (item, checked) {
          const cachedCollection = SM.Cache.CollectionMap.get(_this.collectionId)
          _this.labelIds = item.parentMenu.getCheckedLabelIds()
          const assetLabels = cachedCollection.labels.filter(label => _this.labelIds.includes(label.labelId))
          _this.labelNames = cachedCollection.labels
            .filter(label => _this.labelIds.includes(label.labelId)).map(label => label.name)
          _this.previewfield.update(assetLabels)
          

        },
        applied: function (labelIds) {
          const cachedCollection = SM.Cache.CollectionMap.get(_this.collectionId)
          const assetLabels = cachedCollection.labels.filter(label => labelIds.includes(label.labelId))
          _this.previewfield.update(assetLabels)
          _this.labelIds = labelIds
          _this.labelNames = cachedCollection.labels
              .filter(label => labelIds.includes(label.labelId))
              .map(label => label.name)
      }
      }
    })
    this.menuBtn = new Ext.Button({
      menu: this.labelsMenu
    })
    this.previewfield = new Ext.form.DisplayField({
      tpl: SM.Manage.Collection.LabelArrayTpl,
      data: [],
    })
    const config = {
      name: 'labelIds'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },
  setValue: function (labelIds) {
    this.labelIds = labelIds
    this.labelsMenu.setLabelsChecked(labelIds, true)

    const cachedCollection = SM.Cache.CollectionMap.get(this.collectionId)
    const assetLabels = cachedCollection.labels.filter(function (label) {
      return labelIds.includes(label.labelId)
    })
    this.labelNames = assetLabels.map(label => label.name)
    this.previewfield.update(assetLabels)
  },
  getValue: function () {
    return this.labelNames
  },
  onRender: function (ct, position) {
    SM.Manage.Asset.LabelField.superclass.onRender.call(this, ct, position);
    const _this = this

    this.panel = new Ext.Panel({
      renderTo: this.el,
      // height: 50,
      // width: this.width,
      border: false,
      layout: 'hbox',
      layoutConfig: {
        align: 'middle'
      },
      bodyStyle: 'background-color: transparent;',
      items: [
        this.menuBtn,
        this.previewfield
      ]
    })
  }
})

SM.Manage.Asset.StigSelectingGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'benchmarkId',
        type: 'string'
      },
      {
        name: 'ruleCount',
        type: 'integer'
      }
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
        header: "BenchmarkId",
        width: 375,
        dataIndex: 'benchmarkId',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Rules",
        width: 125,
        dataIndex: 'ruleCount',
        align: 'center',
        sortable: true
      }

    ]
    const store = new Ext.data.JsonStore({
      fields,
      idProperty: 'benchmarkId',
      sortInfo: {
        field: 'benchmarkId',
        direction: 'ASC'
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'STIG',
      iconCls: 'sm-stig-icon'
    })

    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddText: '{0} selected STIG{1}',
      bodyCssClass: 'sm-grid3-draggable',
      ddGroup: `SM.Manage.Asset.StigSelectingGrid-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No STIGs to display',
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
            gridBasename: 'STIGs (grid)',
            storeBasename: 'STIGs (store)',
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

SM.Manage.Asset.StigSelectingPanel = Ext.extend(Ext.Panel, {
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
    const availableGrid = new SM.Manage.Asset.StigSelectingGrid({
      title: 'Available STIGs',
      iconCls: 'sm-stig-icon',
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
    const selectionsGrid = new SM.Manage.Asset.StigSelectingGrid({
      title: 'Assigned STIGs',
      iconCls: 'sm-stig-icon',
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

    async function initPanel(apiAsset) {
      const apiAvailableStigs = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/stigs`,
        method: 'GET'
      })

      const assignedStigs = apiAsset?.stigs?.map(stig => stig.benchmarkId) ?? []
      _this.originalStigs = assignedStigs
      const available = []
      const assigned = []
      apiAvailableStigs.reduce((accumulator, stig) => {
        const property = assignedStigs.includes(stig.benchmarkId) ? 'assigned' : 'available'
        accumulator[property].push(stig)
        return accumulator
      }, { available, assigned })

      availableGrid.store.loadData(available)
      selectionsGrid.store.loadData(assigned)
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
      return records.map(record => record.data.benchmarkId)
    }

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      name: 'stigs',
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

SM.Manage.Asset.PropertiesFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    this.stigSelectingPanel = new SM.Manage.Asset.StigSelectingPanel({
      name: 'stigs',
      isFormField: true,
      submitValue: true
    })
    if (!this.initialCollectionId) {
      throw (new Error('missing property initialCollectionId'))
    }
    let assetLabelField
    if (SM.Cache.CollectionMap.get(this.initialCollectionId).labels.length) {
      assetLabelField = new SM.Manage.Asset.LabelField({
        collectionId: this.initialCollectionId,
        fieldLabel: 'Labels'
      })
    }
    else {
      assetLabelField = {
        xtype: 'displayfield',
        fieldLabel: 'Labels',
        value: '<i>Asset labels are not defined for this Collection</i>'
      }
    }
    const config = {
      baseCls: 'x-plain',
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
                  padding: '0px 10px 0px 0px',
                  border: false,
                  items: [
                    {
                      xtype: 'textfield',
                      fieldLabel: 'Name',
                      anchor: '100%',
                      emptyText: 'Enter asset name...',
                      allowBlank: false,
                      name: 'name'
                    }
                  ]
                },
                {
                  columnWidth: .6,
                  layout: 'form',
                  border: false,
                  items: [
                    {
                      xtype: 'textfield',
                      fieldLabel: 'Description',
                      anchor: '100%',
                      emptyText: 'Enter asset description...',
                      allowBlank: true,
                      name: 'description'
                    }
                  ]
                }
              ]
            },
            {
              xtype: 'checkbox',
              name: 'noncomputing',
              hideLabel: false,
              checked: false,
              boxLabel: 'Non-computing'
            },
            {
              layout: 'column',
              baseCls: 'x-plain',
              border: false,
              items: [
                {
                  columnWidth: .5,
                  layout: 'form',
                  padding: '0px 10px 0px 0px',
                  border: false,
                  items: [
                    {
                      xtype: 'textfield',
                      anchor: '100%',
                      fieldLabel: 'FQDN',
                      emptyText: 'Enter FQDN',
                      allowBlank: true,
                      name: 'fqdn'
                    }
                  ]
                },
                {
                  columnWidth: .25,
                  layout: 'form',
                  border: false,
                  padding: '0px 10px 0px 0px',
                  labelWidth: 20,
                  items: [
                    {
                      xtype: 'textfield',
                      fieldLabel: 'IP',
                      anchor: '100%',
                      emptyText: 'Enter IP',
                      allowBlank: true,
                      name: 'ip'
                    }
                  ]
                },
                {
                  columnWidth: .25,
                  layout: 'form',
                  border: false,
                  // padding: '0px 10px 0px 0px',
                  labelWidth: 30,
                  items: [
                    {
                      xtype: 'textfield',
                      fieldLabel: 'MAC',
                      anchor: '100%',
                      emptyText: 'Enter MAC',
                      allowBlank: true,
                      name: 'mac'
                    }
                  ]
                },
              ]
            },
            assetLabelField,
            new SM.Manage.Collection.MetadataGrid({
              submitValue: true,
              fieldLabel: 'Metadata',
              name: 'metadata',
              anchor: '100%'
            }),
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
          anchor: "100% -290",
          layout: 'fit',
          items: [
            this.stigSelectingPanel
          ]
        }

      ],
      buttons: [{
        text: this.btnText || 'Save',
        formBind: true,
        handler: this.btnHandler || Ext.emptyFn
      }]
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)

    this.getForm().getFieldValues = function (dirtyOnly, getDisabled) {
      // Override to support submitValue boolean
      var o = {},
        n,
        key,
        val;
      this.items.each(function (f) {
        // Added condition for f.submitValue
        if (f.submitValue && (!f.disabled || getDisabled) && (dirtyOnly !== true || f.isDirty())) {
          n = f.getName();
          key = o[n];
          val = f.getValue();

          if (Ext.isDefined(key)) {
            if (Ext.isArray(key)) {
              o[n].push(val);
            } else {
              o[n] = [key, val];
            }
          } else {
            o[n] = val;
          }
        }
      });
      return o;
    }
  }
})

SM.Manage.Stig.showStigProps = async function (benchmarkId, defaultRevisionStr, parentGrid) {
  let appwindow
  try {
      const collectionId = parentGrid.collectionId
      const stigPropsFormPanel = new SM.Manage.Stig.PropertiesFormPanel({
          collectionId,
          benchmarkId,
          defaultRevisionStr,
          stigFilteringStore: parentGrid.store,
          btnHandler: async function( btn ){
              try {
                  stigPropsFormPanel.el.mask('Updating')
                  const values = stigPropsFormPanel.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
                  const jsonData = {}
                  if (values.defaultRevisionStr) {
                      jsonData.defaultRevisionStr = values.defaultRevisionStr
                  }
                  if (values.assets) {
                      jsonData.assetIds = values.assets
                  }
                  let result = await Ext.Ajax.requestPromise({
                      url: `${STIGMAN.Env.apiBase}/collections/${btn.collectionId}/stigs/${values.benchmarkId}`,
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json;charset=utf-8' },
                      jsonData
                  })
                  const apiStigAssets = JSON.parse(result.response.responseText)
                  SM.Dispatcher.fireEvent('stigassetschanged', btn.collectionId, values.benchmarkId, apiStigAssets)
                  appwindow.close()
              }
              catch (e) {
                  SM.Error.handleError(e)
              }
              finally {
                  stigPropsFormPanel.el.unmask()
              }
          }
      })

      /******************************************************/
      // Form window
      /******************************************************/
      const height = Ext.getBody().getHeight() - 80
      const width = Math.min(Math.floor(Ext.getBody().getWidth() * 0.75), 1280)
      appwindow = new Ext.Window({
          title: 'STIG Assignments',
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
          items: stigPropsFormPanel
      });
      
      appwindow.show(Ext.getBody())

      await stigPropsFormPanel.initPanel({
          benchmarkId,
          collectionId
      })
  }
  catch (e) {
      SM.Error.handleError(e)
      if (appwindow) {
          appwindow.close()
      }
  }	
}

SM.Manage.Stig.SelectionComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const _this = this
    const stigStore = new Ext.data.JsonStore({
      fields: [
        {
          name: 'benchmarkId',
          type: 'string'
        }, {
          name: 'title',
          type: 'string'
        }, {
          name: 'lastRevisionStr',
          type: 'string'
        }, {
          name: 'lastRevisionDate',
          type: 'string'
        }, {
          name: 'ruleCount',
          type: 'integer'
        },
        'revisionStrs',
        'revisions'
      ],
      autoLoad: this.autoLoad,
      url: this.url || `${STIGMAN.Env.apiBase}/stigs?projection=revisions`,
      root: this.root || '',
      sortInfo: {
        field: 'benchmarkId',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      idProperty: 'benchmarkId',
      listeners: {
        load: (store) => {
          if (_this.includeAllItem) {
            store.suspendEvents()
            let allRecord = {
              benchmarkId: _this.includeAllItem
            }
            store.loadData(_this.root ? { [_this.root]: allRecord } : allRecord, true)
            store.sort('benchmarkId', 'ASC')
            store.resumeEvents()
          }
        }
      }
    })
    const tpl = new Ext.XTemplate(
      '<tpl for=".">',
      '<div class="x-combo-list-item">{[this.highlightQuery(values.benchmarkId)]}</div>',
      '</tpl>',
      {
        highlightQuery: function (text) {
          if (_this.el.dom.value) {
            const re = new RegExp(_this.el.dom.value, 'gi')
            return text.replace(re, '<span class="sm-text-highlight">$&</span>')
          }
          return text
        }
      }
    )
    const config = {
      store: stigStore,
      tpl,
      filteringStore: this.filteringStore || null,
      displayField: 'benchmarkId',
      valueField: 'benchmarkId',
      mode: 'local',
      forceSelection: true,
      typeAhead: false,
      minChars: 0,
      triggerAction: 'all',
      listeners: {
        afterrender: (combo) => {
          combo.getEl().dom.setAttribute('spellcheck', 'false')
        },
        ...this.listeners
      },
      doQuery: (q, forceAll) => {
        // Custom re-implementation of the original ExtJS method
        q = Ext.isEmpty(q) ? '' : q;
        if (forceAll === true || (q.length >= this.minChars)) {
          // Removed test against this.lastQuery
          this.selectedIndex = -1
          let filters = []
          if (this.filteringStore) {
            // Exclude records from the combo store that are in the filteringStore
            filters.push(
              {
                fn: (record) => record.id === this.initialBenchmarkId || this.filteringStore.indexOfId(record.id) === -1,
                scope: this
              }
            )
          }
          if (q) {
            // Include records that partially match the combo value
            filters.push(
              {
                property: this.displayField,
                value: q,
                anyMatch: true
              }
            )
          }
          this.store.filter(filters)
          this.onLoad()
        }
      },
      validator: (v) => {
        // Don't keep the form from validating when I'm not active
        if (_this.grid && _this.grid.editor && !_this.grid.editor.editing) {
          return true
        }
        if (v === "") {
          return "Blank values not allowed"
        }
        if (v !== _this.initialBenchmarkId && _this.store.indexOfId(v) === -1) {
          return "Value must be a benchmarkId"
        }
        return true
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },

  // Re-implement validateBur() to always return false. The framework's implementation always returned true
  // and selecting an item from the droplist would mimic a blur even when the <input> remained focused. This
  // prevented the droplist from expanding when characters were typed following a droplist selection
  validateBlur: function () { return false },

  // Re-implement onTriggerClick() to select the value in the droplist
  onTriggerClick: function () {
    if (this.readOnly || this.disabled) {
      return;
    }
    if (this.isExpanded()) {
      this.collapse();
      this.el.focus();
    } else {
      this.onFocus({});
      if (this.triggerAction == 'all') {
        this.doQuery(this.allQuery, true);
        // added line below for this override
        this.selectByValue(this.value, true);
      } else {
        this.doQuery(this.getRawValue());
      }
      this.el.focus();
    }
  }
})

SM.Manage.Stig.Grid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function() {
      const _this = this
      const fieldsConstructor = Ext.data.Record.create([
          { name: 'benchmarkId', type: 'string' },
          { name: 'revisionStr', type: 'string' },
          { name: 'revisionPinned', type: 'boolean' },
          { name: 'assets', type: 'integer' },
          { name: 'ruleCount', type: 'integer'},
          {
              name: 'assessedPct',
              convert: (v, r) => r.metrics.assessments ? r.metrics.assessed / r.metrics.assessments * 100 : 0
          },
          {
              name: 'savedPct',
              convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.saved + r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
          },
          {
              name: 'submittedPct',
              convert: (v, r) => r.metrics.assessments ? ((r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0
          },
          {
              name: 'acceptedPct',
              convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.accepted / r.metrics.assessments) * 100 : 0
          },
          {
              name: 'rejectedPct',
              convert: (v, r) => r.metrics.assessments ? (r.metrics.statuses.rejected / r.metrics.assessments) * 100 : 0
          },
          {
              name: 'minTs',
              type: 'date',
              mapping: 'metrics.minTs'
          },
          {
              name: 'maxTs',
              type: 'date',
              mapping: 'metrics.maxTs'
          },
          {
              name: 'maxTouchTs',
              type: 'date',
              mapping: 'metrics.maxTouchTs'
          }
      ])
      this.proxy = new Ext.data.HttpProxy({
          restful: true,
          url: this.url,
          headers: { 'Content-Type': 'application/json;charset=utf-8' }
      })
      const store = new Ext.data.JsonStore({
          grid: this,
          smMaskDelay: 250,
          proxy: this.proxy,
          root: '',
          fields: fieldsConstructor,
          idProperty: 'benchmarkId',
          sortInfo: {
              field: 'benchmarkId',
              direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
          }
      })
      this.totalTextCmp = new SM.RowCountTextItem ({
          store: store,
          noun: 'STIG',
          iconCls: 'sm-stig-icon'
      })
      const sm = new Ext.grid.CheckboxSelectionModel({
          singleSelect: false,
          checkOnly: false,
          listeners: {
              selectionchange: function (sm) {
                  modifyBtn.setDisabled(sm.getCount() !== 1)
                  deleteBtn.setDisabled(sm.getCount() !== 1)
                  exportBtn.setDisabled(!sm.hasSelection())
                  SM.SetCheckboxSelModelHeaderState(sm)
              }
          }
      })
      const benchmarkColumnId = Ext.id()
      const columns = [
          sm,
          { 	
      header: "BenchmarkId",
              id: benchmarkColumnId,
      width: 300,
              dataIndex: 'benchmarkId',
      sortable: true,
              filter: {type:'string'}
    },
          { 	
      header: "Revision",
      width: 70,
              dataIndex: 'revisionStr',
              // align: "center",
              sortable: false,
              renderer: function (v, md, r) {
                  return `${r.data.revisionStr}${r.data.revisionPinned ? '<img src="img/pin.svg" width="12" height="12" style="margin-left: 8px;">' : ''}`
              }
    },
          {
              header: 'Rules',
              width: 70,
              dataIndex: 'ruleCount',
              align: "center",
              sortable: true
          },
          {
              header: 'Assets',
              width: 70,
              dataIndex: 'assets',
              align: "center",
              sortable: true
          },
          {
              header: 'Oldest',
              width: 50,
              dataIndex: 'minTs',
              align: 'center',
              sortable: true,
              renderer: renderDurationToNow
          },
          {
              header: 'Newest',
              width: 50,
              dataIndex: 'maxTs',
              align: 'center',
              sortable: true,
              renderer: renderDurationToNow
          },
          { 	
      header: "Assessed",
      width: 100,
      dataIndex: 'assessedPct',
      align: "center",
      sortable: true,
              renderer: renderPct
    },
          { 	
      header: "Submitted",
      width: 100,
      dataIndex: 'submittedPct',
      align: "center",
      sortable: true,
              renderer: renderPct
    },
          { 	
      header: "Accepted",
      width: 100,
      dataIndex: 'acceptedPct',
      align: "center",
      sortable: true,
              renderer: renderPct
    },
          { 	
      header: "Rejected",
      width: 100,
      dataIndex: 'rejectedPct',
      align: "center",
      sortable: true,
              renderer: renderPctAllHigh
    }
      ]
      const exportBtn = new Ext.Button({
          iconCls: 'sm-export-icon',
          text: 'Export results...',
          disabled: true,
          handler: function() {
              SM.Exports.showExportTree( _this.collectionId, _this.collectionName, 'stig', _this.getSelectionModel().getSelections().map( r => r.data )  );            
          }
      })
      const modifyBtn = new Ext.Button({
          iconCls: 'sm-stig-icon',
          disabled: true,
          text: 'Modify...',
          handler: function() {
              const r = _this.getSelectionModel().getSelected().data
              SM.Manage.Stig.showStigProps(r.benchmarkId, r.revisionPinned ? r.revisionStr : 'latest', _this);
          }
      })
      const deleteBtn = new Ext.Button({
          iconCls: 'icon-remove',
          text: 'Unassign STIG...',
          disabled: true,
          handler: function() {
              try {
                  var confirmStr="Unassigning this STIG will remove all related Asset assignments. If the STIG is added in the future, the assignments will need to be established again.";
                  Ext.Msg.confirm("Confirm", confirmStr, async function (btn,text) {
                      if (btn == 'yes') {
                          const stigRecord = _this.getSelectionModel().getSelected()
                          await Ext.Ajax.requestPromise({
                              url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/stigs/${stigRecord.data.benchmarkId}/assets`,
                              method: 'PUT',
                              jsonData: []
                          })
                          _this.store.remove(stigRecord)
                          SM.Dispatcher.fireEvent('stigassetschanged', _this.collectionId, stigRecord.data.benchmarkId, [] )
                      }
                  })
              }
              catch (e) {
                  SM.Error.handleError(e)
              }
          }
      })
      let config = {
          layout: 'fit',
          loadMask: {msg: ''},
          store: store,
          cm: new Ext.grid.ColumnModel ({
              columns: columns   
          }),
          sm,
          view: new SM.ColumnFilters.GridView({
              emptyText: this.emptyText || 'No records to display',
              deferEmptyText: false,
              forceFit:true,
              listeners: {
                  filterschanged: function (view, item, value) {
                      store.filter(view.getFilterFns())  
                  }
              }		    
          }),
          listeners: {
              rowdblclick: {
                  fn: function(grid,rowIndex,e) {
                      const r = grid.getStore().getAt(rowIndex).data
                      SM.Manage.Stig.showStigProps(r.benchmarkId, r.revisionPinned ? r.revisionStr : 'latest', _this);
                  }
              },
              keydown: SM.CtrlAGridHandler
          },
          tbar: new Ext.Toolbar({
              items: [
                  {
                      iconCls: 'icon-add',
                      text: 'Assign STIG...',
                      grid: this,
                      handler: function(btn) {
                          SM.Manage.Stig.showStigProps( null, null, btn.grid );            
                      }
                  },
                  '-',
                  exportBtn,
                  '-',
                  deleteBtn,
                  '-',
                  modifyBtn                    
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
                          const savedSmMaskDelay = btn.grid.store.smMaskDelay
                          btn.grid.store.smMaskDelay = 0
                          btn.grid.store.reload();
                          btn.grid.store.smMaskDelay = savedSmMaskDelay
                      }
                  },{
                      xtype: 'tbseparator'
                  },{
                      xtype: 'exportbutton',
                      hasMenu: false,
                      gridBasename: 'STIGs (grid)',
                      storeBasename: 'STIGs (store)',
                      iconCls: 'sm-export-icon',
                      text: 'CSV',
                      grid: this      

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
      this.superclass().initComponent.call(this)
  }   
})

SM.Manage.Stig.RevisionComboBox = Ext.extend(SM.Global.HelperComboBox, {
  initComponent: function () {
    this.store = new Ext.data.SimpleStore({
      fields: ['value', 'display']
    })

    const data = []

    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false,
      helpText: SM.TipContent.DefaultRevision
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)

    this.store.loadData(data)
  }
})

SM.Manage.Stig.PropertiesFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
      const _this = this
      if (! this.collectionId) {
          throw ('missing property collectionId')
      }
      const assetSelectionPanel = new SM.AssetSelection.SelectingPanel({
          name: 'assets',
          collectionId: this.collectionId,
          isFormField: true,
          listeners: {
              assetselectionschanged: setButtonState
          }
      })
      const stigField = new SM.Manage.Stig.SelectionComboBox({
          name: 'benchmarkId',
          submitValue: false,
          fieldLabel: 'BenchmarkId',
          hideTrigger: false,
          width: 350,
          autoLoad: false,
          allowBlank: false,
          filteringStore: this.stigFilteringStore,
          initialBenchmarkId: this.benchmarkId,
          fireSelectOnSetValue: true,
          enableKeyEvents: true,
          valid: false,
          listeners: {
              select: function (combo, record, index) {
                  const revisions = [['latest', 'Most recent revision'], ...record.data.revisions.map( rev => [rev.revisionStr, `${rev.revisionStr} (${rev.benchmarkDate})`])]
                  revisionComboBox.store.loadData(revisions)
                  revisionComboBox.setValue(record.data.benchmarkId === _this.benchmarkId ? _this.defaultRevisionStr : 'latest')
                  assetSelectionPanel.trackedProperty = { dataProperty: 'benchmarkIds', value: record.data.benchmarkId }
                  stigField.valid = true
                  setButtonState()
              },
              invalid: function (field) {
                  field.valid = false
                  setButtonState()
              },
              valid: function (field) {
                  field.valid = true
                  setButtonState()
              },
              blur: function (field) {
                  this.setValue(this.getRawValue())
              },
              render: function (field) {
                  field.el.dom.addEventListener('blur', () => field.fireEvent('blur'))
              }
          }
      })
      const revisionComboBox = new SM.Manage.Stig.RevisionComboBox({
          name: 'defaultRevisionStr',
          fieldLabel: 'Default revision',
          listeners: {
              select: setButtonState
          }
      })

      const saveBtn = new Ext.Button({
          text: 'Update',
          disabled: true,
          collectionId: this.collectionId,
          formBind: true,
          handler: this.btnHandler || function () {}
      })

      function setButtonState () {
          if (!stigField.valid) {
              assetFieldSet.disable()
              saveBtn.disable()
              return
          }
          assetFieldSet.enable()
          const currentBenchmarkId = stigField.getRawValue()
          const currentRevisionStr = revisionComboBox.getValue()
          const currentAssetIds = assetSelectionPanel.getValue()
          const originalAssetIds = assetSelectionPanel.originalAssetIds

          if (!currentAssetIds.length) {
              saveBtn.disable()
              return
          }

          const revisionUnchanged = currentBenchmarkId === _this.benchmarkId && currentRevisionStr === _this.defaultRevisionStr
          const assetsUnchanged = currentAssetIds.length === originalAssetIds.length && originalAssetIds.every( assetId => currentAssetIds.includes(assetId))

          saveBtn.setDisabled(revisionUnchanged && assetsUnchanged)
      }

      const assetFieldSet = new Ext.form.FieldSet({
          title: '<span class="sm-asset-assignments-title">Asset assignments</span>',
          anchor: "100% -95",
          layout: 'fit',
          items: [assetSelectionPanel]
      })
      let config = {
          baseCls: 'x-plain',
          // height: 400,
          labelWidth: 100,
          monitorValid: false,
          trackResetOnLoad: true,
          items: [
              {
                  xtype: 'fieldset',
                  title: '<span class="sm-stig-information-title">STIG information</span>',
                  items: [
                      stigField,
                      revisionComboBox
                  ]
              },
              assetFieldSet
          ],
          buttons: [saveBtn],
          stigField,
          revisionComboBox,
          assetSelectionPanel
      }

      Ext.apply(this, Ext.apply(this.initialConfig, config))
      this.superclass().initComponent.call(this)

  },
  initPanel: async function ({collectionId, benchmarkId}) {
      try {
          this.el.mask('')
          const promises = [
              this.stigField.store.loadPromise(),
              this.assetSelectionPanel.initPanel({benchmarkId})
          ]
          await Promise.all(promises)
          this.getForm().setValues({benchmarkId})
      }
      finally {
          this.el.unmask()
      }
  }
})
