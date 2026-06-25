<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  action: {
    type: String,
    default: null,
  },
  eligibleCount: {
    type: Number,
    default: 0,
  },
  skipLines: {
    type: Array,
    default: () => [],
  },
  isBusy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const verb = computed(() => (props.action === 'accept' ? 'Accept' : 'Submit'))
const pastVerb = computed(() => (props.action === 'accept' ? 'accepted' : 'submitted'))
const header = computed(() => `${verb.value} reviews`)
const totalSkipped = computed(() => props.skipLines.reduce((n, line) => n + line.count, 0))
const canConfirm = computed(() => props.eligibleCount > 0 && !props.isBusy)
const confirmLabel = computed(() =>
  `${verb.value} ${props.eligibleCount} review${props.eligibleCount === 1 ? '' : 's'}`,
)

const dialogPt = {
  root: {
    style: 'background-color: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  },
  header: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid var(--color-background-light);',
  },
  content: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: var(--color-text-dim);',
  },
  title: {
    style: 'font-size: 1.5rem; font-weight: 600;',
  },
}

const cancelBtnPt = {
  root: {
    style: 'border: none; padding: 0.5rem 1.5rem; border-radius: 6px;',
  },
}

const confirmBtnPt = {
  root: ({ context }) => ({
    style: `
      background-color: ${context.disabled ? 'var(--color-background-light)' : 'var(--color-status-success-bg)'};
      border: 1px solid ${context.disabled ? 'var(--color-border-default)' : 'var(--color-status-success-border)'};
      color: ${context.disabled ? 'var(--color-text-dim)' : 'var(--color-status-success-text)'};
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
  }),
}

function onConfirm() {
  if (!canConfirm.value) {
    return
  }
  emit('confirm')
}

function onCancel() {
  visibleModel.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    :header="header"
    :modal="true"
    :style="{ width: '480px' }"
    :pt="dialogPt"
  >
    <div class="bulk-confirm__body">
      <p v-if="eligibleCount > 0" class="bulk-confirm__summary">
        <strong>{{ eligibleCount }}</strong>
        review{{ eligibleCount === 1 ? '' : 's' }} in the current view will be {{ pastVerb }}.
      </p>
      <p v-else class="bulk-confirm__summary">
        No reviews in the current view are ready to {{ verb.toLowerCase() }}.
      </p>
      <p v-if="totalSkipped > 0" class="bulk-confirm__skipped">
        {{ totalSkipped }} skipped:
        <span v-for="(line, i) in skipLines" :key="line.label">
          {{ line.count }} {{ line.label }}{{ i < skipLines.length - 1 ? ', ' : '' }}
        </span>
      </p>
    </div>
    <template #footer>
      <div class="bulk-confirm__footer">
        <Button label="Cancel" :pt="cancelBtnPt" @click="onCancel" />
        <Button :label="confirmLabel" :disabled="!canConfirm" :pt="confirmBtnPt" @click="onConfirm" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.bulk-confirm__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bulk-confirm__summary {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text-primary);
}

.bulk-confirm__skipped {
  margin: 0;
  font-size: 1rem;
  color: var(--color-text-dim);
}

.bulk-confirm__footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}
</style>
