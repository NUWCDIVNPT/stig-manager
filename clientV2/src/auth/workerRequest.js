/**
 * Sends a request over a worker port and resolves with the worker's response.
 * Rejects when the worker replies with `error`, which is how both workers report
 * a request they could not handle.
 */
export function sendWorkerRequest(port, request) {
  const requestId = crypto.randomUUID()
  port.postMessage({ ...request, requestId })
  return new Promise((resolve, reject) => {
    function handler(event) {
      if (event.data.requestId === requestId) {
        port.removeEventListener('message', handler)
        if (event.data.error) {
          reject(new Error(event.data.error))
        }
        else {
          resolve(event.data.response)
        }
      }
    }
    port.addEventListener('message', handler)
  })
}
