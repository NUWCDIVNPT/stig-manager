// $Id: reviewTab.js 885 2018-02-20 16:26:08Z bmassey $

function getReviewItems() {
  let mainNavTree = new Ext.tree.TreePanel({
    region: 'west',
    id: 'reviews-nav-tree',
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
        id: 'reviews-nav-tree-separator-1',
        xtype: 'menuseparator'
      }
        , {
        id: 'open-hbss-control',
        text: 'Disable HBSS SCAP imports...',
        iconCls: 'sm-list-remove-16-icon'
      }
        , {
        id: 'reviews-nav-tree-separator-2',
        xtype: 'menuseparator'
      }
        , {
        id: 'unlock-all-package-reviews',
        text: 'Reset reviews...',
        iconCls: 'sm-unlock-icon'
      }
        , {
        id: 'reviews-nav-tree-separator-3',
        xtype: 'menuseparator'
      }
        , {
        id: 'unlock-package-stig-reviews',
        text: 'Reset reviews...',
        iconCls: 'sm-unlock-icon'
      }, {
        id: 'reviews-nav-tree-separator-4',
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
    width: 280,
    minSize: 220,
    root: {
      nodeType: 'async',
      id: 'stigman-root',
      expanded: true
    },
    rootVisible: false,
    loader: new Ext.tree.TreeLoader({
      directFn: loadTree
    }),
    loadMask: 'Loading...',
    listeners: {
      click: reviewsTreeClick,
      //dblclick: reviewsTreeClickNode,
      contextmenu: function (node, e) {
        //          Register the context node with the menu so that a Menu Item's handler function can access
        //          it via its parentMenu property.
        node.select();
        //===============================================
        //HIDE ALL BATCH RESET OPTIONS FROM THE ONSET
        //===============================================
        Ext.getCmp('open-package-review').hide();
        Ext.getCmp('open-poam-workspace').hide();
        Ext.getCmp('reviews-nav-tree-separator-1').hide();
        Ext.getCmp('open-hbss-control').hide();
        Ext.getCmp('reviews-nav-tree-separator-2').hide();
        Ext.getCmp('unlock-all-package-reviews').hide();
        Ext.getCmp('reviews-nav-tree-separator-3').hide();
        Ext.getCmp('unlock-package-stig-reviews').hide();
        Ext.getCmp('reviews-nav-tree-separator-4').hide();
        Ext.getCmp('unlock-package-asset-reviews').hide();

        if ((node.attributes.node === 'package' || node.attributes.report === 'stig' || node.attributes.report === 'asset') && (curUser.accessLevel === 3 || curUser.canAdmin)) {
          var c = node.getOwnerTree().contextMenu;
          c.contextNode = node;
          if (node.attributes.node == 'package') {
            Ext.getCmp('open-poam-workspace').show();   //Open Poam workspace
            Ext.getCmp('reviews-nav-tree-separator-1').show(); //Disable HBSS SCAP Imports
            Ext.getCmp('open-hbss-control').show();
            if (curUser.accessLevel === 3) { //Staff
              //===============================================
              //Include package-accessLevel reset options
              //===============================================
              Ext.getCmp('reviews-nav-tree-separator-2').show();
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
              Ext.getCmp('reviews-nav-tree-separator-3').show();
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
  })

  function onPackageCreate(package) {
    let newNode = {
      id: `${package.packageId}-package-node`,
      node: 'package',
      text: package.name,
      packageId: package.packageId,
      packageName: package.name,
      iconCls: 'sm-package-icon',
      reqRar: package.reqRar,
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
    let packageRoot = mainNavTree.getNodeById('packages-root')
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
  // Attach handlers for app events
  SM.Dispatcher.addListener('packagecreated', onPackageCreate)

  return [
    mainNavTree,
    {
      region: 'center',
      xtype: 'tabpanel',
      plugins: new Ext.ux.TabCloseOnMiddleClick(),
      id: 'reviews-center-tab',
      title: 'STIGManager',
      enableTabScroll: true,
      activeTab: 0,
      listeners: {
        beforetabchange: function (tabPanel, newTab, currentTab) {
          // For IE: Keep the panels in the same scroll position after tab changes
          if (Ext.isIE) {
            if (Ext.isDefined(currentTab)) {
              if (currentTab.sm_TabType == 'asset_review') {
                var vCur = currentTab.sm_GroupGridView;
                vCur.scrollTop = vCur.scroller.dom.scrollTop;
                vCur.scrollHeight = vCur.scroller.dom.scrollHeight;
              }
            }
            if (Ext.isDefined(newTab)) {
              if (newTab.sm_TabType == 'asset_review') {
                var vNew = newTab.sm_GroupGridView;
                if (Ext.isDefined(vNew.scroller)) {
                  setTimeout(function () {
                    vNew.scroller.dom.scrollTop = vNew.scrollTop + (vNew.scrollTop == 0 ? 0 : vNew.scroller.dom.scrollHeight - vNew.scrollHeight);
                  }, 100);
                }
              }
            }
          }
        }
      },
      items: []
    }
  ]
}

async function loadTree(node, cb) {
  try {
    let match, packageGrant
    let tree = Ext.getCmp('reviews-nav-tree')
    let nodeObj = tree.getNodeById(node)
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
            reqRar: package.reqRar,
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
}

function addReviewHome() {
  var idAppend = '-user-' + curUser.id;

  var statusChangesFields = Ext.data.Record.create([
    {
      name: 'assetId'
    }
    , {
      name: 'assetName',
      type: 'string'
    }
    , {
      name: 'ruleId',
      type: 'string'
    }
    , {
      name: 'groupId',
      type: 'string',
      sortType: sortGroupId
    }
    , {
      name: 'title',
      type: 'string'
    }
    , {
      name: 'benchmarkId',
      type: 'string'
    }
    , {
      name: 'revId',
      type: 'string'
    }
    , {
      name: 'packageName',
      type: 'string'
    }
    , {
      name: 'packageId',
      type: 'int'
    }
  ]);

  var statusChangesStore = new Ext.data.GroupingStore({
    //url: 'pl/getLastStatusChanges.pl',
    url: 'pl/getRejectedReviews.pl',
    // baseParams: {
    // rejectOnly: 1
    // },
    autoLoad: false,
    groupField: 'assetName',
    storeId: 'statusChangesStore' + idAppend,
    sortInfo: {
      field: 'benchmarkId',
      direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
    },
    reader: new Ext.data.JsonReader({
      fields: statusChangesFields,
      root: 'rows',
      idProperty: 'checkId'
    }),
    listeners: {
      load: function () {
        filterStatusChangesStore();
      }
    }
  });

  if (curUser.accessLevel !== 3) {
    var statusChangesGridTitle = 'Rejected reviews associated with ' + curUser.display;
  } else {
    var statusChangesGridTitle = 'Status changes';
  }

  var statusChangesGrid = new Ext.grid.GridPanel({
    id: 'statusChangesGrid' + idAppend,
    title: statusChangesGridTitle,
    store: statusChangesStore,
    flex: 1,
    stripeRows: true,
    loadMask: true,
    sm: new Ext.grid.RowSelectionModel({
      singleSelect: true
    }),
    view: new Ext.grid.GroupingView({
      enableGrouping: true,
      //forceFit: true,
      //autoFill: true,
      emptyText: 'No returned reviews.',
      hideGroupedColumn: true,
      deferEmptyText: false,
      groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "changes" : "change"]})'
    }),
    autoExpandColumn: 'statusChangesGrid-title' + idAppend,
    columns: [
      {
        header: "",
        width: 35,
        dataIndex: 'none',
        align: 'center',
        renderer: function () {
          return '<img src="img/rejected-16.png" width=12 height=12 ext:qtip="Returned">';
        }
      }
      , {
        id: 'statusChangesGrid-packageName' + idAppend,
        header: "Package",
        width: 170,
        dataIndex: 'packageName',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-assetName' + idAppend,
        header: "Asset",
        width: 120,
        dataIndex: 'assetName',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-benchmarkId' + idAppend,
        header: "STIG",
        width: 170,
        dataIndex: 'benchmarkId',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-groupId' + idAppend,
        header: "Group",
        width: 70,
        dataIndex: 'groupId',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-ruleId' + idAppend,
        header: "Rule",
        width: 95,
        dataIndex: 'ruleId',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-title' + idAppend,
        header: "Title",
        width: 100,
        dataIndex: 'title',
        sortable: true,
        align: 'left'
      }
    ],
    bbar: new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            statusChangesStore.load({
              callback: function (records, options, success) {
                if (success) {
                  var recordCount = records.length;
                  Ext.getCmp('reviewHome-html' + idAppend).update({
                    recordCount: recordCount
                  });
                }
              }
            });
          }
        }]
    }),
    tbar: new Ext.Toolbar({
      items: [
        // START Grouping control
        {
          xtype: 'buttongroup',
          title: 'Grouping',
          items: [
            {
              xtype: 'tbbutton',
              icon: 'img/security_firewall_on.png',
              tooltip: 'Group by STIG',
              toggleGroup: 'statusChangesGrid-groupBy',
              enableToggle: true,
              allowDepress: true,
              width: 20,
              handler: function (btn) {
                if (btn.pressed) {
                  Ext.getCmp('statusChangesGrid-expandButton').enable();
                  Ext.getCmp('statusChangesGrid-collapseButton').enable();
                  statusChangesGrid.getStore().groupBy('benchmarkId');
                } else {
                  Ext.getCmp('statusChangesGrid-expandButton').disable();
                  Ext.getCmp('statusChangesGrid-collapseButton').disable();
                  statusChangesGrid.getStore().clearGrouping();
                }
              }
            }, {
              xtype: 'tbbutton',
              icon: 'img/mycomputer1-16.png',
              tooltip: 'Group by asset',
              toggleGroup: 'statusChangesGrid-groupBy',
              enableToggle: true,
              allowDepress: true,
              pressed: true,
              width: 20,
              handler: function (btn) {
                if (btn.pressed) {
                  Ext.getCmp('statusChangesGrid-expandButton').enable();
                  Ext.getCmp('statusChangesGrid-collapseButton').enable();
                  statusChangesGrid.getStore().groupBy('assetName');
                } else {
                  Ext.getCmp('statusChangesGrid-expandButton').disable();
                  Ext.getCmp('statusChangesGrid-collapseButton').disable();
                  statusChangesGrid.getStore().clearGrouping();
                }
              }
            }, {
              xtype: 'tbseparator'
            }, {
              xtype: 'tbbutton',
              //icon: 'img/chevron.png',
              icon: 'img/minus-grey.png',
              id: 'statusChangesGrid-collapseButton',
              tooltip: 'Collapse all groups',
              width: 20,
              handler: function (btn) {
                statusChangesGrid.getView().collapseAllGroups();
              }
            }, {
              xtype: 'tbbutton',
              //icon: 'img/chevron_expand.png',
              icon: 'img/plus-grey.png',
              id: 'statusChangesGrid-expandButton',
              tooltip: 'Expand all groups',
              width: 20,
              handler: function (btn) {
                statusChangesGrid.getView().expandAllGroups();
              }
            }]
          // END Grouping control
        }, {
          // START Filter control
          xtype: 'buttongroup',
          title: 'Filtering',
          items: [
            {
              xtype: 'tbbutton',
              icon: 'img/security_firewall_on.png',
              tooltip: 'Filter by STIG id',
              toggleGroup: 'statusChangesGrid-filterBy',
              enableToggle: true,
              allowDepress: true,
              pressed: false,
              width: 20,
              handler: function (btn) {
                var filterField = Ext.getCmp('statusChangesGrid-filterField');
                if (btn.pressed) {
                  filterField.enable();
                  statusChangesStore.filterField = 'benchmarkId';
                  if (filterField.getRawValue() == '') {
                    filterField.emptyText = 'Enter a STIG filter...';
                    filterField.setRawValue(filterField.emptyText);
                  } else {
                    filterField.emptyText = 'Enter a STIG filter...';
                  }
                  filterStatusChangesStore();
                } else {
                  filterField.disable();
                  //filterField.setValue('');
                  filterStatusChangesStore();
                }
              }
            }, {
              xtype: 'tbbutton',
              icon: 'img/mycomputer1-16.png',
              tooltip: 'Filter by asset name',
              toggleGroup: 'statusChangesGrid-filterBy',
              enableToggle: true,
              allowDepress: true,
              width: 20,
              handler: function (btn) {
                var filterField = Ext.getCmp('statusChangesGrid-filterField');
                if (btn.pressed) {
                  filterField.enable();
                  statusChangesStore.filterField = 'assetName';
                  if (filterField.getRawValue() == '') {
                    filterField.emptyText = 'Enter an asset filter...';
                    filterField.setRawValue(filterField.emptyText);
                  } else {
                    filterField.emptyText = 'Enter an asset filter...';
                  }
                  filterStatusChangesStore();
                } else {
                  filterField.disable();
                  //filterField.setValue('');
                  filterStatusChangesStore();
                }
              }
            }, {
              xtype: 'tbseparator'
            }, {
              xtype: 'trigger',
              fieldLabel: 'Filter',
              triggerClass: 'x-form-clear-trigger',
              onTriggerClick: function () {
                this.triggerBlur();
                this.blur();
                this.setValue('');
                filterStatusChangesStore();
              },
              id: 'statusChangesGrid-filterField',
              width: 140,
              submitValue: false,
              disabled: true,
              enableKeyEvents: true,
              emptyText: 'Filter string...',
              listeners: {
                keyup: function (field, e) {
                  filterStatusChangesStore();
                  return false;
                }
              }
            }
          ]
        }
      ]
    }),
    listeners: {
      rowdblclick: {
        fn: function (grid, rowIndex, e) {
          var r = grid.getStore().getAt(rowIndex);
          var idAppend, tab;
          if (curUser.accessLevel === 3) {
            idAppend = '-package_review-' + r.data.packageId + '-' + r.data.benchmarkId.replace(".", "_");
            tab = Ext.getCmp('packageReviewTab' + idAppend);
            if (Ext.isDefined(tab)) {
              tab.show();
            } else {
              fakeLeaf = new Object();
              fakeLeaf.benchmarkId = r.get('benchmarkId');
              fakeLeaf.revId = r.get('revId');
              fakeLeaf.packageId = r.get('packageId');
              fakeLeaf.packageName = r.get('packageName');
              //fakeLeaf.stigName = r.get('benchmarkId');
              addPackageReview(fakeLeaf, r.data.ruleId, r.data.assetId);
            }
          } else {
            idAppend = '-' + r.data.assetId + '-' + r.data.benchmarkId.replace(".", "_");
            tab = Ext.getCmp('reviewTab' + idAppend);
            if (Ext.isDefined(tab)) {
              tab.show();
              var groupGrid = Ext.getCmp('groupGrid' + idAppend);
              var resourcesTabs = Ext.getCmp('resources-tabs' + idAppend);
              var index = groupGrid.getStore().find('ruleId', r.data.ruleId);
              groupGrid.getSelectionModel().selectRow(index);

              if (Ext.isIE) { // delay necessary for IE?!
                setTimeout(function () {
                  var rowEl = groupGrid.getView().getRow(index);
                  //rowEl.scrollIntoView(groupGrid.getGridEl(), false);
                  rowEl.scrollIntoView();
                }, 100);
              } else {
                var rowEl = groupGrid.getView().getRow(index);
                //rowEl.scrollIntoView(groupGrid.getGridEl(), false);
                rowEl.scrollIntoView();
              }

              //groupGrid.getView().focusRow(index);

              resourcesTabs.setActiveTab('feedback-tab' + idAppend);
            } else {
              fakeLeaf = new Object();
              fakeLeaf.assetId = r.get('assetId');
              fakeLeaf.assetName = r.get('assetName');
              fakeLeaf.benchmarkId = r.get('benchmarkId');
              fakeLeaf.revId = r.get('revId');
              //fakeLeaf.stigName = r.get('benchmarkId');
              //Ext.getCmp('main-tabs').setActiveTab('tab-reviews');
              addReview(fakeLeaf, r.get('ruleId'), 'feedback-tab' + idAppend);
            }
          }
        }
      }
    }
  });

  function filterStatusChangesStore() {
    var value = Ext.getCmp('statusChangesGrid-filterField').getValue();
    var filterFunction = null;
    // if (Ext.getCmp('statusChangesGrid-ready-filterButton').pressed) {
    // filterFunction = filterReady;
    // }
    // if (Ext.getCmp('statusChangesGrid-reject-filterButton').pressed) {
    // filterFunction = filterReject;
    // }
    // if (Ext.getCmp('statusChangesGrid-approve-filterButton').pressed) {
    // filterFunction = filterApprove;
    // }

    if (value == '' || Ext.getCmp('statusChangesGrid-filterField').disabled) {
      if (filterFunction != null) {
        statusChangesStore.filterBy(filterFunction);
      } else {
        statusChangesStore.clearFilter();
      }
    } else {
      if (filterFunction != null) {
        statusChangesStore.filter([
          {
            property: statusChangesStore.filterField,
            value: value,
            anyMatch: true,
            caseSensitive: false
          }, {
            fn: filterFunction
          }
        ]);
      } else {
        statusChangesStore.filter({ property: statusChangesStore.filterField, value: value, anyMatch: true, caseSensitive: false });
      }
    }
  };

  function filterReady(record, sm) {
    return (record.get('newStatus') == 1);
  };
  function filterReject(record, sm) {
    return (record.get('newStatus') == 2);
  };
  function filterApprove(record, sm) {
    return (record.get('newStatus') == 3);
  };

  let section508link = ` <span class='cs-section-five-o-eight' onclick="alert('You have reached the Department of Defense (DoD) Accessibility Link, at which you may report issues of accessibility of DoD websites for persons with disabilities.\\n\\nIf your issue involves log in access, password recovery, or other technical issues, contact the administrator for the website in question, or your local helpdesk.\\n\\nThe U.S. Department of Defense is committed to making its electronic and information technologies accessible to individuals with disabilities in accordance with Section 508 of the Rehabilitation Act (29 U.S.C. 794d), as amended in 1998.\\n\\nFor persons with disabilities experiencing difficulties accessing content on a particular website, please email RSSDD-DODCIO.MailboxSection508@osd.smil.mil.  In your message, please indicate the nature of your accessibility problem, the website address of the requested content, and your contact information so we can address your issue.\\n\\nFor more information about Section 508 law, policies and resource guidance, please visit the DoD Section 508 website on NIPRNET (http://dodcio.defense.gov/DoDSection508.aspx) .  \\n\\nLast Updated:  04/30/2014')">Accessibility/Section 508</span>`
  let reviewsHomeTpl = new Ext.XTemplate(
    `<div class='cs-home-header-reviews'>Reviews Home${section508link}</div>`,
    // `<tpl if="recordCount == 0">`,
    `<div class=sm-reviews-home-no-tasks>`,
    `<div class='sm-reviews-home-body-title'>No returned reviews</div>`,
    `<div class='sm-reviews-home-body-text'>There are no returned reviews that require your attention.</div>`,
    `</div>`,
    // `</tpl>`,
    // `<tpl if="recordCount &gt; 0">`,
    // `<div class=sm-reviews-home-tasks>`,
    // `<div class='sm-reviews-home-body-title'>Returned reviews</div>`,
    // `<div class='sm-reviews-home-body-text'>There are returned reviews that require your attention.</div>`,
    // `</div>`,
    // `</tpl>`
  )

  var thisTab = Ext.getCmp('reviews-center-tab').add({
    id: 'reviewHome' + idAppend,
    sm_TabType: 'review_home',
    iconCls: 'sm-stig-icon',
    closable: false,
    title: 'Home',
    padding: 20,
    bodyCssClass: 'sm-reviews-home-background',
    autoScroll: true,
    layout: 'vbox',
    layoutConfig: {
      align: 'stretch',
      pack: 'start'
    },
    items: [
      {
        id: 'reviewHome-html' + idAppend,
        border: false,
        height: 180,
        tpl: reviewsHomeTpl,
        bodyCssClass: 'sm-reviews-home-background',
        listeners: {
          render: function () {
            Ext.getCmp('reviewHome-html' + idAppend).update({
              recordCount: 0
            });
          }
        }
      }
      , statusChangesGrid
    ]
  });

  thisTab.show();

  // statusChangesStore.load({
  // 	callback: function (records,options,success) {
  // 		if (success) {
  // 			var recordCount = records.length;
  // 			Ext.getCmp('reviewHome-html' + idAppend).update({
  // 				recordCount: recordCount
  // 			});
  // 		}
  // 	}
  // });


}; //end addReviewHome();

