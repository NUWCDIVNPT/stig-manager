<script setup>
import Popover from 'primevue/popover'
import Textarea from 'primevue/textarea'
import { nextTick, onBeforeUnmount, provide, ref, toRefs, watch } from 'vue'
import ReviewResources from './ReviewResources/ReviewResources.vue'
import { useReviewEditForm } from '../../shared/composables/useReviewEditForm.js'
import { formatReviewDate, resultOptions } from '../../shared/lib/reviewFormUtils.js'
import ResultBadge from './ResultBadge.vue'
import ResultEngineBadges from './ResultEngineBadges.vue'
import StatusBadge from './StatusBadge.vue'
import StatusButton from './StatusButton.vue'

const props = defineProps({
  // Review data
  currentReview: {
    type: Object,
    default: null,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
  collectionId: {
    type: String,
    default: null,
  },
  assetId: {
    type: [String, Number],
    default: null,
  },
  // Field/form config
  fieldSettings: {
    type: Object,
    default: null,
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
  // Tab config
  enabledTabs: {
    type: Array,
    default: () => ['history', 'statusText', 'otherAssets', 'attachments'],
  },
  // Optional label identifying what is being edited (e.g. asset or rule name).
  // When provided, shown in a header strip so the user knows which row the
  // popover targets — useful when multiple rows are also checkbox-selected.
  subjectLabel: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['save', 'status-action', 'close', 'clear-save-error'])

defineSlots()

// Expose props as refs so all .value access in the component body is unchanged
const { currentReview, selectedRuleId, collectionId, assetId, fieldSettings, accessMode, canAccept, isSaving, saveError } = toRefs(props)

const popover = ref()
const lastAnchorEvent = ref(null)
const closing = ref(false)
const showUnsavedWarning = ref(false)
const showResources = ref(false)

// Form state and business logic from composable
const reviewEditForm = useReviewEditForm({
  rowData: currentReview,
  fieldSettings,
  accessMode,
  canAccept,
})

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
  selectResult,
  applyReviewData,
  discardChanges,
} = reviewEditForm

provide('reviewEditForm', reviewEditForm)

function onButtonClick(actionType) {
  const ruleId = selectedRuleId.value
  if (!actionType || !ruleId) {
    return
  }

  if (actionType === 'unsubmit') {
    emit('status-action', { ruleId, actionType })
    return
  }

  if (actionType === 'submit' || actionType === 'accept') {
    emit('status-action', { ruleId, actionType })
    closing.value = true
    popover.value.hide()
    return
  }

  let status = 'saved'
  if (actionType === 'save and submit') {
    status = REVIEW_STATUS.SUBMITTED
  }

  emit('save', {
    ruleId,
    result: formResult.value,
    detail: formDetail.value,
    comment: formComment.value,
    status,
  })
  closing.value = true
  popover.value.hide()
}

function onPopoverHide() {
  unbindOutsideHandler()
  unbindResizeHandler()
  showResources.value = false
  if (closing.value) {
    closing.value = false
    emit('close')
    return
  }
  if (isDirty.value) {
    nextTick(() => {
      popover.value?.show(lastAnchorEvent.value)
    })
    showUnsavedWarning.value = true
    return
  }
  emit('close')
}

function triggerUnsavedWarning() {
  showUnsavedWarning.value = true
}

function dismiss() {
  discardChanges()
  showUnsavedWarning.value = false
  closing.value = true
  popover.value.hide()
}

function openAt(event, method) {
  lastAnchorEvent.value = event
  showResources.value = false
  showUnsavedWarning.value = false
  popover.value[method](event)
}

function toggle(event) {
  openAt(event, 'toggle')
}

function show(event) {
  openAt(event, 'show')
}

function hide() {
  closing.value = true
  showUnsavedWarning.value = false
  showResources.value = false
  popover.value.hide()
}

function clampPopoverPosition() {
  const pv = popover.value
  if (!pv || !pv.container || !lastAnchorEvent.value) {
    return
  }
  const container = pv.container
  const anchor = lastAnchorEvent.value.currentTarget
  if (!anchor) {
    return
  }

  container.style.marginLeft = '0px'

  const rect = container.getBoundingClientRect()
  const anchorRect = anchor.getBoundingClientRect()
  const targetX = lastAnchorEvent.value.clientX ?? (anchorRect.left + anchorRect.width / 2)

  const gutter = 12
  const viewportW = document.documentElement.clientWidth

  let offset = targetX - (rect.left + rect.width / 2)

  const projectedLeft = rect.left + offset
  const projectedRight = projectedLeft + rect.width

  if (projectedLeft < gutter) {
    offset += (gutter - projectedLeft)
  }
  else if (projectedRight > viewportW - gutter) {
    offset -= (projectedRight - (viewportW - gutter))
  }

  if (rect.width > viewportW - gutter * 2) {
    offset = gutter - rect.left
  }

  container.style.marginLeft = `${offset}px`

  const arrowLeftEdge = targetX - (rect.left + offset) - 10
  container.style.setProperty('--p-popover-arrow-left', `${arrowLeftEdge}px`)
}

function alignPopoverAnimated() {
  const pv = popover.value
  if (!pv?.container || !lastAnchorEvent.value) { return }
  const el = pv.container
  const prevTop = el.style.top

  pv.alignOverlay()
  nextTick(clampPopoverPosition)

  const newTop = el.style.top
  if (!prevTop || !newTop || prevTop === newTop) { return }

  // Slide transition: snap back to old top, then animate to new top
  el.style.transition = 'none'
  el.style.top = prevTop
  void el.offsetHeight // flush
  el.style.transition = 'top 0.3s ease'
  requestAnimationFrame(() => {
    el.style.top = newTop
    el.addEventListener('transitionend', () => { el.style.transition = '' }, { once: true })
  })
}

function onResourceTransitionStart() {
  const el = popover.value?.container
  if (!el || !el.classList.contains('p-popover-flipped')) { return }

  // Anchor to bottom so expansion pushes the box UP naturally
  const rect = el.getBoundingClientRect()
  el.style.bottom = `${window.innerHeight - rect.bottom}px`
  el.style.top = 'auto'
}

function onResourceTransitionEnd() {
  const el = popover.value?.container
  if (!el) { return }

  // Reset to top-based positioning for PrimeVue
  el.style.top = `${el.getBoundingClientRect().top}px`
  el.style.bottom = 'auto'

  if (showResources.value) {
    alignPopoverAnimated()
  }
}

function reposition(event) {
  lastAnchorEvent.value = event
  const pv = popover.value
  pv.target = event.currentTarget
  pv.eventTarget = event.currentTarget
  pv.container?.classList.remove('p-popover-flipped')
  nextTick(() => {
    pv.alignOverlay()
    clampPopoverPosition()
  })
}

let outsideHandler = null
let outsideBindTimer = null
let resizeHandler = null
let resizeTimer = null

function bindResizeHandler() {
  unbindResizeHandler()
  resizeHandler = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const pv = popover.value
      if (pv && pv.container) {
        pv.alignOverlay()
        clampPopoverPosition()
      }
    }, 60)
  }
  window.addEventListener('resize', resizeHandler)
}

