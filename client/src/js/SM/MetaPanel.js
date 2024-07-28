Ext.ns('SM.MetaPanel')

SM.MetaPanel.numberRenderer = new Intl.NumberFormat().format

SM.MetaPanel.CommonColumns = [
  {
    header: "Checks",
    width: 50,
    dataIndex: 'assessments',
    align: "center",
    sortable: true,
    renderer: SM.MetaPanel.numberRenderer
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
    header: 'Updated',
    width: 50,
    dataIndex: 'maxTouchTs',
    align: 'center',
    sortable: true,
    renderer: renderDurationToNow
  },
  {
    header: "Assessed",
    width: 75,
    dataIndex: 'assessedPct',
    // align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Submitted",
    width: 75,
    dataIndex: 'submittedPct',
    // align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Accepted",
    width: 75,
    dataIndex: 'acceptedPct',
    // align: "center",
    sortable: true,
    renderer: renderPct
  },
  {
    header: "Rejected",
    width: 75,
    dataIndex: 'rejectedPct',
    // align: "center",
    sortable: true,
    renderer: renderPctAllHigh
  },
  {
    header: "CAT 3",
    width: 50,
    dataIndex: 'low',
    align: "center",
    sortable: true,
    renderer: SM.CollectionPanel.Renderers.severityCount
  },
  {
    header: "CAT 2",
    width: 50,
    dataIndex: 'medium',
    align: "center",
    sortable: true,
    renderer: SM.CollectionPanel.Renderers.severityCount
  },
  {
    header: "CAT 1",
    width: 50,
    dataIndex: 'high',
    align: "center",
    sortable: true,
    renderer: SM.CollectionPanel.Renderers.severityCount
  },
]

