<script setup>
// Step-through overlay that runs the tours defined in tours.js. Each step
// spotlights an element tagged with a `data-tour` attribute and shows a card
// beside it. Steps whose target is absent (Admin for non-admins, for example)
// are skipped automatically.
//
// Views ask for tours through useTours: startTour opens one on demand and
// offerTour opens one the user has not seen (by webPreferences.tours[id]).
// Home offers the shell tour, so a shared deep link opens where it points and
// the tour waits for the first visit to Home. An offered view tour opens only
// once the shell tour has been seen, and only while no other tour is open.
import Button from 'primevue/button'
import FocusTrap from 'primevue/focustrap'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'
import { useTours } from '../../shared/composables/useTours.js'
import { useWebPreferences } from '../../shared/composables/useWebPreferences.js'
import { TOURS } from './tours.js'

const vFocustrap = FocusTrap

const SHELL_TOUR = 'shell'

const { triggerError } = useGlobalError()
const { preferences, patchPreferences } = useWebPreferences()
const { request, takeRequest, setNavRailExpanded } = useTours()
const router = useRouter()
const route = useRoute()

const SPOTLIGHT_PAD = 6
const CARD_GAP = 14

const visible = ref(false)
const tourId = ref(null)
const stepIndex = ref(0)
const targetRect = ref(null)
const cardEl = ref(null)
const cardSize = ref({ width: 320, height: 160 })
let frameId = null
let trackStart = 0
// Set when Next clicked a link that navigates on its own, so the step that
// follows does not push the same route a second time.
let navigatedByClick = false

const availableSteps = ref([])

const step = computed(() => availableSteps.value[stepIndex.value])
const isLast = computed(() => stepIndex.value === availableSteps.value.length - 1)

function findTarget(name) {
  const el = document.querySelector(`[data-tour="${name}"]`)
  const rect = el?.getBoundingClientRect()
  return rect?.width > 0 && rect?.height > 0 ? { el, rect } : null
}

function sameBox(a, b) {
  return a?.top === b?.top && a?.left === b?.left && a?.width === b?.width && a?.height === b?.height
}

// Assigns only on a real change so an idle frame does not re-patch styles.
function measure() {
  const rect = step.value ? findTarget(step.value.target)?.rect ?? null : null
  if (!sameBox(rect, targetRect.value)) {
    targetRect.value = rect
  }
  if (cardEl.value) {
    const size = { width: cardEl.value.offsetWidth, height: cardEl.value.offsetHeight }
    if (!sameBox(size, cardSize.value)) {
      cardSize.value = size
    }
  }
}

// The rail expand/collapse animates its width and a route step's target only
// exists once the view renders, so a one-shot measurement on step change would
// leave the spotlight behind. Measuring runs per frame for a short burst after
// each change (longer while the target is still missing), then stops; window
// resize and scroll re-measure on demand.
const TRACK_MS = 600
const TRACK_MAX_MS = 5000

function trackFrame() {
  measure()
  const elapsed = performance.now() - trackStart
  if (elapsed < TRACK_MS || (!targetRect.value && elapsed < TRACK_MAX_MS)) {
    frameId = requestAnimationFrame(trackFrame)
  }
  else {
    frameId = null
  }
}

function track() {
  stopTracking()
  trackStart = performance.now()
  frameId = requestAnimationFrame(trackFrame)
}

function stopTracking() {
  if (frameId !== null) {
    cancelAnimationFrame(frameId)
    frameId = null
  }
}

