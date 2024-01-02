Ext.ns('SM.Inventory')

SM.Inventory.CsvArrayDelimiterComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const config = {
      width: 120,
      forceSelection: true,
      editable: false,
      mode: 'local',
      triggerAction: 'all',
      displayField: 'display',
      valueField: 'delimiter',
      store: new Ext.data.SimpleStore({
        fields: ['display', 'delimiter'],
        data: [['Comma', ','], ['Comma and space', ', '], ['Newline', '\n']]
      }),
      value: this.value || ','
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Inventory.CsvAssetFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const _this = this

    const nameCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Name',
      csvField: {
        apiProperty: 'name',
        header: 'Name'
      },
      checked: this.state.name,
      listeners: {
        check: handleCheckboxes
      }
    })
    const fqdnCheckbox = new Ext.form.Checkbox({
      boxLabel: 'FQDN',
      csvField: {
        apiProperty: 'fqdn',
        header: 'FQDN'
      },
      checked: this.state.fqdn,
      listeners: {
        check: handleCheckboxes
      }
    })
    const ipCheckbox = new Ext.form.Checkbox({
      boxLabel: 'IP',
      csvField: {
        apiProperty: 'ip',
        header: 'IP'
      },
      checked: this.state.ip,
      listeners: {
        check: handleCheckboxes
      }
    })
    const macCheckbox = new Ext.form.Checkbox({
      boxLabel: 'MAC',
      csvField: {
        apiProperty: 'mac',
        header: 'MAC'
      },
      checked: this.state.mac,
      listeners: {
        check: handleCheckboxes
      }
    })
    const descriptionCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Description',
      csvField: {
        apiProperty: 'description',
        header: 'Description'
      },
      checked: this.state.description,
      listeners: {
        check: handleCheckboxes
      }
    })
    const stigsCheckbox = new Ext.form.Checkbox({
      boxLabel: 'STIGs',
      csvField: {
        apiProperty: 'stigs',
        header: 'STIGs',
        delimitedProperty: 'benchmarkId',
        delimiter: this.state.stigsDelimiter
      },
      checked: this.state.stigs,
      listeners: {
        check: handleCheckboxes
      }
    })
    const checkboxGroup = new Ext.form.CheckboxGroup({
      hideLabel: true,
      columns: [70, 70, 50, 60, 100, 60],
      items: [
        nameCheckbox,
        fqdnCheckbox,
        ipCheckbox,
        macCheckbox,
        descriptionCheckbox,
        stigsCheckbox
      ]
    })
    const delimiterComboBox = new SM.Inventory.CsvArrayDelimiterComboBox({
      fieldLabel: 'STIGs delimited by',
      disabled: !this.state.stigs,
      value: this.state.stigsDelimiter,
      listeners: {
        select: (cb) => stigsCheckbox.csvField.delimiter = cb.getValue()
      }
    })

    function getFieldOptions() {
      return checkboxGroup.getValue().map(cb => cb.csvField)
    }

    function handleCheckboxes() {
      delimiterComboBox.setDisabled(!stigsCheckbox.getValue())
      const event = nameCheckbox.getValue() || fqdnCheckbox.getValue() ? 'valid' : 'invalid'
      _this.fireEvent(event, _this)
    }

    const config = {
      title: this.title || 'CSV fields',
      labelWidth: 120,
      autoHeight: true,
      getFieldOptions,
      nameCheckbox,
      fqdnCheckbox,
      ipCheckbox,
      macCheckbox,
      descriptionCheckbox,
      stigsCheckbox,
      checkboxGroup,
      delimiterComboBox,
      items: [
        checkboxGroup,
        delimiterComboBox
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Inventory.CsvStigFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const _this = this

    const benchmarkCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Benchmark',
      csvField: {
        apiProperty: 'benchmarkId',
        header: 'Benchmark'
      },
      checked: this.state.benchmarkId,
      listeners: {
        check: handleCheckboxes
      }
    })
    const titleCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Title',
      csvField: {
        apiProperty: 'title',
        header: 'Title'
      },
      checked: this.state.title,
      listeners: {
        check: handleCheckboxes
      }
    })
    const revisionCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Revision',
      csvField: {
        apiProperty: 'revisionStr',
        header: 'Revision'
      },
      checked: this.state.revisionStr,
      listeners: {
        check: handleCheckboxes
      }
    })
    const dateCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Date',
      csvField: {
        apiProperty: 'benchmarkDate',
        header: 'Date'
      },
      checked: this.state.date,
      listeners: {
        check: handleCheckboxes
      }
    })
    const assetsCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Assets',
      csvField: {
        apiProperty: 'assets',
        header: 'Assets',
        delimitedProperty: 'name',
        delimiter: this.state.assetsDelimiter
      },
      checked: this.state.assets,
      listeners: {
        check: handleCheckboxes
      }
    })
    const checkboxGroup = new Ext.form.CheckboxGroup({
      hideLabel: true,
      columns: [100, 70, 85, 70, 70],
      items: [
        benchmarkCheckbox,
        titleCheckbox,
        revisionCheckbox,
        dateCheckbox,
        assetsCheckbox
      ]
    })
    const delimiterComboBox = new SM.Inventory.CsvArrayDelimiterComboBox({
      fieldLabel: 'Assets delimited by',
      disabled: !this.state.assets,
      value: this.state.assetsDelimiter,
      listeners: {
        select: (cb) => assetsCheckbox.csvField.delimiter = cb.getValue()
      }
    })

    function getFieldOptions() {
      return checkboxGroup.getValue().map(cb => cb.csvField)
    }

    function handleCheckboxes() {
      delimiterComboBox.setDisabled(!assetsCheckbox.getValue())
      const event = benchmarkCheckbox.getValue() || titleCheckbox.getValue() ? 'valid' : 'invalid'
      _this.fireEvent(event, _this)
    }

    const config = {
      title: this.title || 'CSV fields',
      labelWidth: 120,
      autoHeight: true,
      getFieldOptions,
      benchmarkCheckbox,
      titleCheckbox,
      revisionCheckbox,
      dateCheckbox,
      assetsCheckbox,
      checkboxGroup,
      delimiterComboBox,
      items: [
        checkboxGroup,
        delimiterComboBox
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Inventory.JsonOptionsFieldSet = Ext.extend(Ext.form.FieldSet, {
  initComponent: function () {
    const _this = this

    const projectionCheckbox = new Ext.form.Checkbox({
      boxLabel: `Include list of ${this.groupBy === 'stig' ? 'Assets' : 'STIGs'} for each ${this.groupBy === 'stig' ? 'STIG' : 'Asset'}`,
      hideLabel: true,
      checked: this.projection ?? true
    })
    const prettyPrintCheckbox = new Ext.form.Checkbox({
      boxLabel: 'Pretty print with line breaks and indentation',
      hideLabel: true,
      checked: this.prettyPrint ?? false
    })
    function getFieldOptions() {
      return {
        projection: projectionCheckbox.getValue(),
        prettyPrint: prettyPrintCheckbox.getValue()
      }
    }

    const config = {
      title: this.title || 'JSON options',
      hideLabel: true,
      autoHeight: true,
      getFieldOptions,
      projectionCheckbox,
      prettyPrintCheckbox,
      items: [
        projectionCheckbox,
        prettyPrintCheckbox
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Inventory.ExportOptionsWindow = Ext.extend(Ext.Window, {
  initComponent: function () {
    const _this = this
    if (!this.collectionId || !this.collectionName) throw ('Missing collectionId or collectionName')
    const localStorageItem = 'inventoryExportOptions'
    const state = getState()
    // Group by: and Format:
    const groupByRadioGroup = new Ext.form.RadioGroup({
      fieldLabel: 'Group by',
      columns: [70, 70],
      items: [
        {
          boxLabel: 'STIG',
          name: 'groupBy',
          groupBy: 'stig',
          itemField: 'asset',
          checked: state.groupBy === 'stig'
        },
        {
          boxLabel: 'Asset',
          name: 'groupBy',
          groupBy: 'asset',
          checked: state.groupBy === 'asset'
        }
      ],
      listeners: {
        change: updateDisplay
      }
    })
    const formatRadioGroup = new Ext.form.RadioGroup({
      fieldLabel: 'Format',
      columns: [70, 70],
      items: [
        {
          boxLabel: 'CSV',
          name: 'format',
          format: 'csv',
          checked: state.format === 'csv'
        },
        {
          boxLabel: 'JSON',
          name: 'format',
          format: 'json',
          checked: state.format === 'json'
        }
      ],
      listeners: {
        change: updateDisplay
      }
    })
    // CSV fields for group by asset
    const csvAssetFieldSet = new SM.Inventory.CsvAssetFieldSet({
      state,
      listeners: {
        valid: () => exportButton.enable(),
        invalid: () => exportButton.disable()
      }
    })
    // CSV fields for group by stig
    const csvStigFieldSet = new SM.Inventory.CsvStigFieldSet({
      state,
      listeners: {
        valid: () => exportButton.enable(),
        invalid: () => exportButton.disable()
      }
    })
    // JSON options for group by asset
    const jsonAssetFieldSet = new SM.Inventory.JsonOptionsFieldSet({
      projection: state.stigProjection,
      prettyPrint: state.jsonAssetPrettyPrint,
      groupBy: 'asset'
    })
    // JSON options for group by stig
    const jsonStigFieldSet = new SM.Inventory.JsonOptionsFieldSet({
      projection: state.assetProjection,
      prettyPrint: state.jsonStigPrettyPrint,
      groupBy: 'stig'
    })
    // Button
    const exportButton = new Ext.Button({
      text: 'Export',
      iconCls: 'sm-export-icon',
      disabled: false,
      handler: exportHandler
    })
    // Functions
    async function fetchApiDataAsText(groupBy, includeProjection, baseParams = {}) {
      const requests = {
        asset: {
          url: `${STIGMAN.Env.apiBase}/assets`,
          params: { collectionId: _this.collectionId, ...baseParams }
        },
        stig: {
          url: `${STIGMAN.Env.apiBase}/collections/${_this.collectionId}/stigs`,
          params: {...baseParams}
        }
      }
      if (includeProjection) {
        requests.asset.params.projection = 'stigs'
        requests.stig.params.projection = 'assets'
      }
      const result = await Ext.Ajax.requestPromise({
        method: 'GET',
        url: requests[groupBy].url,
        params: requests[groupBy].params
      })
      return result.response.responseText
    }
    async function exportHandler() {
      try {
        _this.getEl().mask('')
        setState()
        const groupItem = groupByRadioGroup.getValue()
        const formatItem = formatRadioGroup.getValue()
        let downloadData
        if (formatItem.format === 'csv') {
          const csvFields = groupItem.groupBy === 'asset' ? csvAssetFieldSet.getFieldOptions() : csvStigFieldSet.getFieldOptions()
          const requestProjection = csvFields.some(item => item.apiProperty === 'stigs' || item.apiProperty === 'assets')
          const apiText = await fetchApiDataAsText(groupItem.groupBy, requestProjection, _this.baseParams)
          downloadData = new Blob([SM.Inventory.apiToCsv(JSON.parse(apiText), csvFields)])
        }
        else {
          const options = (groupItem.groupBy === 'asset' ? jsonAssetFieldSet : jsonStigFieldSet).getFieldOptions()
          const apiText = await fetchApiDataAsText(groupItem.groupBy, options.projection, _this.baseParams)
          if (options.prettyPrint) {
            downloadData = new Blob([JSON.stringify(JSON.parse(apiText), null, 2)])
          }
          else {
            downloadData = new Blob([apiText])
          }
        }
        const timestamp = Ext.util.Format.date((new Date), 'Y-m-d_His')
        saveAs(downloadData, `${_this.collectionName}_InventoryBy${groupItem.boxLabel}_${timestamp}.${formatItem.format}`)
      }
      catch (e) {
        SM.Error.handleError(e)
      }
      finally {
        _this.close()
      }
    }
    function updateDisplay() {
      if (formatRadioGroup.getValue().format === 'json') {
        csvAssetFieldSet.hide()
        csvStigFieldSet.hide()
        if (groupByRadioGroup.getValue().groupBy === 'stig') {
          jsonAssetFieldSet.hide()
          jsonStigFieldSet.show()
        }
        else {
          jsonAssetFieldSet.show()
          jsonStigFieldSet.hide()
        }
      }
      else {
        jsonAssetFieldSet.hide()
        jsonStigFieldSet.hide()
        if (groupByRadioGroup.getValue().groupBy === 'stig') {
          csvAssetFieldSet.hide()
          csvStigFieldSet.show()
        }
        else {
          csvAssetFieldSet.show()
          csvStigFieldSet.hide()
        }
      }
    }
    function getState() {
      const defaults = {
        groupBy: 'stig',
        format: 'csv',
        benchmarkId: true,
        title: true,
        revisionStr: true,
        date: true,
        assets: true,
        assetsDelimiter: ',',
        name: true,
        fqdn: true,
        ip: true,
        mac: true,
        description: true,
        stigs: true,
        stigsDelimiter: ',',
        jsonAssetStigProjection: true,
        jsonAssetPrettyPrint: false,
        jsonStigAssetProjection: true,
        jsonStigPrettyPrint: false
      }
      const storageValue = SM.safeJSONParse(localStorage.getItem(localStorageItem))
      return storageValue ? Object.assign({}, defaults, storageValue) : defaults
    }
    function setState() {
      const state = {
        groupBy: groupByRadioGroup.getValue().groupBy,
        format: formatRadioGroup.getValue().format,
        benchmarkId: csvStigFieldSet.benchmarkCheckbox.checked,
        title: csvStigFieldSet.titleCheckbox.checked,
        revisionStr: csvStigFieldSet.revisionCheckbox.checked,
        date: csvStigFieldSet.dateCheckbox.checked,
        assets: csvStigFieldSet.assetsCheckbox.checked,
        assetsDelimiter: csvStigFieldSet.delimiterComboBox.getValue(),
        name: csvAssetFieldSet.nameCheckbox.checked,
        fqdn: csvAssetFieldSet.fqdnCheckbox.checked,
        ip: csvAssetFieldSet.ipCheckbox.checked,
        mac: csvAssetFieldSet.macCheckbox.checked,
        description: csvAssetFieldSet.descriptionCheckbox.checked,
        stigs: csvAssetFieldSet.stigsCheckbox.checked,
        stigsDelimiter: csvAssetFieldSet.delimiterComboBox.getValue(),
        jsonStigAssetProjection: jsonStigFieldSet.projectionCheckbox.checked,
        jsonStigPrettyPrint: jsonStigFieldSet.prettyPrintCheckbox.checked,
        jsonAssetStigProjection: jsonAssetFieldSet.projectionCheckbox.checked,
        jsonAssetPrettyPrint: jsonAssetFieldSet.prettyPrintCheckbox.checked
      }
      localStorage.setItem(localStorageItem, JSON.stringify(state))
    }

    const config = {
      layout: 'form',
      padding: 10,
      items: [
        groupByRadioGroup,
        formatRadioGroup,
        csvAssetFieldSet,
        csvStigFieldSet,
        jsonAssetFieldSet,
        jsonStigFieldSet
      ],
      buttons: [exportButton],
      listeners: {
        beforeshow: updateDisplay
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Inventory.apiToCsv = function (apiData, csvFields) {
  // Function to apply double-quote escaping
  const quotify = (string) => `"${string.replace(/"/g, '""')}"`
  // Initialize data
  const csvData = []
  // Header
  const header = []
  for (const field of csvFields) {
    header.push(quotify(field.header))
  }
  csvData.push(header.join(','))
  // Rows
  for (const data of apiData) {
    const row = []
    for (const field of csvFields) {
      if (field.delimiter) {
        row.push(quotify(data[field.apiProperty].map(i => i[field.delimitedProperty]).join(field.delimiter)))
      }
      else {
        row.push(quotify(data[field.apiProperty] ?? ''))
      }
    }
    csvData.push(row.join(','))
  }
  return csvData.join('\n')
}

SM.Inventory.showInventoryExportOptions = function (collectionId, collectionName, baseParams) {
  const optionsWindow = new SM.Inventory.ExportOptionsWindow({
    title: 'Inventory export options',
    modal: true,
    width: 460,
    collectionId,
    collectionName,
    baseParams
  })
  optionsWindow.show()
}