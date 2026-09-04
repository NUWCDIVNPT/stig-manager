import { ref } from 'vue'
import activityHandler from './ActivityHandler.js'

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
      activityHandler.remove()
    }
    else if (event.data?.type === 'accessToken') {
      noTokenMessage.value = null
      activityHandler.add()
    }
  })
}

export function useOidcWorker() {
  return {
    noTokenMessage,
  }
}
