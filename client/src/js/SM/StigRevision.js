Ext.ns('SM.StigRevision')

SM.StigRevision.RevisionMenuBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const _this = this
    menu = new SM.StigRevision.RevisionMenu( { iconCls: 'icon-del' })
    const config = { menu }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.StigRevision.RevisionMenuBtn.superclass.initComponent.call(this)
  }
})

SM.StigRevision.RevisionMenu = Ext.extend(Ext.menu.Menu, {
  load: async function (record) {
    this.removeAll()
    const re = /^V([\d,\.]{1,5})R([\d,\.]{1,5})$/

    for (const revision of record.data.revisions) {
      const matches = re.exec(revision.revisionStr)
      if (matches && matches.length === 3) {
        const text = `Version ${SM.he(matches[1])} Release ${SM.he(matches[2])}&nbsp;&nbsp;<span class="sm-review-sprite sm-review-sprite-date">${revision.benchmarkDate}</span> <span class="sm-navtree-sprite">${revision.status}</span>${revision.revisionStr === record.data.lastRevisionStr ? '<span class="sm-navtree-sprite">latest</span>' : ''}`
        this.addItem({
          iconCls: revision.collectionIds.length ? 'sm-pin-icon' : 'icon-del',
          isAssigned: !!revision.collectionIds.length,
          text,
          revisionStr: revision.revisionStr,
          benchmarkId: record.data.benchmarkId,
          record
        })
      }
    }
    this.addItem('-')
    this.addItem({
      iconCls: 'icon-del',
      text: 'Remove all revisions',
      benchmarkId: record.data.benchmarkId,
      isAssigned: !!record.data.collectionIds.length,
      record
    })
  }
})

SM.StigRevision.removeStig = function (benchmarkId, force = false) {
  return Ext.Ajax.requestPromise({
    responseType: 'json',
    url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}?elevate=true&force=${force ? 'true' : 'false'}`,
    method: 'DELETE'
  })
}

SM.StigRevision.removeStigRevision = async function (benchmarkId, revisionStr, force = false) {
  const result = await Ext.Ajax.requestPromise({
    url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}?elevate=true&force=${force ? 'true' : 'false'}`,
    method: 'DELETE'
  })
  return JSON.parse(result.response.responseText)
}

