Ext.ns('SM.TaskConfig')
Ext.ns('SM.TaskConfig.ReviewAging')

SM.TaskConfig.triggerFieldMap = {
  ts: 'Review timestamp',
  statusTs: 'Status timestamp',
  touchTs: 'Touch timestamp'
}

SM.TaskConfig.updateValueMap = {
  saved: 'Saved',
  submitted: 'Submitted',
  notchecked: 'Not Checked',
  informational: 'Informational'
}

SM.TaskConfig.secondsToInterval = function (seconds) {
  if (seconds % 86400 === 0) return { value: seconds / 86400, unit: 'days' }
  if (seconds % 3600 === 0) return { value: seconds / 3600, unit: 'hours' }
  if (seconds % 60 === 0) return { value: seconds / 60, unit: 'minutes' }
  return { value: seconds, unit: 'seconds' }
}

SM.TaskConfig.intervalToSeconds = function (value, unit) {
  const multipliers = { seconds: 1, minutes: 60, hours: 3600, days: 86400 }
  return value * (multipliers[unit] || 1)
}

SM.TaskConfig.formatInterval = function (seconds) {
  const { value, unit } = SM.TaskConfig.secondsToInterval(seconds)
  const singular = unit.replace(/s$/, '')
  return `${value} ${value === 1 ? singular : unit}`
}

SM.TaskConfig.formatAction = function (record) {
  if (record.triggerAction === 'delete') return 'Delete reviews'
  if (record.updateField === 'status') return `Set status to ${SM.TaskConfig.updateValueMap[record.updateValue] || record.updateValue}`
  if (record.updateField === 'result') return `Set result to ${SM.TaskConfig.updateValueMap[record.updateValue] || record.updateValue}`
  return 'Update reviews'
}

SM.TaskConfig.formatTargetHtml = function (target) {
  if (!target) return ''
  let html = ''
  if (target.collection) {
    html += `<div class="sm-collection-icon sm-cell-with-icon">Collection</div>`
  }
  if (target.asset) {
    html += `<div class="sm-asset-icon sm-cell-with-icon">${SM.he(target.asset.name)}</div>`
  }
  if (target.label) {
    html += `<div class="sm-label-icon sm-cell-with-icon">${SM.Manage.Collection.LabelTpl.apply(target.label)}</div>`
  }
  if (target.benchmarkId) {
    html += `<div class="sm-stig-icon sm-cell-with-icon">${SM.he(target.benchmarkId)}</div>`
  }
  return html
}

SM.TaskConfig.formatEventSummary = function (events) {
  if (!events || !events.length) return 'No scheduled events'
  const parts = []
  for (const event of events) {
    if (event.type === 'once') {
      parts.push(`Once at ${event.starts}`)
    } else {
      const interval = `${event.interval.value} ${event.interval.field}`
      const status = event.enabled ? 'enabled' : 'disabled'
      parts.push(`Every ${interval} (${status})`)
    }
  }
  return parts.join('; ')
}

