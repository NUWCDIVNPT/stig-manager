Ext.ns('SM')

SM.AssignmentNavTree = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
      let me = this
      let collectionId = this.collectionId
      let config = {
          autoScroll: true,
          bodyStyle: 'padding:5px;',
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
            click: function (node) {
              me.treeClick(me, node)
            },
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
              assetName: apiAsset.name,
              assetId: apiAsset.assetId,
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
    treeClick: function (tree, node) {
      switch (node.attributes.node){
        case 'collection':
        case 'stig':
        case 'stig-asset':
        case 'asset':
        case 'asset-stig':
          tree.panel.addButton.enable();
          break;
        default:
          tree.panel.addButton.disable();
          break;
      }
    },
    makeAssignments: async function (selectedNode, grid) {
      async function assignCollection(theNode){
        //=======================================================================
        //Assigns the whole collection to a user
        //=======================================================================
        try {
          let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/assets/`,
            method: 'GET',
            params: { 
              elevate: `${curUser.privileges.canAdmin}`,
              collectionId: theNode.attributes.collectionId,
              projection: 'stigs'
            }
          })
          let assets = Ext.util.JSON.decode(result.response.responseText)
          let assignments = []
          assets.forEach(asset => {
            asset.stigs.forEach(stig => {
              assignments.push({
                benchmarkId: stig.benchmarkId,
                assetName: asset.name,
                assetId: asset.assetId
              })
            })
          })
          return assignments
        }
        catch(e) {
          alert(e.message)
        }
      }
      
      async function assignAsset(theNode, grid){
        //=======================================================
        // Assigns all of the STIGS of a specific Asset (in a)
        // specific collection to a user.
        //=======================================================
        try {
          let assetIdMatches = theNode.id.match(/\d+-(\d+)-assignment-assets-asset-node/);
          let assetId = assetIdMatches[1];
          let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
            method: 'GET',
            params: { 
              elevate: `${curUser.privileges.canAdmin}`,
              projection: 'stigs'
            }
          })
          let asset = Ext.util.JSON.decode(result.response.responseText)
          let assignments = asset.stigs.map(stig => ({
            benchmarkId: stig.benchmarkId,
            assetName: asset.name,
            assetId: assetId
          }))
          return assignments	
        }
        catch(e) {
          alert(e.message)
        }
      }	
      
      async function assignStig(theNode, grid){
        //=======================================================
        // Assigns all of the ASSETS associated to this STIG IN a
        // specific collection to a user.
        //=======================================================
        try {
          let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/assets/`,
            method: 'GET',
            params: { 
              elevate: `${curUser.privileges.canAdmin}`,
              collectionId: theNode.attributes.collectionId,
              benchmarkId: theNode.attributes.benchmarkId,
              projection: 'stigs'
            }
          })
          let assets = Ext.util.JSON.decode(result.response.responseText)
          let assignments = []
          assets.forEach(asset => {
            asset.stigs.forEach(stig => {
              assignments.push({
                benchmarkId: stig.benchmarkId,
                assetName: asset.name,
                assetId: asset.assetId
              })
            })
          })
          return assignments	
        }
        catch(e) {
          alert(e.message)
        }
      }

      try {
        let assignments
        switch (selectedNode.attributes.node){
            case 'collection':
              assignments = await assignCollection(selectedNode);
              break;
            case 'stig':
              assignments = await assignStig(selectedNode);
              break;
            case 'asset':
              assignments = await assignAsset(selectedNode);
              break;
            case 'asset-stig':
            case 'stig-asset':
              assignments = {
                benchmarkId:selectedNode.attributes.benchmarkId, 
                assetId:selectedNode.attributes.assetId, 
                assetName: selectedNode.attributes.assetName
              }
              break;
          }
          if (assignments) {
            grid.getStore().loadData(assignments, true);
          }
      }
      catch (e) {
        alert(e.message)
      }
    }
})
  
SM.AssignmentAddBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    let me = this
    let tree = this.tree
    let grid = this.grid
    let config = {
      disabled: true,
      height: 30,
      width: 150,
      margins: "10 10 10 10",
      icon: 'img/right-arrow-16.png',
      iconAlign: 'right',
      cls: 'x-btn-text-icon',
      listeners:{
        click: function(){
          const selectedNode = tree.getSelectionModel().getSelectedNode();
          tree.makeAssignments(selectedNode, grid);
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.AssignmentAddBtn.superclass.initComponent.call(this)
  }
})
  
