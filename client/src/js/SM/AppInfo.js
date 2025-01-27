Ext.ns("SM.AppInfo")
Ext.ns("SM.AppInfo.Collections")
Ext.ns("SM.AppInfo.MySql")
Ext.ns("SM.AppInfo.Requests")
Ext.ns("SM.AppInfo.Users")
Ext.ns("SM.AppInfo.Groups")
Ext.ns("SM.AppInfo.Nodejs")
Ext.ns("SM.AppInfo.ShareFile")

SM.AppInfo.numberFormat = new Intl.NumberFormat().format

SM.AppInfo.numberRenderer = function (value) {
    return value && value !== 0 ? SM.AppInfo.numberFormat(value) : `<span class="sm-render-zero">${value}</span>`
}

SM.AppInfo.usernameLookup = {}
SM.AppInfo.groupNameLookup = {}

SM.AppInfo.uptimeString = function uptimeString(uptime) {
  const days = Math.floor(uptime / 86400)
  uptime %= 86400
  const hours = Math.floor(uptime / 3600)
  uptime %= 3600
  const minutes = Math.floor(uptime / 60)
  const seconds = Math.floor(uptime % 60)
  return `${days}d ${hours}h ${minutes}m ${seconds}s`
}

SM.AppInfo.transformPreviousSchemas = function transform (input) {
  if (input.schema === 'stig-manager-appinfo-v1.1') {
    return input
  }
  // Before v1.1 (rbac-2), only "restricted" grants were reported, so the counts that get transformed here will not be directly comparable to v1.1 counts.
  if (input.schema === 'stig-manager-appinfo-v1.0') {
    return transform(transformV1_0(input))
  }
  // first version of appInfo had "stigmanVersion" property instead of "version"  
  if (input.stigmanVersion){
    return transform(transformV0_0(input))
  }
  // if neither version nor stigmanVersion, not a supported file.
  else{
    return false
  }  

  function transformV1_0(input) {
    const o = {}
    // shifts aclCount.users to aclCount.grants, creates grantId from userId and adds grantee object
    function transformCountsByCollection(collections) {
      const o = {}
      for (const id in collections) {
        const { aclCounts, grantCounts, ...keep } = collections[id]

          
        const grants = {}
        for (const grantId in aclCounts.users) {
          grants[grantId] = {
            grantId: grantId,
            grantee: {
              userId: grantId,
              groupId: null,
            },
            ...aclCounts.users[grantId]
          }
        }

        o[id] = {
          grants,
          roleCounts: grantCounts,
          ...keep
        }
        
      }
      return o
    }

    const v1_1 = {
      date: input.date,
      schema: 'stig-manager-appinfo-v1.1',
      version: input.version,
      collections: transformCountsByCollection(input.collections),
      requests: input.requests,
      users: input.users,
      groups: {},
      mysql: input.mysql,
      nodejs: input.nodejs
    }

    return v1_1

  }

  function transformV0_0(input) {
    // renames properties "assetStigByCollection" and "restrictedGrantCountsByUser"
    function transformCountsByCollection(i) {
      const o = {}
      const padLength = Object.keys(i).at(-1).length
      for (const id in i) {
        const { 
          assetStigByCollection, 
          restrictedGrantCountsByUser, 
          assetsTotal, 
          assetsDisabled, 
          ruleCnt, 
          reviewCntTotal, 
          reviewCntDisabled,
          labelCounts,
          ...keep } = i[id]

        // rename restrictedGrantCountsByUser properties to match aclCounts schema
        for (const userId in restrictedGrantCountsByUser) {
          restrictedGrantCountsByUser[userId].ruleCounts = {
            rw: restrictedGrantCountsByUser[userId].stigAssetCount,
            r: 0,
            none: 0
          }
          delete restrictedGrantCountsByUser[userId].stigAssetCount
        }

        // rename grantCounts properties
        const grantCounts = {
          restricted: keep.grantCounts.accessLevel1,
          full: keep.grantCounts.accessLevel2,
          manage: keep.grantCounts.accessLevel3,
          owner: keep.grantCounts.accessLevel4        
        }
        delete keep.grantCounts

        // rename labelCounts properties
        labelCounts.collectionLabels = labelCounts.collectionLabelCount
        delete labelCounts.collectionLabelCount
        labelCounts.labeledAssets = labelCounts.labeledAssetCount
        delete labelCounts.labeledAssetCount
        labelCounts.assetLabels = labelCounts.assetLabelCount
        delete labelCounts.assetLabelCount

        o[id] = {
          name: id.padStart(padLength, '0'),
          assets: assetsTotal - assetsDisabled,
          assetsDisabled,
          rules: ruleCnt,
          reviews: reviewCntTotal - reviewCntDisabled,
          reviewsDisabled: reviewCntDisabled,
          ...keep,
          assetStigRanges: transformAssetStigByCollection(assetStigByCollection),
          aclCounts: {
            users: restrictedGrantCountsByUser || {}
          },
          grantCounts,
          labelCounts,
          settings: {
            fields: {
              detail: {
                enabled: null,
                required: null
              },
              comment: {
                enabled: null,
                required: null
              }
            },
            status: {
              canAccept: null,
              resetCriteria: null,
              minAcceptGrant: null
            }

          }
        }
      }
      return o
    }

    // renames property "roles" and removes the string "other"
    function transformUserInfo(i) {
      const o = {}
      const padLength = Object.keys(i).at(-1).length
      for (const id in i) {
        const { roles, ...keep } = i[id]
        o[id] = {
          username: id.padStart(padLength, '0'),
            ...keep,
          privileges: roles?.filter(v => v !== 'other') || [],
          roles: {
            restricted: null,
            full: null,
            manage: null,
            owner: null
          }
        }
      }
      return o
    }

    // remove counts of the "other" string
    function transformUserPrivilegeCounts(i) {
      for (const category in i) {
        delete i[category].other
      }
      return i
    }

    // add count of privilege "none" to each category
    // must be called after transforming userInfo
    function addNoPrivilegeCount(i) {
      const dataTime = Math.floor(new Date(i.dateGenerated) / 1000)
      const thirtyDaysAgo = dataTime - (30 * 24 * 60 * 60)
      const ninetyDaysAgo = dataTime - (90 * 24 * 60 * 60)

      i.userPrivilegeCounts.overall.none = 0
      i.userPrivilegeCounts.activeInLast90Days.none = 0
      i.userPrivilegeCounts.activeInLast30Days.none = 0

      for (const userId in i.userInfo) {
        const user = i.userInfo[userId]
        if (user.privileges.length === 0) {
          i.userPrivilegeCounts.overall.none++
          // Update counts for the last 30 and 90 days based on lastAccess
          if (user.lastAccess >= ninetyDaysAgo) {
            i.userPrivilegeCounts.activeInLast90Days.none++
          }
          if (user.lastAccess >= thirtyDaysAgo) {
            i.userPrivilegeCounts.activeInLast30Days.none++
          }
        }
      }
    }

    function transformAssetStigByCollection(i) {
      i.range00 = i.assetCnt - (i.range01to05 + i.range06to10 + i.range11to15 + i.range16plus)
      delete i.assetCnt
      return i
    }

    const { operationIdStats, ...requestsKeep } = input.operationalStats
    for (const opId in operationIdStats) {
      operationIdStats[opId].errors = {}
    }

    input.userInfo = transformUserInfo(input.userInfo)
    addNoPrivilegeCount(input)
    transformUserPrivilegeCounts(input.userPrivilegeCounts)

    function parseNodeUptimeString(uptimeString) {
      const values = uptimeString.match(/\d+/g)
      return (parseInt(values[0]) * 86400) +
        (parseInt(values[1]) * 3600) +
        (parseInt(values[2]) * 60) +
        parseInt(values[3])
    }    

    const v1_0 = {
      date: input.dateGenerated,
      schema: 'stig-manager-appinfo-v1.0',
      version: input.stigmanVersion,
      collections: transformCountsByCollection(input.countsByCollection),
      requests: {
        ...requestsKeep,
        operationIds: operationIdStats
      },
      users: {
        userInfo: input.userInfo,
        userPrivilegeCounts: input.userPrivilegeCounts
      },
      mysql: {
        version: input.mySqlVersion,
        tables: input.dbInfo.tables,
        variables: input.mySqlVariablesRaw,
        status: input.mySqlStatusRaw
      },
      nodejs: {
        version: 'v0.0.0',
        uptime: parseNodeUptimeString(input.nodeUptime),
        os: {},
        environment: {},
        memory: input.nodeMemoryUsageInMb,
        cpus: []
      }
    }

    return v1_0
  }
}

