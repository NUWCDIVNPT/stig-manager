Ext.ns('SM')
Ext.ns('SM.NavTree')

SM.NavTree.NodeSorter = (a, b) => {
  if (a.attributes.sortToTop) {
    return -1
  }
  if (b.attributes.sortToTop) {
    return 1
  }
  return a.text.toUpperCase() < b.text.toUpperCase() ? -1 : 1
}

SM.NavTree.CollectionLeafConfig = function (collection) {
  const collectionGrant = curUser.collectionGrants.find( g => g.collection.collectionId === collection.collectionId )
  let toolsEl = ''
  if (collectionGrant && collectionGrant.accessLevel >= 3) {
    toolsEl = '<img class="sm-tree-toolbar" src="img/gear.svg" width="12" height="12" ext:qtip="Manage Collection">'
  }
  return {
    id: `${collection.collectionId}-collection-leaf`,
    leaf: true,
    leafType: 'collection',
    text: SM.he(collection.name) + toolsEl,
    collectionId: collection.collectionId,
    collectionName: collection.name,
    iconCls: 'sm-collection-icon',
    listeners: {
      beforeclick: function (n, e) {
        if (e.target.className === "sm-tree-toolbar") {
          addCollectionManager({
            collectionId: n.attributes.collectionId,
            collectionName: n.attributes.collectionName,
            treePath: n.getPath()
          })
          return false
        }
        return true
      }
    }
  }
}

SM.NavTree.LibraryStigNodeConfig = function (stig) {
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

SM.NavTree.LibraryNodesConfig = function (stigs) {
  const aeRegEx = /^[a-e]/i
  const fmRegEx = /^[f-m]/i
  const nvRegEx = /^[n-v]/i
  const wzRegEx = /^[w-z]/i

  const children = [
    {
      id: `library-a-e-folder`,
      text: 'A-E',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => aeRegEx.test(stig.benchmarkId)).map( stig => SM.NavTree.LibraryStigNodeConfig(stig))
    },
    {
      id: `library-f-m-folder`,
      text: 'F-M',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => fmRegEx.test(stig.benchmarkId)).map( stig => SM.NavTree.LibraryStigNodeConfig(stig))
    },
    {
      id: `library-n-v-folder`,
      text: 'N-V',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => nvRegEx.test(stig.benchmarkId)).map( stig => SM.NavTree.LibraryStigNodeConfig(stig))
    },
    {
      id: `library-w-z-folder`,
      text: 'W-Z',
      iconCls: 'sm-folder-icon',
      children: stigs.filter( stig => wzRegEx.test(stig.benchmarkId)).map( stig => SM.NavTree.LibraryStigNodeConfig(stig))
    }
  ]
  const multiRevisionStigs = stigs.filter( stig => stig.revisionStrs.length > 1 )
  if (multiRevisionStigs.length) {
    children.unshift({
      id: 'library-diff-leaf',
      action: 'stig-diff',
      text: 'Compare revisions<span class="sm-navtree-sprite">preview</span>',
      iconCls: 'sm-diff-icon',
      multiRevisionStigs,
      leaf: true
    })
  }
  return children
}

