Ext.ns('SM.StigRevision')

SM.StigRevision.RevisionMenuBtn = Ext.extend(Ext.Button, {
  initComponent: function () {
    const _this = this
    menu = new SM.StigRevision.RevisionMenu( { iconCls: 'icon-del' })
    const config = {
      menu: menu
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.StigRevision.RevisionMenuBtn.superclass.initComponent.call(this)
  }
})

SM.StigRevision.RevisionMenu = Ext.extend(Ext.menu.Menu, {
  load: async function (record) {
    this.removeAll()
    const re = /^V([\d,\.]{1,5})R([\d,\.]{1,5})$/
    for (const revisionStr of record.data.revisionStrs) {
      const matches = re.exec(revisionStr)
      if (matches && matches.length === 3) {
        const text = `Version ${SM.he(matches[1])} Release ${SM.he(matches[2])}${revisionStr === record.data.lastRevisionStr ? '<span class="sm-navtree-sprite">latest</span>' : ''}`
        this.addItem({
          iconCls: 'icon-del',
          text,
          revisionStr,
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
      record
    })
  }
})

SM.StigRevision.removeStig = async function (benchmarkId) {
  const result = await Ext.Ajax.requestPromise({
    url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}`,
    method: 'DELETE'
  })
  return JSON.parse(result.response.responseText)
}

SM.StigRevision.removeStigRevision = async function (benchmarkId, revisionStr) {
  const result = await Ext.Ajax.requestPromise({
    url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}`,
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
      'benchmarkId',
      'title',
      'status',
      'lastRevisionStr',
      'lastRevisionDate',
      // {
      //   name: 'lastRevisionDate',
      //   type: 'date',
      //   dateFormat: 'Y-m-d'
      // },
      'ruleCount',
      'autoCount',
      'revisionStrs'
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

          const hd = this.grid.view.innerHd.querySelector('.x-grid3-hd-row .x-grid3-td-checker .x-grid3-hd-checker')
          if (hd) {
            const hdState = this.selections.length === 0 ? null : this.grid.store.getCount() === this.selections.length ? 'on' : 'ind'
            hd.classList.remove('x-grid3-hd-checker-on')
            hd.classList.remove('x-grid3-hd-checker-ind')
            if (hdState) {
                hd.classList.add(`x-grid3-hd-checker-${hdState}`)
            }
          }

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
        header: "SCAP Rules",
        width: 150,
        align: "center",
        dataIndex: 'autoCount',
        sortable: true,
        renderer: (v) => v ? v : '--'
      }
    ]
  
    const store = new Ext.data.JsonStore({
      proxy: new Ext.data.HttpProxy({
        url: `${STIGMAN.Env.apiBase}/stigs`,
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
          let benchmarkList 
          if (heBenchmarkIds.length > 25) {
            benchmarkList = `The ${heBenchmarkIds.length} selected STIGs`
          }
          else {
            benchmarkList = heBenchmarkIds.join('<br>')
          }
          const savedMinWidth = Ext.MessageBox.minWidth
          Ext.MessageBox.minWidth = 400
          Ext.MessageBox.buttonText.yes = 'Remove'
          Ext.MessageBox.buttonText.no = 'Cancel'
          const id = await SM.confirmPromise('Confirm', `Do you wish to remove:<br/><br/>${benchmarkList}<br/>`)
          if (id === 'yes') {
            Ext.getBody().mask('Removing')
            for (const record of records) {
              await SM.StigRevision.removeStig(record.data.benchmarkId)
              _this.store.remove(record)
            }    
          }
        }
        catch (e) {
          alert('Error removing STIGs')
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
            Ext.MessageBox.minWidth = 400
            Ext.MessageBox.buttonText.yes = 'Remove'
            Ext.MessageBox.buttonText.no = 'Cancel'
            const id = await SM.confirmPromise('Confirm', `Do you wish to remove:<br><br>${item.benchmarkId} ${item.revisionStr ? item.revisionStr : ''}<br/>`)
            if (id === 'yes') {
              Ext.getBody().mask('Removing')
              const record = item.record
              if (!item.revisionStr) { // remove STIG
                await SM.StigRevision.removeStig(item.benchmarkId)
                _this.store.remove(record)
              }
              else {
                await SM.StigRevision.removeStigRevision(item.benchmarkId, item.revisionStr)
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
            alert('Error removing revision(s)')
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
        }
      }  
    }

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.StigRevision.StigGrid.superclass.initComponent.call(this)
  }
})

SM.StigRevision.ImportStigs = function ( grid ) {
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
          html: "Please browse for STIG",
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
      {
        xtype: 'displayfield',
        id: 'infoText2',
        name: 'infoText',
        html: "<i><b>IMPORTANT: Results from the imported file will overwrite any existing results!</b></i>",
      }
    ],
    buttonAlign: 'center',
    buttons: [{
      text: 'Import',
      icon: 'img/page_white_get.png',
      tooltip: 'Import the archive',
      formBind: true,
      handler: async function(){
        try {
          let input = document.getElementById("form-file-file")
          let file = input.files[0]
          let extension = file.name.substring(file.name.lastIndexOf(".")+1)
          if (extension.toLowerCase() === 'xml') {
            let formEl = fp.getForm().getEl().dom
            let formData = new FormData(formEl)
            formData.set('replace', 'true')
            appwindow.close();
            initProgress("Importing file", "Initializing...");
            updateStatusText (file.name)
    
            await window.oidcProvider.updateToken(10)
            let response = await fetch(`${STIGMAN.Env.apiBase}/stigs`, {
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
            await processZip(input.files[0])
            updateStatusText ('Done')
            updateProgress(0, 'Done')
          } else {
            alert(`No handler for ${extension}`)
          }
        }
        catch (e) {
          alert(e)
        }
        finally {
          grid?.getStore()?.reload()
        }

        async function processZip (f) {
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
              fd.append('replace', 'true')

              await window.oidcProvider.updateToken(10)
              let response = await fetch(`${STIGMAN.Env.apiBase}/stigs`, {
                method: 'POST',
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
              await processZip(data)
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