SM.AppInfo.objectToRowsArray = function (obj, keyPropertyName) {
  const rows = []
  for (const prop of obj) {
    rows.push({[keyPropertyName]: prop, ...obj[prop]})
  }
  return rows
}

SM.AppInfo.KeyValueGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const valueColumnId = Ext.id()
    const fields = [
      'key',
      'value'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'key',
      sortInfo: {
        field: 'key',
        direction: 'ASC'
      }
    })

    const keyColumn = {
      ...{
        header: 'key',
        width: 100,
        dataIndex: 'key',
        sortable: true,
        filter: { type: 'string' }
      },
      ...this.keyColumnConfig
    }

    const valueColumn = {
      ...{
        header: 'value',
        id: valueColumnId,
        dataIndex: 'value',
        sortable: true,
        align: 'right',
        renderer: v => {
          const rendered = SM.AppInfo.numberRenderer(v)
          return rendered === 'NaN' ? v : rendered
        }
      },
      ...this.valueColumnConfig
    }

    const columns = [
      keyColumn,
      valueColumn
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: this.forceFit ?? false,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'keys',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: this.rowCountNoun ?? 'key',
          iconCls: 'sm-circle-icon'
        })
      ]
    })

    function loadData(o) {
      const rows = []
      for (const key in o) {
        rows.push({ key, value: o[key] })
      }
      this.store.loadData(rows)
    }

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      autoExpandColumn: valueColumnId,
      autoExpandMax: 500,
      store,
      view,
      sm,
      columns,
      bbar,
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.JsonTreePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    let tree
    function loadData(data) {
      tree = JsonView.createTree(data)
      tree.isExpanded = true
      if (this.body) {
        this.body.dom.textContent = ''
        JsonView.render(tree, this.body.dom)
      }
    }
    function renderTree() {
      if (tree) {
        JsonView.render(tree, this.body.dom)
      }
    }

    const config = {
      bodyStyle: 'overflow-y:auto;',
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.on('render', renderTree)
  }
})

