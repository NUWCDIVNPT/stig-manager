Ext.ns('SM.AssetSelection')

SM.AssetSelection.GridPanel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    const fields = Ext.data.Record.create([
      { name: 'assetId', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'ip', type: 'string' },
      { name: 'fqdn', type: 'string' },
      { name: 'mac', type: 'string' },
      'labelIds',
      { name: 'benchmarkIds', convert: (v, r) => r.stigs.map(stig => stig.benchmarkId) },
      { name: 'collection' }
    ])
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
        header: "Asset",
        width: 150,
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
          collectionId: this.collectionId,
          comparer: function (a, b) {
            return SM.ColumnFilters.CompareFns.labelIds(a, b, _this.collectionId)
            },          
          renderer: SM.ColumnFilters.Renderers.labels
        },
        renderer: function (value) {
          const labels = []
          for (const labelId of value) {
            const label = SM.Cache.getCollectionLabel(_this.collectionId, labelId)
            if (label) labels.push(label)
          }
          labels.sort((a, b) => a.name.localeCompare(b.name))
          return SM.Collection.LabelArrayTpl.apply(labels)
        }
      },
      {
        header: "STIGs",
        width: 50,
        align: 'center',
        dataIndex: 'benchmarkIds',
        sortable: true,
        hidden: false,
        filter: { type: 'values' },
        renderer: function (value, metadata, record) {
          let qtipWidth = 230
          if (value.length > 0) {
            let longest = Math.max(...(value.map(el => el.length)))
            qtipWidth = longest * 8
          }
          metadata.attr = ` ext:qwidth=${qtipWidth} ext:qtip="<b>${record.data.name} STIGs</b><br>${value.join('<br>')}"`
          return `<i>${value.length}</i>`
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

    ]
    const store = new Ext.data.JsonStore({
      fields,
      idProperty: 'assetId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      },
    })
    const totalTextCmp = new SM.RowCountTextItem({
      store,
      noun: 'asset',
      iconCls: 'sm-asset-icon'
    })
    const config = {
      store,
      columns,
      sm,
      enableDragDrop: true,
      ddText : '{0} selected Asset{1}',
      bodyCssClass: 'sm-grid3-draggable',
      ddGroup: `SM.AssetSelection.GridPanel-${this.role}`,
      border: true,
      loadMask: false,
      stripeRows: true,
      view: new SM.ColumnFilters.GridViewBuffered({
        forceFit: true,
        emptyText: 'No Assets to display',
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
            gridBasename: 'Assets (grid)',
            storeBasename: 'Assets (store)',
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

SM.AssetSelection.SelectingPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    function setupDragZone (grid) {
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
    const availableGrid = new SM.AssetSelection.GridPanel({
      title: 'Available',
      headerCssClass: 'sm-available-panel-header',
      role: 'available',
      collectionId: this.collectionId,
      flex: 1,
      listeners: {
        render: function (grid) {
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: selectionsGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelectedAssets(selectionsGrid, selectedRecords, availableGrid)
              return true
            }
          })
        },

      }
    })
    const selectionsGrid = new SM.AssetSelection.GridPanel({
      title: this.selectionsGridTitle || 'Assigned',
      headerCssClass: 'sm-selections-panel-header',
      role: 'selections',
      collectionId: this.collectionId,
      flex: 1,
      listeners: {
        render: function (grid) {
          setupDragZone(grid)
          const gridDropTargetEl = grid.getView().scroller.dom;
          const gridDropTarget = new Ext.dd.DropTarget(gridDropTargetEl, {
            ddGroup: availableGrid.ddGroup,
            notifyDrop: function (ddSource, e, data) {
              const selectedRecords = ddSource.dragData.selections;
              changeSelectedAssets(availableGrid, selectedRecords, selectionsGrid)
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
        changeSelectedAssets(availableGrid, selectedRecords, selectionsGrid)
        btn.disable()
      }
    })
    const removeBtn = new Ext.Button({
      iconCls: 'sm-remove-assignment-icon',
      margins: "0 10 10 10",
      disabled: true,
      handler: function (btn) {
        const selectedRecords = selectionsGrid.getSelectionModel().getSelections()
        changeSelectedAssets(selectionsGrid, selectedRecords, availableGrid)
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
      const sm = this.getSelectionModel()
      if (sm.getSelected()) {
        sm.suspendEvents()
        sm.clearSelections()
        sm.resumeEvents()
        SM.SetCheckboxSelModelHeaderState(sm)
      }
      addBtn.setDisabled(this.role === 'available')
      removeBtn.setDisabled(this.role === 'selections')
    }

    async function initPanel({ benchmarkId, labelId }) {
      const promises = [
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/assets`,
          params: {
            collectionId: _this.collectionId,
            projection: ['stigs']
          },
          method: 'GET'
        })
      ]
      if (benchmarkId) {
        promises.push(Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/stigs/${benchmarkId}/assets`,
          method: 'GET'
        }))
        _this.trackedProperty = { dataProperty: 'benchmarkIds', value: benchmarkId }
      }
      else if (labelId) {
        promises.push(Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/labels/${labelId}/assets`,
          method: 'GET'
        }))
        _this.trackedProperty = { dataProperty: 'labelIds', value: labelId }
      }
      const [apiAvailableAssets, apiAssignedAssets = []] = await Promise.all(promises)
      const assignedAssetIds = apiAssignedAssets.map(apiAsset => apiAsset.assetId)
      _this.originalAssetIds = assignedAssetIds
      const availableAssets = []
      const assignedAssets = []
      apiAvailableAssets.reduce((accumulator, asset) => {
        const property = assignedAssetIds.includes(asset.assetId) ? 'assignedAssets' : 'availableAssets'
        accumulator[property].push(asset)
        return accumulator
      }, { availableAssets, assignedAssets })

      availableGrid.store.loadData(availableAssets)
      selectionsGrid.store.loadData(assignedAssets)
    }

    function changeSelectedAssets(srcGrid, records, dstGrid) {
      srcGrid.store.suspendEvents()
      dstGrid.store.suspendEvents()
      srcGrid.store.remove(records)
      dstGrid.store.add(records)
      for (const record of records) {
        if (srcGrid.role === 'available') {
          record.data[_this.trackedProperty.dataProperty].push(_this.trackedProperty.value)
          record.commit()
        }
        else {
          record.data[_this.trackedProperty.dataProperty] = record.data[_this.trackedProperty.dataProperty].filter(i => i !== _this.trackedProperty.value)
          record.commit()
        }
      }
      const { field, direction } = dstGrid.store.getSortState()
      dstGrid.store.sort(field, direction)
      srcGrid.store.resumeEvents()
      dstGrid.store.resumeEvents()
      srcGrid.store.fireEvent('datachanged', srcGrid.store)
      dstGrid.store.fireEvent('datachanged', dstGrid.store)
      srcGrid.store.fireEvent('update', srcGrid.store)
      dstGrid.store.fireEvent('update', dstGrid.store)
      dstGrid.store.filter(dstGrid.getView().getFilterFns())

      dstGrid.getSelectionModel().selectRecords(records)
      dstGrid.getView().focusRow(dstGrid.store.indexOfId(records[0].data.assetId))
      _this.fireEvent('assetselectionschanged')
    }

    function getValue() {
      const records = selectionsGrid.store.snapshot?.items ?? selectionsGrid.store.getRange()
      return records.map(record => record.data.assetId)
    }

    const config = {
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      name: 'assets',
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
    this.superclass().initComponent.call(this);
  }
})