SM.StigRevision.getStig = async function (benchmarkId) {
  const result = await Ext.Ajax.requestPromise({
    url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}`,
    method: 'GET'
  })
  return JSON.parse(result.response.responseText)
}

SM.StigRevision.StigGrid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this

    const fields = Ext.data.Record.create([
      {name: 'benchmarkId', type: 'string', sortType: Ext.data.SortTypes.asUCString},
      'title',
      'status',
      'lastRevisionStr',
      'lastRevisionDate',
      'collectionIds',
      {
        name: 'collections',
        convert: function (v, record) {
          return record.collectionIds.length
        }
      },
      'ruleCount',
      'revisionStrs',
      'revisions'
    ])

    const sm = new Ext.grid.CheckboxSelectionModel({ 
      singleSelect: false,
      checkOnly: false,
      listeners: {
        selectionchange: function (sm) {
          const count = sm.getCount()
          if (count === 1) {
            const r = sm.getSelected()
            if (r.data.revisionStrs.length >= 2) {
              revisionMenu.load(r)
              removeRevisionBtn.setVisible(true)
              removeStigsBtn.setVisible(false)
            }
            else {
              removeRevisionBtn.setVisible(false)
              removeStigsBtn.setVisible(true)
              removeStigsBtn.setDisabled(false)
              removeStigsBtn.setText(`Remove STIG`)
            }
            libraryBtn.setDisabled(false)
          }
          else {
            libraryBtn.setDisabled(true)
            removeRevisionBtn.setVisible(false)
            if (count > 0) {
              removeStigsBtn.setText(`Remove STIG (${count})`)
              removeStigsBtn.setDisabled(false)
            }
            else {
              removeStigsBtn.setText(`Remove`)
              removeStigsBtn.setDisabled(true)
            }
            removeStigsBtn.setVisible(true)
          }

          SM.SetCheckboxSelModelHeaderState(sm)
        }
      }
    })
  
    const columns = [
      sm,
      { 	
        header: "Benchmark ID",
        width: 300,
        dataIndex: 'benchmarkId',
        sortable: true,
        filter: {type: 'string'}
      },
      { 	
        header: "Title",
        id: 'stigGrid-title-column',
        width: 350,
        dataIndex: 'title',
        sortable: true,
        filter: {type: 'string'}
      },
      { 	
        header: "Status",
        width: 150,
        align: "center",
        dataIndex: 'status',
        sortable: true,
        filter: {type: 'values'}
      },
      { 	
        header: "Latest revision",
        width: 150,
        align: "center",
        dataIndex: 'lastRevisionStr',
        sortable: true
      },
      { 	
        header: "Revision date",
        width: 150,
        align: "center",
        dataIndex: 'lastRevisionDate',
        xtype: 'datecolumn',
        format: 'Y-m-d',
        sortable: true
      },
      { 	
        header: "Earlier revisions",
        width: 150,
        align: "center",
        dataIndex: 'revisionStrs',
        sortable: true,
        renderer: (v, md, r) => v.filter( rev => rev !== r.data.lastRevisionStr ).join(', ') || '--'
      },
      { 	
        header: "Rules",
        width: 150,
        align: "center",
        dataIndex: 'ruleCount',
        sortable: true
      },
      { 	
        header: "Collections",
        width: 150,
        align: "center",
        dataIndex: 'collections',
        sortable: true,
        renderer: SM.styledZeroRenderer
      }
    ]
  
    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/stigs?elevate=true&projection=revisions`,
        method: 'GET'
      }),
      root: '',
      fields,
      idProperty: 'benchmarkId',
      sortInfo: {
        field: 'benchmarkId',
        direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
      },
      listeners: {
        // load: function (store,records) {
        //   store.isLoaded = true
        //   _this.getSelectionModel().selectFirstRow();
        // }
      }
    })

    const totalTextCmp = new SM.RowCountTextItem({ store })

    const view = new SM.ColumnFilters.GridView({
      forceFit:true,
      // These listeners keep the grid in the same scroll position after the store is reloaded
      listeners: {
        beforerefresh: function(v) {
           v.scrollTop = v.scroller.dom.scrollTop;
           v.scrollHeight = v.scroller.dom.scrollHeight;
        },
        refresh: function(v) {
          setTimeout(function() { 
            v.scroller.dom.scrollTop = v.scrollTop + (v.scrollTop == 0 ? 0 : v.scroller.dom.scrollHeight - v.scrollHeight);
          }, 100);
        },
        filterschanged: function (view) {
          store.filter(view.getFilterFns())  
        }
      },
      deferEmptyText:false
    })

    const importStigsBtn = new Ext.Button({
      iconCls: 'sm-import-icon',
      text: 'Import STIGs',
      disabled: false,
      handler: function() {
        SM.StigRevision.ImportStigs(_this)
      }
    })

    const libraryBtn = new Ext.Button({
      iconCls: 'sm-library-icon',
      text: 'Open in Library',
      disabled: true,
      handler: function () {
        const record = _this.getSelectionModel().getSelected()
        addLibraryStig({
          benchmarkId: record.data.benchmarkId,
          revisionStr: record.data.lastRevisionStr,
          stigTitle: record.data.title
        }) 
      }
    })
    
    const removeStigsBtn = new Ext.Button({
      iconCls: 'icon-del',
      text: 'Remove',
      disabled: true,
      handler: async function () {
        try {
          const records = _this.getSelectionModel().getSelections()
          const heBenchmarkIds = records.map( r => SM.he(r.data.benchmarkId))
          const forceRequired = records.some( r => r.data.collections > 0 )
          let benchmarkList 
          if (heBenchmarkIds.length > 10) {
            benchmarkList = `The ${heBenchmarkIds.length} selected STIGs`
          }
          else {
            benchmarkList = heBenchmarkIds.join('<br>')
          }
          const confirmed = await SM.StigRevision.showConfirm({
            message: `Confirm removal of:<br/><br/>${benchmarkList}<br/><br/>`,
            forceMessage: `${heBenchmarkIds.length === 1 ? 'This STIG is' : 'Some STIGs are'} in use. Remove anyway?`,
            forceRequired
          })
          if (confirmed) {
            Ext.getBody().mask('Removing')
            for (const record of records) {
              await SM.StigRevision.removeStig(record.data.benchmarkId, !!record.data.collections)
              _this.store.remove(record)
            }    
          }
        }
        catch (e) {
          SM.Error.handleError(e)
        }
        finally {
          Ext.getBody().unmask()
        }
      }
    })

    const revisionMenu = new SM.StigRevision.RevisionMenu({
      listeners: {
        itemclick: async function (item, e) {
          try {
            const confirmed = await SM.StigRevision.showConfirm({
              message: `Confirm removal of:<br/><br/>${item.benchmarkId} ${item.revisionStr ? item.revisionStr : ''}<br/><br/>`,
              forceMessage: `This ${item.revisionStr ? 'Revision' : 'STIG'} is in use. Remove anyway?`,
              forceRequired: item.isAssigned
            })
  
            if (confirmed) {
              Ext.getBody().mask('Removing')
              const record = item.record
              if (!item.revisionStr) { // remove STIG
                await SM.StigRevision.removeStig(item.benchmarkId, item.isAssigned)
                _this.store.remove(record)
              }
              else {
                await SM.StigRevision.removeStigRevision(item.benchmarkId, item.revisionStr, item.isAssigned)
                const apiStig = await SM.StigRevision.getStig(item.benchmarkId)
                record.data = apiStig
                record.commit()

                // hack to reselect the record
                const sm = _this.getSelectionModel()
						    sm.onRefresh()
                sm.fireEvent('selectionchange', sm)
              }
            }
          }
          catch (e) {
            SM.Error.handleError(e)
          }
          finally {
            Ext.getBody().unmask()
          }
            
        }
      }
    })

    const removeRevisionBtn = new Ext.Button({
      iconCls: 'icon-del',
      text: 'Remove Revision',
      hidden: true,
      menu: revisionMenu
    })

    const tbar = [
      importStigsBtn,
      '-',
      removeStigsBtn,
      removeRevisionBtn,
      '-',
      libraryBtn
    ]

    const bbar = new Ext.Toolbar({
      items: [
      {
        xtype: 'exportbutton',
        hasMenu: false,
        gridBasename: 'Installed-STIGs',
        exportType: 'grid',
        iconCls: 'sm-export-icon',
        text: 'CSV'
      },
      {
        xtype: 'tbfill'
      },{
        xtype: 'tbseparator'
      },
      totalTextCmp]
    })

    const config = {
      store,
      columns,
      view,
      tbar,
      bbar,
      sm,
      listeners: {
        rowdblclick: function (grid, rowIndex) {
          const record = grid.store.getAt(rowIndex)
          addLibraryStig({
            benchmarkId: record.data.benchmarkId,
            revisionStr: record.data.lastRevisionStr,
            stigTitle: record.data.title
          }) 
        },
        keydown: SM.CtrlAGridHandler
      }  
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.StigRevision.StigGrid.superclass.initComponent.call(this)
  }
})
Ext.reg('sm-stigrevision-grid', SM.StigRevision.StigGrid)

