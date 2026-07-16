<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import { computed, ref, watch } from 'vue'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import { dangerBtnPt, importDialogPt, secondaryBtnPt } from '../../../shared/lib/dialogPt.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  // Array of display strings shown in the target list (benchmarkId or "benchmarkId — revisionStr")
  targets: { type: Array, default: () => [] },
  // When true the confirm button is locked until forceChecked
  forceRequired: { type: Boolean, default: false },
  // The sentence shown next to the checkbox when forceRequired is true
  forceMessage: { type: String, default: '' },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const forceChecked = ref(false)

watch(
  () => props.visible,
  (open) => {
    if (open) {
      forceChecked.value = false
    }
  },
)

const confirmEnabled = computed(() => !props.forceRequired || forceChecked.value)
const confirmLabel = computed(() => (props.forceRequired ? 'Forcibly remove' : 'Remove'))
const showList = computed(() => props.targets.length <= 10)

function onConfirm() {
  emit('confirm')
  localVisible.value = false
}

function onCancel() {
  emit('cancel')
  localVisible.value = false
}

const checkboxPt = {
  box: ({ context }) => ({
    style: `background-color: transparent; border-color: var(--color-border-hover); flex-shrink: 0;${context.checked ? ' background-color: var(--color-primary-highlight); border-color: var(--color-primary-highlight);' : ''}`,
  }),
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    header="Confirm Removal"
    modal
    :closable="false"
    :draggable="false"
    :style="{ width: '520px' }"
    :pt="importDialogPt"
  >
    <div class="modal-body">
      <p class="modal-intro">
        The following {{ targets.length === 1 ? 'item' : 'items' }} will be permanently removed from the system:
      </p>

      <div class="target-list">
        <template v-if="showList">
          <div v-for="id in targets" :key="id" class="target-item">
            <img :src="shieldGreenCheck" class="target-item__icon" alt="">
            <span>{{ id }}</span>
          </div>
        </template>
        <div v-else class="target-item">
          <img :src="shieldGreenCheck" class="target-item__icon" alt="">
          <span>{{ targets.length }} selected STIGs</span>
        </div>
      </div>

      <div v-if="forceRequired" class="force-section">
        <div class="force-warning">
          <i class="pi pi-exclamation-triangle force-warning__icon" />
          <span>{{ forceMessage }}</span>
        </div>
        <div class="force-check-row">
          <Checkbox
            v-model="forceChecked"
            input-id="force-confirm-cb"
            :binary="true"
            :pt="checkboxPt"
          />
          <label for="force-confirm-cb" class="force-check-label">
            I understand this will remove the item from all assigned collections
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" @click="onCancel" />
        <Button
          :label="confirmLabel"
          severity="danger"
          :pt="dangerBtnPt"
          :disabled="!confirmEnabled"
          @click="onConfirm"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.25rem 0;
}

.modal-intro {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.target-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
  max-height: 14rem;
  overflow-y: auto;
}

.target-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  color: var(--color-text-primary);
}

.target-item__icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.force-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border: 1px solid var(--color-action-red);
  border-radius: 4px;
  padding: 0.75rem;
  background: color-mix(in srgb, var(--color-action-red) 8%, transparent);
}

.force-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 1.05rem;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.force-warning__icon {
  color: var(--color-action-red);
  font-size: 1.15rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.force-check-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding-top: 0.2rem;
}

.force-check-label {
  font-size: 1rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1.4;
  user-select: none;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
}
</style>
