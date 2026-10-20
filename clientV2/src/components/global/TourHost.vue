<script setup>
// Step-through overlay that runs the tours defined in tours.js. Each step
// spotlights an element tagged with a `data-tour` attribute and shows a card
// beside it. Steps whose target is absent (Admin for non-admins, for example)
// are skipped automatically.
//
// The shell tour opens by itself until the user has seen its current date
// (webPreferences.tours.shell). Views offer their own tours through useTours;
// an offered tour opens once the shell tour has been seen, and only while no
// other tour is open.
import Button from 'primevue/button'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'
import { useTours } from '../../shared/composables/useTours.js'
import { useWebPreferences } from '../../shared/composables/useWebPreferences.js'
import { useGlobalAppStore } from '../../shared/stores/globalAppStore.js'
import { TOURS } from './tours.js'

const SHELL_TOUR = 'shell'

const globalAppStore = useGlobalAppStore()
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

const availableSteps = ref([])

const step = computed(() => availableSteps.value[stepIndex.value])
const isLast = computed(() => stepIndex.value === availableSteps.value.length - 1)

function findTarget(name) {
  const el = document.querySelector(`[data-tour="${name}"]`)
  if (!el) {
    return null
  }
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 ? el : null
}

function measure() {
  const el = step.value ? findTarget(step.value.target) : null
  targetRect.value = el ? el.getBoundingClientRect() : null
  if (cardEl.value) {
    const { offsetWidth, offsetHeight } = cardEl.value
    cardSize.value = { width: offsetWidth, height: offsetHeight }
  }
}

// The rail expand/collapse animates its width, so a one-shot measurement on
// step change would leave the spotlight behind. Re-measuring every frame while
// the tour is open is cheap and keeps the overlay glued to its target.
function trackFrame() {
  measure()
  frameId = requestAnimationFrame(trackFrame)
}

const spotlightStyle = computed(() => {
  const r = targetRect.value
  if (!r) {
    return { display: 'none' }
  }
  return {
    top: `${r.top - SPOTLIGHT_PAD}px`,
    left: `${r.left - SPOTLIGHT_PAD}px`,
    width: `${r.width + SPOTLIGHT_PAD * 2}px`,
    height: `${r.height + SPOTLIGHT_PAD * 2}px`,
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

  const placement = step.value?.placement
  if (placement === 'below-end') {
    return {
      top: `${clamp(r.bottom + CARD_GAP, vh - height)}px`,
      left: `${clamp(r.right - width, vw - width)}px`,
    }
  }
  if (placement === 'center') {
    return {
      top: `${clamp(r.top + r.height / 2 - height / 2, vh - height)}px`,
      left: `${clamp(r.left + r.width / 2 - width / 2, vw - width)}px`,
    }
  }
  if (placement === 'left') {
    return {
      top: `${clamp(r.top + r.height / 2 - height / 2, vh - height)}px`,
      left: `${clamp(r.left - SPOTLIGHT_PAD - CARD_GAP - width, vw - width)}px`,
    }
  }
  // 'right': beside the target, vertically centred on it.
  return {
    top: `${clamp(r.top + r.height / 2 - height / 2, vh - height)}px`,
    left: `${clamp(r.right + SPOTLIGHT_PAD + CARD_GAP, vw - width)}px`,
  }
})

function next() {
  if (isLast.value) {
    finish()
    return
  }
  if (step.value?.clickTarget) {
    findTarget(step.value.target)?.click()
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

async function finish() {
  const id = tourId.value
  visible.value = false
  setNavRailExpanded(false)
  stopTracking()
  if (hasSeen(id)) {
    return
  }
  try {
    await patchPreferences({ tours: { [id]: TOURS[id].date } })
  }
  catch (error) {
    triggerError(error)
  }
}

function onKeydown(e) {
  if (!visible.value) {
    return
  }
  if (e.key === 'Escape') {
    finish()
  }
  else if (e.key === 'ArrowRight' || e.key === 'Enter') {
    next()
  }
  else if (e.key === 'ArrowLeft') {
    back()
  }
}

async function start(id) {
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
  await nextTick()
  measure()
  stopTracking()
  frameId = requestAnimationFrame(trackFrame)
}

function handleRequest() {
  const pending = takeRequest()
  if (!pending || visible.value || !TOURS[pending.id]) {
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

function stopTracking() {
  if (frameId !== null) {
    cancelAnimationFrame(frameId)
    frameId = null
  }
}

// The rail stays open only for the steps that point into it. A step with a
// route navigates there; the per-frame measurement picks up the target once
// the view renders, and the card sits centred until then.
watch(step, (current) => {
  if (!visible.value) {
    return
  }
  setNavRailExpanded(Boolean(current?.expandRail))
  if (current?.route && route.path !== current.route) {
    router.push(current.route)
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  if (globalAppStore.user && !hasSeen(SHELL_TOUR)) {
    // Let the shell finish its first paint so the rail and menu bar are measurable.
    setTimeout(() => {
      if (!visible.value) {
        start(SHELL_TOUR)
      }
    }, 400)
  }
  else {
    handleRequest()
  }
})

watch(request, handleRequest)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  setNavRailExpanded(false)
  stopTracking()
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

      <div ref="cardEl" class="tour-card" :style="cardStyle">
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
  box-shadow: 0 0 0 200vmax rgba(0, 0, 0, 0.62);
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
  box-shadow: 0 0.6rem 2rem rgba(0, 0, 0, 0.5);
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
