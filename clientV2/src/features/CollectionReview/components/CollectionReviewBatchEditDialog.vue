<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'
import { defaultFieldSettings, isFieldEnabled, resultOptions } from '../../../shared/lib/reviewFormUtils.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  selectedRows: {
    type: Array,
    default: () => [],
  },
  fieldSettings: {
    type: Object,
    default: () => defaultFieldSettings,
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const formResult = ref(null)
const formDetail = ref('')
const formComment = ref('')

// Reset form when dialog opens; pre-fill result if all selected rows share the same result
watch(() => props.visible, (val) => {
  if (val) {
    formDetail.value = ''
    formComment.value = ''

    const rows = props.selectedRows
    if (rows.length) {
      const firstResult = rows[0].result
      const allSame = firstResult && rows.every(r => r.result === firstResult)
      formResult.value = allSame ? firstResult : null
    }
    else {
      formResult.value = null
    }
  }
})

const detailEnabled = computed(() => isFieldEnabled(props.fieldSettings.detail, formResult.value, true))
const commentEnabled = computed(() => isFieldEnabled(props.fieldSettings.comment, formResult.value, true))

const hasChanges = computed(() => {
  return formResult.value || formDetail.value.trim() || formComment.value.trim()
})

function onConfirm() {
  const payload = {}
  if (formResult.value) {
    payload.result = formResult.value
  }
  if (formDetail.value.trim()) {
    payload.detail = formDetail.value
  }
  if (formComment.value.trim()) {
    payload.comment = formComment.value
  }
  emit('confirm', payload)
  visibleModel.value = false
}

function onCancel() {
  visibleModel.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    header="Batch Edit"
    :modal="true"
    :style="{ width: '500px' }"
  >
    <div class="batch-edit__content">
      <p class="batch-edit__message">
        Editing {{ selectedRows.length }} reviews. Only fields with values will be applied.
      </p>

      <div class="batch-edit__field">
        <label class="batch-edit__label">Result</label>
        <Select
          v-model="formResult"
          :options="resultOptions"
          option-label="label"
          option-value="value"
          placeholder="— No change —"
          show-clear
          fluid
        />
      </div>

      <div class="batch-edit__field">
        <label class="batch-edit__label">Detail</label>
        <Textarea
          v-model="formDetail"
          :disabled="!detailEnabled"
          :maxlength="32767"
          :rows="3"
          fluid
          placeholder="Leave empty to preserve existing"
        />
      </div>

      <div class="batch-edit__field">
        <label class="batch-edit__label">Comment</label>
        <Textarea
          v-model="formComment"
          :disabled="!commentEnabled"
          :maxlength="32767"
          :rows="3"
          fluid
          placeholder="Leave empty to preserve existing"
        />
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" text @click="onCancel" />
      <Button
        label="Apply"
        icon="pi pi-check"
        :disabled="!hasChanges"
        @click="onConfirm"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.batch-edit__content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.batch-edit__message {
  margin: 0;
  color: var(--color-text-primary);
}

.batch-edit__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.batch-edit__label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}
</style>
