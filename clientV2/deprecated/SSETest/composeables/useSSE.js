import { onBeforeUnmount } from 'vue'

export function useSSE(url, handlers = {}) {
  // normalize URL: make relative paths absolute to current origin so EventSource uses same origin
  const resolvedUrl = typeof window !== 'undefined' && !/^https?:\/\//i.test(url) ? `${window.location.origin}${url}` : url
  let es = null

  function attach() {
    try {
      es = new EventSource(resolvedUrl, { withCredentials: false })
    } catch (err) {
      console.error('[useSSE] failed to create EventSource', err, { url, resolvedUrl })
      if (handlers.error) handlers.error(err)
      es = null
      return
    }

    // default message handler for unnamed messages
    es.onmessage = (e) => {
      const data = safeJSON(e.data)
      console.debug('[useSSE] onmessage', { url, resolvedUrl, data })
      if (handlers.message) handlers.message(data)
    }

    // open/connect -> notify both 'open' and 'connect' handlers if present
    es.onopen = (e) => {
      console.debug('[useSSE] open', { url, resolvedUrl })
      if (handlers.open) handlers.open(e)
      if (handlers.connect) handlers.connect(e)
    }

    es.onerror = (e) => {
      console.debug('[useSSE] error', { url, resolvedUrl, e })
      if (handlers.error) handlers.error(e)
    }

    // register named event handlers
    Object.entries(handlers).forEach(([event, fn]) => {
      if (!fn) return
      if (event === 'message' || event === 'error' || event === 'open' || event === 'connect') return
      es.addEventListener(event, (e) => {
        const parsed = safeJSON(e.data)
        console.debug('[useSSE] event', event, parsed)
        fn(parsed, e)
      })
    })
  }

  function close() {
    if (es) {
      try {
        es.close()
      } catch (e) {
        console.debug('[useSSE] close failed', e)
      }
      es = null
    }
  }

  function reconnect() {
    close()
    attach()
  }

  // start
  attach()

  onBeforeUnmount(() => close())

  // return a small API rather than the raw EventSource so callers can reconnect
  return { close, reconnect, getEventSource: () => es }
}

function safeJSON(s) {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}
