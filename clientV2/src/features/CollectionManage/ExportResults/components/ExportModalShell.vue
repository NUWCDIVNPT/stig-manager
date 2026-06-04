<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import { computed } from 'vue'
import { primaryBtnPt, secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import { useExportModal } from '../composables/useExportModal.js'

/**
 * Shared export-dialog chrome (header, options bar, footer). The variable
 * selection tree is provided via the default slot; everything else is identical
 * across the asset- and STIG-pivot modals and lives here.
 */
const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  /** Pivot-computed export selection shape: [{ assetId, stigs? }]. */
  effectiveSelections: { type: Array, required: true },
  /** localStorage prefs key prefix. */
  prefsKeyPrefix: { type: String, required: true },
  /** Header subtitle, e.g. "Select Assets and STIGs". */
  subtitle: { type: String, default: '' },
  /** When true, disables submission (e.g. tree still loading). */
  busy: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:visible',
  'export-started',
  'collection-export-progress',
  'collection-export-complete',
  'collection-export-error',
  'archive-export-progress',
  'archive-export-complete',
  'archive-export-error',
])

const effectiveSelections = computed(() => props.effectiveSelections)
const busy = computed(() => props.busy)

const {
  localVisible,
  target,
  selectedFormat,
  selectedDestinationId,
  destinationOptions,
  validationMessage,
  canSubmit,
  submitLabel,
  EXPORT_TARGETS,
  EXPORT_FORMATS,
  onSubmit,
} = useExportModal(props, emit, {
  prefsKeyPrefix: props.prefsKeyPrefix,
  effectiveSelections,
  busy,
})

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}

const selectPt = {
  root: { style: 'background: var(--color-background-light); border-color: var(--color-border-default); color: var(--color-text-primary);' },
}

const radioButtonPt = {
  root: { style: 'width: 1.3rem; height: 1.3rem; cursor: pointer;' },
  box: { style: 'width: 1.3rem; height: 1.3rem; cursor: pointer;' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: 'min(480px, 96vw)', height: '72vh', maxHeight: '680px', minHeight: '420px' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-download" />
        </div>
        <div>
          <div class="modal-header-title">
            Export results
          </div>
          <div class="modal-header-sub">
            {{ subtitle }}
          </div>
        </div>
        <div class="badge-legend">
          <span class="legend-label">Badges:</span>
          <span class="badge badge-incomplete">Accepted: &lt; 100%</span>
          <span class="badge badge-complete">Accepted: 100%</span>
        </div>
      </div>
    </template>

    <div class="modal-body">
      <div class="tree-pane">
        <slot />
      </div>

      <div class="options-bar">
        <div v-if="validationMessage" class="validation-warning">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ validationMessage }}</span>
        </div>
        <div class="options-row">
          <span class="opt-label">Export to:</span>
          <div class="radio-group">
            <div v-for="opt in EXPORT_TARGETS" :key="opt.value" class="radio-option">
              <RadioButton v-model="target" :value="opt.value" :input-id="`target-${opt.value}`" :pt="radioButtonPt" />
              <label :for="`target-${opt.value}`">{{ opt.label }}</label>
            </div>
          </div>
        </div>

        <div v-if="target === 'archive'" class="options-row">
          <span class="opt-label">Format:</span>
          <Select
            v-model="selectedFormat"
            :options="EXPORT_FORMATS"
            option-label="label"
            class="opt-select"
            :pt="selectPt"
          />
        </div>

        <div v-if="target === 'collection'" class="options-row">
          <span class="opt-label">Destination:</span>
          <Select
            v-model="selectedDestinationId"
            :options="destinationOptions"
            option-label="label"
            option-value="value"
            placeholder="Choose collection..."
            empty-message="No accessible destination collections"
            class="opt-select"
            :pt="selectPt"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" @click="localVisible = false" />
        <Button
          :label="submitLabel"
          :pt="primaryBtnPt"
          :disabled="!canSubmit"
          @click="onSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.modal-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-blue-dark);
  flex-shrink: 0;
}

.modal-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  line-height: 1.25;
}

.modal-header-sub {
  font-size: 1.025rem;
  color: var(--color-text-dim);
  margin-top: 2px;
}

.badge-legend {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.legend-label {
  color: var(--color-text-dim);
  margin-right: 0.1rem;
}

/* ── Body: tree fills top, options bar pinned to bottom ── */
.modal-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tree-pane {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Options bar ── */
.options-bar {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border-default);
  padding: 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.options-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.opt-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  min-width: 6rem;
}

.opt-select {
  flex: 1;
}

.radio-group {
  display: flex;
  gap: 1.25rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.radio-option label {
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-primary);
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.65rem 1rem;
  justify-content: flex-end;
}

/* ── Badges (header legend) ── */
.badge {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 3px;
  font-style: italic;
  min-width: 38px;
  text-align: center;
  flex-shrink: 0;
}

.badge-complete {
  background-color: var(--metrics-status-chart-accepted);
  color: var(--color-text-bright);
}

.badge-incomplete {
  background-color: var(--metrics-status-chart-unassessed);
  color: var(--color-text-bright);
}

/* ── Validation warning ── */
.validation-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: color-mix(in srgb, var(--color-warning-yellow) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning-yellow) 35%, transparent);
  border-radius: 4px;
  font-size: 1rem;
  color: var(--color-warning-yellow);
}

.validation-warning .pi {
  flex-shrink: 0;
  font-size: 0.9rem;
}
</style>
