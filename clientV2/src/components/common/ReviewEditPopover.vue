<script setup>
import Button from 'primevue/button'
import Popover from 'primevue/popover'
import Textarea from 'primevue/textarea'
import Tooltip from 'primevue/tooltip'
import { computed, ref, watch } from 'vue'
import { getReviewButtonStates } from '../../shared/lib/reviewButtonStates.js'
import { formatReviewDate, isFieldEnabled, isFieldRequired, resultOptions } from '../../shared/lib/reviewFormUtils.js'
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

// Register PrimeVue Tooltip directive for v-tooltip usage
const vTooltip = Tooltip

const popover = ref()
const lastAnchorEvent = ref(null)
const closing = ref(false)
const isButtonsHighlighted = ref(false)

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

const showResultEmphasis = computed(() => editable.value && !formResult.value)

// Field enable/require states
const detailEnabled = computed(() => isFieldEnabled(props.fieldSettings.detail, formResult.value, editable.value))
const commentEnabled = computed(() => isFieldEnabled(props.fieldSettings.comment, formResult.value, editable.value))
const detailRequired = computed(() => isFieldRequired(props.fieldSettings.detail, formResult.value))
const commentRequired = computed(() => isFieldRequired(props.fieldSettings.comment, formResult.value))

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

// Engine tooltip HTML
const engineTooltipHtml = computed(() => {
  const re = props.rowData?.resultEngine
  if (!re) {
    return ''
  }
  const lines = []
  if (re.version) {
    lines.push(`<b>Version</b><br>${re.version}`)
  }
  if (re.time) {
    lines.push(`<b>Time</b><br>${formatReviewDate(re.time)}`)
  }
  if (re.checkContent?.location) {
    lines.push(`<b>Check content</b><br>${re.checkContent.location}`)
  }
  return lines.join('<br>')
})

// Override tooltip HTML
const overrideTooltipHtml = computed(() => {
  const overrides = props.rowData?.resultEngine?.overrides
  if (!overrides?.length) {
    return ''
  }
  return overrides.map((o) => {
    const lines = []
    if (o.authority) {
      lines.push(`<b>Authority</b><br>${o.authority}`)
    }
    if (o.remark) {
      lines.push(`<b>Remark</b><br>${o.remark}`)
    }
    lines.push(`<b>Old result</b>: ${o.oldResult || '\u2014'} \u2192 <b>New result</b>: ${o.newResult || '\u2014'}`)
    return lines.join('<br>')
  }).join('<hr style="margin: 0.3rem 0; opacity: 0.3">')
})

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

  // Unsubmit: emit but keep popover open for further editing
  if (actionType === 'unsubmit') {
    emit('status-action', { ruleId: props.rowData.ruleId, actionType })
    return
  }

  // Other status-only actions (PATCH) — dismiss after
  if (actionType === 'submit' || actionType === 'accept') {
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
  if (props.rowData) {
    formResult.value = props.rowData.result ?? ''
    formDetail.value = props.rowData.detail ?? ''
    formComment.value = props.rowData.comment ?? ''
  }
}

function dismiss() {
  discardChanges()
  closing.value = true
  popover.value.hide()
}

// Expose toggle for parent to open/close
function toggle(event) {
  lastAnchorEvent.value = event
  popover.value.toggle(event)
}

function show(event) {
  lastAnchorEvent.value = event
  popover.value.show(event)
}

function hide() {
  closing.value = true
  popover.value.hide()
}

defineExpose({ toggle, show, hide, isDirty, triggerButtonPulse })
</script>

