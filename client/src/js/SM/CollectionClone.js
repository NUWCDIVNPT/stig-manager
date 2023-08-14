Ext.ns('SM.CollectionClone')


SM.CollectionClone.ClickThruPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const displayField = new Ext.form.DisplayField({
      value: SM.TipContent.CloneOptions.ClickThru
    })
    const disableCheckbox = new Ext.form.Checkbox({
      boxLabel: `Don't show this warning again during this session`,
      margins: '30 0 0 0',
      listeners: {
        check: function (cb, checked) {
          sessionStorage.setItem('noCloneWarning', checked ? 'true' : 'false')
        }
      }
    })
    const continueBtn = new Ext.Button({
      text: 'Continue',
      // iconCls: 'sm-clone-icon',
      handler: this.btnHandler
    })
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      hideLabels: true,
      layout: 'vbox',
      items: [
        displayField,
        disableCheckbox
      ],
      buttons: [
        continueBtn
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.CollectionClone.ComboBox = Ext.extend(SM.Global.HelperComboBox, {
  initComponent: function () {
    const _this = this
    const data = this.data || []
    this.store = new Ext.data.SimpleStore({
      fields: ['value', 'display']
    })
    this.store.on('load', function (store) {
      _this.setValue(store.getAt(0).get('value'))
    })
    const config = {
      displayField: 'display',
      valueField: 'value',
      triggerAction: 'all',
      mode: 'local',
      editable: false
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.store.loadData(data)
  }
})

SM.CollectionClone.CloneFormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      enableKeyEvents: true,
      labelStyle: 'font-weight: 600;',
      name: 'name',
      allowBlank: false,
      value: this.sourceName ? `Clone of ${this.sourceName}` : '',
      anchor: '100%',
      listeners: {
        keyup: handleInput
      }
    })
    const descriptionField = new Ext.form.TextArea({
      fieldLabel: 'Description',
      labelStyle: 'font-weight: 600;',
      name: 'description',
      anchor: '100%',
      value: `Cloned from ${this.sourceName} on ${new Date().toLocaleDateString('en-CA')} by ${curUser.displayName}`
    })
    const grantsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Grants',
      name: 'grants',
      checked: true,
      helpText: SM.TipContent.CloneOptions.Grants,
      listeners: {
        check: handleInput
      }

    })
    const labelsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Labels',
      name: 'labels',
      checked: true,
      helpText: SM.TipContent.CloneOptions.Labels,
      listeners: {
        check: handleInput
      }
    })
    const assetsCb = new SM.Global.HelperCheckbox({
      boxLabel: 'Assets',
      name: 'assets',
      checked: true,
      helpText: SM.TipContent.CloneOptions.Assets,
      listeners: {
        check: handleInput
      }
    })
    const cbGroup = new Ext.form.CheckboxGroup({
      fieldLabel: 'Include',
      allowBlank: false,
      name: 'include',
      columns: 1,
      items: [
        grantsCb,
        labelsCb,
        assetsCb
      ]
    })
    const stigMappingsComboBox = new SM.CollectionClone.ComboBox({
      name: 'stigMappings',
      width: 220,
      fieldLabel: 'STIGs',
      helpText: SM.TipContent.CloneOptions.Stigs,
      data: [
        ['withReviews', 'Assignments and Reviews'],
        ['withoutReviews', 'Assignments but not Reviews'],
        ['none', 'Do not clone assignments or Reviews']
      ],
      listeners: {
        select: handleInput
      }
    })
    const pinRevisionsComboBox = new SM.CollectionClone.ComboBox({
      name: 'pinRevisions',
      width: 220,
      fieldLabel: 'Pin Revisions',
      helpText: SM.TipContent.CloneOptions.Revisions,
      data: [
        ['matchSource', "Match the source's pinned revisions"],
        ['sourceDefaults', "Pin the source's default revisions"]
      ]
    })
    const cloneBtn = new Ext.Button({
      text: 'Clone',
      iconCls: 'sm-clone-icon',
      handler: this.btnHandler
    })

    function getApiValues() {
      return {
        name: nameField.getValue(),
        description: descriptionField.getValue(),
        options: {
          grants: grantsCb.getValue(),
          labels: labelsCb.getValue(),
          assets: assetsCb.getValue(),
          stigMappings: stigMappingsComboBox.getValue(),
          pinRevisions: pinRevisionsComboBox.getValue()
        }
      }
    }
    function handleInput () {
      stigMappingsComboBox.setDisabled(!assetsCb.checked)
      pinRevisionsComboBox.setDisabled(!assetsCb.checked || stigMappingsComboBox.getValue() === 'none')
      cloneBtn.setDisabled(nameField.getValue() === '' || (!assetsCb.checked && !labelsCb.checked && !grantsCb.checked))
    }
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      labelWidth: 100,
      getApiValues,
      nameField,
      items: [
        {
          xtype: 'fieldset',
          title: 'New Collection information',
          items: [nameField, descriptionField]
        },
        {
          xtype: 'fieldset',
          title: 'Cloning Options',
          items: [cbGroup, stigMappingsComboBox, pinRevisionsComboBox]
        }
      ],
      buttons: [
        cloneBtn
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.CollectionClone.CloneProgressPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const pb = new Ext.ProgressBar({
      flex: 0
    })
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      items: [pb],
      pb
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.CollectionClone.CloneErrorPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const copyBtn = new Ext.Button({
      text: 'Unexpected Error. Click to copy the log to the clipboard.',
      iconCls: 'sm-error-icon',
      margins: '0 5 0 0',
      handler: function () {
        navigator.clipboard.writeText(_this.log)
      }
    })
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      layout: 'hbox',
      layoutConfig: {
        pack: 'center'
      },
      items: [copyBtn],
      copyBtn
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.CollectionClone.PostClonePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const manageBtn = new Ext.Button({
      action: 'manage', 
      text: 'Manage the Collection',
      iconCls: 'sm-setting-icon',
      margins: '0 5 0 0',
      handler: this.btnHandler
    })
    const viewBtn = new Ext.Button({
      action: 'view', 
      text: 'View the Dashboard',
      iconCls: 'sm-collection-icon',
      margins: '0 0 0 5',
      handler: this.btnHandler
    })

    const config = {
      // baseCls: 'x-plain',
      // cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      layout: 'hbox',
      layoutConfig: {
        pack: 'center'
      },
      items: [manageBtn, viewBtn]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

function NDJSONStream(separator = '\n') {
  let buffer = ''
  return new TransformStream({
    transform(chunk, controller) {
      buffer = buffer ? buffer + chunk : chunk
      const segments = buffer.split(separator)
      for (const segment of segments) {
        const jsObj = SM.safeJSONParse(segment)
        if (jsObj) {
          controller.enqueue(jsObj)
        }
      }
      buffer = buffer.endsWith(separator) ? '' : segments[segments.length - 1]
    }
  })
}

SM.CollectionClone.showCollectionClone = async function ({collectionId, sourceName}) {
  try {
    let showClickThru = !(sessionStorage.getItem('noCloneWarning') === 'true')
    const width = 420
    const height = 405
    const fp = new SM.CollectionClone.CloneFormPanel({
      sourceName,
      btnHandler: cloneBtnHandler
    })
    const wp = new SM.CollectionClone.ClickThruPanel({btnHandler: clickThruHandler})

    function clickThruHandler () {
      fpwindow.removeAll()
      fpwindow.add(fp)
      fpwindow.doLayout()
      fp.nameField.focus(true, true)
    }
    async function cloneBtnHandler (btn) {
      try {
        const jsonData = fp.getApiValues()
        fpwindow.removeAll()
        fpwindow.setTitle(`Creating "${jsonData.name}"`)
        fpwindow.getTool('close').hide()
        const progressPanel = new SM.CollectionClone.CloneProgressPanel()
        fpwindow.add(progressPanel)
        fpwindow.setHeight(80)
        fpwindow.minimize()

        progressPanel.pb.updateProgress(0, "Cloning")

        await window.oidcProvider.updateToken(10)
        const response = await fetch(`${STIGMAN.Env.apiBase}/collections/${collectionId}/clone?projection=owners&projection=labels&projection=statistics`, {
          method: 'POST',
          headers: new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.oidcProvider.token}`
          }),
          body: JSON.stringify(jsonData)
        })
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
            if (!fpwindow.isDestroyed) {
              if (value.status === 'error') {
                if (value.message === 'Unhandled error') {
                  fpwindow.removeAll()
                  fpwindow.setTitle(`Error creating "${jsonData.name}"`)
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
              else if (value.stage === 'collection') {
                const progress = (value.step - 1)/value.stepCount
                progressPanel.pb.updateProgress(progress, value.message)
              }
              else if (value.stage === 'reviews') {
                if (value.stepName !== 'cloneReviews') {
                  progressPanel.pb.updateProgress(1, 'Preparing to clone reviews...')
                }
                else {
                  const progress = value.reviewsCopied/value.reviewsTotal
                  progressPanel.pb.updateProgress(progress, `Cloning reviews (${value.reviewsCopied.toLocaleString()} of ${value.reviewsTotal.toLocaleString()})`)
                }
              }
            }
          }
        } while (!isDone)

        if (!fpwindow.isDestroyed && !isError) {
          fpwindow.removeAll()
          fpwindow.setTitle(`Created "${apiCollection.name}"`)
          fpwindow.add(new SM.CollectionClone.PostClonePanel({ 
            btnHandler: function (btn) {
              if (apiCollection) {
                const openMethod = btn.action === 'manage' ? addCollectionManager : SM.CollectionPanel.showCollectionTab
                openMethod({
                  collectionId: apiCollection.collectionId,
                  collectionName: apiCollection.name,
                  treePath: SM.Global.mainNavTree.getCollectionLeaf(apiCollection.collectionId)?.getPath()
                })
                fpwindow.close()
              }
            }
           }))
          fpwindow.getTool('minimize').hide()
          fpwindow.getTool('close').show()
          fpwindow.doLayout()
        }

       if (haveResult) {
        // Refresh the curUser global to include any new grants and fire the collectioncreated event
        await SM.GetUserObject()
        SM.Dispatcher.fireEvent( 'collectioncreated', apiCollection, {elevate: false, showManager: false})
       } 
      }
      catch (e) {
        SM.Error.handleError(e)
        fpwindow.close()
      }
    }

    function vpResize (vp, adjWidth, adjHeight) {
      if (fpwindow.minimized) {
        const offset = 20
        fpwindow.setPosition(adjWidth - fpwindow.getWidth()- offset, adjHeight - fpwindow.getHeight() - offset) 
      }
      else {
        fpwindow.center()
      }
    }

    const fpwindow = new Ext.Window({
      title: 'Clone Collection',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      resizable: false,
      closable: true,
      minimizable: true,
      maximizable: true,
      constrain: true,
      width,
      height,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: showClickThru ? wp : fp,
      listeners: {
        minimize: function() {
          const offset = 20
          fpwindow.mask.hide()
          fpwindow.getTool('minimize').hide()
          const vpSize = Ext.getCmp('app-viewport').getSize()
          fpwindow.setPosition(vpSize.width - fpwindow.getWidth()- offset, vpSize.height - fpwindow.getHeight() - offset)
          fpwindow.minimized = true
        },
        destroy: function () {
          Ext.getCmp('app-viewport').removeListener('resize', vpResize)
        }
      }
    })
    fpwindow.render(document.body)
    fpwindow.getTool('minimize').hide()
    fpwindow.getTool('maximize').hide()
    fpwindow.show()
    if (!showClickThru) fp.nameField.focus(true, true)
    Ext.getCmp('app-viewport').addListener('resize', vpResize)

  }
  catch (e) {
    SM.Error.handleError(e)
  }
}
