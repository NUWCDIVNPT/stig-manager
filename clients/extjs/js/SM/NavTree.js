Ext.ns('SM')

SM.CollectionNodeConfig = function (collection) {
  let children = []
  collectionGrant = curUser.collectionGrants.find( g => g.collection.collectionId === collection.collectionId )
  if (collectionGrant && collectionGrant.accessLevel >= 3) {
    children.push({
      id: `${collection.collectionId}-pkgconfig-node`,
      text: 'Configuration',
      collectionId: collection.collectionId,
      collectionName: collection.name,
      action: 'collection-management',
      iconCls: 'sm-setting-icon',
      leaf: true
    })
  }
  children.push(
    {
      id: `${collection.collectionId}-findings-node`,
      text: 'Findings',
      collectionId: collection.collectionId,
      collectionName: collection.name,
      iconCls: 'sm-report-icon',
      action: 'findings',
      leaf: true
    },
    {
      id: `${collection.collectionId}-assets-node`,
      node: 'assets',
      text: 'Assets',
      iconCls: 'sm-asset-icon'
    },
    {
      id: `${collection.collectionId}-stigs-node`,
      node: 'stigs',
      text: 'STIGs',
      iconCls: 'sm-stig-icon'
    }
  )
  let node = {
    id: `${collection.collectionId}-collection-node`,
    node: 'collection',
    text: collection.name,
    collectionId: collection.collectionId,
    collectionName: collection.name,
    iconCls: 'sm-collection-icon',
    children: children
  }
  return node
}

SM.AssetNodeConfig = function (collectionId, asset) {
  return {
    id: `${collectionId}-${asset.assetId}-assets-asset-node`,
    text: asset.name,
    report: 'asset',
    collectionId: collectionId,
    assetId: asset.assetId,
    iconCls: 'sm-asset-icon',
    qtip: asset.name
  }
}

SM.AssetStigNodeConfig = function (asset, stig) {
  return {
    id: `${asset.collection.collectionId}-${asset.assetId}-${stig.benchmarkId}-leaf`,
    text: stig.benchmarkId,
    leaf: true,
    report: 'review',
    iconCls: 'sm-stig-icon',
    stigName: stig.benchmarkId,
    assetName: asset.name,
    stigRevStr: stig.lastRevisionStr,
    assetId: asset.assetId,
    collectionId: asset.collection.collectionId,
    workflow: asset.collection.workflow,
    benchmarkId: stig.benchmarkId,
    qtip: stig.title
  }
}

SM.StigNodeConfig = function (collectionId, stig) {
  return {
    collectionId: collectionId,
    text: stig.benchmarkId,
    report: 'stig',
    iconCls: 'sm-stig-icon',
    stigRevStr: stig.lastRevisionStr,
    id: `${collectionId}-${stig.benchmarkId}-stigs-stig-node`,
    benchmarkId: stig.benchmarkId,
    qtip: stig.title
  }
}

SM.StigAssetNodeObj = function (stig, asset) {
  return {
    id: `${asset.collection.collectionId}-${asset.assetId}-${stig.benchmarkId}-leaf`,
    text: asset.name,
    leaf: true,
    report: 'review',
    iconCls: 'sm-asset-icon',
    stigName: stig.benchmarkId,
    assetName: asset.name,
    stigRevStr: stig.lastRevisionStr, // HACK: relies on exclusion of other assigned stigs from /assets
    assetId: asset.assetId,
    collectionId: asset.collection.collectionId,
    benchmarkId: stig.benchmarkId,
    qtip: asset.name
  }
}

