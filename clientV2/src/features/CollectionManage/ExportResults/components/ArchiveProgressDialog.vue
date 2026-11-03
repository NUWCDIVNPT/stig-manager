<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'

// Renders the state returned by useArchiveProgress()
const props = defineProps({
  archive: { type: Object, required: true },
})

const visible = defineModel('visible', { type: Boolean, default: false })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :closable="!props.archive.progress.active"
    :close-on-escape="!props.archive.progress.active"
    :style="{ width: 'min(560px, 94vw)' }"
    header="Downloading checklists"
  >
    <div class="archive-progress-body">
      <div class="archive-bytes-bar" role="status" aria-live="polite">
        {{ props.archive.fetchedLabel }}
      </div>
      <pre class="archive-log">{{ props.archive.progress.log.join('\n') }}</pre>
    </div>
    <template #footer>
      <div class="archive-progress-footer">
        <Button
          label="Save log..."
          :pt="secondaryBtnPt"
          :disabled="props.archive.progress.log.length === 0"
          @click="props.archive.saveLog"
        />
        <Button
          label="Close"
          :pt="primaryBtnPt"
          :disabled="props.archive.progress.active"
          @click="props.archive.close"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.archive-progress-body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.25rem 0;
}

.archive-bytes-bar {
  font-weight: 600;
  text-align: center;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  color: var(--color-text-bright);
}

.archive-log {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  color: var(--color-text-primary);
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.6rem;
  margin: 0;
  min-height: 220px;
  max-height: 360px;
  overflow: auto;
  white-space: pre-wrap;
}

.archive-progress-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.4rem 0;
}
</style>
