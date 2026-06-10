<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, ref } from 'vue'

import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { unassignStig } from '../../api/stigManageApi.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  selectedStigs: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['unassigned'])

const confirmVisible = ref(false)

const stigCount = computed(() => props.selectedStigs.length)

const confirmMessage = computed(() => {
  const noun = stigCount.value === 1 ? 'this STIG' : `these ${stigCount.value} STIGs`
  return `Unassigning ${noun} will remove all related Asset assignments. If the ${stigCount.value === 1 ? 'STIG is' : 'STIGs are'} added in the future, the assignments will need to be established again.`
})

const { isLoading, execute: doUnassign } = useAsyncState(
  () => Promise.all(
    props.selectedStigs.map(s => unassignStig(props.collectionId, s.benchmarkId)),
  ),
  { immediate: false },
)

async function onConfirm() {
  confirmVisible.value = false
  const result = await doUnassign()
  // useAsyncState returns null when an error occurred (already surfaced via global error modal)
  if (result !== null) {
    emit('unassigned')
  }
}
</script>

<template>
  <button
    type="button"
    class="action-btn"
    :class="{ 'is-disabled': disabled || isLoading }"
    :disabled="disabled || isLoading"
    @click="confirmVisible = true"
  >
    <i class="pi pi-minus-circle icon-red" />
    {{ isLoading ? 'Unassigning...' : 'Unassign' }}
  </button>

  <Dialog
    v-model:visible="confirmVisible"
    header="Confirm"
    :modal="true"
    :style="{ width: '450px' }"
  >
    <div class="confirm-content">
      <i class="pi pi-question-circle question-icon" />
      <span>{{ confirmMessage }}</span>
    </div>
    <template #footer>
      <Button label="Yes" icon="pi pi-check" @click="onConfirm" />
      <Button label="No" icon="pi pi-times" text @click="confirmVisible = false" />
    </template>
  </Dialog>
</template>

<style scoped>
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 0.98rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover:not(:disabled):not(.is-disabled) {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.action-btn:disabled,
.action-btn.is-disabled {
  opacity: 0.35;
  cursor: default;
}

.action-btn .icon-red {
  color: var(--color-action-red);
}

.confirm-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.question-icon {
  font-size: 2rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}
</style>
