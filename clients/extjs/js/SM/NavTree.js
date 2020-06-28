Ext.ns('SM')

SM.AppNavTree = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
      let me = this
      let config = {
          id: 'app-nav-tree',
          contextMenu: new Ext.menu.Menu({
            items: [{
              id: 'open-collection-review',
              text: 'Open Approval workspace',
              iconCls: 'sm-application-go-icon'
            }
              , {
              id: 'open-poam-workspace',
              text: 'Open POAM/RAR workspace',
              iconCls: 'sm-application-go-icon'
            }
              , {
              id: 'app-nav-tree-separator-1',
              xtype: 'menuseparator'
            }
              , {
              id: 'open-hbss-control',
              text: 'Disable HBSS SCAP imports...',
              iconCls: 'sm-list-remove-16-icon'
            }
              , {
              id: 'app-nav-tree-separator-2',
              xtype: 'menuseparator'
            }
              , {
              id: 'unlock-all-collection-reviews',
              text: 'Reset reviews...',
              iconCls: 'sm-unlock-icon'
            }
              , {
              id: 'app-nav-tree-separator-3',
              xtype: 'menuseparator'
            }
              , {
              id: 'unlock-collection-stig-reviews',
              text: 'Reset reviews...',
              iconCls: 'sm-unlock-icon'
            }, {
              id: 'app-nav-tree-separator-4',
              xtype: 'menuseparator'
            }
              , {
              id: 'unlock-collection-asset-reviews',
              text: 'Reset reviews...',
              iconCls: 'sm-unlock-icon'
            }
      
            ],
            listeners: {
              itemclick: function (item) {
                var n = item.parentMenu.contextNode;
                switch (item.id) {
                  case 'open-collection-review':
                    openCollectionReview(n);
                    break;
                  case 'open-poam-workspace':
                    openPoamWorkspace(n);
                    break;
                  case 'open-hbss-control':
                    openHbssControl(n);
                    break;
                  case 'unlock-all-collection-reviews':
                    //====================================================
                    //RESET ALL REVIEWS FOR PACKAGE AFTER PROMPTING USER.
                    //====================================================
                    var unlockObject = new Object;
                    getUnlockInfo(n, unlockObject);
                    getUnlockPrompt("PACKAGE", unlockObject, undefined);
                    break;
                  case 'unlock-collection-stig-reviews':
                    //====================================================
                    //RESET ALL REVIEWS FOR THE STIG IN SPECIFIC PACKAGE.
                    //====================================================
                    var unlockObject = new Object;
                    getUnlockInfo(n, unlockObject);
                    getUnlockPrompt("STIG", unlockObject, undefined);
                    break;
                  case 'unlock-collection-asset-reviews':
                    //====================================================
                    //UNLOCK ALL REVIEWS FOR ASSET IN SPECIFIC PACKAGE.
                    //====================================================
                    var unlockObject = new Object;
                    getUnlockInfo(n, unlockObject);
                    getUnlockPrompt("ASSET", unlockObject, undefined);
                    break;
                }
              }
            }
          }),
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
            contextmenu: function (node, e) {
              //          Register the context node with the menu so that a Menu Item's handler function can access
              //          it via its parentMenu property.
              node.select();
              //===============================================
              //HIDE ALL BATCH RESET OPTIONS FROM THE ONSET
              //===============================================
              Ext.getCmp('open-collection-review').hide();
              Ext.getCmp('open-poam-workspace').hide();
              Ext.getCmp('app-nav-tree-separator-1').hide();
              Ext.getCmp('open-hbss-control').hide();
              Ext.getCmp('app-nav-tree-separator-2').hide();
              Ext.getCmp('unlock-all-collection-reviews').hide();
              Ext.getCmp('app-nav-tree-separator-3').hide();
              Ext.getCmp('unlock-collection-stig-reviews').hide();
              Ext.getCmp('app-nav-tree-separator-4').hide();
              Ext.getCmp('unlock-collection-asset-reviews').hide();
      
              if ((node.attributes.node === 'collection' || node.attributes.report === 'stig' || node.attributes.report === 'asset') && (curUser.accessLevel === 3 || curUser.privileges.canAdmin)) {
                var c = node.getOwnerTree().contextMenu;
                c.contextNode = node;
                if (node.attributes.node == 'collection') {
                  Ext.getCmp('open-poam-workspace').show();   //Open Poam workspace
                  Ext.getCmp('app-nav-tree-separator-1').show(); //Disable HBSS SCAP Imports
                  Ext.getCmp('open-hbss-control').show();
                  if (curUser.accessLevel === 3) { //Staff
                    //===============================================
                    //Include collection-accessLevel reset options
                    //===============================================
                    Ext.getCmp('app-nav-tree-separator-2').show();
                    Ext.getCmp('unlock-all-collection-reviews').show();
                  }
                  c.showAt(e.getXY());
                } else if (node.attributes.report == 'stig') {
                  Ext.getCmp('open-collection-review').show(); //Open Approval Workspace
                  Ext.getCmp('open-poam-workspace').show();
                  if (curUser.accessLevel === 3) {
                    //===============================================
                    //Include STIG-accessLevel unlock options
                    //===============================================
                    Ext.getCmp('app-nav-tree-separator-3').show();
                    Ext.getCmp('unlock-collection-stig-reviews').show();
                  }
                  c.showAt(e.getXY());
                } else {
                  if (curUser.accessLevel === 3) {
                    //===============================================
                    //Include ASSET-accessLevel reset options
                    //===============================================
                    Ext.getCmp('unlock-collection-asset-reviews').show();
                    c.showAt(e.getXY());
                  }
                }
              }
            },
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
                  assetNode.appendChild({
                    id: `${apiAsset.collection.collectionId}-${apiAsset.assetId}-${apiAssetStig.benchmarkId}-leaf`,
                    text: apiAssetStig.benchmarkId,
                    leaf: true,
                    report: 'review',
                    iconCls: 'sm-stig-icon',
                    stigName: apiAssetStig.benchmarkId,
                    assetName: apiAsset.name,
                    stigRevStr: apiAssetStig.lastRevisionStr,
                    assetId: apiAsset.assetId,
                    collectionId: apiAsset.collection.collectionId,
                    workflow: apiAsset.collection.workflow,
                    benchmarkId: apiAssetStig.benchmarkId,
                    qtip: apiAssetStig.title
                  })
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
                    stigNode.appendChild({
                      id: `${apiAsset.collection.collectionId}-${apiAsset.assetId}-${stigNode.attributes.benchmarkId}-leaf`,
                      text: apiAsset.name,
                      leaf: true,
                      report: 'review',
                      iconCls: 'sm-asset-icon',
                      stigName: stigNode.attributes.benchmarkId,
                      assetName: apiAsset.name,
                      stigRevStr: stigNode.attributes.lastRevisionStr,
                      assetId: apiAsset.assetId,
                      collectionId: apiAsset.collection.collectionId,
                      benchmarkId: stigNode.attributes.benchmarkId,
                      qtip: apiAsset.name
                    })
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
              stigsNode.appendChild({
                collectionId: apiAsset.collection.collectionId,
                text: collectionStig.benchmarkId,
                collectionName: apiAsset.collection.name,
                collectionId: apiAsset.collection.collectionId,
                report: 'stig',
                iconCls: 'sm-stig-icon',
                stigRevStr: collectionStig.lastRevisionStr,
                id: `${apiAsset.collection.collectionId}-${collectionStig.benchmarkId}-stigs-stig-node`,
                benchmarkId: collectionStig.benchmarkId,
                qtip: collectionStig.title
              })
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
            let content = r.map(collection => {
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
                  // {
                  //   id: `${collection.collectionId}-import-result-node`,
                  //   text: 'Import STIG results...',
                  //   collectionId: collection.collectionId,
                  //   collectionName: collection.name,
                  //   iconCls: 'sm-import-icon',
                  //   action: 'import',
                  //   leaf: true
                  // },
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
            })
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
            let content = r.assets.map(asset => ({
                id: `${collectionId}-${asset.assetId}-assets-asset-node`,
                text: asset.name,
                report: 'asset',
                collectionId: collectionId,
                assetId: asset.assetId,
                iconCls: 'sm-asset-icon',
                qtip: asset.name
              })
            )
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
            let r = JSON.parse(result.response.responseText)
            let content = r.stigs.map(stig => ({
              id: `${collectionId}-${assetId}-${stig.benchmarkId}-leaf`,
              text: stig.benchmarkId,
              leaf: true,
              report: 'review',
              iconCls: 'sm-stig-icon',
              stigName: stig.benchmarkId,
              assetName: r.name,
              stigRevStr: stig.lastRevisionStr,
              assetId: r.assetId,
              collectionId: collectionId,
              workflow: r.collection.workflow,
              benchmarkId: stig.benchmarkId,
              qtip: stig.title
            })
            )
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
            let content = r.stigs.map(stig => ({
              collectionId: collectionId,
              text: stig.benchmarkId,
              collectionName: r.name,
              collectionId: collectionId,
              report: 'stig',
              iconCls: 'sm-stig-icon',
              reqRar: r.reqRar,
              stigRevStr: stig.lastRevisionStr,
              id: `${collectionId}-${stig.benchmarkId}-stigs-stig-node`,
              benchmarkId: stig.benchmarkId,
              qtip: stig.title
            })
            )
            cb(content, { status: true })
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
            let content = r.map(asset => ({
              id: `${collectionId}-${asset.assetId}-${benchmarkId}-leaf`,
              text: asset.name,
              leaf: true,
              report: 'review',
              iconCls: 'sm-asset-icon',
              stigName: benchmarkId,
              assetName: asset.name,
              stigRevStr: asset.stigs[0].lastRevisionStr, // BUG: relies on exclusion of other assigned stigs from /assets
              assetId: asset.assetId,
              collectionId: collectionId,
              benchmarkId: benchmarkId,
              qtip: asset.name
            })
            )
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
      
    },
    
      
      

})