// ========================================================
// SM.TaskConfig.ReviewAging.TargetPanel
// Layout: tree on top, selected target display below
// ========================================================
SM.TaskConfig.ReviewAging.TargetPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const isReadOnly = this.disabled

    let currentTarget = undefined

    const collectionHtml = '<div class="sm-collection-icon sm-cell-with-icon">Collection</div>'

    const displayPanel = new Ext.Panel({
      height: 45,
      bodyStyle: 'background:transparent;border:none;padding:8px;',
      html: collectionHtml
    })

    function setTarget(target) {
      currentTarget = target
      displayPanel.update(SM.TaskConfig.formatTargetHtml(target) || collectionHtml)
    }

    const navTree = new SM.Acl.ResourceTreePanel({
      title: 'Collection Resources',
      flex: 1,
      collectionId: this.collectionId,
      listeners: {
        click: function (node) {
          if (isReadOnly) return
          const attrs = node.attributes
          switch (attrs.node) {
            case 'collection':
              setTarget({ collection: true })
              break
            case 'stig':
              setTarget({ benchmarkId: attrs.benchmarkId })
              break
            case 'asset':
              setTarget({ asset: { assetId: attrs.assetId, name: attrs.assetName } })
              break
            case 'asset-stig':
            case 'stig-asset':
              setTarget({ asset: { assetId: attrs.assetId, name: attrs.assetName }, benchmarkId: attrs.benchmarkId })
              break
            case 'label':
              setTarget({ label: attrs.label })
              break
            case 'label-stig':
              setTarget({ label: attrs.label, benchmarkId: attrs.benchmarkId })
              break
            default:
              break
          }
        }
      }
    })

    const config = {
      bodyStyle: 'background:transparent;border:none',
      layout: 'vbox',
      layoutConfig: {
        align: 'stretch'
      },
      items: [navTree, displayPanel],
      getValue: function () {
        if (!currentTarget) return undefined
        // Convert GET-style target (with nested asset/label objects) to PUT format
        if (currentTarget.asset) {
          const t = { assetId: currentTarget.asset.assetId }
          if (currentTarget.benchmarkId) t.benchmarkId = currentTarget.benchmarkId
          return t
        }
        if (currentTarget.label) {
          const t = { labelId: currentTarget.label.labelId }
          if (currentTarget.benchmarkId) t.benchmarkId = currentTarget.benchmarkId
          return t
        }
        if (currentTarget.benchmarkId) {
          return { benchmarkId: currentTarget.benchmarkId }
        }
        return undefined
      },
      setValue: function (target) {
        setTarget(target)
      },
      getDisplayTarget: function () {
        return currentTarget
      }
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

// ========================================================
// SM.TaskConfig.ReviewAging.showRuleEditWindow
// ========================================================
SM.TaskConfig.ReviewAging.showRuleEditWindow = async function ({
  collectionId,
  ruleData,
  isReadOnly,
  onSave
}) {
  try {
    // Title
    const titleField = new Ext.form.TextField({
      fieldLabel: 'Title',
      name: 'title',
      maxLength: 45,
      allowBlank: true,
      anchor: '100%',
      disabled: isReadOnly,
      value: ruleData?.title || ''
    })

    // Enabled
    const enabledCheckbox = new Ext.form.Checkbox({
      fieldLabel: 'Enabled',
      name: 'enabled',
      checked: ruleData?.enabled ?? true,
      disabled: isReadOnly
    })

    const titleEnabledRow = new Ext.Panel({
      layout: 'column',
      baseCls: 'x-plain',
      border: false,
      items: [
        {
          columnWidth: .8,
          layout: 'form',
          labelWidth: 30,
          padding: '0px 10px 0px 0px',
          border: false,
          items: [
            titleField
          ]
        },
        {
          columnWidth: .2,
          layout: 'form',
          labelWidth: 48,
          padding: '0px 10px 0px 0px',
          border: false,
          items: [
            enabledCheckbox
          ]
        },
      ]
    })

    // Trigger Field
    const triggerFieldCombo = new Ext.form.ComboBox({
      fieldLabel: 'Trigger field',
      name: 'triggerField',
      mode: 'local',
      forceSelection: true,
      editable: false,
      triggerAction: 'all',
      store: new Ext.data.SimpleStore({
        fields: ['value', 'display'],
        data: [
          ['ts', 'Review timestamp'],
          ['statusTs', 'Status timestamp'],
          ['touchTs', 'Touch timestamp']
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      value: ruleData?.triggerField || 'ts',
      width: 180,
      disabled: isReadOnly
    })

    // Interval
    const intervalInfo = ruleData?.triggerInterval ? SM.TaskConfig.secondsToInterval(ruleData.triggerInterval) : { value: 30, unit: 'days' }
    const intervalValueField = new Ext.form.NumberField({
      fieldLabel: 'Interval',
      name: 'intervalValue',
      minValue: 1,
      allowDecimals: false,
      value: intervalInfo.value,
      width: 80,
      disabled: isReadOnly
    })

    const intervalUnitCombo = new Ext.form.ComboBox({
      fieldLabel: '',
      hideLabel: true,
      name: 'intervalUnit',
      mode: 'local',
      forceSelection: true,
      editable: false,
      triggerAction: 'all',
      store: new Ext.data.SimpleStore({
        fields: ['value', 'display'],
        data: [
          ['days', 'days'],
          ['hours', 'hours'],
          ['minutes', 'minutes'],
          ['seconds', 'seconds']
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      value: intervalInfo.unit,
      width: 100,
      disabled: isReadOnly
    })

    // Action
    const actionCombo = new Ext.form.ComboBox({
      fieldLabel: 'Action',
      name: 'triggerAction',
      mode: 'local',
      forceSelection: true,
      editable: false,
      triggerAction: 'all',
      store: new Ext.data.SimpleStore({
        fields: ['value', 'display'],
        data: [
          ['delete', 'Delete reviews'],
          ['update', 'Update reviews']
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      value: ruleData?.triggerAction || 'update',
      width: 180,
      disabled: isReadOnly,
      listeners: {
        select: function (combo, record) {
          const isUpdate = record.data.value === 'update'
          updateFieldCombo.setVisible(isUpdate)
          updateValueCombo.setVisible(isUpdate)
        }
      }
    })

    // Update Field
    const updateFieldCombo = new Ext.form.ComboBox({
      fieldLabel: 'Update field',
      name: 'updateField',
      mode: 'local',
      forceSelection: true,
      editable: false,
      triggerAction: 'all',
      store: new Ext.data.SimpleStore({
        fields: ['value', 'display'],
        data: [
          ['status', 'Status'],
          ['result', 'Result']
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      value: ruleData?.updateField || 'status',
      width: 180,
      hidden: ruleData?.triggerAction === 'delete',
      disabled: isReadOnly,
      listeners: {
        select: function (combo, record) {
          refreshUpdateValueStore(record.data.value)
        }
      }
    })

    function refreshUpdateValueStore(field) {
      const data = field === 'status'
        ? [['saved', 'Saved'], ['submitted', 'Submitted']]
        : [['notchecked', 'Not Checked'], ['informational', 'Informational']]
      updateValueCombo.store.loadData(data)
      updateValueCombo.setValue(data[0][0])
    }

    const updateValueData = (ruleData?.updateField || 'status') === 'status'
      ? [['saved', 'Saved'], ['submitted', 'Submitted']]
      : [['notchecked', 'Not Checked'], ['informational', 'Informational']]

    const updateValueCombo = new Ext.form.ComboBox({
      fieldLabel: 'Update value',
      name: 'updateValue',
      mode: 'local',
      forceSelection: true,
      editable: false,
      triggerAction: 'all',
      store: new Ext.data.SimpleStore({
        fields: ['value', 'display'],
        data: updateValueData
      }),
      valueField: 'value',
      displayField: 'display',
      value: ruleData?.updateValue || updateValueData[0][0],
      width: 180,
      hidden: ruleData?.triggerAction === 'delete',
      disabled: isReadOnly
    })

    const triggerFieldSet = new Ext.form.FieldSet({
      title: 'Trigger',
      items: [
        triggerFieldCombo,
        {
          xtype: 'compositefield',
          fieldLabel: 'Interval',
          items: [intervalValueField, intervalUnitCombo]
        }
      ]
    })

    const actionFieldSet = new Ext.form.FieldSet({
      title: 'Action',
      items: [
        actionCombo,
        updateFieldCombo,
        updateValueCombo
      ]
    })

    const targetPanel = new SM.TaskConfig.ReviewAging.TargetPanel({
      collectionId,
      disabled: isReadOnly,
      height: 260
    })

    const targetFieldSet = new Ext.form.FieldSet({
      title: 'Target',
      height: 300,
      items: [targetPanel]
    })

    const formPanel = new Ext.form.FormPanel({
      baseCls: 'x-plain',
      labelWidth: 100,
      autoScroll: true,
      padding: 10,
      items: [titleEnabledRow, targetFieldSet, triggerFieldSet, actionFieldSet]
    })

    function serializeRule() {
      const rule = {
        title: titleField.getValue() || null,
        enabled: enabledCheckbox.getValue(),
        triggerField: triggerFieldCombo.getValue(),
        triggerAction: actionCombo.getValue()
      }

      // Interval
      rule.triggerInterval = SM.TaskConfig.intervalToSeconds(
        intervalValueField.getValue(),
        intervalUnitCombo.getValue()
      )

      // Update fields
      if (rule.triggerAction === 'update') {
        rule.updateField = updateFieldCombo.getValue()
        rule.updateValue = updateValueCombo.getValue()
      }

      // Target — PUT format for the API, display format for the record
      const target = targetPanel.getValue()
      if (target) {
        rule.target = target
      }
      rule._displayTarget = targetPanel.getDisplayTarget()

      return rule
    }

    const buttons = []
    buttons.push({
      text: 'Cancel',
      handler: function () { appwindow.close() }
    })
    if (!isReadOnly) {
      buttons.push({
        text: 'Save',
        formBind: true,
        handler: function () {
          if (!formPanel.getForm().isValid()) return
          const rule = serializeRule()
          onSave(rule)
          appwindow.close()
        }
      })
    }

    const appwindow = new Ext.Window({
      title: ruleData ? (isReadOnly ? 'View Rule' : 'Edit Rule') : 'New Rule',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      hidden: true,
      width: 420,
      height: 700,
      minWidth: 420,
      minHeight: 700,
      maximizable: true,
      resizable: true,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:10px;',
      buttonAlign: 'right',
      items: formPanel,
      buttons
    })

    appwindow.show(Ext.getBody())

    // Set target value after render
    if (ruleData?.target) {
      targetPanel.setValue(ruleData.target)
    }
  }
  catch (e) {
    SM.Error.handleError(e)
  }
}

// ========================================================
// SM.TaskConfig.ReviewAging.RulesGrid
// ========================================================
SM.TaskConfig.ReviewAging.RulesGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const canEdit = this.canEdit

    const store = new Ext.data.JsonStore({
      fields: [
        'title', 'enabled', 'triggerField',
        'triggerInterval', 'triggerAction', 'updateField',
        'updateValue', 'target'
      ],
      root: ''
    })

    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'rule',
      iconCls: 'sm-setting-icon'
    })

    let toolsMarkup = ''
    if (canEdit) {
      toolsMarkup = '<span class="sm-grid-cell-tool" style="padding-right:4px"><img class="sm-taskconfig-action-moveUp" ext:qtip="Move up" src="img/move-up.svg" width="14" height="14"></span>'
      toolsMarkup += '<span class="sm-grid-cell-tool" style="padding-right:4px"><img class="sm-taskconfig-action-moveDown" ext:qtip="Move down" src="img/move-down.svg" width="14" height="14"></span>'
      toolsMarkup += '<span class="sm-grid-cell-tool" style="padding-right:4px"><img class="sm-taskconfig-action-editRule" ext:qtip="Edit rule" src="img/edit.svg" width="14" height="14"></span>'
      toolsMarkup += '<span class="sm-grid-cell-tool"><img class="sm-taskconfig-action-removeRule" ext:qtip="Delete rule" src="img/trash.svg" width="14" height="14"></span>'
    }

    function renderRule(value, metadata, record) {
      const d = record.data
      const enabledIcon = d.enabled ? '●' : '○'
      const enabledColor = d.enabled ? 'green' : '#999'
      const title = SM.he(d.title || 'Untitled rule')
      const action = SM.TaskConfig.formatAction(d)
      const trigger = `when ${SM.TaskConfig.triggerFieldMap[d.triggerField] || d.triggerField} > ${SM.TaskConfig.formatInterval(d.triggerInterval)}`
      const targetHtml = SM.TaskConfig.formatTargetHtml(d.target)

      return `
        <div class="sm-grid-cell-with-toolbar">
          <div class="sm-dynamic-width">
            <div style="font-weight:600;"><span style="color:${enabledColor}">${enabledIcon}</span> ${title}</div>
            <div style="color:#555;">${action}</div>
            <div style="color:#777;">${trigger}</div>
            ${targetHtml ? `<div style="color:#999;">Target: ${targetHtml}</div>` : ''}
          </div>
          <div class="sm-static-width">
            ${toolsMarkup}
          </div>
        </div>`
    }

    const columns = [
      {
        header: 'Rule',
        dataIndex: 'title',
        sortable: false,
        renderer: renderRule
      }
    ]

    const toolHandlers = {
      moveUp: function (_data, record) {
        const idx = store.indexOf(record)
        if (idx <= 0) return
        store.remove(record)
        store.insert(idx - 1, record)
        _this.saveConfig()
      },
      moveDown: function (_data, record) {
        const idx = store.indexOf(record)
        if (idx >= store.getCount() - 1) return
        store.remove(record)
        store.insert(idx + 1, record)
        _this.saveConfig()
      },
      editRule: function (data, record) {
        SM.TaskConfig.ReviewAging.showRuleEditWindow({
          collectionId,
          ruleData: data,
          isReadOnly: !canEdit,
          onSave: function (updatedRule) {
            for (const key of Object.keys(updatedRule)) {
              if (key === '_displayTarget') continue
              record.set(key, updatedRule[key])
            }
            // Store GET-format target for rendering
            record.set('target', updatedRule._displayTarget)
            // Clear fields not present in updatedRule
            if (!updatedRule.updateField) {
              record.set('updateField', undefined)
              record.set('updateValue', undefined)
            }
            record.commit()
            _this.saveConfig()
          }
        })
      },
      removeRule: function (data, record) {
        Ext.Msg.confirm('Delete Rule', `Remove rule "${SM.he(data.title || 'Untitled rule')}"?`, function (buttonId) {
          if (buttonId === 'yes') {
            store.remove(record)
            _this.saveConfig()
          }
        })
      }
    }

    function cellmousedown(grid, rowIndex, _columnIndex, e) {
      const match = e.target.className?.match(/sm-taskconfig-action-(\w+)/)
      if (match) {
        const record = grid.getStore().getAt(rowIndex)
        const handler = toolHandlers[match[1]]
        if (handler) handler(record.data, record)
      }
    }

    const tbar = []
    if (canEdit) {
      tbar.push({
        text: 'New Rule',
        iconCls: 'icon-add',
        handler: function () {
          SM.TaskConfig.ReviewAging.showRuleEditWindow({
            collectionId,
            ruleData: null,
            isReadOnly: false,
            onSave: function (newRule) {
              const { _displayTarget, ...storeRule } = newRule
              storeRule.target = _displayTarget
              store.loadData([storeRule], true)
              _this.saveConfig()
            }
          })
        }
      })
    }

    const config = {
      store,
      columns,
      tbar: tbar.length ? tbar : undefined,
      bbar: new Ext.Toolbar({
        items: [
          { xtype: 'tbfill' },
          { xtype: 'tbseparator' },
          totalTextCmp
        ]
      }),
      view: new SM.ColumnFilters.GridView({
        emptyText: canEdit ? 'No rules configured. Click "New Rule" to add one.' : 'No rules configured.',
        forceFit: true,
        markDirty: false,
        cellSelectorDepth: 6,
        getRowClass: function () {
          return 'sm-taskconfig-rule-row'
        }
      }),
      stripeRows: true,
      border: false,
      listeners: {
        cellmousedown,
        rowdblclick: function (grid, rowIndex) {
          const record = grid.getStore().getAt(rowIndex)
          toolHandlers.editRule(record.data, record)
        }
      }
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },

  loadConfig: async function () {
    const _this = this
    try {
      const config = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/tasks/review-aging/config`
      })
      _this.store.loadData(config)
    }
    catch (e) {
      if (e.status === 404) {
        _this.store.removeAll()
      } else {
        SM.Error.handleError(e)
      }
    }
  },

  saveConfig: async function () {
    const _this = this
    try {
      Ext.getBody().mask('Saving...')
      const records = _this.store.snapshot?.items ?? _this.store.getRange()
      if (records.length === 0) {
        await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/tasks/review-aging/config`,
          method: 'DELETE'
        })
      } else {
        const rules = records.map(r => {
          const d = { ...r.data }
          delete d.sorter
          // Convert display-format target to PUT format
          delete d.target
          const t = r.data.target
          if (t) {
            if (t.asset) {
              const pt = { assetId: t.asset.assetId }
              if (t.benchmarkId) pt.benchmarkId = t.benchmarkId
              d.target = pt
            } else if (t.label) {
              const pt = { labelId: t.label.labelId }
              if (t.benchmarkId) pt.benchmarkId = t.benchmarkId
              d.target = pt
            } else if (t.benchmarkId) {
              d.target = { benchmarkId: t.benchmarkId }
            }
            // t.collection or unrecognised: no target in PUT body
          }
          // Remove undefined fields
          const clean = {}
          for (const [k, v] of Object.entries(d)) {
            if (v !== undefined) clean[k] = v
          }
          return clean
        })
        await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/tasks/review-aging/config`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          jsonData: rules
        })
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

// ========================================================
// SM.TaskConfig.showTaskOutputWindow
// ========================================================
SM.TaskConfig.showTaskOutputWindow = async function ({ collectionId, taskName }) {
  try {
    Ext.getBody().mask('Loading...')

    const outputGrid = new SM.Job.RunOutputGrid({
      border: false,
      loadMask: true
    })

    const appwindow = new Ext.Window({
      title: 'Task Output',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      hidden: true,
      width: 900,
      height: 500,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: outputGrid,
      buttons: [{
        text: 'Close',
        handler: function () { appwindow.close() }
      }]
    })

    const output = await Ext.Ajax.requestPromise({
      responseType: 'json',
      url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/tasks/${taskName}/output`
    })

    outputGrid.getStore().loadData(output)
    appwindow.show(Ext.getBody())
  }
  catch (e) {
    SM.Error.handleError(e)
  }
  finally {
    Ext.getBody().unmask()
  }
}

// ========================================================
// SM.TaskConfig.TasksPanel
// ========================================================
SM.TaskConfig.TasksPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this

    const taskStore = new Ext.data.JsonStore({
      fields: ['taskId', 'name', 'description', 'command', 'collectionConfig', 'events'],
      root: '',
      idProperty: 'taskId'
    })

    const taskCombo = new Ext.form.ComboBox({
      store: taskStore,
      displayField: 'name',
      valueField: 'name',
      mode: 'local',
      forceSelection: true,
      editable: false,
      triggerAction: 'all',
      fieldLabel: 'Task',
      anchor: '100%',
      listeners: {
        select: function (combo, record) {
          onTaskSelected(record)
        }
      }
    })

    const eventInfoField = new Ext.form.DisplayField({
      fieldLabel: 'Schedule',
      anchor: '100%',
      value: ''
    })

    const descriptionField = new Ext.form.DisplayField({
      fieldLabel: 'Description',
      anchor: '100%',
      value: ''
    })

    const taskOutputBtn = new Ext.Button({
      text: 'Task Output...',
      disabled: true,
      handler: function () {
        SM.TaskConfig.showTaskOutputWindow({
          collectionId: _this.collectionId,
          taskName: taskCombo.getValue().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        })
      }
    })

    const northPanel = new Ext.Panel({
      region: 'north',
      layout: 'form',
      padding: 10,
      labelWidth: 80,
      autoHeight: true,
      border: false,
      items: [taskCombo, descriptionField, eventInfoField, taskOutputBtn]
    })

    const cardPanel = new Ext.Panel({
      region: 'center',
      layout: 'card',
      activeItem: 0,
      border: false,
      padding: 10,
      items: [{
        xtype: 'panel',
        border: false,
        bodyStyle: 'padding:20px; color:#999; text-align:center;',
        html: 'Select a task to view its configuration.'
      }]
    })

    const taskCards = {}

    function onTaskSelected(record) {
      const taskName = record.data.name
      taskOutputBtn.enable()
      descriptionField.setValue(record.data.description || '')
      eventInfoField.setValue(SM.TaskConfig.formatEventSummary(record.data.events))

      if (!taskCards[taskName]) {
        let card
        // Convert task name to kebab for API path
        const taskKebab = taskName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        if (taskKebab === 'review-aging') {
          card = new SM.TaskConfig.ReviewAging.RulesGrid({
            collectionId: _this.collectionId,
            canEdit: _this.canEdit,
            border: false
          })
          cardPanel.add(card)
          cardPanel.getLayout().setActiveItem(card)
          card.loadConfig()
        } else {
          card = new Ext.Panel({
            border: false,
            bodyStyle: 'padding:20px; color:#999; text-align:center;',
            html: `No configuration editor available for task "${SM.he(taskName)}".`
          })
          cardPanel.add(card)
          cardPanel.getLayout().setActiveItem(card)
        }
        taskCards[taskName] = card
      } else {
        cardPanel.getLayout().setActiveItem(taskCards[taskName])
      }
    }

    const config = {
      layout: 'border',
      items: [northPanel, cardPanel]
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },

  initPanel: async function () {
    const _this = this
    try {
      const tasks = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/jobs/tasks`
      })
      const taskCombo = _this.findByType('combo')[0]
      taskCombo.store.loadData(tasks)
      if (tasks.length) {
        taskCombo.setValue(tasks[0].name)
        taskCombo.fireEvent('select', taskCombo, taskCombo.store.getAt(0))
      }
    }
    catch (e) {
      SM.Error.handleError(e)
    }
  }
})
