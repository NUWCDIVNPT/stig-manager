function addCollectionAdmin( params ) {
  let { treePath } = params
  const tab = Ext.getCmp('main-tab-panel').getItem('collection-admin-tab')
	if (tab) {
		tab.show()
		return
	}

  const collectionGrid = new SM.Manage.Collection.AdminGrid({
    cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    region: 'center',
    border: false,
    stripeRows: true,
    listeners: {
      rowclick: function (grid, rowIndex) {
        const r = grid.getStore().getAt(rowIndex)
        loadAdminPropertiesPanel(r.data.collectionId)
      }
    }
  })

  async function loadAdminPropertiesPanel(collectionId) {
    const el = adminPropsPanel.getEl()
    const smTask = setTimeout(el.mask.bind(el), 250)
    try {
      const apiCollection = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
        params: {
          elevate: true,
          projection: 'grants'
        },
        method: 'GET'
      })
      adminPropsPanel.setFieldValues(apiCollection)
    }
    finally {
      if (smTask) {
        clearTimeout(smTask)
      }
      el.unmask()
      el.removeClass('sm-vbox-disabled')
    }
  }

  const adminPropsPanel = new SM.Manage.Collection.AdminPropertiesPanel({
    title: 'Properties',
    cls: 'sm-round-panel sm-vbox-disabled',
    region: 'east',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    width: 400,
    split: true
  })

  function reloadGrid() {
    collectionGrid.store.reload()
  }
  function onCollectionChanged (apiCollection) {
    collectionGrid.store.reload()
    // store.loadData(apiCollection, true)
    // const sortState = store.getSortState()
    // store.sort(sortState.field, sortState.direction)
    // collectionGrid.getSelectionModel().selectRow(store.findExact('collectionId',apiCollection.collectionId))
  }
  function onCollectionCreated (apiCollection) {
    collectionGrid.store.reload()
  }
  function onCollectionDeleted (collectionId) {
    collectionGrid.store.reload()
    // store.removeAt(store.indexOfId(collectionId))
  }
  
  SM.Dispatcher.addListener('collectionchanged', reloadGrid)
  SM.Dispatcher.addListener('collectioncreated', reloadGrid)
  SM.Dispatcher.addListener('collectiondeleted', reloadGrid)
  SM.Dispatcher.addListener('grant.updated', reloadGrid)
  SM.Dispatcher.addListener('grant.created', reloadGrid)
  SM.Dispatcher.addListener('grant.deleted', reloadGrid)

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'collection-admin-tab',
    sm_treePath: treePath,
    iconCls: 'sm-collection-icon',
    title: 'Collections',
    closable: true,
    layout: 'border',
    border: false,
    items: [collectionGrid, adminPropsPanel],
    listeners: {
      beforedestroy: function () {
        SM.Dispatcher.removeListener('collectionchanged', reloadGrid)
        SM.Dispatcher.removeListener('collectioncreated', reloadGrid)
        SM.Dispatcher.removeListener('collectiondeleted', reloadGrid)
        SM.Dispatcher.removeListener('grant.updated', reloadGrid)
        SM.Dispatcher.removeListener('grant.created', reloadGrid)
        SM.Dispatcher.removeListener('grant.deleted', reloadGrid)
      
      
      }
    }
  })
  thisTab.show()

  collectionGrid.getStore().load()
}

async function showAdminCreatePanel() {
  try {
    const adminCreatePanel = new SM.Manage.Collection.AdminCreatePanel({
      btnHandler: async () => {
        try {
          let values = adminCreatePanel.getFieldValues()
          await SM.Manage.Collection.ApiAddOrUpdate(0, values, {
            elevate: true,
            showManager: false
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
              SM.Error.handleError(e)
            }
          }
        }
      }
    })

    const appwindow = new Ext.Window({
      id: 'window-project-info',
      cls: 'sm-dialog-window sm-round-panel',
      title: 'Create Collection',
      modal: true,
      width: 800,
      height: 560,
      layout: 'fit',
      plain: false,
      // bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: adminCreatePanel
    })

    appwindow.show(document.body)

  }
  catch (e) {
    SM.Error.handleError(e)
  }
}

