<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'
import { cloneCollection, fetchCollection } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { readNdjson } from '../../../shared/lib/ndjsonStream.js'
import { useCollectionCloneProgressStore } from '../../../shared/stores/collectionCloneProgressStore.js'
import { collectionDialogPt, collectionInputTextPt, collectionSelectPt, collectionTextareaPt } from './pt.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

// A clone can take several minutes; we only warn the user before the first
// clone of the session. Module-scoped so it survives component remounts.
let cloneWarningAcknowledged = false

const { triggerError } = useGlobalError()
const cloneStore = useCollectionCloneProgressStore()
const { refreshUser } = useCurrentUser()

const { execute: fetchSource } = useAsyncState(
  id => fetchCollection(id),
  { immediate: false },
)

const cloneForm = ref({
  name: '',
  description: '',
  grants: true,
  labels: true,
  assets: true,
  stigMappings: 'withReviews',
  pinRevisions: 'matchSource',
})

const stigMappingOptions = [
  { label: 'Assignments and Reviews', value: 'withReviews' },
  { label: 'Assignments but not Reviews', value: 'withoutReviews' },
  { label: 'Do not clone assignments or reviews', value: 'none' },
]

const pinRevisionOptions = [
  { label: 'Match the source\'s pinned revisions', value: 'matchSource' },
  { label: 'Pin the source\'s default revisions', value: 'sourceDefaults' },
]

const loadSource = async () => {
  if (!props.collectionId) {
    return
  }
  const data = await fetchSource(props.collectionId)
  if (data) {
    const today = new Date().toISOString().split('T')[0]
    cloneForm.value.name = `Clone of ${data.name}`
    cloneForm.value.description = `Cloned from ${data.name} on ${today}`
  }
}

watch(() => props.collectionId, loadSource, { immediate: true })

const cloneValidationError = computed(() => {
  const n = cloneForm.value.name?.trim() || ''
  if (!n) {
    return 'Collection name is required'
  }
  if (n.length > 45) {
    return 'Collection names must be 45 characters or less'
  }
  if ((cloneForm.value.description || '').length > 255) {
    return 'Collection descriptions must be 255 characters or less'
  }
  if (!cloneForm.value.assets && !cloneForm.value.labels && !cloneForm.value.grants) {
    return 'Must select at least one clone option (assets, labels, or grants)'
  }
  return null
})

// Modals
const showCloneWarning = ref(false)

const startClone = async () => {
  const name = cloneForm.value.name.trim()
  // Each clone gets its own progress handle, so concurrent clones track and
  // notify independently.
  const clone = cloneStore.start({ dstCollectionName: name })

  try {
    const body = {
      name,
      description: cloneForm.value.description?.trim() || null,
      options: {
        grants: cloneForm.value.grants,
        labels: cloneForm.value.labels,
        assets: cloneForm.value.assets,
        stigMappings: cloneForm.value.stigMappings,
        pinRevisions: cloneForm.value.pinRevisions,
      },
    }

    const response = await cloneCollection(props.collectionId, body)

    // Read the newline-delimited JSON progress stream. HTTP 200 only means the
    // stream started; success is the final `stage: 'result'` message, and an
    // in-stream `status: 'error'` is a failure even though the HTTP status is 200.
    let errorEvent = null
    let cloned = false
    for await (const event of readNdjson(response)) {
      clone.pushStage(event)
      if (event && event.status === 'error') {
        errorEvent = event
      }
      if (event && event.stage === 'result' && event.collection) {
        cloned = true
      }
    }

    if (errorEvent) {
      const err = new Error(errorEvent.message || 'Clone failed')
      err.event = errorEvent
      clone.fail(err)
      // Legacy parity: handled errors (e.g. duplicate name) only mark the
      // notification, but unhandled server errors also open the global error
      // modal with the full streamed log and copy-to-clipboard.
      if (errorEvent.error || errorEvent.stack) {
        triggerError({
          message: errorEvent.message || 'Clone failed',
          dstCollectionName: name,
          log: clone.state.stages,
        })
      }
      return
    }
    if (!cloned) {
      // Stream ended without a result message and without an explicit error.
      throw new Error('Clone ended unexpectedly without a result.')
    }

    clone.finish()
    // The created collection grants the requesting user Owner; refresh so the
    // nav rail and breadcrumb pick up the new collection.
    await refreshUser()
  }
  catch (err) {
    clone.fail(err)
    triggerError({
      message: err?.body ?? err?.message ?? String(err),
      dstCollectionName: name,
      log: clone.state.stages,
    })
  }
}

const confirmClone = () => {
  if (cloneValidationError.value) {
    return
  }
  // Warn once per session before kicking off a (potentially long) clone.
  if (cloneWarningAcknowledged) {
    startClone()
    return
  }
  showCloneWarning.value = true
}

const acknowledgeWarning = () => {
  cloneWarningAcknowledged = true
  showCloneWarning.value = false
  startClone()
}

const inputTextPt = computed(() => collectionInputTextPt(!cloneForm.value.name?.trim()))
const textareaPt = collectionTextareaPt
</script>

