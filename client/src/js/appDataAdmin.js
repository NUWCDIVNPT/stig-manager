async function addAppDataAdmin( params ) {
  let detailBodyWrapEl
  try {
    let { treePath } = params
    const tab = Ext.getCmp('main-tab-panel').getItem('appdata-admin-tab')
    if (tab) {
      tab.show()
      return
    }

    const detailJson = new Ext.Panel({
      region: 'center',
      title: 'Anonymized Deployment Details',
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
      autoScroll: true,
      buttonAlign: 'left',
      bbar: [
        {
          text: 'JSON',
          iconCls: 'sm-export-icon',
          handler: function (btn) {
            if (detailResponseText) {
              const blob = new Blob([detailResponseText], {type: 'application/json'})
              downloadBlob(blob, SM.Global.filenameEscaped(`stig-manager-details_${SM.Global.filenameComponentFromDate()}.json`))
            }
          }
        }
      ]
    })

    const appDataPanel = new Ext.Panel({
      region: 'north',
      title: 'Application Data <span class="sm-navtree-sprite">experimental</span>',
      margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
      cls: 'sm-round-panel',
      height: 200,
      labelWidth: 1,
      hideLabel: true,
      // width: 500,
      padding: 10,
      defaults: {
        anchor: '100%',
        allowBlank: false
      },
      items: [
        {
          xtype: 'fieldset',
          width: 200,
          title: 'Export',
          items: [
            {
              xtype: 'button',
              id: 'appdata-admin-form-export-btn',
              text: 'Download Application Data&nbsp;',
              iconCls: 'sm-export-icon',
              handler: async function () {
                try {
                  Ext.getBody().mask('Waiting for JSON...');
                  let appdata = await getAppdata()
                  downloadBlob(appdata.blob, appdata.filename)
                }
                catch (e) {
                  SM.Error.handleError(e)
                }
                finally {
                  Ext.getBody().unmask();
                }
              }
            }
          ]
        },
        {
          xtype: 'fieldset',
          title: 'Import',
          width: 200,
          items: [
            {
              xtype: 'button',
              id: 'appdata-admin-form-import-btn',
              text: 'Replace Application Data...&nbsp;',
              iconCls: 'sm-import-icon',
              handler: handleImport
            }
          ]
        }
      ]
    })

    function handleImport (item, event) {
      let fp = new Ext.FormPanel({
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
              html: "Please browse for an Application Data file",
            }]
          },
          {
            xtype: 'fileuploadfield',
            id: 'form-file',
            emptyText: 'Browse for a file...',
            name: 'importFile',
            accept: '.json,.zip',
            buttonText: 'Browse...',
            buttonCfg: {
              icon: "img/disc_drive.png"
            }
          },
          {
            xtype: 'displayfield',
            id: 'infoText2',
            name: 'infoText',
            html: "<i><b>IMPORTANT: Content from the imported file will replace ALL existing application data!</b></i>",
          }
        ],
        buttonAlign: 'center',
        buttons: [
          {
            text: 'Import',
            icon: 'img/page_white_get.png',
            tooltip: 'Import the data',
            formBind: true,
            handler: async function(){
              try {
                let input = document.getElementById("form-file-file")
                let file = input.files[0]
                let formEl = fp.getForm().getEl().dom
                let formData = new FormData(formEl)
                // appwindow.close();
                initProgress("Importing file", "Waiting for response...");
                updateStatusText ('Waiting for API response...')
                await window.oidcProvider.updateToken(10)
                let response = await fetch(`${STIGMAN.Env.apiBase}/op/appdata?elevate=true`, {
                  method: 'POST',
                  headers: new Headers({
                    'Authorization': `Bearer ${window.oidcProvider.token}`
                  }),
                  body: formData
                })
                const reader = response.body.getReader()
                const td = new TextDecoder("utf-8")
                let isdone = false
                do {
                  const {value, done} = await reader.read()
                  updateStatusText (td.decode(value),true)
                  isdone = done
                } while (!isdone)
                updateProgress(0, 'Done')
              }
              catch (e) {
                SM.Error.handleError(e)
              }
            }
          },
          {
            text: 'Cancel',
            handler: function(){appwindow.close();}
          }
        ]
      });
    
      var appwindow = new Ext.Window({
        title: 'Initialize Application Data',
        cls: 'sm-dialog-window sm-round-panel',
        modal: true,
        width: 500,
        layout: 'fit',
        plain:true,
        bodyStyle:'padding:5px;',
        buttonAlign:'center',
        items: fp
      });
    
      appwindow.show(document.body);
    }

    async function getAppdata () {
      try {
        let url = `${STIGMAN.Env.apiBase}/op/appdata?elevate=true`
        await window.oidcProvider.updateToken(10)
        let response = await fetch(
          url,
          {
            method: 'GET',
            headers: new Headers({
                'Authorization': `Bearer ${window.oidcProvider.token}`
            })
          }
        )
        const contentDispo = response.headers.get("content-disposition")
        //https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
        const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
        const blob = await response.blob()
        return ({blob, filename})
      }
      catch (e) {
        SM.Error.handleError(e)
      }
    }

    async function getDetail () {
      return Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/op/details`,
        params: {
          elevate: curUser.privileges.canAdmin
        },
        method: 'GET'
      })
    }

    function downloadBlob (blob, filename) {
      let a = document.createElement('a')
      a.style.display = "none"
      let url = window.URL.createObjectURL(blob)
      a.href = url
      a.download = filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url)
    }


    const thisTab = Ext.getCmp('main-tab-panel').add({
      id: 'appdata-admin-tab',
      sm_treePath: treePath,
      iconCls: 'sm-database-save-icon',
      title: 'Application Info',
      closable: true,
      layout: 'border',
      border: false,
      items: [detailJson, appDataPanel]
    })
    thisTab.show()

    detailBodyWrapEl = detailJson.getEl().child('.x-panel-bwrap')
    detailBodyWrapEl.mask('Getting data...')
    const detailResponseText = (await getDetail()).response.responseText //used by downloadBlob
    const detailTree = JsonView.createTree(JSON.parse(detailResponseText))
    // adjust for rendering
    // the parent and first child (dbInfo) are expanded
    detailTree.key = `GET ${STIGMAN.Env.apiBase}/op/details?elevate=true`
    detailTree.isExpanded = true
    detailTree.children[0].isExpanded = true

    JsonView.render(detailTree, detailJson.body)
  }
  catch (e) {
    SM.Error.handleError(e)
  }
  finally {
    detailBodyWrapEl.unmask()
  }
}