// A target larger than the window (a whole view, say) is outlined only where
// it is visible, so the spotlight never runs off the edge of the screen.
const spotlightStyle = computed(() => {
  const r = targetRect.value
  if (!r) {
    return { display: 'none' }
  }
  const top = Math.max(SPOTLIGHT_PAD, r.top - SPOTLIGHT_PAD)
  const left = Math.max(SPOTLIGHT_PAD, r.left - SPOTLIGHT_PAD)
  const bottom = Math.min(window.innerHeight - SPOTLIGHT_PAD, r.bottom + SPOTLIGHT_PAD)
  const right = Math.min(window.innerWidth - SPOTLIGHT_PAD, r.right + SPOTLIGHT_PAD)
  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${Math.max(0, right - left)}px`,
    height: `${Math.max(0, bottom - top)}px`,
  }
})

const cardStyle = computed(() => {
  const r = targetRect.value
  if (!r) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }
  const { width, height } = cardSize.value
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clamp = (v, max) => Math.max(CARD_GAP, Math.min(v, max - CARD_GAP))
  const midTop = clamp(r.top + r.height / 2 - height / 2, vh - height)

  switch (step.value?.placement) {
    case 'below-end':
      return { top: `${clamp(r.bottom + CARD_GAP, vh - height)}px`, left: `${clamp(r.right - width, vw - width)}px` }
    case 'center':
      return { top: `${midTop}px`, left: `${clamp(r.left + r.width / 2 - width / 2, vw - width)}px` }
    case 'left':
      return { top: `${midTop}px`, left: `${clamp(r.left - SPOTLIGHT_PAD - CARD_GAP - width, vw - width)}px` }
    default: // 'right': beside the target
      return { top: `${midTop}px`, left: `${clamp(r.right + SPOTLIGHT_PAD + CARD_GAP, vw - width)}px` }
  }
})

function next() {
  if (isLast.value) {
    finish()
    return
  }
  if (step.value?.clickTarget) {
    const target = findTarget(step.value.target)
    if (target) {
      target.el.click()
      navigatedByClick = true
    }
  }
  stepIndex.value += 1
}

function back() {
  if (stepIndex.value > 0) {
    stepIndex.value -= 1
  }
}

function hasSeen(id) {
  return (preferences.value.tours?.[id] ?? '') >= TOURS[id].date
}

// Enter is left to the focused button, and Tab to the card's focus trap.
function onKeydown(e) {
  if (e.key === 'Escape') {
    finish()
  }
  else if (e.key === 'ArrowRight') {
    next()
  }
  else if (e.key === 'ArrowLeft') {
    back()
  }
}

function onViewportChange() {
  measure()
}

function listen(on) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  window[method]('keydown', onKeydown)
  window[method]('resize', onViewportChange)
  window[method]('scroll', onViewportChange, true)
}

// A request for the tour being shown is served by it, so it does not run again.
function dropRequestFor(id) {
  if (request.value?.id === id) {
    takeRequest()
  }
}

async function finish() {
  const id = tourId.value
  dropRequestFor(id)
  visible.value = false
  setNavRailExpanded(false)
  stopTracking()
  listen(false)
  if (!hasSeen(id)) {
    try {
      await patchPreferences({ tours: { [id]: TOURS[id].date } })
    }
    catch (error) {
      triggerError(error)
    }
  }
  // A request that arrived while this tour was open has waited for it.
  handleRequest()
}

async function start(id) {
  dropRequestFor(id)
  const steps = TOURS[id].steps
  // Targets inside the rail only have a size once it is open, so open it
  // before deciding which steps are available.
  setNavRailExpanded(steps.some(s => s.expandRail))
  await nextTick()
  // A step with a route brings its own target along once it navigates, but
  // only joins a tour that has something to show on the current screen.
  const onScreen = steps.filter(s => findTarget(s.target))
  availableSteps.value = onScreen.length ? steps.filter(s => s.route || onScreen.includes(s)) : []
  if (availableSteps.value.length === 0) {
    setNavRailExpanded(false)
    return
  }
  tourId.value = id
  stepIndex.value = 0
  visible.value = true
  listen(true)
}

// A request stays queued while a tour is open and is served when it finishes.
function handleRequest() {
  const pending = request.value
  if (!pending || visible.value) {
    return
  }
  takeRequest()
  if (!TOURS[pending.id]) {
    return
  }
  if (pending.onlyIfUnseen) {
    const waitsForShell = pending.id !== SHELL_TOUR && !hasSeen(SHELL_TOUR)
    if (waitsForShell || hasSeen(pending.id)) {
      return
    }
  }
  start(pending.id)
}

// The rail stays open only for the steps that point into it. A step with a
// route navigates there unless the previous step's link already did; the
// tracking burst picks up the target once the view renders, and the card sits
// centred until then.
watch(step, (current) => {
  if (!visible.value) {
    return
  }
  setNavRailExpanded(Boolean(current?.expandRail))
  if (current?.route && !navigatedByClick && route.path !== current.route) {
    router.push(current.route)
  }
  navigatedByClick = false
  track()
})

watch(request, handleRequest, { immediate: true })

onBeforeUnmount(() => {
  setNavRailExpanded(false)
  stopTracking()
  listen(false)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="tour-backdrop"
      role="dialog"
      aria-modal="true"
      :aria-label="step?.title"
      @click.self="finish"
    >
      <div class="tour-spotlight" :style="spotlightStyle" />

      <div ref="cardEl" v-focustrap class="tour-card" :style="cardStyle">
        <div class="tour-card-header">
          <span class="tour-step-count">{{ stepIndex + 1 }} / {{ availableSteps.length }}</span>
          <button class="tour-close" aria-label="Skip tour" @click="finish">
            <i class="pi pi-times" />
          </button>
        </div>
        <h3 class="tour-title">
          {{ step?.title }}
        </h3>
        <p class="tour-body">
          {{ step?.body }}
        </p>
        <div class="tour-actions">
          <Button label="Skip" text size="small" @click="finish" />
          <span class="tour-actions-spacer" />
          <Button
            label="Back"
            outlined
            size="small"
            :disabled="stepIndex === 0"
            @click="back"
          />
          <Button
            :label="isLast ? 'Done' : 'Next'"
            size="small"
            autofocus
            @click="next"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tour-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  overflow: hidden;
}

/* The dimmed backdrop is the spotlight's oversized shadow, so the target
   itself is the only undimmed region. */
.tour-spotlight {
  position: fixed;
  border-radius: 0.6rem;
  box-shadow: 0 0 0 200vmax var(--color-background-scrim);
  outline: 2px solid var(--color-primary-highlight);
  pointer-events: none;
  transition: top 0.18s ease, left 0.18s ease, width 0.18s ease, height 0.18s ease;
}

.tour-card {
  position: fixed;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  padding: 0.9rem 1.1rem 1rem;
  background-color: var(--color-background-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 0.6rem;
  box-shadow: var(--shadow-popup);
  transition: top 0.18s ease, left 0.18s ease;
}

.tour-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.tour-step-count {
  font-size: var(--text-md);
  color: var(--color-text-dim);
  letter-spacing: 0.04em;
}

.tour-close {
  background: none;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 0.3rem;
}

.tour-close:hover {
  color: var(--color-text-primary);
  background-color: var(--color-button-hover-bg);
}

.tour-title {
  margin: 0 0 0.4rem;
  font-size: var(--text-xl);
  font-weight: 600;
}

.tour-body {
  margin: 0 0 0.9rem;
  font-size: var(--text-lg);
  line-height: 1.45;
  color: var(--color-text-primary);
}

.tour-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tour-actions-spacer {
  flex: 1;
}
</style>