function unbindResizeHandler() {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  clearTimeout(resizeTimer)
}

function bindOutsideHandler() {
  bindResizeHandler()
  unbindOutsideHandler()
  outsideBindTimer = setTimeout(() => {
    outsideBindTimer = null
    outsideHandler = (event) => {
      if (
        event.target.closest('.p-popover')
        || event.target.closest('.p-multiselect-list')
        || event.target.closest('.p-multiselect-option')
        || event.target.closest('.p-multiselect-header')
      ) {
        return
      }
      if (isDirty.value) {
        showUnsavedWarning.value = true
        return
      }
      closing.value = true
      popover.value.hide()
    }
    document.addEventListener('pointerdown', outsideHandler)
  }, 0)
}

function unbindOutsideHandler() {
  if (outsideBindTimer) {
    clearTimeout(outsideBindTimer)
    outsideBindTimer = null
  }
  if (outsideHandler) {
    document.removeEventListener('pointerdown', outsideHandler)
    outsideHandler = null
  }
}

function onPopoverShow() {
  bindOutsideHandler()
  nextTick(clampPopoverPosition)
}

onBeforeUnmount(() => {
  unbindResizeHandler()
  unbindOutsideHandler()
})

defineExpose({ toggle, show, hide, reposition, isDirty, triggerUnsavedWarning })
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
      content: {
        style: { maxHeight: '85vh', overflowY: 'auto', overflowX: 'hidden' },
      },
      transition: {
        enterActiveClass: 'review-popover-enter',
        leaveActiveClass: 'review-popover-leave',
      },
    }"
    @show="onPopoverShow"
    @hide="onPopoverHide"
  >
    <div class="review-edit-popover">
      <button class="review-edit-popover__close" :title="isDirty ? 'Close (discards unsaved changes)' : 'Close'" @click="dismiss">
        <i class="pi pi-times" />
      </button>
      <div v-if="subjectLabel" class="review-edit-popover__subject">
        <span class="review-edit-popover__subject-value" :title="subjectLabel">{{ subjectLabel }}</span>
      </div>
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

        <div class="review-edit-popover__actions">
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
            class="review-edit-popover__undo-btn"
            :disabled="!isDirty"
            title="Undo changes"
            @click="discardChanges(); showUnsavedWarning = false"
          >
            Undo
          </button>
        </div>
      </div>

      <div v-if="showUnsavedWarning" class="review-edit-popover__unsaved-warning">
        <i class="pi pi-exclamation-triangle" />
        <span>Please <strong>Save</strong> or <strong>Undo</strong> your changes to close.</span>
      </div>

      <div class="review-edit-popover__attributions">
        <ResultEngineBadges :result-engine="currentReview?.resultEngine" />
        <div class="review-edit-popover__attr-section">
          <span class="review-edit-popover__attr-label">Evaluated: </span>
          <span v-if="currentReview?.ts" class="review-edit-popover__attr-pill">
            <i class="pi pi-clock" />
            {{ formatReviewDate(currentReview.ts) }}
          </span>
          <span v-if="currentReview?.username" class="review-edit-popover__attr-pill">
            <i class="pi pi-user" />
            {{ currentReview.username }}
          </span>
          <span v-if="!currentReview?.ts && !currentReview?.username" class="review-edit-popover__attr-pill review-edit-popover__attr-pill--empty">--</span>
        </div>
        <div class="review-edit-popover__attr-section">
          <span class="review-edit-popover__attr-label">Statused: </span>
          <template v-if="currentReview?.status && statusLabel">
            <span v-if="currentReview.status?.ts" class="review-edit-popover__attr-pill">
              <i class="pi pi-clock" />
              {{ formatReviewDate(currentReview.status.ts) }}
            </span>
            <StatusBadge :status="statusLabel" />
            <span v-if="currentReview.status?.user?.username" class="review-edit-popover__attr-pill">
              <i class="pi pi-user" />
              {{ currentReview.status.user.username }}
            </span>
          </template>
          <span v-else class="review-edit-popover__attr-pill review-edit-popover__attr-pill--empty">--</span>
        </div>
      </div>

      <div class="review-edit-popover__resources-toggle" @click="showResources = !showResources">
        <i class="pi" :class="showResources ? 'pi-angle-up' : 'pi-angle-down'" />
        <span>Review Resources</span>
        <div class="review-edit-popover__resources-toggle-line" />
      </div>

      <Transition
        name="expand"
        @before-enter="onResourceTransitionStart"
        @after-enter="onResourceTransitionEnd"
        @before-leave="onResourceTransitionStart"
        @after-leave="onResourceTransitionEnd"
      >
        <div v-if="showResources" class="review-edit-popover__resources-container">
          <ReviewResources
            :rule-id="selectedRuleId"
            :collection-id="collectionId"
            :asset-id="assetId"
            :access-mode="accessMode"
            :current-review="currentReview"
            :enabled-tabs="props.enabledTabs"
            @apply-review="applyReviewData"
          />
        </div>
      </Transition>
    </div>
  </Popover>
