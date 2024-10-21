Ext.ns('SM.AppData')

SM.AppData.FormatComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
      const config = {
        fieldLabel: 'Format',
        displayField: 'display',
        valueField: 'value',
        triggerAction: 'all',
        mode: 'local',
        editable: false,
        value: 'gzip'
      }
      this.store = new Ext.data.SimpleStore({
        fields: ['value', 'display'],
        data: [
          ['gzip', 'GZip'],
          ['jsonl', 'JSONL']
        ]
      })

      Ext.apply(this, Ext.apply(this.initialConfig, config))
      this.superclass().initComponent.call(this)
  }
})

SM.AppData.DownloadButton = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      text: 'Download Application Data&nbsp;',
      iconCls: 'sm-export-icon',
      handler: this._handler
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);

  },
  _handler: async function () {
    try {
      await SM.AppData.doDownload(this.formatCombo.value)
    }
    catch (e) {
      SM.Error.handleError(e)
    }
    finally {
      Ext.getBody().unmask();
    }
  }
})

SM.AppData.ReplaceButton = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      text: 'Replace Application Data...&nbsp;',
      iconCls: 'sm-import-icon',
      handler: this._handler
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);

  },
  _handler: async function () {
    try {
      SM.AppData.doReplace()
    }
    catch (e) {
      SM.Error.handleError(e)
    }
    finally {
      Ext.getBody().unmask();
    }
  }
})

SM.AppData.ManagePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    this.formatCombo = new SM.AppData.FormatComboBox({
      width: 120
    })
    this.downloadBtn = new SM.AppData.DownloadButton({
      style: 'padding-top: 5px',
      formatCombo: this.formatCombo
    })
    this.replaceBtn = new SM.AppData.ReplaceButton({
      padding: 10
    })
    const config = {
      items: [
        {
          xtype: 'fieldset',
          labelWidth: 50,
          width: 200,
          title: 'Export',
          items: [
            this.formatCombo, 
            this.downloadBtn
          ]
        },
        {
          xtype: 'fieldset',
          width: 200,
          title: 'Import',
          items: [this.replaceBtn]
        }
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.AppData.ReplacePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    this.selectFileBtn = new Ext.ux.form.FileUploadField({
      buttonOnly: true,
      accept: '.gz, .jsonl',
      webkitdirectory: false,
      multiple: false,
      style: 'width: 95px;',
      buttonText: `Select appdata file...`,
      buttonCfg: {
        icon: "img/disc_drive.png"
      },
      listeners: {
        fileselected: this.onFileSelected
      }
    })
    this.textarea = new Ext.form.TextArea({
      buffer: '',
      anchor: '100%, -10',
      border: false,
      readOnly: true
    })
    this.progress = new Ext.ProgressBar({
      width: 300
    })

    this.actionButton = new Ext.Button({
      text: 'Replace Application Data',
      disabled: true,
      handler: this.btnHandler
    })

    const config = {
      layout: 'anchor',
      border: false,
      items: [this.textarea],
      tbar: [
        this.selectFileBtn,
        '->',
        this.progress
      ],
      buttons: [this.actionButton]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  },
  updateProgress: function (value, text) {
    this.progress.updateProgress(value, SM.he(text))
  },
  setProgressErrorState: function (isError) {
    if (isError) {
      this.progress.addClass('sm-pb-error')
    }
    else {
      this.progress.removeClass('sm-pb-error')
    }
  },
  updateStatusText: function (text, noNL = false, replace = false) {
    const ta = this.textarea
    if (replace) ta.buffer = ''
    if (noNL) {
      ta.buffer += text;
    } else {
      ta.buffer += text + "\n"
    }
    ta.setRawValue(ta.buffer)
    ta.getEl().dom.scrollTop = 99999 // scroll to bottom
  }
})