function reviewsTreeClick(n) {
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

}

function openPackageReview(n) {
  if (n.attributes.report === 'stig' && (curUser.accessLevel === 3 || curUser.canAdmin)) {
    var idAppend = '-package-' + n.attributes.packageId + '-' + n.attributes.benchmarkId.replace(".", "_");
    var tab = Ext.getCmp('reviews-center-tab').getItem('packageReviewTab' + idAppend);
    if (tab) {
      tab.show();
    } else {
      addPackageReview(n.attributes);
    }
  }
}

function openPoamWorkspace(n) {
  var conf = {};
  if (n.attributes.node == 'package') {
    conf.context = 'package';
    conf.idAppend = '-' + n.attributes.packageId;
  } else if (n.attributes.report == 'stig') {
    conf.context = 'stig';
    conf.idAppend = '-' + n.attributes.packageId + '-' + n.attributes.benchmarkId.replace(".", "_");
  }
  var tab = Ext.getCmp('reviews-center-tab').getItem('poamWorkspaceTab' + conf.idAppend);
  if (tab) {
    tab.show();
  } else {
    conf.attributes = n.attributes;
    addPoamWorkspace(conf);
  }
}

async function createPackage( packageObj, ownerId ) {
  try {
    packageObj.grants = [
      {
        userId: ownerId || curUser.userId,
        accessLevel: 4
      }
    ]
    let result = await Ext.Ajax.requestPromise({
      url: `${STIGMAN.Env.apiBase}/packages?elevate=${curUser.canAdmin}`,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      method: 'POST',
      jsonData: packageObj
    })
    let package = JSON.parse(result.response.responseText)

    SM.Dispatcher.fireEvent('packagecreated', package)

    addPackageManager( package.packageId, package.name )
  }
  catch (e) {
    alert (e.message)
  }

}

