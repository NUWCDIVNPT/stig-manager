<script setup>
import Popover from 'primevue/popover'
import Textarea from 'primevue/textarea'
import { computed, nextTick, onBeforeUnmount, provide, ref, toRefs, watch } from 'vue'
import { useReviewEditForm } from '../../shared/composables/useReviewEditForm.js'
import { REVIEW_STATUS } from '../../shared/lib/reviewConstants.js'
import { formatReviewDate, resultOptions } from '../../shared/lib/reviewFormUtils.js'
import ResultBadge from './ResultBadge.vue'
import ResultEngineBadges from './ResultEngineBadges.vue'
import ReviewResources from './ReviewResources/ReviewResources.vue'
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
    default: () => ['history', 'statusText', 'otherAssets'],
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

// Expose props as refs so all .value access in the component body is unchanged
const { currentReview, selectedRuleId, collectionId, assetId, fieldSettings, accessMode, canAccept, isSaving, saveError } = toRefs(props)

const popover = ref()
const lastAnchorEvent = ref(null)
const closing = ref(false)
const showUnsavedWarning = ref(false)
// Whether Review Resources is expanded. Deliberately not reset when the popover
// closes or moves to another row: once a user unfolds it, it stays unfolded for
// every review they open from this grid until they fold it again.
const showResources = ref(false)

// Height of the Review Resources panel, in px. Lives here rather than in the
// stylesheet so the flip decision can reserve the space before the panel
// exists; the panel CSS reads it back via --sm-resources-height.
function resourcesHeightPx() {
  return Math.min(350, Math.max(200, window.innerHeight * 0.45))
}

function toggleResources() {
  showResources.value = !showResources.value
}

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

// Checklist rows carry the status timestamp as `statusTs` beside a string
// status; full review objects nest it under `status.ts`.
const statusTs = computed(() => currentReview.value?.status?.ts ?? currentReview.value?.statusTs ?? null)

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

  let status = REVIEW_STATUS.SAVED
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
  unbindListeners()
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
  popover.value.hide()
}

// Hidden fixed element the popover is anchored to. It is sized to the clicked
// row so PrimeVue's target tracking has a stable, non-scrolling element.
const anchorEl = ref(null)
let flippedAbove = false

// Place the box against the anchored row. PrimeVue only flips above the row
// when the box as it is now would not fit below; decide instead from the
// height it can reach with Review Resources open, so opening the panel never
// moves the box to the other side of the row. The decision is made here, on
// show, reposition and window resize, and pinToAnchor only keeps it.
function placePopover() {
  const el = popover.value?.container
  const anchorEvent = lastAnchorEvent.value
  const anchor = anchorEvent?.currentTarget
  if (!el || !anchor) {
    return
  }
  const reserve = resourcesHeightPx()
  el.style.setProperty('--sm-resources-height', `${reserve}px`)

  const anchorRect = anchor.getBoundingClientRect()
  const reachable = el.offsetHeight + (showResources.value ? 0 : reserve)
  flippedAbove = anchorRect.bottom + reachable > window.innerHeight
  el.classList.toggle('p-popover-flipped', flippedAbove)
  el.style.transformOrigin = flippedAbove ? 'bottom' : 'top'
  pinToAnchor()

  // Centre on the click, kept inside the viewport, with the arrow on the click
  const gutter = 12
  const viewportW = document.documentElement.clientWidth
  const width = el.offsetWidth
  const targetX = anchorEvent.clientX ?? (anchorRect.left + anchorRect.width / 2)
  let left = targetX - width / 2
  left = Math.max(gutter, Math.min(left, viewportW - gutter - width))
  if (width > viewportW - gutter * 2) {
    left = gutter
  }
  el.style.insetInlineStart = `${left + window.scrollX}px`
  el.style.setProperty('--sm-popover-arrow-left', `${targetX - left - 10}px`)
}

// Keep the box on its side of the row as its height changes: a flipped box
// grows upward, one below the row grows downward on its own.
function pinToAnchor() {
  const el = popover.value?.container
  const anchor = lastAnchorEvent.value?.currentTarget
  if (!el || !anchor) {
    return
  }
  const anchorRect = anchor.getBoundingClientRect()
  const top = flippedAbove ? Math.max(0, anchorRect.top - el.offsetHeight) : anchorRect.bottom
  el.style.top = `${top + window.scrollY}px`
}

let contentObserver = null

// PrimeVue re-aligns on every container resize with its own flip rule; swap
// its observer for one that keeps ours. unbindContentResizeListener is a
// private method (PrimeVue 4.5.5).
function bindContentObserver() {
  unbindContentObserver()
  const pv = popover.value
  pv.unbindContentResizeListener?.()
  contentObserver = new ResizeObserver(pinToAnchor)
  contentObserver.observe(pv.container)
}

