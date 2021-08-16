Ext.ns('SM')

window.oidcProvider.onRefreshExpWarn = function (expTs) {
    let expiresIn = Math.round(expTs - (new Date().getTime() / 1000))
    let action = 'refresh' 
    Ext.Msg.alert('Session Timeout', `Your session will expire in ${expiresIn} seconds. Click OK to coontinue session`, function() {
        if (action === 'refresh') {
            window.oidcProvider.updateToken(-1)
        }
        else if (action === 'reload') {
            window.location.reload()
        }
    })
    let intervalId
    intervalId = setInterval(() => {
        let expiresIn = Math.round(expTs - (new Date().getTime() / 1000))  
        if (expiresIn <= 0) {
            clearInterval(intervalId)
            action = 'reload'
            Ext.Msg.updateText(`Your session has expired.  Click OK to reload STIG Manager`)
        }
        else {
            Ext.Msg.updateText(`Your session will expire in ${expiresIn} seconds.  Click OK to coontinue session`)
        }
    }, 1000)
}