</template>

<style scoped>
.review-edit-popover {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 650px;
  max-width: 850px;
  position: relative;
}

.review-edit-popover__close {
  position: absolute;
  top: -0.6rem;
  right: -0.6rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-primary);
  opacity: 0.6;
  padding: 0.4rem;
  line-height: 1;
  z-index: 10;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.review-edit-popover__close:hover {
  opacity: 1;
  transform: scale(1.1);
}

.review-edit-popover__close .pi {
  font-size: 1.15rem;
}

.review-edit-popover__main {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  min-height: 16rem;
}

.review-edit-popover__subject {
  padding: 0.4rem 0.6rem;
  margin: -0.4rem -0.4rem 0.2rem -0.4rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-default) 40%, transparent);
}

.review-edit-popover__subject-value {
  font-weight: 600;
  color: var(--color-text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
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
  width: 2.25rem;
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

.review-edit-popover__textarea:disabled,
.review-edit-popover__textarea.p-disabled {
  background-color: color-mix(in srgb, var(--color-background-light) 30%, transparent) !important;
  opacity: 0.7 !important;
  cursor: not-allowed !important;
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

.review-edit-popover__undo-btn {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid color-mix(in srgb, var(--color-text-primary) 30%, transparent);
  border-radius: 4px;
  padding: 0.45rem 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: auto;
  transition: all 0.2s;
  text-transform: uppercase;
}
.review-edit-popover__undo-btn:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-background-light) 50%, transparent);
  border-color: var(--color-text-primary);
}
.review-edit-popover__undo-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Unsaved Changes Banner */
.review-edit-popover__unsaved-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  background-color: color-mix(in srgb, var(--color-warning, #f39c12) 15%, var(--color-background-dark));
  border: 1px solid color-mix(in srgb, var(--color-warning, #f39c12) 50%, transparent);
  border-radius: 4px;
  color: var(--color-warning, #f1c40f);
  font-size: 0.95rem;
  animation: warning-slide-down 0.2s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes warning-slide-down {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.review-edit-popover__attributions {
  display: flex;
  column-gap: 3rem;
  row-gap: 0.5rem;
  flex-wrap: wrap;
  border-top: 1px solid var(--color-border-light);
  padding-top: 0.4rem;
}

:global(.review-popover) {
  border: 1px solid var(--p-primary-color);
  box-shadow: 0 0 10px 2px color-mix(in srgb, var(--p-primary-color) 30%, transparent);
}

:global(.review-popover:not(.p-popover-flipped)::before) {
  border-bottom-color: var(--p-primary-color) !important;
  left: var(--p-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

:global(.review-popover:not(.p-popover-flipped)::after) {
  border-bottom-color: var(--color-background-dark) !important;
  left: var(--p-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

:global(.review-popover.p-popover-flipped::before) {
  border-top-color: var(--p-primary-color) !important;
  left: var(--p-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

:global(.review-popover.p-popover-flipped::after) {
  border-top-color: var(--color-background-dark) !important;
  left: var(--p-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

:global(.review-popover.p-popover-flipped) {
  margin-block-start: 5px;
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
  white-space: nowrap;
}

.review-edit-popover__attr-pill .pi {
  font-size: 1rem;
  opacity: 0.9;
}

.review-edit-popover__attr-pill--empty {
  opacity: 0.4;
}

.review-edit-popover__resources-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  margin: 0.5rem -0.8rem -0.8rem -0.8rem;
  background-color: color-mix(in srgb, var(--color-background-light) 20%, transparent);
  border-top: 1px solid var(--color-border-light);
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  transition: background-color 0.15s ease;
  user-select: none;
}

.review-edit-popover__resources-toggle:hover {
  background-color: color-mix(in srgb, var(--color-background-light) 40%, transparent);
}

.review-edit-popover__resources-toggle .pi {
  font-size: 1rem;
  color: var(--color-text-primary);
  transition: transform 0.2s ease;
}

.review-edit-popover__resources-toggle-line {
  flex: 1;
  height: 1px;
  background-color: var(--color-border-light);
}

.review-edit-popover__resources-container {
  margin: 0 -0.8rem -0.8rem -0.8rem;
  border-top: 1px solid var(--color-border-light);
  height: clamp(200px, 45vh, 350px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out;
  max-height: 400px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
