Ext.ns('SM.Acl')

SM.Acl.ResourceTreePanel = Ext.extend(Ext.tree.TreePanel, {
    initComponent: function() {
      const collectionId = this.collectionId
      const config = {
          autoScroll: true,
          bodyStyle: 'padding:5px;',
          minSize: 220,
          root: {
            nodeType: 'async',
            id: `${collectionId}-resource-root`,
            expanded: true
          },
          rootVisible: false,
          loader: new Ext.tree.TreeLoader({
            directFn: this.loadTree
          }),
          loadMask: {msg: ''},
          listeners: {
            beforeexpandnode: function (n) {
              n.loaded = false; // always reload from the server
            }
          }
      }
  
      Ext.apply(this, Ext.apply(this.initialConfig, config))
      this.superclass().initComponent.call(this)
    },
    loadTree: async function (node, cb) {
        try {
          let match
          // Root node
          match = node.match(/^(\d+)-resource-root$/)
          if (match) {
            const collectionId = match[1]
            const content = []
            content.push(
              {
                id: `${collectionId}-resource-collection-node`,
                node: 'collection',
                text: 'Collection',
                iconCls: 'sm-collection-icon',
                expanded: true,
                children: [
                  {
                    id: `${collectionId}-resource-stigs-node`,
                    node: 'stigs',
                    text: 'STIGs',
                    iconCls: 'sm-stig-icon'
                  },
                  {
                      id: `${collectionId}-resource-assets-node`,
                      node: 'assets',
                      text: 'Assets',
                      iconCls: 'sm-asset-icon'
                  },
                  {
                    id: `${collectionId}-resource-labels-node`,
                    node: 'labels',
                    text: 'Labels',
                    iconCls: 'sm-label-icon'
                  }
                ]
              }
            )
            cb(content, { status: true })
            return
          }
          // Collection-Assets node
          match = node.match(/^(\d+)-resource-assets-node$/)
          if (match) {
            const collectionId = match[1]
            const apiAssets = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/assets`,
              method: 'GET',
              params: {
                collectionId: collectionId
              }
            })
            const content = apiAssets.map(asset => ({
              id: `${collectionId}-${asset.assetId}-resource-assets-asset-node`,
              text: SM.he(asset.name),
              assetName: asset.name,
              node: 'asset',
              collectionId: collectionId,
              assetId: asset.assetId,
              iconCls: 'sm-asset-icon',
              qtip: SM.he(asset.name)
            }))
            cb(content, { status: true })
            return
          }
          // Collection-Assets-STIG node
          match = node.match(/^(\d+)-(\d+)-resource-assets-asset-node$/)
          if (match) {
            const collectionId = match[1]
            const assetId = match[2]
            const apiAsset = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/assets/${assetId}`,
              method: 'GET',
              params: {
                projection: 'stigs'
              }
            })
            const content = apiAsset.stigs.map(stig => ({
              id: `${collectionId}-${assetId}-${stig.benchmarkId}-resource-leaf`,
              text: SM.he(stig.benchmarkId),
              leaf: true,
              node: 'asset-stig',
              iconCls: 'sm-stig-icon',
              stigName: stig.benchmarkId,
              assetName: apiAsset.name,
              assetId: apiAsset.assetId,
              collectionId: collectionId,
              benchmarkId: stig.benchmarkId,
              qtip: `Rules: ${SM.he(stig.ruleCount)}`
            }))
            cb(content, { status: true })
            return
          }
      
          // Collection-STIGs node
          match = node.match(/^(\d+)-resource-stigs-node$/)
          if (match) {
            const collectionId = match[1]
            const apiStigs = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`,
              method: 'GET',
              // params: {
              //   projection: 'stigs'
              // }
            })
            const content = apiStigs.map( stig => ({
              collectionId: collectionId,
              text: SM.he(stig.benchmarkId),
              node: 'stig',
              iconCls: 'sm-stig-icon',
              id: `${collectionId}-${stig.benchmarkId}-resource-stigs-stig-node`,
              benchmarkId: stig.benchmarkId,
              qtip: `Assets: ${SM.he(stig.assetCount)}`
            }) )
            cb( content, { status: true } )
            return
          }
          // Collection-STIGs-Asset node
          match = node.match(/^(\d+)-(.*)-resource-stigs-stig-node$/)
          if (match) {
            const collectionId = match[1]
            const benchmarkId = match[2]
            const apiAssets = await Ext.Ajax.requestPromise({
                responseType: 'json',
                url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
              method: 'GET'
            })
            const content = apiAssets.map(asset => ({
              id: `${collectionId}-${benchmarkId}-${asset.assetId}-resource-leaf`,
              text: SM.he(asset.name),
              leaf: true,
              node: 'stig-asset',
              iconCls: 'sm-asset-icon',
              stigName: benchmarkId,
              assetName: asset.name,
              assetId: asset.assetId,
              collectionId: collectionId,
              benchmarkId: benchmarkId,
              qtip: SM.he(asset.name)
            }))
            cb(content, { status: true })
            return
          }

          // Collection-Labels node
          match = node.match(/^(\d+)-resource-labels-node$/)
          if (match) {
            const collectionId = match[1]
            const apiLabels = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/labels`,
              method: 'GET'
            })
            const content = apiLabels.map( label => ({
              collectionId: collectionId,
              label,
              text: SM.Manage.Collection.LabelTpl.apply(label),
              node: 'label',
              iconCls: 'sm-label-icon',
              id: `${collectionId}-${label.name}-resource-labels-label-node`,
              qtip: `Assets: ${SM.he(label.uses)}`
            }) )
            cb( content, { status: true } )
            return
          }
          // Collection-Labels-STIG node
          match = node.match(/^(\d+)-(.*)-resource-labels-label-node$/)
          if (match) {
            const collectionId = match[1]
            const label = this.attributes.label
            const apiStig = await Ext.Ajax.requestPromise({
              responseType: 'json',
              url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`,
              method: 'GET',
              params: {
                labelId: label.labelId
              }
            })
            const content = apiStig.map(stig => ({
              id: `${collectionId}-${label.labelName}-${stig.benchmarkId}-resource-leaf`,
              text: SM.he(stig.benchmarkId),
              leaf: true,
              node: 'label-stig',
              iconCls: 'sm-stig-icon',
              stigName: stig.benchmarkId,
              label,
              collectionId,
              benchmarkId: stig.benchmarkId,
              qtip: `Assets: ${SM.he(stig.assetCount)}`
            }))
            cb(content, { status: true })
            return
          }
        }
        catch (e) {
          SM.Error.handleError(e)
        }
    }
})
  
SM.Acl.ResourceAddBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      disabled: true,
      // height: 30,
      // width: 150,
      // margins: "0 10 10 10",
      // icon: 'img/right-arrow-16.png',
      iconCls: 'sm-add-assignment-icon',
      // iconAlign: 'right',
      // cls: 'x-btn-text-icon'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})
  
SM.Acl.ResourceRemoveBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const grid = this.grid
    const config = {
      disabled: true,
      // height: 30,
      // width: 150,
      // margins: "0 10 10 10",
      iconCls: 'sm-remove-assignment-icon',
      // icon: 'img/left-arrow-16.png',
      // iconAlign: 'left',
      // cls: 'x-btn-text-icon',
      listeners:{
      click: function(){
          const assigmentsToPurge = grid.getSelectionModel().getSelections()
          grid.getStore().remove(assigmentsToPurge)
        }
      }
}
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Acl.AssignedRulesGrid = Ext.extend(Ext.grid.EditorGridPanel, {
  initComponent: function() {
    const _this = this
    const assignmentStore = new Ext.data.JsonStore({
      fields: [
        'benchmarkId',
        'assetId',
        'assetName',
        'labelId',
        'labelName',
        'label',
        'access',
        {
          name: 'sorter',
          convert: (v, r) => {
            let value
            if (!r.assetName && !r.labelName && !r.benchmarkId) {
              value = '!!!Sorttop'
            }
            else {
              value = `${r.assetName ?? ''}${r.labelName ?? ''}${r.benchmarkId ?? ''}`.toLowerCase()
            }
            return value
          }
        }  
      ],
      root: this.root || '',
      sortInfo: {
          field: 'sorter',
          direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      idProperty: v => `${v.benchmarkId}-${v.assetName}-${v.labelName}`,
      listeners: {
        add: function(){
          // _this.setTitle('Asset-STIG Assignments (' + assignmentStore.getCount() + ')');
        }, 
        remove: function(){
          // _this.setTitle('Asset-STIG Assignments (' + assignmentStore.getCount() + ')');
          //==========================================================
          //DISABLE THE REMOVAL BUTTON AFTER EACH REMOVAL OF ASSIGMENTS
          //==========================================================
          _this.panel.removeButton.disable();
        } 
      }  
    })
    const selectionModel = new Ext.grid.RowSelectionModel({
      singleSelect: false,
      listeners: {
        rowselect: function(theSelModel, theRowIndex, therecord){
          _this.panel.removeButton.enable();
        },
        rowdeselect: function(theSelModel, theRowIndex, therecord){
          if (theSelModel.getCount()<1){
            //==============================================
            //WHEN THERE ARE NO MORE SELECTIONS, DISABLE THE 
            //"REMOVE ASSIGNMENTS" BUTTON
            //==============================================
            _this.panel.removeButton.disable();
          }
        }
      }
      
    })

    function renderResource (value, metadata, record) {
      let html = ''
      if (!record.data.assetName && !record.data.labelName && !record.data.benchmarkId) {
        html += `<div class="sm-collection-icon sm-cell-with-icon">Collection</div>`
      }
      if (record.data.assetName) {
        html += `<div class="sm-asset-icon sm-cell-with-icon">${record.data.assetName}</div>`
      }
      if (record.data.labelName) {
        html += `<div class="sm-label-icon sm-cell-with-icon">${SM.Manage.Collection.LabelTpl.apply(record.data.label)}</div>`
      }
      if (record.data.benchmarkId) {
        html += `<div class="sm-stig-icon sm-cell-with-icon">${record.data.benchmarkId}</div>`
      }
      return html
    }

    const accessData = [
      ['rw'],
      ['r']
    ]
    if (this.roleId === 1) {
      accessData.push(['none'])
    }

    const accessComboBox = new Ext.form.ComboBox({
      mode: 'local',
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['access'],
        data: accessData
      }),
      valueField:'access',
      displayField:'access',
      monitorValid: false,
      listeners: {
        select: function (combo,record,index) {
          if (combo.startValue !== combo.value ) {
            combo.fireEvent("blur");
          } 
        }
      },
      triggerAction: 'all'
    })

    const columns = [
      {
        header: `Resource`,
        dataIndex: 'sorter',
        sortable: true,
        width: 350,
        renderer: renderResource
      },
      {
        header: `Access`, 
        dataIndex: 'access',
        sortable: true,
        width: 100,
        editor: accessComboBox
      }
    ]

    const totalTextCmp = new SM.RowCountTextItem({ store: assignmentStore })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          gridBasename: 'Collection ACL',
          exportType: 'grid',
          iconCls: 'sm-export-icon',
          text: 'CSV',
          grid: this
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        totalTextCmp
      ]
    })

    const config = {
      name: 'access',
      isFormField: true,
      setValue: function(acl) {
        assignmentStore.loadData(acl.map(rule=>({
          benchmarkId: rule.benchmarkId,
          assetId: rule.asset?.assetId,
          assetName: rule.asset?.name,
          labelId: rule.label?.labelId,
          labelName: rule.label?.name,
          label: rule.label,
          access: rule.access
        })))
      },
      getValue: function() {
        let rules = [];
        assignmentStore.each(function(record){
          rules.push({
            benchmarkId: record.data.benchmarkId || undefined,
            assetId: record.data.assetId || undefined,
            labelId: record.data.labelId || undefined,
            access: record.data.access
          })
        })
        return rules
      },
      markInvalid: Ext.emptyFn,
      clearInvalid: Ext.emptyFn,
      isValid: function() { return true},
      disabled: false,
      getName: function() {return this.name},
      validate: function() { return true},
      // width: _this.width || 400,
      store: assignmentStore,
      view: new SM.ColumnFilters.GridView({
        emptyText: this.emptyText || 'No records to display',
        forceFit: true,
        markDirty: false
      }),
      stripeRows: true,
      sm: selectionModel,
      columns,
      bbar,
      listeners: {
        keydown: SM.CtrlAGridHandler
      }
    }
    
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Acl.Panel = Ext.extend(Ext.Panel, {
  // config: {collectionId, userId}
  initComponent: function() {
    const navTree = new SM.Acl.ResourceTreePanel({
      panel: this,
      title: 'Collection Resources',
      width: 300,
      collectionId: this.collectionId,
      listeners: {
        click: handleTreeClick
      }
    })

    function handleTreeClick (node) {
      switch (node.attributes.node){
        case 'collection':
        case 'stig':
        case 'stig-asset':
        case 'asset':
        case 'asset-stig':
        case 'label':
        case 'label-stig':
          addBtn.setDisabled(isTreeNodeInRulesGrid(node))
          break
        default:
          addBtn.disable()
          break
      }
    }

    function handleAddBtnItem(item) {
      const selectedNode = navTree.getSelectionModel().getSelectedNode()
      makeAssignment(selectedNode, item.access);
    }

    function makeAssignment(selectedNode, access) {
      const assignment = {
        benchmarkId:selectedNode.attributes.benchmarkId, 
        assetId:selectedNode.attributes.assetId, 
        assetName: selectedNode.attributes.assetName,
        labelId:selectedNode.attributes.label?.labelId, 
        labelName: selectedNode.attributes.label?.name,
        label: selectedNode.attributes.label,
        access
      }
      const store = assignedRulesGrid.getStore()
      store.loadData(assignment, true)
      store.sort(store.sortInfo.field, store.sortInfo.direction)
    }

    const assignedRulesGrid = new SM.Acl.AssignedRulesGrid({
      panel: this,
      roleId: this.roleId,
      title: `Assigned ACL`,
      flex: 1
    })

    function isTreeNodeInRulesGrid(node) {
      const candidateId = `${node.attributes.benchmarkId ?? 'undefined'}-${node.attributes.assetName ?? 'undefined'}-${node.attributes.label?.name ?? 'undefined'}`
      const record = assignedRulesGrid.store.getById(candidateId)
      return !!record
    }

    this.assignmentGrid = assignedRulesGrid

    const addBtnMenuItems = [
      {text: 'with Read/Write access', iconCls: 'sm-add-assignment-icon', access: 'rw', handler: handleAddBtnItem},
      {text: 'with Read Only access', iconCls: 'sm-add-assignment-icon', access: 'r', handler: handleAddBtnItem},
    ]
    if (this.roleId === 1) addBtnMenuItems.push({text: 'with No access', iconCls: 'sm-add-assignment-icon', access: 'none', handler: handleAddBtnItem})
    const addBtn = new SM.Acl.ResourceAddBtn({
      tree: navTree,
      margins: "10 0 10 0",
      text: 'Add',
      grid: assignedRulesGrid,
      menu: new Ext.menu.Menu({
        items: addBtnMenuItems
      })
    })
    this.addButton = addBtn

    const removeBtn = new SM.Acl.ResourceRemoveBtn({
      tree: navTree,
      text: 'Remove',
      grid: assignedRulesGrid
    })
    this.removeButton = removeBtn

    const buttonPanel = new Ext.Panel({
      bodyStyle: 'background-color:transparent;border:none',
      width: 100,
      layout: {
        type: 'vbox',
        pack: 'center',
        align: 'center',
        padding: "10 10 10 10"
      },
      items: [
        addBtn,
        removeBtn
      ]
    })

    const config = {
      bodyStyle: 'background:transparent;border:none',
      assignmentGrid: assignedRulesGrid,
      layout: 'hbox',
      anchor: '100% -130',
      layoutConfig: {
        align: 'stretch'
      },
      items: [ 
        navTree,
        buttonPanel,
        assignedRulesGrid
      ]
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Acl.showAccess = async function(collectionId, grantRecord) {
  try {
    async function onSave () {
      try {
        await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/${grantRecord.grantId}/acl`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json;charset=utf-8' },
          jsonData: assignmentPanel.assignmentGrid.getValue()
        })      
      }
      catch (e) {
        SM.Error.handleError(e)
      }
      finally {
        appwindow.close()
      }
    }

    const assignmentPanel = new SM.Acl.Panel({
        collectionId,
        roleId: grantRecord.roleId
    })

    const appwindow = new Ext.Window({
      title: `Access Control List for ${grantRecord.name}`,
      cls: 'sm-dialog-window sm-round-panel',
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
          handler: () => appwindow.close()
        },
        {
          text: 'Save',
          handler: onSave
        }
      ]
    })

    appwindow.show()

    const timeoutId = setTimeout(() => {
      assignmentPanel.assignmentGrid.view.scroller.mask('Getting ACL...')
    }, 250)
    const apiAccess = await Ext.Ajax.requestPromise({
      responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/grants/${grantRecord.grantId}/acl`,
        method: 'GET'
    })
    assignmentPanel.assignmentGrid.setValue(apiAccess.acl)
    assignmentPanel.assignmentGrid.setTitle(`ACL Rules, default access = ${apiAccess.defaultAccess}`)   
    clearTimeout(timeoutId)
    assignmentPanel.assignmentGrid.view.scroller.unmask()
  }
  catch (e) {
    SM.Error.handleError(e)
    assignmentPanel.assignmentGrid.view.scroller.unmask()
  }
}
