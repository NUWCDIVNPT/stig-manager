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
        this.getOwnerTree().fireEvent('treeloaded')
        return
      }
      // Collection-Assets-STIG node
      match = node.match(/^(\d+)-(\d+)-assignment-assets-asset-node$/)
      if (match) {
        let collectionId = match[1]
        let assetId = match[2]
        let apiMetrics = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary`,
          method: 'GET',
          params: {
            assetId
          }
        })
        let content = apiMetrics.map(item => {
          const badgePercent = Math.round((item.metrics.statuses.accepted / item.metrics.assessments) * 100)
          const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
          return {
            id: `${collectionId}-${assetId}-${item.benchmarkId}-assignment-leaf`,
            text: `${SM.he(item.benchmarkId)} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
            leaf: true,
            node: 'asset-stig',
            iconCls: 'sm-stig-icon',
            stigName: item.benchmarkId,
            assetName: item.name,
            assetId: item.assetId,
            collectionId: collectionId,
            benchmarkId: item.benchmarkId,
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
        const gridStigs = this.getOwnerTree().data
        const apiMetrics = await Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/metrics/summary`,
          method: 'GET',
          params: {
            benchmarkId: gridStigs.map( r => r.benchmarkId )
          }
        })
        let benchmarkStatus = {}
        for (const item of apiMetrics) {
          if (!benchmarkStatus[item.benchmarkId]) {
            benchmarkStatus[item.benchmarkId] = []
          }
          benchmarkStatus[item.benchmarkId].push(item)
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
          for (const item of benchmarkStatus[stig.benchmarkId]) {
            const badgePercent = Math.round((item.metrics.statuses.accepted / item.metrics.assessments) * 100)
            const badgeClass = badgePercent === 100 ? 'sm-export-sprite-low' : badgePercent >= 50 ? 'sm-export-sprite-medium' : 'sm-export-sprite-high'
            assetNodes.push({
              id: `${collectionId}-${item.benchmarkId}-${item.assetId}-assignment-leaf`,
              text: `${SM.he(item.name)} <span class="sm-export-sprite ${badgeClass}">${badgePercent}%</span>`,
              leaf: true,
              node: 'stig-asset',
              iconCls: 'sm-asset-icon',
              stigName: item.benchmarkId,
              assetName: item.name,
              assetId: item.assetId,
              collectionId: collectionId,
              benchmarkId: item.benchmarkId,
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
        this.getOwnerTree().fireEvent('treeloaded')
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
    let fpwindow
    // const maxExportToCollection = STIGMAN.apiDefinition.paths['/collections/{collectionId}/export-to/{dstCollectionId}'].post.requestBody.content['application/json'].schema.maxItems
    const {minItems, maxItems} = STIGMAN.apiDefinition.paths['/collections/{collectionId}/export-to/{dstCollectionId}'].post.requestBody.content['application/json'].schema
    const dstCollectionData = curUser.collectionGrants
    .filter(grant => grant.accessLevel >= 3 && grant.collection.collectionId != collectionId)
    .map(grant => [grant.collection.name, grant.collection.collectionId])
    
    const initialState = getInitialOptions(dstCollectionData)
    const zipRadio = new SM.Global.HelperRadio({
      boxLabel: 'Zip archive',
      name: 'exportTo',
      exportTo: 'zip',
      itemField: 'asset',
      checked: initialState.exportTo === 'zip',
      helpText: SM.TipContent.ExportOptions.ZipArchive
    })
    const collectionRadio = new SM.Global.HelperRadio({
      boxLabel: `Collection`,
      disabled: !(initialState.exportCollectionId),
      name: 'exportTo',
      exportTo: 'collection',
      checked: initialState.exportTo === 'collection',
      helpTpl: SM.TipContent.ExportOptions.CollectionTpl,
      helpData: {minItems, maxItems}
    })
    const exportToRadioGroup = new Ext.form.RadioGroup({
      fieldLabel: 'Export to',
      style: 'padding-top: 1px',
      columns: [100, 100],
      items: [
        zipRadio,
        collectionRadio
      ],
      listeners: {
        change: function (rg, checkedItem) {
          if (checkedItem.exportTo === 'zip') {
            collectionComboBox.hide()
            formatComboBox.show()
          }
          else {
            collectionComboBox.show()
            formatComboBox.hide()
          }
          checkStateHandler()
        }
      }
    })

    const collectionComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 160,
      hidden: initialState.exportTo === 'zip',
      fieldLabel: "Destination",
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: dstCollectionData
      }),
      valueField:'valueStr',
      displayField:'displayStr',
      value: initialState.exportCollectionId,
      monitorValid: false,
      triggerAction: 'all',
    })

    const formatComboBox = new Ext.form.ComboBox({
      mode: 'local',
      width: 110,
      fieldLabel: "Format",
      hidden: initialState.exportTo === 'collection',
      forceSelection: true,
      autoSelect: true,
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['displayStr', 'valueStr'],
        data: [
          ['CKL', 'ckl-mono'],
          ['CKL (multi-STIG)', 'ckl-multi'],
          ['CKLB', 'cklb-mono'],
          ['CKLB (multi-STIG)', 'cklb-multi'],
          ['XCCDF', 'xccdf']
        ]
      }),
      valueField:'valueStr',
      displayField:'displayStr',
      value: initialState.exportFormat,
      monitorValid: false,
      triggerAction: 'all',
    })

    const exportButton = new Ext.Button({
      text: 'Loading...',
      iconCls: 'sm-export-icon',
      disabled: true,
      handler: function () {
        saveOptions()
        const checklists = navTree.getCheckedForStreaming()
        if (exportToRadioGroup.getValue().exportTo === 'collection') {
          const dstCollectionId  = collectionComboBox.getValue()
          const dstCollectionName = collectionComboBox.findRecord.call(collectionComboBox, 'valueStr', dstCollectionId).data.displayStr
          SM.Exports.exportToCollection({
            collectionId,
            dstCollectionId,
            dstCollectionName,
            checklists
          })
          fpwindow.close()
        }
        else {
          fpwindow.close()
          SM.Exports.exportArchiveStreaming({
            collectionId,
            checklists, 
            format: formatComboBox.getValue()
          })
        }
      }
    })
    function checkStateHandler() {
      const assetCount = Object.keys(navTree.getCheckedForStreaming()).length
      let btnText = 'Export'
      if (assetCount < minItems || (assetCount > maxItems && collectionRadio.checked)) {
        btnText = assetCount < minItems ? `Assets < ${minItems}` : `Assets > ${maxItems}`
        exportButton.disable()
        exportButton.setIconClass('sm-alert-icon')
      }
      else {
        exportButton.enable()
        exportButton.setIconClass('sm-export-icon')
      }
      exportButton.setText(btnText)
    }
    function navTreeClick(node, e) {
      const one = 1
    }
    const treeConfig = {
      panel: this,
      width: 400,
      flex: 1,
      collectionId,
      data,
      selModel: new Ext.tree.MultiSelectionModel(),
      listeners: {
        checkstateschanged: checkStateHandler
      }
    }
    
    const navTree = treebase === 'asset' ? new SM.Exports.AssetTree(treeConfig) : new SM.Exports.StigTree(treeConfig)
    navTree.on('treeloaded', checkStateHandler)
    navTree.on('beforeclick', navTreeClick)
    /******************************************************/
    // Form window
    /******************************************************/
    fpwindow = new Ext.Window({
      title: 'Export results',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      hidden: true,
      width: 460,
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
          html: `<div class="sm-dialog-panel-title">Select Assets and STIGs</div>
          <div class="sm-dialog-panel-text">Badges: 
            <span class="sm-export-sprite sm-export-sprite-high">Accepted: &lt; 100%</span>
            <span class="sm-export-sprite sm-export-sprite-low">Accepted: 100%</span>
          </div>`,
          border: false
        },
        navTree
      ],
      listeners: {
        minimize: function() {
          const offset = 20
          fpwindow.mask.hide()
          const vpSize = Ext.getCmp('app-viewport').getSize()
          fpwindow.setPosition(vpSize.width - fpwindow.getWidth()- offset, vpSize.height - fpwindow.getHeight() - offset)
          fpwindow.minimized = true
        }
      },
      fbar: [
        { 
          xtype: 'form',
          labelWidth: 75,
          bodyStyle: 'padding:0 5px 0 15px;',
          border: false,
          items: [
            exportToRadioGroup,
            formatComboBox,
            collectionComboBox
          ]
        },
        '->',
        exportButton
      ]
    })
    fpwindow.render(Ext.getBody())
    fpwindow.show(document.body)

    // functions
    function getInitialOptions (dstCollectionData) {
      // default options
      let state = {
        exportTo: 'zip',
        exportFormat: 'ckl-mono',
      }
      // merge saved options
      const storage = SM.safeJSONParse(localStorage.getItem(`exportTo-${collectionId}`))
      if (storage) {
         state = {...state, ...storage}
      }
      state.exportCollectionId = dstCollectionData.map(data => data[1]).includes(state.exportCollectionId) ? 
        state.exportCollectionId : dstCollectionData[0]?.[1]
      state.exportTo = state.exportTo === 'collection' && dstCollectionData.length ? 'collection' : 'zip'
      return state
    }

    function saveOptions() {
      const state = {
        exportTo: zipRadio.checked ? 'zip' : 'collection',
        exportFormat: formatComboBox.getValue(),
        exportCollectionId: collectionComboBox.getValue()
      }
      localStorage.setItem(`exportTo-${collectionId}`, JSON.stringify(state))
    }

  }
  catch (e) {
    Ext.getBody().unmask()
    SM.Error.handleError(e)
  }
}

SM.Exports.exportArchiveStreaming = async function ({collectionId, checklists, format = 'ckl-mono'}) {

  function formatBytes(a, b = 2, k = 1024) { 
    const d = Math.floor(Math.log(a) / Math.log(k));
    return 0 == a ? "0 Bytes" : (a / Math.pow(k, d)).toFixed(b) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d] 
  }

  const url = {
    xccdf: `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/xccdf`,
    'ckl-multi': `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/ckl?mode=multi`,
    'ckl-mono': `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/ckl?mode=mono`,
    'cklb-multi': `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/cklb?mode=multi`,
    'cklb-mono': `${STIGMAN.Env.apiBase}/collections/${collectionId}/archive/cklb?mode=mono`
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

    // The fallback code below only executes if the service worker is broken, which probably means we have bigger issues
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
    const filename = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^\r\n"']*)['"]?;?/)[1]
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

SM.Exports.exportToCollection = async function ({collectionId, dstCollectionId, dstCollectionName, checklists, fpwindow}) {
  try {
    const progressPanel = new SM.CollectionClone.CloneProgressPanel()
    const vpSize = Ext.getCmp('app-viewport').getSize()
    const width = 420
    const height = 80
    const offset = 20
    const fpwindow = new Ext.Window({
      title: `Exporting to "${dstCollectionName}"`,
      closable: true,
      bodyStyle: 'padding:5px;',
      layout: 'fit',
      width,
      height,
      pageX: vpSize.width - width - offset,
      pageY: vpSize.height - height - offset,
      items: [progressPanel]
    })
    fpwindow.show()
    fpwindow.getTool('close').hide()

    progressPanel.pb.updateProgress(1, "Sending request")

    const url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/export-to/${dstCollectionId}`
    await window.oidcProvider.updateToken(10)
    const fetchInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.oidcProvider.token}`
      },
      body: JSON.stringify(checklists)     
    }
    const response = await fetch(url, fetchInit)
    if (!response.ok) {
      const json = await response.json()
      throw(new Error(`API responded with status ${response.status} ${JSON.stringify(json)}`))
    }
    const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(NDJSONStream())
    .getReader()

    let isDone = false
    let isError = false
    let haveResult = false
    let apiCollection
    const jsons = []
    do {
      const {value, done} = await reader.read()
      isDone = done
      if (value) {
        jsons.push(value)
        console.log(`chunk: ${JSON.stringify(value)}`)
        if (value.stage === 'result') {
          apiCollection = value.collection
          haveResult = true
        }
        if (fpwindow.isDestroyed) return
        if (value.status === 'error') {
          if (value.message === 'Unhandled error') {
            fpwindow.removeAll()
            fpwindow.setTitle(`Error exporting to "${dstCollectionName}"`)
            fpwindow.getTool('close').show()
            const errorPanel = new SM.CollectionClone.CloneErrorPanel({
              log: JSON.stringify(jsons, null, 2)
            })
            fpwindow.add(errorPanel)
            fpwindow.doLayout()
          }
          else {
            progressPanel.pb.updateProgress(1, value.message)
            progressPanel.pb.addClass('sm-pb-error')
            fpwindow.getTool('close').show()
          }
          isDone = true
          isError = true
        }
        else if (value.stage === 'prepare' || value.stage === 'assets') {
          const progress = (value.step-1)/value.stepCount
          progressPanel.pb.updateProgress(progress, value.message)
        }
        else if (value.stage === 'reviews') {
          const progress = value.reviewsExported/value.reviewsTotal
          progressPanel.pb.updateProgress(progress, `Exporting reviews (${value.reviewsExported.toLocaleString()} of ${value.reviewsTotal.toLocaleString()})`)
        }
        else if (value.stage === 'metrics') {
          const progress = value.metricsUpdated/value.metricsTotal
          progressPanel.pb.updateProgress(progress, `Updating metrics (${value.metricsUpdated.toLocaleString()} of ${value.metricsTotal.toLocaleString()})`)
        }
        else if (value.stage === 'commit') {
          progressPanel.pb.wait({
            text: 'Committing',
            animate: true,
            interval: 100
          })
        }
      }
    } while (!isDone)

    if (!fpwindow.isDestroyed && !isError) {
      fpwindow.removeAll()
      fpwindow.setTitle(`Export finished`)
      fpwindow.add(new SM.CollectionClone.PostClonePanel({ 
        btnHandler: function (btn) {
          const openMethod = btn.action === 'manage' ? addCollectionManager : SM.CollectionPanel.showCollectionTab
          openMethod({
            collectionId: dstCollectionId,
            collectionName: dstCollectionName,
            treePath: SM.Global.mainNavTree.getCollectionLeaf(dstCollectionId)?.getPath()
          })
          fpwindow.close()
        }
       }))
      fpwindow.getTool('close').show()
      fpwindow.doLayout()
    }

  }
  catch (e) {
    SM.Error.handleError(e)
  }

}