function unbindContentObserver() {
  contentObserver?.disconnect()
  contentObserver = null
}

function reposition(event) {
  lastAnchorEvent.value = event
  nextTick(placePopover)
}

// Open, move or toggle the popover for the row under a click. The anchor is
// sized to the row so the arrow lands on the row edge and the flip decision
// sees the row's full extent.
function openForRow(event, isSameRow) {
  const row = event.target?.closest ? event.target.closest('tr') : null
  const rowRect = row ? row.getBoundingClientRect() : { top: 0, height: 0 }
  const clickX = event.clientX ?? 0
  anchorEl.value.style.left = `${clickX}px`
  anchorEl.value.style.top = `${rowRect.top}px`
  anchorEl.value.style.height = `${rowRect.height}px`

  const anchorEvent = { currentTarget: anchorEl.value, target: anchorEl.value, clientX: clickX }
  if (isSameRow) {
    toggle(anchorEvent)
  }
  else if (popover.value.visible) {
    reposition(anchorEvent)
  }
  else {
    show(anchorEvent)
  }
}

let outsideHandler = null
let outsideBindTimer = null
let resizeHandler = null
let resizeTimer = null

function bindResizeHandler() {
  unbindResizeHandler()
  resizeHandler = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(placePopover, 60)
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

function unbindListeners() {
  unbindOutsideHandler()
  unbindResizeHandler()
  unbindContentObserver()
}

function onPopoverShow() {
  bindOutsideHandler()
  bindResizeHandler()
  bindContentObserver()
  placePopover()
}

onBeforeUnmount(unbindListeners)

defineExpose({ openForRow, hide, isDirty, triggerUnsavedWarning })
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
            <span v-if="statusTs" class="review-edit-popover__attr-pill">
              <i class="pi pi-clock" />
              {{ formatReviewDate(statusTs) }}
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

      <div class="review-edit-popover__resources-toggle" @click="toggleResources">
        <i class="pi" :class="showResources ? 'pi-angle-up' : 'pi-angle-down'" />
        <span>Review Resources</span>
        <div class="review-edit-popover__resources-toggle-line" />
      </div>

      <!-- pinToAnchor runs on every container resize, so the popover stays
           on its side of the row while this grows or shrinks -->
      <Transition name="expand">
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
  <div
    ref="anchorEl"
    style="position: fixed; width: 0px; pointer-events: none; visibility: hidden; z-index: -1;"
  />
</template>

<style scoped>
.review-edit-popover {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  /* Fixed width so the popover is the same size in every grid, rather than
     sized by the attribution row (engine badges plus up to five Evaluated and
     Statused pills, fewer for an unstatused review). Wide enough for that row
     and for the Review Resources tables (history, other assets) to show their
     columns without a horizontal scroller. */
  width: 1000px;
  max-width: calc(100vw - 24px);
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
  font-size: var(--text-lg);
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
  font-size: var(--text-md);
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
  font-size: var(--text-md);
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
  font-size: var(--text-md);
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
  font-size: var(--text-md);
  animation: warning-slide-down 0.2s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes warning-slide-down {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.review-edit-popover__attributions {
  display: flex;
  align-items: center;
  gap: 1.2rem;
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
  left: var(--sm-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

:global(.review-popover:not(.p-popover-flipped)::after) {
  border-bottom-color: var(--color-background-dark) !important;
  left: var(--sm-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

:global(.review-popover.p-popover-flipped::before) {
  border-top-color: var(--p-primary-color) !important;
  left: var(--sm-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

:global(.review-popover.p-popover-flipped::after) {
  border-top-color: var(--color-background-dark) !important;
  left: var(--sm-popover-arrow-left, calc(50% - 10px)) !important;
  transform: none !important;
}

/* Sit the box just off the anchored row edge so the 10px arrow tip enters the
   row by a few px while the body stays clear of it, in both flip directions */
:global(.p-popover.review-popover) {
  margin-block-start: 4px;
}

:global(.p-popover.review-popover.p-popover-flipped) {
  margin-block-start: -3px;
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
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  opacity: 0.8;
  white-space: nowrap;
}

.review-edit-popover__attr-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  font-size: var(--text-md);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  white-space: nowrap;
}

.review-edit-popover__attr-pill .pi {
  font-size: var(--text-md);
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
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
  transition: background-color 0.15s ease;
  user-select: none;
}

.review-edit-popover__resources-toggle:hover {
  background-color: color-mix(in srgb, var(--color-background-light) 40%, transparent);
}

.review-edit-popover__resources-toggle .pi {
  font-size: var(--text-md);
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
  /* set by placePopover from resourcesHeightPx() */
  height: var(--sm-resources-height);
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
