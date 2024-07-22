function addCollectionAdmin( params ) {
  let { treePath } = params
  const tab = Ext.getCmp('main-tab-panel').getItem('collection-admin-tab')
	if (tab) {
		tab.show()
		return
	}

  const fields = Ext.data.Record.create([
    {
      name: 'collectionId',
      type: 'string'
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
      name: 'metadata'
    },
    {
      name: 'owners'
    },
    {
      name: 'assets',
      type: 'integer',
      mapping: 'statistics.assetCount'
    },
    {
      name: 'grants',
      type: 'integer',
      mapping: 'statistics.grantCount'
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
  ])
  const store = new Ext.data.JsonStore({
    proxy: new Ext.data.HttpProxy({
      url: `${STIGMAN.Env.apiBase}/collections`,
      method: 'GET'
    }),
    baseParams: {
      elevate: curUser.privileges.canAdmin,
      projection: ['owners', 'statistics']
    },
    root: '',
    fields: fields,
    isLoaded: false, // custom property
    idProperty: 'collectionId',
    sortInfo: {
      field: 'name',
      direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
    },
    listeners: {
      load: function (store, records) {
        store.isLoaded = true;
        // collectionGrid.getSelectionModel().selectFirstRow();
      }
    }
  })

  const totalTextCmp = new SM.RowCountTextItem({store:store})

  const collectionGrid = new Ext.grid.GridPanel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    region: 'center',
    id: 'collectionGrid',
    store: store,
    border: true,
    stripeRows: true,
    sm: new Ext.grid.RowSelectionModel({ singleSelect: true }),
    columns: [
      {
        header: "Name",
        width: 150,
        dataIndex: 'name',
        sortable: true,
        filter: {type: 'string'}
      },
      {
        header: "Description",
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
          v = v.map(v => v.username).join('\n')
          return columnWrap.apply(this, arguments)
        }
      },
      {
        header: "Grants",
        width: 150,
        dataIndex: 'grants',
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

    ],
    view: new SM.ColumnFilters.GridView({
      forceFit: false,
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
    }),
    listeners: {
      rowdblclick: {
        fn: function (grid, rowIndex, e) {
          var r = grid.getStore().getAt(rowIndex);
          showCollectionProps(r.get('collectionId'));
        }
      }
    },
    tbar: [{
      iconCls: 'icon-add',
      text: 'New Collection',
      disabled: !(curUser.privileges.canAdmin),
      handler: function () {
        showCollectionProps(0);
      }
    }, '-', {
      ref: '../removeBtn',
      iconCls: 'icon-del',
      text: 'Delete Collection',
      disabled: !(curUser.privileges.canAdmin),
      handler: function () {
        let record = collectionGrid.getSelectionModel().getSelected();
        let confirmStr = "Delete collection, " + record.data.name + "?";

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
    }, '-', {
      iconCls: 'icon-edit',
      text: 'Collection Properties',
      handler: function () {
        var r = collectionGrid.getSelectionModel().getSelected();
        showCollectionProps(r.get('collectionId'));
      }
    }],
    bbar: new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            collectionGrid.getStore().reload();
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
    width: '50%',
    loadMask: {msg: ''}
  })

  // These handlers reload the entire store and should be revisited
  function onCollectionChanged (apiCollection) {
    store.reload()
    // store.loadData(apiCollection, true)
    // const sortState = store.getSortState()
    // store.sort(sortState.field, sortState.direction)
    // collectionGrid.getSelectionModel().selectRow(store.findExact('collectionId',apiCollection.collectionId))
  }
  function onCollectionCreated (apiCollection) {
    store.reload()
    // store.loadData(apiCollection, true)
    // const sortState = store.getSortState()
    // store.sort(sortState.field, sortState.direction)
    // collectionGrid.getSelectionModel().selectRow(store.findExact('collectionId',apiCollection.collectionId))
  }
  function onCollectionDeleted (collectionId) {
    store.reload()
    // store.removeAt(store.indexOfId(collectionId))
  }
  
  SM.Dispatcher.addListener('collectionchanged', onCollectionChanged)
  SM.Dispatcher.addListener('collectioncreated', onCollectionCreated)
  SM.Dispatcher.addListener('collectiondeleted', onCollectionDeleted)

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'collection-admin-tab',
    sm_treePath: treePath,
    iconCls: 'sm-collection-icon',
    title: 'Collections',
    closable: true,
    layout: 'border',
    border: false,
    items: [collectionGrid],
    listeners: {
      beforedestroy: function () {
        SM.Dispatcher.removeListener('collectionchanged', onCollectionChanged)
        SM.Dispatcher.removeListener('collectioncreated', onCollectionCreated)
        SM.Dispatcher.removeListener('collectiondeleted', onCollectionDeleted)
      }
    }
  })
  thisTab.show()

  collectionGrid.getStore().load()
}

async function showCollectionProps(collectionId) {
  try {
    let fp = new SM.Collection.CreateForm({
      showGrantsOnly: true,
      btnText: collectionId ? 'Update' : 'Create',
      btnHandler: async () => {
        try {
          let values = fp.getForm().getFieldValues()
          await addOrUpdateCollection(collectionId, values, {
            elevate: true,
            showManager: true
          })
          appwindow.close()
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
      }
    })

    if (collectionId) {
      const apiCollection = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
        params: {
          elevate: curUser.privileges.canAdmin,
          projection: ['grants', 'labels']
        },
        method: 'GET'
      })
      SM.Cache.updateCollection(apiCollection)

      fp.setFieldValues(apiCollection)
    }
    let appwindow = new Ext.Window({
      id: 'window-project-info',
      cls: 'sm-dialog-window sm-round-panel',
      title: collectionId ? 'Modify Collection' : 'Create Collection',
      modal: true,
      width: 460,
      height: 560,
      layout: 'fit',
      plain: false,
      // bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: fp
    })

    appwindow.show(document.body)

  }
  catch (err) {
    SM.Error.handleError(e)
  }
}

