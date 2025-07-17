Ext.ns('SM.Attachments')

SM.Attachments.Grid = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function() {
    const me = this
    const nonce = Ext.id()
    const fields = [
      'name',
      'size',
      'type',
      'description',
      'digest',
      'user',
      {
        name: 'date',
        type: 'date',
        dateFormat: 'c'
      }
    ]
    const store = new Ext.data.JsonStore({
      grid: this,
      root: '',
      fields: fields,
      idProperty: 'digest'
    })
    // const totalTextCmp = new SM.RowCountTextItem ({
    //   store: store
    // })
    const columns = [
      {
        header: "Artifact",
        id: `name-${nonce}`,
        width: 100,
        dataIndex: 'name',
        sortable: true,
        align: 'left',
        renderer: function (value, metadata, record) {
          var returnStr = '<img src="' + getFileIcon(value) + '" class="sm-artifact-file-icon">';
          returnStr += '<b>' + SM.he(value) + '</b>';
          returnStr += '<br><b>Type:</b> ' + record.data.type + ' <b>Size:</b> ' + record.data.size;
          returnStr += `<br><i>Attached ${record.data.date.format('Y-m-d')} by ${SM.he(record.data.user.name)}</i>`;
          return returnStr;
        }
      },
      {
        width: 25,
        header: 'view', // not shown, used in cellclick handler
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          metadata.css = 'artifact-view'
          metadata.attr = 'ext:qtip="View artifact"'
          return ''
        }
      },
      {
        width: 25,
        header: 'download', // not shown, used in cellclick handler
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          metadata.css = 'artifact-download'
          metadata.attr = 'ext:qtip="Download artifact"'
          return ''
        }
      },
      {
        width: 25,
        header: 'delete',
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          metadata.css = 'artifact-delete';
          metadata.attr = 'ext:qtip="Unattach the artifact from this review"';
          return '';
        }
      }
    ]
    const loadArtifacts = async function () {
      try {
        store.removeAll()
        const artifactValue = await getMetadataValue('artifacts')
        store.loadData(JSON.parse(artifactValue))
        return true
      }
      catch (e) {
        return false
      }
    }
    const getMetadataValue = async function (key) {
      return Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/reviews/${me.assetId}/${me.ruleId}/metadata/keys/${key}`,
        method: 'GET'
      })
    }
    const onFileSelected = async function (uploadField) {
      try {
        let input = uploadField.fileInput.dom
        const files = [...input.files]
        await putArtifact(files[0])
        uploadField.reset()
      }
      catch (e) {
        uploadField.reset()
        SM.Error.handleError(e)
      }
    }

    const putArtifact = async function (file) {
      let md
      try {
        md = await getMetadataFromFile(file)
        await putMetadataValue(md.attachment.digest, md.data)
      }
      catch (e) {
        SM.Error.handleError(e)
        return
      }
      try {
        store.loadData([md.attachment], true) // append
        const data = store.getRange().map( record => record.data )
        await putMetadataValue('artifacts', JSON.stringify(data))
      }
      catch (e) {
        try {
          await deleteMetadataKey(md.attachment.digest)
        }
        catch (e2) {
          console.log(e2)
          SM.Error.handleError(e2)
        }
      }
    }
    const getMetadataFromFile = async function  (file) {
      const dataBuffer = await readArrayBufferAsync(file)
      const base64 = btoa(
        new Uint8Array(dataBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer); // hash the message
      const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array, then regular array.
      const shahex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
      return {
        attachment: {
          name: file.name,
          date: new Date(),
          size: file.size,
          type: file.type,
          user: {
            userId: curUser.userId,
            name: curUser.displayName
          },
          digest: shahex
        },
        data: base64
      }
    }
    const putMetadataValue = async function (key, value) {
      return Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/reviews/${me.assetId}/${me.ruleId}/metadata/keys/${key}`,
        method: 'PUT',
        jsonData: JSON.stringify(value)
      })
    }
    const removeArtifact = async function (record) {
      const confirm = await SM.confirmPromise('Confirm',`Remove ${record.data.name}?`)
      if (confirm === 'yes') {
        try {
          await deleteMetadataKey(record.data.digest)
        }
        catch (e) {
          SM.Error.handleError(e)
          return
        }
        try {
          store.remove(record)
          const data = store.getRange().map( r => r.data)
          await putMetadataValue('artifacts', JSON.stringify(data))  
        }
        catch (e) {
          SM.Error.handleError(e)
        }
      }
    }
    const deleteMetadataKey = async function (key) {
      let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/collections/${me.collectionId}/reviews/${me.assetId}/${me.ruleId}/metadata/keys/${key}`,
        method: 'DELETE'
      })
      return result.response.responseText ? JSON.parse(result.response.responseText) : ""
    }
    const showImage = async function (artifactObj) {
      const imagePanel = new Ext.Panel({
        bodyStyle: 'background-color: #333;'
      })
      const vpSize = Ext.getBody().getViewSize()
      let height = vpSize.height * 0.75
      let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024
      const fpwindow = new Ext.Window({
        title: `Image`,
        modal: true,
        resizable: true,
        width: width,
        height: height,
        layout: 'fit',
        plain: true,
        bodyStyle: 'padding:5px;',
        buttonAlign: 'center',
        items: imagePanel
      })
      fpwindow.show()
      // could show a wait indicator for image loading if necessary
      try {
        const imageB64 = await getMetadataValue(artifactObj.digest)
        imagePanel.update(`<img style='height: 100%; width: 100%; object-fit: contain' src='data:${artifactObj.type};base64,${encodeURI(imageB64)}'></img>`) 
      }
      catch (e) {
       SM.Error.handleError(e)
      }
    }
    const downloadArtifact = async function (artifactObj) {
      try {
        const imageB64 = await getMetadataValue(artifactObj.digest)
        
        // Create a link element for download
        const link = document.createElement('a')
        link.href = `data:${artifactObj.type};base64,${encodeURI(imageB64)}`
        link.download = artifactObj.name
        
        // Append to document, trigger click, and remove
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      catch (e) {
        SM.Error.handleError(e)
      }
    }
    const fileUploadField = new Ext.ux.form.FileUploadField({
      buttonOnly: true,
      accept: '.gif,.jpg,.jpeg,.svg,.png,.bmp',
      webkitdirectory: false,
      multiple: false,
      style: 'width: 95px;',
      buttonText: `Attach image...`,
      buttonCfg: {
          icon: "img/attachment.svg",
          tooltip: ''
      },
      listeners: {
          fileselected: onFileSelected
      }      
    })
    const config = {
      loadArtifacts: loadArtifacts,
      fileUploadField: fileUploadField,
      updateAttachmentButtonState: function(reviewExists, hasWriteAccess) {
        fileUploadField.setDisabled(!reviewExists || !hasWriteAccess)
        if (fileUploadField.button) {
          if (!reviewExists) {
            fileUploadField.button.setTooltip('Save the review before attaching evidence')
          } else if (!hasWriteAccess) {
            fileUploadField.button.setTooltip('No write access')
          } else {
            fileUploadField.button.setTooltip('Attach an image file as evidence for this review')
          }
        }
      },
      disableSelection: true,
      layout: 'fit',
      cls: 'custom-artifacts',
      hideHeaders: true,
      border: this.border || false,
      store: store,
      columns: columns,
      stripeRows: true,
      view: new SM.ColumnFilters.GridView({
        forceFit: true,
        emptyText: 'No attachments to display.',
        deferEmptyText: false
      }),
      tbar: new Ext.Toolbar({
        items: [
          fileUploadField
        ]
      }),
      loadMask: {msg: ''},
      autoExpandColumn: `name-${nonce}`,
      emptyText: 'No attachments to display',
      listeners: {
        cellclick: function (grid, rowIndex, columnIndex, e) {
          var r = grid.getStore().getAt(rowIndex)
          var header = grid.getColumnModel().getColumnHeader(columnIndex)
          switch (header) {
            case 'view':
              showImage(r.data)
              break
            case 'download':
              downloadArtifact(r.data)
              break
            case 'delete':
              removeArtifact(r)
              break
          }
        }
      }
    }   
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Attachments.Grid.superclass.initComponent.call(this)
  }
})


function readBinaryStringAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    }
    reader.onerror = reject;
    reader.readAsBinaryString(file)
  })
}

function readArrayBufferAsync(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    }
    reader.onerror = reject;
    reader.readAsArrayBuffer(file)
  })
}