SM.NavTree.TreePanel = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
      let me = this
      this.getCollectionLeaf = function (collectionId) {
        return me.getNodeById('collections-root').findChild('id', `${collectionId}-collection-leaf`, true)
      }

      this.onCollectionCreated = function (apiCollection, options) {
        const collectionGrant = curUser.collectionGrants.find( g => g.collection.collectionId === apiCollection.collectionId )
        if (collectionGrant) {
          let collectionRoot = me.getNodeById('collections-root')
          let newLeaf = collectionRoot.appendChild( SM.NavTree.CollectionLeafConfig( apiCollection ) )
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
            me.selectPath(newLeaf.getPath(), undefined, (bSuccess, oSelNode) => {
              if (bSuccess) {
                oSelNode.getUI().elNode.querySelector('.sm-tree-toolbar')?.click()
              }
            })
          }
        }
      }

      this.sortNodes = (a, b) => a.text < b.text ? -1 : 1

      this.onCollectionChanged = function (apiCollection) {
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
        const collectionLeaf = me.getCollectionLeaf(apiCollection.collectionId)
        if (collectionLeaf) {
          collectionLeaf.collectionName = apiCollection.name
          collectionLeaf.setText(SM.he(collectionLeaf.collectionName))
          collectionLeaf.parentNode.sort(sortFn)
        }
      }
      this.onCollectionDeleted = function (collectionId) {
        const collectionLeaf = me.getCollectionLeaf(collectionId)
        if (collectionLeaf) {
          collectionLeaf.remove()
        }
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
          SM.Error.handleError(e)
        }
      }

      let config = {
        autoScroll: true,
        split: true,
        collapsible: true,
        collapseFirst: false,
        tools: [
          {
            id: 'logout',
            qtip: 'Logout session',
            handler: window.oidcProvider.logout
          },
        ],
        title: `${curUser.displayName === 'USER' ? SM.he(curUser.username) : SM.he(curUser.displayName)}`,
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

      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.NavTree.TreePanel.superclass.initComponent.call(this)

      // Attach handlers for app events
      SM.Dispatcher.addListener('collectioncreated', this.onCollectionCreated)
      SM.Dispatcher.addListener('collectionchanged', this.onCollectionChanged)
      SM.Dispatcher.addListener('collectiondeleted', this.onCollectionDeleted)
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
                  expanded: false,
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
                      text: 'STIG Benchmarks',
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
                text: 'Collections<img class="sm-tree-toolbar" src="img/grid.svg" width="12" height="12" ext:qtip="Meta Dashboard">',
                iconCls: 'sm-collection-icon',
                expanded: true,
                listeners: {
                  beforeclick: function (n, e) {
                    if (e.target.className === "sm-tree-toolbar") {
                      SM.MetaPanel.showMetaTab({
                        treePath: n.getPath(),
                        initialCollectionIds: SM.safeJSONParse(localStorage.getItem('metaCollectionIds')) ?? []
                      })
                      return false
                    }
                    return true
                  }
                }
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
            content.push(
              {
                id: `theme-root`,
                node: 'theme',
                text: 'Interface',
                iconCls: 'sm-setting-icon',
                expanded: false,
                children: [
                  {
                    id: 'whats-new',
                    text: "What's New",
                    iconCls: 'sm-stig-icon',
                    leaf: true
                  },
                  {
                    id: 'dark-mode',
                    text: 'Dark mode',
                    leaf: true,
                    checked: localStorage.getItem('darkMode') == '1',
                    iconCls: 'sm-dark-mode-icon',
                    listeners: {
                      beforeclick: function (node , e) {
                        node.ui.checkbox.checked = !node.ui.checkbox.checked
                        node.fireEvent('checkchange', node, node.ui.checkbox.checked)
                        return false
                      },
                      checkchange: function (node, checked) {
                        document.querySelector("link[href='css/dark-mode.css']").disabled = !checked
                        localStorage.setItem('darkMode', checked ? '1' : '0')
                        SM.Dispatcher.fireEvent('themechanged', checked ? 'dark' : 'light')
                      }
                    }
                  }
                ]
              }
            )
            cb(content, { status: true })
            return
          }
          if (node === 'library-root') {
            const apiStigs = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/stigs?projection=revisions`,
              method: 'GET'
            })
            let content = SM.NavTree.LibraryNodesConfig(apiStigs)
            cb(content, { status: true })
            return
          }
          if (node === 'collections-root') {
            const collectionMap = await SM.Cache.getCollections()
            const apiCollections = [...collectionMap.values()].sort((a, b) => a.name.localeCompare(b.name))
            let content = apiCollections.map(collection => SM.NavTree.CollectionLeafConfig(collection))
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
        }
        catch (e) {
          SM.Error.handleError(e)
        }
    },
    treeClick: function (n, e) {
        let idAppend;
        let tab;
        
        if (!n.leaf) {
          return
        }
        if (n.attributes.action === 'stig-diff') {
          SM.Library.showDiffPanel({
            multiRevisionStigs: n.attributes.multiRevisionStigs,
            treePath: n.getPath()
          })
          return
        }
        if (n.attributes.leafType === 'collection') {
          SM.CollectionPanel.showCollectionTab({
            collectionId: n.attributes.collectionId,
            collectionName: n.attributes.collectionName,
            treePath: n.getPath()
          })
          return
        }
        if (n.attributes.report == 'library') {
          addLibraryStig({
            benchmarkId: n.attributes.benchmarkId,
            revisionStr: n.attributes.lastRevisionStr,
            stigTitle: n.attributes.stigTitle,
            treePath: n.getPath()
          })
        }
        if (n.attributes.action == 'collection-create') {
          let fp = new SM.Collection.CreateForm({
            btnText: 'Create',
            btnHandler: async () => {
              try {
                let values = fp.getForm().getFieldValues()
                await addOrUpdateCollection(0, values, {
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

          fp.getForm().setValues({
            grants: [{
              user: {
                userId: curUser.userId,
                username: curUser.username,
                displayName: curUser.displayName
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
            height:630,
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

        switch (n.id) {
          case 'collection-admin':
            addCollectionAdmin( { treePath: n.getPath() } )
            break
          case 'user-admin':
            addUserAdmin( { treePath: n.getPath() })
            break
          case 'stig-admin':
            addStigAdmin( { treePath: n.getPath() })
            break
          case 'appdata-admin':
            addAppDataAdmin( { treePath: n.getPath() })
            break
          case 'whats-new':
            SM.WhatsNew.addTab( { treePath: n.getPath() })
            break
        }

    },
    treeRender: function (tree) {
      new Ext.ToolTip({
          target: tree.header.dom.querySelector(`.${tree.headerTextCls}`),
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