Ext.ns('SM')

SM.AppNavTree = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
        let me = this
        let config = {
            id: 'app-nav-tree',
            contextMenu: new Ext.menu.Menu({
              items: [{
                id: 'open-package-review',
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
                id: 'unlock-all-package-reviews',
                text: 'Reset reviews...',
                iconCls: 'sm-unlock-icon'
              }
                , {
                id: 'app-nav-tree-separator-3',
                xtype: 'menuseparator'
              }
                , {
                id: 'unlock-package-stig-reviews',
                text: 'Reset reviews...',
                iconCls: 'sm-unlock-icon'
              }, {
                id: 'app-nav-tree-separator-4',
                xtype: 'menuseparator'
              }
                , {
                id: 'unlock-package-asset-reviews',
                text: 'Reset reviews...',
                iconCls: 'sm-unlock-icon'
              }
        
              ],
              listeners: {
                itemclick: function (item) {
                  var n = item.parentMenu.contextNode;
                  switch (item.id) {
                    case 'open-package-review':
                      openPackageReview(n);
                      break;
                    case 'open-poam-workspace':
                      openPoamWorkspace(n);
                      break;
                    case 'open-hbss-control':
                      openHbssControl(n);
                      break;
                    case 'unlock-all-package-reviews':
                      //====================================================
                      //RESET ALL REVIEWS FOR PACKAGE AFTER PROMPTING USER.
                      //====================================================
                      var unlockObject = new Object;
                      getUnlockInfo(n, unlockObject);
                      getUnlockPrompt("PACKAGE", unlockObject, undefined);
                      break;
                    case 'unlock-package-stig-reviews':
                      //====================================================
                      //RESET ALL REVIEWS FOR THE STIG IN SPECIFIC PACKAGE.
                      //====================================================
                      var unlockObject = new Object;
                      getUnlockInfo(n, unlockObject);
                      getUnlockPrompt("STIG", unlockObject, undefined);
                      break;
                    case 'unlock-package-asset-reviews':
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
                Ext.getCmp('open-package-review').hide();
                Ext.getCmp('open-poam-workspace').hide();
                Ext.getCmp('app-nav-tree-separator-1').hide();
                Ext.getCmp('open-hbss-control').hide();
                Ext.getCmp('app-nav-tree-separator-2').hide();
                Ext.getCmp('unlock-all-package-reviews').hide();
                Ext.getCmp('app-nav-tree-separator-3').hide();
                Ext.getCmp('unlock-package-stig-reviews').hide();
                Ext.getCmp('app-nav-tree-separator-4').hide();
                Ext.getCmp('unlock-package-asset-reviews').hide();
        
                if ((node.attributes.node === 'package' || node.attributes.report === 'stig' || node.attributes.report === 'asset') && (curUser.accessLevel === 3 || curUser.canAdmin)) {
                  var c = node.getOwnerTree().contextMenu;
                  c.contextNode = node;
                  if (node.attributes.node == 'package') {
                    Ext.getCmp('open-poam-workspace').show();   //Open Poam workspace
                    Ext.getCmp('app-nav-tree-separator-1').show(); //Disable HBSS SCAP Imports
                    Ext.getCmp('open-hbss-control').show();
                    if (curUser.accessLevel === 3) { //Staff
                      //===============================================
                      //Include package-accessLevel reset options
                      //===============================================
                      Ext.getCmp('app-nav-tree-separator-2').show();
                      Ext.getCmp('unlock-all-package-reviews').show();
                    }
                    c.showAt(e.getXY());
                  } else if (node.attributes.report == 'stig') {
                    Ext.getCmp('open-package-review').show(); //Open Approval Workspace
                    Ext.getCmp('open-poam-workspace').show();
                    if (curUser.accessLevel === 3) {
                      //===============================================
                      //Include STIG-accessLevel unlock options
                      //===============================================
                      Ext.getCmp('app-nav-tree-separator-3').show();
                      Ext.getCmp('unlock-package-stig-reviews').show();
                    }
                    c.showAt(e.getXY());
                  } else {
                    if (curUser.accessLevel === 3) {
                      //===============================================
                      //Include ASSET-accessLevel reset options
                      //===============================================
                      Ext.getCmp('unlock-package-asset-reviews').show();
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
        config.onPackageCreate = function (package) {
          let newNode = {
            id: `${package.packageId}-package-node`,
            node: 'package',
            text: package.name,
            packageId: package.packageId,
            packageName: package.name,
            iconCls: 'sm-package-icon',
            children: [
              {
                id: `${package.packageId}-pkgconfig-node`,
                text: 'Package configuration...',
                packageId: package.packageId,
                packageName: package.name,
                action: 'package-management',
                iconCls: 'sm-setting-icon',
                leaf: true
              },{
                id: `${package.packageId}-import-result-node`,
                text: 'Import STIG results...',
                packageId: package.packageId,
                packageName: package.name,
                iconCls: 'sm-import-icon',
                action: 'import',
                leaf: true
              },{
                id: `${package.packageId}-assets-node`,
                node: 'assets',
                text: 'Assets',
                iconCls: 'sm-asset-icon'
              },{
                id: `${package.packageId}-stigs-node`,
                node: 'stigs',
                text: 'STIGs',
                iconCls: 'sm-stig-icon'
              }
            ]
          }
          let packageRoot = me.getNodeById('packages-root')
          packageRoot.appendChild(newNode)
          function sortFn (a, b) {
            if (a.attributes.id === 'package-create-leaf') {
              return -1
            }
            if (b.attributes.id === 'package-create-leaf') {
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
          packageRoot.sort(sortFn)
      }
  

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AppNavTree.superclass.initComponent.call(this)

        // Attach handlers for app events
        SM.Dispatcher.addListener('packagecreated', me.onPackageCreate)

    },
    loadTree: async function (node, cb) {
        try {
          let match, packageGrant
          // Root node
          if (node == 'stigman-root') {
            let content = []
            if (curUser.canAdmin) {
              content.push(
                {
                  id: `admin-root`,
                  node: 'admin',
                  text: 'Administration',
                  iconCls: 'sm-setting-icon',
                  expanded: true,
                  children: [{
                    id: 'user-admin',
                    text: 'Users',
                    leaf: true,
                    iconCls: 'sm-users-icon'
                  }, {
                    id: 'stig-admin',
                    text: 'STIG and SCAP Benchmarks',
                    leaf: true,
                    iconCls: 'sm-stig-icon'
                  }, {
                    id: 'appdata-admin',
                    text: 'Application Data ',
                    leaf: true,
                    iconCls: 'sm-database-save-icon'
                  }]
                }
              )
            }
            content.push(
              {
                id: `packages-root`,
                node: 'packages',
                text: 'Packages',
                iconCls: 'sm-package-icon',
                expanded: true
              }
            )
            cb(content, { status: true })
            return
          }
          if (node === 'packages-root') {
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/packages`,
              method: 'GET'
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.map(package => {
                let children = []
                packageGrant = curUser.packageGrants.find( g => g.packageId === package.packageId )
                if (packageGrant && packageGrant.accessLevel >= 3) {
                  children.push({
                    id: `${package.packageId}-pkgconfig-node`,
                    text: 'Package configuration...',
                    packageId: package.packageId,
                    packageName: package.name,
                    action: 'package-management',
                    iconCls: 'sm-setting-icon',
                    leaf: true
                  })
                }
                children.push(
                  {
                    id: `${package.packageId}-import-result-node`,
                    text: 'Import STIG results...',
                    packageId: package.packageId,
                    packageName: package.name,
                    iconCls: 'sm-import-icon',
                    action: 'import',
                    leaf: true
                  },{
                    id: `${package.packageId}-assets-node`,
                    node: 'assets',
                    text: 'Assets',
                    iconCls: 'sm-asset-icon'
                  },{
                    id: `${package.packageId}-stigs-node`,
                    node: 'stigs',
                    text: 'STIGs',
                    iconCls: 'sm-stig-icon'
                  }
                )
                let node = {
                  id: `${package.packageId}-package-node`,
                  node: 'package',
                  text: package.name,
                  packageId: package.packageId,
                  packageName: package.name,
                  iconCls: 'sm-package-icon',
                  children: children
                }
                return node
            })
            if (curUser.canCreatePackage) {
              content.unshift({
                id: `package-create-leaf`,
                action: 'package-create',
                text: 'Create Package...',
                cls: 'sm-tree-node-create',
                iconCls: 'sm-add-icon',
                qtip: 'Create a new STIG Manager Package',
                leaf: true
              })
            }
            cb(content, { status: true })
            return
          }
          // Package-Assets node
          match = node.match(/(\d+)-assets-node/)
          if (match) {
            let packageId = match[1]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
              method: 'GET',
              params: {
                projection: 'assets'
              }
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.assets.map(asset => ({
                id: `${packageId}-${asset.assetId}-assets-asset-node`,
                text: asset.name,
                report: 'asset',
                packageId: packageId,
                assetId: asset.assetId,
                iconCls: 'sm-asset-icon',
                qtip: asset.name
              })
            )
            cb(content, { status: true })
            return
          }
          // Package-Assets-STIG node
          match = node.match(/(\d+)-(\d+)-assets-asset-node/)
          if (match) {
            let packageId = match[1]
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
              id: `${packageId}-${assetId}-${stig.benchmarkId}-leaf`,
              text: stig.benchmarkId,
              leaf: true,
              report: 'review',
              iconCls: 'sm-stig-icon',
              stigName: stig.benchmarkId,
              assetName: r.name,
              stigRevStr: stig.lastRevisionStr,
              assetId: r.assetId,
              packageId: packageId,
              benchmarkId: stig.benchmarkId,
              qtip: stig.title
            })
            )
            cb(content, { status: true })
            return
          }
      
          // Package-STIGs node
          match = node.match(/(\d+)-stigs-node/)
          if (match) {
            let packageId = match[1]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/packages/${packageId}`,
              method: 'GET',
              params: {
                projection: 'stigs'
              }
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.stigs.map(stig => ({
              packageId: packageId,
              text: stig.benchmarkId,
              packageName: r.name,
              packageId: packageId,
              report: 'stig',
              iconCls: 'sm-stig-icon',
              reqRar: r.reqRar,
              stigRevStr: stig.lastRevisionStr,
              id: `${packageId}-${stig.benchmarkId}-stigs-stig-node`,
              benchmarkId: stig.benchmarkId,
              qtip: stig.title
            })
            )
            cb(content, { status: true })
            return
          }
          // Package-STIGs-Asset node
          match = node.match(/(\d+)-(.*)-stigs-stig-node/)
          if (match) {
            let packageId = match[1]
            let benchmarkId = match[2]
            let result = await Ext.Ajax.requestPromise({
              url: `${STIGMAN.Env.apiBase}/assets`,
              method: 'GET',
              params: {
                packageId: packageId,
                benchmarkId: benchmarkId,
                projection: 'stigs'
              }
            })
            let r = JSON.parse(result.response.responseText)
            let content = r.map(asset => ({
              id: `${packageId}-${asset.assetId}-${benchmarkId}-leaf`,
              text: asset.name,
              leaf: true,
              report: 'review',
              iconCls: 'sm-asset-icon',
              stigName: benchmarkId,
              assetName: asset.name,
              stigRevStr: asset.stigs[0].lastRevisionStr, // BUG: relies on exclusion of other assigned stigs from /assets
              assetId: asset.assetId,
              packageId: packageId,
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
        if (n.attributes.action == 'package-create') {
          let packageRootNode = n.parentNode
          let fp = new SM.PackageForm({
            btnText: 'Create',
            btnHandler: () => {
              let values = fp.getForm().getFieldValues()
              createPackage(values, curUser.userId)
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
      
        if (n.attributes.action == 'package-management') {
            addPackageManager(n.attributes.packageId, n.attributes.packageName)
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
