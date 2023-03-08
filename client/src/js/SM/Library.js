Ext.ns("SM.Library")

SM.Library.ChecklistGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    this.benchmarkId = this.benchmarkId || 'RHEL_8_STIG'
    this.revisionStr = this.revisionStr || 'latest'
    const title = this.stigTitle
    const fields = [
      {
        name: 'version',
        type: 'string'
      },
      {
        name: 'groupId',
        type: 'string',
        sortType: sortGroupId
      },
      {
        name: 'ruleId',
        type: 'string',
        sortType: sortRuleId
      },
      {
        name: 'groupTitle',
        type: 'string'
      },
      {
        name: 'title',
        type: 'string',
      },
      {
        name: 'severity',
        type: 'string',
        sortType: sortSeverity
      },
      {
        name: 'check',
        mapping: 'check?.content'
      },
      {
        name: 'fix',
        mapping: 'fix?.text'
      },
      {
        name: 'discussion',
        mapping: 'detail.vulnDiscussion'
      }
    ]
    const exportBtn = new Ext.ux.ExportButton({
      hasMenu: false,
      exportType: 'grid',
      gridBasename: 'STIG',
      iconCls: 'sm-export-icon',
      text: 'CSV',
      gridSource: this
    })
    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'ruleId',
      sortInfo: {
        field: 'ruleId',
        direction: 'ASC'
      },
      listeners: {
        load: function (store, records) {
          _this.getSelectionModel().selectFirstRow()
          totalTextItem.setText(`${store.getCount()} records`)
        },
        reload: function (store, records) {
          _this.getSelectionModel().selectFirstRow()
          totalTextItem.setText(`${store.getCount()} records`)
        }
      }
    })
    const totalTextItem = new SM.RowCountTextItem({ store: store })
    const ruleTitleColumnId = Ext.id()
    const columns = [
      {
        header: "CAT",
        fixed: true,
        width: 48,
        align: 'left',
        dataIndex: 'severity',
        sortable: true,
        renderer: renderSeverity,
        filter: {
          type: 'values',
          comparer: SM.ColumnFilters.CompareFns.severity,
          renderer: SM.ColumnFilters.Renderers.severity
        }
      },
      {
        header: "STIG Id",
        width: 150,
        dataIndex: 'version',
        sortable: true,
        align: 'left',
        renderer: (v, attrs) => {
          attrs.css = 'sm-direction-rtl'
          return v
        },
        filter: { type: 'string' }
      },
      {
        header: "Group Id",
        width: 75,
        dataIndex: 'groupId',
        sortable: true,
        align: 'left',
        filter: { type: 'string' }
      },
      {
        header: "Group Title",
        width: 200,
        dataIndex: 'groupTitle',
        renderer: columnWrap,
        sortable: true,
        // hidden: true,
        filter: { type: 'string' }
      },
      {
        header: "Rule Id",
        width: 150,
        dataIndex: 'ruleId',
        sortable: true,
        align: 'left',
        // hidden: true,
        filter: { type: 'string' }
      },
      {
        id: ruleTitleColumnId,
        header: "Rule Title",
        width: 300,
        dataIndex: 'title',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Check",
        width: 300,
        dataIndex: 'check',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Fix",
        width: 300,
        dataIndex: 'fix',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Discussion",
        width: 300,
        dataIndex: 'discussion',
        renderer: columnWrap,
        sortable: true,
        filter: { type: 'string' }
      }
    ]
    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      rowOverCls: 'sm-null',
      selectedRowClass: 'sm-null',
      listeners: {
        filterschanged: function (view, item, value) {
          store.filter(view.getFilterFns())
        }
      }
    })
    const revisionStore = new Ext.data.JsonStore({
      fields: [
        "benchmarkId",
        "revisionStr",
        "version",
        "release",
        "benchmarkDate",
        "status",
        "statusDate",
        { name: 'display', convert: (v, r) => `Version ${r.version} Release ${r.release} (${r.benchmarkDate})` }
      ],
      url: `${STIGMAN.Env.apiBase}/stigs/${_this.benchmarkId}/revisions`
    })
    const revisionComboBox = new Ext.form.ComboBox({
      store: revisionStore,
      displayField: 'display',
      valueField: 'revisionStr',
      triggerAction: 'all',
      mode: 'local',
      editable: false,
      listeners: {
        select: function (combo, record, index) {
          _this.revisionStr = combo.getValue()
          _this.loadStig()
        }
      }
    })
    const tbar = new Ext.Toolbar({
      items: ['Revision', revisionComboBox]
    })
    const bbar = new Ext.Toolbar({
      items: [
        exportBtn,
        '->',
        totalTextItem
      ]
    })

    async function getStig(benchmarkId, revisionStr) {
      let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules`,
        method: 'GET',
        params: {
          projection: ['check', 'fix', 'detail']
        }
      })
      return JSON.parse(result.response.responseText)
    }

    this.loadStig = async function (benchmarkId = _this.benchmarkId, revisionStr = _this.revisionStr || 'latest') {
      try {
        exportBtn.gridBasename = benchmarkId
        _this.benchmarkId = benchmarkId
        _this.getEl().mask('Please wait')
        const apiStig = await getStig(benchmarkId, revisionStr)
        store.loadData(apiStig)
      }
      catch (e) {
        console.error(e.message)
      }
      finally {
        _this.getEl().unmask()
      }
    }
    this.loadRevisions = async function (benchmarkId = _this.benchmarkId, revisionStr = _this.revisionStr) {
      try {
        await revisionStore.loadPromise()
        revisionComboBox.setValue(revisionStr)
      }
      catch (e) {
        console.error(e.message)
      }
    }
    const config = {
      title,
      store,
      columns,
      view,
      tbar,
      bbar,
      autoExpandColumn: ruleTitleColumnId,
      stripeRows: true,
      loadMask: { msg: '' }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Library.ChecklistGrid.superclass.initComponent.call(this);
  }
})

SM.Library.RuleContentPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const config = {
      padding: 20,
      autoScroll: true,
      title: 'Rule',
      tpl: SM.RuleContentTpl
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Library.RuleContentPanel.superclass.initComponent.call(this);
  }
})

SM.Library.StigPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const checklistGrid = new SM.Library.ChecklistGrid({
      benchmarkId: this.benchmarkId,
      revisionStr: this.revisionStr || 'latest',
      stigTitle: this.stigTitle,
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      border: false,
      region: 'center'
    })
    this.load = async function () {
      await checklistGrid.loadStig(this.benchmarkId)
      await checklistGrid.loadRevisions(this.benchmarkId)
    }
    const config = {
      iconCls: 'sm-stig-icon',
      closable: true,
      layout: 'border',
      layoutConfig: {
        targetCls: 'sm-border-layout-ct'
      },
      items: [
        checklistGrid
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Library.RuleContentPanel.superclass.initComponent.call(this)
  }
})

SM.Library.DiffRevisionComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const _this = this

    this.store = new Ext.data.SimpleStore({
      fields: ['value']
    })

    const data = []

    const config = {
      displayField: 'value',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }

    this.store.on('load', function (store) {
      const count = store.getCount()
      if (count > 1) {
        const offset = _this.side === 'left' ? count - 2 : count - 1
        _this.setValue(store.getAt(offset).get('value'))
      }
    })


    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)

    this.store.loadData(data)
  }
})

SM.Library.DiffRulesGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this

    function disableRevisionComboBoxes(disable) {
      leftRevisionComboBox.setDisabled(disable)
      rightRevisionComboBox.setDisabled(disable)
    }

    const stigSelectionField = new SM.StigSelectionField({
      autoLoad: false,
      name: 'benchmarkId',
      width: 360,
      submitValue: false,
      fieldLabel: 'BenchmarkId',
      hideTrigger: false,
      anchor: '100%',
      allowBlank: false,
      emptyText: 'Select a Benchmark to compare revisions',
      listeners: {
        // select: this.onStigSelect || function () { }
        select: function (combo, record, index) {
          const data = record.data.revisionStrs.map(i => [i])
          leftRevisionComboBox.store.loadData(data)
          rightRevisionComboBox.store.loadData(data)
          disableRevisionComboBoxes(false)
          _this.onStigSelect && _this.onStigSelect(combo, record, index)
        },
        invalid: function (combo, msg) {
          _this.store.removeAll()
          leftRevisionComboBox.store.removeAll()
          rightRevisionComboBox.store.removeAll()
          disableRevisionComboBoxes(true)
        }
      }
    })
    stigSelectionField.store.loadData(this.apiStigs)

    const onRevisionSelect = function () {
      const benchmarkId = stigSelectionField.getValue()
      const lhRevisionStr = leftRevisionComboBox.getValue()
      const rhRevisionStr = rightRevisionComboBox.getValue()
      _this.onRevisionSelect && _this.onRevisionSelect(benchmarkId, lhRevisionStr, rhRevisionStr)
    }

    const leftRevisionComboBox = new SM.Library.DiffRevisionComboBox({
      // emptyText: 'Select a Benchmark',
      width: 70,
      disabled: true,
      side: 'left',
      listeners: {
        select: onRevisionSelect
      }
    })
    const rightRevisionComboBox = new SM.Library.DiffRevisionComboBox({
      // emptyText: 'Select a Benchmark',
      width: 70,
      disabled: true,
      listeners: {
        select: onRevisionSelect
      }
    })

    const tbar = new Ext.Toolbar({
      height: 30,
      cls: 'sm-toolbar-diff',
      items: [
        {
          xtype: 'tbtext',
          text: 'Benchmark:&nbsp;'
        },
        stigSelectionField,
        ' ',
        {
          xtype: 'tbtext',
          text: 'Left revision:&nbsp;'
        },
        leftRevisionComboBox,
        ' ',
        {
          xtype: 'tbtext',
          text: 'Right revision:&nbsp;'
        },
        rightRevisionComboBox
      ]
    })

    const fields = [
      'stigId', 'severities', 'lRuleId', 'rRuleId', 'unified', 'updates'
    ]

    const renderRule = function (lhs, rhs, side) {
      if (!lhs && !rhs) {
        return ''
      }

      if (side === 'left') {
        if (!lhs) {
          return ''
        }
        if (!rhs) {
          return `<span class="sm-diff-del">${lhs}</span>`
        }
      }
      if (side === 'right') {
        if (!lhs) {
          return `<span class="sm-diff-ins">${rhs}</span>`
        }
        if (!rhs) {
          return ''
        }
      }

      const re = /SV-(\d+)r(\d+)_rule/
      const lm = lhs.match(re)
      const rm = rhs.match(re)

      if (side === 'left') {
        let prefix = lm[1] === rm[1] ? lm[1] : `<span class="sm-diff-del">${lm[1]}</span>`
        let postfix = lm[2] === rm[2] ? `${lm[2]}` : `<span class="sm-diff-del">${lm[2]}</span>`
        return `SV-${prefix}r${postfix}_rule`
      }
      if (side === 'right') {
        let prefix = lm[1] === rm[1] ? rm[1] : `<span class="sm-diff-ins">${rm[1]}</span>`
        let postfix = lm[2] === rm[2] ? `${rm[2]}` : `<span class="sm-diff-ins">${rm[2]}</span>`
        return `SV-${prefix}r${postfix}_rule`
      }
    }

    const columns = [
      {
        header: "STIG Id",
        width: 175,
        dataIndex: 'stigId',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Left rule',
        width: 175,
        dataIndex: 'lRuleId',
        sortable: true,
        filter: { type: 'string' },
        renderer: function (value, metaData, record) {
          return renderRule(record.data.lRuleId, record.data.rRuleId, 'left')
        }
      },
      {
        header: 'Right rule',
        width: 175,
        dataIndex: 'rRuleId',
        sortable: true,
        filter: { type: 'string' },
        renderer: function (value, metaData, record) {
          return renderRule(record.data.lRuleId, record.data.rRuleId, 'right')
        }
      },
      {
        header: 'CAT',
        align: 'center',
        width: 100,
        dataIndex: 'severities',
        filter: { type: 'values' },
        renderer: function (value) {
          let html = ''
          switch (value[0]) {
            case 'high':
              html += '<span class="sm-grid-sprite sm-severity-high">CAT 1</span>'
              break
            case 'medium':
              html += '<span class="sm-grid-sprite sm-severity-medium">CAT 2</span>'
              break
            case 'low':
              html += '<span class="sm-grid-sprite sm-severity-low">CAT 3</span>'
              break
          }
          if (value[0] && value[1] && value[0] !== value[1]) {
            html += ' &gt;&gt; '
            switch (value[1]) {
              case 'high':
                html += '<span class="sm-grid-sprite sm-severity-high">CAT 1</span>'
                break
              case 'medium':
                html += '<span class="sm-grid-sprite sm-severity-medium">CAT 2</span>'
                break
              case 'low':
                html += '<span class="sm-grid-sprite sm-severity-low">CAT 3</span>'
                break
            }
          }
          return html
        }
      },
      {
        header: '<span exportvalue="Changed properties">Changed properties<i class= "fa fa-question-circle sm-question-circle"></i></span>',
        id: 'diff-updated-props',
        width: 200,
        dataIndex: 'updates',
        sortable: true,
        filter: { type: 'values' },
        renderer: function (value, md, record) {
          if (!value?.length) {
            return '<span style="color:grey;font-style:italic">No value</span>'
          }
          let spriteChain = ''
          for (const item of value) {
            spriteChain += `<span class="sm-label-sprite ${item === 'check' || item === 'rule added' ? 'sm-diff-sprite-check' : 'sm-diff-sprite'}">${item}</span> `
          }
          return spriteChain
        }
      }

    ]
    const store = new Ext.data.JsonStore({
      grid: this,
      root: '',
      fields,
      idProperty: 'stigId',
      sortInfo: {
        field: 'stigId',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    this.totalTextCmp = new SM.RowCountTextItem({
      store
    })
    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          grid: this,
          hasMenu: false,
          gridBasename: 'Changed Rules (grid)',
          storeBasename: 'Changed Rules (store)',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        this.totalTextCmp
      ]
    })

    const config = {
      layout: 'fit',
      loadMask: { msg: '' },
      autoExpandColumn: 'diff-updated-props',
      store,
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      sm: new Ext.grid.RowSelectionModel({
        singleSelect: true,
        listeners: {
          rowselect: this.onRowSelect || function () { }
        }
      }),
      view: new SM.ColumnFilters.GridView({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          },
          refresh: function (view) {
            // Setup the tooltip for column 'updates'
            const index = view.grid.getColumnModel().findColumnIndex('updates')
            const tipEl = view.getHeaderCell(index).getElementsByClassName('fa')[0]
            if (tipEl) {
              new Ext.ToolTip({
                target: tipEl,
                showDelay: 0,
                dismissDelay: 0,
                autoWidth: true,
                html: SM.TipContent.RulePropertyDiffs
              })
            }
          }
        }
      }),
      tbar,
      bbar,
      listeners: {
        viewready: function (grid) {
          // Setup the tooltip for column 'updates'
          const index = grid.getColumnModel().findColumnIndex('updates')
          const tipEl = grid.view.getHeaderCell(index).getElementsByClassName('fa')[0]
          if (tipEl) {
            new Ext.ToolTip({
              target: tipEl,
              showDelay: 0,
              dismissDelay: 0,
              autoWidth: true,
              html: SM.TipContent.RulePropertyDiffs
            })
          }
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Library.DiffContentPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const config = {
      autoScroll: true,
      emptyText: 'Select a row in the grid above'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Library.GenerateDiffData = function (lhs, rhs) {
  const obj = {}
  const data = []

  for (const rule of lhs) {
    const value = obj[rule.version] ?? {}
    value.lhs = rule
    obj[rule.version] = value
  }
  for (const rule of rhs) {
    const value = obj[rule.version] ?? {}
    value.rhs = rule
    obj[rule.version] = value
  }

  const ruleProps = [
    'title',
    'groupId',
    'groupTitle',
    'severity',
  ]
  const detailProps = [
    "weight",
    "mitigations",
    "documentable",
    "falseNegatives",
    "falsePositives",
    "responsibility",
    "vulnDiscussion",
    "thirdPartyTools",
    "potentialImpacts",
    "mitigationControl",
    "severityOverrideGuidance"
  ]

  for (const [key, value] of Object.entries(obj)) {
    let thisUnified
    const diffOptions = {
      context: 999,
      newlineIsToken: true,
      ignoreWhitespace: false
    }
    let fullUnified = ''

    // check if ruleId is changed
    let lhsStr = value.lhs?.ruleId ?? ''
    let rhsStr = value.rhs?.ruleId ?? ''
    thisUnified = Diff.createPatch('ruleId', lhsStr, rhsStr, undefined, undefined, diffOptions)

    if (thisUnified) {
      const dataItem = {
        severities: [],
        stigId: key,
        lRuleId: value.lhs?.ruleId,
        rRuleId: value.rhs?.ruleId,
        updates: [],
        unified: ''
      }

      if (value.lhs?.severity) {
        dataItem.severities.push(value.lhs.severity)
      }
      if (value.rhs?.severity) {
        dataItem.severities.push(value.rhs.severity)
      }

      for (const prop of ruleProps) {
        lhsStr = value.lhs?.[prop] ?? ''
        rhsStr = value.rhs?.[prop] ?? ''
        thisUnified = Diff.createPatch(prop, lhsStr, rhsStr, undefined, undefined, diffOptions)
        if (thisUnified) {
          dataItem.updates.push(prop)
          fullUnified += thisUnified
        }
      }

      for (const prop of detailProps) {
        lhsStr = value.lhs?.detail[prop] ?? ''
        rhsStr = value.rhs?.detail[prop] ?? ''
        thisUnified = Diff.createPatch(prop, lhsStr, rhsStr, undefined, undefined, diffOptions)
        if (thisUnified) {
          dataItem.updates.push(prop)
          fullUnified += thisUnified
        }
      }

      // check
      lhsStr = value.lhs?.check?.content ?? ''
      rhsStr = value.rhs?.check?.content ?? ''
      thisUnified = Diff.createPatch('check', lhsStr, rhsStr, undefined, undefined, diffOptions)
      if (thisUnified) {
        dataItem.updates.push('check')
        fullUnified += thisUnified
      }

      // fix
      lhsStr = value.lhs?.fix?.text ?? ''
      rhsStr = value.rhs?.fix?.text ?? ''
      thisUnified = Diff.createPatch('fix', lhsStr, rhsStr, undefined, undefined, diffOptions)
      if (thisUnified) {
        dataItem.updates.push('fix')
        fullUnified += thisUnified
      }

      // ccis
      const lCcis = value.lhs?.ccis.map(i=>i.cci).sort((a,b)=>a.localeCompare(b)) ?? []
      const rCcis = value.rhs?.ccis.map(i=>i.cci).sort((a,b)=>a.localeCompare(b)) ?? []
      thisUnified = Diff.createPatch('cci', JSON.stringify(lCcis), JSON.stringify(rCcis), undefined, undefined, diffOptions)
      if (thisUnified) {
        dataItem.updates.push('cci')
        fullUnified += thisUnified
      }

      if (fullUnified) {
        dataItem.unified = fullUnified
      }
      if (value.lhs?.ruleId && !value.rhs?.ruleId) {
        dataItem.updates = ['rule removed']
      }
      if (value.rhs?.ruleId && !value.lhs?.ruleId) {
        dataItem.updates = ['rule added']
      }
      data.push(dataItem)
    }
  }
  return data
}

SM.Library.DiffPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this

    const diffContentPanelEmptyText = `<div class="x-grid-empty">Select a rule from the grid above</div>`

    const doDiff = async function (benchmarkId, lhRevisionStr, rhRevisionStr) {
      try {
        diffContentPanel.update(diffContentPanelEmptyText)
        diffRulesGrid.bwrap.mask('')

        const [lhResult, rhResult] = await Promise.all([
          Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${lhRevisionStr}/rules`,
            method: 'GET',
            params: {
              projection: ['check', 'fix', 'detail', 'ccis']
            }
          }),
          Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${rhRevisionStr}/rules`,
            method: 'GET',
            params: {
              projection: ['check', 'fix', 'detail', 'ccis']
            }
          })
        ])

        const rhs = JSON.parse(rhResult.response.responseText)
        const lhs = JSON.parse(lhResult.response.responseText)

        const diffData = SM.Library.GenerateDiffData(lhs, rhs)

        diffRulesGrid.store.loadData(diffData)
      }
      catch (e) {
        console.log(e)
      }
      finally {
        diffRulesGrid.bwrap.unmask()
      }

    }

    const onStigSelect = async function (combo, record, index) {
      const benchmarkId = record.data.benchmarkId
      const revisionStrs = record.data.revisionStrs
      const l = revisionStrs.length
      const rhRevisionStr = revisionStrs[l - 1]
      const lhRevisionStr = revisionStrs[l - 2]
      await doDiff(benchmarkId, lhRevisionStr, rhRevisionStr)
    }

    const onRowSelect = function (sm, index, record) {
      const configuration = {
        drawFileList: false,
        matching: 'lines',
        diffStyle: 'word'
      }
      const html = record.data.unified ? Diff2Html.html(record.data.unified, configuration) : `<div class="x-grid-empty">No tracked properties were changed</div>`
      diffContentPanel.update(html)
    }

    const onRevisionSelect = async function (benchmarkId, lhRevisionStr, rhRevisionStr) {
      await doDiff(benchmarkId, lhRevisionStr, rhRevisionStr)
    }

    const diffRulesGrid = new SM.Library.DiffRulesGrid({
      title: 'Changed ruleIds',
      border: false,
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
      region: 'north',
      split: true,
      height: 400,
      onRowSelect,
      apiStigs: this.multiRevisionStigs,
      onStigSelect,
      onRevisionSelect
    })

    const diffContentPanel = new SM.Library.DiffContentPanel({
      title: 'Detailed changes',
      html: diffContentPanelEmptyText,
      cls: 'sm-round-panel',
      padding: 10,
      border: false,
      margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.edge, left: SM.Margin.edge },
      region: 'center'
    })

    const config = {
      layout: 'border',
      items: [
        diffContentPanel,
        diffRulesGrid
      ],
      diffRulesGrid,
      diffContentPanel
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Library.showDiffPanel = async function (options) {

  const { treePath, multiRevisionStigs = [] } = options
  const tab = Ext.getCmp('main-tab-panel').getItem(`stig-diff`)
  if (tab) {
    Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
    return
  }

  const diffPanel = new SM.Library.DiffPanel({
    title: 'Compare STIG Revisions',
    id: 'stig-diff',
    closable: true,
    iconCls: 'sm-diff-icon',
    multiRevisionStigs
  })

  SM.AddPanelToMainTab(diffPanel, 'permanent')
}