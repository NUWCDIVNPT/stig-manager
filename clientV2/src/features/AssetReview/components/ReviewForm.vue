<script setup>
import Button from 'primevue/button'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { computed } from 'vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import { getReviewButtonStates } from '../lib/reviewButtonStates.js'

const props = defineProps({
  formValues: {
    type: Object,
    default: () => ({ result: '', detail: '', comment: '', resultEngine: null }),
  },
  isDirty: {
    type: Boolean,
    default: false,
  },
  isSubmittable: {
    type: Boolean,
    default: false,
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
  accessMode: {
    type: String,
    default: 'r',
  },
  fieldSettings: {
    type: Object,
    default: () => ({
      detail: { enabled: 'always', required: 'always' },
      comment: { enabled: 'always', required: 'findings' },
    }),
  },
  currentReview: {
    type: Object,
    default: null,
  },
  isReviewLoading: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['save-review', 'update:formValues'])

const resultOptions = [
  { value: 'pass', label: 'Not a Finding' },
  { value: 'fail', label: 'Open' },
  { value: 'notapplicable', label: 'Not Applicable' },
  { value: 'informational', label: 'Informational' },
  { value: 'notchecked', label: 'Not Reviewed' },
]

// Editability
const statusLabel = computed(() => props.currentReview?.status?.label ?? '')
const editable = computed(() => {
  const s = statusLabel.value
  return props.accessMode === 'rw' && (s === '' || s === 'saved' || s === 'rejected')
})

// Field enable states
function isFieldEnabled(fieldSetting) {
  if (!editable.value) {
    return false
  }
  if (!props.formValues.result) {
    return false
  }
  if (fieldSetting?.enabled === 'always') {
    return true
  }
  if (fieldSetting?.enabled === 'findings') {
    return props.formValues.result === 'fail'
  }
  return false
}

const detailEnabled = computed(() => isFieldEnabled(props.fieldSettings.detail))
const commentEnabled = computed(() => isFieldEnabled(props.fieldSettings.comment))

// Field requirement indicators
function isFieldRequired(fieldSetting) {
  if (fieldSetting?.required === 'always') {
    return true
  }
  if (fieldSetting?.required === 'findings' && props.formValues.result === 'fail') {
    return true
  }
  return false
}

const detailRequired = computed(() => isFieldRequired(props.fieldSettings.detail))
const commentRequired = computed(() => isFieldRequired(props.fieldSettings.comment))

// Button states
const buttonStates = computed(() => {
  return getReviewButtonStates({
    accessMode: props.accessMode,
    statusLabel: statusLabel.value,
    isDirty: props.isDirty,
    isSubmittable: props.isSubmittable,
    canAccept: props.canAccept,
  })
})

// Engine display
const engineDisplay = computed(() => {
  const re = props.formValues.resultEngine
  if (!re) {
    return 'Manual'
  }
  if (re.overrides?.length) {
    return `${re.product || 'Engine'} (Override)`
  }
  return re.product || 'Engine'
})

// Attribution formatting
function formatDate(dateStr) {
  if (!dateStr) {
    return '--'
  }
  return new Date(dateStr).toLocaleString()
}

// Form value updates
function updateResult(value) {
  emit('update:formValues', { ...props.formValues, result: value, resultEngine: null })
}

function updateDetail(value) {
  emit('update:formValues', { ...props.formValues, detail: value })
}

function updateComment(value) {
  emit('update:formValues', { ...props.formValues, comment: value })
}

function onButtonClick(actionType) {
  if (actionType) {
    emit('save-review', actionType)
  }
}
</script>

<template>
  <div class="review-form">
    <div class="review-form__header">
      <span class="review-form__title">Review</span>
      <StatusBadge v-if="statusLabel" :status="statusLabel" />
    </div>

    <div v-if="isReviewLoading" class="review-form__loading">
      <i class="pi pi-spinner pi-spin" />
      Loading review...
    </div>

    <div v-else-if="!selectedRuleId" class="review-form__empty">
      Select a rule to review.
    </div>

    <div v-else class="review-form__content">
      <!-- Evaluation Section -->
      <fieldset class="review-form__fieldset">
        <legend class="review-form__legend">
          Evaluation
        </legend>

        <div class="review-form__field">
          <label class="review-form__label">Result</label>
          <div class="review-form__result-row">
            <Select
              :model-value="formValues.result"
              :options="resultOptions"
              option-label="label"
              option-value="value"
              placeholder="Select result..."
              :disabled="!editable"
              class="review-form__result-select"
              @update:model-value="updateResult"
            />
            <span class="review-form__engine-badge" :title="engineDisplay">
              {{ engineDisplay }}
            </span>
          </div>
        </div>

        <div class="review-form__field">
          <label class="review-form__label">
            Detail
            <span v-if="detailRequired" class="review-form__required">*</span>
          </label>
          <Textarea
            :model-value="formValues.detail"
            :disabled="!detailEnabled"
            :maxlength="32767"
            rows="3"
            auto-resize
            class="review-form__textarea"
            @update:model-value="updateDetail"
          />
        </div>

        <div class="review-form__field">
          <label class="review-form__label">
            Comment
            <span v-if="commentRequired" class="review-form__required">*</span>
          </label>
          <Textarea
            :model-value="formValues.comment"
            :disabled="!commentEnabled"
            :maxlength="32767"
            rows="3"
            auto-resize
            class="review-form__textarea"
            @update:model-value="updateComment"
          />
        </div>
      </fieldset>

      <!-- Attributions Section -->
      <fieldset class="review-form__fieldset">
        <legend class="review-form__legend">
          Attributions
        </legend>

        <div class="review-form__attribution">
          <span class="review-form__attribution-label">Evaluated</span>
          <span class="review-form__attribution-value">
            {{ formatDate(currentReview?.ts) }}
            <span v-if="currentReview?.username" class="review-form__attribution-user">
              by {{ currentReview.username }}
            </span>
          </span>
        </div>

        <div class="review-form__attribution">
          <span class="review-form__attribution-label">Statused</span>
          <span class="review-form__attribution-value">
            <template v-if="currentReview?.status?.ts">
              <StatusBadge v-if="statusLabel" :status="statusLabel" />
              {{ formatDate(currentReview.status.ts) }}
              <span v-if="currentReview.status.user?.username" class="review-form__attribution-user">
                by {{ currentReview.status.user.username }}
              </span>
            </template>
            <template v-else>--</template>
          </span>
        </div>
      </fieldset>

      <!-- Action Buttons -->
      <div class="review-form__actions">
        <Button
          v-if="buttonStates.btn1.visible"
          :label="buttonStates.btn1.text"
          :disabled="!buttonStates.btn1.enabled || isSaving"
          :title="buttonStates.btn1.tooltip"
          size="small"
          severity="secondary"
          outlined
          @click="onButtonClick(buttonStates.btn1.actionType)"
        />
        <Button
          v-if="buttonStates.btn2.visible"
          :label="buttonStates.btn2.text"
          :disabled="!buttonStates.btn2.enabled || isSaving"
          :title="buttonStates.btn2.tooltip"
          size="small"
          :severity="buttonStates.btn2.actionType === 'accept' ? 'warn' : 'primary'"
          @click="onButtonClick(buttonStates.btn2.actionType)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.review-form__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.review-form__title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.review-form__loading,
.review-form__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 100%;
  color: var(--color-text-dim);
}

.review-form__content {
  flex: 1;
  overflow-y: auto;
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.review-form__fieldset {
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 0.5rem;
  margin: 0;
}

.review-form__legend {
  font-weight: 600;
  color: var(--color-text-dim);
  padding: 0 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.review-form__field {
  margin-bottom: 0.5rem;
}

.review-form__label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.2rem;
}

.review-form__required {
  color: var(--result-fail, #e74c3c);
}

.review-form__result-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-form__result-select {
  flex: 1;
}

.review-form__engine-badge {
  color: var(--color-text-dim);
  background-color: var(--color-background-dark);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  border: 1px solid var(--color-border-light);
  white-space: nowrap;
}

.review-form__textarea {
  width: 100%;
}

.review-form__attribution {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  margin-bottom: 0.3rem;
}

.review-form__attribution-label {
  font-weight: 600;
  color: var(--color-text-dim);
  min-width: 60px;
}

.review-form__attribution-value {
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.review-form__attribution-user {
  color: var(--color-text-dim);
}

.review-form__actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.3rem;
  margin-top: auto;
}

.review-form__actions .p-button {
  flex: 1;
}
</style>