<template>
  <div class="manage-actions">
    <!-- CLONE SECTION -->
    <div class="action-section">
      <div class="action-header">
        <div class="action-title-row">
          <i class="pi pi-exclamation-triangle warning-icon" />
          <h3>Clone Collection</h3>
        </div>
        <p class="group-desc">
          Create a duplicate of this collection with customizable options. Cloning large collections can take several minutes and may impact users of the source collection.
        </p>
      </div>

      <div class="action-form action-form--warning">
        <div class="labeled-field">
          <div class="field-header-row">
            <label class="flabel" for="cloneName">New Collection Name <span class="req-star">*</span></label>
            <span class="char-count">{{ cloneForm.name.length }} / 45</span>
          </div>
          <InputText
            id="cloneName"
            v-model="cloneForm.name"
            :pt="inputTextPt"
            maxlength="45"
          />
        </div>

        <div class="labeled-field">
          <div class="field-header-row">
            <label class="flabel" for="cloneDesc">Description</label>
            <span class="char-count">{{ cloneForm.description.length }} / 255</span>
          </div>
          <Textarea
            id="cloneDesc"
            v-model="cloneForm.description"
            rows="8"
            :pt="textareaPt"
            maxlength="255"
          />
        </div>

        <div class="options-grid">
          <div class="option-col">
            <h4>Include Content</h4>
            <div class="checkbox-field">
              <Checkbox v-model="cloneForm.grants" :binary="true" input-id="cloneGrants" />
              <label for="cloneGrants">Grants</label>
            </div>
            <div class="checkbox-field">
              <Checkbox v-model="cloneForm.labels" :binary="true" input-id="cloneLabels" />
              <label for="cloneLabels">Labels</label>
            </div>
            <div class="checkbox-field">
              <Checkbox v-model="cloneForm.assets" :binary="true" input-id="cloneAssets" />
              <label for="cloneAssets">Assets</label>
            </div>
          </div>

          <div class="option-col">
            <h4>Asset Settings</h4>
            <div class="dropdown-field">
              <label class="flabel">STIGs</label>
              <Select
                v-model="cloneForm.stigMappings"
                :options="stigMappingOptions"
                option-label="label"
                option-value="value"
                :disabled="!cloneForm.assets"
                :pt="collectionSelectPt"
                class="w-full"
              />
            </div>
            <div class="dropdown-field">
              <label class="flabel">Pin Revisions</label>
              <Select
                v-model="cloneForm.pinRevisions"
                :options="pinRevisionOptions"
                option-label="label"
                option-value="value"
                :disabled="!cloneForm.assets || cloneForm.stigMappings === 'none'"
                :pt="collectionSelectPt"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="action-submit">
          <div v-if="cloneValidationError" class="field-error">
            {{ cloneValidationError }}
          </div>
          <Button
            label="Clone Collection"
            icon="pi pi-copy"
            severity="secondary"
            :disabled="!!cloneValidationError"
            @click="confirmClone"
          />
        </div>
      </div>
    </div>

    <!-- CLONE WARNING MODAL (shown once per session before the first clone) -->
    <Dialog
      v-model:visible="showCloneWarning"
      modal
      :style="{ width: '520px' }"
      :pt="collectionDialogPt"
    >
      <template #header>
        <div class="modal-header-warning">
          <i class="pi pi-exclamation-triangle warning-header-icon" />
          <span>Confirm Clone</span>
        </div>
      </template>
      <div class="modal-content">
        <div class="clone-warning-box">
          <p>
            Cloning large Collections can take several minutes! Users may see performance impacts when accessing the source Collection during this time.
          </p>
          <p>
            Making changes to the source Collection while it is being cloned may lead to inconsistent results in the cloned Collection.
          </p>
          <p class="warning-recommendation">
            <b>Before proceeding, it is recommended that you warn other Users to refrain from modifying any components of the source Collection while the cloning process is underway.</b>
          </p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" @click="showCloneWarning = false" />
        <Button label="Start Clone" severity="primary" @click="acknowledgeWarning" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
@import "./collection-manage.css";

.manage-actions {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 700px;
  width: 100%;
  margin: 0 auto;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.25rem;
}

.action-header h3 {
  font-size: 1.25rem;
  color: var(--color-text-bright);
  margin: 0;
}

.action-header p {
  color: var(--color-text-dim);
  margin: 0;
}

.warning-icon {
  color: var(--color-warning-yellow);
  font-size: 1.25rem;
}

.action-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--color-background-subtle);
  padding: 1.25rem;
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
}

.action-form--warning {
  border-color: color-mix(in srgb, var(--color-warning-yellow) 35%, transparent);
  background: color-mix(in srgb, var(--color-warning-yellow) 3%, var(--color-background-subtle));
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-default);
}

.option-col {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-col h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  color: var(--color-text-bright);
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.dropdown-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.action-submit {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border-default);
}

.action-submit .field-error {
  margin-right: auto;
}

.field-error {
  font-size: 0.85rem;
  color: var(--color-text-error);
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--color-text-primary);
  font-size: 1.05rem;
  line-height: 1.5;
}

.clone-warning-box {
  background: color-mix(in srgb, var(--color-warning-yellow) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning-yellow) 20%, transparent);
  border-left: 4px solid var(--color-warning-yellow);
  border-radius: 6px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.clone-warning-box p {
  margin: 0;
}

.warning-recommendation {
  color: var(--color-text-bright);
}

.modal-header-warning {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--color-text-bright);
  font-size: 1.25rem;
  font-weight: 600;
}

.warning-header-icon {
  color: var(--color-warning-yellow);
  font-size: 1.35rem;
}

.text-danger {
  color: var(--color-text-error);
}

.font-bold {
  font-weight: 600;
}

.mt-3 {
  margin-top: 0.75rem;
}

.w-full {
  width: 100%;
}
</style>
