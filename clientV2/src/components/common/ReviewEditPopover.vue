<script setup>
import Popover from 'primevue/popover'
import Textarea from 'primevue/textarea'
import Tooltip from 'primevue/tooltip'
import { nextTick, onBeforeUnmount, ref, toRef } from 'vue'
import { useReviewEditForm } from '../../shared/composables/useReviewEditForm.js'
import { defaultFieldSettings, formatReviewDate, resultOptions } from '../../shared/lib/reviewFormUtils.js'
import ResultBadge from './ResultBadge.vue'
import StatusBadge from './StatusBadge.vue'
import StatusButton from './StatusButton.vue'

const props = defineProps({
  rowData: {
    type: Object,
    default: null,
  },
  fieldSettings: {
    type: Object,
    default: () => defaultFieldSettings,
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

// Form state and business logic from composable
const {
  formResult,
  formDetail,
  formComment,
  statusLabel,
  editable,
  isDirty,
  showResultEmphasis,
  detailEnabled,
  commentEnabled,
  detailRequired,
  commentRequired,
  buttonStates,
  isActionActive,
  engineTooltipHtml,
  overrideTooltipHtml,
  selectResult,
  discardChanges,
} = useReviewEditForm({
  rowData: toRef(props, 'rowData'),
  fieldSettings: toRef(props, 'fieldSettings'),
  accessMode: toRef(props, 'accessMode'),
  canAccept: toRef(props, 'canAccept'),
})

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
  unbindOutsideHandler()
  if (closing.value) {
    closing.value = false
    emit('close')
    return
  }
  // Toggle or programmatic hide without closing flag — check dirty
  if (isDirty.value) {
    nextTick(() => {
      popover.value?.show(lastAnchorEvent.value)
    })
    triggerButtonPulse()
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

function reposition(event) {
  lastAnchorEvent.value = event
  const pv = popover.value
  pv.target = event.currentTarget
  pv.eventTarget = event.currentTarget
  pv.container.classList.remove('p-popover-flipped')
  nextTick(() => pv.alignOverlay())
}

// Outside-click detection (replaces PrimeVue's dismissable which can't handle dirty checks)
let outsideHandler = null

function bindOutsideHandler() {
  unbindOutsideHandler()
  // Delay to avoid catching the click that opened the popover
  setTimeout(() => {
    outsideHandler = (event) => {
      if (event.target.closest('.p-popover')) {
        return
      }
      if (isDirty.value) {
        triggerButtonPulse()
        return
      }
      closing.value = true
      popover.value.hide()
    }
    document.addEventListener('pointerdown', outsideHandler)
  }, 0)
}

function unbindOutsideHandler() {
  if (outsideHandler) {
    document.removeEventListener('pointerdown', outsideHandler)
    outsideHandler = null
  }
}

onBeforeUnmount(unbindOutsideHandler)

defineExpose({ toggle, show, hide, reposition, isDirty, triggerButtonPulse })
</script>

<template>
  <Popover
    ref="popover"
    append-to="body"
    :dismissable="false"
    :pt="{
      root: {
        class: 'review-popover',
      },
      transition: {
        enterActiveClass: 'review-popover-enter',
        leaveActiveClass: 'review-popover-leave',
      },
    }"
    @show="bindOutsideHandler"
    @hide="onPopoverHide"
  >
    <div v-if="rowData" class="review-edit-popover" :style="width ? { width: `${width}px` } : {}">
      <button class="review-edit-popover__close" :title="isDirty ? 'Close (discards unsaved changes)' : 'Close'" @click="dismiss">
        <i class="pi pi-times" />
      </button>
      <div class="review-edit-popover__main">
        <div class="review-edit-popover__result" :class="{ 'review-edit-popover__result--emphasis': showResultEmphasis }">
          <label class="review-edit-popover__label">
            Result
            <span class="review-edit-popover__required">*</span>
          </label>
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
          <StatusButton
            :label="buttonStates.save.text"
            :disabled="!buttonStates.save.enabled || isSaving"
            :active="isActionActive(buttonStates.save.actionType)"
            :title="buttonStates.save.tooltip"
            class="review-edit-popover__btn-fixed"
            @click="onButtonClick(buttonStates.save.actionType)"
          />
          <StatusButton
            :label="buttonStates.submit.text"
            :disabled="!buttonStates.submit.enabled || isSaving"
            :active="isActionActive(buttonStates.submit.actionType)"
            :title="buttonStates.submit.tooltip"
            @click="onButtonClick(buttonStates.submit.actionType)"
          />
          <StatusButton
            v-if="buttonStates.accept.visible"
            :label="buttonStates.accept.text"
            :disabled="!buttonStates.accept.enabled || isSaving"
            :active="isActionActive(buttonStates.accept.actionType)"
            :title="buttonStates.accept.tooltip"
            @click="onButtonClick(buttonStates.accept.actionType)"
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
  min-width: 500px;
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

/* Prevent resize when label switches between "Save" and "Unsubmit" */
.review-edit-popover__btn-fixed {
  min-width: 7rem;
}

.review-edit-popover__actions--highlighted {
  animation: actions-pulse 0.6s ease-in-out 2;
}

.review-edit-popover__actions--highlighted .review-edit-popover__discard-link {
  animation: discard-pulse 0.6s ease-in-out 2;
}

@keyframes discard-pulse {
  0%, 100% { color: var(--color-text-primary); opacity: 0.7; }
  50% { color: var(--result-fail, #e74c3c); opacity: 1; }
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
  color: var(--color-engine-text);
  background-color: var(--color-engine-bg);
  border: 1px solid var(--color-engine-border);
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
  color: var(--color-override-text);
  background-color: var(--color-override-bg);
  border: 1px solid var(--color-override-border);
  border-radius: 4px;
  cursor: default;
}

/* Arrow size and popover gap overrides.
   The arrow is two overlapping CSS-border triangles: ::before (outer/border)
   and ::after (inner/fill). margin-block-start is the gap between the anchor
   row and the popover body — it must match the arrow's border-width so the
   arrow spans the full gap. The ::after border-width is slightly smaller to
   reveal the ::before border color as an outline. The flipped variants apply
   when the popover opens above the anchor instead of below. */
:global(.review-popover) {
  border: 1px solid var(--color-shield-green-dark);
  box-shadow: 0 0 10px 2px color-mix(in srgb, var(--color-shield-green-dark) 30%, transparent);
  margin-left: -5rem;
  margin-block-start: 2rem; /* gap below anchor row */
}

:global(.review-popover.p-popover-flipped) {
  margin-block-start: -2rem; /* gap above anchor row (flipped) */
  margin-block-end: 2rem;
}

:global(.review-popover::before) {
  border-width: 2rem; /* outer arrow size — matches gap */
  margin-left: -2rem; /* center the outer arrow */
  border-bottom-color: var(--color-shield-green-dark);
}

:global(.review-popover::after) {
  border-width: 1.875rem; /* inner arrow — slightly smaller for border effect */
  margin-left: -1.875rem; /* center the inner arrow */
}

:global(.review-popover.p-popover-flipped::before) {
  border-top-color: var(--color-shield-green-dark);
}

:global(.review-popover-leave) {
  transition: opacity 0.05s linear;
}

:global(.review-popover-enter) {
  transition: transform 0.05s cubic-bezier(0, 0, 0.2, 1), opacity 0.1s cubic-bezier(0, 0, 0.2, 1);
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
