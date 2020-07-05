Ext.ns('SM')

SM.AssignmentNavTree = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
      let me = this
      let collectionId = this.collectionId
      let config = {
          autoScroll: true,
          split: true,
          collapsible: true,
          title: 'Collection Resources',
          bodyStyle: 'padding:5px;',
          width: me.width || 300,
          minSize: 220,
          root: {
            nodeType: 'async',
            id: `${collectionId}-assignment-root`,
            expanded: true
          },
          rootVisible: false,
          loader: new Ext.tree.TreeLoader({
            directFn: me.loadTree
          }),
          loadMask: 'Loading...',
          listeners: {
            click: me.treeClick,
            beforeexpandnode: function (n) {
              n.loaded = false; // always reload from the server
            }
          }
      }
  
      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.AssignmentNavTree.superclass.initComponent.call(this)
    },
    loadTree: async function (node, cb) {
        try {
          let match, collectionGrant
          // Root node
          match = node.match(/(\d+)-assignment-root/)
          if (match) {
            let collectionId = match[1]
            let content = []
            content.push(
              {
                id: `${collectionId}-assignment-stigs-node`,
                node: 'stigs',
                text: 'STIGs',
                iconCls: 'sm-stig-icon'
              },
              {
                id: `${collectionId}-assignment-assets-node`,
                node: 'assets',
                text: 'Assets',
                iconCls: 'sm-asset-icon'
              },
            )
            cb(content, { status: true })
            return
          }
          // Collection-Assets node
          match = node.match(/(\d+)-assignment-assets-node/)
          if (match) {
            let collectionId = match[1]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/assets`,
              method: 'GET',
              params: {
                collectionId: collectionId
              }
            })
            let apiAssets = JSON.parse(result.response.responseText)
            let content = apiAssets.map(asset => ({
              id: `${collectionId}-${asset.assetId}-assignment-assets-asset-node`,
              text: asset.name,
              node: 'asset',
              collectionId: collectionId,
              assetId: asset.assetId,
              iconCls: 'sm-asset-icon',
              qtip: asset.name
            }))
            cb(content, { status: true })
            return
          }
          // Collection-Assets-STIG node
          match = node.match(/(\d+)-(\d+)-assignment-assets-asset-node/)
          if (match) {
            let collectionId = match[1]
            let assetId = match[2]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
              method: 'GET',
              params: {
                projection: 'stigs'
              }
            })
            let apiAsset = JSON.parse(result.response.responseText)
            let content = apiAsset.stigs.map(stig => ({
              id: `${collectionId}-${assetId}-${stig.benchmarkId}-assignment-leaf`,
              text: stig.benchmarkId,
              leaf: true,
              node: 'asset-stig',
              iconCls: 'sm-stig-icon',
              stigName: stig.benchmarkId,
              assetName: asset.name,
              assetId: asset.assetId,
              collectionId: collectionId,
              benchmarkId: stig.benchmarkId,
              qtip: stig.title
            }))
            cb(content, { status: true })
            return
          }
      
          // Collection-STIGs node
          match = node.match(/(\d+)-assignment-stigs-node/)
          if (match) {
            let collectionId = match[1]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
              method: 'GET',
              params: {
                projection: 'stigs'
              }
            })
            let apiCollection = JSON.parse(result.response.responseText)
            let content = apiCollection.stigs.map( stig => ({
              collectionId: collectionId,
              text: stig.benchmarkId,
              node: 'stig',
              iconCls: 'sm-stig-icon',
              id: `${collectionId}-${stig.benchmarkId}-assignment-stigs-stig-node`,
              benchmarkId: stig.benchmarkId,
              qtip: stig.title
            }) )
            cb( content, { status: true } )
            return
          }
          // Collection-STIGs-Asset node
          match = node.match(/(\d+)-(.*)-assignment-stigs-stig-node/)
          if (match) {
            let collectionId = match[1]
            let benchmarkId = match[2]
              let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
              method: 'GET'
            })
            let apiAssets = JSON.parse(result.response.responseText)
            let content = apiAssets.map(asset => ({
              id: `${collectionId}-${benchmarkId}-${asset.assetId}-assignment-leaf`,
              text: asset.name,
              leaf: true,
              node: 'stig-asset',
              iconCls: 'sm-asset-icon',
              stigName: benchmarkId,
              assetName: asset.name,
              assetId: asset.assetId,
              collectionId: collectionId,
              benchmarkId: benchmarkId,
              qtip: asset.name
            }))
            cb(content, { status: true })
            return
          }
        }
        catch (e) {
          Ext.Msg.alert('Status', 'AJAX request failed in loadTree()');
        }
    },
    treeClick: function (n) {
    }
  
})
  
SM.AssignmentAddBtn = Ext.extend(Ext.Button, {
  initComponent: () => {
    let me = this
    let tree = this.tree
    let grid = this.grid
    let config = {
      disabled: true,
      text: 'Add Assignment ',
      height: 30,
      width: 150,
      margins: "10 10 10 10",
      icon: 'img/right-arrow-16.png',
      iconAlign: 'right',
      cls: 'x-btn-text-icon',
      listeners:{
        click: function(){
          const selectedNode = tree.getSelectionModel().getSelectedNode();
          tree.makeAssignments(selectedNode);
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.AssignmentAddBtn.superclass.initComponent.call(this)
  }
})
  
SM.AssignmentRemoveBtn = Ext.extend(Ext.Button, {
  initComponent: () => {
    let me = this
    let tree = this.tree
    let grid = this.grid
    let config = {
      disabled: true,
      text: 'Remove Assignment ',
      height: 30,
      width: 150,
      margins: "10 10 10 10",
      icon: 'img/left-arrow-16.png',
      iconAlign: 'left',
      cls: 'x-btn-text-icon',
      listeners:{
      click: function(){
          const assigmentsToPurge = grid.getSelectionModel().getSelections()
          grid.getStore().remove(assigmentsToPurge)
        }
      }
}
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.AssignmentRemoveBtn.superclass.initComponent.call(this)
  }
})

SM.AssignmentGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function() {
    let me = this
    let assigmentStore = new Ext.data.JsonStore({
      fields: [
          {	name:'benchmarkId',
              type: 'string'
          },
          {
              name:'assetId',
              type: 'string'
          },
          {
              name: 'assetName',
              type: 'string'
          }
      ],
      autoLoad: this.autoLoad,
      url: this.url || `${STIGMAN.Env.apiBase}/stigs`,
      root: this.root || '',
      sortInfo: {
          field: 'benchmarkId',
          direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      idProperty: 'benchmarkId',
      listeners: {
          load: (store, records, options) => {
              if (me.includeAllItem) {
                  store.suspendEvents()
                  let allRecord = {
                      benchmarkId: me.includeAllItem
                  }
                  store.loadData( me.root ? { [me.root]: allRecord } : { allRecord }, true)
                  store.sort('benchmarkId', 'ASC')
                  store.resumeEvents()
              }
          }
      }
  })
    
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.AssignmentGrid.superclass.initComponent.call(this)
  }

})