SM.StigRevision.ImportStigs = function ( grid ) {
  const clobberCb = new Ext.form.Checkbox({
    name: 'clobber',
    boxLabel: 'Replace existing Revisions',
    checked: localStorage.getItem('clobberRevision') == 1
  })
  const fp = new Ext.FormPanel({
    padding: 10,
    standardSubmit: false,
    fileUpload: true,
    baseCls: 'x-plain',
    monitorValid: true,
    autoHeight: true,
    labelWidth: 1,
    hideLabel: true,
    defaults: {
      anchor: '100%',
      allowBlank: false
    },
    items: [
      { 
        xtype:'fieldset',
        title: 'Instructions',
        autoHeight:true,
        items: [
        {
          xtype: 'displayfield',
          id: 'infoText1',
          name: 'infoText',
          html: "Please browse for a STIG archive or XCCDF",
        }]
      },
      {
        xtype: 'fileuploadfield',
        id: 'form-file',
        emptyText: 'Browse for a file...',
        name: 'importFile',
        accept: '.zip,.xml',
        buttonText: 'Browse...',
        buttonCfg: {
          icon: "img/disc_drive.png"
        }
      },
      clobberCb
    ],
    buttonAlign: 'center',
    buttons: [{
      text: 'Import',
      icon: 'img/page_white_get.png',
      tooltip: 'Import the archive',
      formBind: true,
      handler: async function () {
        try {
          let input = document.getElementById("form-file-file")
          const clobber = clobberCb.getValue()
          localStorage.setItem('clobberRevision', clobber ? '1' : '0')
          let file = input.files[0]
          let extension = file.name.substring(file.name.lastIndexOf(".")+1)
          if (extension.toLowerCase() === 'xml') {
            // let data = await readTextFileAsync(file)
            // const r = ReviewParser.benchmarkFromXccdf({
            //   data, 
            //   XMLParser: fxp.XMLParser,
            //   valueProcessor: tagValueProcessor
            // })
            
            let formEl = fp.getForm().getEl().dom
            let formData = new FormData(formEl)
            formData.delete('clobber')
            appwindow.close();
            initProgress("Importing file", "Initializing...");
            updateStatusText (file.name)
    
            await window.oidcProvider.updateToken(10)
            let response = await fetch(`${STIGMAN.Env.apiBase}/stigs?elevate=true&clobber=${clobber ? 'true':'false'}`, {
              method: 'POST',
              headers: new Headers({
                'Authorization': `Bearer ${window.oidcProvider.token}`
              }),
              body: formData
            })
            let json = await response.json()
            updateStatusText (JSON.stringify(json, null, 2))
            updateStatusText ('------------------------------------')
            updateStatusText ('Done')
            updateProgress(0, 'Done')
          }
          else if (extension === 'zip') {
            appwindow.close()
            initProgress("Importing file", "Initializing...");
            await processZip(input.files[0], clobber)
            updateStatusText ('Done')
            updateProgress(0, 'Done')
          } else {
            throw new Error(`No handler for ${extension}`)
          }
        }
        catch (e) {
          SM.Error.handleError(e)
        }
        finally {
          grid?.getStore()?.reload()
        }

        async function processZip (f, clobber) {
          try {
            let parentZip = new JSZip()
       
            let contents = await parentZip.loadAsync(f)
            let fns = Object.keys(contents.files)
            let xmlMembers = fns.filter( fn => fn.toLowerCase().endsWith('.xml'))
            let zipMembers = fns.filter( fn => fn.toLowerCase().endsWith('.zip') )
            for (let x=0,l=xmlMembers.length; x<l; x++) {
              let xml = xmlMembers[x]
              updateStatusText (xml)
              let data = await parentZip.files[xml].async("blob")
              let fd = new FormData()
              fd.append('importFile', data, xml)

              await window.oidcProvider.updateToken(10)
              let response = await fetch(`${STIGMAN.Env.apiBase}/stigs?elevate=true&clobber=${clobber ? 'true':'false'}`, {
                method: 'POST',
                params: { clobber },
                headers: new Headers({
                  'Authorization': `Bearer ${window.oidcProvider.token}`
                }),
                body: fd
              })
              let json = await response.json()
              updateStatusText (JSON.stringify(json, null, 2))
              updateStatusText ('------------------------------------')

            }
            for (let x=0, l=zipMembers.length; x<l; x++) {
              let zip = zipMembers[x]
              updateProgress((x+1)/l, zip.slice(zip.lastIndexOf('/') + 1))
              updateStatusText (`Extracting member ${zip}`)
              let data = await parentZip.files[zip].async("blob")
              updateStatusText (`Processing member ${zip}`)
              await processZip(data, clobber)
            }
            updateProgress(0, "")

          }
          catch (e) {
            updateStatusText (`Error processing ZIP: ${e.message}`)
            updateStatusText ('------------------------------------')
          }
          
        }
      }
    },
    {
      text: 'Cancel',
      handler: function() {
        appwindow.close()
      }
    }
    ]
  })

  const appwindow = new Ext.Window({
    title: 'Import STIG ZIP archive or XCCDF file',
    cls: 'sm-dialog-window sm-round-panel',
    modal: true,
    width: 500,
    layout: 'fit',
    plain:true,
    bodyStyle:'padding:5px;',
    buttonAlign:'center',
    items: fp
  })

  appwindow.show(document.body);

}

