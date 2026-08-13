<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Popover from 'primevue/popover'
import { ref } from 'vue'
import { primaryBtnPt } from '../../../../../shared/lib/dialogPt.js'

const emit = defineEmits(['save'])

const popoverRef = ref(null)

const options = ref({
  collectionName: true,
  userAndGroupName: true,
  clientId: true,
  envvar: true,
})

const popoverPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; box-shadow: 0 6px 24px rgba(0,0,0,0.6);' },
  content: { style: 'padding: 1rem 1.15rem;' },
}

const checkboxPt = {
  box: ({ context }) => ({
    style: `background-color: transparent; border-color: var(--color-border-hover); ${context.checked ? 'background-color: var(--color-primary-highlight); border-color: var(--color-primary-highlight);' : ''}`,
  }),
}

function toggle(event) {
  popoverRef.value?.toggle(event)
}

function onConfirm() {
  popoverRef.value?.hide()
  emit('save', { ...options.value })
}

defineExpose({ toggle })
</script>

<template>
  <Popover ref="popoverRef" :pt="popoverPt">
    <div class="share-form">
      <div class="share-form-title">
        Save for sharing
      </div>
      <label class="share-option">
        <Checkbox v-model="options.collectionName" binary :pt="checkboxPt" />
        <span>Replace each Collection name with its ID</span>
      </label>
      <label class="share-option">
        <Checkbox v-model="options.userAndGroupName" binary :pt="checkboxPt" />
        <span>Replace each User and Group name with its ID</span>
      </label>
      <label class="share-option">
        <Checkbox v-model="options.clientId" binary :pt="checkboxPt" />
        <span>Replace Request client IDs with generated values</span>
      </label>
      <label class="share-option">
        <Checkbox v-model="options.envvar" binary :pt="checkboxPt" />
        <span>Exclude Node.js environment variables</span>
      </label>
      <div class="share-form-actions">
        <Button
          label="Save for sharing"
          icon="pi pi-share-alt"
          :pt="primaryBtnPt"
          @click="onConfirm"
        />
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.share-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 24rem;
}

.share-form-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.share-option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--color-text-primary);
  font-size: 1.05rem;
  cursor: pointer;
}

.share-form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border-default);
}
</style>
