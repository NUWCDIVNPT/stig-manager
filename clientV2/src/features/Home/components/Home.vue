<script setup>
import { inject, onMounted, ref } from 'vue'
import { useEnv } from '../../../shared/stores/useEnv.js'
import { fetchAppManagers } from '../api/api'
import CustomCards from './CustomCards.vue'

const env = useEnv()
const worker = inject('worker', null)
const appManagers = ref([])
const isLoadingManagers = ref(false)
const customCardsRef = ref(null)

onMounted(async () => {
  if (env.displayAppManagers) {
    isLoadingManagers.value = true
    try {
      appManagers.value = await fetchAppManagers(worker, env.apiUrl)
    }
    catch (error) {
      console.error('failed to fetch app managers', error)
    }
    finally {
      isLoadingManagers.value = false
    }
  }
})
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
              <div class="welcome-logo-container">
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

        <div v-if="env.displayAppManagers" class="home-card">
          <h2 class="card-title">
            Application Managers
          </h2>
          <div class="card-content">
            <div v-if="isLoadingManagers" class="loading-section">
              <p class="card-text">
                Loading managers...
              </p>
            </div>
            <ul v-else-if="appManagers?.length" class="manager-list">
              <li
                v-for="manager in appManagers"
                :key="manager.userId"
                class="manager-item"
              >
                <strong>{{ manager.display || manager.username }}</strong>
                <span class="manager-detail">{{ manager.email || 'No Email Available' }}</span>
              </li>
            </ul>
            <div v-else class="loading-section">
              <p class="card-text">
                No application managers found.
              </p>
            </div>
          </div>
        </div>

        <div
          v-for="card in customCardsRef?.customCards"
          :key="card.id"
          class="home-card custom-card"
        >
          <h2 class="card-title">
            {{ card.title }}
            <button
              class="delete-btn"
              title="Delete card"
              @click="customCardsRef.deleteCard(card.id)"
            >
              ×
            </button>
          </h2>
          <div class="card-content">
            <div class="custom-card-section">
              <p class="card-text" v-html="card.content" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom Scrollbar */
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

/* Header */
.home-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stig-manager-logo {
  width: 48px;
  height: 48px;
  background-size: contain;
  background-repeat: no-repeat;
  background-image: url('/src/assets/shield-green-check.svg');
  flex-shrink: 0;
}

.home-title {
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0;
}

.badges {
  display: flex;
  gap: 0.3rem;
  align-items: center;
  margin-left: auto;
}

.badge {
  padding: 2px 7px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 5px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge:hover {
  transform: translateY(-1px);
}

.badge-oss {
  background-color: rgba(99, 110, 123, 0.9);
}

.badge-version {
  background-color:var(--color-primary-green);
}

.home-content {
  animation: fadeIn 0.8s ease-out;
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
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.home-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  padding: 1.25rem;
  transition: all 0.6s ease;
  display: flex;
  flex-direction: column;
  flex: 1 1 calc(50% - 0.5rem);
  min-width: 320px;
  max-width: calc(50% - 0.5rem);
}

.home-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-primary-highlight);
  margin: 0 0 1rem 0;
  letter-spacing: -0.01em;
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

.welcome-logo-container {
  flex-shrink: 0;
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

/* Typography */
.card-text {
  font-size: 14px;
  line-height: 1.7;
  margin: 0;
}

.card-text strong {
  font-weight: 600;
}

.section-subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.5rem 0;
}

/* Links */
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

.loading-section {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  border-left: 3px solid rgba(16, 185, 129, 0.4);
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
  font-size: 0.875rem;
  font-weight: 600;
}

.manager-detail {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Custom Cards */
.custom-card .card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-btn {
  opacity: 0;
  font-size: 1.25rem;
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-left: auto;
}

.custom-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(175, 175, 175, 0.2);
  transform: scale(1.05);
}

.custom-card-section {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0.375rem;
  border-left: 3px solid rgba(131, 131, 131, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .home-component {
    padding: 1rem 1rem 2rem;
  }

  .home-header {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .home-title {
    font-size: 1.5rem;
  }

  .stig-manager-logo {
    width: 40px;
    height: 40px;
  }

  .badges {
    margin-left: 0;
  }

  .home-grid {
    flex-direction: column;
  }

  .home-card {
    flex: 1 1 100%;
    min-width: 100%;
  }

  .welcome-section {
    flex-direction: column;
  }

  .navy-logo {
    width: 80px;
    height: 40px;
  }
}
</style>
