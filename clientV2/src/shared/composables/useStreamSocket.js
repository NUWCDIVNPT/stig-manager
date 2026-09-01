/* eslint-disable no-undef */
import { readonly, ref } from 'vue'
import { useEnv } from '../stores/useEnv.js'

// Reusable WebSocket transport for STIG Manager's server sockets. Owns the
// connection lifecycle, authorize handshake, token refresh and reconnect; is
// agnostic to payload shape (callers pass onMessage / call sendCommand). Auth

export function deriveSocketUrl(apiUrl, path) {
  const root = String(apiUrl).replace(/\/api\/?$/, '')
  const cleanPath = String(path).replace(/^\/+/, '')
  return `${root}/${cleanPath}`.replace(/^http/, 'ws')
}

const DEFAULT_CONNECT_ERROR_MESSAGE = `Unable to establish the WebSocket connection.

This is usually caused by a reverse proxy not forwarding the HTTP Upgrade request. For nginx and compatible proxies:

  proxy_http_version 1.1;
  proxy_set_header   Upgrade $http_upgrade;
  proxy_set_header   Connection "upgrade";
  proxy_set_header   Host $host;
  proxy_read_timeout 3600s;`

export function useStreamSocket({
  path,
  onMessage,
  onStatusChange,
  autoReconnect = true,
  maxReconnectAttempts = 5,
  authTimeoutMs = 10000,
  connectErrorMessage = DEFAULT_CONNECT_ERROR_MESSAGE,
  getToken = () => STIGMAN.oidcWorker.token,
  channelName = STIGMAN.oidcWorker.channelName,
} = {}) {
  const status = ref('idle') // idle | connecting | authorizing | open | reconnecting | closed
  const isAuthorized = ref(false)
  const lastError = ref(null)

  let ws = null
  let broadcastChannel = null
  let reconnectAttempt = 0
  let reconnectTimer = null
  let authTimer = null
  let manualClose = false
  // Whether this socket has ever reached the WS `open` event. Distinguishes a
  // failure to establish (proxy/upgrade problem — not retryable) from a drop of
  // a previously-working connection (transient — reconnect with backoff).
  let everOpened = false

  function setStatus(next) {
    status.value = next
    onStatusChange?.(next)
  }

  function buildUrl() {
    return deriveSocketUrl(useEnv().apiUrl, path)
  }

  function sendRaw(message) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return true
    }
    return false
  }

  function clearAuthTimer() {
    clearTimeout(authTimer)
    authTimer = null
  }

  // Sends the token and arms a timeout: if the server never answers our
  // authorize frame, give up rather than hang in 'authorizing' forever.
  function authorize() {
    sendRaw({ type: 'authorize', data: { token: getToken() } })
    clearAuthTimer()
    if (authTimeoutMs > 0) {
      authTimer = setTimeout(() => {
        lastError.value = 'Authorization timed out'
        manualClose = true
        ws?.close(4008, 'Authorization timed out')
      }, authTimeoutMs)
    }
  }

  // Called for each parsed inbound frame. Auth frames are handled here; every
  // other frame (including 'log') is forwarded to the caller.
  function handleMessage(message) {
    if (message.type === 'authorize') {
      clearAuthTimer() // the server answered our handshake
      const state = message.data?.state
      if (state === 'authorized') {
        isAuthorized.value = true
        reconnectAttempt = 0
        lastError.value = null // a prior connect error is now stale
        setStatus('open')
      }
      else if (state === 'unauthorized') {
        isAuthorized.value = false
        const reason = message.data?.reason || ''
        // A rejected token is fatal — re-sending it would just loop against the
        // server's 10s unauthorized timer. An unlabeled prompt (initial connect)
        // or an expiry is answered with a fresh token.
        if (reason.startsWith('Authorization failed')) {
          lastError.value = reason
          manualClose = true
          ws?.close(4001, reason)
        }
        else {
          authorize()
        }
      }
      return
    }
    onMessage?.(message)
  }

  function attachSocket(socket) {
    socket.addEventListener('open', () => {
      everOpened = true
      setStatus('authorizing')
    })
    socket.addEventListener('message', (event) => {
      let message
      try {
        message = JSON.parse(event.data)
      }
      catch {
        return
      }
      handleMessage(message)
    })
    socket.addEventListener('close', onSocketClose)
    socket.addEventListener('error', () => {
      lastError.value = 'WebSocket connection error'
    })
  }

  // Releases the dead socket and broadcast channel after a terminal close, so a
  // later connect() (e.g. remounting the view) can rebuild both — connect() is
  // deliberately a no-op while `ws` is set.
  function releaseSocket() {
    ws = null
    broadcastChannel?.close()
    broadcastChannel = null
  }

  function onSocketClose(event) {
    isAuthorized.value = false
    clearAuthTimer()
    // 1000 = normal/manual, >=4000 = our custom auth failures: never reconnect.
    const fatal = manualClose || event.code === 1000 || event.code >= 4000
    if (fatal) {
      releaseSocket()
      setStatus('closed')
      return
    }
    // Never opened → this is a failure to establish the connection (proxy /
    // HTTP-Upgrade misconfig), not a transient drop. Surface actionable guidance
    // instead of silently retrying against a proxy that will keep refusing.
    if (!everOpened) {
      lastError.value = connectErrorMessage
      releaseSocket()
      setStatus('closed')
      return
    }
    if (!autoReconnect) {
      releaseSocket()
      setStatus('closed')
      return
    }
    scheduleReconnect()
  }

  function scheduleReconnect() {
    reconnectAttempt += 1
    if (reconnectAttempt > maxReconnectAttempts) {
      lastError.value = `Connection failed after ${maxReconnectAttempts} attempts`
      releaseSocket()
      setStatus('closed')
      return
    }
    setStatus('reconnecting')
    const delay = Math.min(1000 * 2 ** (reconnectAttempt - 1), 30000)
    reconnectTimer = setTimeout(openSocket, delay)
  }

  function openSocket() {
    setStatus('connecting')
    ws = new WebSocket(buildUrl())
    attachSocket(ws)
  }

  // Re-authorizes an already-open session with a freshly minted token so the
  // stream survives token rotation without a reconnect.
  function onTokenBroadcast(event) {
    if (event.data?.type === 'accessToken' && ws?.readyState === WebSocket.OPEN) {
      sendRaw({ type: 'authorize', data: { token: event.data.accessToken } })
    }
  }

  function connect() {
    if (ws) {
      return
    }
    manualClose = false
    reconnectAttempt = 0
    everOpened = false
    if (channelName) {
      broadcastChannel = new BroadcastChannel(channelName)
      broadcastChannel.addEventListener('message', onTokenBroadcast)
    }
    openSocket()
  }

  function disconnect() {
    manualClose = true
    clearTimeout(reconnectTimer)
    reconnectTimer = null
    clearAuthTimer()
    broadcastChannel?.close()
    broadcastChannel = null
    if (ws) {
      ws.close(1000, 'Client closed')
      ws = null
    }
    isAuthorized.value = false
    setStatus('closed')
  }

  function sendCommand(command, extra = {}) {
    return sendRaw({ type: 'command', data: { command, ...extra } })
  }

  return {
    status: readonly(status),
    isAuthorized: readonly(isAuthorized),
    lastError: readonly(lastError),
    connect,
    disconnect,
    send: sendRaw,
    sendCommand,
  }
}