SM.MetaPanel.getRevisionId = function (benchmarkId, revisionStr) {
  const [results, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
  return `${benchmarkId}-${version}-${release}`
}

SM.MetaPanel.renderWithToolFactory = function (action) {
  let imgSrc, tipTarget
  switch (action) {
    case 'dashboard':
      imgSrc = "img/collection-color.svg"
      tipTarget = 'dashboard'
      break
    case 'checklist':
    default:
      imgSrc = "img/shield-green-check.svg"
      tipTarget = 'checklist'
      break
  }
  return function (v) {
    return `
    <div class="sm-grid-cell-with-toolbar">
      <div class="sm-dynamic-width">
        <div class="sm-info">${v}</div>
      </div>
      <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" sm:action="${action}" ext:qtip="Open ${tipTarget}" src="${imgSrc}" width="13" height="13"></div>
    </div>`
  }
}

SM.MetaPanel.AggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this

    const sm = this.checkboxSelModel ? new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
    }) : new Ext.grid.RowSelectionModel({
      singleSelect: true
    })
    const fields = [...SM.CollectionPanel.CommonFields]
    const columns = []
    if (this.checkboxSelModel) {
      columns.push(sm)
    }
    let idProperty, sortField = 'name', autoExpandColumn = Ext.id()
    let rowdblclick = () => { }
    let cellmousedown = () => { }

    const rowCountCfg = {
      noun: this.aggregation,
      iconCls: `sm-${this.aggregation}-icon`
    }
    switch (this.aggregation) {
      case 'asset':
        fields.push(
          { name: 'assetId', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'labelIds', type: 'string', convert: (v, r) => r.labels.map(l => l.labelId) },
          'benchmarkIds',
          { name: 'stigCount', convert: (v, r) => r.benchmarkIds.length }
        )
        columns.push(
          {
            header: "Asset",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            filter: { type: 'string' }
          },
          {
            header: "Labels",
            width: 120,
            dataIndex: 'labelIds',
            sortable: false,
            filter: {
              type: 'values',
              collectionId: _this.collectionId,
              renderer: SM.ColumnFilters.Renderers.labels
            },
            renderer: function (value, metadata) {
              const labels = []
              for (const labelId of value) {
                const label = SM.Cache.getCollectionLabel(_this.collectionId, labelId)
                if (label) labels.push(label)
              }
              labels.sort((a, b) => a.name.localeCompare(b.name))
              metadata.attr = 'style="white-space:nowrap;text-overflow:clip;"'
              return SM.styledEmptyRenderer(SM.Collection.LabelArrayTpl.apply(labels))
            }
          },
          {
            header: "STIGs",
            width: 50,
            dataIndex: 'stigCount',
            align: "center",
            tooltip: "Total STIGs Assigned",
            sortable: true
          }
        )
        idProperty = 'assetId'
        break
      case 'collection':
        fields.push(
          { name: 'collectionId', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'assets', type: 'integer' },
          { name: 'stigs', type: 'integer' },
          { name: 'checklists', type: 'integer' }
        )
        columns.push(
          {
            header: "Collection",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            renderer: SM.MetaPanel.renderWithToolFactory(this.hideReviewTool ? 'dashboard' : 'checklist'),
            filter: { type: 'string' },
            listeners: {
              mousedown: function (col, grid, index, e) {
                if (e.target.className === "sm-grid-cell-toolbar-edit") {
                  return false
                }
              }
            }
          },
          {
            header: "Assets",
            width: 50,
            dataIndex: 'assets',
            align: "center",
            tooltip: "Total Assets in the Collection",
            sortable: true,
            renderer: SM.MetaPanel.numberRenderer
          }
        )
        if (this.region === 'north') {
          columns.push(
            {
              header: "STIGs",
              width: 50,
              dataIndex: 'stigs',
              align: "center",
              tooltip: "Total STIGs in the Collection",
              sortable: true
            },
            {
              header: "Checklists",
              width: 50,
              dataIndex: 'checklists',
              align: "center",
              tooltip: "Total Asset/STIG in the Collection",
              sortable: true,
              renderer: SM.MetaPanel.numberRenderer
            }  
          )
        }
        idProperty = 'collectionId'
        sortField = 'name'
        rowdblclick = (grid, rowIndex) => {
          const r = grid.getStore().getAt(rowIndex)
          const leaf = {
            collectionId: r.data.collectionId,
            benchmarkId: grid.benchmarkId,
            revisionStr: grid.revisionStr
          }
          addCollectionReview({ leaf })
        }
        cellmousedown = (grid, rowIndex, columnIndex, e) => {
          if (e.target.className === "sm-grid-cell-toolbar-edit") {
            const r = grid.getStore().getAt(rowIndex)
            const action = e.target.getAttribute('sm:action')
            if (action === 'dashboard') {
              SM.CollectionPanel.showCollectionTab({
                collectionId: r.data.collectionId,
                collectionName: r.data.name,

              })
            }
            else {
              const leaf = {
                collectionId: r.data.collectionId,
                benchmarkId: grid.benchmarkId,
                revisionStr: grid.revisionStr
              }
              addCollectionReview({ leaf }) 
            }
          }
        }

        break
      case 'stig':
        fields.push(
          { name: 'benchmarkId', type: 'string' },
          { name: 'title', type: 'string' },
          { name: 'revisionStr', type: 'string' },
          { name: 'revisionPinned' },
          'collections',
          'assets',
          { name: 'revisionId', type: 'string', convert: (v, r) => SM.MetaPanel.getRevisionId(r.benchmarkId, r.revisionStr) }
        )
        idProperty = r => SM.MetaPanel.getRevisionId(r.benchmarkId, r.revisionStr)
        columns.push(
          {
            header: "Benchmark",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'benchmarkId',
            sortable: true,
            renderer: this.hideReviewTool ?  v => v : SM.MetaPanel.renderWithToolFactory('checklist'),
            filter: { type: 'string' },
            listeners: {
              mousedown: function (col, grid, index, e) {
                if (e.target.className === "sm-grid-cell-toolbar-edit") {
                  return false
                }
              }
            }
          },
          {
            header: "Title",
            width: 175,
            dataIndex: 'title',
            sortable: true,
            filter: { type: 'string' },
            hidden: true
          },
          {
            header: "Revision",
            width: 58,
            dataIndex: 'revisionStr',
            align: "left",
            tooltip: "Default revision",
            sortable: true,
            renderer: function (v, md, r) {
              return `${r.data.revisionStr}${r.data.revisionPinned ? '<img src="img/pin.svg" width="12" height="12" style="margin-left: 8px;">' : ''}`
            }
          }
        )
        if (this.region === 'north') {
          columns.push(
            {
              header: "Collections",
              width: 50,
              dataIndex: 'collections',
              align: "center",
              tooltip: "Total Collections with this STIG assigned",
              sortable: true
            }
          )
        } 
        columns.push(
          {
            header: "Assets",
            width: 50,
            dataIndex: 'assets',
            align: "center",
            tooltip: "Total Assets with this STIG assigned",
            sortable: true,
            renderer: SM.MetaPanel.numberRenderer
          }
        )
        sortField = 'benchmarkId'
        rowdblclick = (grid, rowIndex) => {
          const r = grid.getStore().getAt(rowIndex)
          const leaf = {
            collectionId: grid.collectionId,
            benchmarkId: r.data.benchmarkId,
            revisionStr: r.data.revisionStr
          }
          addCollectionReview({ leaf })
        }
        cellmousedown = (grid, rowIndex, columnIndex, e) => {
          if (e.target.className === "sm-grid-cell-toolbar-edit") {
            const r = grid.getStore().getAt(rowIndex)
            const leaf = {
              collectionId: grid.collectionId,
              benchmarkId: r.data.benchmarkId,
              revisionStr: r.data.revisionStr
            }
            addCollectionReview({ leaf })
          }
        }
        rowCountCfg.noun = 'STIG'
        break
    }
    columns.push(...SM.MetaPanel.CommonColumns)

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: `${STIGMAN.Env.apiBase}/collections/meta/metrics/summary/${this.aggregation}`,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      autoLoad: this.storeAutoLoad ?? false,
      baseParams: this.baseParams,
      smMaskDelay: 50,
      proxy: this.proxy,
      root: '',
      fields,
      idProperty,
      sortInfo: {
        field: sortField,
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    this.totalTextCmp = new SM.RowCountTextItem({
      store,
      ...rowCountCfg
    })

    const config = {
      layout: 'fit',
      store,
      loadMask: { msg: '' },
      sm,
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      view: new SM.ColumnFilters.GridViewBuffered({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        cellSelectorDepth: 5,
        // custom row height
        rowHeight: 21,
        borderHeight: 2,
        // render rows as they come into viewable area.
        scrollDelay: false,
        autoExpandColumn,
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          }
        }
      }),
      bbar: new Ext.Toolbar({
        items: [
          {
            xtype: 'sm-reload-store-button',
            store,
            handler: this.reloadBtnHandler
          },
          {
            xtype: 'tbseparator'
          }, {
            xtype: 'exportbutton',
            hasMenu: false,
            grid: this,
            gridBasename: this.exportName || this.title || 'aggregation',
            iconCls: 'sm-export-icon',
            text: 'CSV'
          }, {
            xtype: 'tbfill'
          }, {
            xtype: 'tbseparator'
          },
          this.totalTextCmp
        ]
      }),
      listeners: {
        rowdblclick,
        cellmousedown
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.UnaggGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = [
      { name: 'assetId', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'labelIds', type: 'string', convert: (v, r) => r.labels.map(l => l.labelId) },
      'benchmarkId',
      'title',
      'revisionStr',
      'revisionPinned',
      ...SM.CollectionPanel.CommonFields
    ]
    const columns = []
    let sortField, autoExpandColumn = Ext.id()

    switch (this.parentAggregation) {
      case 'stig':
        columns.push(
          {
            header: "Asset",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'name',
            sortable: true,
            filter: { type: 'string' },
            renderer: SM.MetaPanel.renderWithToolFactory('checklist')
          },
          {
            header: "Labels",
            width: 120,
            dataIndex: 'labelIds',
            sortable: false,
            // filter: {
            //   type: 'values',
            //   collectionId: _this.collectionId,
            //   renderer: SM.ColumnFilters.Renderers.labels
            // },
            renderer: function (value, metadata) {
              const labels = []
              for (const labelId of value) {
                const label = SM.Cache.getCollectionLabel(_this.collectionId, labelId)
                if (label) labels.push(label)
              }
              labels.sort((a, b) => a.name.localeCompare(b.name))
              metadata.attr = 'style="white-space:nowrap;text-overflow:clip;"'
              return SM.styledEmptyRenderer(SM.Collection.LabelArrayTpl.apply(labels))
            }
          }
        )
        sortField = 'name'
        break
      case 'asset':
        columns.push(
          {
            header: "Benchmark",
            width: 175,
            id: autoExpandColumn,
            dataIndex: 'benchmarkId',
            sortable: true,
            filter: { type: 'string' },
            renderer: SM.MetaPanel.renderWithToolFactory('checklist')
          },
          {
            header: "Title",
            width: 175,
            dataIndex: 'title',
            sortable: true,
            filter: { type: 'string' },
            hidden: true
          },
          {
            header: "Revision",
            width: 58,
            dataIndex: 'revisionStr',
            align: "center",
            tooltip: "Default revision",
            sortable: true,
            renderer: function (v, md, r) {
              return `${r.data.revisionStr}${r.data.revisionPinned ? '<img src="img/pin.svg" width="12" height="12" style="margin-left: 8px;">' : ''}`
            }
          }
        )
        sortField = 'benchmarkId'
        break
    }
    columns.push(...SM.MetaPanel.CommonColumns)

    this.proxy = new Ext.data.HttpProxy({
      restful: true,
      url: `${STIGMAN.Env.apiBase}/collections/${this.collectionId}/metrics/summary`,
      headers: { 'Content-Type': 'application/json;charset=utf-8' }
    })
    const store = new Ext.data.JsonStore({
      grid: this,
      autoLoad: false,
      smMaskDelay: 50,
      proxy: this.proxy,
      root: '',
      fields,
      idProperty: (v) => {
        return `${v.assetId}-${v.benchmarkId}`
      },
      sortInfo: {
        field: sortField,
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      }
    })
    this.totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'checklist',
      iconCls: 'sm-stig-icon'
    })

    const rowdblclick = (grid, rowIndex) => {
      const r = grid.getStore().getAt(rowIndex)
      const leaf = {
        collectionId: grid.collectionId,
        assetId: r.data.assetId,
        assetName: r.data.name,
        assetLabelIds: r.data.labelIds,
        benchmarkId: r.data.benchmarkId,
        revisionStr: r.data.revisionStr,
        stigName: r.data.benchmarkId,
      }
      addReview({ leaf })
    }

    function cellclick(grid, rowIndex, columnIndex, e) {
      if (e.target.className === "sm-grid-cell-toolbar-edit") {
        const r = grid.getStore().getAt(rowIndex)
        const leaf = {
          collectionId: grid.collectionId,
          assetId: r.data.assetId,
          assetName: r.data.name,
          assetLabelIds: r.data.labelIds,
          benchmarkId: r.data.benchmarkId,
          revisionStr: r.data.revisionStr,
          stigName: r.data.benchmarkId,
        }
        addReview({ leaf })
      }
    }

    const config = {
      layout: 'fit',
      store,
      loadMask: { msg: '' },
      cm: new Ext.grid.ColumnModel({
        columns
      }),
      view: new SM.ColumnFilters.GridViewBuffered({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        cellSelectorDepth: 5,
        // custom row height
        rowHeight: 21,
        borderHeight: 2,
        // render rows as they come into viewable area.
        scrollDelay: false,
        autoExpandColumn,
        listeners: {
          filterschanged: function (view, item, value) {
            store.filter(view.getFilterFns())
          }
        }
      }),
      bbar: new Ext.Toolbar({
        items: [
          {
            xtype: 'sm-reload-store-button',
            store,
            handler: this.reloadBtnHandler
          },
          {
            xtype: 'tbseparator'
          },
          {
            xtype: 'exportbutton',
            hasMenu: false,
            grid: this,
            gridBasename: this.exportName || this.title || 'unaggregated',
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
      }),
      listeners: {
        rowdblclick,
        cellclick
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.ProgressPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {

    const calcMetrics = function (metrics) {
      return {
        unassessed: metrics.assessments - metrics.assessed,
        assessed: metrics.statuses.saved - metrics.results.unassessed,
        submitted: metrics.statuses.submitted,
        accepted: metrics.statuses.accepted,
        rejected: metrics.statuses.rejected,
        assessments: metrics.assessments,
        apiAssessed: metrics.assessed
      }
    }

    const chartOptions = {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [0, 0, 0, 0, 0],
          backgroundColor: SM.CollectionPanel.ProgressPanelColors(localStorage.getItem('darkMode') === '1' ? 'dark' : 'light'),
          borderWidth: [1, 1],
          borderColor: '#bbbbbb'
        }],
        labels: [
          'Assessed',
          'Submitted',
          'Accepted',
          'Unassessed',
          'Rejected'
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    }

    const chartPanel = new SM.CollectionPanel.ChartPanel({
      border: false,
      width: 170,
      height: 170,
      chartOptions
    })

    const onThemeChanged = function (theme) {
      if (chartPanel.chart) {
        chartPanel.chart.config._config.data.datasets[0].backgroundColor = SM.CollectionPanel.ProgressPanelColors(theme)
        chartPanel.chart.update()
      }
    }
    SM.Dispatcher.addListener('themechanged', onThemeChanged)

    const updateMetrics = function (metrics) {
      const metricCalcs = calcMetrics(metrics)
      dataPanel.update(metricCalcs)
      if (chartPanel.chart) {
        chartPanel.chart.config._config.data.datasets[0].data = [
          metricCalcs.assessed, //Assessed
          metricCalcs.submitted, // Submitted
          metricCalcs.accepted, // Accepted
          metricCalcs.unassessed, // Unassessed
          metricCalcs.rejected // Rejected         
        ]
        chartPanel.chart.update()
      }
      progressBarsPanel.updateMetrics(metrics)
    }

    const dataTpl = new Ext.XTemplate(
      `<div class="sm-metrics-status-pct">{[this.calcAssessedPct(values.apiAssessed, values.assessments)]}% assessed</div>`,
      '<table class="sm-metrics-status-table" style="margin: 0 auto;">',
      '<tbody>',
      '<tr><td class="sm-metrics-label sm-metrics-unassessed">Unassessed</td><td class="sm-metrics-value">{[this.intlNumberFormat(values.unassessed)]}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-assessed">Assessed</td><td class="sm-metrics-value">{[this.intlNumberFormat(values.assessed)]}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-submitted">Submitted</td><td class="sm-metrics-value">{[this.intlNumberFormat(values.submitted)]}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-accepted">Accepted</td><td class="sm-metrics-value">{[this.intlNumberFormat(values.accepted)]}</td></tr>',
      '<tr><td class="sm-metrics-label sm-metrics-rejected">Rejected</td><td class="sm-metrics-value">{[this.intlNumberFormat(values.rejected)]}</td></tr>',
      '<tr class="sm-metrics-total"><td>Total Checks</td><td class="sm-metrics-value">{[this.intlNumberFormat(values.assessments)]}</td></tr>',
      '</tbody>',
      '</table>',
      {
        calcAssessedPct: function (assessed, assessments) {
          const pct = assessments ? assessed / assessments * 100 : 0
          if (pct > 99 && pct < 100) {
            return '>99'
          }
          else {
            return pct.toFixed(0).toString()
          }
        },
        intlNumberFormat: SM.MetaPanel.numberRenderer
      }
    )

    const dataPanel = new Ext.Panel({
      border: false,
      tpl: dataTpl,
      width: 175
    })
    const progressBarsPanel = new SM.CollectionPanel.ProgressBarsPanel({
      border: false,
      height: 44
    })

    const config = {
      layout: 'vbox',
      height: 290,
      layoutConfig: {
        align: 'stretch',
        pack: 'center'
      },
      items: [
        {
          layout: 'hbox',
          height: 180,
          border: false,
          layoutConfig: {
            align: 'middle',
            pack: 'center'
          },
          items: [chartPanel, { width: 30, border: false }, dataPanel]
        },
        { height: 20, border: false },
        progressBarsPanel,
      ],
      updateMetrics,
      listeners: {
        beforedestroy: function () {
          SM.Dispatcher.removeListener('themechanged', onThemeChanged)
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.MetaPanel.ProgressPanel.superclass.initComponent.call(this)
  }
})

SM.MetaPanel.FindingsPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const tpl = new Ext.XTemplate(
      '<div class="sm-metrics-count-parent">',
      '<div class="sm-metrics-count-child sm-metrics-low-box">',
      `<div class="sm-metrics-count-label">CAT 3</div><div class="sm-metrics-count-value">{[SM.MetaPanel.numberRenderer(values.low)]}</div>`,
      '</div>',
      '<div class="sm-metrics-count-child sm-metrics-medium-box" >',
      `<div class="sm-metrics-count-label">CAT 2</div><div class="sm-metrics-count-value">{[SM.MetaPanel.numberRenderer(values.medium)]}</div>`,
      '</div>',
      '<div class="sm-metrics-count-child sm-metrics-high-box" >',
      `<div class="sm-metrics-count-label">CAT 1</div><div class="sm-metrics-count-value">{[SM.MetaPanel.numberRenderer(values.high)]}</div>`,
      '</div>',
      '</div>'
    )
    const updateMetrics = function (metrics) {
      _this.update(metrics)
    }
    const config = {
      tpl,
      data: this.metrics,
      updateMetrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.ExportPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const localStorageBase = 'metaExport'

    const formatComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Format",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['JSON', 'json'],
          ['CSV', 'csv']
        ]
      }),
      valueField: 'valueStr',
      displayField: 'displayStr',
      value: localStorage.getItem(`${localStorageBase}Format`) || 'json',
      monitorValid: false,
      triggerAction: 'all',
      listeners: {
        select: function (combo, record, index) {
          localStorage.setItem(`${localStorageBase}Format`, combo.getValue())
        }
      }
    })
    const styleComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Style",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['Summary', 'summary'],
          ['Detail', 'detail']
        ]
      }),
      valueField: 'valueStr',
      displayField: 'displayStr',
      value: localStorage.getItem(`${localStorageBase}Style`) || 'summary',
      monitorValid: false,
      triggerAction: 'all',
      listeners: {
        select: function (combo, record, index) {
          localStorage.setItem(`${localStorageBase}Style`, combo.getValue())
        }
      }
    })
    const aggComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Grouped by",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['Collection', 'collection'],
          ['STIG', 'stig'],
          ['Totals', 'unagg']
        ]
      }),
      valueField: 'valueStr',
      displayField: 'displayStr',
      value: localStorage.getItem(`${localStorageBase}Agg`) || 'collection',
      monitorValid: false,
      triggerAction: 'all',
      listeners: {
        select: function (combo, record, index) {
          localStorage.setItem(`${localStorageBase}Agg`, combo.getValue())
        }
      }
    })
    const exportButton = new Ext.Button({
      text: 'Download',
      iconCls: 'sm-export-icon',
      disabled: false,
      style: {
        position: 'relative',
        top: '-52px',
        left: '255px'
      },
      handler: async function () {
        const queryParams = Object.entries(_this.baseParams ?? {}).flatMap(([k, v]) => Array.isArray(v) ? v.map((v) => [k, v]) : [[k, v]])
        const format = formatComboBox.getValue()
        queryParams.push(['format', format])
        const queryParamsStr = new URLSearchParams(queryParams).toString()

        const style = styleComboBox.getValue()
        const agg = aggComboBox.getValue()
        const url = `${STIGMAN.Env.apiBase}/collections/meta/metrics/${style}${agg === 'unagg' ? '' : `/${agg}`}?${queryParamsStr}`

        const attachment = SM.Global.filenameEscaped(`Meta-${agg}-${style}_${SM.Global.filenameComponentFromDate()}.${format}`)

        await window.oidcProvider.updateToken(10)
        const fetchInit = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${window.oidcProvider.token}`,
            'Accept': `${format === 'csv' ? 'text/csv' : 'application/json'}`
          },
          attachment
        }
        const href = await SM.ServiceWorker.getDownloadUrl({ url, ...fetchInit })
        if (href) {
          window.location = href
          return
        }
        const response = await fetch(url, fetchInit)
        if (!response.ok) {
          const body = await response.text()
          throw new Error(`Request failed with status ${response.status}\n${body}`)
        }
        const blob = await response.blob()
        saveAs(blob, attachment)
      }
    })


    const config = {
      layout: 'form',
      items: [
        aggComboBox,
        styleComboBox,
        formatComboBox,
        exportButton
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.InventoryPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const tpl = new Ext.XTemplate(
      '<div class="sm-metrics-count-parent">',
      '<div class="sm-metrics-count-child sm-metrics-inventory-box" >',
      `<div class="sm-metrics-count-label">Assets</div><div class="sm-metrics-count-value">{[SM.MetaPanel.numberRenderer(values.assets)]}</div>`,
      '</div>',
      '<div class="sm-metrics-count-child sm-metrics-inventory-box">',
      `<div class="sm-metrics-count-label">STIGs</div><div class="sm-metrics-count-value">{[SM.MetaPanel.numberRenderer(values.stigs)]}</div>`,
      '</div>',
      '<div class="sm-metrics-count-child sm-metrics-inventory-box">',
      `<div class="sm-metrics-count-label">Checklists</div><div class="sm-metrics-count-value">{[SM.MetaPanel.numberRenderer(values.checklists)]}</div>`,
      '</div>',
      '</div>'
    )
    const updateMetrics = function (metrics) {
      _this.update(metrics)
    }
    const config = {
      tpl,
      data: this.data,
      updateMetrics
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.OverviewPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const toolTemplate = new Ext.XTemplate(
      '<tpl if="!!values.text">',
      '<div class="x-tool x-tool-{id}">{text}</div>',
      '</tpl>',
      '<tpl if="!!!values.text">',
      '<div class="x-tool x-tool-{id}">&#160;</div>',
      '</tpl>'
    )

    const collectionId = this.collectionId
    this.lastRefreshedTextItem = new Ext.Toolbar.TextItem({
      text: '',
      tpl: [
        `<span style="font-weight:600;">Fetched:</span> {[Ext.util.Format.date(values.date,'Y-m-d H:i:s T')]}`
      ]
    })
    this.reloadBtn = new SM.ReloadStoreButton({
      handler: this.reloadBtnHandler
    })

    this.inventoryPanel = new SM.MetaPanel.InventoryPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Inventory',
      tools: this.inventoryPanelTools || undefined,
      toolTemplate,
      border: true
    })
    this.progressPanel = new SM.MetaPanel.ProgressPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Progress',
      tools: this.progressPanelTools || undefined,
      border: true
    })
    this.agesPanel = new SM.CollectionPanel.AgesPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Review Ages',
      tools: this.agesPanelTools || undefined,
      border: true
    })
    this.findingsPanel = new SM.MetaPanel.FindingsPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Findings',
      tools: this.findingsPanelTools || undefined,
      toolTemplate,
      border: true
    })
    this.exportPanel = new SM.MetaPanel.ExportPanel({
      cls: 'sm-round-inner-panel',
      bodyStyle: 'padding: 10px;',
      title: 'Export metrics',
      border: true,
      height: 122,
      collectionId
    })

    const updateBaseParams = function (params) {
      _this.baseParams = params
      _this.exportPanel.baseParams = params
    }
    const updatePanels = function (data) {
      _this.inventoryPanel.updateMetrics(data)
      _this.progressPanel.updateMetrics(data.metrics)
      _this.agesPanel.updateMetrics(data.metrics)
      _this.findingsPanel.updateMetrics(data.metrics.findings)
      _this.lastRefreshedTextItem.update({
        date: data.date
      })
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false } = {}) {
      try {
        if (!_this.hasContent || !loadMasksDisabled) {
          _this.bwrap?.mask('')
        }
        _this.reloadBtn.showLoadingIcon()
        if (!refreshViewsOnly) {
          const results = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/collections/meta/metrics/summary`,
            method: 'GET',
            params: _this.baseParams
          })
          _this.data = JSON.parse(results.response.responseText)
          _this.data.date = new Date()
        }
        updatePanels(_this.data)
        _this.hasContent = true
        return _this.data
      }
      catch (e) {
        console.log(e)
      }
      finally {
        _this.bwrap?.unmask()
        _this.reloadBtn.showRefreshIcon()
      }
    }
    const config = {
      border: false,
      autoScroll: true,
      toolTemplate,
      items: [
        this.progressPanel,
        this.inventoryPanel,
        this.findingsPanel,
        this.agesPanel,
        this.exportPanel
      ],
      bbar: [
        this.reloadBtn,
        '->',
        '-',
        this.lastRefreshedTextItem
      ],
      updateData,
      updateBaseParams
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.AggCollectionPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const gridNorth = new SM.MetaPanel.AggGrid({
      aggregation: 'collection',
      hideReviewTool: true,
      // stateId: `sm-metrics-agg-grid-label-${collectionId}`,
      // stateful: true,
      border: false,
      reloadBtnHandler: this.reloadBtnHandler,
      baseParams: this.baseParams,
      exportName: 'Collections',
      region: 'north',
      split: true,
      height: '33%',
      initialized: false
    })
    const gridCenter = new SM.MetaPanel.AggGrid({
      title: 'STIGs',
      // stateId: `sm-metrics-agg-grid-label-asset-${collectionId}`,
      // stateful: true,
      border: false,
      reloadBtnHandler: this.reloadBtnHandler,
      aggregation: 'stig',
      storeAutoLoad: false,
      baseParams: this.baseParams,
      exportName: 'STIGs',
      region: 'center'
    })
    const gridSouth = new SM.MetaPanel.UnaggGrid({
      title: 'Checklists',
      // stateId: `sm-metrics-unagg-grid-collection-${collectionId}`,
      // stateful: true,
      border: false,
      parentAggregation: 'stig',
      reloadBtnHandler: this.reloadBtnHandler,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelectNorth(cm, index, record) {
      gridCenter.collectionId = record.data.collectionId
      gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${record.data.collectionId}/metrics/summary/stig`)
      // await gridCenter.store.loadPromise()
      // gridSouth.store.removeAll()
      // gridCenter.setTitle(`STIGs for ${record.data.name}`)
      updateData({includeGridNorth: false})

    }
    async function onRowSelectCenter(cm, index, record) {
      const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
      gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${selectedRowNorth.data.collectionId}/metrics/summary`)
      gridSouth.collectionId = selectedRowNorth.data.collectionId
      await gridSouth.store.loadPromise({
        benchmarkId: record.data.benchmarkId
      })
      gridSouth.setTitle(`Checklists for "${record.data.benchmarkId}" in "${selectedRowNorth.data.name}"`)
    }

    gridNorth.getSelectionModel().on('rowselect', onRowSelectNorth)
    gridCenter.getSelectionModel().on('rowselect', onRowSelectCenter)
    const updateBaseParams = function (params) {
      gridNorth.store.baseParams = _this.baseParams = params
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false, includeGridNorth = true } = {}) {
      try {
        gridNorth.initialized = true
        const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
        const selectedRowCenter = gridCenter.getSelectionModel().getSelected()

        if (refreshViewsOnly) {
          gridNorth.getView().refresh()
          if (selectedRowNorth) {
            gridCenter.getView().refresh()
            if (selectedRowCenter) {
              gridSouth.getView().refresh()
            }
          }
          return
        }

        if (includeGridNorth) {
          let savedLoadMaskDisabled = gridNorth.loadMask.disabled
          gridNorth.loadMask.disabled = loadMasksDisabled
          await gridNorth.store.loadPromise()
          gridNorth.loadMask.disabled = savedLoadMaskDisabled
        }

        if (!selectedRowNorth) {
          return
        }

        const currentRecordNorth = gridNorth.store.getById(selectedRowNorth.data.collectionId)
        if (!currentRecordNorth) {
          gridCenter.setTitle('STIGs')
          gridCenter.store.removeAll()
          gridSouth.setTitle('Checklists')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexNorth = gridNorth.store.indexOfId(currentRecordNorth.data.collectionId)
        gridNorth.view.focusRow(currentIndexNorth)
        savedLoadMaskDisabled = gridCenter.loadMask.disabled
        gridCenter.loadMask.disabled = loadMasksDisabled
        gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${currentRecordNorth.data.collectionId}/metrics/summary/stig`)
        await gridCenter.store.loadPromise()
        gridCenter.loadMask.disabled = savedLoadMaskDisabled
        gridCenter.setTitle(`STIGs in "${currentRecordNorth.data.name}"`)

        
        const currentRecordCenter = gridCenter.store.getById(selectedRowCenter?.data.revisionId)
        if (!currentRecordCenter) {
          gridSouth.setTitle('Checklists')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexCenter = gridCenter.store.indexOfId(currentRecordCenter.data.revisionId)
        gridCenter.view.focusRow(currentIndexCenter)
        savedLoadMaskDisabled = gridSouth.loadMask.disabled
        gridSouth.loadMask.disabled = loadMasksDisabled
        gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${currentRecordNorth.data.collectionId}/metrics/summary`)
        gridSouth.collectionId = currentRecordNorth.data.collectionId
        await gridSouth.store.loadPromise({
          benchmarkId: currentRecordCenter.data.benchmarkId
        })
        gridSouth.loadMask.disabled = savedLoadMaskDisabled
        gridSouth.setTitle(`Checklists for "${currentRecordCenter.data.benchmarkId}" in "${currentRecordNorth.data.name}"`)

      }
      catch (e) {
        console.log(e)
      }
    }

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        gridNorth,
        gridCenter,
        gridSouth
      ],
      updateBaseParams,
      updateData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.AggStigPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const collectionId = this.collectionId
    const gridNorth = new SM.MetaPanel.AggGrid({
      aggregation: 'stig',
      hideReviewTool: true,
      // stateId: `sm-metrics-agg-grid-label-${collectionId}`,
      // stateful: true,
      border: false,
      collectionId,
      reloadBtnHandler: this.reloadBtnHandler,
      baseParams: this.baseParams,
      exportName: 'STIGs',
      region: 'north',
      split: true,
      height: '33%',
      initialized: false
    })
    const gridCenter = new SM.MetaPanel.AggGrid({
      title: 'Collections',
      // stateId: `sm-metrics-agg-grid-label-asset-${collectionId}`,
      // stateful: true,
      border: false,
      reloadBtnHandler: this.reloadBtnHandler,
      aggregation: 'collection',
      storeAutoLoad: false,
      collectionId,
      baseParams: this.baseParams,
      exportName: 'Collections',
      region: 'center'
    })
    const gridSouth = new SM.MetaPanel.UnaggGrid({
      title: 'Checklists',
      // stateId: `sm-metrics-unagg-grid-label-${collectionId}`,
      // stateful: true,
      border: false,
      parentAggregation: 'stig',
      reloadBtnHandler: this.reloadBtnHandler,
      collectionId,
      region: 'south',
      split: true,
      height: '33%'
    })
    async function onRowSelectNorth(cm, index, record) {
      gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/meta/metrics/summary/collection`)
      gridCenter.benchmarkId = record.data.benchmarkId
      gridCenter.revisionStr = record.data.revisionStr
      await gridCenter.store.loadPromise({
        revisionId: SM.MetaPanel.getRevisionId(record.data.benchmarkId, record.data.revisionStr)
      })
      updateData({includeGridNorth: false})

    }
    async function onRowSelectCenter(cm, index, record) {
      const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
      gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${record.data.collectionId}/metrics/summary`)
      gridSouth.collectionId = record.data.collectionId
      await gridSouth.store.loadPromise({
        benchmarkId: selectedRowNorth.data.benchmarkId
      })
      gridSouth.setTitle(`Checklists for "${selectedRowNorth.data.benchmarkId}" in "${record.data.name}"`)

    }

    gridNorth.getSelectionModel().on('rowselect', onRowSelectNorth)
    gridCenter.getSelectionModel().on('rowselect', onRowSelectCenter)
    const updateBaseParams = function (params) {
      gridNorth.store.baseParams = _this.baseParams = params
      gridCenter.store.baseParams = _this.baseParams = params
    }
    const updateData = async function ({ refreshViewsOnly = false, loadMasksDisabled = false, includeGridNorth = true } = {}) {
      try {
        gridNorth.initialized = true
        const selectedRowNorth = gridNorth.getSelectionModel().getSelected()
        const selectedRowCenter = gridCenter.getSelectionModel().getSelected()

        if (refreshViewsOnly) {
          gridNorth.getView().refresh()
          if (selectedRowNorth) {
            gridCenter.getView().refresh()
            if (selectedRowCenter) {
              gridSouth.getView().refresh()
            }
          }
          return
        }

        if (includeGridNorth) {
          let savedLoadMaskDisabled = gridNorth.loadMask.disabled
          gridNorth.loadMask.disabled = loadMasksDisabled
          await gridNorth.store.loadPromise()
          gridNorth.loadMask.disabled = savedLoadMaskDisabled
        }

        if (!selectedRowNorth) {
          return
        }

        const currentRecordNorth = gridNorth.store.getById(selectedRowNorth.data.revisionId)
        if (!currentRecordNorth) {
          gridCenter.setTitle('Collections')
          gridCenter.store.removeAll()
          gridSouth.setTitle('STIGs')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexNorth = gridNorth.store.indexOfId(currentRecordNorth.data.revisionId)
        gridNorth.view.focusRow(currentIndexNorth)
        savedLoadMaskDisabled = gridCenter.loadMask.disabled
        gridCenter.loadMask.disabled = loadMasksDisabled
        gridCenter.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/meta/metrics/summary/collection`)
        await gridCenter.store.loadPromise({
          revisionId: currentRecordNorth.data.revisionId
        })
        gridCenter.loadMask.disabled = savedLoadMaskDisabled
        gridCenter.setTitle(`Collections with "${currentRecordNorth.data.benchmarkId} ${currentRecordNorth.data.revisionStr}"`)

        
        const currentRecordCenter = gridCenter.store.getById(selectedRowCenter?.data.collectionId)
        if (!currentRecordCenter) {
          gridSouth.setTitle('Checklists')
          gridSouth.store.removeAll()
          return
        }
        const currentIndexCenter = gridCenter.store.indexOfId(currentRecordCenter.data.collectionId)
        gridCenter.view.focusRow(currentIndexCenter)
        savedLoadMaskDisabled = gridSouth.loadMask.disabled
        gridSouth.loadMask.disabled = loadMasksDisabled
        gridSouth.store.proxy.setUrl(`${STIGMAN.Env.apiBase}/collections/${currentRecordCenter.data.collectionId}/metrics/summary`)
        await gridSouth.store.loadPromise({
          benchmarkId: currentRecordNorth.data.benchmarkId
        })
        gridSouth.loadMask.disabled = savedLoadMaskDisabled
        gridSouth.setTitle(`Checklists for "${currentRecordNorth.data.benchmarkId}" in "${currentRecordCenter.data.name}"`)

      }
      catch (e) {
        console.log(e)
      }
    }

    const config = {
      layout: 'border',
      cls: 'sm-metric-agg-panel',
      items: [
        gridNorth,
        gridCenter,
        gridSouth
      ],
      updateBaseParams,
      updateData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.MetaPanel.showMetaTab = async function (options) {
  try {
    const { treePath, initialCollectionIds = [] } = options
    const tab = Ext.getCmp('main-tab-panel').getItem(`meta-panel`)
    if (tab) {
      Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
      return
    }

    const gState = {}

    gState.collectionIds = initialCollectionIds
    gState.filterableCollections = []

    const UPDATE_DATA_DELAY = 300000

    const overviewTitleTpl = new Ext.XTemplate(
      `Collections: {[values.collections]}`
    )

    const filterMenu = new SM.MetaPanel.CollectionsMenu({
      collections: gState.filterableCollections,
      initialCollectionIds,
      showHeader: true,
      showApply: true,
      listeners: {
        applied: function (collectionIds) {
          SM.Dispatcher.fireEvent('collectionfilter', collectionIds)
        }
      }
    })
    const overviewPanel = new SM.MetaPanel.OverviewPanel({
      cls: 'sm-round-panel sm-metrics-overview-panel',
      collapsible: true,
      collapseFirst: false,
      inventoryPanelTools: [],
      findingsPanelTools: [],
      tools: [
        {
          id: 'collection',
          text: 'Filter &#9660;',
          handler: (event, toolEl, panel, tc) => {
            filterMenu.showAt(event.xy)
          }
        }
      ],
      title: 'Initializing...',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      region: 'west',
      width: 430,
      minWidth: 430,
      split: true,
      reloadBtnHandler,
    })
    const aggStigPanel = new SM.MetaPanel.AggStigPanel({
      title: 'STIGs',
      iconCls: 'sm-stig-icon',
      layout: 'fit',
      border: false,
      reloadBtnHandler
    })
    const aggCollectionPanel = new SM.MetaPanel.AggCollectionPanel({
      title: 'Collections',
      iconCls: 'sm-collection-icon',
      layout: 'fit',
      border: false,
      reloadBtnHandler
    })

    setCurrentBaseParams(initialCollectionIds)

    const aggTabPanel = new Ext.TabPanel({
      activeTab: 0,
      border: false,
      deferredRender: false,
      firstShow: true,
      items: [
        aggCollectionPanel,
        aggStigPanel
      ],
      listeners: {
        tabchange: function (tp) {
          if (!tp.firstShow) updateData({ event: 'tabchange' })
          tp.firstShow = false
        }
      }
    })

    const centerPanel = new Ext.Panel({
      region: 'center',
      layout: 'fit',
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
      border: false,
      collapsible: false,
      items: aggTabPanel
    })

    const metaTab = new Ext.Panel({
      id: 'meta-panel',
      sm_unshown: true,
      border: false,
      region: 'center',
      iconCls: 'sm-report-icon',
      title: "Meta Dashboard",
      closable: true,
      layout: 'border',
      sm_treePath: treePath,
      updateTitle: function () {
        this.setTitle("Meta Dashboard")
      },
      items: [
        overviewPanel,
        centerPanel
      ],
      listeners: {
        beforehide: (panel) => {
          cancelTimers()
        },
        activate: (panel) => {
          updateData({ event: 'activate' })
          panel.sm_unshown = false
        }
      }
    })

    SM.Dispatcher.addListener('collectionfilter', onCollectionFilter)
    metaTab.on('beforedestroy', () => {
      SM.Dispatcher.removeListener('collectionfilter', onCollectionFilter)
      cancelTimers()
    })

    SM.AddPanelToMainTab(metaTab, 'permanent')

    // functions

    function setCurrentBaseParams(collectionIds) {
      const params = {}
      if (collectionIds.length) {
        params.collectionId = collectionIds
      }
      aggCollectionPanel?.updateBaseParams(params)
      aggStigPanel?.updateBaseParams(params)
      overviewPanel?.updateBaseParams(params)
      return params
    }

    async function updateFilterableCollections() {
      try {
        gState.filterableCollections = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections`,
          method: 'GET'
        })
        const filterableCollectionIds = gState.filterableCollections.map(collection => collection.collectionId)
        // remove from gState.collectionIds any missing collectionIds
        gState.collectionIds = gState.collectionIds.filter(collectionId => filterableCollectionIds.includes(collectionId))
        // reset base parameters
        setCurrentBaseParams(gState.collectionIds)
        filterMenu.refreshItems(gState.filterableCollections)

        return gState.filterableCollections
      }
      catch (e) {
        console.error(e)
        return []
      }
    }

    function updateOverviewTitle() {
      const overviewTitle = overviewTitleTpl.apply({
        collections: `${gState.collectionIds.length ? gState.collectionIds.length : gState.filterableCollections.length} of ${gState.filterableCollections.length}`
      })
      overviewPanel.setTitle(overviewTitle)
    }

    function reloadBtnHandler() { updateData({ event: 'reload' }) }

    // handle change to collection filters in NavTree
    async function onCollectionFilter(srcCollectionIds) {
      try {
        if (gState.filterableCollections.every(i => srcCollectionIds.includes(i.collectionId))) {
          gState.collectionIds = []
        }
        else {
          gState.collectionIds = srcCollectionIds
        }
        localStorage.setItem('metaCollectionIds', JSON.stringify(gState.collectionIds))
        gState.baseParams = setCurrentBaseParams(gState.collectionIds)
        await overviewPanel.updateData()
        updateOverviewTitle()
        const activePanel = aggTabPanel.getActiveTab()
        if (activePanel) {
          await activePanel.updateData()
        }
      }
      catch (e) {
        SM.Error.handleError(e)
      }
    }

    // handle periodic updates
    async function updateData({ event } = {}) {
      try {
        // event = activate || tabchange || reload || updateData || refreshViews
        const refreshViewsOnly = event === 'refreshviews'
        const loadMasksDisabled = event === 'tabchange' || event === 'updatedata' || event === 'refreshviews'

        clearTimeout(gState.refreshViewTimerId)
        const promises = []

        if (!refreshViewsOnly) {
          clearTimeout(gState.updateDataTimerId)
          gState.updateDataTimerId = gState.refreshViewTimerId = null

          promises.push(updateFilterableCollections())

          gState.updateDataTimerId = setTimeout(
            updateData,
            UPDATE_DATA_DELAY,
            { event: 'updatedata' }
          )
        }
        promises.push(overviewPanel.updateData({ refreshViewsOnly, loadMasksDisabled }))
        const activePanel = aggTabPanel.getActiveTab()
        if (activePanel) {
          promises.push(activePanel.updateData({ refreshViewsOnly, loadMasksDisabled: activePanel.items.items[0].initialized ? loadMasksDisabled : false }))
        }

        const [unused0, apiMetricsCollection, unused1] = await Promise.all(promises)
        updateOverviewTitle()

        const refreshViewsDelay = calcRefreshDelay(apiMetricsCollection.metrics.maxTouchTs)
        if (refreshViewsDelay < UPDATE_DATA_DELAY) {
          gState.refreshViewTimerId = setTimeout(
            updateData,
            refreshViewsDelay,
            { event: 'refreshviews' }
          )
        }
      }
      catch (e) {
        console.log(e)
      }
    }
    function cancelTimers() {
      clearTimeout(gState.refreshViewTimerId)
      clearTimeout(gState.updateDataTimerId)
      gState.refreshViewTimerId = gState.updateDataTimerId = null
    }

    function calcRefreshDelay(maxTouchTs) {
      // given maxTouchTs, calculate the interval to refresh the grids/toolbars
      const diffSecs = Math.ceil(Math.abs(new Date() - new Date(maxTouchTs)) / 1000)
      if (diffSecs < 3600) {
        // 30s when maxTouchTs is < 1h 
        return 30 * 1000
      }
      if (diffSecs < 86400) {
        // 1h when maxTouchTs is < 1d
        return 3600 * 1000
      }
      // 1d
      return 86400 * 1000
    }
  }
  catch (e) {
    SM.Error.handleError(e)
  }
}

