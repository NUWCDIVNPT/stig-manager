<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  sections: {
    type: Array,
    required: true,
  },
})

const activeSection = ref(props.sections[0]?.id || '')
const scrollAreaRef = ref(null)

function scrollToSection(id) {
  const element = document.getElementById(`section-${id}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = id
  }
}

let observer = null
// Ids of the sections whose card currently crosses the detection band. We keep
// the whole set instead of reacting to one transient crossing so we can always
// resolve the topmost visible section and avoid skipping fast-scrolled cards.
const visibleSections = new Set()

function updateActiveSection() {
  const area = scrollAreaRef.value
  if (!area || props.sections.length === 0) {
    return
  }

  // The last card cannot rise into the detection band once the list is fully
  // scrolled, so it would never activate on its own — force it at the bottom.
  if (Math.ceil(area.scrollTop + area.clientHeight) >= area.scrollHeight - 1) {
    activeSection.value = props.sections[props.sections.length - 1].id
    return
  }

  // Otherwise the active section is the first one (in document order) whose
  // card is currently in the band. If none is, keep the current selection.
  const topmost = props.sections.find(sec => visibleSections.has(sec.id))
  if (topmost) {
    activeSection.value = topmost.id
  }
}

function rebuildObserver() {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  visibleSections.clear()

  if (!props.sections.some(sec => sec.id === activeSection.value)) {
    activeSection.value = props.sections[0]?.id || ''
  }

  if (props.sections.length === 0) {
    return
  }

  const options = {
    root: scrollAreaRef.value,
    rootMargin: '-10% 0px -70% 0px',
    threshold: 0,
  }

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.id.replace('section-', '')
      if (entry.isIntersecting) {
        visibleSections.add(id)
      }
      else {
        visibleSections.delete(id)
      }
    })
    updateActiveSection()
  }, options)

  props.sections.forEach((sec) => {
    const el = document.getElementById(`section-${sec.id}`)
    if (el) {
      observer.observe(el)
    }
  })
}

onMounted(() => {
  rebuildObserver()
  // The observer covers crossings; the scroll listener settles the selection
  // after fast scrolls and re-checks the bottom edge where no crossing fires.
  scrollAreaRef.value?.addEventListener('scroll', updateActiveSection, { passive: true })
})

// Re-observe when the section list changes; flush 'post' waits until the
// section elements rendered from the new list are in the DOM.
watch(() => props.sections, rebuildObserver, { flush: 'post' })

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  scrollAreaRef.value?.removeEventListener('scroll', updateActiveSection)
})
</script>

<template>
  <div class="scrollspy-layout">
    <!-- Sidebar Navigation -->
    <nav class="scrollspy-nav">
      <ul class="scrollspy-nav-list">
        <li v-for="sec in props.sections" :key="sec.id" class="scrollspy-nav-item">
          <button
            class="scrollspy-nav-link"
            :class="{ 'scrollspy-nav-link--active': activeSection === sec.id }"
            @click="scrollToSection(sec.id)"
          >
            <i v-if="sec.icon" class="pi scrollspy-nav-icon" :class="[sec.icon]" />
            <span>{{ sec.title }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Scrollable Content -->
    <div ref="scrollAreaRef" class="scrollspy-scroll-area">
      <section
        v-for="sec in props.sections"
        :id="`section-${sec.id}`"
        :key="sec.id"
        class="scrollspy-card"
      >
        <header class="scrollspy-card-header">
          <div v-if="sec.icon" class="scrollspy-card-icon-wrapper">
            <i class="pi scrollspy-card-icon" :class="[sec.icon]" />
          </div>
          <div class="header-text-group">
            <h3 class="scrollspy-card-title">
              {{ sec.title }}
            </h3>
            <p v-if="sec.desc" class="scrollspy-card-desc">
              {{ sec.desc }}
            </p>
          </div>
        </header>
        <div class="scrollspy-card-body">
          <slot :name="sec.id" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.scrollspy-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

.scrollspy-nav {
  width: 16rem;
  flex-shrink: 0;
  background-color: var(--color-background-dark);
  padding: 1.5rem 0.25rem 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  transition: padding-left 0.15s ease, width 0.15s ease;
}

.scrollspy-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.scrollspy-nav-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 1.25rem;
  background: none;
  border: none;
  color: var(--color-text-dim);
  font-size: 1.075rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.12s ease;
  border-radius: 6px;
}

.scrollspy-nav-link:hover {
  color: var(--color-text-bright);
  background-color: var(--color-background-light);
}

.scrollspy-nav-link--active {
  color: var(--color-primary-highlight) !important;
  font-weight: 600;
  background-color: color-mix(in srgb, var(--color-primary-highlight) 12%, transparent) !important;
}

.scrollspy-nav-icon {
  font-size: 1.05rem;
  opacity: 0.85;
}

.scrollspy-scroll-area {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  scroll-behavior: smooth;
}

@media (min-width: 1800px) {
  .scrollspy-nav {
    width: calc(16rem + (100vw - 1800px) / 2);
    padding-left: calc(1.5rem + (100vw - 1800px) / 2);

  }
  .scrollspy-scroll-area {
    padding-right: calc(19rem + (100vw - 1800px) / 2);
  }
}

.scrollspy-card {
  position: relative;
  overflow: hidden;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  max-width: 1100px;
  min-width: 800px;
  flex-shrink: 0;
}

.scrollspy-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, var(--color-primary-highlight-light), transparent);
  opacity: 0.5;
}

.scrollspy-card:hover {
  border-color: color-mix(in srgb, var(--color-primary-highlight-light) 40%, var(--color-border-default));
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.4), 0 0 12px 0px color-mix(in srgb, var(--color-primary-highlight-light) 8%, transparent);
}

.scrollspy-card-header {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  border-bottom: 1px solid var(--color-border-default);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.scrollspy-card-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-primary-highlight-light) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-highlight-light) 15%, transparent);
  flex-shrink: 0;
}

.scrollspy-card-icon {
  font-size: 1.45rem;
  color: var(--color-primary-highlight-light);
}

.header-text-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.scrollspy-card-title {
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin: 0;
}

.scrollspy-card-desc {
  color: var(--color-text-dim);
  font-size: 1.1rem;
  margin: 0;
}

.scrollspy-card-body {
  color: var(--color-text-primary);
}
</style>
