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
      let match, collectionGrant
      // Root node
      match = node.match(/(\d+)-assignment-root/)
      if (match) {
        let collectionId = match[1]
        let content = [
          {
            id: `${collectionId}-assignment-assets-node`,
            node: 'assets',
            text: '<span style="font-weight: 600;">All Assets</span>',
            checked: false,
            expanded: true,
            iconCls: 'sm-asset-icon'
          }
        ]
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
            collectionId: collectionId,
            projection: 'adminStats'
          }
        })
        let apiAssets = JSON.parse(result.response.responseText)
        let content = apiAssets.map(asset => {
          const badgePercent = Math.round((asset.adminStats.acceptedCount / asset.adminStats.ruleCount) * 100)
          const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
          return {
            id: `${collectionId}-${asset.assetId}-assignment-assets-asset-node`,
            text: `${asset.name} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            // text: `${asset.name} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            node: 'asset',
            collectionId: collectionId,
            assetId: asset.assetId,
            assetName: asset.name,
            iconCls: 'sm-asset-icon',
            checked: this.ui.checkbox.checked,
            qtip: asset.name
          }
        })
        this.getOwnerTree().assetsNode = this
        cb(content, { status: true })
        return
      }
      // Collection-Assets-STIG node
      match = node.match(/(\d+)-(\d+)-assignment-assets-asset-node/)
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
            text: `${status.benchmarkId} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            leaf: true,
            node: 'asset-stig',
            iconCls: 'sm-stig-icon',
            stigName: status.benchmarkId,
            assetName: status.assetName,
            assetId: status.assetId,
            collectionId: collectionId,
            benchmarkId: status.benchmarkId,
            checked: this.ui.checkbox.checked
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
      match = node.match(/(\d+)-assignment-root/)
      if (match) {
        let collectionId = match[1]
        let content = [
          {
            id: `${collectionId}-assignment-stigs-node`,
            node: 'stigs',
            text: '<span style="font-weight: 600;">All STIGs</span>',
            checked: false,
            expanded: true,
            iconCls: 'sm-stig-icon'
          }
        ]
        cb(content, { status: true })
        return
      }

      // Collection-STIGs node
      match = node.match(/(\d+)-assignment-stigs-node/)
      if (match) {
        let collectionId = match[1]
        let result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/stigs`,
          method: 'GET'
        })
        let apiStigs = JSON.parse(result.response.responseText)
        result = await Ext.Ajax.requestPromise({
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/status`,
          method: 'GET'
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
        for (const stig of apiStigs) {
          const badgePercent = Math.round((stig.acceptedCount / (stig.ruleCount * stig.assetCount)) * 100)
          const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
          let stigNode = {
            id: `${collectionId}-${stig.benchmarkId}-assignment-stigs-stig-node`,
            text: `${stig.benchmarkId} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            node: 'stig',
            collectionId: collectionId,
            benchmarkId: stig.benchmarkId,
            iconCls: 'sm-stig-icon',
            checked: this.ui.checkbox.checked,
            qtip: stig.title
          }
          let assetNodes = []
          for (const status of benchmarkStatus[stig.benchmarkId]) {
            const badgePercent = Math.round((status.status.accepted.total / status.rules.total) * 100)
            const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
            assetNodes.push({
              id: `${collectionId}-${status.benchmarkId}-${status.assetId}-assignment-leaf`,
              text: `${status.assetName} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
              leaf: true,
              node: 'stig-asset',
              iconCls: 'sm-asset-icon',
              stigName: status.benchmarkId,
              assetName: status.assetName,
              assetId: status.assetId,
              collectionId: collectionId,
              benchmarkId: status.benchmarkId,
              checked: this.ui.checkbox.checked
            })
          }
          stigNode.children = assetNodes
          stigNodes.push(stigNode)
        }
        this.getOwnerTree().stigsNode = this
        cb(stigNodes, { status: true })
        const renderChildren = function () {
          this.renderChildren()
        }
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

SM.ExportsPanel = Ext.extend(Ext.Panel, {
  // config: {collectionId, userId}
  initComponent: function () {
    let me = this
    const navTree = new SM.ExportsAssetTree({
      panel: this,
      title: 'Collection Resources',
      width: 400,
      collectionId: this.collectionId
    })


    const config = {
      bodyStyle: 'background:transparent;border:none',
      exportsTree: navTree,
      layout: 'hbox',
      anchor: '100% -130',
      layoutConfig: {
        align: 'stretch'
      },
      items: [
        navTree
      ]
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.ExportsPanel.superclass.initComponent.call(this)
  }
})

async function showExportCklFiles(collectionId, collectionName, treebase = 'asset') {
  try {
    let appwindow

    const exportButton = new Ext.Button({
      text: 'Export',
      iconCls: 'sm-export-icon',
      disabled: true,
      handler: function () {
        let checklists = navTree.getChecked()
        appwindow.close()
        exportCklArchive( collectionName, checklists, true)
      }
    })

    let navTree
    if (treebase === 'asset') {
      navTree = new SM.ExportsAssetTree({
        panel: this,
        // title: 'Collection Resources',
        width: 400,
        flex: 1,
        collectionId: collectionId,
        listeners: {
          checkstateschanged: () => {
            let assetCount = Object.keys(navTree.getChecked()).length
            if (assetCount > 0) {
              exportButton.setDisabled(false)
              exportButton.setText(`Export ${assetCount} CKL file${assetCount > 1 ? 's' : ''}`)
            }
            else {
              exportButton.setDisabled( assetCount === 0)
              exportButton.setText('Export')
            }
          }
        }
      })
    }
    else {
      navTree = new SM.ExportsStigTree({
        panel: this,
        // title: 'Collection Resources',
        width: 400,
        flex: 1,
        collectionId: collectionId,
        listeners: {
          checkstateschanged: () => {
            let assetCount = Object.keys(navTree.getChecked()).length
            if (assetCount > 0) {
              exportButton.setDisabled(false)
              exportButton.setText(`Export ${assetCount} CKL file${assetCount > 1 ? 's' : ''}`)
            }
            else {
              exportButton.setDisabled( assetCount === 0)
              exportButton.setText('Export')
            }
          }
        }
      })
    }


    /******************************************************/
    // Form window
    /******************************************************/
    appwindow = new Ext.Window({
      title: 'Export CKL archive',
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
      buttonAlign: 'right',
      items: [
        {
          html: `<div class="sm-dialog-panel-title">Select ZIP members</div>
          <div class="sm-dialog-panel-text">One CKL file will be created for each unique Asset selected.</div>
          <div class="sm-dialog-panel-text">Badges: 
            <span class="sm-export-sprite sm-export-sprite-high">Accepted: &lt; 100%</span>
            <span class="sm-export-sprite sm-export-sprite-low">Accepted: 100%</span>
          </div>`,
          border: false
        },
        navTree
      ],
      buttons: [
        exportButton
      ]
    })
    appwindow.render(document.body)
    Ext.getBody().unmask();
    appwindow.show()
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
  try {
    const zip = new JSZip()
    initProgress("Exporting checklists", "Initializing...")
    if (multiStig) {
      const entries = Object.entries(checklists)
      const cklCount = entries.length
      let fetched = 0
      for (const [assetId, { assetName, benchmarkIds }] of entries) {
        let queryParams=""
        if (benchmarkIds.length !== 0) {
          queryParams = `?${benchmarkIds.map( b => 'benchmarkId=' + b).join('&')}`
        }
        updateProgress(fetched / cklCount, `Fetching CKL for ${assetName}`)
        updateStatusText(`Fetching checklist for ${assetName}: `, true)
        await window.keycloak.updateToken(10)
        const url = `${STIGMAN.Env.apiBase}/assets/${assetId}/checklists${queryParams}`
        let response = await fetch(url, {
          method: 'GET',
          headers: new Headers({
            'Authorization': `Bearer ${window.keycloak.token}`
          })
        })
        const contentDispo = response.headers.get("content-disposition")
        //https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
        const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
        console.log(filename)
        const blob = await response.blob()
        updateStatusText(`Fetched ${filename}`)
        fetched++
        zip.file(filename, blob)
      }
    }
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



