Ext.ns('SM.AppData')

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
      await SM.AppData.doDownload()
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
    this.downloadBtn = new SM.AppData.DownloadButton({
      padding: 10
    })
    this.replaceBtn = new SM.AppData.ReplaceButton({
      padding: 10
    })
    const config = {
      items: [
        {
          xtype: 'fieldset',
          width: 200,
          title: 'Export',
          items: [this.downloadBtn]
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
      accept: '.json,.zip',
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

    const config = {
      layout: 'anchor',
      border: false,
      items: [this.textarea],
      tbar: [
        this.selectFileBtn,
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
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

SM.AppData.doDownload = async function () {
  try {
    await window.oidcProvider.updateToken(10)
    const fetchInit = {
      url: `${STIGMAN.Env.apiBase}/op/appdata?elevate=true`,
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
  rp.updateStatusText('IMPORTANT: Content from the imported file will replace ALL existing application data!', true, true)

  function btnHandler (btn) {
    if (btn.fileObj) upload(btn.fileObj)
  }

  async function upload (fileObj) {
    try {
      rp.ownerCt.getTool('close')?.hide()

      rp.updateStatusText('Awaiting API response...', false, true)
      let formData = new FormData()
      formData.append('importFile', fileObj);

      await window.oidcProvider.updateToken(10)
      const response = await fetch(`${STIGMAN.Env.apiBase}/op/appdata?elevate=true`, {
        method: 'POST',
        headers: new Headers({
          'Authorization': `Bearer ${window.oidcProvider.token}`
        }),
        body: formData
      })

      const responseStream = response.body
      .pipeThrough(new TextDecoderStream())

      for await (const line of responseStream) {
        rp.updateStatusText(line)
        await new Promise(resolve => setTimeout(resolve, 10))
      } 
      rp.updateStatusText('\n**** REFRESH the web app to use the new data ****')
    }
    catch (e) {
      SM.Error.handleError(e)
    }

  }

  async function onFileSelected (uploadField) {
    try {
      let input = uploadField.fileInput.dom
      const files = [...input.files]
      await upload(files[0])
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
