<script setup>
import { ref, watchEffect } from 'vue'
import { useSSE } from '../composeables/useSSE.js'

const connected = ref(false)
const lastTick = ref(null)
const lastTickAt = ref(null)
const rawLastTick = ref(null)

// use the mock SSE endpoint provided by Vite middleware
const { close, reconnect } = useSSE('/api/mock-sse', {
  open: () => {
    connected.value = true
  },
  connect: () => {
    connected.value = true
  },
  tick: (d) => {
    lastTick.value = d?.str ?? null
    lastTickAt.value = d?.at ? new Date(d.at) : new Date()
    rawLastTick.value = d
  },
  error: () => {
    connected.value = false
  },
})

watchEffect(() => {
  if (!connected.value) {
    lastTick.value = null
    lastTickAt.value = null
  }
})

function disconnect() {
  close()
  connected.value = false
}
function doReconnect() {
  reconnect()
}
</script>

<template>
  <div class="p-4 space-y-3">
    <div class="flex items-center gap-3">
      <h2 class="text-xl font-semibold">
        SSE
      </h2>
      <span class="text-xs px-2 py-1 rounded bg-gray-200">{{ connected ? 'connected' : 'closed' }}</span>
      <button class="px-3 py-1 rounded bg-gray-800 text-white" @click="disconnect">
        Disconnect
      </button>
      <button class="px-3 py-1 rounded bg-green-600 text-white" @click="doReconnect">
        Reconnect
      </button>
    </div>

    <div>
      <p class="text-sm mt-1">
        Last tick: <span class="font-mono">{{ lastTick ?? '—' }}</span>
      </p>
      <p class="text-xs text-gray-500">
        at: {{ lastTickAt ? lastTickAt.toLocaleTimeString() : '—' }}
      </p>
    </div>
  </div>
</template>