SM.StigRevision.ConfirmDeletePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const items = [
      new Ext.form.DisplayField({ 
        value: this.message || 'Confirm delete'
      })
    ]
    if (this.forceRequired) {
      items.push(new Ext.form.Checkbox({
        boxLabel: this.forceBoxLabel || 'Some items are in use. Confirm forced delete by checking this box.',
        listeners: {
          check: this.forceCheckboxHandler
        }
      }))
    }

    const config = {
      baseCls: 'x-plain',
      hideLabels: true,
      layout: 'form',
      items
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.StigRevision.showConfirm = function ({message, forceMessage, forceRequired}) {
  return new Promise((resolve, reject) => {
    const removeBtn = new Ext.Button({
      text: forceRequired ? 'Forcibly remove' : 'Remove',
      iconCls: 'icon-del',
      disabled: forceRequired,
      handler: () => { 
        fpwindow.close()
        resolve(true)
      }
    })
    const cancelBtn = new Ext.Button({
      text: 'Cancel',
      handler: () => { 
        fpwindow.close()
        resolve(false)
      }
    })
    function forceCheckboxHandler (cb, checked) {
      removeBtn.setDisabled(!checked)
    }
    const fp = new SM.StigRevision.ConfirmDeletePanel({
      message,
      forceBoxLabel: forceMessage,
      forceRequired,
      forceCheckboxHandler
    })
    const fpwindow = new Ext.Window({
      title: 'Confirm STIG removal',
      cls: 'sm-dialog-window sm-round-panel',
      modal: true,
      resizable: false,
      closable: false,
      width: 300,
      // height: 300,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:15px;',
      buttonAlign: 'right',
      items: fp,
      buttons: [ cancelBtn, removeBtn ]
    })
    fpwindow.show(document.body)
  })
}
