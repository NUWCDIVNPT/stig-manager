import { reactive } from 'vue'

function setupOidcWorker() {
  const worker = new SharedWorker('./oidc-worker.js', { name: 'oidc-worker', type: 'module' })
  const OW = reactive({
    async logout() {
      const response = await this.sendWorkerRequest({ request: 'logout' })
      if (response.success) {
        this.token = null
        this.tokenParsed = null
        window.location.href = response.redirect
      }
    },
    sendWorkerRequest(request) {
      const requestId = crypto.randomUUID()
      const port = this.worker.port
      port.postMessage({ ...request, requestId })
      return new Promise((resolve) => {
        function handler(event) {
          if (event.data.requestId === requestId) {
            port.removeEventListener('message', handler)
            resolve(event.data.response)
          }
        }
        port.addEventListener('message', handler)
      })
    },
    postContextActiveMessage() {
      this.worker.port.postMessage({ requestId: 'contextActive' })
    },
    worker,
  })

  OW.worker.port.start()

  const bc = new BroadcastChannel('stigman-oidc-worker')
  bc.onmessage = (event) => {
    if (event.data.type === 'accessToken') {
      console.log('{init] Received from worker:', event.type, event.data)
      OW.token = event.data.accessToken
      OW.tokenParsed = event.data.accessTokenPayload
    }
    else if (event.data.type === 'noToken') {
      console.log('{init] Received from worker:', event.type, event.data)
      OW.token = null
      OW.tokenParsed = null
    }
  }
  OW.bc = bc
  return OW
}

export { setupOidcWorker }
