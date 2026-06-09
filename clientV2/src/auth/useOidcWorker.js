import { ref } from 'vue'

const noTokenMessage = ref(null)

export function setupOidcHandler() {
  const bc = new BroadcastChannel(STIGMAN.oidcWorker.channelName)
  bc.addEventListener('message', async (event) => {
    if (event.data?.type === 'noToken') {
      const noTokenData = {
        type: 'noToken',
        isIdle: event.data.isIdle,
        ...event.data.clientV2,
      }
      noTokenMessage.value = noTokenData
    }
    else if (event.data?.type === 'accessToken') {
      noTokenMessage.value = null
    }
  })
}

export function useOidcWorker() {
  return {
    noTokenMessage,
  }
}
