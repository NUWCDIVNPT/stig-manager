var appName = 'STIG Manager';
var appVersion = "3.0";
var copyrightStr = '';
var licenseStr = "This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\
\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.\
\n\nThe GNU General Public License is available at  <http://www.gnu.org/licenses/>.";

var curUser;

Ext.ns('SM')
Ext.ns('SM.Global')

SM.he = Ext.util.Format.htmlEncode
SM.hd = Ext.util.Format.htmlDecode
SM.GetUserObject = async function () {
    let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/user`,
        method: 'GET'
    })
    curUser = JSON.parse(result.response.responseText)
    curUser.collectionGrants.sort((a, b) => {
        const nameA = a.collection.name
        const nameB = b.collection.name
        if (nameA < nameB) {
            return -1
        }
        if (nameA > nameB) {
            return 1
        }
        return 0
    })
    return curUser
}
SM.CtrlAGridHandler = function (e) {
    if (e.browserEvent.key === 'a' && e.browserEvent.ctrlKey) {
        e.stopPropagation()
        e.preventDefault()
        const sm = this.getSelectionModel()
        sm.suspendEvents(false)
        sm.selectRange(0, this.getStore().getCount() - 1)
        sm.resumeEvents()
        sm.fireEvent('selectionchange', sm)
    }
}
SM.SetCheckboxSelModelHeaderState = function (sm) {
    // const hd = sm.grid.view.innerHd.querySelector('.x-grid3-hd-row .x-grid3-td-checker .x-grid3-hd-checker')
    const hd = sm.grid.view.innerHd.querySelector('.x-grid3-hd-inner.x-grid3-hd-checker')
    if (hd) {
      const hdState = sm.selections.length === 0 ? null : sm.grid.store.getCount() === sm.selections.length ? 'on' : 'ind'
      hd.classList.remove('x-grid3-hd-checker-on')
      hd.classList.remove('x-grid3-hd-checker-ind')
      if (hdState) {
          hd.classList.add(`x-grid3-hd-checker-${hdState}`)
      }
    }

}


SM.styledEmptyRenderer = v => v ? v : '<span class="sm-empty-cell" />'
SM.styledZeroRenderer = v => v !== 0 ? v : '-'

SM.ResultTipText = `<b>Result</b><br>The result of an evaluation of a STIG ruleId.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;STATUS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;result&gt;`

SM.ResultTipTpl = new Ext.XTemplate(
    `<b>Result</b><br>The result of an evaluation of a STIG ruleId.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;STATUS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;result&gt;`
)
SM.DetailTipText = `<b>Detail</b><br>A description of how the evaluator or evaluation tool determined the result.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;FINDING_DETAILS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;check&gt;&lt;check-content&gt;&lt;sm:detail&gt;`

SM.DetailTipTpl = new Ext.XTemplate(
    '<b>Detail</b><br>A description of how the evaluator or evaluation tool determined the result.<br><br>',
    '<b>Collection Settings</b></br>This field is enabled ',
    `<tpl if="enabled == 'always'">for any result.<br></tpl>`,
    `<tpl if="enabled == 'findings'">for findings only.<br></tpl>`,
    `Content in this field is `,
    `<tpl if="required == 'always'">required to submit a review.<br></tpl>`,
    `<tpl if="required == 'findings'">required to submit a finding.<br></tpl>`,
    `<tpl if="required == 'optional'">optional.<br></tpl>`,
    `<br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;FINDING_DETAILS&gt;<br><b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;check&gt;&lt;check-content&gt;&lt;sm:detail&gt;`
)

SM.CommentTipText = `<b>Comment</b><br>Additional comment by the evaluator or evaluation tool.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;check&gt;&lt;check-content&gt;&lt;sm:comment&gt;`

SM.CommentTipTpl = new Ext.XTemplate(
    '<b>Comment</b><br>Additional comment by the evaluator or evaluation tool.<br><br>',
    '<b>Collection Settings</b></br>This field is enabled ',
    `<tpl if="enabled == 'always'">for any result.<br></tpl>`,
    `<tpl if="enabled == 'findings'">for findings only.<br></tpl>`,
    `Content in this field is `,
    `<tpl if="required == 'always'">required to submit a review.<br></tpl>`,
    `<tpl if="required == 'findings'">required to submit a finding.<br></tpl>`,
    `<tpl if="required == 'optional'">optional.<br></tpl>`,
    `<br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;<br>
    <b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;check&gt;&lt;check-content&gt;&lt;sm:comment&gt;`
)

SM.RenderResult = {
    fail: {
        css: 'sm-result-fail',
        textDisa: 'O',
        textNist: 'F'
    },
    pass: {
        css: 'sm-result-pass',
        textDisa: 'NF',
        textNist: 'P'
    },
    notapplicable: {
        css: 'sm-result-na',
        textDisa: 'NA',
        textNist: 'N'
    },
    notchecked: {
        css: 'sm-result-nr',
        textDisa: 'NR',
        textNist: 'K'
    },
    unknown: {
        css: 'sm-result-nr',
        textDisa: 'U',
        textNist: 'U'
    },
    error: {
        css: 'sm-result-nr',
        textDisa: 'E',
        textNist: 'E'
    },
    notselected: {
        css: 'sm-result-nr',
        textDisa: 'S',
        textNist: 'S'
    },
    informational: {
        css: 'sm-result-nr',
        textDisa: 'I',
        textNist: 'I'
    },
    fixed: {
        css: 'sm-result-pass',
        textDisa: 'F',
        textNist: 'F'
    }
}

SM.RuleContentTpl = new Ext.XTemplate(
    '<div class=cs-home-header-top>{ruleId}',
      '<span class="sm-content-sprite sm-severity-{severity}">',
        `<tpl if="severity == 'high'">CAT 1</tpl>`,
        `<tpl if="severity == 'medium'">CAT 2</tpl>`,
        `<tpl if="severity == 'low'">CAT 3</tpl>`, 
      '</span>',
      '<div class="sm-content-stigid">{version}</div>',
    '</div>',
    '<div class=cs-home-header-sub>{[SM.he(values.title)]}</div>',
    '<div class=cs-home-body-title>Manual Check',
    '<div class=cs-home-body-text>',
      '<pre>{[SM.he(values.check?.content?.trim())]}</pre>',
    '</div>',
    '</div>',
    '<div class=cs-home-body-title>Fix',
    '<div class=cs-home-body-text>',
    '<pre>{[SM.he(values.fix?.text?.trim())]}</pre>',
    '</div>',
    '</div>',
    '<div class=cs-home-header-sub></div>',
    '<div class=cs-home-body-title>Other Data',
    '<tpl if="values.detail.vulnDiscussion">',
      '<div class=cs-home-body-text><b>Vulnerability Discussion</b><br><br>',
      '<pre>{[SM.he(values.detail.vulnDiscussion?.trim())]}</pre>',
      '</div>',
    '</tpl>',
    '<tpl if="values.detail.documentable">',
    	'<div class=cs-home-body-text><b>Documentable: </b>{[SM.he(values.detail.documentable)]}</div>',
		'</tpl>',
    '<tpl if="values.detail.responsibility">',
      '<div class=cs-home-body-text><b>Responsibility: </b>{[SM.he(values.detail.responsibility)]}</div>',
    '</tpl>',
    '<tpl if="values.ccis.length === 0">',
      '<div class=cs-home-body-text><b>Controls: </b>No mapped controls</div>',
    '</tpl>',
    '<tpl if="values.ccis.length !== 0">',
      '<div class=cs-home-body-text><b>Controls: </b><br>',
      '<table class=cs-home-body-table border="1">',
      '<tr><td><b>CCI</b></td><td><b>AP Acronym</b></td><td><b>Control</b></td></tr>',
      '<tpl for="ccis">',
      '<tr><td>{cci}</td><td>{[SM.he(values.apAcronym)]}</td><td>{[SM.he(values.control)]}</td></tr>',
      '</tpl>',
      '</table>',
      '</div>',
    '</tpl>',
    '</div>'
  )

  SM.StoreRowCount = function (store, noun = 'row', iconCls = 'sm-database-icon') {
    const rowCount = store.data.length || 0
    const totalCount = store.snapshot?.length || rowCount

    return `<span class="sm-review-sprite ${iconCls}">${rowCount}${store.isFiltered() ? ' of ' + totalCount : ''} ${noun}${totalCount === 1 ? '' : 's'}</span>`
  }

  SM.RowCountTextItem = Ext.extend(Ext.Toolbar.TextItem, {
    initComponent: function () {
        // initial configuration supports {store, noun, iconCls}
        const _this = this
        const config = {
            store: this.store
        }
        const events = ['load', 'datachanged','remove','clear','add']
        for (const event of events) {
            this.store?.on(event, () => _this.setText(SM.StoreRowCount(_this.store, _this.noun, _this.iconCls)))
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.RowCountTextItem.superclass.initComponent.call(this)
    }  
  })

  function tagValueProcessor(tagName, tagValue) {
    const txt = document.createElement("textarea")
    txt.innerHTML = tagValue
    return txt.value
  }

  SM.safeJSONParse = function (value) {
    try {
        return JSON.parse(value)
      }
      catch (e) {
        return undefined
      }  
  }

  SM.TruncateLimit = 256
  SM.Truncate = function (value, storeId, recordId) {
    if (value.length > SM.TruncateLimit) {
        return `${value.slice(0,SM.TruncateLimit)}...`
    }
    else {
        return value
    }
  }
  SM.TruncateRecordProperty = function (record, property) {
      const value = SM.he(record.data[property])
      if (!value) return

      if (value.length > SM.TruncateLimit) {
          return `${value.slice(0,SM.TruncateLimit)}... <span class=sm-truncated-action onclick="SM.ShowUntruncated('${record.store.storeId}','${record.id}','${property}')">Full text</span>`
      }
      else {
          return value
      }
  }

  SM.ShowUntruncated = function (storeId, recordId, property) {
    const record = Ext.StoreMgr.get(storeId).getById(recordId)
    const textarea = new Ext.form.TextArea({
        readOnly: true
    })
    const closeBtn = new Ext.Button({
        text: 'Close',
        handler: function() {
            fpwindow.close()
        }
    })
    const copyBtn = new Ext.Button({
      text: 'Copy to clipboard',
      handler: function() {
          navigator.clipboard.writeText(textarea.value)
      }
    })
    const fpwindow = new Ext.Window({
      title: `Full ${property}`,
      modal: true,
      resizable: true,
      width: 520,
      height: 560,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:20px;',
      buttonAlign: 'right',
      buttons: [
        copyBtn,
        closeBtn
      ],
      items: textarea,
      listeners: {
          show: function (window) {
              textarea.setValue(SM.he(record.data[property]))
          }
      }
    })
    fpwindow.show()
  }

  SM.ReloadStoreButton = Ext.extend(Ext.Button, {
    initComponent: function () {
        const _this = this

        this.showLoadingIcon = () => _this.setIconClass('icon-loading')
        this.showRefreshIcon = () => _this.setIconClass('icon-refresh')
        this.onBeforeLoad = (store) => {
            const grid = _this.ownerCt?.ownerCt || _this.grid || store.grid
            const emptyEl = grid?.view?.mainBody?.dom?.querySelector('.x-grid-empty')
            if (emptyEl) {
                emptyEl.innerHTML = `<div class="icon-loading" style="padding-left:20px;">Loading</div>`
            }
            _this.showLoadingIcon()
        }


        if (this.store) {
            this.store.on('beforeload', this.onBeforeLoad, this)
            this.store.on('load', this.showRefreshIcon, this)
        }

        const destroy = () => {
            if (_this.store) {
                _this.store.un('beforeload', _this.onBeforeLoad, _this);
                _this.store.un('load', _this.showRefreshIcon, _this);
            }
        }
        const config = {
            grid: this.grid,
            iconCls: 'icon-refresh',
            tooltip: 'Reload the grid',
            width: 20,
            listeners: {
                destroy
            }
        }
        if (!this.handler && this.store) {
            this.handler = async () =>  {
                const grid = _this.ownerCt?.ownerCt || _this.grid || store.grid
                if (grid && grid.loadMask) {
                    grid.loadMask.disabled = false
                }
                await _this.store.reloadPromise()
                if (grid && grid.loadMask) {
                    grid.loadMask.disabled = true
                }

            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        this.superclass().initComponent.call(this)
    }
  })
  Ext.reg('sm-reload-store-button', SM.ReloadStoreButton)

  SM.AddPanelToMainTab = function (panel, tabMode = 'permanent') {
    const tp = Ext.getCmp('main-tab-panel')
    const ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
    if (ephTabIndex !== -1) {
      tp.remove(tp.items.itemAt(ephTabIndex))
      tp.insert(ephTabIndex, panel);
    } else {
      tp.add(panel)
    }
    panel.sm_tabMode = tabMode
    panel.updateTitle && panel.updateTitle.call(panel)
    tp.setActiveTab(panel.id)
  }


  SM.CreateAlertBodyFromErrorResponse = function(errorResponse) {
    if (errorResponse?.hasOwnProperty('options')){
        let alertBody = `request: <br>
        ${errorResponse.options.method}   ${errorResponse.options.url} <br>
        response:  <br>
        status: ${errorResponse.response?.status}`
        let responseObject = SM.safeJSONParse(errorResponse.response?.responseText)
        for (const property in responseObject) {
            alertBody += ` <br> ${property}: ${responseObject[property]}`;
        }
        return alertBody
    }
    else{
        return JSON.stringify(errorResponse)
    }

  }

  SM.Global.HelperComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        const config = {
            listeners: {
                render: function (cb) {
                    cb.trigger.insertHtml('afterEnd',`<i class="fa fa-question-circle sm-question-circle"></i>`)
                    const sonarCloudInsists = new Ext.ToolTip({
                        target: cb.wrap.dom.getElementsByClassName('fa')[0],
                        showDelay: 0,
                        dismissDelay: 0,
                        width: 300,
                        html: cb.helpText,
                        tpl: cb.helpTpl,
                        data: cb.helpData
                    }) 
                }
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.Global.HelperComboBox.superclass.initComponent.call(this)
    }
})

SM.Global.helperCheckboxRadioInitComponent = function () {
    const config = {
        listeners: {
            render: function (cb) {
                cb.wrap.first('label').insertHtml('beforeEnd',`<i class="fa fa-question-circle sm-question-circle"></i>`)
                const sonarCloudInsists = new Ext.ToolTip({
                    target: cb.wrap.dom.getElementsByClassName('fa')[0],
                    showDelay: 0,
                    dismissDelay: 0,
                    width: 300,
                    html: cb.helpText,
                    tpl: cb.helpTpl,
                    data: cb.helpData
                }) 
            }
        }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
}
SM.Global.HelperCheckbox = Ext.extend(Ext.form.Checkbox, {
    initComponent: SM.Global.helperCheckboxRadioInitComponent
})

SM.Global.HelperRadio = Ext.extend(Ext.form.Radio, {
    initComponent: SM.Global.helperCheckboxRadioInitComponent
})


SM.Global.GridCellContextMenu = new Ext.menu.Menu({
    items: [
        {
            text: `Copy value`,
            itemId: 'copycell',
            iconCls: 'sm-copy-icon'
        },
        '-',
        {
            text: `Copy row as CSV`,
            itemId: 'copyrow',
            iconCls: 'sm-copy-icon'
        }
    ],
    onCellContextMenu: function (grid, rowIndex, cellIndex, e) {
        const menu = SM.Global.GridCellContextMenu
        menu.grid = grid
        menu.rowIndex = rowIndex
        menu.cellIndex = cellIndex
        menu.cellText = grid.getView().getCell(rowIndex, cellIndex).innerText
        const cellDisplay = `"${menu.cellText.length > 24 ? menu.cellText.slice(0, 24) + '...' : menu.cellText + '"'}`
        menu.items.items[0].setText(`Copy value <b>${cellDisplay}</b>`)
        menu.showAt(e.xy)
    },
    listeners: {
        click: function (menu, item) {
            if (item.itemId === 'copycell') {
                navigator.clipboard.writeText(menu.cellText)
            }
            else {
                let csv = ''
                const rowArray = []
                const columns = menu.grid.getColumnModel().getColumnsBy(() => true)
                const rowDiv = menu.grid.getView().getRow(menu.rowIndex)
                // headerArray[] will hold data for the CSV header row
                const headerArray = []
                // ci[] will hold only the column indexes for which we will encode cell data
                const ci = []
                for (let x = 0; x < columns.length; x++) {
                    const c = columns[x]
                    // Criteria for inclusion of the column
                    if (c.dataIndex != "" && c.header != "" && !c.hidden) {
                        // Build an element to hold the column header's HTML
                        const el = document.createElement('html')
                        el.innerHTML = c.header
                        // Try to find the first child element with an 'exportvalue' attribute
                        const ev = el.querySelector('[exportvalue]')
                        if (ev != null) {
                            // An element with an 'exportvalue' attribute was found. The CSV column header will be the value of 'exportvalue'
                            headerArray.push('"' + ev.getAttribute('exportvalue') + '"')
                        }
                        else {
                            // No element with an 'exportvalue' attribute was found was found. The CSV column header will be the quoted UI column header
                            headerArray.push('"' + c.header + '"')
                        }
                        // Add this column index to ci[]
                        ci.push(x)
                    }
                }
                // Comma separate the header data and append to the CSV 
                csv += headerArray.join(',') + "\n"
                const rowCells = rowDiv.getElementsByTagName('tr')[0].cells
                // Iterate across the included column indexes 
                for (let x = 0; x < ci.length; x++) {
                    const ev = rowCells[ci[x]].querySelector('[exportvalue]')
                    if (ev != null) {
                        // An element with an 'exportvalue' attribute was found was found. The CSV data will be the value of 'exportvalue'
                        rowArray.push('"' + ev.getAttribute('exportvalue') + '"')
                    }
                    else {
                        // No element with an 'exportvalue' attribute was found was found. The CSV data will be the quoted and escaped textContent of the <td>'s firstChild
                        const value = '"' + rowCells[ci[x]].firstChild.textContent.replace(/"/g, '""').trim() + '"'
                        rowArray.push(value)
                    }
                }
                // Comma separate the row data and append to the CSV 
                csv += rowArray.join(',') + "\n"
                navigator.clipboard.writeText(csv)
            }
        }
    }
})

