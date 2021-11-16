SM.ExportsAssetTree = Ext.extend(Ext.tree.TreePanel, {
  initComponent: function () {
    let me = this
    let collectionId = this.collectionId
    let config = {
      layout: 'fit',
      autoScroll: true,
      bodyStyle: 'padding:5px;',
      minSize: 220,
      root: {
        nodeType: 'async',
        id: `${collectionId}-assignment-root`,
        checked: false,
        expanded: true
      },
      rootVisible: false,
      loader: new Ext.tree.TreeLoader({
        directFn: me.loadTree
      }),
      loadMask: 'Loading...',
      listeners: {
        checkchange: me.onCheckChange
      }
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.ExportsAssetTree.superclass.initComponent.call(this)
  },
  loadTree: async function (node, cb) {
    try {
      let match
      // Root node
      match = node.match(/^(\d+)-assignment-root$/)
      if (match) {
        let collectionId = match[1]
        let content = [
          {
            id: `${collectionId}-assignment-assets-node`,
            node: 'assets',
            text: '<span style="font-weight: 600;">All Assets</span>',
            checked: true,
            expanded: true,
            iconCls: 'sm-asset-icon'
          }
        ]
        cb(content, { status: true })
        return
      }
      // Collection-Assets node
      match = node.match(/^(\d+)-assignment-assets-node$/)
      if (match) {
        let collectionId = match[1]
        const gridAssets = this.ownerTree.data.filter( asset => asset.stigCount > 0 )
        let content = gridAssets.map(asset => {
          const badgePercent = Math.round(asset.acceptedPct)
          const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
          return {
            id: `${collectionId}-${asset.assetId}-assignment-assets-asset-node`,
            text: `${SM.he(asset.name)} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            node: 'asset',
            collectionId: collectionId,
            assetId: asset.assetId,
            assetName: asset.name,
            stigCount: asset.stigCount,
            iconCls: 'sm-asset-icon',
            checked: !!this.ui.checkbox.checked,
            qtip: SM.he(asset.name)
          }
        })
        this.getOwnerTree().assetsNode = this
        cb(content, { status: true })
        return
      }
      // Collection-Assets-STIG node
      match = node.match(/^(\d+)-(\d+)-assignment-assets-asset-node$/)
      if (match) {
        let collectionId = match[1]
        let assetId = match[2]
        let result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/status`,
          method: 'GET',
          params: {
            assetId: assetId
          }
        })
        let apiStatus = JSON.parse(result.response.responseText)
        let content = apiStatus.map(status => {
          const badgePercent = Math.round((status.status.accepted.total / status.rules.total) * 100)
          const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
          return {
            id: `${collectionId}-${assetId}-${status.benchmarkId}-assignment-leaf`,
            text: `${SM.he(status.benchmarkId)} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            leaf: true,
            node: 'asset-stig',
            iconCls: 'sm-stig-icon',
            stigName: status.benchmarkId,
            assetName: status.assetName,
            assetId: status.assetId,
            collectionId: collectionId,
            benchmarkId: status.benchmarkId,
            checked: !!this.ui.checkbox.checked
          }
        })
        cb(content, { status: true })
        return
      }
    }
    catch (e) {
      Ext.Msg.alert('Status', 'AJAX request failed in loadTree()');
    }
  },
  onCheckChange: function (node, checked) {
    const checkDescendents = function (node) {
      for (const child of node.childNodes) {
        child.ui.checkbox.checked = checked
        child.attributes.checked = checked
        child.ui.checkbox.indeterminate = false
        checkDescendents(child)
      }
    }

    // check/uncheck descendents
    checkDescendents(node)

    // traverse up from node
    // TODO: This will check parent if all children are indeterminate?
    let check = node
    while (check) {
      // find parent and siblings
      const parent = check.parentNode
      if (parent?.ui?.checkbox) { // root node won't have checkbox
        const siblingChecks = []
        let sibling = check
        while (sibling) {
          let status =  sibling.ui.checkbox.indeterminate ? 'indeterminate' : (sibling.ui.checkbox.checked ? 'checked' : 'unchecked')
          siblingChecks.push(status)
          sibling = sibling.nextSibling
        }
        sibling = check
        do {
          sibling = sibling.previousSibling
          if (sibling) {
            let status =  sibling.ui.checkbox.indeterminate ? 'indeterminate' : (sibling.ui.checkbox.checked ? 'checked' : 'unchecked')
            siblingChecks.push(status)
          }
        } while (sibling)
        const allChecked = siblingChecks.every(i => i === 'checked')
        const someChecked = siblingChecks.some(i => i === 'checked')
        const someUnchecked = siblingChecks.some(i => i === 'unchecked')
        const someIndeterminate = siblingChecks.some(i => i === 'indeterminate')
        parent.ui.checkbox.checked = allChecked
        parent.attributes.checked = allChecked
        parent.ui.checkbox.indeterminate = someIndeterminate || someChecked && someUnchecked
      }
      check = parent
    }
    this.fireEvent('checkstateschanged')
  },
  getChecked: function ( startNode ) {
    startNode = startNode || this.assetsNode || this.root
    var r = {}
    var f = function(){
        if (this === startNode) { 
          return true
        }
        if(this.ui?.checkbox?.checked && !this.ui?.checkbox?.indeterminate) {
          if (!r[this.attributes.assetId]) {
            r[this.attributes.assetId] = {
              assetName: this.attributes.assetName,
              benchmarkIds: []
            }
          }
          if (this.attributes.benchmarkId) {
            r[this.attributes.assetId].benchmarkIds.push(this.attributes.benchmarkId)
            return true
          }
          else {
            return false
          }
        }
        else if (!this.ui?.checkbox?.checked && !this.ui?.checkbox?.indeterminate) {
          return false
        }
    }
    startNode.cascade(f)
    return r
  }
})

SM.ExportsStigTree = Ext.extend(Ext.tree.TreePanel, {
  initComponent: function () {
    let me = this
    let collectionId = this.collectionId
    let config = {
      layout: 'fit',
      autoScroll: true,
      bodyStyle: 'padding:5px;',
      minSize: 220,
      root: {
        nodeType: 'async',
        id: `${collectionId}-assignment-root`,
        checked: false,
        expanded: true
      },
      rootVisible: false,
      loader: new Ext.tree.TreeLoader({
        directFn: me.loadTree,
        preloadChildren: true
      }),
      loadMask: 'Loading...',
      listeners: {
        checkchange: me.onCheckChange
      }
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.ExportsAssetTree.superclass.initComponent.call(this)
  },
  loadTree: async function (node, cb) {
    try {
      let match, collectionGrant
      // Root node
      match = node.match(/^(\d+)-assignment-root$/)
      if (match) {
        let collectionId = match[1]
        let content = [
          {
            id: `${collectionId}-assignment-stigs-node`,
            node: 'stigs',
            text: '<span style="font-weight: 600;">All STIGs</span>',
            checked: true,
            expanded: true,
            iconCls: 'sm-stig-icon'
          }
        ]
        cb(content, { status: true })
        return
      }

      // Collection-STIGs node
      match = node.match(/^(\d+)-assignment-stigs-node$/)
      if (match) {
        let collectionId = match[1]
        // let result = await Ext.Ajax.requestPromise({
        //   url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`,
        //   method: 'GET'
        // })
        // let apiStigs = JSON.parse(result.response.responseText)
        const gridStigs = this.getOwnerTree().data
        const result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/status`,
          method: 'GET',
          params: {
            benchmarkId: gridStigs.map( r => r.benchmarkId )
          }
        })
        let apiStatus = JSON.parse(result.response.responseText)
        let benchmarkStatus = {}
        for (const status of apiStatus) {
          if (!benchmarkStatus[status.benchmarkId]) {
            benchmarkStatus[status.benchmarkId] = []
          }
          benchmarkStatus[status.benchmarkId].push(status)
        }

        let stigNodes = []
        for (const stig of gridStigs) {
          // const badgePercent = Math.round((stig.acceptedCount / (stig.ruleCount * stig.assetCount)) * 100)
          const badgePercent = Math.round(stig.acceptedPct)
          const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
          let stigNode = {
            id: `${collectionId}-${stig.benchmarkId}-assignment-stigs-stig-node`,
            text: `${stig.benchmarkId} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            node: 'stig',
            collectionId: collectionId,
            benchmarkId: stig.benchmarkId,
            iconCls: 'sm-stig-icon',
            checked: !!this.ui.checkbox.checked,
            qtip: SM.he(stig.title)
          }
          let assetNodes = []
          for (const status of benchmarkStatus[stig.benchmarkId]) {
            const badgePercent = Math.round((status.status.accepted.total / status.rules.total) * 100)
            const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
            assetNodes.push({
              id: `${collectionId}-${status.benchmarkId}-${status.assetId}-assignment-leaf`,
              text: `${SM.he(status.assetName)} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
              leaf: true,
              node: 'stig-asset',
              iconCls: 'sm-asset-icon',
              stigName: status.benchmarkId,
              assetName: status.assetName,
              assetId: status.assetId,
              collectionId: collectionId,
              benchmarkId: status.benchmarkId,
              checked: !!this.ui.checkbox.checked,
            })
          }
          stigNode.children = assetNodes
          stigNodes.push(stigNode)
        }
        this.getOwnerTree().stigsNode = this
        cb(stigNodes, { status: true })

        const doPreload = function () {
          this.getOwnerTree().loader.doPreload(this)
          this.renderChildren()
        }
        this.cascade(doPreload)
        return
      }
    }
    catch (e) {
      Ext.Msg.alert('Status', 'AJAX request failed in loadTree()');
    }
  },
  onCheckChange: function (node, checked) {
    const checkDescendents = function (node) {
      for (const child of node.childNodes) {
        child.ui.checkbox.checked = checked
        child.attributes.checked = checked
        child.ui.checkbox.indeterminate = false
        checkDescendents(child)
      }
    }

    // check/uncheck descendents
    checkDescendents(node)

    // traverse up from node
    // TODO: This will check parent if all children are indeterminate?
    let check = node
    while (check) {
      // find parent and siblings
      const parent = check.parentNode
      if (parent?.ui?.checkbox) { // root node won't have checkbox
        const siblingChecks = []
        let sibling = check
        while (sibling) {
          let status =  sibling.ui.checkbox.indeterminate ? 'indeterminate' : (sibling.ui.checkbox.checked ? 'checked' : 'unchecked')
          siblingChecks.push(status)
          sibling = sibling.nextSibling
        }
        sibling = check
        do {
          sibling = sibling.previousSibling
          if (sibling) {
            let status =  sibling.ui.checkbox.indeterminate ? 'indeterminate' : (sibling.ui.checkbox.checked ? 'checked' : 'unchecked')
            siblingChecks.push(status)
          }
        } while (sibling)
        const allChecked = siblingChecks.every(i => i === 'checked')
        const someChecked = siblingChecks.some(i => i === 'checked')
        const someUnchecked = siblingChecks.some(i => i === 'unchecked')
        const someIndeterminate = siblingChecks.some(i => i === 'indeterminate')
        parent.ui.checkbox.checked = allChecked
        parent.attributes.checked = allChecked
        parent.ui.checkbox.indeterminate = someIndeterminate || someChecked && someUnchecked
      }
      check = parent
    }
    this.fireEvent('checkstateschanged')
  },
  getChecked: function ( startNode ) {
    startNode = startNode || this.stigsNode || this.root
    var r = {}
    var f = function(){
        if (this === startNode) { 
          return true
        }
        if (!this.attributes.assetId) {
          return true
        }
        if(this.ui?.checkbox?.checked && !this.ui?.checkbox?.indeterminate) {
          if (!r[this.attributes.assetId]) {
            r[this.attributes.assetId] = {
              assetName: this.attributes.assetName,
              benchmarkIds: []
            }
          }
          if (this.attributes.benchmarkId) {
            r[this.attributes.assetId].benchmarkIds.push(this.attributes.benchmarkId)
            return true
          }
          else {
            return false
          }
        }
        else if (!this.ui?.checkbox?.checked && !this.ui?.checkbox?.indeterminate) {
          return false
        }
    }
    startNode.cascade(f)
    return r
  }
})

async function showExportCklFiles(collectionId, collectionName, treebase = 'asset', data) {
  try {
    let appwindow

    const exportButton = new Ext.Button({
      text: 'Export',
      iconCls: 'sm-export-icon',
      disabled: false,
      handler: function () {
        let checklists = navTree.getChecked()
        let multickl = cb.checked
        appwindow.close()
        exportCklArchive( collectionName, checklists, multickl)
      }
    })

    function checkStateHandler() {
      const assetCount = Object.keys(navTree.getChecked()).length
      exportButton.setDisabled( assetCount === 0)
    }
    const treeConfig = {
      panel: this,
      // title: 'Collection Resources',
      width: 400,
      flex: 1,
      collectionId,
      data,
      listeners: {
        checkstateschanged: checkStateHandler
      }
    }
    
    const navTree = treebase === 'asset' ? new SM.ExportsAssetTree(treeConfig) : new SM.ExportsStigTree(treeConfig)

    /******************************************************/
    // Form window
    /******************************************************/
    appwindow = new Ext.Window({
      title: 'Export CKL archive',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      hidden: true,
      width: 450,
      height: 600,
      layout: 'vbox',
      layoutConfig: {
          align: 'stretch',
          pack: 'start',
          padding: '0 10 10 10',
      },
      plain: true,
      bodyStyle: 'padding:5px 5px 0 5px;',
      buttonAlign: 'left',
      items: [
        {
          html: `<div class="sm-dialog-panel-title">Select ZIP members</div>
          <div class="sm-dialog-panel-text">Badges: 
            <span class="sm-export-sprite sm-export-sprite-high">Accepted: &lt; 100%</span>
            <span class="sm-export-sprite sm-export-sprite-low">Accepted: 100%</span>
          </div>`,
          border: false
        },
        navTree
      ],
      fbar: [
        { 
          xtype: 'panel',
          border: false,
          html: `<div class="sm-dialog-panel-text" style="padding:12px;">
          <input type="checkbox" name="multi-ckl" id="multi-ckl" style="vertical-align: -2px;"/>
          <label for="multi-ckl">Export multi-STIG CKLs (one file per Asset).</label>
          </div>`
        },
        '->',
        exportButton
      ],
      // fbar: [{
      //   text: 'fbar Left'
      // },'->',{
      //     text: 'fbar Right'
      // }]

    })
    appwindow.show(document.body)
    const cb = appwindow.getEl().dom.querySelector('#multi-ckl')
  }
  catch (e) {
    if (typeof e === 'object') {
      if (e instanceof Error) {
        e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
      }
      else {
        e = JSON.stringify(e);
      }
    }
    alert(e)
    Ext.getBody().unmask()
  }
}

async function exportCklArchive(collectionName, checklists, multiStig) {

  async function getMultiStigCkls(checklists, zip) {
    const entries = Object.entries(checklists)
    let fetched = 0
    let cklCount = entries.length
    for (const [assetId, { assetName, benchmarkIds }] of entries) {
      let queryParams = ''
      if (benchmarkIds.length !== 0) {
        queryParams = `?${benchmarkIds.map( b => 'benchmarkId=' + b).join('&')}`
      }
      updateProgress(fetched / cklCount, `Fetching CKL for ${assetName}`)
      updateStatusText(`Fetching checklist for ${assetName}: `, true)
      await window.oidcProvider.updateToken(10)
      const url = `${STIGMAN.Env.apiBase}/assets/${assetId}/checklists${queryParams}`
      let response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
          'Authorization': `Bearer ${window.oidcProvider.token}`
        })
      })
      const contentDispo = response.headers.get("content-disposition")
      //https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
      const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
      console.log(filename)
      const blob = await response.blob()
      updateStatusText(`[OK]`)
      fetched++
      zip.file(filename, blob)
    }
  }

  async function getMonoStigCkls(checklists, zip) {
    const entries = Object.entries(checklists)
    let fetched = 0
    let cklCount = entries.length
    for (const [assetId, { assetName, benchmarkIds = [] }] of entries) {
      if (benchmarkIds.length === 0) {
        const result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/assets/${assetId}/stigs`,
          method: 'GET'
        })
        const apiAssetStigs = JSON.parse(result.response.responseText)
        benchmarkIds.push(...apiAssetStigs.map( assetStig => assetStig.benchmarkId))
      }
      cklCount += benchmarkIds.length
    }
    for (const [assetId, { assetName, benchmarkIds = [] }] of entries) {
      for (const benchmarkId of benchmarkIds) {
        updateProgress(fetched / cklCount, `Fetching CKL for ${assetName}/${benchmarkId}`)
        updateStatusText(`Fetching checklist for ${assetName}/${benchmarkId}: `, true)
        await window.oidcProvider.updateToken(10)
        const url = `${STIGMAN.Env.apiBase}/assets/${assetId}/checklists/${benchmarkId}/latest?format=ckl`
        let response = await fetch(url, {
          method: 'GET',
          headers: new Headers({
            'Authorization': `Bearer ${window.oidcProvider.token}`
          })
        })
        const contentDispo = response.headers.get("content-disposition")
        if (contentDispo) {
          //https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
          const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
          console.log(filename)
          const blob = await response.blob()
          updateStatusText(`[OK]`)
          fetched++
          zip.file(filename, blob)
        }
        else {
          updateStatusText(`Error: missing 'Content-Disposition'`)
        }
      }
    }
  }

  try {
    const zip = new JSZip()
    initProgress("Exporting checklists", "Initializing...")

    const getCkls = multiStig ? getMultiStigCkls : getMonoStigCkls
    await getCkls(checklists, zip)

    updateProgress(1, 'Generating Zip archive...')
    updateStatusText('Generating Zip archive...')
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6
      }
    }, (metadata) => {
      updateProgress(metadata.percent / 100, `Compressing ${metadata.currentFile}`)
    })
    updateProgress(1, 'Done')
    updateStatusText('Done')

    saveAs(blob, `${collectionName}.zip`)
  }
  catch (e) {
    alert(`${e.message}\n${e.stack}`)
  }
}



