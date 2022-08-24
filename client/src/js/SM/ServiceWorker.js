Ext.ns('SM.ServiceWorker')

SM.ServiceWorker.getDownloadUrl = async function (request) {
  const messageChannel = new MessageChannel()
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'proxy-url-request',
      request
    }, [messageChannel.port1])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 3000)
      messageChannel.port2.onmessage = (event) => {
        clearTimeout(timer)
        resolve(event.data)
      }
    })
  }
  else {
    return null
  }
}
