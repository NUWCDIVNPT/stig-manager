<script setup>
import ReauthPrompt from './auth/ReauthPrompt.vue'
import GlobalBanner from './components/global/GlobalBanner.vue'
import GlobalServiceOverlay from './components/global/GlobalServiceOverlay.vue'
import { useGlobalStateStore } from './shared/stores/globalAuthStore.js'
import HomePage from './SPAroot/StigmanSPA.vue'

const globalState = useGlobalStateStore()
</script>

<template>
  <GlobalBanner />
  <!-- Auth bits live here so they never unmount -->
  <ReauthPrompt
    v-if="globalState.noTokenMessage"
    :redirect="globalState.noTokenMessage?.redirect"
    :code-verifier="globalState.noTokenMessage?.codeVerifier"
    :state="globalState.noTokenMessage?.state"
  />
  <GlobalServiceOverlay />
  <HomePage />
</template>

<style scoped>
:root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
