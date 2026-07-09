<script setup>
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'
import SaveStatusBadge from '../../../../components/common/SaveStatusBadge.vue'
import { isDuplicateEntryError } from '../../../../shared/api/apiErrors.js'
import { updateCollection } from '../../../../shared/api/collectionsApi.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { useCollectionResource } from '../../composables/useCollectionResource.js'
import { normalizeCollectionName, validateCollectionDescription, validateCollectionName } from './collectionValidation.js'
import { collectionInputTextPt, collectionTextareaPt } from './pt.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const { triggerError } = useGlobalError()
const { refreshUser } = useCurrentUser()

const name = ref('')
const description = ref('')
const nameError = ref('')
const saveStatus = ref('idle')

const { collection, isLoading, setCollection } = useCollectionResource()

// Seed the editable fields from the shared collection whenever it (re)loads.
watch(collection, (data) => {
  if (data) {
    name.value = data.name || ''
    description.value = data.description || ''
    saveStatus.value = 'saved'
  }
}, { immediate: true })

const saveName = async () => {
  if (!collection.value) {
    return
  }
  const newName = normalizeCollectionName(name.value)

  const validation = validateCollectionName(newName)
  if (validation) {
    name.value = collection.value.name || '' // Revert
    // An empty name is reverted silently; a length error is surfaced inline.
    if (newName) {
      nameError.value = validation
      setTimeout(() => {
        nameError.value = ''
      }, 10000)
    }
    return
  }

  if (newName === collection.value.name) {
    name.value = newName // clean up display
    return
  }

  const originalValue = collection.value.name || ''
  saveStatus.value = 'saving'
  try {
    const res = await updateCollection(props.collectionId, { name: newName })
    setCollection(res)
    name.value = res.name || ''
    nameError.value = ''
    saveStatus.value = 'saved'
    // Grants carry the collection name; refresh so the nav rail and
    // breadcrumb show the new name.
    await refreshUser()
  }
  catch (err) {
    name.value = originalValue // Revert on failure
    saveStatus.value = 'error'

    if (isDuplicateEntryError(err)) {
      nameError.value = 'A collection with this name already exists.'
      setTimeout(() => {
        nameError.value = ''
      }, 5000)
    }
    else {
      triggerError(err)
    }
  }
}

const saveDescription = async () => {
  if (!collection.value) {
    return
  }
  const newDesc = description.value?.trim() ?? ''

  const validation = validateCollectionDescription(newDesc)
  if (validation) {
    description.value = collection.value.description || '' // Revert
    triggerError(validation)
    return
  }

  if (newDesc === (collection.value.description || '')) {
    description.value = newDesc
    return
  }

  const originalValue = collection.value.description || ''
  saveStatus.value = 'saving'
  try {
    const res = await updateCollection(props.collectionId, { description: newDesc })
    setCollection(res)
    description.value = res.description || ''
    saveStatus.value = 'saved'
  }
  catch (err) {
    description.value = originalValue // Revert on failure
    saveStatus.value = 'error'
    triggerError(err)
  }
}

const inputTextPt = computed(() => collectionInputTextPt(!name.value.trim()))
const textareaPt = collectionTextareaPt
</script>

<template>
  <div class="manage-properties">
    <div v-if="isLoading" class="loading-state">
      <i class="pi pi-spin pi-spinner" /> Loading properties...
    </div>
    <div v-else class="properties-content">
      <div class="panel-status-row">
        <SaveStatusBadge :status="saveStatus" />
      </div>
      <div class="settings-group">
        <h3 class="group-title">
          Properties
        </h3>
        <p class="group-desc">
          Configure the basic properties of this collection.
        </p>

        <div class="labeled-field">
          <div class="field-header-row">
            <label class="flabel" for="collectionName">Name <span class="req-star">*</span></label>
            <span class="char-count">{{ name.length }} / 45</span>
          </div>
          <InputText
            id="collectionName"
            v-model="name"
            :pt="inputTextPt"
            maxlength="45"
            @blur="saveName"
            @keyup.enter="$event.target.blur()"
          />
          <div class="field-error" :class="{ 'field-error--hidden': !nameError }">
            {{ nameError || 'Placeholder' }}
          </div>
        </div>

        <div class="labeled-field">
          <div class="field-header-row">
            <label class="flabel" for="collectionDesc">Description</label>
            <span class="char-count">{{ description.length }} / 255</span>
          </div>
          <Textarea
            id="collectionDesc"
            v-model="description"
            rows="8"
            :pt="textareaPt"
            maxlength="255"
            @blur="saveDescription"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "../collection-manage.css";

.field-error {
  font-size: 0.85rem;
  line-height: 1.2;
  min-height: 1.2em;
  color: var(--color-text-error);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.field-error--hidden {
  visibility: hidden;
}
</style>
