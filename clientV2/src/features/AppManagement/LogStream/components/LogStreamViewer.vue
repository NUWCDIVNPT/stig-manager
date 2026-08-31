<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DEFAULT_MAX_LINES } from '../lib/logBuffer.js'

// The streaming "table". Rendering is intentionally imperative: incoming frames
// are queued and flushed once per animation frame via replaceChildren, and the
// line <div>s are never Vue-reactive. Diffing up to a thousand rapidly-mutating
// monospace rows through Vue every frame would be the bottleneck the old ExtJS
// panel deliberately avoided — this keeps a busy stream smooth.

const props = defineProps({
  maxLines: { type: Number, default: DEFAULT_MAX_LINES },
  wrap: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'Connecting…' },
})

const emit = defineEmits(['line-select'])

const scrollEl = ref(null)
const wrapperEl = ref(null)

let logDivs = []
let pending = []
let needsFlush = false
let shouldAutoScroll = true
let selectedEl = null

function isAtBottom(el) {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 5
}

// Builds one log-line <div> from a record ({ text, dataset }).
function makeLineEl(record) {
  const el = document.createElement('div')
  el.className = 'sm-log-line'
  el.textContent = record.text
  for (const [key, value] of Object.entries(record.dataset)) {
    if (value !== undefined && value !== null) {
      el.dataset[key] = value
    }
  }
  return el
}

function flush() {
  needsFlush = false
  const scroller = scrollEl.value
  const wrapper = wrapperEl.value
  if (!scroller || !wrapper) {
    return
  }

  // Anchor the top-most visible line so appends don't yank a scrolled-up reader.
  let anchorText = null
  let anchorOffset = 0
  if (!shouldAutoScroll && logDivs.length) {
    const scrollTop = scroller.scrollTop
    for (const el of wrapper.children) {
      if (el.offsetTop + el.offsetHeight > scrollTop) {
        anchorText = el.textContent
        anchorOffset = el.offsetTop - scrollTop
        break
      }
    }
  }

  for (const record of pending) {
    logDivs.push(makeLineEl(record))
  }
  pending = []
  if (logDivs.length > props.maxLines) {
    logDivs = logDivs.slice(logDivs.length - props.maxLines)
  }
  wrapper.replaceChildren(...logDivs)

  if (shouldAutoScroll) {
    scroller.scrollTop = scroller.scrollHeight
  }
  else if (anchorText) {
    for (const el of wrapper.children) {
      if (el.textContent === anchorText) {
        scroller.scrollTop = el.offsetTop - anchorOffset
        break
      }
    }
  }
}

function scheduleFlush() {
  if (!needsFlush) {
    needsFlush = true
    requestAnimationFrame(flush)
  }
}

function append(record) {
  pending.push(record)
  scheduleFlush()
}

function clear() {
  logDivs = []
  pending = []
  selectedEl = null
  applyEmpty()
}

// Renders an entire buffer snapshot at once, replacing whatever is shown. Used
// on mount to restore the lines the store captured while this view was gone.
function hydrate(records) {
  selectedEl = null
  pending = []
  if (!records.length) {
    logDivs = []
    applyEmpty()
    return
  }
  logDivs = records.map(makeLineEl)
  wrapperEl.value?.replaceChildren(...logDivs)
  shouldAutoScroll = true
  if (scrollEl.value) {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }
}

// Renders the placeholder line shown whenever there is nothing buffered.
function applyEmpty(message = props.emptyMessage) {
  const el = document.createElement('div')
  el.className = 'sm-log-empty'
  el.textContent = message
  wrapperEl.value?.replaceChildren(el)
}

// Lets the parent jump to and select a line by its data-request-id — the seam
// the transaction grid uses to cross-link without reaching into the DOM. `types`
// narrows to specific rest frame types (e.g. request/transaction, or response).
function selectByRequestId(requestId, { types } = {}) {
  const wrapper = wrapperEl.value
  if (!wrapper || !requestId) {
    return
  }
  const typeSel = types?.length
    ? `:is(${types.map(t => `[data-type="${t}"]`).join(',')})`
    : ''
  const el = wrapper.querySelector(`.sm-log-line[data-request-id="${requestId}"]${typeSel}`)
  if (el) {
    selectLine(el)
    scrollEl.value.scrollTop = el.offsetTop - scrollEl.value.clientHeight / 2
  }
}

function selectLine(el) {
  if (selectedEl) {
    selectedEl.classList.remove('selected')
  }
  el.classList.add('selected')
  selectedEl = el
  try {
    emit('line-select', JSON.parse(el.textContent))
  }
  catch {
    // A line that isn't valid JSON has nothing to expand — ignore.
  }
}

function onClick(event) {
  if (event.target.classList.contains('sm-log-line')) {
    selectLine(event.target)
  }
}

function onScroll() {
  shouldAutoScroll = isAtBottom(scrollEl.value)
}

watch(() => props.wrap, (wrap) => {
  if (scrollEl.value) {
    scrollEl.value.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'
  }
})

onMounted(() => {
  scrollEl.value.addEventListener('scroll', onScroll)
  scrollEl.value.style.whiteSpace = props.wrap ? 'pre-wrap' : 'pre'
  // Seed the placeholder imperatively so the wrapper's children are owned
  // entirely by this component, never by Vue — replaceChildren() below would
  // otherwise fight Vue's virtual DOM over the same parent.
  applyEmpty()
})

onBeforeUnmount(() => {
  scrollEl.value?.removeEventListener('scroll', onScroll)
})

defineExpose({ append, clear, hydrate, applyEmpty, selectByRequestId })
</script>

<template>
  <div ref="scrollEl" class="sm-log-panel-body" @click="onClick">
    <div ref="wrapperEl" class="sm-log-wrapper" :class="{ 'sm-log-wrap': wrap }" />
  </div>
</template>
