Ext.ns('SM.Exports')

SM.Exports.AssetTree = Ext.extend(Ext.tree.TreePanel, {
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
    SM.Exports.AssetTree.superclass.initComponent.call(this)
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
      SM.Error.handleError(e)
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
  },
  getCheckedForStreaming: function ( startNode ) {
    startNode = startNode || this.assetsNode || this.root
    var r = {}
    var f = function(){
        if (this === startNode) { 
          return true
        }
        const assetId = this.attributes.assetId
        const benchmarkId = this.attributes.benchmarkId
        if(this.ui?.checkbox?.checked && !this.ui?.checkbox?.indeterminate) {
          if (!r[assetId]) {
            r[assetId] = { assetId }
          }
          if (benchmarkId) {
            r[assetId].stigs = r[assetId].stigs || []
            r[assetId].stigs.push(benchmarkId)
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
    return Object.values(r)
  }
})

SM.Exports.StigTree = Ext.extend(Ext.tree.TreePanel, {
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
    SM.Exports.StigTree.superclass.initComponent.call(this)
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
      SM.Error.handleError(e)
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
  getCheckedForStreaming: function ( startNode ) {
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
              assetId: this.attributes.assetId
            }
          }
          if (this.attributes.benchmarkId) {
            r[this.attributes.assetId].stigs = r[this.attributes.assetId].stigs || []
            r[this.attributes.assetId].stigs.push(this.attributes.benchmarkId)
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
    return Object.values(r)
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

SM.Exports.showExportTree = async function (collectionId, collectionName, treebase = 'asset', data) {
  try {
    let appwindow

    const exportButton = new Ext.Button({
      text: 'Download',
      iconCls: 'sm-export-icon',
      disabled: false,
      handler: function () {

        const checklists = navTree.getCheckedForStreaming()
        appwindow.close()
        
        SM.Exports.exportArchiveStreaming({
          collectionId,
          checklists, 
          format: formatComboBox.getValue()
        })
      }
    })

    const formatComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Format",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['CKL', 'ckl-mono'],
          ['CKL (multi-STIG)', 'ckl-multi'],
          ['XCCDF', 'xccdf']
        ]
      }),
      valueField:'valueStr',
      displayField:'displayStr',
      value: localStorage.getItem('exportFormat') || 'ckl-mono',
      monitorValid: false,
      triggerAction: 'all',
      listeners: {
        select: function (combo, record, index) {
          localStorage.setItem('exportFormat', combo.getValue())
        }
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
    
    const navTree = treebase === 'asset' ? new SM.Exports.AssetTree(treeConfig) : new SM.Exports.StigTree(treeConfig)

    /******************************************************/
    // Form window
    /******************************************************/
    appwindow = new Ext.Window({
      title: 'Export results',
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
          xtype: 'form',
          labelWidth: 50,
          bodyStyle: 'padding:0 5px 0 15px;',
          border: false,
          items: [
            formatComboBox
          ]
        },
        '->',
        exportButton
      ]
    })
    appwindow.show(document.body)
  }
  catch (e) {
    Ext.getBody().unmask()
    SM.Error.handleError(e)
  }
}

SM.Exports.exportArchiveStreaming = async function ({collectionId, checklists, format = 'ckl-mono'}) {

  function formatBytes(a, b = 2, k = 1024) { 
    with (Math) { 
      let d = floor(log(a) / log(k));
      return 0 == a ? "0 Bytes" : (a / pow(k, d)).toFixed(b) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d] 
    }
  }

  const url = {
    xccdf: `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/xccdf`,
    'ckl-multi': `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/ckl?mode=multi`,
    'ckl-mono': `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/ckl?mode=mono`
  }

  try {
    await window.oidcProvider.updateToken(10)
    const fetchInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.oidcProvider.token}`
      },
      body: JSON.stringify(checklists)     
    }
    const href = await SM.ServiceWorker.getDownloadUrl({ url: url[format], ...fetchInit })
    if (href) {
      window.location = href
      return
    }

    let response = await fetch(url[format], fetchInit)
    const contentDisposition = response.headers.get("content-disposition")
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Request failed with status ${response.status}\n${body}`)
    }
    if (!contentDisposition) {
      throw new Error(`No Content-Disposition header in Response`)
    }
    initProgress("Downloading checklists", "Initializing...")
    updateStatusText(`When the stream has finished you will be prompted to save the data to disk. The final size of the archive is unknown during streaming.`, true)
    const filename = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
    const reader = response.body.getReader()
    let receivedLength = 0; // received that many bytes at the moment
    let chunks = []; // array of received binary chunks (comprises the body)
    while(true) {
      const {done, value} = await reader.read()
      if (done) {
        break
      }
      chunks.push(value)
      receivedLength += value.length
      updateProgress(0, `Fetched: ${formatBytes(receivedLength, 2)}`)
    }
    const blob = new Blob(chunks)
    updateStatusText(`\n\nStreaming is complete.`, true)
    saveAs(blob, filename)
  }
  catch (e) {
    SM.Error.handleError(e)
  }
}