SM.AppInfo.Collections.OverviewGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'assets',
      'assetsDisabled',
      {
        name: 'assetsTotal',
        convert: (v, r) => r.assets + r.assetsDisabled
      },
      'uniqueStigs',
      'stigAssignments',
      'rules',
      'reviews',
      'reviewsDisabled',
      {
        name: 'reviewsTotal',
        convert: (v, r) => r.reviews + r.reviewsDisabled
      },
      'grants',
      {
        name: 'countOfGrants',
        convert: (v, r) => Object.keys(r.grants).length || 0
      }
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Collection",
        width: 180,
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "State",
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Assets",
        dataIndex: 'assets',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Disabled",
        dataIndex: 'assetsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Total",
        hidden: true,
        dataIndex: 'assetsTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "STIGs",
        dataIndex: 'uniqueStigs',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assignments",
        dataIndex: 'stigAssignments',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Rules",
        dataIndex: 'rules',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews",
        dataIndex: 'reviews',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Disabled",
        dataIndex: 'reviewsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Total",
        dataIndex: 'reviewsTotal',
        hidden: true,
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Grants",
        dataIndex: 'countOfGrants',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'collections',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'collection',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.FullGridLocked = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'assets',
      'assetsDisabled',
      {
        name: 'assetsTotal',
        convert: (v, r) => r.assets + r.assetsDisabled
      },
      'uniqueStigs',
      'stigAssignments',
      'rules',
      'reviews',
      'reviewsDisabled',
      {
        name: 'reviewsTotal',
        convert: (v, r) => r.reviews + r.reviewsDisabled
      },
      'grants',
      {
        name: 'countOfGrants',
        convert: (v, r) => Object.keys(r.grants).length || 0
      },
      {
        name: 'range00',
        mapping: 'assetStigRanges.range00'
      },
      {
        name: 'range01to05',
        mapping: 'assetStigRanges.range01to05'
      },
      {
        name: 'range06to10',
        mapping: 'assetStigRanges.range06to10'
      },
      {
        name: 'range11to15',
        mapping: 'assetStigRanges.range11to15'
      },
      {
        name: 'range16plus',
        mapping: 'assetStigRanges.range16plus'
      },
      {
        name: 'restricted',
        mapping: 'roleCounts.restricted'
      },
      {
        name: 'full',
        mapping: 'roleCounts.full'
      },
      {
        name: 'manage',
        mapping: 'roleCounts.manage'
      },
      {
        name: 'owner',
        mapping: 'roleCounts.owner'
      },
      {
        name: 'collectionLabels',
        mapping: 'labelCounts.collectionLabels'
      },
      {
        name: 'labeledAssets',
        mapping: 'labelCounts.labeledAssets'
      },
      {
        name: 'assetLabels',
        mapping: 'labelCounts.assetLabels'
      },
      {
        name: 'detailEnabled',
        mapping: 'settings.fields.detail.enabled'
      },
      {
        name: 'detailRequired',
        mapping: 'settings.fields.detail.required'
      },
      {
        name: 'commentEnabled',
        mapping: 'settings.fields.comment.enabled'
      },
      {
        name: 'commentRequired',
        mapping: 'settings.fields.comment.required'
      },
      {
        name: 'canAccept',
        mapping: 'settings.status.canAccept'
      },
      {
        name: 'resetCriteria',
        mapping: 'settings.status.resetCriteria'
      },
      {
        name: 'minAcceptGrant',
        mapping: 'settings.status.minAcceptGrant'
      }
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Name",
        locked: true,
        width: 180,
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "State",
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Assets",
        dataIndex: 'assets',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Disabled",
        dataIndex: 'assetsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Total",
        hidden: true,
        dataIndex: 'assetsTotal',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "STIGs",
        dataIndex: 'uniqueStigs',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assignments",
        dataIndex: 'stigAssignments',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Rules",
        dataIndex: 'rules',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews",
        dataIndex: 'reviews',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Disabled",
        dataIndex: 'reviewsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Reviews Total",
        dataIndex: 'reviewsTotal',
        hidden: true,
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Grants",
        dataIndex: 'countOfGrants',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },     
      {
        header: "Range 0",
        dataIndex: 'range00',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Range 1-5",
        dataIndex: 'range01to05',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Range 6-10",
        dataIndex: 'range06to10',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Range 11-15",
        dataIndex: 'range11to15',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Range 16+",
        dataIndex: 'range16plus',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Restricted",
        dataIndex: 'restricted',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Full",
        dataIndex: 'full',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Manage",
        dataIndex: 'manage',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Owner",
        dataIndex: 'owner',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Labels",
        dataIndex: 'collectionLabels',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Labeled",
        dataIndex: 'labeledAssets',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Tags",
        dataIndex: 'assetLabels',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Detail Enabled",
        dataIndex: 'detailEnabled',
        sortable: true
      },
      {
        header: "Detail Required",
        dataIndex: 'detailRequired',
        sortable: true
      },
      {
        header: "Comment Enabled",
        dataIndex: 'commentEnabled',
        sortable: true
      },
      {
        header: "Comment Required",
        dataIndex: 'commentRequired',
        sortable: true
      },
      {
        header: "Can Accept",
        dataIndex: 'canAccept',
        sortable: true
      },
      {
        header: "Reset Criteria",
        dataIndex: 'resetCriteria',
        sortable: true
      },
      {
        header: "Accept Grant",
        dataIndex: 'minAcceptGrant',
        sortable: true
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridViewLocking({
      emptyText: this.emptyText || 'No records to display',
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
    })

    const bbar = new Ext.Toolbar({
      items: [
        // {
        //   xtype: 'exportbutton',
        //   hasMenu: false,
        //   grid: this,
        //   gridBasename: this.exportName || this.title || 'collections',
        //   iconCls: 'sm-export-icon',
        //   text: 'CSV'
        // },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'collection',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      enableColLock: false,
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      colModel: new Ext.ux.grid.LockingColumnModel(columns),
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.GrantsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'grantee',
        mapping: 'grantee',
        convert: (v, r) => r.granteeName
      },
      {
        name: 'userId',
        mapping: 'grantee.userId',
        type: 'int'

      },
      {
        name: 'userGroupId', 
        mapping: 'grantee.userGroupId',
        type: 'int'
      },
      'uniqueAssets',
      'uniqueAssetsDisabled',
      'uniqueStigs',
      'uniqueStigsDisabled',
      {
        name: 'ruleCountRw',
        mapping: 'ruleCounts.rw'
      },
      {
        name: 'ruleCountR',
        mapping: 'ruleCounts.r'
      },
      {
        name: 'ruleCountNone',
        mapping: 'ruleCounts.none'
      },
      'role',
      'access'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'grantId',  // Change to use grantId as unique identifier
      sortInfo: {
        field: 'grantee',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "userId",
        hidden: true,
        dataIndex: 'userId',
        sortable: true,
      },
      {
        header: "userGroupId",
        hidden: true,
        dataIndex: 'userGroupId',
        sortable: true,
      },      
      {
        header: "Grantee",
        dataIndex: 'grantee',
        sortable: true,
        filter: { type: 'string' },
        renderer: function (v, m, r) {
          const icon = r.data.userId ? 'sm-user-icon' : 'sm-users-icon'
          return `<div class="${icon} sm-cell-with-icon">${v}</div>`
        }
      },
      {
        header: "Role",
        dataIndex: 'role',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Rules RW",
        dataIndex: 'ruleCountRw',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Rules R",
        dataIndex: 'ruleCountR',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Rules None",
        dataIndex: 'ruleCountNone',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets",
        dataIndex: 'uniqueAssets',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Assets Disabled",
        dataIndex: 'uniqueAssetsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "STIGs",
        dataIndex: 'uniqueStigs',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "STIGs Disabled",
        dataIndex: 'uniqueStigsDisabled',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'acls',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'Grant',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.AssetStigGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'range00',
      'range01to05',
      'range06to10',
      'range11to15',
      'range16plus'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "Collection",
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "State",
        hidden: true,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "0",
        dataIndex: 'range00',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "1-5",
        dataIndex: 'range01to05',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "6-10",
        dataIndex: 'range06to10',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "11-15",
        dataIndex: 'range11to15',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "16+",
        dataIndex: 'range16plus',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'collections',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'collection',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.RolesGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'restricted',
      'full',
      'manage',
      'owner'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "Collection",
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "State",
        hidden: true,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Restricted",
        width: 40,
        dataIndex: 'restricted',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Full",
        width: 40,
        dataIndex: 'full',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Manage",
        width: 40,
        dataIndex: 'manage',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Owner",
        width: 40,
        dataIndex: 'owner',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'collections',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'collection',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.LabelsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      'collectionLabels',
      'labeledAssets',
      'assetLabels'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "Collection",
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "State",
        hidden: true,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Labels",
        dataIndex: 'collectionLabels',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Labeled",
        dataIndex: 'labeledAssets',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Tags",
        dataIndex: 'assetLabels',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'collections',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'collection',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.SettingsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'collectionId',
        type: 'int'
      },
      'name',
      'state',
      {
        name: 'detailEnabled',
        mapping: 'fields.detail.enabled'
      },
      {
        name: 'detailRequired',
        mapping: 'fields.detail.required'
      },
      {
        name: 'commentEnabled',
        mapping: 'fields.comment.enabled'
      },
      {
        name: 'commentRequired',
        mapping: 'fields.comment.required'
      },
      {
        name: 'canAccept',
        mapping: 'status.canAccept'
      },
      {
        name: 'resetCriteria',
        mapping: 'status.resetCriteria'
      },
      {
        name: 'minAcceptGrant',
        mapping: 'status.minAcceptGrant'
      }
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'collectionId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Id",
        hidden: true,
        dataIndex: 'collectionId',
        sortable: true,
      },
      {
        header: "Collection",
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "State",
        hidden: true,
        dataIndex: 'state',
        sortable: true,
        filter: { type: 'values' }
      },
      {
        header: "Detail Enabled",
        dataIndex: 'detailEnabled',
        sortable: true
      },
      {
        header: "Detail Required",
        dataIndex: 'detailRequired',
        sortable: true
      },
      {
        header: "Comment Enabled",
        dataIndex: 'commentEnabled',
        sortable: true
      },
      {
        header: "Comment Required",
        dataIndex: 'commentRequired',
        sortable: true
      },
      {
        header: "Can Accept",
        dataIndex: 'canAccept',
        sortable: true
      },
      {
        header: "Reset Criteria",
        dataIndex: 'resetCriteria',
        sortable: true
      },
      {
        header: "Accept Grant",
        dataIndex: 'minAcceptGrant',
        sortable: true
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      }
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      },
      getRowClass: record => record.data.state === 'disabled' ? 'sm-row-disabled' : ''
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'collections',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'collection',
          iconCls: 'sm-collection-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Collections.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    function loadData(data) {
      // expects just the collections property of the full object
      const overview = []
      const assetStig = []
      const roles = []
      const labels = []
      const settingRows = []
      for (const collectionId in data) {
        const { settings, assetStigRanges, roleCounts, labelCounts, name, ...rest } = data[collectionId]
        overview.push({ collectionId, name, ...rest })
        assetStig.push({ collectionId, name, ...assetStigRanges })
        roles.push({ collectionId, name, ...roleCounts })
        labels.push({ collectionId, name, ...labelCounts })
        settingRows.push({ collectionId, name, ...settings })
      }
      overviewGrid.store.loadData(overview)
      assetStigGrid.store.loadData(assetStig)
      rolesGrid.store.loadData(roles)
      labelsGrid.store.loadData(labels)
      settingsGrid.store.loadData(settingRows)
      grantsGrid.store.removeAll()

      const overviewLocked = []
      for (const collectionId in data) {
        overviewLocked.push({ collectionId, ...data[collectionId] })
      }
      fullGridLocked.store.loadData(overviewLocked)
    }

    function loadGrants(sm, index, record) {
      const data = record.data.grants
      const rows = []
      for (const grantId in data) {
        const grantData = data[grantId]
        rows.push({ 
          grantId: grantData.grantId, // Use the unique grantId
          granteeName: SM.AppInfo.usernameLookup[grantData.grantee.userId] || 
          SM.AppInfo.groupNameLookup[grantData.grantee.userGroupId],
          ...grantData 
        })
      }
      grantsGrid.store.loadData(rows)
    }    

    function syncGridsOnRowSelect(sm, rowIndex, e) {
      const sourceRecord = sm.grid.store.getAt(rowIndex)
      console.log(sourceRecord)
      for (const peeredGrid of peeredGrids) {
        if (sm.grid.title !== peeredGrid.title) {
          const destRecord = peeredGrid.store.getById(sourceRecord.id)
          const destIndex = peeredGrid.store.indexOf(destRecord)
          peeredGrid.selModel.suspendEvents()
          peeredGrid.selModel.selectRow(destIndex)
          peeredGrid.selModel.resumeEvents()
          peeredGrid.view.focusRow(destIndex)
        }
      }
      loadGrants(null, null, overviewGrid.store.getById(sourceRecord.id))
    }

    const overviewGrid = new SM.AppInfo.Collections.OverviewGrid({
      title: 'Overview',
      border: false,
      region: 'center',
      onRowSelect: syncGridsOnRowSelect,
      hideMode: 'offsets'
    })
    const fullGridLocked = new SM.AppInfo.Collections.FullGridLocked({
      title: 'All Fields',
      border: false,
      id: 'appinfo-locked',
      autoDestroy: false,
      onRowSelect: syncGridsOnRowSelect,
      hideMode: 'offsets'
    })

    const grantsGrid = new SM.AppInfo.Collections.GrantsGrid({
      title: 'Grants',
      border: false,
      collapsible: true,
      region: 'south',
      split: true,
      height: 240
    })
    const rolesGrid = new SM.AppInfo.Collections.RolesGrid({
      title: 'Roles',
      border: false,
      onRowSelect: syncGridsOnRowSelect,
      hideMode: 'offsets'
    })
    const labelsGrid = new SM.AppInfo.Collections.LabelsGrid({
      title: 'Labels',
      border: false,
      onRowSelect: syncGridsOnRowSelect,
      hideMode: 'offsets'
    })
    const assetStigGrid = new SM.AppInfo.Collections.AssetStigGrid({
      title: 'STIG Assignment Ranges',
      border: false,
      onRowSelect: syncGridsOnRowSelect,
      hideMode: 'offsets'
    })
    const settingsGrid = new SM.AppInfo.Collections.SettingsGrid({
      title: 'Settings',
      border: false,
      onRowSelect: syncGridsOnRowSelect,
      hideMode: 'offsets'
    })
    const peeredGrids = [fullGridLocked, overviewGrid, rolesGrid, labelsGrid, assetStigGrid, settingsGrid]
    const centerTp = new Ext.TabPanel({
      region: 'center',
      border: false,
      activeTab: 0,
      deferredRender: false,
      items: peeredGrids,
    })
    const config = {
      layout: 'border',
      items: [
        centerTp,
        grantsGrid
      ],
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.MySql.TablesGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'tableName',
      'rowCount',
      'tableRows',
      'tableCollation',
      'avgRowLength',
      'dataLength',
      'indexLength',
      'autoIncrement',
      'createTime',
      'updateTime'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'tableName',
      sortInfo: {
        field: 'tableName',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Table",
        width: 160,
        dataIndex: 'tableName',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "RowCount",
        dataIndex: 'rowCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "TableRows",
        dataIndex: 'tableRows',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Collation",
        hidden: true,
        dataIndex: 'tableCollation',
        sortable: true,
        align: 'right',
      },
      {
        header: "RowLengthAvg",
        dataIndex: 'avgRowLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "DataLength",
        dataIndex: 'dataLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "IndexLength",
        dataIndex: 'indexLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "AutoIncrement",
        dataIndex: 'autoIncrement',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Created",
        dataIndex: 'createTime',
        sortable: true,
        align: 'right',
      },
      {
        header: "Updated",
        dataIndex: 'updateTime',
        sortable: true,
        align: 'right',
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      forceFit: true,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'tables',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'table',
          iconCls: 'sm-database-icon'
        })
      ]
    })

    const config = {
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.MySql.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    function loadData(data) {
      // expects only mysql property from full appinfo object
      const tables = []
      for (const key in data.tables) {
        tables.push({ tableName: key, ...data.tables[key] })
      }
      tablesGrid.store.loadData(tables)
      variablesGrid.loadData(data.variables)
      statusGrid.loadData(data.status)
      const lengths = getTotalLengths(data.tables)
      const sep = '<span style="color:gray">&#xFF5C;</span>'
      tablesGrid.setTitle(`Tables ${sep} Data &thickapprox; ${formatBytes(lengths.data)}  ${sep} Indexes &thickapprox; ${formatBytes(lengths.index)}  ${sep} Version ${data.version} ${sep} Up ${SM.AppInfo.uptimeString(data.status.Uptime)} `)
    }

    function getTotalLengths(tables) {
      const lengths = {
        data: 0,
        index: 0
      }
      for (const table in tables) {
        lengths.data += tables[table].dataLength
        lengths.index += tables[table].indexLength
      }
      return lengths
    }

    function formatBytes(bytes, decimals = 2) {
      if (!+bytes) return '0 Bytes'
  
      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  
      const i = Math.floor(Math.log(bytes) / Math.log(k))
  
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }
  

    const tablesGrid = new SM.AppInfo.MySql.TablesGrid({
      title: ' ',
      border: false,
      cls: 'sm-round-panel',
      region: 'center'
    })

    const variablesGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Variables',
      border: false,
      flex: 1,
      margins: { top: 0, right: 5, bottom: 0, left: 0 },
      keyColumnConfig: { header: 'Variable', width: 200 },
      valueColumnConfig: { header: 'Value' },
      exportName: 'variables',
      rowCountNoun: 'variable'
    })

    const statusGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Status',
      border: false,
      flex: 1,
      margins: { top: 0, right: 0, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Variable', width: 200 },
      valueColumnConfig: { header: 'Value' },
      exportName: 'status',
      rowCountNoun: 'variable'
    })

    const childContainer = new Ext.Container({
      region: 'south',
      split: true,
      height: 300,
      layout: 'hbox',
      bodyStyle: 'background-color: transparent;',
      layoutConfig: {
        align: 'stretch',
      },
      items: [
        variablesGrid,
        statusGrid
      ]
    })

    const config = {
      layout: 'border',
      items: [
        tablesGrid,
        childContainer
      ],
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Requests.OperationsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'operationId',
      'totalRequests',
      'totalDuration',
      'minDuration',
      'maxDuration',
      'maxDurationUpdates',
      {
        name: 'averageDuration',
        convert: (v, r) => Math.round(r.totalDuration / r.totalRequests)
      },
      'elevatedRequests',
      'retried',
      'averageRetries',
      'totalReqLength',
      'minReqLength',
      'maxReqLength',
      'totalResLength',
      'minResLength',
      'maxResLength',
      'clients',
      'users',
      'projections',
      'errors',
      {
        name: 'errorCount',
        convert: (v, r) => Object.values(r.errors).reduce((a, v) => a+v, 0)
      }
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'operationId',
      sortInfo: {
        field: 'operationId',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: "Operation",
        width: 160,
        dataIndex: 'operationId',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: "Requests",
        dataIndex: 'totalRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Errors",
        dataIndex: 'errorCount',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Duration",
        dataIndex: 'totalDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "DurAvg",
        hidden: true,
        dataIndex: 'averageDuration',
        sortable: true,
        align: 'right',
      },
      {
        header: "DurMin",
        dataIndex: 'minDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "DurMax",
        dataIndex: 'maxDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "DurMaxUpdates",
        hidden: true,
        dataIndex: 'maxDurationUpdates',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Elevated",
        dataIndex: 'elevatedRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "Retried",
        dataIndex: 'retried',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "RetriesAvg",
        dataIndex: 'averageRetries',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ResLen",
        dataIndex: 'totalResLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ResLenMin",
        dataIndex: 'minResLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ResLenMax",
        dataIndex: 'maxResLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ReqLen",
        dataIndex: 'totalReqLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ReqLenMin",
        dataIndex: 'minReqLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: "ReqLenMin",
        dataIndex: 'maxReqLength',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: this.onRowSelect ?? Ext.emptyFn
      },
      grid: this
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'operations',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: 'operation',
          iconCls: 'sm-circle-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Requests.ProjectionsGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      'projection',
      'totalRequests',
      'minDuration',
      'maxDuration',
      'totalDuration',
      'averageDuration',
      'retried',
      'averageRetries'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'projection',
      sortInfo: {
        field: 'projection',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: 'Projection',
        width: 160,
        dataIndex: 'projection',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Requests',
        dataIndex: 'totalRequests',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Duration',
        dataIndex: 'totalDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'DurMin',
        dataIndex: 'minDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'DurMax',
        dataIndex: 'maxDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'DurationAvg',
        dataIndex: 'averageDuration',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Retried',
        dataIndex: 'retried',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'RetriesAvg',
        dataIndex: 'averageRetries',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'projections',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: this.rowCountNoun ?? 'projection',
          iconCls: 'sm-circle-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Requests.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    const operationsGrid = new SM.AppInfo.Requests.OperationsGrid({
      title: 'Operations',
      border: false,
      region: 'center',
      onRowSelect
    })
    const usersGrid = new SM.AppInfo.KeyValueGrid({
      title: 'User requests',
      border: false,
      margins: { top: 0, right: 5, bottom: 0, left: 0 },
      keyColumnConfig: { header: 'Username' },
      valueColumnConfig: { header: 'Requests' },
      width: 200,
      rowCountNoun: 'user'
    })
    const clientsGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Client requests',
      border: false,
      margins: { top: 0, right: 5, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Client' },
      valueColumnConfig: { header: 'Requests' },
      width: 200,
      rowCountNoun: 'client'
    })
    const errorsGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Errors',
      border: false,
      margins: { top: 0, right: 5, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Code' },
      valueColumnConfig: { header: 'Requests' },
      width: 200,
      rowCountNoun: 'error'
    })
    const projectionsGrid = new SM.AppInfo.Requests.ProjectionsGrid({
      title: 'Projections',
      border: false,
      flex: 1,
      margins: { top: 0, right: 0, bottom: 0, left: 5 }
    })

    function onRowSelect(sm, index, record) {
      const users = []
      const clients = []
      const errors= []
      const projections = []
      const data = record.data
      for (const userId in data.users) {
        users.push({ key: SM.AppInfo.usernameLookup[userId] || 'unknown', value: data.users[userId] })
      }
      for (const client in data.clients) {
        clients.push({ key: client, value: data.clients[client] })
      }
      for (const code in data.errors) {
        errors.push({ key: code, value: data.errors[code] })
      }
      for (const projection of Object.keys(data.projections)) {
        projections.push({ projection, ...data.projections[projection] })
      }
      usersGrid.store.loadData(users)
      clientsGrid.store.loadData(clients)
      errorsGrid.store.loadData(errors)
      projectionsGrid.store.loadData(projections)
    }

    const childContainer = new Ext.Container({
      region: 'south',
      split: true,
      height: 200,
      bodyStyle: 'background-color: transparent;',
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch',
      },
      items: [
        usersGrid,
        clientsGrid,
        errorsGrid,
        projectionsGrid
      ]
    })

    function loadData(data) {
      const nr = SM.AppInfo.numberRenderer
      const operationIds = []
      for (const key in data.operationIds) {
        operationIds.push({ operationId: key, ...data.operationIds[key] })
      }
      operationsGrid.store.loadData(operationIds)
      const sep = `<span style="color:gray">&#xFF5C;</span>`
      operationsGrid.setTitle(`API Operations ${sep} ${nr(data.totalRequests)} total requests, ${nr(data.totalApiRequests)} to API, duration ${nr(data.totalRequestDuration)}ms`)
      usersGrid.store.removeAll()
      clientsGrid.store.removeAll()
      errorsGrid.store.removeAll()
      projectionsGrid.store.removeAll()
    }

    const config = {
      layout: 'border',
      items: [
        operationsGrid,
        childContainer
      ],
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Users.InfoGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'userId',
        type: 'int'
      },
      'username',
      'created',
      'lastAccess',
      'privileges',
      {
        name: 'restricted',
        mapping: 'roles.restricted',
        useNull: true,
        type: 'int'
      },
      {
        name: 'full',
        mapping: 'roles.full',
        useNull: true,
        type: 'int'
      },
      {
        name: 'manage',
        mapping: 'roles.manage',
        useNull: true,
        type: 'int'
      },
      {
        name: 'owner',
        mapping: 'roles.owner',
        useNull: true,
        type: 'int'
      }
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'userId',
      sortInfo: {
        field: 'username',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: 'Username',
        dataIndex: 'username',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Id',
        dataIndex: 'userId',
        hidden: true,
        sortable: true,
      },
      {
        header: 'Last Access',
        dataIndex: 'lastAccess',
        sortable: true,
        align: 'right',
        renderer: v => v ? new Date(v * 1000).toISOString() : '-'
      },
      {
        header: 'Owner',
        dataIndex: 'owner',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Manage',
        dataIndex: 'manage',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Full',
        dataIndex: 'full',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Restricted',
        dataIndex: 'restricted',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Privileges',
        dataIndex: 'privileges',
        sortable: true,
        align: 'right',
        renderer: v => JSON.stringify(v)
      },
      {
        header: 'Created',
        dataIndex: 'created',
        sortable: true,
        align: 'right'
      }

    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'users',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: this.rowCountNoun ?? 'user',
          iconCls: 'sm-user-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Users.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    // expects just the value of appinfo.users
    function loadData(data) {
      const rows = []
      for (const key in data.userInfo) {
        rows.push({ userId: key, ...data.userInfo[key] })
      }
      infoGrid.store.loadData(rows)

      // setup the username lookup object
      SM.AppInfo.usernameLookup = {}
      for (const row of rows) {
        SM.AppInfo.usernameLookup[row.userId] = row.username
      }

      for (const key in data.userPrivilegeCounts) {
        privilegePropertyGridMap[key].loadData(data.userPrivilegeCounts[key])
      }
    }

    const privilegeGridOptions = {
      border: false,
      flex: 1,
      keyColumnConfig: { header: 'Privilege' },
      valueColumnConfig: { header: 'User count' },
      forceFit: true,
      exportName: 'overall',
      rowCountNoun: 'privilege'
    }

    const overallGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Privileges - Overall',
      margins: { top: 0, right: 5, bottom: 0, left: 0 },
      ...privilegeGridOptions
    })
    const last30Grid = new SM.AppInfo.KeyValueGrid({
      title: 'Privileges - Active last 30d',
      margins: { top: 0, right: 5, bottom: 0, left: 5 },
      ...privilegeGridOptions
    })
    const last90Grid = new SM.AppInfo.KeyValueGrid({
      title: 'Privileges - Active last 90d',
      margins: { top: 0, right: 0, bottom: 0, left: 5 },
      ...privilegeGridOptions
    })

    const privilegePropertyGridMap = {
      overall: overallGrid,
      activeInLast30Days: last30Grid,
      activeInLast90Days: last90Grid
    }

    const infoGrid = new SM.AppInfo.Users.InfoGrid({
      title: 'User details',
      border: false,
      region: 'center'
    })

    const privilegeContainer = new Ext.Container({
      region: 'south',
      split: true,
      height: 160,
      bodyStyle: 'background-color: transparent;',
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch',
      },
      border: false,
      items: [
        overallGrid,
        last30Grid,
        last90Grid
      ]
    })

    const config = {
      layout: 'border',
      items: [infoGrid, privilegeContainer],
      loadData,
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Groups.InfoGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const fields = [
      {
        name: 'userGroupId',
        type: 'int'
      },
      'name',
      'members',
      'created',
      {
        name: 'restricted',
        mapping: 'roles.restricted',
        useNull: true,
        type: 'int'
      },
      {
        name: 'full',
        mapping: 'roles.full',
        useNull: true,
        type: 'int'
      },
      {
        name: 'manage',
        mapping: 'roles.manage',
        useNull: true,
        type: 'int'
      },
      {
        name: 'owner',
        mapping: 'roles.owner',
        useNull: true,
        type: 'int'
      }
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'userGroupId',
      sortInfo: {
        field: 'name',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: 'Group Name',
        dataIndex: 'name',
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Id',
        dataIndex: 'userGroupId',
        hidden: true,
        sortable: true,
      },
      {
        header: 'User Count',
        dataIndex: 'members',
        sortable: true,
      },      
      {
        header: 'Owner',
        dataIndex: 'owner',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Manage',
        dataIndex: 'manage',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Full',
        dataIndex: 'full',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Restricted',
        dataIndex: 'restricted',
        sortable: true,
        align: 'right',
        renderer: SM.AppInfo.numberRenderer
      },
      {
        header: 'Created',
        dataIndex: 'created',
        sortable: true,
        align: 'right'
      }

    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'groups',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: this.rowCountNoun ?? 'group',
          iconCls: 'sm-users-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Groups.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    // expects just the value of appinfo.users
    function loadData(data) {
      const rows = []
      for (const key in data) {
        rows.push({ userGroupId: key, ...data[key] })
      }
      infoGrid.store.loadData(rows)

      // setup the groupName lookup object
      SM.AppInfo.groupNameLookup = {}
      for (const row of rows) {
        SM.AppInfo.groupNameLookup[row.userGroupId] = row.name
      }
    }

    const infoGrid = new SM.AppInfo.Groups.InfoGrid({
      title: 'Group details',
      border: false,
      region: 'center'
    })

    const config = {
      layout: 'border',
      items: [infoGrid],
      loadData,
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})


SM.AppInfo.Nodejs.CpusGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    // expects the nodejs.cpus array as data
    function loadData(data) {
      let index = 0
      const rows = data?.map(item => ({
        cpu: index++,
        ...item
      })) || []
      store.loadData(rows)
    }
    const fields = [
      {
        name: 'cpu',
        type: 'int'
      },
      'model',
      'speed'
    ]

    const store = new Ext.data.JsonStore({
      fields,
      root: '',
      idProperty: 'cpu',
      sortInfo: {
        field: 'cpu',
        direction: 'ASC'
      }
    })

    const columns = [
      {
        header: 'CPU',
        dataIndex: 'cpu',
        width: 15,
        sortable: true,
      },
      {
        header: 'Model',
        dataIndex: 'model',
        width: 60,
        sortable: true,
        filter: { type: 'string' }
      },
      {
        header: 'Speed (MHz)',
        dataIndex: 'speed',
        width: 25,
        align: 'right',
        sortable: true
      }
    ]

    const sm = new Ext.grid.RowSelectionModel({
      singleSelect: true
    })

    const view = new SM.ColumnFilters.GridView({
      emptyText: this.emptyText || 'No records to display',
      deferEmptyText: false,
      forceFit: true,
      markDirty: false,
      listeners: {
        filterschanged: function (view) {
          store.filter(view.getFilterFns())
        }
      }
    })

    const bbar = new Ext.Toolbar({
      items: [
        {
          xtype: 'exportbutton',
          hasMenu: false,
          grid: this,
          gridBasename: this.exportName || this.title || 'cpus',
          iconCls: 'sm-export-icon',
          text: 'CSV'
        },
        {
          xtype: 'tbfill'
        },
        {
          xtype: 'tbseparator'
        },
        new SM.RowCountTextItem({
          store,
          noun: this.rowCountNoun ?? 'cpu',
          iconCls: 'sm-cpu-icon'
        })
      ]
    })

    const config = {
      cls: this.cls ?? 'sm-round-panel',
      store,
      view,
      sm,
      columns,
      bbar,
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.Nodejs.Container = Ext.extend(Ext.Container, {
  initComponent: function () {
    // expects just the value of appinfo.nodejs
    function loadData(data) {
      const sep = '<span style="color:gray">&#xFF5C;</span>'
      envGrid.setTitle(`Environment ${sep} Version ${data.version} ${sep} up ${SM.AppInfo.uptimeString(data.uptime)}`)
      memoryGrid.loadData(data.memory)
      osGrid.loadData(data.os)
      cpusGrid.loadData(data.cpus)
      envGrid.loadData(data.environment)
    }

    const envGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Environment',
      border: false,
      region: 'center',
      keyColumnConfig: { header: 'Variable', width: 240 },
      valueColumnConfig: { header: 'Value', align: 'left', width: 370 },
      forceFit: true,
      exportName: 'environment',
      rowCountNoun: 'item'
    })
    const cpusGrid = new SM.AppInfo.Nodejs.CpusGrid({
      title: 'CPU',
      border: false,
      flex: 1,
      margins: { top: 0, right: 5, bottom: 0, left: 0 }
    })
    const memoryGrid = new SM.AppInfo.KeyValueGrid({
      title: 'Memory',
      border: false,
      flex: 1,
      margins: { top: 0, right: 5, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Key' },
      valueColumnConfig: { header: 'Value' },
      exportName: 'memory'
    })
    const osGrid = new SM.AppInfo.KeyValueGrid({
      title: 'OS',
      border: false,
      flex: 1,
      margins: { top: 0, right: 0, bottom: 0, left: 5 },
      keyColumnConfig: { header: 'Key' },
      valueColumnConfig: { header: 'Value', align: 'left' },
      exportName: 'os'
    })

    const panel = new Ext.Panel({
      region: 'south',
      split: true,
      height: 300,
      bodyStyle: 'background-color: transparent;',
      layout: 'hbox',
      layoutConfig: {
        align: 'stretch'
      },
      border: false,
      items: [
        cpusGrid,
        memoryGrid,
        osGrid,
      ]
    })

    const config = {
      layout: 'border',
      items: [envGrid, panel],
      loadData,
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.TabPanel = Ext.extend(Ext.TabPanel, {
  initComponent: function () {
    const collectionsContainer = new SM.AppInfo.Collections.Container({
      border: false,
      title: 'Collections',
      iconCls: 'sm-collection-icon'
    })

    const usersContainer = new SM.AppInfo.Users.Container({
      title: 'Users',
      iconCls: 'sm-user-icon'
    })

    const groupsContainer = new SM.AppInfo.Groups.Container({
      title: 'Groups',
      iconCls: 'sm-users-icon'
    })    

    const requestsContainer = new SM.AppInfo.Requests.Container({
      title: 'Requests',
      iconCls: 'sm-browser-icon'
    })

    const mysqlContainer = new SM.AppInfo.MySql.Container({
      title: 'MySQL',
      iconCls: 'sm-database-save-icon'
    })

    const nodejsContainer = new SM.AppInfo.Nodejs.Container({
      title: 'Node.js',
      iconCls: 'sm-nodejs-icon',
    })

    const jsonPanel = new SM.AppInfo.JsonTreePanel({
      title: 'JSON Tree',
      iconCls: 'sm-json-icon',
      layout: 'fit'
    })

    const items = [
      requestsContainer,
      collectionsContainer,
      usersContainer,
      groupsContainer,
      mysqlContainer,
      nodejsContainer,
      jsonPanel,
    ]

    function loadData(data) {
      // users and groups MUST be loaded first so the name lookup objects are built
      usersContainer.loadData(data.users)
      groupsContainer.loadData(data.groups)
      collectionsContainer.loadData(data.collections)
      requestsContainer.loadData(data.requests)
      mysqlContainer.loadData(data.mysql)
      nodejsContainer.loadData(data.nodejs)
      jsonPanel.loadData(data)

    }

    const config = {
      deferredRender: true,
      loadData,
      items
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.ShareFile.OptionsFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const collectionNames = new Ext.form.Checkbox({
      prop: 'collectionName',
      boxLabel: 'Replace each Collection name with its ID'
    })
    const userAndGroupNames = new Ext.form.Checkbox({
      prop: 'userAndGroupName',
      boxLabel: 'Replace each User and Group name with its ID'
    })
    const clientIds = new Ext.form.Checkbox({
      prop: 'clientId',
      boxLabel: 'Replace each Request clientId with a generated value'
    })
    const envvars = new Ext.form.Checkbox({
      prop: 'envvar',
      boxLabel: 'Exclude Node.js environment variables'
    })

    const items = [
      collectionNames,
      userAndGroupNames,
      clientIds,
      envvars
    ]

    function getValues() {
      const values = {}
      for (const item of items) {
        values[item.prop] = item.getValue()
      }
      return values
    }
    const config = {
      title: this.title || 'Options',
      defaults: {
        hideLabel: true,
        checked: true
      },
      autoHeight: true,
      items,
      getValues
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.ShareFile.Panel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const saveFn = this.onSaveShared || Ext.emptyFn
    const _this = this
    const fieldset = new SM.AppInfo.ShareFile.OptionsFieldSet()
    const button = new Ext.Button({
      style: 'float: right; margin-top: 6px;',
      cls: 'x-toolbar',
      text: 'Save for sharing',
      iconCls: 'sm-share-icon',
      handler: () => {
        const fieldsetValues = fieldset.getValues()
        if (_this.menu) _this.menu.hide()
        saveFn(fieldsetValues)
      }
    })
    const config = {
      border: false,
      autoWidth: true,
      items: [
        fieldset,
        button
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.SourceMessage = {
  header: 'Help the STIG Manager OSS project by sharing',
  text: 'The <span class="sm-share-icon">Save for Sharing</span> option can create a file without identifiers or compliance data. Mail to <span class="sm-email">RMF_Tools@us.navy.mil</span>'
}

SM.AppInfo.SourcePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const sourceDisplayField = new Ext.form.DisplayField({
      fieldLabel: 'Source',
      width: 330
    })
    const dateDisplayField = new Ext.form.DisplayField({
      fieldLabel: 'Date',
      width: 200
    })
    const versionDisplayField = new Ext.form.DisplayField({
      fieldLabel: 'Version',
      width: 200
    })

    const fieldContainer = new Ext.Container({
      layout: 'form',
      items: [
        sourceDisplayField,
        dateDisplayField,
        versionDisplayField
      ]
    })

    function loadData({ data, source }) {
      sourceDisplayField.setValue(source)
      dateDisplayField.setValue(data.dateGenerated ?? data.date)
      versionDisplayField.setValue(data.stigmanVersion ?? data.version)
    }

    const selectFileBtn = new Ext.ux.form.FileUploadField({
      buttonOnly: true,
      accept: '.json',
      webkitdirectory: false,
      multiple: false,
      style: 'width: 95px;',
      buttonText: `Load from file...`,
      buttonCfg: {
        icon: "img/upload.svg"
      },
      listeners: {
        fileselected: this.onFileSelected || Ext.emptyFn
      }
    })

    const saveSharedPanel = new SM.AppInfo.ShareFile.Panel({
      onSaveShared: this.onSaveShared
    })

    const saveSharedMenu = new Ext.menu.Menu({
      plain: true,
      style: 'padding: 10px;',
      items: saveSharedPanel
    })
    saveSharedPanel.menu = saveSharedMenu

    const tbar = new Ext.Toolbar({
      items: [
        selectFileBtn,
        '-',
        {
          text: 'Save to file',
          iconCls: 'sm-export-icon',
          handler: this.onSaveFull || Ext.emptyFn
        },
        '-',
        {
          text: 'Save for sharing',
          iconCls: 'sm-share-icon',
          menu: saveSharedMenu
        },
        '-',
        {
          text: 'Fetch from API',
          iconCls: 'icon-refresh',
          handler: this.onFetchFromApi || Ext.emptyFn
        },

      ]
    })

    const config = {
      layout: 'hbox',
      padding: '10px 10px 10px 10px',
      items: [
        fieldContainer,
        {
          xtype: 'container',
          tpl: new Ext.XTemplate(
            `<div class="sm-round-panel sm-appinfo-message">`,
            `<div style="font-weight:bold;text-align:center;padding-bottom:8px;">{header}</div>`,
            `<div>{text}</div>`,
            `</div>`
          ),
          data: SM.AppInfo.SourceMessage
        }
      ],
      tbar,
      loadData
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.AppInfo.fetchFromApi = async function () {
  return Ext.Ajax.requestPromise({
    responseType: 'json',
    url: `${STIGMAN.Env.apiBase}/op/appinfo`,
    params: {
      elevate: curUser.privileges.admin
    },
    method: 'GET'
  })
}

SM.AppInfo.generateSharable = function (data, options) {
  const kloned = SM.Klona(data)
  const { collections, requests, users, groups, nodejs } = kloned
  if (options.collectionName) {
    const padLength = Object.keys(collections).at(-1).length
    for (const id in collections) {
      collections[id].name = id.padStart(padLength, '0')
    }
  }
  if (options.userAndGroupName) {
    const padLengthUsers = Object.keys(users.userInfo).at(-1).length
    for (const id in users.userInfo) {
      users.userInfo[id].username = id.padStart(padLengthUsers, '0')
    }
    const padLengthGroups = Object.keys(groups).at(-1).length
    for (const id in groups) {
      groups[id].name = id.padStart(padLengthGroups, '0')
    }    
  }
  if (options.clientId) {
    obfuscateClients(requests.operationIds)
  }
  if (options.envvar) {
    delete nodejs.environment
  }
  return kloned

  function obfuscateClients(operationIds) {
    const obfuscationMap = {
      [STIGMAN.Env.oauth.clientId]: 'webapp'
    }
    let obfuscatedCounter = 1

    function getObfuscatedKey(client) {
      if (client === 'unknown' || client === 'webapp') {
        return client
      }
      if (!obfuscationMap[client]) {
        obfuscationMap[client] = `client${obfuscatedCounter++}`
      }
      return obfuscationMap[client]
    }

    for (const id in operationIds) {
      if (operationIds[id].clients) {
        const clients = operationIds[id].clients
        const newClients = {}
        for (const client in clients) {
          const obfuscatedName = getObfuscatedKey(client)
          newClients[obfuscatedName] = clients[client]
        }
        operationIds[id].clients = newClients
      }
    }
  }

}

SM.AppInfo.showAppInfoTab = async function (options) {
  const { treePath } = options
  const tab = Ext.getCmp('main-tab-panel').getItem(`appinfo-tab`)
  if (tab) {
    Ext.getCmp('main-tab-panel').setActiveTab(tab.id)
    return
  }

  let data = ''

  async function onFileSelected(uploadField) {
    try {
      thisTab.getEl().mask('Loading from file...')
      let input = uploadField.fileInput.dom
      const text = await input.files[0].text()
      data = SM.AppInfo.transformPreviousSchemas(SM.safeJSONParse(text))
      if (data) {
        sourcePanel.loadData({ data, source: input.files[0].name })
        tabPanel.loadData(data)
      }
      else {
        Ext.Msg.alert('Unrecognized data', 'The file contents could not be understood as Application information.')
      }
    }
    catch (e) {
      SM.Error.handleError(e)
    }
    finally {
      uploadField.reset()
      thisTab.getEl()?.unmask()
    }
  }

  async function onFetchFromApi() {
    try {
      thisTab.getEl().mask('Fetching from API...')
      data = await SM.AppInfo.fetchFromApi()
      sourcePanel.loadData({ data, source: 'API' })
      tabPanel.loadData(data)
    }
    finally {
      thisTab.getEl()?.unmask()
    }
  }

  function onSaveFull() {
    if (data) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
      downloadBlob(blob, SM.Global.filenameEscaped(`stig-manager-appinfo_${SM.Global.filenameComponentFromDate()}.json`))
    }
  }

  function onSaveShared(options) {
    console.log(options)
    const kloned = SM.AppInfo.generateSharable(data, options)
    console.log(kloned)
    const blob = new Blob([JSON.stringify(kloned)], { type: 'application/json' })
    downloadBlob(blob, SM.Global.filenameEscaped(`stig-manager-appinfo-shareable_${SM.Global.filenameComponentFromDate()}.json`))
  }

  function downloadBlob(blob, filename) {
    let a = document.createElement('a')
    a.style.display = "none"
    let url = window.URL.createObjectURL(blob)
    a.href = url
    a.download = filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url)
  }

  const sourcePanel = new SM.AppInfo.SourcePanel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
    title: 'Source',
    region: 'north',
    border: false,
    height: 145,
    onFileSelected,
    onFetchFromApi,
    onSaveFull,
    onSaveShared
  })


  const tabPanel = new SM.AppInfo.TabPanel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    region: 'center',
    border: false,
    activeTab: 0,
    listeners: {
      tabchange: function () {
        console.log('tabPanel event')
      }
    },
    flex: 1

  })

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'appinfo-tab',
    sm_treePath: treePath,
    iconCls: 'sm-info-circle-icon',
    bodyStyle: "background-color:transparent;",
    title: 'Application Info',
    closable: true,
    layout: 'vbox',
    layoutConfig: {
      align: 'stretch'
    },
    border: false,
    items: [sourcePanel, tabPanel]
  })
  thisTab.show()

  await onFetchFromApi()
}