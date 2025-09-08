const logPrefix = '[state-worker]:'
const channelName = 'stigman-state-worker'

let initialized = false
let apiBase = ''
let state = null
let eventSource = null
let retryInterval = 1000; // Start with a 1-second retry delay
const maxRetryInterval = 18000; // Cap the retry delay at 18 seconds
const stateWorkerChannel = new BroadcastChannel(channelName);

const messageHandlers = {
  initialize,
  setApiMode,
  scheduleApiMode,
  cancelScheduledApiMode,
  getApiState
}

// Worker entry point
onconnect = function (e) {
  const port = e.ports[0]
  port.onmessage = onMessage
  port.start()
}

function initialize(options) {
  if (initialized) return Promise.resolve({ success: true, channelName, state });

  apiBase = `../../${options.apiBase}`;
  return new Promise((resolve, reject) => {

    const stateWorkerChannel = new BroadcastChannel(channelName);
    eventSource = new EventSource(`${apiBase}/op/state/sse`);

    let timeoutId;

    eventSource.onerror = (event) => {
      if (!initialized) {
        clearTimeout(timeoutId);
        reject(new Error('SSE connection error'));
      }
      reconnectSSE();
    };

    // One-time handler for the first message
    const onFirstMessage = (event) => {
      clearTimeout(timeoutId);
      console.log(`${logPrefix} First SSE message:`, event);
      stateWorkerChannel.postMessage({ type: event.type, data: event.data });
      state = event.data;

      // Remove this one-time handler
      eventSource.removeEventListener('state-report', onFirstMessage);
      addListeners();
      console.log(`${logPrefix} Persistent SSE handlers attached`);
      initialized = true;
      resolve({ success: true, channelName, state });
    };

    eventSource.addEventListener('state-report', onFirstMessage);

    // Set up a timeout for the first message
    timeoutId = setTimeout(() => {
      eventSource.removeEventListener('state-report', onFirstMessage);
      stateWorkerChannel.postMessage({ type: 'state-error', data: 'Timeout waiting for first SSE message' });
      reject(new Error('Timeout waiting for first SSE message'));
    }, 5000);

    eventSource.onopen = () => {
      console.log(`${logPrefix} SSE connection opened`);
    };

    console.log(`${logPrefix} setup event source`);
  });
}

async function setApiMode({ mode, message, force, token }) {
  const url = `${apiBase}/op/state/mode?elevate=true${force ? '&force=true' : ''}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ mode, message })
  })
  if (!response.ok) {
    throw new Error(`Failed to set mode: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  console.log(`${logPrefix} Mode set:`, data)
  return { success: true, data }
}

async function scheduleApiMode({ nextMode, nextMessage, scheduledMessage, scheduleIn, force = false, token }) {
  const url = `${apiBase}/op/state/mode/schedule?elevate=true`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nextMode, nextMessage, scheduledMessage, scheduleIn, force })
  })
  if (!response.ok) {
    throw new Error(`Failed to set mode: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  console.log(`${logPrefix} Mode scheduled:`, data)
  return { success: true, data }
}

async function cancelScheduledApiMode({ token }) {
  const url = `${apiBase}/op/state/mode/schedule?elevate=true`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  if (!response.ok) {
    throw new Error(`Failed to cancel scheduled mode: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  console.log(`${logPrefix} Mode change cancelled:`, data)
  return { success: true, data }
}

async function getApiState() {
  const url = `${apiBase}/op/state`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to get API state: ${response.status} ${response.statusText}`)
  }
  const data = await response.json()
  return { success: true, data }
}

async function onMessage(e) {
  const port = e.target
  const { requestId, request, ...options } = e.data
  const handler = messageHandlers[request]
  if (handler) {
    try {
      const response = await handler(options)
      port.postMessage({ requestId, response })
    } catch (error) {
      port.postMessage({ requestId, error: error.message })
    }
  } else {
    port.postMessage({ requestId, error: 'Unknown request' })
  }
}

function reconnectSSE() {
  if (eventSource) {
    eventSource.close();
  }
  eventSource = new EventSource(`${apiBase}/op/state/sse`);

  eventSource.onopen = function (event) {
    console.log("SSE connection opened");
    // Reset retry interval on successful connection
    retryInterval = 1000;
    addListeners();
  };
  eventSource.onerror = function (error) {
    console.log(`${logPrefix} SSE error:`, error);
    stateWorkerChannel.postMessage({ type: 'state-error', data: error.data });
    eventSource.close(); // Close the failed connection

    // Implement a delay before retrying
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      reconnectSSE();
    }, retryInterval);

    // Exponentially increase the retry interval, up to a maximum
    retryInterval = Math.min(retryInterval * 2, maxRetryInterval);
  };
}

function addListeners() {
  const events = ['state-report', 'mode-changed', 'state-changed', 'mode-change-scheduled', 'mode-change-unscheduled', 'dependency-changed'];
  const listener = (event) => {
    console.log(`${logPrefix} ${event.type} event:`, event);
    stateWorkerChannel.postMessage({ type: event.type, data: event.data });
    state = event.data;
  }
  for (const eventName of events) {
    eventSource.addEventListener(eventName, listener);
    console.log(`${logPrefix} Listener added for ${eventName}`);
  }
  eventSource.addEventListener('error', () => {
    for (const eventName of events) {
      eventSource.removeEventListener(eventName, listener);
      console.log(`${logPrefix} Listener removed for ${eventName}`);
    }
  }, {once: true});
}

