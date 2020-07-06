function addAppDataAdmin() {

  let apiPanel = new Ext.Panel({
    // baseCls: 'x-plain',
		cls: 'sm-round-panel',
		margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    region: 'center',
    // autoHeight: true,
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
        title: 'Export',
        items: [
          {
            xtype: 'button',
            id: 'appdata-admin-form-export-btn',
            text: 'Download Application Data',
            iconCls: 'sm-export-icon',
            handler: async function () {
              try {
                Ext.getBody().mask('Waiting for JSON...');
                let appdata = await getAppdata()
                downloadBlob(appdata.blob, appdata.filename)
              }
              catch (e) {
                alert(e.blob)
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
        items: [
          {
            xtype: 'button',
            id: 'appdata-admin-form-import-btn',
            text: 'Replace Application Data...',
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
              let response = await fetch(`${STIGMAN.Env.apiBase}/op/appdata?elevate=true`, {
                method: 'POST',
                headers: new Headers({
                  'Authorization': `Bearer ${window.keycloak.token}`
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
              alert(e)
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
  
  let getAppdata = function () {
    return new Promise((resolve, reject) => {
      try {
        let xhr = new XMLHttpRequest()
        let url = `${STIGMAN.Env.apiBase}/op/appdata?elevate=true`
        xhr.open('GET', url)
        xhr.responseType = 'blob'
        xhr.setRequestHeader('Authorization', 'Bearer ' + window.keycloak.token)
        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            let contentDispo = this.getResponseHeader('Content-Disposition')
            //https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
            let fileName = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
            resolve({
              blob: xhr.response,
              filename: fileName
            })
          } else {
            reject({
              status: this.status,
              blob: xhr.response
            })
          }
        }
        xhr.onerror = function () {
          reject({
            status: this.status,
            message: xhr.statusText
          })
        }
        xhr.send()
      }
      catch (e) {
        reject(e)
      }
    })
  }

  let downloadBlob = function (blob, filename) {
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


  let thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'appdata-admin-tab',
    iconCls: 'sm-database-save-icon',
    title: 'Application Data',
    closable: true,
    layout: 'border',
    border: false,
    items: [apiPanel]
  })
  thisTab.show();

}