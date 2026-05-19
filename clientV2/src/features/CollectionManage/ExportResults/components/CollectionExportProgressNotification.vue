<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import NotificationCard from '../../../../components/global/NotificationCard.vue'
import { useCollectionExportProgressStore } from '../../../../shared/stores/collectionExportProgressStore.js'

const props = defineProps({
  state: { type: Object, required: true },
})

const emit = defineEmits(['dismiss'])

const router = useRouter()
const progressStore = useCollectionExportProgressStore()

function fmt(n) {
  return Number(n ?? 0).toLocaleString()
}

function stepText(event) {
  if (!event || typeof event !== 'object') {
    return null
  }
  switch (event.stage) {
    case 'prepare':
      return 'Preparing data'
    case 'assets':
      return 'Preparing Assets'
    case 'reviews':
      if (event.reviewsTotal != null) {
        return `Exporting reviews (${fmt(event.reviewsExported)} of ${fmt(event.reviewsTotal)})`
      }
      return 'Exporting reviews'
    case 'metrics':
      if (event.metricsTotal != null) {
        return `Updating metrics (${fmt(event.metricsUpdated)} of ${fmt(event.metricsTotal)})`
      }
      return 'Updating metrics'
    case 'commit':
      return 'Committing'
    case 'result':
      return 'Export finished'
    default:
      return null
  }
}

const currentStep = computed(() => {
  if (props.state.error) {
    return 'Export failed'
  }
  if (props.state.isDone) {
    return 'Export finished'
  }
  for (let i = props.state.stages.length - 1; i >= 0; i--) {
    const text = stepText(props.state.stages[i])
    if (text) {
      return text
    }
  }
  return 'Sending request'
})

const canRoute = computed(() => !!props.state.dstCollectionId)

function dismissSelf() {
  // tell GlobalNotifications to remove this card AND clear store state
  emit('dismiss')
  progressStore.dismiss()
}

function goManage() {
  if (!canRoute.value) {
    return
  }
  const dstId = String(props.state.dstCollectionId)
  dismissSelf()
  router.push({ name: 'collection-management', params: { collectionId: dstId } })
}

function goView() {
  if (!canRoute.value) {
    return
  }
  const dstId = String(props.state.dstCollectionId)
  dismissSelf()
  router.push({ name: 'collection-stigs', params: { collectionId: dstId } })
}
</script>

<template>
  <NotificationCard @dismiss="$emit('dismiss')">
    <template #header>
      <span v-if="state.isActive" class="pi pi-spin pi-spinner header-icon" />
      <span v-else-if="state.error" class="pi pi-times-circle header-icon header-icon--error" />
      <span v-else class="pi pi-check-circle header-icon header-icon--done" />
      <span class="header-title">
        {{ state.error ? 'Export Failed' : state.isDone ? 'Export Complete' : 'Exporting…' }}
      </span>
    </template>
    <template v-if="state.isActive" #close>
      <!-- hide close while active -->
    </template>

    <template v-if="state.isDone && !state.error">
      <div v-if="state.dstCollectionName" class="dst-name dst-name--done">
        Successfully exported to <strong>{{ state.dstCollectionName }}</strong>
      </div>
      <div v-if="canRoute" class="actions">
        <button type="button" class="action-btn action-btn--secondary" @click="goManage">
          <span class="pi pi-cog" />
          Manage
        </button>
        <button type="button" class="action-btn action-btn--primary" @click="goView">
          <span class="pi pi-external-link" />
          View
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="state.dstCollectionName" class="dst-name">
        to <strong>{{ state.dstCollectionName }}</strong>
      </div>
      <div v-if="!state.error" class="current-step">
        {{ currentStep }}
      </div>
    </template>

    <pre v-if="state.error" class="error-detail">{{ state.error }}</pre>
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

.header-icon--error {
  color: var(--color-text-error);
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.dst-name {
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.dst-name strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.current-step {
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.error-detail {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--color-text-error);
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.4rem;
  margin: 0;
  max-height: 140px;
  overflow: auto;
  white-space: pre-wrap;
}

.dst-name--done {
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}
.dst-name--done strong {
  font-size: 1.05rem;
  color: var(--color-text-bright);
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn--primary {
  color: var(--color-action-blue);
  background: color-mix(in srgb, var(--color-action-blue-dark) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 35%, transparent);
}
.action-btn--primary:hover {
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  color: var(--color-primary-highlight);
}

.action-btn--secondary {
  color: var(--color-text-primary);
  background: transparent;
  border: 1px solid var(--color-border-default);
}
.action-btn--secondary:hover {
  background: var(--color-background-light);
  color: var(--color-text-bright);
}
</style>