SM.AssignmentRemoveBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    let me = this
    let tree = this.tree
    let grid = this.grid
    let config = {
      disabled: true,
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
  // config: { panel}
  initComponent: function() {
    let me = this
    let assignmentStore = new Ext.data.JsonStore({
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
      root: this.root || '',
      sortInfo: {
          field: 'assetName',
          direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      idProperty: v => `${v.benchmarkId}-${v.assetId}`,
      listeners: {
        add: function(){
          me.setTitle('Asset-STIG Assignments (' + assignmentStore.getCount() + ')');
        }, 
        remove: function(){
          me.setTitle('Asset-STIG Assignments (' + assignmentStore.getCount() + ')');
          //==========================================================
          //DISABLE THE REMOVAL BUTTON AFTER EACH REMOVAL OF ASSIGMENTS
          //==========================================================
          me.panel.removeButton.disable();
        } 
      }  
    })
    let selectionModel = new Ext.grid.RowSelectionModel({
      singleSelect: false,
      listeners: {
        rowselect: function(theSelModel, theRowIndex, therecord){
          me.panel.removeButton.enable();
        },
        rowdeselect: function(theSelModel, theRowIndex, therecord){
          if (theSelModel.getCount()<1){
            //==============================================
            //WHEN THERE ARE NO MORE SELECTIONS, DISABLE THE 
            //"REMOVE ASSIGNMENTS" BUTTON
            //==============================================
            me.panel.removeButton.disable();
          }
        }
      }
      
    })
    const config = {
      name: 'access',
      isFormField: true,
      setValue: function(stigAssets) {
        let assignmentData = stigAssets.map(stigAsset => ({
          benchmarkId: stigAsset.benchmarkId,
          assetId: stigAsset.asset.assetId,
          assetName: stigAsset.asset.name
        }))
        assignmentStore.loadData(assignmentData);
      },
      getValue: function() {
        let stigReviews = [];
        assignmentStore.each(function(record){
          stigReviews.push({
            benchmarkId: record.data.benchmarkId,
            assetId: record.data.assetId
          })
        })
        return stigReviews
      },
      markInvalid: function() {},
      clearInvalid: function() {},
      isValid: function() { return true},
      disabled: false,
      getName: function() {return this.name},
      validate: function() { return true},
      // width: me.width || 400,
      store: assignmentStore,
      view: new Ext.grid.GridView({
        emptyText: this.emptyText || 'No records to display',
        deferEmptyText: false,
        forceFit: true,
        markDirty: false
      }),
      stripeRows: true,
      sm: selectionModel,
      columns:[
        {
          header: `<img src="img/security_firewall_on.png" style="vertical-align: bottom;"> STIG`, 
          dataIndex: 'benchmarkId',
          sortable: true,
          width: 350
        },
        {
          header: `<img src="img/mycomputer1-16.png" style="vertical-align: bottom;"> Asset`, 
          dataIndex: 'assetName',
          sortable: true,
          width: 250
        }
      ]
      
    }
    
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.AssignmentGrid.superclass.initComponent.call(this)
  }
})

SM.AssignmentPanel = Ext.extend(Ext.Panel, {
  // config: {collectionId, userId}
  initComponent: function() {
    let me = this
    const navTree = new SM.AssignmentNavTree({
      panel: this,
      title: 'Collection Resources',
      width: 300,
      collectionId: this.collectionId
    })
    const assignGrid = new SM.AssignmentGrid({
      panel: this,
      title: 'Asset-STIG Assignments',
      flex: 1
    })
    this.assignmentGrid = assignGrid
    const addBtn = new SM.AssignmentAddBtn({
      tree: navTree,
      text: 'Add Assignment ',
      grid: assignGrid
    })
    this.addButton = addBtn
    const removeBtn = new SM.AssignmentRemoveBtn({
      tree: navTree,
      text: 'Remove Assignment ',
      grid: assignGrid
    })
    this.removeButton = removeBtn
    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      layout: {
        type: 'vbox',
        pack: 'center'//,
        //padding: "10 10 10 10"
      },
      items: [
        addBtn,
        removeBtn
      ]
    })

    const config = {
      bodyStyle: 'background:transparent;border:none',
      assignmentGrid: assignGrid,
      layout: 'hbox',
      anchor: '100% -130',
      layoutConfig: {
        align: 'stretch'
      },
      items: [ 
        navTree,
        buttonPanel,
        assignGrid
      ]
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.AssignmentPanel.superclass.initComponent.call(this)
  }
})

async function showUserAccess( collectionId, userId, username ) {
  try {
    let appwindow 
    let assignmentPanel = new SM.AssignmentPanel({
        collectionId: collectionId,
        userId: userId,
    })

      /******************************************************/
      // Form window
      /******************************************************/
      appwindow = new Ext.Window({
        title: 'Access Grants (ID: ' + userId + ')',
        modal: true,
        hidden: true,
        width: 900,
        height:600,
        layout: 'fit',
        plain:true,
        bodyStyle:'padding:20px;',
        buttonAlign:'right',
        items: assignmentPanel,
        buttons: [
          {
            text: 'Cancel',
            handler: function(){
              appwindow.close();
            }
          },
          {
            text: 'Save',
            formBind: true,
            id: 'submit-button',
            handler: async function() {
              try {
                let values = assignmentPanel.assignmentGrid.getValue()
                let url, method
                url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/${userId}/access`
                method = 'PUT'
                let result = await Ext.Ajax.requestPromise({
                  url: url,
                  method: method,
                  headers: { 'Content-Type': 'application/json;charset=utf-8' },
                  jsonData: values
                })
                userAccess = JSON.parse(result.response.responseText)
      
              }
              catch (e) {
                alert(e.message)
              }
              finally {
                appwindow.close()
              }
            }
          }
        ]
      })
      assignmentPanel.appwindow = appwindow
      appwindow.render(document.body)
      let result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/${userId}/access`,
          method: 'GET'
      })
      let apiUserAccess = JSON.parse(result.response.responseText)
      assignmentPanel.assignmentGrid.setValue(apiUserAccess)
              
      Ext.getBody().unmask();
      appwindow.show()
  }
  catch (e) {
      if(typeof e === 'object') {
          if (e instanceof Error) {
            e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
          }
          else {
            // payload = JSON.stringify(payload, null, 2);
            e = JSON.stringify(e);
          }
        }        
      alert(e)
      Ext.getBody().unmask()
  }	
} //end showAssetProps
