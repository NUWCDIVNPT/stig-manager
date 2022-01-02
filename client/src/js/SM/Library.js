Ext.ns("SM.Library")

SM.Library.ChecklistGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    this.benchmarkId = this.benchmarkId || 'RHEL_8_STIG'
    this.revisionStr = this.revisionStr || 'latest'
    const title = this.stigTitle
    const fields = [
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
        mapping: 'checks[0]?.content'
      },
      {
        name: 'fix',
        mapping: 'fixes[0]?.text'
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
    const totalTextItem = new SM.RowCountTextItem({store:store})
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
        header: "Group",
        width: 75,
        dataIndex: 'groupId',
        sortable: true,
        align: 'left',
        filter: {type:'string'}
      },
      {
        header: "Group Title",
        width: 200,
        dataIndex: 'groupTitle',
        renderer: columnWrap,
        sortable: true,
        // hidden: true,
        filter: {type:'string'}
      },
      {
        header: "Rule Id",
        width: 150,
        dataIndex: 'ruleId',
        sortable: true,
        align: 'left',
        // hidden: true,
        filter: {type:'string'}
      },
      {
        id: ruleTitleColumnId,
        header: "Rule Title",
        width: 300,
        dataIndex: 'title',
        renderer: columnWrap,
        sortable: true,
        filter: {type:'string'}
      },
      {
        header: "Check",
        width: 300,
        dataIndex: 'check',
        renderer: columnWrap,
        sortable: true,
        filter: {type:'string'}
      },
      {
        header: "Fix",
        width: 300,
        dataIndex: 'fix',
        renderer: columnWrap,
        sortable: true,
        filter: {type:'string'}
      },
      {
        header: "Discussion",
        width: 300,
        dataIndex: 'discussion',
        renderer: columnWrap,
        sortable: true,
        filter: {type:'string'}
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
        { name: 'display', convert: (v, r) => `Version ${r.version} Release ${r.release} (${r.benchmarkDate})`}
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
  
    async function getStig( benchmarkId, revisionStr) {
      let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules?projection=checks&projection=fixes&projection=detail`,
        method: 'GET',
        params: {
          projection: ['checks','fixes','detail']
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
        store.loadData( apiStig )
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
      loadMask: true
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
    // const ruleContentPanel = new SM.Library.RuleContentPanel({
    //   cls: 'sm-round-panel',
    //   margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
    //   border: false,
    //   region: 'east',
    //   split: true,
    //   collapsible: true,
    //   width: 400
    // })
    this.load = async function () {
      await checklistGrid.loadStig(this.benchmarkId)
      await checklistGrid.loadRevisions(this.benchmarkId)
    }
    async function onRowSelect (cm, index, record) {
      try {
        const contentReq = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/stigs/rules/${record.data.ruleId}`,
          method: 'GET',
          params: {
            projection: ['detail','ccis','checks','fixes']
          }
        })
        let content = JSON.parse(contentReq.response.responseText)
        // ruleContentPanel.update(content)
        // ruleContentPanel.setTitle('Rule for Group ' + record.data.groupId)
      }
      catch (e) {
        console.log(e)
        alert(e.message)
      }  
    }
    checklistGrid.getSelectionModel().on('rowselect', onRowSelect)
    const config = {
			iconCls: 'sm-stig-icon',
			closable: true,
			layout: 'border',
			layoutConfig: {
				targetCls: 'sm-border-layout-ct'
			},
      items: [ 
        checklistGrid,
        // ruleContentPanel
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Library.RuleContentPanel.superclass.initComponent.call(this)
  }
})