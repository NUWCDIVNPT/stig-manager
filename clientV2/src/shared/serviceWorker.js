export function getDownloadUrl(request) {
  if (navigator.serviceWorker?.controller) {
    const messageChannel = new MessageChannel()
    navigator.serviceWorker.controller.postMessage({
      type: 'proxy-url-request',
      request,
    }, [messageChannel.port1])
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 3000)
      messageChannel.port2.onmessage = (event) => {
        clearTimeout(timer)
        resolve(event.data)
      }
    })
  }
  return null
}