SM.MetaPanel.CollectionsMenu = Ext.extend(Ext.menu.Menu, {
  initComponent: function () {
    const _this = this
    this.addEvents('applied')
    const initialItems = this.initialCollectionIds.map( id => ({collectionId: id, checked: true, text: id}))
    const config = {
      items: initialItems,
      listeners: {
        itemclick: this.onItemClick,
        hide: this.onMenuHide,
        show: this.onMenuShow
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },
  isExcluded: function (collection) {
    return collection.metadata['app.metaExcluded'] === '1'
  },
  onItemClick: function (item, e) {
    if (item.hideOnClick) { // only the Apply item
      this.isApplied = true
      this.fireEvent('applied', this.getCheckedCollectionIds())
    }
  },
  onMenuHide: function (menu) {
    if (menu.isApplied) {
      menu.isApplied = false
      return
    }
    // if selections were not applied, reset items to their checked state when the menu was shown
    if (menu.lastCheckedStatesObject) {
      for (const item of this.items.items) {
        if (item.xtype === 'menucheckitem') item.setChecked(!!menu.lastCheckedStatesObject[item.collectionId], true)
      }
    }
  },
  onMenuShow: function (menu) {
    menu.lastCheckedStatesObject = menu.getCheckedStatesObject()
  },
  getCheckedStatesObject: function () {
    return this.items.items.reduce( (agg, item) => {
      if (item.collectionId) agg[item.collectionId] = item.checked
      return agg
    }, {} )
  },
  getCheckedCollectionIds: function () {
    const checked = this.items.items.reduce(function (ids, item) {
      if (item.checked) {
        ids.push(item.collectionId)
      }
      return ids
    }, [])
    return checked
  },
  getCheckedCollections: function () {
    const checked = this.items.items.reduce(function (checkedItems, item) {
      if (item.checked) {
        checkedItems.push(item)
      }
      return checkedItems
    }, [])
    return checked
  },
  getCollectionItemConfig: function (collection, checked = false) {
    return {
      xtype: 'menucheckitem',
      hideOnClick: false,
      text: SM.MetaPanel.CollectionTpl.apply(collection),
      collectionId: collection?.collectionId ?? null,
      collection,
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
      cls: 'sm-menuitem-filter-collection'
    }
  },
  getActionItemConfig: function (text = '<b>Apply</b>') {
    return {
      xtype: 'menuitem',
      text,
      icon: 'img/change.svg'
    }
  },
  setCollectionsChecked: function (collectionIds, checked) {
    for (const collectionId of collectionIds) {
      this.find('collectionId', collectionId)[0]?.setChecked(checked, true) //suppressEvent = true
    }
  },
  updateCollection: function (collection) {
    const item = this.find('collectionId', collection.collectionId)[0]
    if (item) {
      if (this.isExcluded(collection)) {
        this.removeCollection(collection)
      }
      else {
        item.collection = collection
        item.setText(SM.MetaPanel.CollectionTpl.apply(collection))
        this.items.sort('ASC', this.sorter)
        this.rerender()
      }
    }
  },
  addCollection: function (collection) {
    if (this.isExcluded(collection)) return
    this.addItem(this.getCollectionItemConfig(collection))
    this.items.sort('ASC', this.sorter)
    this.rerender()
  },
  removeCollection: function (collectionId) {
    const item = this.find('collectionId', collectionId)[0]
    if (item) {
      this.remove(item)
    }
  },
  sorter: function (a, b) {
    return a.name.localeCompare(b.name)
  },
  refreshItems: function (collections) {
    const collectionIdSet = new Set(this.getCheckedCollectionIds())
    this.removeAll()
    if (this.showHeader) {
      this.addItem(this.getTextItemConfig())
    }
    collections.sort(this.sorter)
    for (const collection of collections) {
      if (this.isExcluded(collection)) continue
      const checked = collectionIdSet.has(collection.collectionId)
      this.addItem(this.getCollectionItemConfig(collection, checked))
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

SM.MetaPanel.SpriteHtml = `<span class="sm-collection-sprite {extraCls}"
    ext:qtip="{[SM.he(SM.he(values.description))]}">
    {[SM.he(values.name)]}
    </span>`

SM.MetaPanel.CollectionTpl = new Ext.XTemplate(
  SM.MetaPanel.SpriteHtml
)

