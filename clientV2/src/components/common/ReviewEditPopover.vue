<script setup>
import Button from 'primevue/button'
import Popover from 'primevue/popover'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'
import { getReviewButtonStates } from '../../features/AssetReview/lib/reviewButtonStates.js'
import ResultBadge from './ResultBadge.vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  rowData: {
    type: Object,
    default: null,
  },
  fieldSettings: {
    type: Object,
    default: () => ({
      detail: { enabled: 'always', required: 'always' },
      comment: { enabled: 'always', required: 'findings' },
    }),
  },
  accessMode: {
    type: String,
    default: 'r',
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save', 'status-action', 'close'])

const popover = ref()

const resultOptions = [
  { value: 'pass', label: 'Not a Finding', display: 'NF' },
  { value: 'fail', label: 'Open', display: 'O' },
  { value: 'notapplicable', label: 'Not Applicable', display: 'NA' },
  { value: 'informational', label: 'Informational', display: 'I' },
  { value: 'notchecked', label: 'Not Reviewed', display: 'NR' },
]

// Local form state
const formResult = ref('')
const formDetail = ref('')
const formComment = ref('')

// Sync local state when rowData changes (popover opens with new row)
watch(() => props.rowData, (row) => {
  if (row) {
    formResult.value = row.result ?? ''
    formDetail.value = row.detail ?? ''
    formComment.value = row.comment ?? ''
  }
})

// Editability
const statusLabel = computed(() => {
  const s = props.rowData?.status
  if (!s) {
    return ''
  }
  return s?.label ?? s ?? ''
})

const editable = computed(() => {
  const s = statusLabel.value
  return props.accessMode === 'rw' && (s === '' || s === 'saved' || s === 'rejected')
})

// Dirty tracking
const isDirty = computed(() => {
  if (!props.rowData) {
    return false
  }
  return formResult.value !== (props.rowData.result ?? '')
    || formDetail.value !== (props.rowData.detail ?? '')
    || formComment.value !== (props.rowData.comment ?? '')
})

// Field enable/require logic
function isFieldEnabled(fieldSetting) {
  if (!editable.value) {
    return false
  }
  if (!formResult.value) {
    return false
  }
  if (fieldSetting?.enabled === 'always') {
    return true
  }
  if (fieldSetting?.enabled === 'findings') {
    return formResult.value === 'fail'
  }
  return false
}

function isFieldRequired(fieldSetting) {
  if (fieldSetting?.required === 'always') {
    return true
  }
  if (fieldSetting?.required === 'findings' && formResult.value === 'fail') {
    return true
  }
  return false
}

const detailEnabled = computed(() => isFieldEnabled(props.fieldSettings.detail))
const commentEnabled = computed(() => isFieldEnabled(props.fieldSettings.comment))
const detailRequired = computed(() => isFieldRequired(props.fieldSettings.detail))
const commentRequired = computed(() => isFieldRequired(props.fieldSettings.comment))

// Submittability
const isSubmittable = computed(() => {
  const result = formResult.value
  if (!result || (result !== 'pass' && result !== 'fail' && result !== 'notapplicable')) {
    return false
  }
  const fs = props.fieldSettings
  if (fs.detail?.required === 'always' && !formDetail.value?.trim()) {
    return false
  }
  if (fs.detail?.required === 'findings' && result === 'fail' && !formDetail.value?.trim()) {
    return false
  }
  if (fs.comment?.required === 'always' && !formComment.value?.trim()) {
    return false
  }
  if (fs.comment?.required === 'findings' && result === 'fail' && !formComment.value?.trim()) {
    return false
  }
  return true
})

// Button states
const buttonStates = computed(() => {
  return getReviewButtonStates({
    accessMode: props.accessMode,
    statusLabel: statusLabel.value,
    isDirty: isDirty.value,
    isSubmittable: isSubmittable.value,
    canAccept: props.canAccept,
  })
})

// Engine display
const engineDisplay = computed(() => {
  const re = props.rowData?.resultEngine
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

// Result selection
function selectResult(value) {
  if (!editable.value) {
    return
  }
  formResult.value = value
}

// Button action handler
function onButtonClick(actionType) {
  if (!actionType || !props.rowData) {
    return
  }

  // Status-only actions (PATCH)
  if (actionType === 'submit' || actionType === 'unsubmit' || actionType === 'accept') {
    emit('status-action', { ruleId: props.rowData.ruleId, actionType })
    popover.value.hide()
    return
  }

  // Save actions (PUT) — include form data
  let status = 'saved'
  if (actionType === 'save and submit') {
    status = 'submitted'
  }

  emit('save', {
    ruleId: props.rowData.ruleId,
    result: formResult.value,
    detail: formDetail.value,
    comment: formComment.value,
    status,
  })
  popover.value.hide()
}

// Expose toggle for parent to open/close
function toggle(event) {
  popover.value.toggle(event)
}

function hide() {
  popover.value.hide()
}

defineExpose({ toggle, hide })
</script>

<template>
  <Popover ref="popover" append-to="body" @hide="$emit('close')">
    <div v-if="rowData" class="review-edit-popover">
      <div class="review-edit-popover__main">
        <div class="review-edit-popover__result">
          <label class="review-edit-popover__label">Result</label>
          <ul class="review-edit-popover__result-list">
            <li
              v-for="opt in resultOptions"
              :key="opt.value"
              class="review-edit-popover__result-item"
              :class="{
                'review-edit-popover__result-item--active': formResult === opt.value,
                'review-edit-popover__result-item--disabled': !editable,
              }"
              @click="selectResult(opt.value)"
            >
              <ResultBadge :status="opt.display" />
              <span>{{ opt.label }}</span>
            </li>
          </ul>
          <span class="review-edit-popover__engine" :title="engineDisplay">
            {{ engineDisplay }}
          </span>
        </div>

        <div class="review-edit-popover__detail">
          <label class="review-edit-popover__label">
            Detail
            <span v-if="detailRequired" class="review-edit-popover__required">*</span>
          </label>
          <Textarea
            v-model="formDetail"
            :disabled="!detailEnabled"
            :maxlength="32767"
            rows="3"
            auto-resize
            fluid
            class="review-edit-popover__textarea"
          />
        </div>

        <div class="review-edit-popover__comment">
          <label class="review-edit-popover__label">
            Comment
            <span v-if="commentRequired" class="review-edit-popover__required">*</span>
          </label>
          <Textarea
            v-model="formComment"
            :disabled="!commentEnabled"
            :maxlength="32767"
            rows="3"
            auto-resize
            fluid
            class="review-edit-popover__textarea"
          />
        </div>

        <div class="review-edit-popover__actions">
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

      <div class="review-edit-popover__attributions">
        <span class="review-edit-popover__attr">
          <span class="review-edit-popover__attr-label">Evaluated</span>
          {{ formatDate(rowData.ts) }}
          <span v-if="rowData.username" class="review-edit-popover__attr-user">
            by {{ rowData.username }}
          </span>
        </span>
        <span class="review-edit-popover__attr">
          <span class="review-edit-popover__attr-label">Status</span>
          <template v-if="rowData.status">
            <StatusBadge :status="statusLabel" />
            {{ formatDate(rowData.status?.ts) }}
            <span v-if="rowData.status?.user?.username" class="review-edit-popover__attr-user">
              by {{ rowData.status.user.username }}
            </span>
          </template>
          <template v-else>--</template>
        </span>
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.review-edit-popover {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 700px;
}

.review-edit-popover__main {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.review-edit-popover__label {
  display: block;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-dim);
  margin-bottom: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.review-edit-popover__required {
  color: var(--result-fail, #e74c3c);
}

.review-edit-popover__result {
  flex: 0 0 auto;
}

.review-edit-popover__result-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.review-edit-popover__result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 3px;
  white-space: nowrap;
  font-size: 0.85rem;
}

.review-edit-popover__result-item:hover:not(.review-edit-popover__result-item--disabled) {
  background-color: var(--p-highlight-background);
}

.review-edit-popover__result-item--active {
  background-color: var(--p-highlight-background);
}

.review-edit-popover__result-item--disabled {
  cursor: default;
  opacity: 0.6;
}

.review-edit-popover__engine {
  display: block;
  color: var(--color-text-dim);
  font-size: 0.75rem;
  margin-top: 0.2rem;
  background-color: var(--color-background-dark);
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  border: 1px solid var(--color-border-light);
  text-align: center;
}

.review-edit-popover__detail,
.review-edit-popover__comment {
  flex: 1;
  min-width: 120px;
}

.review-edit-popover__textarea :deep(textarea) {
  max-height: 15rem;
  overflow-y: auto;
}

.review-edit-popover__actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 0 0 auto;
  justify-content: flex-start;
  padding-top: 1.2rem;
}

.review-edit-popover__actions .p-button {
  white-space: nowrap;
  font-size: 0.8rem;
}

.review-edit-popover__attributions {
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
  color: var(--color-text-dim);
  border-top: 1px solid var(--color-border-light);
  padding-top: 0.35rem;
}

.review-edit-popover__attr {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.review-edit-popover__attr-label {
  font-weight: 600;
}

.review-edit-popover__attr-user {
  color: var(--color-text-dim);
  opacity: 0.8;
}
</style>
