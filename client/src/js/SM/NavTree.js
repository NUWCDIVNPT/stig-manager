Ext.ns('SM')
Ext.ns('SM.NavTree')

SM.NodeSorter = (a, b) => {
  if (a.attributes.sortToTop) {
    return -1
  }
  if (b.attributes.sortToTop) {
    return 1
  }
  return a.text.toUpperCase() < b.text.toUpperCase() ? -1 : 1
}

SM.CollectionNodeConfig = function (collection) {
  // Handlers for the STIG parent node
  async function onAssetChanged (node, apiAsset) {
    let apiAssetBids = apiAsset.stigs.map( stig => stig.benchmarkId )
    // changing this asset might have changed the Collection STIG list
    let result = await Ext.Ajax.requestPromise({
      url: `${STIGMAN.Env.apiBase}/collections/${apiAsset.collection.collectionId}`,
      method: 'GET',
      params: {
        projection: 'stigs'
      }
    })
    let collectionStigs = JSON.parse(result.response.responseText).stigs
    let collectionBids = collectionStigs.map( stig => stig.benchmarkId )
    let nodeBids = []
    let stigNodesToRemove = []
    // Iterate existing STIG nodes
    for ( let stigNode of node.childNodes) {
      if ( collectionBids.includes( stigNode.attributes.benchmarkId ) ) {
        // The collection includes this STIG
        nodeBids.push(stigNode.attributes.benchmarkId)
        if ( stigNode.isExpanded() ) {
          // The node is expanded and showing Assets
          // Try to get the node for this Asset, if it exists
          let stigAssetNode = stigNode.findChild('assetId', apiAsset.assetId)

          // Does this Asset include this STIG
          stigIsMappedToAsset = apiAssetBids.includes(stigNode.attributes.benchmarkId)
          if (stigIsMappedToAsset) {
            // The STIG is mapped to this Asset
            if (stigAssetNode) {
              // The Asset node exists
              if (stigAssetNode.attributes.text !== SM.he(apiAsset.name)) {
                // Update the node text if necessary
                stigAssetNode.setText(SM.he(apiAsset.name))
                stigNode.sort(SM.NodeSorter)
              }
            }
            else {
              // The Asset node does not exist -- create it
              stigNode.appendChild(SM.StigAssetNodeConfig(stigNode.attributes, apiAsset))
              stigNode.sort(SM.NodeSorter)
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
      if (!nodeBids.includes(collectionStig.benchmarkId)) {
        node.appendChild(SM.StigNodeConfig(apiAsset.collection.collectionId, collectionStig))
        node.sort(SM.NodeSorter)
      }
    }
  }
  async function onAssetDeleted (node, apiAsset) {
    // deleting this asset might have changed the Collection STIG list
    let result = await Ext.Ajax.requestPromise({
      url: `${STIGMAN.Env.apiBase}/collections/${apiAsset.collection.collectionId}`,
      method: 'GET',
      params: {
        projection: 'stigs'
      }
    })
    let collectionStigs = JSON.parse(result.response.responseText).stigs
    let collectionBids = collectionStigs.map( stig => stig.benchmarkId )
    let nodeBids = []
    let stigNodesToRemove = []
    // Iterate existing STIG nodes
    for ( let stigNode of node.childNodes) {
      if ( collectionBids.includes( stigNode.attributes.benchmarkId ) ) {
        // The collection includes this STIG
        nodeBids.push(stigNode.attributes.benchmarkId)
        if ( stigNode.isExpanded() ) {
          // The node is expanded and showing Assets
          // Try to get the node for this Asset, if it exists
          let stigAssetNode = stigNode.findChild('assetId', apiAsset.assetId)
          if (stigAssetNode) {
            // The Asset node exists -- remove it
            stigAssetNode.remove(true)
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
  }

  const children = []
  const reports = [
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
      id: `${collection.collectionId}-findings-status-node`,
      text: 'Status',
      collectionId: collection.collectionId,
      collectionName: collection.name,
      action: 'collection-status',
      iconCls: 'sm-report-icon',
      leaf: true
    }
  ]
  const collectionGrant = curUser.collectionGrants.find( g => g.collection.collectionId === collection.collectionId )
  if (collectionGrant && collectionGrant.accessLevel >= 3) {
    children.push({
      id: `${collection.collectionId}-pkgconfig-node`,
      text: 'Manage',
      collectionId: collection.collectionId,
      collectionName: collection.name,
      action: 'collection-management',
      iconCls: 'sm-setting-icon',
      leaf: true
    })
  }

  children.push(
    {
      id: `${collection.collectionId}-stigs-node`,
      node: 'stigs',
      text: 'STIGs',
      iconCls: 'sm-stig-icon',
      onAssetChanged: onAssetChanged,
      onAssetDeleted: onAssetDeleted
    },
    {
      id: `${collection.collectionId}-assets-node`,
      node: 'assets',
      text: 'Assets',
      iconCls: 'sm-asset-icon'
    },
    {
      id: `${collection.collectionId}-reports-node`,
      text: 'Reports',
      collectionId: collection.collectionId,
      collectionName: collection.name,
      iconCls: 'sm-report-icon',
      children: reports
    }
  )

  // Utility methods for setting the node name
  function formatTextAndLabels(collection, filteredLabels) {
    const name = SM.he(collection.name)
    const labelSpans = SM.Collection.LabelArrayTpl.apply(filteredLabels)
    const areSomeLabelsInUse = collection.labels.some((label) => label.uses > 0)
    const toolsEl = areSomeLabelsInUse ? '<img class="sm-tree-toolbar" src="img/label.svg" width="12" height="12">' : ''
    return `${name} ${labelSpans} ${toolsEl}`
  }
  const labelsMenu = new SM.Collection.LabelsMenu({
    labels: collection.labels,
    showHeader: true,
    showApply: true,
    ignoreUnusedLabels: true,
    listeners: {
      applied: function (labelIds) {
          SM.Dispatcher.fireEvent('labelfilter', collection.collectionId, labelIds)
      }
    }
  })
  const node = {
    id: `${collection.collectionId}-collection-node`,
    node: 'collection',
    text: formatTextAndLabels(collection, []),
    collectionId: collection.collectionId,
    collectionName: collection.name,
    iconCls: 'sm-collection-icon',
    labels: collection.labels,
    labelsMenu,
    listeners: {
      click: function (node, e) {
        if (e.target.className === "sm-tree-toolbar") {
          node.attributes.labelsMenu.showAt(e.xy)
        }
      }
    },
    children,
    formatTextAndLabels
  }
  return node
}

SM.AssetNodeConfig = function (collectionId, asset) {
  const onAssetChanged = (node, apiAsset) => {
    let apiAssetBenchmarkIds = apiAsset.stigs.map( stig => stig.benchmarkId )
    if (node.attributes.text !== SM.he(apiAsset.name)) {
      node.setText(SM.he(apiAsset.name))
      node.parentNode.sort(SM.NodeSorter)  
    }
    if (node.isExpanded()) {
      // Node has STIG childen
      let benchmarkIdsToKeep = []
      // Remove STIGs no longer mapped to this Asset
      const nodesToRemove = []
      for (let stigNode of node.childNodes) {
        if (!apiAssetBenchmarkIds.includes(stigNode.attributes.benchmarkId)) {
          nodesToRemove.push(stigNode)
        }
        else {
          benchmarkIdsToKeep.push(stigNode.attributes.benchmarkId)
        }
      }
      for (let nodeToRemove of nodesToRemove) {
        nodeToRemove.remove(true)
      }
      // Add new STIG(s), if any
      for (let apiAssetStig of apiAsset.stigs) {
        if (!benchmarkIdsToKeep.includes(apiAssetStig.benchmarkId)) {
          node.appendChild( SM.AssetStigNodeConfig(apiAsset, apiAssetStig) )
          node.sort(SM.NodeSorter)
        }
      }
    }
  }
  const labelMap = SM.Cache.CollectionMap.get(collectionId).labelMap
  const labels = asset.labelIds.map( labelId => labelMap.get(labelId))
  return {
    id: `${collectionId}-${asset.assetId}-assets-asset-node`,
    text: SM.he(asset.name),
    name: asset.name,
    report: 'asset',
    collectionId: collectionId,
    assetId: asset.assetId,
    iconCls: 'sm-asset-icon',
    qtip: `${SM.he(asset.name)} ${SM.Collection.LabelArrayTpl.apply(labels)}`,
    onAssetChanged: onAssetChanged
  }
}

SM.AssetStigNodeConfig = function (asset, stig) {
  return {
    id: `${asset.collection.collectionId}-${asset.assetId}-${stig.benchmarkId}-leaf`,
    text: SM.he(stig.benchmarkId),
    leaf: true,
    report: 'review',
    iconCls: 'sm-stig-icon',
    stigName: stig.benchmarkId,
    assetName: asset.name,
    assetLabelIds: asset.labelIds,
    assetId: asset.assetId,
    collectionId: asset.collection.collectionId,
    workflow: asset.collection.workflow,
    benchmarkId: stig.benchmarkId,
    qtip: SM.he(stig.title)
  }
}

SM.StigNodeConfig = function (collectionId, stig) {
  return {
    collectionId: collectionId,
    text: SM.he(stig.benchmarkId),
    report: 'stig',
    iconCls: 'sm-stig-icon',
    // stigRevStr: stig.lastRevisionStr,
    id: `${collectionId}-${stig.benchmarkId}-stigs-stig-node`,
    benchmarkId: stig.benchmarkId,
    qtip: SM.he(stig.title)
  }
}

SM.StigAssetNodeConfig = function (stig, asset) {
  const labelMap = SM.Cache.CollectionMap.get(asset.collectionId).labelMap
  const labels = asset.assetLabelIds.map( labelId => labelMap.get(labelId))
  return {
    id: `${asset.collectionId}-${stig.benchmarkId}-${asset.assetId}-leaf`,
    text: SM.he(asset.name),
    leaf: true,
    report: 'review',
    iconCls: 'sm-asset-icon',
    stigName: stig.benchmarkId,
    assetName: asset.name,
    assetLabels: labels,
    assetId: asset.assetId,
    collectionId: asset.collectionId ?? asset.collection?.collectionId,
    benchmarkId: stig.benchmarkId,
    // qtip: SM.he(asset.name)

    qtip: `${SM.he(asset.name)} ${SM.Collection.LabelArrayTpl.apply(labels)}`
  }
}

SM.StigBatchNodeConfig = function (benchmarkId, collectionId) {
  return {
    id: `${collectionId}-batch-${benchmarkId}-leaf`,
    sortToTop: true,
    text: 'Collection review',
    collectionGrant: curUser.collectionGrants.find( g => g.collection.collectionId === collectionId ).accessLevel,
    cls: 'sm-tree-node-collection-review',
    leaf: true,
    report: 'collection-review',
    iconCls: 'sm-collection-icon',
    collectionId: collectionId,
    benchmarkId: benchmarkId,
    qtip: 'Review multiple assets'
  }
}

SM.LibraryStigNodeConfig = function (stig) {
  return {
    id: `library-${stig.benchmarkId}-leaf`,
    text: SM.he(stig.benchmarkId),
    leaf: true,
    report: 'library',
    iconCls: 'sm-stig-icon',
    benchmarkId: stig.benchmarkId,
    lastRevisionStr: stig.lastRevisionStr,
    stigTitle: stig.title,
    qtip: SM.he(stig.title)
  }
}

SM.LibraryNodesConfig = function (stigs) {
  const aeRegEx = /^[a-e]/i
  const fmRegEx = /^[f-m]/i
  const nvRegEx = /^[n-v]/i
  const wzRegEx = /^[w-z]/i
  const children = [
    {
      id: `library-a-e-folder`,
      text: 'A-E',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => aeRegEx.test(stig.benchmarkId)).map( stig => SM.LibraryStigNodeConfig(stig))
    },
    {
      id: `library-f-m-folder`,
      text: 'F-M',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => fmRegEx.test(stig.benchmarkId)).map( stig => SM.LibraryStigNodeConfig(stig))
    },
    {
      id: `library-n-v-folder`,
      text: 'N-V',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => nvRegEx.test(stig.benchmarkId)).map( stig => SM.LibraryStigNodeConfig(stig))
    },
    {
      id: `library-w-z-folder`,
      text: 'W-Z',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => wzRegEx.test(stig.benchmarkId)).map( stig => SM.LibraryStigNodeConfig(stig))
    }
  ]
  return children
  // return stigs.map( stig => SM.LibraryStigNodeConfig(stig))
}

SM.AppNavTree = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
      let me = this
      function getCollectionNode (collectionId) {
        return me.getNodeById('collections-root').findChild('id', `${collectionId}-collection-node`, true)
      }
      function refreshCollectionNodeText (node) {
        const cachedCollection = SM.Cache.CollectionMap.get(node.attributes.collectionId)
        const labelIds = node.attributes.labelsMenu.getCheckedLabelIds()
        const filterLabels = cachedCollection.labels.filter( label => labelIds.includes(label.labelId))
        const text = node.attributes.formatTextAndLabels(cachedCollection, filterLabels)
        node.setText(text)
      }
      function refreshCollectionNodeChildren (collectionNode) {
        if (collectionNode.isExpanded()) {
          const reloadNodesDepth1 = [
            collectionNode.findChild('node', 'stigs'),
            collectionNode.findChild('node', 'assets')
          ]
          for (const node of reloadNodesDepth1) {
            if (node.isExpanded()) {
              const expandedChildren = []
              while(node.firstChild){
                if (node.firstChild.isExpanded()) {
                  expandedChildren.push(node.firstChild.id)
                }
                node.removeChild(node.firstChild);
              }
              node.loaded = false
              node.expand(false, false, (node) => {
                node.eachChild( (node) => {
                  if (expandedChildren.includes(node.id)) {
                    node.expand(false, false)
                  }
                })
              })
            }
          }
        }
      }
      this.getCollectionNode = getCollectionNode
      let config = {
          autoScroll: true,
          split: true,
          collapsible: true,
          title: `<span onclick="window.oidcProvider.logout()">${curUser.display === 'USER' ? SM.he(curUser.username) : SM.he(curUser.display)} - Logout</span>`,
          bodyStyle: 'padding:5px;',
          width: me.width || 300,
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
            render: this.treeRender,
            collapsenode: function (n) {
              n.loaded = false; // always reload from the server
            }
          }
      }

      this.onCollectionCreated = function (apiCollection, options) {
        const collectionGrant = curUser.collectionGrants.find( g => g.collection.collectionId === apiCollection.collectionId )
        if (collectionGrant) {
          let collectionRoot = me.getNodeById('collections-root')
          let newNode = collectionRoot.appendChild( SM.CollectionNodeConfig( apiCollection ) )
          function sortFn (a, b) {
            if (a.attributes.id === 'collection-create-leaf') {
              return -1
            }
            if (b.attributes.id === 'collection-create-leaf') {
              return 1
            }
            if (a.text.toUpperCase() < b.text.toUpperCase()) {
              return -1
            }
            if (a.text.toUpperCase() > b.text.toUpperCase()) {
              return 1
            }
            return 0
          }
          collectionRoot.sort(sortFn)
          if (options.showManager) {
            me.selectPath(`${newNode.getPath()}${me.pathSeparator}${newNode.attributes.children[0].id}`, undefined, (bSuccess, oSelNode) => {
              if (bSuccess) {
                oSelNode.getUI().elNode.click()
              }
            })
          }
        }
      }

      this.sortNodes = (a, b) => a.text < b.text ? -1 : 1

      this.onAssetChanged = async (apiAsset) => {
        const collectionId = apiAsset.collection.collectionId
        const collectionNode = getCollectionNode(collectionId)
        await SM.Cache.updateCollectionLabels(collectionId)
        collectionNode.attributes.labelsMenu.refreshItems(
          SM.Cache.CollectionMap.get(collectionId).labels)
        refreshCollectionNodeText(collectionNode)
        refreshCollectionNodeChildren(collectionNode)
      }
      this.onAssetCreated = (apiAsset) => {
        const collectionNode = getCollectionNode(apiAsset.collection.collectionId)
        refreshCollectionNodeChildren(collectionNode)

        // let assetsNode = me.getNodeById(`${apiAsset.collection.collectionId}-assets-node`, true)
        // if ( assetsNode && assetsNode.isExpanded() ) {
        //   assetsNode.appendChild(SM.AssetNodeConfig(apiAsset.collection.collectionId, apiAsset))
        //   assetsNode.sort(SM.NodeSorter)
        // }
        // let stigsNode = me.getNodeById(`${apiAsset.collection.collectionId}-stigs-node`)
        // if (stigsNode && stigsNode.isExpanded()) {
        //   stigsNode.attributes.onAssetChanged(stigsNode, apiAsset)
        // }
      }
      this.onAssetDeleted = (apiAsset) => {
        const collectionNode = getCollectionNode(apiAsset.collection.collectionId)
        refreshCollectionNodeChildren(collectionNode)

        // let assetsNode = me.getNodeById(`${apiAsset.collection.collectionId}-assets-node`, true)
        // if (assetsNode && assetsNode.isExpanded() ) {
        //   let assetNode = assetsNode.findChild('assetId', apiAsset.assetId)
        //   if (assetNode) {
        //     assetNode.remove(true)
        //   }
        // }
        // let stigsNode = me.getNodeById(`${apiAsset.collection.collectionId}-stigs-node`)
        // if (stigsNode && stigsNode.isExpanded()) {
        //   stigsNode.attributes.onAssetDeleted(stigsNode, apiAsset)
        // }
      }
      this.onCollectionChanged = function (apiCollection) {
        const collectionNode = getCollectionNode(apiCollection.collectionId)
        if (collectionNode) {
          refreshCollectionNodeText(collectionNode)
          collectionNode.collectionName = apiCollection.name
          collectionNode.eachChild( child => {
            if (child.attributes.collectionName) {
              child.attributes.collectionName = apiCollection.name
            }
          })
          function sortFn (a, b) {
            if (a.attributes.id === 'collection-create-leaf') {
              return -1
            }
            if (b.attributes.id === 'collection-create-leaf') {
              return 1
            }
            if (a.text.toUpperCase() < b.text.toUpperCase()) {
              return -1
            }
            if (a.text.toUpperCase() > b.text.toUpperCase()) {
              return 1
            }
            return 0
          }
          collectionNode.parentNode.sort(sortFn)
        }
      }
      this.onCollectionDeleted = function (collectionId) {
        const collectionNode = getCollectionNode(collectionId)
        if (collectionNode) {
          collectionNode.remove()
        }
      }
      this.onStigAssetsChanged = async (collectionId, benchmarkId, apiStigAssets) => {
        let apiAssetIds = apiStigAssets.map( a => a.assetId )
        let stig = await me.getApiStig(benchmarkId)

        // Handle Assets node
        let assetsNode = me.getNodeById(`${collectionId}-assets-node`)
        if (assetsNode && assetsNode.isExpanded() ) {
          // "Assets" node is expanded -- iterate children
          for (const assetNode of assetsNode.childNodes) {
            if ( assetNode.isExpanded() ) {
              // Find any child node for this STIG
              let stigNode = assetNode.findChild( 'benchmarkId', benchmarkId)
              if (apiAssetIds.includes(assetNode.attributes.assetId)) {
                // STIG is attached to this Asset
                if (!stigNode) {
                  // No child node for this STIG -- create one
                  assetNode.appendChild( SM.AssetStigNodeConfig( {
                    collection: {
                      collectionId: assetNode.attributes.collectionId
                    },
                    assetId: assetNode.attributes.assetId,
                    name: assetNode.attributes.name
                  },
                  stig ) )
                  assetNode.sort(SM.NodeSorter)
                }
              }
              else {
                // STIG is NOT attached to this Asset
                if (stigNode) {
                  // There is a child node for this STIG -- remove it
                  stigNode.remove(true)
                }
              }
            }
          }
        }

        // Handle STIG node
        let stigsNode = me.getNodeById(`${collectionId}-stigs-node`)
        if (stigsNode && stigsNode.isExpanded()) {
          let stigNode = me.getNodeById(`${collectionId}-${benchmarkId}-stigs-stig-node`)
          if (!stigNode) {
            // No child for this STIG -- create one
            stigsNode.appendChild( SM.StigNodeConfig( collectionId, stig ) )
            stigsNode.sort( SM.NodeSorter )
            return
          }
          if (apiAssetIds.length === 0) {
            // STIG has been unattached from all Assets
            if (stigNode) {
              stigNode.remove(true)
              return
            }
            else {
              // Should not be here -- new STIG with no Assets!?
              return
            }
          }
          if (stigNode && stigNode.isExpanded()) {
            const nodesToRemove = []
            const assetIdsToKeep = []
            for (const assetNode of stigNode.childNodes) {
              if (!apiAssetIds.includes( assetNode.attributes.assetId)) {
                // STIG is no longer attached to this asset
                nodesToRemove.push(assetNode)
              }
              else {
                assetIdsToKeep.push(assetNode.attributes.assetId)
              }
            }
            for (let nodeToRemove of nodesToRemove) {
              nodeToRemove.remove(true)
            }
            // Add new Asset(s), if any
            for (let apiStigAsset of apiStigAssets) {
              if (!assetIdsToKeep.includes(apiStigAsset.assetId)) {
                apiStigAsset.collection = {
                  collectionId: collectionId
                }
                stigNode.appendChild( SM.StigAssetNodeConfig(stig, apiStigAsset) )
              }
            }
            stigNode.sort(SM.NodeSorter)
          }
        }

      }
      this.onLabelCreated = function (collectionId, label) {
        if (label.uses > 0) {
          const collectionNode = getCollectionNode(collectionId)
          if (collectionNode) {
            collectionNode.attributes.labelsMenu.addLabel(label)
            refreshCollectionNodeText(collectionNode)
          }
        }
      }
      this.onLabelChanged = function (collectionId, label) {
        const collectionNode = getCollectionNode(collectionId)
        if (collectionNode) {
          collectionNode.attributes.labelsMenu.refreshItems(SM.Cache.CollectionMap.get(collectionId).labels)
          refreshCollectionNodeText(collectionNode)
        }        
      }
      this.onLabelDeleted = function (collectionId, labelId) {
        let collectionNode = getCollectionNode(collectionId)
          if (collectionNode) {
            const labelsMenu = collectionNode.attributes.labelsMenu
            const checkedLabelIds = labelsMenu.getCheckedLabelIds()
            labelsMenu.refreshItems(SM.Cache.CollectionMap.get(collectionId).labels)
            refreshCollectionNodeText(collectionNode)
            if (checkedLabelIds.includes(labelId)) {
              refreshCollectionNodeChildren(collectionNode)
            }
          }
      }
      this.onLabelFilter = function (collectionId, labelIds) {
        const collectionNode = getCollectionNode(collectionId)
        refreshCollectionNodeText(collectionNode)
        refreshCollectionNodeChildren(collectionNode)
      }
      this.onLabelAssetsChanged = async function (collectionId, labelId, apiAssets) {
        const collectionNode = getCollectionNode(collectionId)
        await SM.Cache.updateCollectionLabels(collectionId)
        collectionNode.attributes.labelsMenu.refreshItems(
          SM.Cache.CollectionMap.get(collectionId).labels)
        refreshCollectionNodeText(collectionNode)
        refreshCollectionNodeChildren(collectionNode)
      }

      this.getApiStig = async (benchmarkId) => {
        try {
          let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}`,
            method: 'GET'
          })
          return JSON.parse(result.response.responseText)
        }
        catch (e) {
          alert (e.message)
        }
      }

      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.AppNavTree.superclass.initComponent.call(this)

      // Attach handlers for app events
      SM.Dispatcher.addListener('collectioncreated', this.onCollectionCreated)
      SM.Dispatcher.addListener('collectionchanged', this.onCollectionChanged)
      SM.Dispatcher.addListener('collectiondeleted', this.onCollectionDeleted)
      SM.Dispatcher.addListener('assetchanged', this.onAssetChanged, me)
      SM.Dispatcher.addListener('assetcreated', this.onAssetCreated, me)
      SM.Dispatcher.addListener('assetdeleted', this.onAssetDeleted, me)
      SM.Dispatcher.addListener('stigassetschanged', this.onStigAssetsChanged, me) 
      SM.Dispatcher.addListener('labelcreated', this.onLabelCreated, me) 
      SM.Dispatcher.addListener('labelchanged', this.onLabelChanged, me) 
      SM.Dispatcher.addListener('labeldeleted', this.onLabelDeleted, me) 
      SM.Dispatcher.addListener('labelfilter', this.onLabelFilter, me) 
      SM.Dispatcher.addListener('labelassetschanged', this.onLabelAssetsChanged, me) 
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
                  text: 'Application Management',
                  iconCls: 'sm-setting-icon',
                  expanded: true,
                  children: [
                    {
                      id: 'collection-admin',
                      text: 'Collections',
                      leaf: true,
                      iconCls: 'sm-collection-icon'
                    },
                    {
                      id: 'user-admin',
                      text: 'User Grants',
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
                      text: 'Application Info',
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
            content.push(
              {
                id: `library-root`,
                node: 'library',
                text: 'STIG Library',
                iconCls: 'sm-library-icon',
                expanded: false
              }
            )
            cb(content, { status: true })
            return
          }
          if (node === 'library-root') {
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/stigs`,
              method: 'GET'
            })
            let apiStigs = JSON.parse(result.response.responseText)
            let content = SM.LibraryNodesConfig(apiStigs)
            cb(content, { status: true })
            return
          }
          if (node === 'collections-root') {
            const collectionMap = await SM.Cache.getCollections()
            const apiCollections = [...collectionMap.values()]
            let content = apiCollections.map(collection => SM.CollectionNodeConfig(collection))
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
          match = node.match(/^(\d+)-assets-node$/)
          if (match) {
            let collectionId = match[1]
            const params = {
              collectionId
            }
            const labelId = this.ownerTree.getCollectionNode(collectionId).attributes.labelsMenu.getCheckedLabelIds()
            if (labelId?.length) {
              params.labelId = labelId
            }
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/assets`,
              method: 'GET',
              params
            })
            let apiCollectionAssets = JSON.parse(result.response.responseText)
            let content = apiCollectionAssets.map(asset => SM.AssetNodeConfig(collectionId, asset))
            cb(content, { status: true })
            return
          }
          // Collection-Assets-STIG node
          match = node.match(/^(\d+)-(\d+)-assets-asset-node$/)
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
            let content = apiAsset.stigs.map(stig => SM.AssetStigNodeConfig(apiAsset, stig))
            cb(content, { status: true })
            return
          }
      
          // Collection-STIGs node
          match = node.match(/^(\d+)-stigs-node$/)
          if (match) {
            let collectionId = match[1]
            const request = {
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`,
              method: 'GET'
            }
            const labelId = this.ownerTree.getCollectionNode(collectionId).attributes.labelsMenu.getCheckedLabelIds()
            if (labelId?.length) {
              request.params = {
                labelId
              }
            }
            let result = await Ext.Ajax.requestPromise(request)
            let apiStigs = JSON.parse(result.response.responseText)
            let content = apiStigs.map( stig => SM.StigNodeConfig( collectionId, stig ) )
            cb( content, { status: true } )
            return
          }
          // Collection-STIGs-Asset node
          match = node.match(/^(\d+)-(.*)-stigs-stig-node$/)
          if (match) {
            let collectionId = match[1]
            let benchmarkId = match[2]
            const request = {
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
              method: 'GET'
            }
            const labelId = this.ownerTree.getCollectionNode(collectionId).attributes.labelsMenu.getCheckedLabelIds()
            if (labelId?.length) {
              request.params = {
                labelId
              }
            }
            let result = await Ext.Ajax.requestPromise(request)
            let apiAssets = JSON.parse(result.response.responseText)
            let content = []
            if (apiAssets.length > 0) {
            // Allow for batch review node
              content.push( SM.StigBatchNodeConfig( benchmarkId, collectionId ) )
              let stigAssetNodes = apiAssets.map(asset => SM.StigAssetNodeConfig({benchmarkId: benchmarkId}, asset))
              content = content.concat(stigAssetNodes)
            }      
            cb(content, { status: true })
            return
          }
      
      
        }
        catch (e) {
          Ext.Msg.alert('Status', 'AJAX request failed in loadTree()');
        }
    },
    treeClick: function (n, e) {
        let idAppend;
        let tab;
        
        if (!n.leaf) {
          return
        }
        console.log(`in treeClick() with ${e.type}`)
        if (n.attributes.report == 'library') {
          addLibraryStig({
            benchmarkId: n.attributes.benchmarkId,
            revisionStr: n.attributes.lastRevisionStr,
            stigTitle: n.attributes.stigTitle,
            treePath: n.getPath()
          })
        }
        if (n.attributes.report == 'review') {
          addReview({
            leaf: n.attributes,
            treePath: n.getPath(),
            dblclick: e.browserEvent.detail === 2
          })
        }
        if (n.attributes.report == 'collection-review') {
          idAppend = '-' + n.attributes.collectionId + '-' + n.attributes.benchmarkId.replace(".", "_");
          tab = Ext.getCmp('main-tab-panel').getItem('collection-review-tab' + idAppend);
          if (tab) {
            // Detect double click
            if (e.browserEvent.detail === 2) {
              tab.makePermanent()
            }
            tab.show();
          } else {
            addCollectionReview({
              leaf: n.attributes,
              treePath: n.getPath()
            })
          }
        }
        if (n.attributes.action == 'findings') {
          tab = Ext.getCmp('main-tab-panel').getItem('findingsTab-' + n.attributes.collectionId)
          if (tab) {
            // Detect double click
            if (e.browserEvent.detail === 2) {
              tab.makePermanent()
            }
            tab.show()
          } else {
            addFindingsSummary({
              collectionId: n.attributes.collectionId,
              collectionName: n.attributes.collectionName,
              treePath: n.getPath()
            })
          }
        }
        if (n.attributes.action == 'collection-create') {
          let collectionRootNode = n.parentNode
          let fp = new SM.Collection.CreateForm({
            btnText: 'Create',
            btnHandler: async () => {
              try {
                let values = fp.getForm().getFieldValues()
                await addOrUpdateCollection(0, values, {
                  elevate: false,
                  showManager: true
                })
              }
              catch (e) {
                alert (e.message)
              }
              finally {
                appwindow.close()
              }
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
            cls: 'sm-dialog-window sm-round-panel',
            title: 'Create Collection',
            modal: true,
            width: 460,
            height:560,
            layout: 'fit',
            plain: false,
            // bodyStyle:'padding:5px;',
            buttonAlign:'right',
            items: fp
          })

          appwindow.show(document.body)
        }
      
        if (n.attributes.action == 'collection-management') {
          addCollectionManager({
            collectionId: n.attributes.collectionId,
            collectionName: n.attributes.collectionName,
            treePath: n.getPath()
          })
        }
        if (n.attributes.action == 'collection-status') {
          tab = Ext.getCmp('main-tab-panel').getItem('completionTab-' + n.attributes.collectionId)       
          if (tab) {
            // Detect double click
            if (e.browserEvent.detail === 2) {
              tab.makePermanent()
            }
            tab.show()
          } else {
            addCompletionStatus({
              collectionId: n.attributes.collectionId,
              collectionName: n.attributes.collectionName,
              treePath: n.getPath()
            })
          }
        }

        switch (n.id) {
          case 'collection-admin':
            addCollectionAdmin( { treePath: n.getPath() } );
            break;
          case 'user-admin':
            addUserAdmin( { treePath: n.getPath() });
            break;
          case 'stig-admin':
            addStigAdmin( { treePath: n.getPath() });
            break;
          case 'appdata-admin':
            addAppDataAdmin( { treePath: n.getPath() });
            break;
        }

    },
    treeRender: function (tree) {
      new Ext.ToolTip({
          target: tree.header,
          showDelay: 1000,
          dismissDelay: 0,
          width: 600,
          title: 'OAuth2 token payload',
          listeners: {
              show: function (tip) {
                let tokenParsed = { ...window.oidcProvider.tokenParsed }
                let expDate = new Date(tokenParsed.exp*1000)
                let iatDate = new Date(tokenParsed.iat*1000)
                let authTimeDate = new Date(tokenParsed.auth_time*1000)
                tokenParsed.exp = `${tokenParsed.exp} (${expDate.format('Y-m-d H:i:s')})`
                tokenParsed.iat = `${tokenParsed.iat} (${iatDate.format('Y-m-d H:i:s')})`
                tokenParsed.auth_time = `${tokenParsed.auth_time} (${authTimeDate.format('Y-m-d H:i:s')})`
                tip.update("<pre style='white-space: pre-wrap;'>" + JSON.stringify(tokenParsed,null,2) + "</pre>")
              }
          }
      }).getId() //for sonarcloud to see object used
  }

})