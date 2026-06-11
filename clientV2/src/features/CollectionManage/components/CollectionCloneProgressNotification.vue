<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import NotificationCard from '../../../components/global/NotificationCard.vue'

const props = defineProps({
  state: { type: Object, required: true },
})

const emit = defineEmits(['dismiss'])

const router = useRouter()

function fmt(n) {
  return Number(n ?? 0).toLocaleString()
}

const lastStage = computed(() => {
  for (let i = props.state.stages.length - 1; i >= 0; i--) {
    const ev = props.state.stages[i]
    if (ev && typeof ev === 'object') {
      return ev
    }
  }
  return null
})

const currentStep = computed(() => {
  if (props.state.error) {
    return 'Clone failed'
  }
  if (props.state.isDone) {
    return 'Clone finished'
  }
  const ev = lastStage.value
  if (!ev) {
    return 'Sending request'
  }
  if (ev.stage === 'reviews') {
    if (ev.stepName === 'cloneReviews' && ev.reviewsTotal != null) {
      return `Cloning reviews (${fmt(ev.reviewsCopied)} of ${fmt(ev.reviewsTotal)})`
    }
    return 'Preparing to clone reviews…'
  }
  if (ev.stage === 'collection') {
    return ev.message || 'Creating collection'
  }
  if (ev.stage === 'result') {
    return 'Clone finished'
  }
  return ev.message || 'Working…'
})

// Legacy-compatible percentage:
//   collection stage -> (step - 1) / stepCount  (shows start of current step)
//   reviews copy step -> reviewsCopied / reviewsTotal
//   reviews preparation -> full bar
const progressPct = computed(() => {
  if (props.state.isDone && !props.state.error) {
    return 100
  }
  const ev = lastStage.value
  if (!ev) {
    return 0
  }
  if (ev.stage === 'reviews') {
    if (ev.stepName === 'cloneReviews' && ev.reviewsTotal) {
      return Math.round((ev.reviewsCopied / ev.reviewsTotal) * 100)
    }
    return 100
  }
  if (ev.stage === 'collection' && ev.stepCount) {
    return Math.round(((ev.step - 1) / ev.stepCount) * 100)
  }
  return 0
})

const canRoute = computed(() => !!props.state.dstCollectionId)

function dismissSelf() {
  emit('dismiss')
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
        {{ state.error ? 'Clone Failed' : state.isDone ? 'Clone Complete' : 'Cloning…' }}
      </span>
    </template>
    <template v-if="state.isActive" #close />

    <template v-if="state.isDone && !state.error">
      <div v-if="state.dstCollectionName" class="dst-name dst-name--done">
        Created <strong>{{ state.dstCollectionName }}</strong>
      </div>
      <div v-if="canRoute" class="actions">
        <button type="button" class="action-btn action-btn--secondary" @click="goManage">
          <span class="pi pi-cog" />
          Manage
        </button>
        <button type="button" class="action-btn action-btn--primary" @click="goView">
          <span class="pi pi-external-link" />
          Go to Collection
        </button>
      </div>
    </template>

    <template v-else>
      <div v-if="state.dstCollectionName" class="dst-name">
        <strong>{{ state.dstCollectionName }}</strong>
      </div>
      <template v-if="!state.error">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPct}%` }" />
        </div>
        <div class="current-step">
          {{ currentStep }}
        </div>
      </template>
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

.dst-name--done {
  font-size: 0.95rem;
  line-height: 1.4;
  margin-bottom: 0.25rem;
}
.dst-name--done strong {
  font-size: 1.05rem;
  color: var(--color-text-bright);
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
