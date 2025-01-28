Ext.ns("SM.Checklist")
Ext.ns("SM.Checklist.Asset")

SM.Checklist.Asset.Menu = Ext.extend(Ext.menu.Menu, {
  initComponent: function () {
    const conf = {}
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Checklist.Asset.Grid = Ext.extend(Ext.grid.Grid, {
  initComponent: function () {
    const _this = this
    const fields = [
      'assetId',
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
        name: 'ruleTitle',
        type: 'string'
      },
      {
        name: 'version',
        type: 'string'
      },
      {
        name: 'severity',
        type: 'string',
        sortType: sortSeverity
      },
      {
        name: 'result',
        type: 'string'
      },
      {
        name: 'status',
        type: 'string'
      },
      {
        name: 'hasAttach',
        type: 'boolean'
      }, 
      'resultEngine',
      {
        name: 'engineResult',
        convert: engineResultConverter
      },
      {
        name: 'touchTs',
        type: 'date'
      }
    ]
    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/assets/${this.assetId}/checklists/${this.benchmarkId}/${this.revisionStr}?format=json-access`,
        method: 'GET'
      }),
      root: 'checklist',
      fields,
      idProperty: 'ruleId',
      sortInfo: {
        field: 'ruleId',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        load: function (store, records) {
          reviewForm.defaultAccess = store.reader.jsonData.access
          groupChecklistMenu.importItem.setVisible(store.reader.jsonData.access === 'rw')
          groupGrid.accessStr = store.reader.jsonData.access === 'rw' ? '' : 'read only'
          // Were we passed a specific rule to select?
          if ('undefined' !== typeof selectedRule) {
            var index = store.find('ruleId', selectedRule);
            groupGrid.getSelectionModel().selectRow(index);
  
            var rowEl = groupGrid.getView().getRow(index);
            //rowEl.scrollIntoView(ourGrid.getGridEl(), false);
            rowEl.scrollIntoView();
            //ourGrid.getView().focusRow(index+5);
          } else {
            groupGrid.getSelectionModel().selectFirstRow();
          }
  
          groupGrid.statSprites.setText(getStatsString(store))
        },
        clear: function () {
          groupGrid.statSprites.setText(getStatsString(store));
        },
        update: function (store) {
          groupGrid.statSprites.setText(getStatsString(store));
        },
        datachanged: function (store) {
          groupGrid?.statSprites.setText(getStatsString(store));
        }
      }
    })




    const conf = {}
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})