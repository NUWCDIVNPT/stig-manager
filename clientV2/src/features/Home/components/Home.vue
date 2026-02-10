<script setup>
import { computed, onMounted, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useEnv } from '../../../shared/stores/useEnv.js'
import { fetchAppManagers } from '../api/api'
import CustomCards from './CustomCards.vue'

const env = useEnv()

const {
  state: appManagers,
  execute,
} = useAsyncState(fetchAppManagers, {
  immediate: false,
  initialState: [],
})

const customCardsRef = ref(null)

const cards = computed({
  get: () => customCardsRef.value?.customCards || [],
  set: (val) => {
    if (customCardsRef.value) {
      customCardsRef.value.customCards = val
    }
  },
})

const isReorderMode = computed(() => customCardsRef.value?.reorderMode || false)

onMounted(async () => {
  if (env.displayAppManagers) {
    await execute()
  }
})

function isTallCard(content) {
  if (!content) {
    return false
  }

  // content length > 600 chars
  const textLength = content.replace(/<[^>]*>/g, '').length
  const isLong = textLength > 600

  // more than 10 breaks
  const breakCount = (content.match(/<\/p>|<\/li>|<br>/g) || []).length
  const hasManyBreaks = breakCount > 10

  const hasImage = content.includes('<img')

  return isLong || hasManyBreaks || hasImage
}
</script>

