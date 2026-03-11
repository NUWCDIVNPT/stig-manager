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
  width: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['save', 'status-action', 'close'])

const popover = ref()
const lastAnchorEvent = ref(null)
const closing = ref(false)
const isButtonsHighlighted = ref(false)

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

const showResultEmphasis = computed(() => editable.value && !formResult.value)

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
    closing.value = true
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
  closing.value = true
  popover.value.hide()
}

// Dirty close handling
function onPopoverHide() {
  if (closing.value) {
    closing.value = false
    emit('close')
    return
  }
  if (isDirty.value) {
    // Re-show popover and pulse buttons instead of modal
    setTimeout(() => {
      popover.value.show(lastAnchorEvent.value)
      triggerButtonPulse()
    }, 100)
    return
  }
  emit('close')
}

function triggerButtonPulse() {
  isButtonsHighlighted.value = true
  setTimeout(() => {
    isButtonsHighlighted.value = false
  }, 1200)
}

function discardChanges() {
  closing.value = true
  popover.value.hide()
}

// Expose toggle for parent to open/close
function toggle(event) {
  lastAnchorEvent.value = event
  popover.value.toggle(event)
}

function hide() {
  closing.value = true
  popover.value.hide()
}

defineExpose({ toggle, hide })
</script>

<template>
  <Popover
    ref="popover"
    append-to="body"
    :pt="{
      root: {
        style: 'border: 1px solid var(--color-shield-green-dark); box-shadow: 0 0 10px 1px hsla(150, 30%, 40%, 0.3);',
      },
    }"
    @hide="onPopoverHide"
  >
    <div v-if="rowData" class="review-edit-popover" :style="width ? { width: `${width}px` } : {}">
      <div class="review-edit-popover__main">
        <div class="review-edit-popover__result" :class="{ 'review-edit-popover__result--emphasis': showResultEmphasis }">
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
            fluid
            class="review-edit-popover__textarea"
          />
        </div>

        <div class="review-edit-popover__actions" :class="{ 'review-edit-popover__actions--highlighted': isButtonsHighlighted }">
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
          <button v-if="isDirty" class="review-edit-popover__discard-link" @click="discardChanges">
            discard changes
          </button>
        </div>
      </div>

      <div class="review-edit-popover__attributions">
        <div class="review-edit-popover__attr-section">
          <span class="review-edit-popover__attr-label">Evaluated: </span>
          <span v-if="rowData.ts" class="review-edit-popover__attr-pill">
            <i class="pi pi-clock" />
            {{ formatDate(rowData.ts) }}
          </span>
          <span v-if="rowData.username" class="review-edit-popover__attr-pill">
            <i class="pi pi-user" />
            {{ rowData.username }}
          </span>
          <span v-if="!rowData.ts && !rowData.username" class="review-edit-popover__attr-pill review-edit-popover__attr-pill--empty">--</span>
        </div>
        <div class="review-edit-popover__attr-section">
          <span class="review-edit-popover__attr-label">Statused: </span>
          <template v-if="rowData.status && statusLabel">
            <span v-if="rowData.status?.ts" class="review-edit-popover__attr-pill">
              <i class="pi pi-clock" />
              {{ formatDate(rowData.status.ts) }}
            </span>
            <span v-if="rowData.status?.user?.username" class="review-edit-popover__attr-pill">
              <i class="pi pi-user" />
              {{ rowData.status.user.username }}
            </span>
            <StatusBadge :status="statusLabel" />
          </template>
          <span v-else class="review-edit-popover__attr-pill review-edit-popover__attr-pill--empty">--</span>
        </div>
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.review-edit-popover {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 400px;
}

.review-edit-popover__main {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.review-edit-popover__label {
  display: block;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
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

.review-edit-popover__result--emphasis {
  border: 1px solid var(--p-primary-color);
  border-radius: 4px;
  padding: 0.25rem;
  animation: result-pulse 1.5s ease-in-out 2;
}

@keyframes result-pulse {
  0%, 100% { border-color: var(--p-primary-color); }
  50% { border-color: transparent; }
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
  font-size: 0.9rem;
}

.review-edit-popover__result-item:hover:not(.review-edit-popover__result-item--disabled) {
  background-color: var(--p-highlight-background);
}

.review-edit-popover__result-item--active {
  background-color: var(--p-highlight-background);
  border: 1px solid var(--p-highlight-focus-background, var(--p-primary-color));
  font-weight: 600;
}

.review-edit-popover__result-item--disabled {
  cursor: default;
  opacity: 0.6;
}

.review-edit-popover__engine {
  display: block;
  color: var(--color-text-primary);
  font-size: 0.9rem;
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
  display: flex;
  flex-direction: column;
}

.review-edit-popover__textarea {
  flex: 1;
  display: flex;
}

.review-edit-popover__textarea :deep(textarea) {
  flex: 1;
  overflow-y: auto;
  resize: none;
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
  font-size: 1rem;
}

.review-edit-popover__actions--highlighted {
  animation: actions-pulse 0.6s ease-in-out 2;
}

@keyframes actions-pulse {
  0%, 100% { filter: drop-shadow(0 0 0px transparent); }
  50% { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--p-primary-color) 70%, transparent)); }
}

.review-edit-popover__discard-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--color-text-primary);
  opacity: 0.4;
  text-align: right;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.review-edit-popover__discard-link:hover {
  opacity: 0.85;
  text-decoration: underline;
}

.review-edit-popover__attributions {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--color-border-light);
  padding-top: 0.4rem;
}

.review-edit-popover__attr-section {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.review-edit-popover__attr-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
  opacity: 0.8;
  white-space: nowrap;
}

.review-edit-popover__attr-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  font-size: 1rem;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  background-color: var(--color-background-dark);
  white-space: nowrap;
}

.review-edit-popover__attr-pill .pi {
  font-size: 1rem;
  opacity: 0.9;
}

.review-edit-popover__attr-pill--empty {
  opacity: 0.4;
}
</style>
