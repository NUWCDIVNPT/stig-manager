<script setup>
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { ref, watch } from 'vue'
import { updateCollection as updateCollectionApi } from '../../shared/api/collectionsApi.js'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'

const props = defineProps({
  collection: {
    type: Object,
    required: true,
  },
  elevate: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['updated'])
const { triggerError } = useGlobalError()

const localCollection = ref({})

watch(() => props.collection, (newVal) => {
  if (newVal) {
    localCollection.value = { ...newVal }
  }
  else {
    localCollection.value = {}
  }
}, { immediate: true })

const updateCollection = async (field) => {
  if (localCollection.value[field] === props.collection[field]) {
    return
  }

  try {
    const payload = {}
    payload[field] = localCollection.value[field]

    await updateCollectionApi(
      localCollection.value.collectionId,
      payload,
      { elevate: props.elevate },
    )

    emit('updated')
  }
  catch (error) {
    triggerError(error)
  }
}
</script>

<template>
  <div class="section">
    <h3 class="section-title">
      Information
    </h3>
    <div class="form-grid">
      <div class="form-group">
        <label for="name" class="label">Name</label>
        <InputText
          id="name"
          v-model="localCollection.name"
          class="input-full"
          @blur="updateCollection('name')"
        />
      </div>
      <div class="form-group">
        <label for="description" class="label">Description</label>
        <Textarea
          id="description"
          v-model="localCollection.description"
          rows="3"
          class="input-full"
          @blur="updateCollection('description')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.section-title {
  font-size: 0.99rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-left: 0.25rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-weight: 500;
}

.input-full {
  width: 100%;
}
</style>
