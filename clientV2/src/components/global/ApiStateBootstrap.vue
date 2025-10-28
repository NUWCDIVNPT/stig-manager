<script setup>
import { computed } from 'vue'
import { useStateWorker } from '../../auth/useStateWorker.js'

// (optional) keep the component name for devtools
defineOptions({ name: 'ApiStateBootstrap' })

const { state } = useStateWorker()

const displayed = computed(() => state.value ?? {})

const db = computed(() => displayed.value?.dependencies?.db ?? false)
const oidc = computed(() => displayed.value?.dependencies?.oidc ?? false)
const since = computed(() => displayed.value?.since ?? displayed.value?.lastUpdate ?? '')

const dbTextClass = computed(() => (db.value ? 'online' : 'offline'))
const oidcTextClass = computed(() => (oidc.value ? 'online' : 'offline'))
</script>

<template>
  <div class="api-bootstrap">
    <div class="center">
      <div class="spinner" aria-hidden />
      <div class="content">
        <div class="shield">
          <img src="/shield-green-check.svg" alt="OK" class="shield-img">
        </div>
        <h1>STIG Manager</h1>
        <p class="msg">
          The API is currently unavailable.
        </p>

        <div class="deps">
          <div>
            Database status: <span :class="dbTextClass">{{ dbTextClass }}</span>
          </div>
          <div>
            OIDC status: <span :class="oidcTextClass">{{ oidcTextClass }}</span>
          </div>
        </div>

        <div class="ts">
          Last update: {{ since }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.api-bootstrap {
  background: #2b2f33;
  min-height: 100vh;
  color: #e6e6e6;
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
}

.content {
  text-align: center;
  max-width: 760px;
}

.spinner {
  width: 36px;
  height: 36px;
  margin-bottom: 8px;
  border: 4px solid rgba(255, 255, 255, 0.06);
  border-top-color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.shield {
  width: 64px;
  height: 64px;
  margin: 6px auto;
}

.shield-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

h1 {
  margin: 8px 0 6px;
  font-size: 52px;
  color: #f2f2f2;
}

.msg {
  margin-bottom: 12px;
  color: #cfcfcf;
}

.deps {
  margin: 12px 0;
  font-size: 16px;
}

.deps span {
  font-weight: 700;
  margin-left: 8px;
}

.online {
  color: #7cc576;
}

.offline {
  color: #ff4d4d;
}

.ts {
  margin-top: 18px;
  color: #bdbdbd;
  font-size: 13px;
}
</style>
