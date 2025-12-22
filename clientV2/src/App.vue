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
</style>
