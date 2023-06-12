Ext.ns('SM.CollectionClone')

SM.CollectionClone.ComboBox = Ext.extend(Ext.form.ComboBox, {
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

// SM.CollectionClone.StigMappingsEnabledComboBox = Ext.extend(Ext.form.ComboBox, {
//   initComponent: function () {
//     const _this = this
//     const data = [
//       ['withReviews', 'Clone STIG assignments and all Reviews'],
//       ['withoutReviews', 'Clone STIG assignments but not Reviews'],
//       ['no', 'Do not clone STIG assignments or Reviews']
//     ]
//     this.store = new Ext.data.SimpleStore({
//       fields: ['value', 'display']
//     })
//     this.store.on('load', function (store) {
//       _this.setValue(store.getAt(0).get('value'))
//     })
//     const config = {
//       displayField: 'display',
//       valueField: 'value',
//       triggerAction: 'all',
//       mode: 'local',
//       editable: false
//     }
//     Ext.apply(this, Ext.apply(this.initialConfig, config))
//     this.superclass().initComponent.call(this)
//     this.store.loadData(data)
//   }
// })

// SM.CollectionClone.StigMappingsDefaultRevisionsComboBox = Ext.extend(Ext.form.ComboBox, {
//   initComponent: function () {
//     const _this = this
//     const data = [
//       ['latest', 'Do not pin any revisions'],
//       ['sourceSettings', 'Clone any pinned revisions'],
//       ['currentDefauls', 'Pin the current default revisions']
//     ]
//     this.store = new Ext.data.SimpleStore({
//       fields: ['value', 'display']
//     })
//     this.store.on('load', function (store) {
//       _this.setValue(store.getAt(0).get('value'))
//     })
//     const config = {
//       displayField: 'display',
//       valueField: 'value',
//       triggerAction: 'all',
//       mode: 'local',
//       editable: false
//     }
//     Ext.apply(this, Ext.apply(this.initialConfig, config))
//     this.superclass().initComponent.call(this)
//     this.store.loadData(data)
//   }
// })


SM.CollectionClone.CloneForm = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const nameField = new Ext.form.TextField({
      fieldLabel: 'Name',
      labelStyle: 'font-weight: 600;',
      name: 'name',
      allowBlank: false,
      anchor: '100%'
    })
    const descriptionField = new Ext.form.TextArea({
      fieldLabel: 'Description',
      labelStyle: 'font-weight: 600;',
      name: 'description',
      anchor: '100%',
    })
    const grantsCb = new Ext.form.Checkbox({
      boxLabel: 'Grants<i class= "fa fa-question-circle sm-question-circle"></i>',
      name: 'grants',
      checked: true
    })
    const settingsCb = new Ext.form.Checkbox({
      boxLabel: 'Settings<i class= "fa fa-question-circle sm-question-circle"></i>',
      name: 'settings',
      checked: true
    })
    const labelsCb = new Ext.form.Checkbox({
      boxLabel: 'Labels<i class= "fa fa-question-circle sm-question-circle"></i>',
      name: 'labels',
      checked: true
    })
    const metadataCb = new Ext.form.Checkbox({
      boxLabel: 'Metadata<i class= "fa fa-question-circle sm-question-circle"></i>',
      name: 'metadata',
      checked: true
    })
    const assetsCb = new Ext.form.Checkbox({
      boxLabel: 'Assets<i class= "fa fa-question-circle sm-question-circle"></i>',
      name: 'assets',
      checked: true
    })
    const cbGroup = new Ext.form.CheckboxGroup({
      fieldLabel: 'Include',
      columns: 1,
      items: [
        grantsCb,
        settingsCb,
        labelsCb,
        metadataCb,
        assetsCb
      ]
    })
    const stigMappingsEnabledComboBox = new SM.CollectionClone.ComboBox({
      name: 'enabled',
      width: 250,
      fieldLabel: 'Reviews',
      data: [
        ['withReviews', 'Clone STIG assignments and all Reviews'],
        ['withoutReviews', 'Clone STIG assignments but not Reviews'],
        ['no', 'Do not clone STIG assignments or Reviews']
      ]
    })
    const stigMappingsDefaultRevisionsComboBox = new SM.CollectionClone.ComboBox({
      name: 'defaultRevisions',
      width: 250,
      fieldLabel: 'Revisions',
      data: [
        ['latest', 'Do not pin any revisions'],
        ['sourceSettings', "Match the source's pinned revisions"],
        ['currentDefauls', "Pin each of the source's default revisions"]
      ]
    })
    const config = {
      baseCls: 'x-plain',
      cls: 'sm-collection-manage-layout sm-round-panel',
      bodyStyle: 'padding: 9px;',
      border: false,
      labelWidth: 100,
      items: [
        {
          xtype: 'fieldset',
          // height: 200,
          split: false,
          title: 'New Collection information',
          items: [nameField, descriptionField]
        },
        {
          xtype: 'fieldset',
          region: 'center',
          title: 'Cloning Options',
          items: [cbGroup, stigMappingsEnabledComboBox, stigMappingsDefaultRevisionsComboBox]
        }
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this);
  }
})

SM.CollectionClone.showCollectionClone = function () {
  try {
    const width = 420
    const height = 450
    const fp = new SM.CollectionClone.CloneForm()
    const cloneBtn = new Ext.Button({
      text: 'Clone',
      iconCls: 'sm-clone-icon',
    })

    const fpwindow = new Ext.Window({
      title: 'Clone Collection',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      resizable: false,
      width,
      height,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'right',
      items: fp,
      buttons: [
        {
          text: 'Cancel',
          action: 'cancel',
        },
        cloneBtn
      ]
    })
    fpwindow.show(document.body)
  }
  catch (e) {
    SM.Error.handleError(e)
  }
}