<template>
  <div class="home-component">
    <CustomCards ref="customCardsRef" />
    <div class="home-content">
      <div class="home-grid">
        <div class="home-card">
          <h2 class="card-title">
            Welcome
          </h2>
          <div class="card-content">
            <div class="welcome-section">
              <div>
                <span class="navy-logo" />
              </div>
              <p class="card-text">
                <strong>STIG Manager</strong> is an API and Web client for managing the assessment of
                Information Systems for compliance with
                <a href="https://public.cyber.mil/stigs/" target="_blank" rel="noopener" class="link">security checklists</a>
                published by the
                United States Defense Information Systems Agency (DISA). The software is
                <a href="https://github.com/NUWCDIVNPT/stig-manager" target="_blank" rel="noopener" class="link">open source</a>
                and maintained by the Naval Sea Systems Command (NAVSEA) at the United States Navy.
              </p>
            </div>
            <div class="support-section">
              <p class="card-text">
                {{ env.welcome.message }}
              </p>
            </div>
          </div>
        </div>

        <div class="home-card">
          <h2 class="card-title">
            Documentation
          </h2>
          <div class="card-content">
            <div class="doc-section">
              <h3 class="section-subtitle">
                Need help?
              </h3>
              <p class="card-text">
                Check out our
                <a target="_blank" rel="noopener" class="link" href="docs/index.html">Documentation</a>,
              </p>
            </div>

            <div class="doc-section">
              <h3 class="section-subtitle">
                Just Getting Started?
              </h3>
              <p class="card-text">
                `Check out our <a target="_blank" rel="noopener" class="link" href="docs/user-guide/user-quickstart.html">User Walkthrough</a> or the <a target="_blank" rel="noopener" class="link" href="docs/user-guide/user-guide.html">User Guide</a>,
              </p>
            </div>

            <div class="doc-section">
              <h3 class="section-subtitle">
                Common Tasks
              </h3>
              <p class="card-text">
                Not sure how to do something in STIG Manager? Check out these links to <a target="_blank" rel="noopener" class="link" href="docs/features/common-tasks.html">Common Tasks</a>,
              </p>
            </div>

            <div class="doc-section">
              <h3 class="section-subtitle">
                Issues, Feature Requests, and Contributions
              </h3>
              <p class="card-text">
                Want to report a bug, request a feature, or help out the project?
                Want to report a bug, request a feature, or help out the project? <a target="_blank" rel="noopener" class="link" href="docs/the-project/contributing.html">Check out our Contribution Guide</a>,
              </p>
            </div>
          </div>
        </div>

        <div class="home-card">
          <h2 class="card-title">
            Resources
          </h2>
          <div class="card-content">
            <div class="resource-section">
              <h3 class="section-subtitle">
                GitHub
              </h3>
              <div class="resource-links">
                <a href="https://github.com/NUWCDIVNPT/stig-manager" target="_blank" rel="noopener" class="link">STIG Manager</a>
                <a href="https://github.com/NUWCDIVNPT/stigman-watcher" target="_blank" rel="noopener" class="link">STIG Manager Watcher</a>
              </div>
            </div>

            <div class="resource-section">
              <h3 class="section-subtitle">
                DISA STIGs
              </h3>
              <p class="card-text">
                Get the latest STIGs at
                <a href="https://www.cyber.mil/stigs/downloads/" target="_blank" rel="noopener" class="link">cyber.mil</a>
              </p>
            </div>

            <div class="resource-section">
              <h3 class="section-subtitle">
                RMF Reference
              </h3>
              <p class="card-text">
                STIG Manager assists with STEP 4 of the
                <a href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf" class="link" target="_blank" rel="noopener">RMF Implementation Lifecycle Process</a>
              </p>
            </div>

            <div class="resource-section">
              <h3 class="section-subtitle">
                DevSecOps
              </h3>
              <p class="card-text">
                STIG Manager is being developed as part of the
                <a href="https://software.af.mil/team/devsecops/" target="_blank" rel="noopener" class="link">DoD Enterprise DevSecOps</a>
                and
                <a href="https://code.mil/" target="_blank" rel="noopener" class="link">code.mil Open Source</a>
                initiatives.
              </p>
            </div>
          </div>
        </div>

        <div v-if="env.displayAppManagers && appManagers?.length" class="home-card">
          <h2 class="card-title">
            Application Managers
          </h2>
          <div class="card-content">
            <ul class="manager-list">
              <li
                v-for="manager in appManagers"
                :key="manager.userId"
                class="manager-item"
              >
                <strong>{{ manager.display || manager.username }}</strong>
                <span class="manager-detail">{{ manager.email || 'No Email Available' }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <VueDraggable
        v-if="customCardsRef"
        v-model="cards"
        class="custom-grid"
        :disabled="!isReorderMode"
        ghost-class="ghost-card"
        drag-class="drag-card"
        :animation="200"
        :force-fallback="true"
        :scroll-sensitivity="150"
        :scroll-speed="20"
      >
        <div
          v-for="card in cards"
          :key="card.id"
          class="home-card custom-card"
          :class="{ 'full-width': isTallCard(card.content), 'reorder-mode': isReorderMode }"
        >
          <h2 class="card-title">
            <span class="title-text">
              <i v-if="isReorderMode" class="pi pi-bars handle" style="cursor: grab; margin-right: 0.5rem; color: rgba(255,255,255,0.5)" />
              {{ card.title }}
              <span v-if="card.date" class="card-date">{{ customCardsRef.formatDate(card.date) }}</span>
            </span>
            <div v-if="isReorderMode" class="card-actions">
              <button
                class="edit-btn"
                title="Edit card"
                @click="customCardsRef.openEditDialog(card)"
              >
                ✎
              </button>
              <button
                class="delete-btn"
                title="Delete card"
                @click="customCardsRef.deleteCard(card.id)"
              >
                ×
              </button>
            </div>
          </h2>
          <div class="card-content">
            <div class="custom-card-section">
              <div class="card-text" v-html="card.content" />
            </div>
          </div>
        </div>
      </VueDraggable>
    </div>
  </div>
</template>

<style scoped>
:deep(*) {
  scrollbar-width: thin;
  scrollbar-color: rgba(16, 185, 129, 0.3) transparent;
}

:deep(*::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(*::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(*::-webkit-scrollbar-thumb) {
  background-color: rgba(16, 185, 129, 0.3);
  border-radius: 4px;
}

:deep(*::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(16, 185, 129, 0.5);
}
.home-component {
  overflow-y: auto;
  padding: 1rem;
  height: 100%;
}

.home-content {
  animation: fadeIn 0.8s ease-out;
  max-width: 1400px;
  margin: 0 auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.home-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.custom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.home-card {
  break-inside: avoid;
  margin-bottom: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  padding: 1.25rem;
  transition: all 0.6s ease;
  display: flex;
  flex-direction: column;
}

.full-width {
  grid-column: 1 / -1;
}

.home-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary-highlight);
  margin: 0 0 1rem 0;
  letter-spacing: -0.01em;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-text {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.card-date {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.welcome-section {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.navy-logo {
  display: block;
  width: 100px;
  height: 100px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: left center;
  background-image: url('/src/assets/navy.svg');
}

.card-text {
  font-size: 1.25rem;
  line-height: 1.7;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.card-text :deep(img) {
  max-width: 100%;
  height: auto;
}

.card-text strong {
  font-weight: 600;
}

.section-subtitle {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem 0;
}

.link {
  color: var(--color-primary-highlight);
  text-decoration: none;
  transition: all 0.15s ease;
  position: relative;
  font-weight: 500;
}

.link:hover {
  color: var(--color-primary-highlight-light);
  text-decoration: underline;
  text-decoration-color: rgba(16, 185, 129, 0.4);
  text-underline-offset: 2px;
}

.support-section,
.doc-section,
.resource-section {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  border-left: 3px solid rgba(131, 131, 131, 0.4);
}

.resource-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.manager-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.manager-item {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: all 0.15s ease;
}

.manager-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.manager-item strong {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
}

.manager-detail {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.custom-card .card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.edit-btn,
.delete-btn {
  font-size: 1.25rem;
  width: 28px;
  height: 28px;
  border-radius: 0.25rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
  border: 1px solid transparent;
}

.delete-btn:hover {
background: rgba(175, 175, 175, 0.2);
border-color: rgba(175, 175, 175, 0.5);
transform: scale(1.05);
}

.edit-btn {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  font-size: 1rem;
}

.edit-btn:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  transform: scale(1.05);
}

.custom-card-section {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  border-left: 3px solid rgba(131, 131, 131, 0.4);
}

.reorder-mode {
  cursor: grab;
  border-style: dashed;
}

.reorder-mode:active {
  cursor: grabbing;
}

.ghost-card {
  opacity: 0.5;
  background: rgba(59, 130, 246, 0.1);
  border: 3px dashed rgba(59, 130, 246, 1);
}

.drag-card {
  opacity: 1;
  background: #18181b;
  transform: rotate(2deg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  cursor: grabbing;
}
</style>
