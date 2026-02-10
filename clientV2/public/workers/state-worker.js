
// Shared worker for API state monitoring via SSE (Server-Sent Events)
//
// Handles messages 'initialize', 'getApiState'.
// The 'initialize' message returns immediately if already initialized by another browsing context.
// Otherwise, it connects to the EventSource endpoint and waits up to 5 seconds for the first message.
// This is designed to error out for deployments where the SSE endpoint is buffered (no immediate message).
// The worker broadcasts all received events to all connected contexts via BroadcastChannel.
// Implements custom reconnect logic that retries connections even on 502 errors from reverse proxies.

const logPrefix = '[state-worker]:'
const retryInterval = 3000; // 3-second retry delay
const channelName = crypto.randomUUID()
const stateWorkerChannel = new BroadcastChannel(channelName); // Used to broadcast state events

let initialized = false // True if any context has initialized the worker
let apiBase = ''        // Base URL for API endpoints
let state = null        // Last known state from the API
let eventSource = null  // Current EventSource connection

// Message handlers for the shared worker
// 'initialize': sets up the SSE connection and broadcasts state
// 'getApiState': fetches the current API state via HTTP
const messageHandlers = {
  initialize,
  getApiState
}

// Shared worker entry point: handle new connections from browsing contexts
onconnect = function (e) {
  const port = e.ports[0]
  port.onmessage = onMessage
  port.start()
}

// Handles 'initialize' message from a context. If already initialized, returns immediately.
// Otherwise, connects to the SSE endpoint and waits for the first message (with a 5s timeout).
// Broadcasts the first state, then attaches persistent listeners for future events.
function initialize(options) {
  if (initialized) return Promise.resolve({ success: true, channelName, state });

  return new Promise((resolve) => {
    apiBase = options.apiBase;
    let timeoutId;
    eventSource = new EventSource(`${apiBase}/op/state/sse`);

    // Handle SSE errors, which are usually disconnections
    eventSource.onerror = (event) => {
      if (!initialized) {
        clearTimeout(timeoutId);
        resolve({ success: false, error: 'API connection error' });
      }
      reconnectSSE();
    };

    // One-time handler for the first SSE message
    const onFirstMessage = (event) => {
      clearTimeout(timeoutId);
      stateWorkerChannel.postMessage({ type: event.type, data: event.data });
      state = event.data;
      addListeners();
      initialized = true;
      resolve({ success: true, channelName, state });
    };
    eventSource.addEventListener('state-report', onFirstMessage, { once: true });

    // If the first message doesn't arrive in 5 seconds, treat as error (e.g., buffered SSE endpoint)
    timeoutId = setTimeout(() => {
      eventSource.removeEventListener('state-report', onFirstMessage);
      stateWorkerChannel.postMessage({ type: 'state-error', data: 'Timeout waiting for first SSE message' });
      resolve({success: false, error: `Timeout waiting for API state event stream.<br><br>
        A reverse proxy may be buffering responses from ${eventSource.url}.<br><br>
        To disable using event stream, set STIGMAN_CLIENT_STATE_EVENTS=false` });
    }, 5000);
  });
}


// Handles 'getApiState' message: fetches the current API state via HTTP
async function getApiState() {
  const url = `${apiBase}/op/state`
  const response = await fetch(url)
  if (!response.ok) {
    return {success: false, error: `Failed to get API state: ${response.status} ${response.statusText}`}
  }
  const data = await response.json()
  return { success: true, data }
}


// Handles messages from all connected contexts
async function onMessage(e) {
  const port = e.target
  const { requestId, request, ...options } = e.data
  const handler = messageHandlers[request]
  if (handler) {
    try {
      const response = await handler(options)
      port.postMessage({ requestId, response })
    } catch (error) {
      port.postMessage({ requestId, response: { success: false, error: error.message } })
    }
  } else {
    port.postMessage({ requestId, error: 'Unknown request' })
  }
}


// Custom reconnect logic for SSE: retries connections even on 502 errors from reverse proxies
function reconnectSSE() {
  if (eventSource) eventSource.close();
  eventSource = new EventSource(`${apiBase}/op/state/sse`);

  eventSource.onopen = function (event) {
    addListeners();
  };
  eventSource.onerror = function (error) {
    stateWorkerChannel.postMessage({ type: 'state-error', data: {message: `Cannot connect to ${error.target.url}` } });
    eventSource.close(); // Close the failed connection
    // Delay before retrying
    setTimeout(() => {
      reconnectSSE();
    }, retryInterval);
  };
}

// Attach persistent listeners for all relevant SSE events and broadcast them to all contexts
function addListeners() {
  const events = ['state-report', 'state-changed', 'dependency-changed'];
  const listener = (event) => {
    stateWorkerChannel.postMessage({ type: event.type, data: event.data });
    state = event.data;
  }
  for (const eventName of events) {
    eventSource.addEventListener(eventName, listener);
  }
  eventSource.addEventListener('error', () => {
    for (const eventName of events) {
      eventSource.removeEventListener(eventName, listener);
    }
  }, { once: true });
}

