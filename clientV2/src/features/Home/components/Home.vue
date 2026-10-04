<script setup>
import { onMounted, ref } from 'vue'
import navyLogo from '../../../assets/navy.svg'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useEnv } from '../../../shared/stores/useEnv.js'
import { fetchAppManagers } from '../api/api'
import HomePanel from './HomePanel.vue'

const env = useEnv()
const welcome = env.welcome ?? {}
const docsUrl = env.docsUrl

const {
  state: appManagers,
  isLoading: managersLoading,
  error: managersError,
  execute,
} = useAsyncState(fetchAppManagers, {
  immediate: false,
  initialState: [],
})

onMounted(async () => {
  if (env.displayAppManagers) {
    await execute()
  }
})

// STIGMAN_CLIENT_WELCOME_IMAGE points at an image hosted elsewhere; fall back
// to the sponsor seal when it is unset or fails to load.
const welcomeImage = ref(welcome.image || navyLogo)
function onWelcomeImageError() {
  welcomeImage.value = navyLogo
}

// STIGMAN_CLIENT_WELCOME_TITLE defaults to "Support" when a message or link is
// configured. With none of the three set there is no support section.
const supportTitle = welcome.title || (welcome.message || welcome.link ? 'Support' : '')
</script>

<template>
  <div class="home-component">
    <div class="home-grid">
      <HomePanel title="Welcome" scroll>
        <div class="welcome-section">
          <span class="welcome-image">
            <img :src="welcomeImage" alt="" @error="onWelcomeImageError">
          </span>
          <p class="card-text">
            <strong>STIG Manager</strong> is an API and Web client for managing the assessment of
            Information Systems for compliance with
            <a href="https://public.cyber.mil/stigs/" target="_blank" rel="noopener">security checklists</a>
            published by the United States Defense Information Systems Agency (DISA). The software is
            <a href="https://github.com/NUWCDIVNPT/stig-manager" target="_blank" rel="noopener">an open source project</a>
            maintained by the Naval Sea Systems Command (NAVSEA) of the United States Navy.
          </p>
        </div>
        <div v-if="supportTitle">
          <h3 class="section-subtitle">
            {{ supportTitle }}
          </h3>
          <p v-if="welcome.message" class="card-text">
            {{ welcome.message }}
          </p>
          <p v-if="welcome.link" class="card-text">
            <a :href="welcome.link" target="_blank" rel="noopener">{{ welcome.link }}</a>
          </p>
        </div>
      </HomePanel>

      <HomePanel title="Documentation">
        <div>
          <h3 class="section-subtitle">
            Need help?
          </h3>
          <p class="card-text">
            Check out our <a :href="`${docsUrl}index.html`" target="_blank" rel="noopener">Documentation</a>
          </p>
        </div>
        <div>
          <h3 class="section-subtitle">
            Just Getting Started?
          </h3>
          <p class="card-text">
            Check out our <a :href="`${docsUrl}user-guide/user-quickstart.html`" target="_blank" rel="noopener">User Walkthrough</a>
            or the <a :href="`${docsUrl}user-guide/user-guide.html`" target="_blank" rel="noopener">User Guide</a>
          </p>
        </div>
        <div>
          <h3 class="section-subtitle">
            Common Tasks
          </h3>
          <p class="card-text">
            Not sure how to do something in STIG Manager? Check out these links to
            <a :href="`${docsUrl}features/common-tasks.html`" target="_blank" rel="noopener">Common Tasks</a>
          </p>
        </div>
        <div>
          <h3 class="section-subtitle">
            Issues, Feature Requests, and Contributions
          </h3>
          <p class="card-text">
            Want to report a bug, request a feature, or help out the project?
            <a :href="`${docsUrl}the-project/contributing.html`" target="_blank" rel="noopener">Check out our Contribution Guide</a>
          </p>
        </div>
      </HomePanel>

      <HomePanel title="Resources">
        <div>
          <h3 class="section-subtitle">
            GitHub
          </h3>
          <p class="card-text">
            <a href="https://github.com/NUWCDIVNPT/stig-manager" target="_blank" rel="noopener">STIG Manager</a>
          </p>
          <p class="card-text">
            <a href="https://github.com/NUWCDIVNPT/stigman-watcher" target="_blank" rel="noopener">STIG Manager Watcher</a>
          </p>
        </div>
        <div>
          <h3 class="section-subtitle">
            DISA STIGs
          </h3>
          <p class="card-text">
            Get the latest STIGs at <a href="https://public.cyber.mil/stigs/downloads/" target="_blank" rel="noopener">cyber.mil</a>.
          </p>
        </div>
        <div>
          <h3 class="section-subtitle">
            RMF Reference
          </h3>
          <p class="card-text">
            STIG Manager assists with STEP 4 of the
            <a href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf" target="_blank" rel="noopener">Risk Management Framework Process</a>.
          </p>
        </div>
        <div>
          <h3 class="section-subtitle">
            DevSecOps
          </h3>
          <p class="card-text">
            STIG Manager is being developed as part of the
            <a href="https://software.af.mil/dsop/documents/" target="_blank" rel="noopener">DoD Enterprise DevSecOps</a>
            and <a href="https://code.mil" target="_blank" rel="noopener">Code.mil Open Source</a> initiatives.
          </p>
        </div>
      </HomePanel>

      <HomePanel v-if="env.displayAppManagers" title="Application Managers" scroll>
        <p v-if="managersError" class="card-text status-text">
          Unable to load the Application Managers list.
        </p>
        <p v-else-if="!managersLoading && !appManagers.length" class="card-text status-text">
          No Application Managers are listed.
        </p>
        <ul v-else class="manager-list">
          <li
            v-for="manager in appManagers"
            :key="manager.userId"
            class="manager-item"
          >
            <span class="manager-name">{{ manager.displayName || manager.username }}</span>
            <span class="manager-email">{{ manager.email || 'No Email Available' }}</span>
          </li>
        </ul>
      </HomePanel>
    </div>
  </div>
</template>

<style scoped>
.home-component {
  height: 100%;
  overflow-y: auto;
  padding: 1rem;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-auto-rows: minmax(34rem, auto);
  gap: 1rem;
  max-width: 1600px;
  margin: 0 auto;
}

.section-subtitle {
  margin: 0 0 0.35rem 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-primary-highlight);
}

.card-text {
  margin: 0;
  font-size: var(--text-md);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.card-text + .card-text {
  margin-top: 0.35rem;
}

.card-text strong {
  font-weight: 600;
}

.home-grid a {
  color: var(--color-link);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.home-grid a:hover {
  color: var(--color-link-hover);
}

.welcome-section {
  display: flow-root;
}

.welcome-image {
  float: left;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 125px;
  height: 125px;
  margin: 0 1rem 0.5rem 0;
}

.welcome-image img {
  max-width: 100%;
  max-height: 100%;
}

.manager-list {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.manager-item {
  display: flex;
  flex-direction: column;
}

.manager-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.manager-email,
.status-text {
  font-style: italic;
  color: var(--color-text-dim);
}
</style>
