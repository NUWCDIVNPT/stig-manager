const logPrefix = '[state-worker]:'
const channelName = 'stigman-state-worker'

let initialized = false
let apiBase = ''
let state = null

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

  return new Promise((resolve, reject) => {
    apiBase = options.apiBase;
    const stateWorkerChannel = new BroadcastChannel(channelName);
    const evtSource = new EventSource(`${apiBase}/op/state/sse`);

    let timeoutId;

    evtSource.onerror = (event) => {
      console.log(`${logPrefix} SSE error:`, event);
      stateWorkerChannel.postMessage({ type: 'state-error', data: event.data });
      if (!initialized) {
        clearTimeout(timeoutId);
        reject(new Error('SSE connection error'));
      }
    };

    // One-time handler for the first message
    const onFirstMessage = (event) => {
      clearTimeout(timeoutId);
      console.log(`${logPrefix} First SSE message:`, event);
      stateWorkerChannel.postMessage({ type: event.type, data: event.data });
      state = event.data;

      // Remove this one-time handler
      evtSource.removeEventListener('state-report', onFirstMessage);

      // Setup persistent handlers
      for (const eventName of [
        'mode-changed',
        'state-changed',
        'state-report',
        'mode-change-scheduled',
        'mode-change-unscheduled'
      ]) {
        evtSource.addEventListener(eventName, (event) => {
          console.log(`${logPrefix} ${event.type} event:`, event);
          stateWorkerChannel.postMessage({ type: event.type, data: event.data });
          state = event.data;
        });
      }

      console.log(`${logPrefix} Persistent SSE handlers attached`);
      initialized = true;
      resolve({ success: true, channelName, state });
    };

    evtSource.addEventListener('state-report', onFirstMessage);

    // Set up a timeout for the first message
    timeoutId = setTimeout(() => {
      evtSource.removeEventListener('state-report', onFirstMessage);
      stateWorkerChannel.postMessage({ type: 'state-error', data: 'Timeout waiting for first SSE message' });
      reject(new Error('Timeout waiting for first SSE message'));
    }, 5000);

    evtSource.onopen = () => {
      console.log(`${logPrefix} SSE connection opened`);
    };

    console.log(`${logPrefix} setup event source`);
  });
}

async function setApiMode({mode, message, force, token}) {
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

async function scheduleApiMode({nextMode, nextMessage, scheduledMessage, scheduledIn, force = false, token}) {
  const url = `${apiBase}/op/state/mode/schedule?elevate=true`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ nextMode, nextMessage, scheduledMessage, scheduledIn, force })
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


