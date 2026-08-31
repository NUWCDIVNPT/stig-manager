<script setup>
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { downloadPoam } from '../api/findingsApi.js'
import PoamDialog from './PoamDialog.vue'

const props = defineProps({
  collectionId: { type: [String, Number], required: true },
  // The active grid scope, passed straight through to the endpoint. The POA&M
  // endpoint only accepts groupId/ruleId, so the caller hides this for cci.
  aggregator: { type: String, required: true },
  // null → "All Collection STIGs"; omitted from the request in that case.
  benchmarkId: { type: [String, null], default: null },
})

// Controls the options form. The parent opens it via the footer action.
const optionsVisible = defineModel('visible', { type: Boolean, default: false })

// Blocking progress step: once the user submits the form, the options dialog
// closes and this takes over until the file has downloaded. Errors are swallowed
// by useAsyncState and routed to the global error modal.
const { isLoading: generating, execute } = useAsyncState(
  params => downloadPoam(props.collectionId, params),
  { immediate: false },
)

async function onGenerate(formParams) {
  const params = { ...formParams, aggregator: props.aggregator }
  if (props.benchmarkId) {
    params.benchmarkId = props.benchmarkId
  }
  await execute(params)
}
</script>

<template>
  <PoamDialog v-model:visible="optionsVisible" @generate="onGenerate" />

  <Dialog
    :visible="generating"
    modal
    :closable="false"
    :close-on-escape="false"
    header="Generating POA&amp;M"
    :pt="{ root: { style: 'width: 22rem; max-width: 95vw;' } }"
  >
    <div class="poam-progress">
      <ProgressSpinner :pt="{ root: { style: 'width: 3rem; height: 3rem;' } }" stroke-width="4" />
      <span class="poam-progress__label">Preparing your download…</span>
    </div>
  </Dialog>
</template>

<style scoped>
.poam-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1rem 0.5rem;
}

.poam-progress__label {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-bright);
}
</style>
