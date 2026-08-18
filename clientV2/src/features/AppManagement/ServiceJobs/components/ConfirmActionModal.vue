<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed } from 'vue'
import { dangerBtnPt, primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'

// Themed confirmation dialog for the Service Jobs feature. Matches
// JobPropertiesModal's header-icon look and takes a semantic icon/tone so
// benign actions (Run Now) don't wear a destructive red warning triangle.
const props = defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: 'Confirm' },
  message: { type: String, default: '' },
  icon: { type: String, default: 'pi pi-question-circle' },
  confirmLabel: { type: String, default: 'Confirm' },
  confirmIcon: { type: String, default: 'pi pi-check' },
  // 'primary' (blue) or 'danger' (red) — drives the icon accent and confirm button.
  tone: { type: String, default: 'primary' },
})

const emit = defineEmits(['update:visible', 'confirm'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const isDanger = computed(() => props.tone === 'danger')
const confirmBtnPt = computed(() => (isDanger.value ? dangerBtnPt : primaryBtnPt))
const confirmSeverity = computed(() => (isDanger.value ? 'danger' : 'primary'))

function close() {
  emit('update:visible', false)
}

function onConfirm() {
  emit('confirm')
  emit('update:visible', false)
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default);' },
  content: { style: 'background: var(--color-background-dark); padding: 0;' },
  footer: { style: 'padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: '460px', maxWidth: '95vw' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="confirm-header">
        <div class="confirm-icon" :class="`confirm-icon--${tone}`">
          <i :class="icon" />
        </div>
        <div class="confirm-title">
          {{ title }}
        </div>
      </div>
    </template>

    <div class="confirm-body">
      {{ message }}
    </div>

    <template #footer>
      <div class="confirm-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" @click="close" />
        <Button :label="confirmLabel" :icon="confirmIcon" :severity="confirmSeverity" :pt="confirmBtnPt" @click="onConfirm" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.confirm-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.confirm-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.confirm-icon--primary {
  color: var(--color-action-blue-dark);
  background: color-mix(in srgb, var(--color-action-blue-dark) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
}

.confirm-icon--danger {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 40%, transparent);
}

.confirm-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.confirm-body {
  padding: 1.25rem 1.25rem 1.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--color-text-primary);
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
}
</style>