SM.AppNavTree = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
      let me = this
      let config = {
          id: 'app-nav-tree',
          autoScroll: true,
          split: true,
          collapsible: true,
          title: '<span onclick="window.keycloak.logout()">' + curUser.display + ' - Logout</span>',
          bodyStyle: 'padding:5px;',
          width: me.width || 280,
          minSize: 220,
          root: {
            nodeType: 'async',
            id: 'stigman-root',
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
      this.onCollectionCreated = function (collection) {
          let newNode = {
            id: `${collection.collectionId}-collection-node`,
            node: 'collection',
            text: collection.name,
            collectionId: collection.collectionId,
            collectionName: collection.name,
            iconCls: 'sm-collection-icon',
            children: [
              {
                id: `${collection.collectionId}-pkgconfig-node`,
                text: 'Collection configuration...',
                collectionId: collection.collectionId,
                collectionName: collection.name,
                action: 'collection-management',
                iconCls: 'sm-setting-icon',
                leaf: true
              },{
                id: `${collection.collectionId}-import-result-node`,
                text: 'Import STIG results...',
                collectionId: collection.collectionId,
                collectionName: collection.name,
                iconCls: 'sm-import-icon',
                action: 'import',
                leaf: true
              },{
                id: `${collection.collectionId}-assets-node`,
                node: 'assets',
                text: 'Assets',
                iconCls: 'sm-asset-icon'
              },{
                id: `${collection.collectionId}-stigs-node`,
                node: 'stigs',
                text: 'STIGs',
                iconCls: 'sm-stig-icon'
              }
            ]
          }
          let collectionRoot = me.getNodeById('collections-root')
          collectionRoot.appendChild(newNode)
          function sortFn (a, b) {
            if (a.attributes.id === 'collection-create-leaf') {
              return -1
            }
            if (b.attributes.id === 'collection-create-leaf') {
              return 1
            }
            if (a.text < b.text) {
              return -1
            }
            if (a.text > b.text) {
              return 1
            }
            return 0
          }
          collectionRoot.sort(sortFn)
      }
      this.sortNodes = (a, b) => a.text < b.text ? -1 : 1
      this.onAssetChanged = async (apiAsset) => {
        let apiAssetBenchmarkIds = apiAsset.stigs.map( stig => stig.benchmarkId )
        let assetsNode = this.getNodeById(`${apiAsset.collection.collectionId}-assets-node`)
        if (assetsNode && assetsNode.isExpanded() ) {
          let assetNode = assetsNode.findChild('assetId', apiAsset.assetId)
          if (assetNode) {
            if (assetNode.attributes.text !== apiAsset.name) {
              assetNode.setText(apiAsset.name)
              assetsNode.sort(me.sortNodes)  
            }
            if (assetNode.isExpanded()) {
              // Node has STIG childen
              let assetNodeBenchmarkIds = []
              // Remove STIGs no longer mapped to this Asset
              const nodesToRemove = []
              for (let assetStigNode of assetNode.childNodes) {
                if (!apiAssetBenchmarkIds.includes(assetStigNode.attributes.benchmarkId)) {
                  nodesToRemove.push(assetStigNode)
                }
                else {
                  assetNodeBenchmarkIds.push(assetStigNode.attributes.benchmarkId)
                }
              }
              for (let nodeToRemove of nodesToRemove) {
                nodeToRemove.remove(true)
              }
              // Add new STIG(s), if any
              for (let apiAssetStig of apiAsset.stigs) {
                if (!assetNodeBenchmarkIds.includes(apiAssetStig.benchmarkId)) {
                  assetNode.appendChild( SM.AssetStigNodeConfig(apiAsset, apiAssetStig) )
                  assetNode.sort(me.sortNodes)
                }
              }
            }
          }
        }
        let stigsNode = this.getNodeById(`${apiAsset.collection.collectionId}-stigs-node`)
        if (stigsNode && stigsNode.isExpanded()) {
          // changing this asset might have changed the Collection STIG list
          let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/collections/${apiAsset.collection.collectionId}`,
            method: 'GET',
            params: {
              projection: 'stigs'
            }
          })
          let collectionStigs = JSON.parse(result.response.responseText).stigs
          let collectionBenchmarkIds= collectionStigs.map( stig => stig.benchmarkId )
          let stigsNodeBenchmarkIds = []
          let stigNodesToRemove = []
          // Iterate existing STIG nodes
          for ( let stigNode of stigsNode.childNodes) {
            if ( collectionBenchmarkIds.includes( stigNode.attributes.benchmarkId ) ) {
              // The collection includes this STIG
              stigsNodeBenchmarkIds.push(stigNode.attributes.benchmarkId)
              if ( stigNode.isExpanded() ) {
                // The node is expanded and showing Assets

                // Does the Asset include this STIG
                stigIsMappedToAsset = apiAssetBenchmarkIds.includes(stigNode.attributes.benchmarkId)
                let stigAssetNode = stigNode.findChild('assetId', apiAsset.assetId)

                if (stigIsMappedToAsset) {
                  // The STIG is mapped to this Asset
                  if (stigAssetNode) {
                    // The Asset node exists
                    if (stigAssetNode.attributes.text !== apiAsset.name) {
                      stigAssetNode.setText(apiAsset.name)
                      stigNode.sort(me.sortNodes)
                    }
                  }
                  else {
                    // The Asset node does not exist -- create it
                    stigNode.appendChild(SM.StigAssetNodeObj(stigNode.attributes, apiAsset))
                    stigNode.sort(me.sortNodes)
                  }
                }
                else {
                  // The STIG is NOT mapped to this Asset
                  if (stigAssetNode) {
                    // The Asset node exists -- remove it
                    stigAssetNode.remove(true)
                  }
                }
              }
            }
            else {
              // The collection no longer includes this STIG
              stigNodesToRemove.push(stigNode)
            }           
          }
          for (let stigNodeToRemove of stigNodesToRemove) {
            stigNodeToRemove.remove(true)
          }
          // Add new STIG node(s), if any
          for (let collectionStig of collectionStigs) {
            if (!stigsNodeBenchmarkIds.includes(collectionStig.benchmarkId)) {
              stigsNode.appendChild(SM.StigNodeConfig(apiAsset.collection.collectionId, collectionStig))
              stigsNode.sort(me.sortNodes)
            }
          }
        }
      }
      this.onAssetCreated = (apiAsset) => {
        let assetsNode = this.getNodeById(`${apiAsset.collection.collectionId}-assets-node`, true)
        if ( assetsNode && assetsNode.isExpanded() ) {
          assetsNode.appendChild({
              id: `${apiAsset.collection.collectionId}-${apiAsset.assetId}-assets-asset-node`,
              text: apiAsset.name,
              report: 'asset',
              collectionId: apiAsset.collection.collectionId,
              assetId: apiAsset.assetId,
              iconCls: 'sm-asset-icon',
              qtip: apiAsset.name
            })
        }
      }
      this.onCollectionChanged = function (changes) {
        if ('name' in changes) {
          let collectionRoot = me.getNodeById('collections-root')
          let collectionNode = collectionRoot.findChild('id', `${changes.collectionId}-collection-node`, true)
          if (collectionNode) {
            collectionNode.setText(changes.name)
            collectionNode.collectionName = changes.name
            collectionNode.eachChild( child => {
              if (child.attributes.collectionName) {
                child.attributes.collectionName = changes.name
              }
            })
          }
        }
      }
      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.AppNavTree.superclass.initComponent.call(this)

      // Attach handlers for app events
      SM.Dispatcher.addListener('collectioncreated', this.onCollectionCreated)
      SM.Dispatcher.addListener('collectionchanged', this.onCollectionChanged)
      SM.Dispatcher.addListener('assetchanged', this.onAssetChanged, me)
      SM.Dispatcher.addListener('assetcreated', this.onAssetCreated, me)

    
    },
    loadTree: async function (node, cb) {
        try {
          let match, collectionGrant
          // Root node
          if (node == 'stigman-root') {
            let content = []
            if (curUser.privileges.canAdmin) {
              content.push(
                {
                  id: `admin-root`,
                  node: 'admin',
                  text: 'Administration',
                  iconCls: 'sm-setting-icon',
                  expanded: true,
                  children: [
                    {
                      id: 'user-admin',
                      text: 'Users',
                      leaf: true,
                      iconCls: 'sm-users-icon'
                    },
                    {
                      id: 'stig-admin',
                      text: 'STIG and SCAP Benchmarks',
                      leaf: true,
                      iconCls: 'sm-stig-icon'
                    },
                    {
                      id: 'appdata-admin',
                      text: 'Application Data ',
                      leaf: true,
                      iconCls: 'sm-database-save-icon'
                    }
                  ]
                }
              )
            }
            content.push(
              {
                id: `collections-root`,
                node: 'collections',
                text: 'Collections',
                iconCls: 'sm-collection-icon',
                expanded: true
              }
            )
            cb(content, { status: true })
            return
          }
          if (node === 'collections-root') {
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/collections`,
              method: 'GET'
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.map(collection => SM.CollectionNodeConfig(collection))
            if (curUser.privileges.canCreateCollection) {
              content.unshift({
                id: `collection-create-leaf`,
                action: 'collection-create',
                text: 'Create Collection...',
                cls: 'sm-tree-node-create',
                iconCls: 'sm-add-icon',
                qtip: 'Create a new STIG Manager Collection',
                leaf: true
              })
            }
            cb(content, { status: true })
            return
          }
          // Collection-Assets node
          match = node.match(/(\d+)-assets-node/)
          if (match) {
            let collectionId = match[1]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
              method: 'GET',
              params: {
                projection: 'assets'
              }
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.assets.map(asset => SM.AssetNodeConfig(collectionId, asset))
            cb(content, { status: true })
            return
          }
          // Collection-Assets-STIG node
          match = node.match(/(\d+)-(\d+)-assets-asset-node/)
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
            let asset = JSON.parse(result.response.responseText)
            let content = asset.stigs.map(stig => SM.AssetStigNodeConfig(asset, stig))
            cb(content, { status: true })
            return
          }
      
          // Collection-STIGs node
          match = node.match(/(\d+)-stigs-node/)
          if (match) {
            let collectionId = match[1]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}`,
              method: 'GET',
              params: {
                projection: 'stigs'
              }
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.stigs.map( stig => SM.StigNodeConfig( collectionId, stig ) )
            cb( content, { status: true } )
            return
          }
          // Collection-STIGs-Asset node
          match = node.match(/(\d+)-(.*)-stigs-stig-node/)
          if (match) {
            let collectionId = match[1]
            let benchmarkId = match[2]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/assets`,
              method: 'GET',
              params: {
                collectionId: collectionId,
                benchmarkId: benchmarkId,
                projection: 'stigs'
              }
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.map(asset => SM.StigAssetNodeObj(asset.stigs[0], asset))
            cb(content, { status: true })
            return
          }
      
      
        }
        catch (e) {
          Ext.Msg.alert('Status', 'AJAX request failed in loadTree()');
        }
    },
    treeClick: function (n) {
        var idAppend;
        var tab;
      
        if (n.attributes.report == 'review') {
          idAppend = '-' + n.attributes.assetId + '-' + n.attributes.benchmarkId.replace(".", "_");
          tab = Ext.getCmp('reviews-center-tab').getItem('reviewTab' + idAppend);
          if (tab) {
            tab.show();
          } else {
            addReview(n.attributes);
          }
        }
        if (n.attributes.action == 'import') {
          uploadArchive(n);
        }
        if (n.attributes.action == 'findings') {
          addFindingsSummary(n.attributes.collectionId, n.attributes.collectionName);
        }
        if (n.attributes.action == 'collection-create') {
          let collectionRootNode = n.parentNode
          let fp = new SM.CollectionForm({
            btnText: 'Create',
            btnHandler: () => {
              let values = fp.getForm().getFieldValues()
              createCollection(values, curUser.userId)
            }
          })
          fp.getForm().setValues({
            grants: [{
              user: {
                userId: curUser.userId,
                username: curUser.username
              },
              accessLevel: 4
            }],
          })
          let appwindow = new Ext.Window({
            id: 'window-project-info',
            title: 'Create STIG Manager Project',
            modal: true,
            width: 560,
            height:550,
            layout: 'fit',
            plain: false,
            bodyStyle:'padding:5px;',
            buttonAlign:'right',
            items: fp
          })
          appwindow.show(document.body)
        }
      
        if (n.attributes.action == 'collection-management') {
            addCollectionManager(n.attributes.collectionId, n.attributes.collectionName)
        }
      
        switch (n.id) {
          case 'user-admin':
            addUserAdmin();
            break;
          case 'stig-admin':
            addStigAdmin();
            break;
          case 'appdata-admin':
            addAppDataAdmin();
            break;
        }
      
    }
})
