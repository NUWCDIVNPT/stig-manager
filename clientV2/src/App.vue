<script setup>
import ReauthPrompt from './auth/ReauthPrompt.vue'
import { useOidcWorker } from './auth/useOidcWorker.js'
import CatBadge from './components/common/CatBadge.vue'
import CoraPctBadge from './components/common/CoraPctBadge.vue'
import EngineBadge from './components/common/EngineBadge.vue'
import ManualBadge from './components/common/ManualBadge.vue'
import OverrideBadge from './components/common/OverrideBadge.vue'
import ResultBadge from './components/common/ResultBadge.vue'
import StatusBadge from './components/common/StatusBadge.vue'
import GlobalBanner from './components/global/GlobalBanner.vue'
import GlobalErrorModal from './components/global/GlobalErrorModal.vue'
import GlobalServiceOverlay from './components/global/GlobalServiceOverlay.vue'
import HomePage from './Home/Home.vue'

const oidcWorker = useOidcWorker()
console.log('oidcWorker state', oidcWorker)
</script>

<template>
  <div style="position: absolute; top: 0; left: 0; z-index: 9999; background: #222; padding: 10px; display: flex; gap: 10px; border: 1px solid #444;">
    <ResultBadge status="O" :count="5" />
    <ResultBadge status="NF" :count="2" />
    <ResultBadge status="NA" :count="1" />
    <ResultBadge status="NR+" :count="10" />
    <ResultBadge status="I" :count="3" />
    <StatusBadge status="saved" :count="2" />
    <StatusBadge status="submitted" :count="1" />
    <StatusBadge status="rejected" :count="1" />
    <StatusBadge status="accepted" :count="1" />
    <CatBadge category="1" :count="5" />
    <CatBadge category="2" :count="0" />
    <CatBadge category="3" />
    <CoraPctBadge risk-rating="Very High" :weighted-avg="0.153" />
    <CoraPctBadge risk-rating="High" :weighted-avg="0.321" />
    <CoraPctBadge risk-rating="Moderate" :weighted-avg="0.555" />
    <CoraPctBadge risk-rating="Low" :weighted-avg="0.899" />
    <CoraPctBadge risk-rating="Very Low" :weighted-avg="1.0" />
    <ManualBadge :count="3" />
    <EngineBadge :count="15" />
    <OverrideBadge :count="2" />
    <ManualBadge :count="0" /> <!-- Should be hidden -->
  </div>
  <GlobalBanner />
  <GlobalErrorModal />
  <ReauthPrompt
    v-if="oidcWorker.noTokenMessage.value"
    :redirect-oidc="oidcWorker.noTokenMessage.value?.redirectOidc"
    :code-verifier="oidcWorker.noTokenMessage.value?.codeVerifier"
    :state="oidcWorker.noTokenMessage.value?.state"
  />
  <GlobalServiceOverlay />
  <HomePage />
</template>

<style scoped>
</style>
