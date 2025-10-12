Ext.ns('SM.Job')

SM.Job.JobsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const runNowFn = this.runNowFn || async function () { }

    const fields = ['jobId', 'name', 'description', 'created', 'updated', 'tasks', 'event', 'runCount', 'lastRun',
      {
        name: 'createdBy',
        convert: function (v, record) {
          return record.createdBy?.username ?? ''
        }
      },
      {
        name: 'updatedBy',
        convert: function (v, record) {
          return record.updatedBy?.username ?? ''
        }
      }
    ]
    const columns = [
      {
        header: '<span class="sm-job-icon sm-icon-column">Name</span>', dataIndex: 'name', width: 150, sortable: true, renderer: function (v, m, r) {
          return `<span class="sm-job-sprite sm-job-run-state-${r.data.lastRun?.state ?? 'missing'}">${v}</span>`
        }
      },
      {
        header: '<span class="sm-user-icon sm-icon-column">Created By</span>', dataIndex: 'createdBy', width: 100, sortable: true, renderer: function (v) {
          return v || '<i>system</i>'
        }
      },
      { header: '<span class="sm-job-icon sm-icon-column">Description</span>', dataIndex: 'description', hidden: true, width: 250, sortable: false },
      {
        header: '<span class="sm-job-task-icon sm-icon-column">Tasks</span>', dataIndex: 'tasks', width: 200, sortable: false, renderer: function (v) {
          if (v?.length) {
            return v.map(t => t.name).join('<br>')
          }
          return ''
        }
      },
      {
        header: '<span class="sm-job-event-icon sm-icon-column">Schedule</span>', dataIndex: 'event', width: 200, sortable: false, renderer: function (v) {
          let html = ''
          if (v) {
            if (v.type === 'recurring') {
              html = `Every ${v.interval.value} ${v.interval.field}(s)<br>Starting ${Ext.util.Format.date(v.starts, 'Y-m-d H:i:s T')}${v.enabled ? '' : '<br>DISABLED'} `
            }
            else if (v.type === 'once') {
              html = `Once at ${Ext.util.Format.date(v.starts, 'Y-m-d H:i:s T')}`
            }
          }
          return `<span class="${v?.enabled ? '' : 'sm-job-event-disabled'}">${html}</span>`
        }
      },
      { header: '<span class="sm-job-run-icon sm-icon-column">Runs</span>', dataIndex: 'runCount', width: 150, sortable: true },
      {
        header: '<span class="sm-job-run-icon sm-icon-column">Last Run</span>', dataIndex: 'lastRun', width: 150, sortable: true, renderer: function (v) {
          return v ? `<span class="sm-job-sprite sm-job-run-state-${v.state}">${v.state}</span><br>${Ext.util.Format.date(v.created || v.updated, 'Y-m-d H:i:s T')}<br>` : '-';
        },
      },
      { header: '<span class="sm-job-icon sm-icon-column">Created</span>', dataIndex: 'created', hidden: true, width: 100, sortable: true },
      { header: '<span class="sm-job-icon sm-icon-column">Updated</span>', dataIndex: 'updated', hidden: true, width: 150, sortable: true },
      { header: '<span class="sm-user-icon sm-icon-column">Updated By</span>', dataIndex: 'updatedBy', hidden: true, width: 150, sortable: true },
    ]

    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/jobs`,
        method: 'GET'
      }),
      baseParams: {
        elevate: curUser.privileges.admin
      },
      root: '',
      fields,
      idProperty: 'jobId',
      sortInfo: {
        field: 'name',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        load: function () {
          // _this.selModel.selectRow(0)
        }
      }
    })
    const totalTextCmp = new SM.RowCountTextItem({ store })

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
    })

    sm.on('rowselect', function (sm, rowIndex, record) {
      _this.modifyBtn.setDisabled(false)
      _this.removeBtn.setDisabled(!record.data.createdBy)
      _this.runNowBtn.setDisabled(false)
    })

    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      emptyText: 'No jobs found',
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        },
        // These listeners keep the grid in the same scroll position after the store is reloaded
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
      deferEmptyText: false,
      getRowClass: function (record) {
        if (record.data.lastRun?.state == 'failed') {
          return 'sm-grid3-row-error';
        }
      }
    })

    const tbar = [
      {
        iconCls: 'icon-add',
        text: 'Create',
        handler: function () {
          Ext.getBody().mask('');
          SM.Job.showJobProps(0);
        }
      },
      '-',
      {
        ref: '../removeBtn',
        iconCls: 'icon-del',
        disabled: true,
        text: 'Remove',
        handler: function () {
          let job = _this.getSelectionModel().getSelected();
          let buttons = { yes: 'Remove', no: 'Cancel' }
          let confirmStr = `Remove <b>${job.data.name}</b>?<br><br>This action will remove the Job's scheduled events and run output.`;

          Ext.Msg.show({
            title: 'Confirm remove action',
            icon: Ext.Msg.WARNING,
            msg: confirmStr,
            buttons: buttons,
            fn: async function (btn, text) {
              try {
                if (btn == 'yes') {
                  await Ext.Ajax.requestPromise({
                    responseType: 'json',
                    url: `${STIGMAN.Env.apiBase}/jobs/${job.data.jobId}?elevate=${curUser.privileges.admin}`,
                    method: 'DELETE',
                  })
                  store.reload()
                }
              }
              catch (e) {
                SM.Error.handleError(e)
              }
            }
          })
        },
      },
      '-',
      {
        ref: '../modifyBtn',
        iconCls: 'icon-edit',
        text: 'Modify',
        disabled: true,
        handler: function () {
          const r = _this.getSelectionModel().getSelected();
          Ext.getBody().mask('Getting properties...');
          SM.Job.showJobProps(r.get('jobId'));
        }
      },
      '-',
      {
        ref: '../runNowBtn',
        iconCls: 'sm-job-run-icon',
        text: 'Run now...',
        disabled: true,
        handler: runNowFn
      }
    ]

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
          gridBasename: 'Job-Info',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this
        },
        {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const listeners = {
      rowdblclick: function (grid, rowIndex) {
        const r = _this.getSelectionModel().getSelected();
        Ext.getBody().mask('Getting properties...');
        SM.Job.showJobProps(r.get('jobId'));
      }
    }

    const config = {
      store,
      columns,
      sm,
      view,
      tbar,
      bbar,
      listeners,
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.RunsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    
    function dateRenderWithToolbar(v, md) {
      return `
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-dynamic-width">
          <div class="sm-info">${Ext.util.Format.date(v, 'Y-m-d H:i:s.u T')}</div>
        </div>
        <div class="sm-static-width"><img class="sm-grid-cell-toolbar-edit" ext:qtip="Delete run" src="img/trash.svg" width="14" height="14"></div>
      </div>`
    }

    function rowmousedown(grid, rowIndex, e) {
      if (e.target.className === "sm-grid-cell-toolbar-edit") {
        const r = grid.getStore().getAt(rowIndex)
        console.log('delete run', r.data.runId)
        _this.fireEvent('deleterun', r.data.runId)
        return false
      }
      return true
    }

    const fields = [
      'runId',
      'state',
      'created',
      'updated',
      {
        name: 'duration',
        convert: function (v, record) {
          if (record.state !== 'running') {
            return new Date(record.updated) - new Date(record.created)
          }
          return null
        }
      }
    ]
    const columns = [
      { header: 'Started', dataIndex: 'created', width: 200, sortable: true, renderer: dateRenderWithToolbar },
      {
        header: 'State', dataIndex: 'state', width: 100, sortable: true, renderer: function (v) {
          return `<span class="sm-job-sprite sm-job-run-state-${v}">${v}</span>`
        }
      },
      { header: 'Duration', dataIndex: 'duration', width: 70, sortable: true }
    ]

    const store = new Ext.data.JsonStore({
      root: '',
      fields,
      idProperty: 'runId',
      sortInfo: {
        field: 'created',
        direction: 'DESC'
      },
      listeners: {
        load: function () {
          _this.selModel.selectRow(0)
        }
      }
    })
    const totalTextCmp = new SM.RowCountTextItem({ store })

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      emptyText: 'No runs found',
      cellSelectorDepth: 5, // supports the cell toolbar
      listeners: {
        // filterschanged: function (view) {
        //   store.filter(view.getFilterFns())
        // },
        // // These listeners keep the grid in the same scroll position after the store is reloaded
        // beforerefresh: function (v) {
        //   v.scrollTop = v.scroller.dom.scrollTop;
        //   v.scrollHeight = v.scroller.dom.scrollHeight;
        // },
        // refresh: function (v) {
        //   setTimeout(function () {
        //     v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
        //   }, 100);
        // }
      },
      deferEmptyText: false
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'runs',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this
        },
        {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const listeners = {
      rowmousedown,
    }

    const config = {
      store,
      columns,
      sm,
      view,
      bbar,
      listeners,
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }

})

