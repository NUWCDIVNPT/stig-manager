let counter = 0
const requests = {}

async function fetchAttachment(url, init, attachment) {
  const fetchResponse = await fetch(url, init)
  const headers = { ...fetchResponse.headers, 'content-disposition': `attachment; filename="${attachment}"` }
  return new Response(
    fetchResponse.body,
    {
      headers,
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
    },
  )
}

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
    const { url, attachment, ...init } = requests[key]
    delete requests[key]
    if (attachment) {
      event.respondWith(fetchAttachment(url, init, attachment))
    }
    else {
      event.respondWith(fetch(url, init))
    }
  }
}