SM.AppData.doDownload = async function (format = 'gzip') {
  try {
    await window.oidcProvider.updateToken(10)
    const fetchInit = {
      url: `${STIGMAN.Env.apiBase}/op/appdata?format=${format}&elevate=true`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${window.oidcProvider.token}`
      }
    }
    const href = await SM.ServiceWorker.getDownloadUrl(fetchInit)
    if (href) {
      window.location = href
      return
    }
  }
  catch (e) {
    SM.Error.handleError(e)
  }
}

{
  class JSONLObjectStream extends TransformStream {
  constructor (separator = '\n') {
    /**
     * buffer - stores string from incoming chunk
     * @type {string}
     */
    let buffer = ''
    /**
     * splitRegExp - RegExp to split including any trailing separator
     */
    const splitRegExp = new RegExp(`(?<=${separator})`)

    super({
      transform (chunk, controller) {
        buffer += chunk

        /** @type {string[]} */
        const candidates = buffer.split(splitRegExp)

        /** @type {number} */
        const lastIndex = candidates.length - 1

        buffer = ''

        /** index @type {number} */
        /** candidate @type {string} */
        for (const [index, candidate] of candidates.entries()) {
          if (index === lastIndex && !candidate.endsWith(separator)) {
            // this is the last candidate and there's no trailing separator
            // initialize buffer for next _transform() or _flush()
            buffer = candidate
          }
          else if (candidate.startsWith('{')) {
            const record = SM.safeJSONParse(candidate)
            if (record) {
              // write any parsed Object
              controller.enqueue(record)
            }
          }
        }
      },
      flush (controller) {
        // if what's left in the buffer is a parsable Object, write it
        if (buffer.startsWith('{')) {
          const record = SM.safeJSONParse(buffer)
          if (record) {
            // write any parsed Object
            controller.enqueue(record)
          }
        }
      }
    })
  }
}
SM.AppData.JSONLObjectStream = JSONLObjectStream
}

{
  class FileReaderProgressStream extends TransformStream {
    constructor (fileSize, progressFn) {
      let readSize = 0
      super({
        async transform(chunk, controller) {
          readSize += chunk.length
          progressFn(readSize/fileSize, 'Analyzing')
          await new Promise(resolve => setTimeout(resolve, 0)) // let DOM update
          controller.enqueue(chunk)
        }
      })
    }
  }
  SM.AppData.FileReaderProgressStream = FileReaderProgressStream
}

SM.AppData.doReplace = function () {
  const rp = new SM.AppData.ReplacePanel({
    onFileSelected,
    btnHandler
  })

  new Ext.Window({
    title: 'Replace Application Data',
    cls: 'sm-dialog-window sm-round-panel',
    modal: true,
    width: 500,
    height: 400,
    layout: 'fit',
    plain: true,
    bodyStyle: 'padding:5px;',
    buttonAlign: 'center',
    items: rp,
    onEsc: Ext.emptyFn
  }).show(document.body)
  rp.updateStatusText('No file has been selected', true, true)

  function btnHandler (btn) {
    if (btn.fileObj) upload(btn.fileObj)
  }

  async function analyze (fileObj) {
    try {
      rp.actionButton.disable()
      rp.setProgressErrorState(false)
      rp.updateProgress(0, 'Analyzing')
      rp.updateStatusText('', true, true)

      let objectStream
      if (fileObj.type === 'application/gzip') {
        objectStream = fileObj.stream()
          .pipeThrough(new SM.AppData.FileReaderProgressStream(fileObj.size, rp.updateProgress.bind(rp)))
          .pipeThrough(new DecompressionStream("gzip"))
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(new SM.AppData.JSONLObjectStream())
      }
      else {
        objectStream = fileObj.stream()
        .pipeThrough(new SM.AppData.FileReaderProgressStream(fileObj.size, rp.updateProgress.bind(rp)))
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new SM.AppData.JSONLObjectStream())
      }

      const fileData = {
        version: false,
        tableData: null
      }
      for await (const object of objectStream) {
        if (object.version) {
          fileData.version = object.version
          rp.updateStatusText(`File is from STIG Manager version ${object.version}`)
          if (object.date) {
            rp.updateStatusText(`File is dated ${object.date}`)
          }
          if (object.lastMigration) {
            fileData.lastMigration = object.lastMigration
            rp.updateStatusText(`File is from migration ${object.lastMigration}. Current API migration is ${STIGMAN.apiConfig.lastMigration}.`)
            if (fileData.lastMigration > STIGMAN.apiConfig.lastMigration) {
              rp.updateStatusText(`Cannot import to lower API migration.`)
              break
            }
          }
        }
        if (object.tables) fileData.tableData = object
        if (object.table) rp.updateStatusText(`Found data for table: ${object.table}, rowCount: ${object.rowCount}`)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      if (fileData.lastMigration <= STIGMAN.apiConfig.lastMigration && fileData.tableData) {
        rp.updateProgress(1, 'Valid')
        rp.updateStatusText(`\n**** VALID source file, click "Replace Application Data" to upload to API`)
        rp.actionButton.fileObj = fileObj
        rp.actionButton.enable()
      }
      else {
        rp.updateStatusText(`\n**** INVALID source file ****`)
        rp.updateProgress(1, `Invalid`)
        rp.setProgressErrorState(true)
        rp.actionButton.disable()
      }
      return
    }
    catch (e) {
      rp.updateStatusText(e.message)
      rp.updateProgress(1, `Error: ${e.message}`)
      rp.setProgressErrorState(true)
      rp.actionButton.disable()
    }
  }

  async function upload (fileObj) {
    try {
      if (fileObj.name.endsWith('.jsonl') ) {
        fileObj = new File([fileObj], fileObj.name, {type: 'application/jsonl'})
      }
      rp.actionButton.disable()
      rp.ownerCt.getTool('close')?.hide()

      rp.updateStatusText('Sending file. Awaiting API response...', false, true)

      await window.oidcProvider.updateToken(10)
      const response = await fetch(`${STIGMAN.Env.apiBase}/op/appdata?elevate=true`, {
        method: 'POST',
        headers: new Headers({
          'Authorization': `Bearer ${window.oidcProvider.token}`
        }),
        body: fileObj
      })

      const objectStream = response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new SM.AppData.JSONLObjectStream())

      let totalRows = 0
      let insertedRows = 0
      let currentTable = ''

      for await (const object of objectStream) {
        if (object.totalRows) totalRows = object.totalRows
        if (object.valueCount) {
          currentTable = object.table
          insertedRows += object.valueCount
        }
        rp.updateStatusText(JSON.stringify(object))
        rp.updateProgress(insertedRows/totalRows, `Importing ${currentTable}`)
        await new Promise(resolve => setTimeout(resolve, 10))
      } 
      rp.updateStatusText('\n**** REFRESH the web app to use the new data ****')
      rp.updateProgress(1, 'Done')
    }
    catch (e) {
      SM.Error.handleError(e)
    }

  }

  async function onFileSelected (uploadField) {
    try {
      let input = uploadField.fileInput.dom
      const files = [...input.files]
      analyze(files[0])
      uploadField.reset()
    }
    catch (e) {
      uploadField.reset()
      SM.Error.handleError(e)
    }
  }
}

SM.AppData.showAppDataTab = function (params) {
  let { treePath } = params
  const tab = Ext.getCmp('main-tab-panel').getItem('appdata-admin-tab')
  if (tab) {
    tab.show()
    return
  }

  const appDataPanel = new SM.AppData.ManagePanel({
    border: false,
    // title: 'Application Data <span class="sm-navtree-sprite">experimental</span>',
    margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    cls: 'sm-round-panel',
    height: 200,
    labelWidth: 1,
    hideLabel: true,
    padding: 10
  })

  const thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'appdata-admin-tab',
    sm_treePath: treePath,
    iconCls: 'sm-database-save-icon',
    title: 'Export/Import Data',
    closable: true,
    layout: 'fit',
    items: [appDataPanel]
  })
  thisTab.show()
}