// Global copy-to-clipboard context menu for GridPanel
// Source: carl.a.smigielski@saic.com
Ext.override(Ext.grid.GridPanel, {
    initEvents: function () {
        Ext.grid.GridPanel.superclass.initEvents.call(this)
        // override code: add handler for cellcontextmenu event
        this.on('cellcontextmenu', SM.Global.GridCellContextMenu.onCellContextMenu, this)

        if (this.loadMask) {
            this.loadMask = new Ext.LoadMask(this.bwrap,
                Ext.apply({ store: this.store }, this.loadMask));
        }
    }
})

SM.Global.filenameComponentFromDate = function (dateObject = new Date()) {
    return dateObject.toISOString().replace(/:|\d{2}\.\d{3}/g,'')
}

SM.Global.filenameEscaped = function (value) {
    /**
     * Regexes match characters that need to be escaped in filenames.
     * @type {RegExp}
     */
    const osReserved = /[/\\:*"?<>|]/g
    const controlChars = /[\x00-\x1f]/g
  
      /**
     * Map of characters to their corresponding named HTML entities.
     * @type {Object.<string, string>}
     */
    const osReserveReplace = {
      '/': '&sol;',
      '\\': '&bsol;',
      ':': '&colon;',
      '*': '&ast;',
      '"': '&quot;',
      '?': '&quest;',
      '<': '&lt;',
      '>': '&gt;',
      '|': '&vert;',
    }
  
    return value.toString()
    .replace(osReserved, (match) => osReserveReplace[match])
    .replace(controlChars, (match) => `&#x${match.charCodeAt(0).toString().padStart(2,'0')};`)
    .substring(0, 255)
  }