SM.Job.RunOutputGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = ['seq', 'type', 'message', 'task', 'ts']
    const columns = [
      { header: 'Seq', dataIndex: 'seq', width: 50, sortable: true },
      { header: 'Timestamp', xtype: 'datecolumn', format: 'Y-m-d H:i:s.u T', dataIndex: 'ts', width: 150, sortable: true },
      { header: 'Task', dataIndex: 'task', width: 120, sortable: true },
      {
        header: 'Type', dataIndex: 'type', width: 50, sortable: true, renderer: function (v) {
          return v === 'error' ? '<span style="color: red;">' + v + '</span>' : v;
        }
      },
      {
        header: 'Message', dataIndex: 'message', width: 300, sortable: true, renderer: function (v, m, r) {
          m.attr = 'style="white-space:normal;"'
          return v ? `<div exportValue="${v}">${Ext.util.Format.htmlEncode(v)}</div>` : '';
        }
      },
    ]
    const store = new Ext.data.JsonStore({
      root: '',
      fields,
      idProperty: 'seq',
      sortInfo: {
        field: 'seq',
        direction: 'DESC'
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({ store })
    const view = new SM.ColumnFilters.GridView({
      forceFit: true,
      emptyText: 'No output found',
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'Job-Run-Output',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this
        },
        {
          xtype: 'tbfill'
        }, {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const config = {
      store,
      columns,
      view,
      bbar,
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.RunsPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const runsGrid = new SM.Job.RunsGrid({
      region: 'west',
      title: 'Recent Runs',
      border: false,
      width: '25%',
      split: true,
      minWidth: 200,
      maxWidth: 600,
      iconCls: 'sm-job-run-icon',
      margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      cls: 'sm-round-panel',
      loadMask: true,
      listeners: {
        deleterun: (runId) => this.fireEvent('deleterun', runId)
      }
    })

    const outputGrid = new SM.Job.RunOutputGrid({
      region: 'center',
      title: 'Runtime Output',
      border: false,
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
      loadMask: true,
      iconCls: 'sm-run-output-icon',
      cls: 'sm-round-panel',
    })

    runsGrid.getSelectionModel().on('rowselect', async function (sm, rowIndex, record) {
      const response = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/jobs/runs/${record.data.runId}/output`,
        params: { elevate: curUser.privileges.admin },
        method: 'GET',
      })
      outputGrid.getStore().loadData(response)
    })

    const config = {
      layout: 'border',
      bodyStyle: 'background-color:transparent;',
      border: false,
      items: [runsGrid, outputGrid],
      runsGrid,
      outputGrid,
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.SchedulePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const intervalValue = new Ext.form.NumberField({
      fieldLabel: 'Value',
      name: 'intervalValue',
      value: 1,
      minValue: 1,
      maxValue: 365,
      width: 30,
      allowBlank: false,
      allowDecimals: false,
      allowNegative: false,
      listeners: {
        change: function (nf, newVal, oldVal) {
          if (newVal < 1) nf.setValue(1)
          if (newVal > 365) nf.setValue(365)
        }
      }
    })

    const intervalField = new Ext.form.ComboBox({
      fieldLabel: 'Field',
      name: 'intervalField',
      store: new Ext.data.ArrayStore({
        fields: ['value', 'display'],
        data: [
          ['minute', 'Minute(s)'],
          ['hour', 'Hour(s)'],
          ['day', 'Day(s)'],
          ['week', 'Week(s)'],
          ['month', 'Month(s)'],
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      selectOnFocus: true,
      forceSelection: true,
      value: 'day',
      width: 75,
      allowBlank: false,
    })

    const intervalComposite = new Ext.form.CompositeField({
      fieldLabel: 'Repeat Every',
      labelWidth: 120,
      items: [
        intervalValue,
        intervalField
      ]
    })

    const startTime = new Ext.form.TimeField({
      fieldLabel: 'Start Time',
      name: 'dailyTime',
      value: '00:00',
      format: 'H:i',
      width: 110,
    })

    const startDate = new Ext.form.DateField({
      fieldLabel: 'Start Date',
      name: 'dailyDate',
      value: new Date(),
      format: 'D Y-m-d',
      width: 110,
      editable: false,
      listeners: {
        select: function (df, date) {
        }
      }
    })

    const frequencyCombo = new Ext.form.ComboBox({
      fieldLabel: 'Frequency',
      name: 'frequency',
      store: new Ext.data.ArrayStore({
        fields: ['value', 'display'],
        data: [
          ['none', 'None'],
          ['recurring', 'Recurring'],
          ['once', 'One Time'],
        ]
      }),
      valueField: 'value',
      displayField: 'display',
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      selectOnFocus: true,
      forceSelection: true,
      value: 'recurring',
      width: 110,
      listeners: {
        select: function (cb, record, index) {
          if (cb.getValue() === 'recurring') {
            enabledCheckbox.show()
            intervalComposite.show()
            startDate.show()
            startTime.show()
          }
          else if (cb.getValue() === 'once') {
            enabledCheckbox.hide()
            intervalComposite.hide()
            startDate.show()
            startTime.show()
          }
          else if (cb.getValue() === 'none') {
            enabledCheckbox.hide()
            intervalComposite.hide()
            startDate.hide()
            startTime.hide()
          }
        }
      }
    })

    const enabledCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Enabled',
      name: 'enabled',
      checked: true,
    })

    const initPanel = function (apiJob) {
      const event = apiJob?.event
      if (!event) {
        frequencyCombo.setValue('none')
        intervalComposite.hide()
        enabledCheckbox.hide()
        startDate.hide()
        startTime.hide()
        return
      }
      if (event.type === 'once') {
        frequencyCombo.setValue('once')
        intervalComposite.hide()
        enabledCheckbox.hide()
        startDate.setValue(new Date(event.starts))
        startTime.setValue(new Date(event.starts))
        return
      }
      if (event.type === 'recurring') {
        frequencyCombo.setValue('recurring')
        intervalValue.setValue(event.interval.value)
        intervalField.setValue(event.interval.field)
        enabledCheckbox.setValue(event.enabled)
        startDate.setValue(new Date(event.starts))
        startTime.setValue(new Date(event.starts))
      }
    }

    const getValue = function () {
      if (frequencyCombo.getValue() === 'none') {
        return null
      }
      const dateValue = startDate.getValue()
      const [hour, minute] = startTime.getValue().split(':')
      const combinedValue = new Date(
        dateValue.getFullYear(),
        dateValue.getMonth(),
        dateValue.getDate(),
        hour,
        minute,
        0
      )
      const event = {
        type: frequencyCombo.getValue(),
        starts: combinedValue.toISOString()
      }
      if (event.type === 'recurring') {
        event.interval = {
          value: intervalValue.getValue().toString(),
          field: intervalField.getValue(),
        }
        event.enabled = enabledCheckbox.getValue()
      }
      return event
    }

    const config = {
      // layout: 'form',
      items: [
        {
          layout: 'column',
          border: false,
          items: [
            {
              columnWidth: 0.5,
              layout: 'form',
              border: false,
              labelWidth: 80,
              items: [frequencyCombo, intervalComposite, enabledCheckbox]
            },
            {
              columnWidth: 0.5,
              layout: 'form',
              border: false,
              labelWidth: 80,
              items: [startDate, startTime]
            }
          ]
        }
      ],
      initPanel,
      getValue,
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.TaskSelectingGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const isSortable = this.isSortable || false
    const fields = [
      'taskId',
      'name',
      'description',
    ]
    const sm = this.isSystemJob ? new Ext.grid.RowSelectionModel() : new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
      listeners: {
        selectionchange: function (sm) {
          SM.SetCheckboxSelModelHeaderState(sm)
        }
      }
    })
    const columns = [
      {
        header: "Task",
        width: 150,
        dataIndex: 'name',
        sortable: isSortable === true,
        renderer: function (v, m, r) {
          m.attr = 'style="white-space:normal;"'
          return `<div exportValue="${r.data.name ?? ''}:${r.data.description ?? ''}"><span style="font-weight:700;">${r.data.name ?? ''}</span><br>
          <div class="sm-task-description">${r.data.description ?? ''}</div></div>`
        }
      },
    ]
    if (this.isSystemJob !== true) {
      columns.unshift(sm)
    }
    const store = new Ext.data.JsonStore({
      fields,
      idProperty: 'taskId',
    })
    if (isSortable === true) {
      store.sortInfo = {
        field: 'name',
        direction: 'ASC'
      }
    }
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'task',
      iconCls: 'sm-task-icon'
    })
    const initPanel = function (apiJob) {
      store.loadData(apiJob.tasks || [])
    }
    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddText: '{0} selected Task{1}',
      bodyCssClass: 'sm-grid3-draggable',
      ddGroup: `SM.Job.TaskSelectingGrid-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No Tasks to display',
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
            gridBasename: 'Tasks (grid)',
            storeBasename: 'Tasks (store)',
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
      }),
      initPanel
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.Job.TaskSelectingPanel = Ext.extend(Ext.Panel, {
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
    const availableGrid = new SM.Job.TaskSelectingGrid({
      title: 'Available Tasks',
      isSortable: true,
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
    const selectionsGrid = new SM.Job.TaskSelectingGrid({
      title: 'Job Tasks (run in order shown)',
      isSortable: false,
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
          const gridDropTarget2 = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: selectionsGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
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

    const upBtn = new Ext.Button({
      iconCls: 'sm-move-up-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const sm = selectionsGrid.getSelectionModel()
        if (sm.hasSelection()) {
          const record = sm.getSelected()
          const index = selectionsGrid.store.indexOf(record)
          if (index > 0) {
            selectionsGrid.store.remove(record)
            selectionsGrid.store.insert(index - 1, record)
            sm.selectRow(index - 1)
            fireSelectedChanged()
          }
        }
      }
    })
    const downBtn = new Ext.Button({
      iconCls: 'sm-move-down-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const sm = selectionsGrid.getSelectionModel()
        if (sm.hasSelection()) {
          const record = sm.getSelected()
          const index = selectionsGrid.store.indexOf(record)
          if (index < selectionsGrid.store.getCount() - 1) {
            selectionsGrid.store.remove(record)
            selectionsGrid.store.insert(index + 1, record)
            sm.selectRow(index + 1)
            fireSelectedChanged()
          }
        }
      }
    })
    selectionsGrid.getSelectionModel().on('selectionchange', function (sm) {
      const hasSelection = sm.hasSelection()
      upBtn.setDisabled(!hasSelection)
      downBtn.setDisabled(!hasSelection)
    })

    // const orderButtonPanel = new Ext.Panel({
    //   bodyStyle: 'background-color:transparent;border:none',
    //   width: 60,
    //   layout: {
    //     type: 'vbox',
    //     pack: 'center',
    //     align: 'center',
    //     padding: "10 10 10 10"
    //   },
    //   items: [
    //     upBtn,
    //     downBtn,
    //     { xtype: 'panel', border: false, html: '<i>to reorder</i>' }
    //   ]
    // })
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
        upBtn,
        downBtn,
        addBtn,
        removeBtn,
        { xtype: 'panel', border: false, html: '<i>or drag</i>' },
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

    async function initPanel(apiJob) {
      const apiAvailableTasks = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/jobs/tasks`,
        method: 'GET',
        params: { elevate: curUser.privileges.admin }
      })

      const availableTaskMap = new Map(apiAvailableTasks.map(task => [task.taskId, task]));
      const assignedTasks = (apiJob?.tasks ?? []).map(task => ({
        ...task,
        description: availableTaskMap.get(task.taskId)?.description ?? ''
      }));
      const assignedTaskIds = new Set(assignedTasks.map(task => task.taskId));
      const availableTasks = apiAvailableTasks.filter(task => !assignedTaskIds.has(task.taskId));
      availableGrid.store.loadData(availableTasks)
      selectionsGrid.store.loadData(assignedTasks)
    }

    function fireSelectedChanged() {
      _this.fireEvent('selectedchanged', selectionsGrid.store.getRange().map(r => r.data.taskId))
    }

    function changeSelected(srcGrid, records, dstGrid) {
      srcGrid.store.suspendEvents()
      dstGrid.store.suspendEvents()
      srcGrid.store.remove(records)
      dstGrid.store.add(records)
      const sortState = dstGrid.store.getSortState();
      if (sortState) {
        dstGrid.store.sort(sortState.field, sortState.direction);
      }
      dstGrid.getSelectionModel().selectRecords(records)
      srcGrid.store.resumeEvents()
      dstGrid.store.resumeEvents()

      srcGrid.store.fireEvent('datachanged', srcGrid.store)
      dstGrid.store.fireEvent('datachanged', dstGrid.store)
      srcGrid.store.fireEvent('update', srcGrid.store)
      dstGrid.store.fireEvent('update', dstGrid.store)
      dstGrid.store.filter(dstGrid.getView().getFilterFns())
      dstGrid.getView().focusRow(dstGrid.store.indexOfId(records[0].data.taskId))

      fireSelectedChanged()
    }

    function getValue() {
      const records = selectionsGrid.store.snapshot?.items ?? selectionsGrid.store.getRange()
      return records.map(record => record.data.taskId)
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
      isValid: () => selectionsGrid.store.getRange().length > 0,
      getName: () => this.name,
      validate: () => true
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.PropertiesFormPanel = Ext.extend(Ext.FormPanel, {
  initComponent: function () {
    const isSystemJob = this.isSystemJob || false
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      anchor: '100%',
      emptyText: 'Enter a job name...',
      allowBlank: false,
      name: 'name',
      disabled: isSystemJob,
    })

    const descriptionField = new Ext.form.TextField({
      fieldLabel: 'Description',
      anchor: '100%',
      emptyText: 'Enter a job description...',
      allowBlank: true,
      name: 'description',
      disabled: isSystemJob,
    })

    const jobFieldset = new Ext.form.FieldSet({
      title: '<b>Job information</b>',
      iconCls: 'sm-job-icon',
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
              items: [nameField]
            },
            {
              columnWidth: .6,
              layout: 'form',
              border: false,
              items: [descriptionField]
            }
          ]
        },
      ]
    })

    let taskPanel = null
    if (isSystemJob) {
      taskPanel = new SM.Job.TaskSelectingGrid({
        title: 'Job Tasks (run in order shown)',
        isSortable: false,
        headerCssClass: 'sm-selections-panel-header',
        border: false,
        anchor: '100%',
        height: 300,
        isSystemJob: true,
      })
    } else {
      taskPanel = new SM.Job.TaskSelectingPanel({
        border: false,
        anchor: '100%',
        height: 300,
      })
    }

    const taskFieldset = new Ext.form.FieldSet({
      title: '<b>Tasks</b>',
      iconCls: 'sm-job-task-icon',
      layout: 'anchor',
      autoHeight: true,
      items: [taskPanel]
    })

    const schedulePanel = new SM.Job.SchedulePanel({
      border: false,
      anchor: '100%',
    })

    const scheduleFieldset = new Ext.form.FieldSet({
      title: '<b>Schedule</b>',
      layout: 'anchor',
      iconCls: 'sm-job-event-icon',
      autoHeight: true,
      items: [
        schedulePanel,
      ]
    })

    const initPanel = async function (apiJob) {
      taskPanel.initPanel(apiJob)
      schedulePanel.initPanel(apiJob)
    }

    const getValue = function () {
      const values = {
        event: schedulePanel.getValue(),
      }
      if (!isSystemJob) {
        values.name = nameField.getValue()
        values.description = descriptionField.getValue()
        values.tasks = taskPanel.getValue()
      }
      return values
    }

    const config = {
      baseCls: 'x-plain',
      region: 'south',
      labelWidth: 70,
      monitorValid: true,
      trackResetOnLoad: true,
      items: [
        jobFieldset,
        taskFieldset,
        scheduleFieldset,
        // tabs 
      ],
      initPanel,
      getValue,
      buttons: [{
        text: this.btnText || 'Save',
        formBind: true,
        handler: this.btnHandler || Ext.emptyFn
      }]

    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Job.showJobProps = async function (jobId) {
  try {
    const btnHandler = async function () {
      Ext.getBody().mask('Saving job...')
      try {
        const values = jobPropsFormPanel.getValue()
        await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/jobs${jobId ? '/' + jobId : ''}`,
          method: jobId ? 'PATCH' : 'POST',
          jsonData: values,
          params: { elevate: curUser.privileges.admin }
        })
        SM.Dispatcher.fireEvent('jobchanged')
        appwindow.close()
      }
      catch (e) {
        SM.Error.handleError(e)
      }
      finally {
        Ext.getBody().unmask()
      }
    }

    const jobPropsFormPanel = new SM.Job.PropertiesFormPanel({
      isSystemJob: jobId && jobId < 100,
      padding: '10px 15px 10px 15px',
      btnHandler
    })

    const appwindow = new Ext.Window({
      cls: 'sm-dialog-window sm-round-panel',
      title: jobId ? 'Job Properties, ID ' + jobId : 'Create new Job',
      modal: true,
      resizable: false,
      draggable: false,
      hidden: true,
      width: 640,
      height: 640,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: jobPropsFormPanel
    });

    appwindow.render(Ext.getBody())

    if (jobId) {
      let apiJob = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/jobs/${jobId}`,
        params: { elevate: curUser.privileges.admin },
        method: 'GET'
      })
      jobPropsFormPanel.getForm().setValues(apiJob)
      jobPropsFormPanel.initPanel(apiJob)
    }
    else {
      jobPropsFormPanel.initPanel(null)
    }

    Ext.getBody().unmask();
    appwindow.show(Ext.getBody());
  }
  catch (e) {
    Ext.getBody().unmask()
    SM.Error.handleError(e)
  }
}

SM.Job.showJobAdminTab = function ({ treePath }) {
  const tab = Ext.getCmp('main-tab-panel').getItem('job-admin-tab')
  if (tab) {
    tab.show()
    return
  }

  const jobsGrid = new SM.Job.JobsGrid({
    region: 'center',
    border: false,
    loadMask: true,
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.edge, left: SM.Margin.edge },
    cls: 'sm-round-panel',
    runNowFn,
  })

  const runsPanel = new SM.Job.RunsPanel({
    region: 'south',
    margins: { top: SM.Margin.edge, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    border: false,
    iconCls: 'sm-job-run-icon',
    cls: 'sm-round-panel',
    height: '66%',
    split: true,
    minHeight: 100,
    loadMask: true,
  })

  jobsGrid.getSelectionModel().on('rowselect', async function (sm, rowIndex, record) {
    loadRuns(record.data.jobId)
  })
  jobsGrid.getStore().on('load', function () {
    const selection = jobsGrid.getSelectionModel().getSelected()
    if (selection) {
      loadRuns(selection.data.jobId)
    }
  })

  runsPanel.on('deleterun', async function (runId) {
    const response = await Ext.Ajax.requestPromise({
      responseType: 'json',
      url: `${STIGMAN.Env.apiBase}/jobs/runs/${runId}?elevate=true`,
      method: 'DELETE',
    })
    const selected = runsPanel.runsGrid.getSelectionModel().getSelected()
    const record = runsPanel.runsGrid.getStore().getById(runId)
    runsPanel.runsGrid.getStore().remove(record)
    if (selected?.data.runId === runId) {
      runsPanel.outputGrid.getStore().removeAll()
    }
  })

  SM.Dispatcher.addListener('jobchanged', onJobChanged)

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'job-admin-tab',
    sm_treePath: treePath,
    iconCls: 'sm-job-icon',
    title: 'Service Jobs',
    closable: true,
    layout: 'border',
    border: false,
    items: [jobsGrid, runsPanel],
    listeners: {
      destroy: function () {
        SM.Dispatcher.removeListener('jobchanged', onJobChanged)
      }
    }
  })
  thisTab.show()
  jobsGrid.getStore().load()

  async function runNowFn() {
    const job = jobsGrid.getSelectionModel().getSelected();
    if (!job) return
    let buttons = { yes: 'Run Now', no: 'Cancel' }
    let confirmStr = `Run <b>${job.data.name}</b> now?`

    Ext.Msg.show({
      title: 'Confirm run action',
      icon: Ext.Msg.QUESTION,
      msg: confirmStr,
      buttons: buttons,
      fn: async function (btn, text) {
        try {
          if (btn == 'yes') {
            Ext.getBody().mask('Starting job...')
            const apiJobRun = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/jobs/${job.data.jobId}/runs?elevate=${curUser.privileges.admin}`,
              method: 'POST',
            })
            jobsGrid.getStore().reload()
            jobsGrid.getSelectionModel().selectRecords([job])
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
  }

  async function loadRuns(jobId) {
    const response = await Ext.Ajax.requestPromise({
      responseType: 'json',
      url: `${STIGMAN.Env.apiBase}/jobs/${jobId}/runs`,
      params: { elevate: curUser.privileges.admin },
      method: 'GET',
    })
    runsPanel.outputGrid.getStore().removeAll()
    runsPanel.runsGrid.getStore().loadData(response)
  }

  function onJobChanged() {
    jobsGrid.getStore().reload()
  }

}