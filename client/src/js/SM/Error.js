Ext.ns('SM.Error')

class SmError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
  }
}

class PrivilegeError extends SmError {
  constructor(detail) {
    super('User has insufficient privilege to use this app.')
    this.detail = detail
  }
}

class ExtRequestError extends SmError {
  constructor(detail, message = 'Ext.Ajax.request() failed') {
    super(message)
    this.method = detail?.options?.method
    this.url = detail?.options?.url
    this.status = detail?.response?.status
    this.responseText = detail?.response?.responseText
    this.responseHeaders = detail?.response?.getAllResponseHeaders?.()
    const tokenParsed = { ...window.oidcProvider.tokenParsed }
    let expDate = new Date(tokenParsed.exp*1000)
    let iatDate = new Date(tokenParsed.iat*1000)
    let authTimeDate = new Date(tokenParsed.auth_time*1000)
    tokenParsed.exp = `${tokenParsed.exp} (${expDate.format('Y-m-d H:i:s')})`
    tokenParsed.iat = `${tokenParsed.iat} (${iatDate.format('Y-m-d H:i:s')})`
    tokenParsed.auth_time = `${tokenParsed.auth_time} (${authTimeDate.format('Y-m-d H:i:s')})`
    this.tokenParsed = tokenParsed
    this.detail = detail
  }
}

class ExtDataProxyError extends SmError {
  constructor(exception, message = 'Ext.data.DataProxy fired an exception') {
    super(message)
    const options = exception?.callback?.arguments?.[0]
    const response = exception?.callback?.arguments?.[2]
    this.method = options?.method
    this.url = options?.url
    this.status = response?.status
    this.responseText = response?.responseText
    this.responseHeaders = response?.getAllResponseHeaders?.()
    const tokenParsed = { ...window.oidcProvider.tokenParsed }
    let expDate = new Date(tokenParsed.exp*1000)
    let iatDate = new Date(tokenParsed.iat*1000)
    let authTimeDate = new Date(tokenParsed.auth_time*1000)
    tokenParsed.exp = `${tokenParsed.exp} (${expDate.format('Y-m-d H:i:s')})`
    tokenParsed.iat = `${tokenParsed.iat} (${iatDate.format('Y-m-d H:i:s')})`
    tokenParsed.auth_time = `${tokenParsed.auth_time} (${authTimeDate.format('Y-m-d H:i:s')})`
    this.tokenParsed = tokenParsed
    this.detail = {
      options: {
        method: options.method,
        url: options.url,
        params: options.params,
        headers: options.headers
      }, response}
  }
}

class NonJsonResponse extends ExtRequestError {
  constructor(detail) {
    super(detail, 'The response is not JSON.')
  }
}

Object.assign(SM.Error, {
  SmError,
  PrivilegeError,
  ExtRequestError,
  ExtDataProxyError,
  NonJsonResponse 
})

SM.Error.FormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this

    this.displayField = new Ext.form.DisplayField({
      fieldLabel: 'Message',
      value: '<b>An unhandled error has occurred. You can review the error details below and copy the details to your clipboard.</b>',
      height: 40
    })
  

    this.jsonViewDisplayField = new Ext.form.DisplayField({
      allowBlank: true,
      style: 'border: 1px solid #C1C1C1',
      fieldLabel: 'Detail',
      autoScroll: true,
      border: true,
      name: 'errorObj',
      // height: 150,
      anchor: '100% -80',
      setValue: function (v) {
          if (Object.keys(v).length === 0 && v.constructor === Object) {
              return
          }
          if (!v.env) {
            v.env = STIGMAN.Env
          }
          const tree = JsonView.createTree(v)
          tree.key = 'error'
          tree.isExpanded = true
          tree.children[0].isExpanded = true
          const el = this.getEl().dom
          JsonView.render(tree, el)
          // JsonView.expandChildren(tree)
          this.value = v
      }
    })
    
    const config = {
      border: false,
      labelWidth: 65,
      hideLabels: true,
      items: [
        this.displayField,
        this.jsonViewDisplayField
      ],
      buttons: [{
        text: 'Copy to clipboard',
        handler: async function (btn) {
          await navigator.clipboard.writeText(JSON.stringify(_this.jsonViewDisplayField.value))
        }
      }]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.Error.displayError = function (data) {
  const fp = new SM.Error.FormPanel()
  const appwindow = new Ext.Window({
    title: 'Unhandled Error',
    cls: 'sm-dialog-window sm-round-panel',
    modal: true,
    hidden: true,
    width: 660,
    height: 650,
    layout: 'fit',
    plain:true,
    bodyStyle:'padding:15px;',
    buttonAlign:'right',
    items: fp
  })
  appwindow.render(document.body)
  fp.getForm().setValues(data)
  appwindow.show(document.body)
}


SM.Error.handleError = async function (e) {
  try {
    if (STIGMAN.isMinimizedSource && !SM.Error.sourceMapConsumer) {
      await SM.Error.initSourceMap()
    }
    let errorObj
    if (e instanceof ErrorEvent) e = e.error
    if (e instanceof Error) {
      if (STIGMAN.isMinimizedSource) {
        e.sourceStack = SM.Error.getOriginalSource(e.stack)
      }
      if (e?.detail?.options?.headers?.Authorization) {
        e.detail.options.headers.Authorization = '<removed>'
      }
      errorObj = STIGMAN.serializeError(e.error ? e.error : e)
      // errorObj = e.error ? e.error : e
    }
    else {
      errorObj = STIGMAN.serializeError(e.error ? e.error : e)
    }
    SM.Error.displayError({errorObj})
  }
  catch (e) {
    alert(e.message ?? 'error in SM.Error.handleError()!')
  }
}

SM.Error.initSourceMap = async function () {
  try {
    window.sourceMap.SourceMapConsumer.initialize({
      "lib/mappings.wasm": "js/modules/source-map/mappings.wasm"
    })
    const response = await fetch ('js/stig-manager.min.js.map')
    const text = await response.text()
    SM.Error.sourceMapConsumer = await new window.sourceMap.SourceMapConsumer(JSON.parse(text))

  }
  catch (e) {
    SM.Error.handleError(e)
  }

}

SM.Error.getOriginalSource = function (stackTrace) {
  let output = ''
  const stack = SM.StackTrace.parse(stackTrace)
  stack.forEach(({ methodName, lineNumber, column }) => {
    try {
      if (lineNumber == null || lineNumber < 1) {
        output += `    at ${methodName || ''}\n`
      } else {
        const pos = SM.Error.sourceMapConsumer.originalPositionFor({ line: lineNumber, column });
        if (pos?.line != null) {
          output += `    at ${pos.name || ''} (${pos.source}:${pos.line}:${pos.column})\n`
        }
      }
    } catch (err) {
      output += `    at FAILED_TO_PARSE_LINE\n`
    }
  })
  return output
}