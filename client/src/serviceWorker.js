let counter = 0
const requests = {}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.onmessage = (event) => {
  if (event.data?.type === 'proxy-url-request' && event.data.request) {
    const port = event.ports[0]
    const ourCounter = ++counter
    requests[`${ourCounter}`] = event.data.request
    port.postMessage(`service-proxy-${ourCounter}`)  
  }
}

self.onfetch = (event) => {
  if (event.request.url.includes('service-proxy-')) {
    const key = event.request.url.match(/service-proxy-(\d+)/)[1]
    const {url, ...init} = requests[key]
    event.respondWith(fetch(url, init));
  } 
  else {
    event.respondWith(fetch(event.request));
  }
}
