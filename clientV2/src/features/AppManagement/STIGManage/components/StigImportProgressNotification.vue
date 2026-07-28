<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationCard from '../../../../components/global/NotificationCard.vue'
import { useStigImportStore } from '../stores/stigImportStore.js'

const props = defineProps({
  state: { type: Object, required: true },
})

defineEmits(['dismiss'])

const store = useStigImportStore()
const counts = store.counts
const router = useRouter()
const route = useRoute()

const progressPct = computed(() => {
  if (!counts.value.total) {
    return 0
  }
  return Math.round((counts.value.processed / counts.value.total) * 100)
})

const headerTitle = computed(() => {
  if (props.state.isDone) {
    return 'STIG Import Complete'
  }
  return props.state.paused ? 'STIG Import Paused' : 'Importing STIGs…'
})

function viewResults() {
  store.requestReopen()
  if (route.name !== 'admin-stigs') {
    router.push({ name: 'admin-stigs' })
  }
}

function goStigManagement() {
  store.dismiss()
  router.push({ name: 'admin-stigs' })
}
</script>

<template>
  <NotificationCard @dismiss="$emit('dismiss')">
    <template #header>
      <span v-if="!state.isDone && state.paused" class="pi pi-pause header-icon" />
      <span v-else-if="!state.isDone" class="pi pi-spin pi-spinner header-icon" />
      <span v-else-if="counts.failed" class="pi pi-exclamation-circle header-icon header-icon--warn" />
      <span v-else class="pi pi-check-circle header-icon header-icon--done" />
      <span class="header-title">{{ headerTitle }}</span>
    </template>
    <template v-if="!state.isDone" #close>
      <!-- hide close button while in progress -->
    </template>

    <template v-if="!state.isDone">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${progressPct}%` }" />
      </div>
      <div class="progress-meta">
        <span class="meta-count">{{ counts.processed }} / {{ counts.total }} files</span>
        <span class="meta-text">{{ state.paused ? 'Paused' : state.currentLabel }}</span>
      </div>
      <div class="action-row">
        <button v-if="!state.paused" class="action-btn" @click="store.pause()">
          <span class="pi pi-pause" />
          Pause
        </button>
        <button v-else class="action-btn" @click="store.resume()">
          <span class="pi pi-play" />
          Resume
        </button>
      </div>
    </template>
    <template v-else>
      <div class="progress-meta">
        <span class="meta-count">
          {{ counts.processed }} file{{ counts.processed !== 1 ? 's' : '' }} processed{{ counts.failed ? `, ${counts.failed} error${counts.failed !== 1 ? 's' : ''}` : '' }}
        </span>
      </div>
      <div class="action-row">
        <button class="action-btn" @click="viewResults">
          <span class="pi pi-external-link" />
          View Results
        </button>
        <button v-if="route.name !== 'admin-stigs'" class="action-btn" @click="goStigManagement">
          <span class="pi pi-arrow-right" />
          Go to STIG Management
        </button>
      </div>
    </template>
  </NotificationCard>
</template>

<style scoped>
.header-icon {
  font-size: 1.25rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.header-icon--done {
  color: var(--color-success);
}

.header-icon--warn {
  color: var(--color-warning-yellow);
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.progress-track {
  height: 4px;
  background: var(--color-border-default);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-action-blue-dark);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.progress-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.meta-count {
  font-size: 1.05rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.meta-text {
  font-size: 1.05rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-action-blue);
  background: color-mix(in srgb, var(--color-action-blue-dark) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 35%, transparent);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.action-btn:hover {
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  color: var(--color-primary-highlight);
}
</style>
