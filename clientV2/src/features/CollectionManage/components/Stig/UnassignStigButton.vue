<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, ref } from 'vue'

import ActionButton from '../../../../components/common/ActionButton.vue'
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
  <ActionButton
    icon="pi pi-minus-circle icon-red"
    :disabled="disabled || isLoading"
    @click="confirmVisible = true"
  >
    {{ isLoading ? 'Unassigning...' : 'Unassign' }}
  </ActionButton>

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
