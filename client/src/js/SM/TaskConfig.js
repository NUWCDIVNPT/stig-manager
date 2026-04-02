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

SM.TaskConfig.formatFilterSummary = function (updateFilter) {
  if (!updateFilter) return 'None'
  const parts = []
  if (updateFilter.assetIds?.length) parts.push(`${updateFilter.assetIds.length} asset${updateFilter.assetIds.length > 1 ? 's' : ''}`)
  if (updateFilter.labelIds?.length) parts.push(`${updateFilter.labelIds.length} label${updateFilter.labelIds.length > 1 ? 's' : ''}`)
  if (updateFilter.benchmarkIds?.length) parts.push(`${updateFilter.benchmarkIds.length} STIG${updateFilter.benchmarkIds.length > 1 ? 's' : ''}`)
  return parts.length ? parts.join(', ') : 'None'
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
// SM.TaskConfig.ReviewAging.FilterGrid
// Simplified version of SM.Acl.AssignedRulesGrid (no access column)
// ========================================================
SM.TaskConfig.ReviewAging.FilterGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const filterStore = new Ext.data.JsonStore({
      fields: [
        'benchmarkId',
        'assetId',
        'assetName',
        'labelId',
        'labelName',
        'label',
        {
          name: 'sorter',
          convert: (v, r) => {
            return `${r.assetName ?? ''}${r.labelName ?? ''}${r.benchmarkId ?? ''}`.toLowerCase()
          }
        }
      ],
      root: '',
      sortInfo: {
        field: 'sorter',
        direction: 'ASC'
      },
      idProperty: v => `${v.benchmarkId}-${v.assetName}-${v.labelName}`,
      listeners: {
        remove: function () {
          _this.panel.removeButton.disable()
        }
      }
    })

    const selectionModel = new Ext.grid.RowSelectionModel({
      singleSelect: false,
      listeners: {
        rowselect: function () {
          _this.panel.removeButton.enable()
        },
        rowdeselect: function (sm) {
          if (sm.getCount() < 1) {
            _this.panel.removeButton.disable()
          }
        }
      }
    })

    function renderResource (value, metadata, record) {
      let html = ''
      if (record.data.assetName) {
        html += `<div class="sm-asset-icon sm-cell-with-icon">${SM.he(record.data.assetName)}</div>`
      }
      if (record.data.labelName) {
        html += `<div class="sm-label-icon sm-cell-with-icon">${SM.Manage.Collection.LabelTpl.apply(record.data.label)}</div>`
      }
      if (record.data.benchmarkId) {
        html += `<div class="sm-stig-icon sm-cell-with-icon">${SM.he(record.data.benchmarkId)}</div>`
      }
      return html
    }

    const columns = [
      {
        header: 'Resource',
        dataIndex: 'sorter',
        sortable: true,
        renderer: renderResource
      }
    ]

    const totalTextCmp = new SM.RowCountTextItem({ store: filterStore })

    const bbar = new Ext.Toolbar({
      items: [
        { xtype: 'tbfill' },
        { xtype: 'tbseparator' },
        totalTextCmp
      ]
    })

    const config = {
      name: 'updateFilter',
      isFormField: true,
      setValue: function (updateFilter) {
        if (!updateFilter) {
          filterStore.removeAll()
          return
        }
        const data = []
        if (updateFilter.assetIds) {
          for (const assetId of updateFilter.assetIds) {
            data.push({
              assetId,
              assetName: _this.assetMap?.[assetId] || `Asset ${assetId}`
            })
          }
        }
        if (updateFilter.labelIds) {
          for (const labelId of updateFilter.labelIds) {
            const label = _this.labelMap?.[labelId]
            data.push({
              labelId,
              labelName: label?.name || `Label ${labelId}`,
              label: label || { labelId, name: `Label ${labelId}` }
            })
          }
        }
        if (updateFilter.benchmarkIds) {
          for (const benchmarkId of updateFilter.benchmarkIds) {
            data.push({ benchmarkId })
          }
        }
        filterStore.loadData(data)
      },
      getValue: function () {
        const filter = {}
        const records = filterStore.snapshot?.items ?? filterStore.getRange()
        const assetIds = []
        const labelIds = []
        const benchmarkIds = []
        for (const r of records) {
          if (r.data.assetId) assetIds.push(r.data.assetId)
          if (r.data.labelId) labelIds.push(r.data.labelId)
          if (r.data.benchmarkId) benchmarkIds.push(r.data.benchmarkId)
        }
        if (assetIds.length) filter.assetIds = assetIds
        if (labelIds.length) filter.labelIds = labelIds
        if (benchmarkIds.length) filter.benchmarkIds = benchmarkIds
        return Object.keys(filter).length ? filter : undefined
      },
      markInvalid: Ext.emptyFn,
      clearInvalid: Ext.emptyFn,
      isValid: function () { return true },
      disabled: false,
      getName: function () { return this.name },
      validate: function () { return true },
      store: filterStore,
      view: new SM.ColumnFilters.GridView({
        emptyText: 'No filters — rule applies to all reviews',
        forceFit: true,
        markDirty: false
      }),
      stripeRows: true,
      sm: selectionModel,
      columns,
      bbar,
      listeners: {
        keydown: SM.CtrlAGridHandler
      }
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

// ========================================================
// SM.TaskConfig.ReviewAging.FilterPanel
// ACL-style layout: tree | add/remove | grid
// ========================================================
SM.TaskConfig.ReviewAging.FilterPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this

    const navTree = new SM.Acl.ResourceTreePanel({
      panel: this,
      title: 'Collection Resources',
      width: 280,
      collectionId: this.collectionId,
      listeners: {
        click: handleTreeClick
      }
    })

    function handleTreeClick (node) {
      switch (node.attributes.node) {
        case 'stig':
        case 'asset':
        case 'label':
          addBtn.setDisabled(isNodeInFilterGrid(node))
          break
        default:
          addBtn.disable()
          break
      }
    }

    function isNodeInFilterGrid (node) {
      const candidateId = `${node.attributes.benchmarkId ?? 'undefined'}-${node.attributes.assetName ?? 'undefined'}-${node.attributes.label?.name ?? 'undefined'}`
      const record = filterGrid.store.getById(candidateId)
      return !!record
    }

    function handleAddBtn () {
      const selectedNode = navTree.getSelectionModel().getSelectedNode()
      if (!selectedNode) return
      const assignment = {
        benchmarkId: selectedNode.attributes.benchmarkId,
        assetId: selectedNode.attributes.assetId,
        assetName: selectedNode.attributes.assetName,
        labelId: selectedNode.attributes.label?.labelId,
        labelName: selectedNode.attributes.label?.name,
        label: selectedNode.attributes.label
      }
      const store = filterGrid.getStore()
      store.loadData(assignment, true)
      store.sort(store.sortInfo.field, store.sortInfo.direction)
      addBtn.disable()
    }

    const filterGrid = new SM.TaskConfig.ReviewAging.FilterGrid({
      panel: this,
      title: 'Selected Filters',
      flex: 1,
      assetMap: this.assetMap,
      labelMap: this.labelMap
    })
    this.filterGrid = filterGrid

    const addBtn = new SM.Acl.ResourceAddBtn({
      tree: navTree,
      text: 'Add',
      grid: filterGrid,
      handler: handleAddBtn
    })
    this.addButton = addBtn

    const removeBtn = new SM.Acl.ResourceRemoveBtn({
      tree: navTree,
      text: 'Remove',
      grid: filterGrid
    })
    this.removeButton = removeBtn

    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      width: 80,
      layout: {
        type: 'vbox',
        pack: 'center',
        align: 'center',
        padding: '10 10 10 10'
      },
      items: [addBtn, removeBtn]
    })

    const config = {
      bodyStyle: 'background:transparent;border:none',
      layout: 'hbox',
      anchor: '100% -130',
      layoutConfig: {
        align: 'stretch'
      },
      items: [navTree, buttonPanel, filterGrid]
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
    // Fetch assets, labels, benchmarks in parallel for filter name resolution
    const [apiAssets, apiLabels, apiStigs] = await Promise.all([
      Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/assets`,
        method: 'GET',
        params: { collectionId }
      }),
      Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/labels`
      }),
      Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`
      })
    ])

    const assetMap = {}
    for (const a of apiAssets) { assetMap[a.assetId] = a.name }
    const labelMap = {}
    for (const l of apiLabels) { labelMap[l.labelId] = l }

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

    // Basis type
    const basisTypeCombo = new Ext.form.ComboBox({
      fieldLabel: 'Basis',
      name: 'basisType',
      mode: 'local',
      forceSelection: true,
      editable: false,
      triggerAction: 'all',
      store: new Ext.data.SimpleStore({
        fields: ['value', 'display'],
        data: [
          ['now', 'Current time'],
          ['datetime', 'Specific datetime']
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      value: ruleData?.triggerBasis === 'now' || !ruleData?.triggerBasis ? 'now' : 'datetime',
      width: 180,
      disabled: isReadOnly,
      listeners: {
        select: function (combo, record) {
          basisDateField.setVisible(record.data.value === 'datetime')
          basisTimeField.setVisible(record.data.value === 'datetime')
        }
      }
    })

    const basisDatetime = ruleData?.triggerBasis && ruleData.triggerBasis !== 'now' ? new Date(ruleData.triggerBasis) : new Date()
    const basisDateField = new Ext.form.DateField({
      fieldLabel: 'Date',
      name: 'basisDate',
      format: 'Y-m-d',
      value: basisDatetime,
      width: 130,
      hidden: !ruleData?.triggerBasis || ruleData.triggerBasis === 'now',
      disabled: isReadOnly
    })

    const basisTimeField = new Ext.form.TimeField({
      fieldLabel: 'Time',
      name: 'basisTime',
      format: 'H:i',
      increment: 30,
      value: basisDatetime.toTimeString().substring(0, 5),
      width: 100,
      hidden: !ruleData?.triggerBasis || ruleData.triggerBasis === 'now',
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

    function refreshUpdateValueStore (field) {
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

    // Filter panel
    const filterPanel = new SM.TaskConfig.ReviewAging.FilterPanel({
      collectionId,
      assetMap,
      labelMap,
      height: 300
    })

    const triggerFieldSet = new Ext.form.FieldSet({
      title: 'Trigger',
      items: [
        titleField,
        enabledCheckbox,
        triggerFieldCombo,
        basisTypeCombo,
        {
          xtype: 'compositefield',
          fieldLabel: 'Datetime',
          hidden: !ruleData?.triggerBasis || ruleData.triggerBasis === 'now',
          items: [basisDateField, basisTimeField],
          ref: '../basisDatetimeComposite'
        },
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

    const filterFieldSet = new Ext.form.FieldSet({
      title: 'Filters',
      height: 300,
      // collapsible: true,
      // collapsed: !ruleData?.updateFilter,
      items: [filterPanel],
      listeners: {
        expand: function () {
          appwindow.doLayout()
        },
        collapse: function () {
          appwindow.doLayout()
        }
      }
    })

    // Override basis combo listener to also toggle the composite field
    basisTypeCombo.on('select', function (combo, record) {
      const show = record.data.value === 'datetime'
      if (formPanel.basisDatetimeComposite) {
        formPanel.basisDatetimeComposite.setVisible(show)
      }
    })

    const formPanel = new Ext.form.FormPanel({
      baseCls: 'x-plain',
      labelWidth: 100,
      autoScroll: true,
      padding: 10,
      items: [triggerFieldSet, actionFieldSet, filterFieldSet]
    })

    function serializeRule () {
      const rule = {
        title: titleField.getValue() || null,
        enabled: enabledCheckbox.getValue(),
        triggerField: triggerFieldCombo.getValue(),
        triggerAction: actionCombo.getValue()
      }

      // Basis
      if (basisTypeCombo.getValue() === 'now') {
        rule.triggerBasis = 'now'
      } else {
        const d = basisDateField.getValue()
        const t = basisTimeField.getValue()
        if (d) {
          const dateStr = d.format('Y-m-d')
          rule.triggerBasis = `${dateStr}T${t || '00:00'}:00Z`
        } else {
          rule.triggerBasis = 'now'
        }
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

      // Filter
      const updateFilter = filterPanel.filterGrid.getValue()
      if (updateFilter) {
        rule.updateFilter = updateFilter
      }

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
      width: 750,
      height: 600,
      minWidth: 600,
      minHeight: 400,
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

    // Set filter values after render
    if (ruleData?.updateFilter) {
      filterPanel.filterGrid.setValue(ruleData.updateFilter)
    }

    if (isReadOnly) {
      filterPanel.addButton.disable()
      filterPanel.removeButton.disable()
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
        'title', 'enabled', 'triggerField', 'triggerBasis',
        'triggerInterval', 'triggerAction', 'updateField',
        'updateValue', 'updateFilter'
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
      toolsMarkup = '<span class="sm-grid-cell-tool" style="padding-right:4px"><img data-action="editRule" ext:qtip="Edit rule" src="img/edit.svg" width="14" height="14"></span>'
      toolsMarkup += '<span class="sm-grid-cell-tool"><img data-action="removeRule" ext:qtip="Delete rule" src="img/trash.svg" width="14" height="14"></span>'
    }

    function renderRule (value, metadata, record) {
      const d = record.data
      const enabledIcon = d.enabled ? '●' : '○'
      const enabledColor = d.enabled ? 'green' : '#999'
      const title = SM.he(d.title || 'Untitled rule')
      const action = SM.TaskConfig.formatAction(d)
      const trigger = `when ${SM.TaskConfig.triggerFieldMap[d.triggerField] || d.triggerField} > ${SM.TaskConfig.formatInterval(d.triggerInterval)}`
      const filterSummary = SM.TaskConfig.formatFilterSummary(d.updateFilter)

      return `
        <div class="sm-grid-cell-with-toolbar">
          <div class="sm-dynamic-width">
            <div style="font-weight:600;"><span style="color:${enabledColor}">${enabledIcon}</span> ${title}</div>
            <div style="color:#555;">${action}</div>
            <div style="color:#777;">${trigger}</div>
            ${filterSummary !== 'None' ? `<div style="color:#999;">Filters: ${filterSummary}</div>` : ''}
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
      editRule: function (data, record) {
        SM.TaskConfig.ReviewAging.showRuleEditWindow({
          collectionId,
          ruleData: data,
          isReadOnly: !canEdit,
          onSave: function (updatedRule) {
            for (const key of Object.keys(updatedRule)) {
              record.set(key, updatedRule[key])
            }
            // Clear fields not present in updatedRule
            if (!updatedRule.updateField) {
              record.set('updateField', undefined)
              record.set('updateValue', undefined)
            }
            if (!updatedRule.updateFilter) {
              record.set('updateFilter', undefined)
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

    function cellclick (grid, rowIndex, columnIndex, e) {
      if (e.target.tagName === 'IMG') {
        const record = grid.getStore().getAt(rowIndex)
        const handler = toolHandlers[e.target.dataset.action]
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
              store.loadData([newRule], true)
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
        getRowClass: function () {
          return 'sm-taskconfig-rule-row'
        }
      }),
      stripeRows: true,
      border: false,
      listeners: {
        cellclick,
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

    const northPanel = new Ext.Panel({
      region: 'north',
      layout: 'form',
      padding: 10,
      labelWidth: 80,
      autoHeight: true,
      border: false,
      items: [taskCombo, descriptionField, eventInfoField]
    })

    const cardPanel = new Ext.Panel({
      region: 'center',
      layout: 'card',
      activeItem: 0,
      border: false,
      items: [{
        xtype: 'panel',
        border: false,
        bodyStyle: 'padding:20px; color:#999; text-align:center;',
        html: 'Select a task to view its configuration.'
      }]
    })

    const taskCards = {}

    function onTaskSelected (record) {
      const taskName = record.data.name
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
