<script setup>
import ReauthPrompt from './auth/ReauthPrompt.vue'
import GlobalBanner from './components/global/GlobalBanner.vue'
import GlobalErrorModal from './components/global/GlobalErrorModal.vue'
import GlobalServiceOverlay from './components/global/GlobalServiceOverlay.vue'
import HomePage from './Home/Home.vue'
import { useGlobalStateStore } from './shared/stores/globalAuthStore.js'

const globalState = useGlobalStateStore()
</script>

<template>
  <GlobalBanner />
  <GlobalErrorModal />
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