<template>
  <Popover
    ref="popover"
    append-to="body"
    :dismissable="false"
    :pt="{
      root: {
        style: 'border: 1px solid var(--color-shield-green-dark); box-shadow: 0 0 10px 1px hsla(150, 30%, 40%, 0.3);',
      },
    }"
    @hide="onPopoverHide"
  >
    <div v-if="rowData" class="review-edit-popover" :style="width ? { width: `${width}px` } : {}">
      <button class="review-edit-popover__close" title="Close" @click="dismiss">
        <i class="pi pi-times" />
      </button>
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
          <label class="review-edit-popover__label">Status</label>
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
          <button
            class="review-edit-popover__discard-link"
            :class="{ 'review-edit-popover__discard-link--hidden': !isDirty }"
            @click="discardChanges"
          >
            discard changes
          </button>
        </div>
      </div>

      <div class="review-edit-popover__attributions">
        <div class="review-edit-popover__engine-badges">
          <span
            v-if="rowData.resultEngine"
            v-tooltip="{ value: engineTooltipHtml, escape: false, autoHide: false, hideDelay: 300, pt: { root: { style: { maxWidth: '40rem' } } } }"
            class="review-edit-popover__engine-badge"
          >
            {{ rowData.resultEngine.product || 'Engine' }}
          </span>
          <span v-else class="review-edit-popover__engine-badge review-edit-popover__engine-badge--manual">
            Manual
          </span>
          <span
            v-if="rowData.resultEngine?.overrides?.length"
            v-tooltip="{ value: overrideTooltipHtml, escape: false, autoHide: false, hideDelay: 300, pt: { root: { style: { maxWidth: '40rem' } } } }"
            class="review-edit-popover__override-badge"
          >
            Override
          </span>
        </div>
        <div class="review-edit-popover__attr-section">
          <span class="review-edit-popover__attr-label">Evaluated: </span>
          <span v-if="rowData.ts" class="review-edit-popover__attr-pill">
            <i class="pi pi-clock" />
            {{ formatReviewDate(rowData.ts) }}
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
              {{ formatReviewDate(rowData.status.ts) }}
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
  position: relative;
}

.review-edit-popover__close {
  position: absolute;
  top: -.8rem;
  right: -.8rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-primary);
  opacity: 0.5;
  padding: 0.2rem;
  line-height: 1;
}

.review-edit-popover__close .pi {
  font-size: 0.7rem;
}

.review-edit-popover__close:hover {
  opacity: 0.9;
}

.review-edit-popover__main {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  min-height: 16rem;
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
  font-size: 1rem;
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

.review-edit-popover__result-item :deep(.status-badge) {
  min-width: 1.8rem;
  justify-content: center;
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
  overflow-y: auto;
  resize: none !important;
}

.review-edit-popover__actions {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 0 0 auto;
  justify-content: flex-start;
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
  font-size: 0.9rem;
  color: var(--color-text-primary);
  opacity: 0.7;
  text-align: center;
  white-space: nowrap;
  transition: opacity 0.15s ease;
  margin-top: auto;
}

.review-edit-popover__discard-link:hover {
  opacity: 0.85;
  text-decoration: underline;
}

.review-edit-popover__discard-link--hidden {
  visibility: hidden;
}

.review-edit-popover__attributions {
  display: flex;
  gap: 3rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--color-border-light);
  padding-top: 0.4rem;
}

.review-edit-popover__engine-badges {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.review-edit-popover__engine-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: hsl(210, 80%, 80%);
  background-color: hsl(210, 50%, 25%);
  border: 1px solid hsl(210, 40%, 35%);
  border-radius: 4px;
  cursor: default;
}

.review-edit-popover__engine-badge--manual {
  color: var(--color-text-primary);
  background-color: var(--color-background-dark);
  border-color: var(--color-border-light);
  opacity: 0.7;
}

.review-edit-popover__override-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: hsl(30, 90%, 75%);
  background-color: hsl(30, 50%, 22%);
  border: 1px solid hsl(30, 40%, 35%);
  border-radius: 4px;
  cursor: default;
}

:global(.p-popover-leave-active) {
  transition: opacity .05s linear;
}

:global(.p-popover-enter-active) {
  transition: transform 0.05s cubic-bezier(0, 0, 0.2, 1), opacity 0.1s cubic-bezier(0, 0, 0.2, 1);
}

:global(.p-tooltip) {
  max-width: 40rem;
}

.review-edit-popover__attr-section {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.review-edit-popover__attr-label {
  font-weight: 600;
  font-size: 1.1rem;
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
