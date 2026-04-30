<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Tooltip from 'primevue/tooltip'
import { computed, ref, watch } from 'vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import { resultOptions } from '../../../shared/lib/reviewFormUtils.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  fieldSettings: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const vTooltip = Tooltip

const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const result = ref(null)
const detail = ref('')
const comment = ref('')

watch(() => [props.visible, props.rows], ([v, newRows]) => {
  if (v) {
    let commonResult = null
    let allSame = true
    if (newRows && newRows.length > 0) {
      commonResult = newRows[0].result
      for (const row of newRows) {
        if (row.result !== commonResult) {
          allSame = false
          break
        }
      }
    }
    result.value = allSame ? commonResult : null
    detail.value = ''
    comment.value = ''
  }
}, { immediate: true })

const commonInitialResult = computed(() => {
  if (!props.rows || props.rows.length === 0) { return null }
  const firstResult = props.rows[0].result
  return props.rows.every(r => r.result === firstResult) ? firstResult : null
})

const detailEnabled = computed(() => props.fieldSettings?.detail?.enabled !== 'never')
const commentEnabled = computed(() => props.fieldSettings?.comment?.enabled !== 'never')

const isMeaningfulChange = computed(() => {
  const resultChanged = result.value && result.value !== commonInitialResult.value
  const detailChanged = (detail.value || '').trim().length > 0
  const commentChanged = (comment.value || '').trim().length > 0
  return resultChanged || detailChanged || commentChanged
})

const tooltipOpts = { escape: false, autoHide: false, hideDelay: 300, pt: { root: { style: { maxWidth: '40rem' } } } }

const resultTooltipHtml = '<b>Result</b><br>The result of an evaluation of a STIG ruleId.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;STATUS&gt;<br><b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;result&gt;'

function getFieldTooltipHtml(title, desc, fs, ckl, xccdf) {
  const enabledText = fs?.enabled === 'findings' ? 'for findings only.' : 'for any result.'
  let requiredText = 'optional.'
  if (fs?.required === 'always') {
    requiredText = 'required to submit a review.'
  }
  else if (fs?.required === 'findings') {
    requiredText = 'required to submit a finding.'
  }

  return `<b>${title}</b><br>${desc}<br><br><b>Collection Settings</b><br>This field is enabled ${enabledText}<br>Content in this field is ${requiredText}<br><br><b>Export Mappings</b><br><b>CKL:</b> ${ckl}<br><b>XCCDF:</b> ${xccdf}`
}

const detailTooltipHtml = computed(() => getFieldTooltipHtml(
  'Detail',
  'A description of how the evaluator or evaluation tool determined the result.',
  props.fieldSettings?.detail,
  '&lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;FINDING_DETAILS&gt;',
  '&lt;TestResult&gt;&lt;rule-result&gt;&lt;check&gt;&lt;check-content&gt;&lt;sm:detail&gt;',
))

const commentTooltipHtml = computed(() => getFieldTooltipHtml(
  'Comment',
  'Additional comment by the evaluator or evaluation tool.',
  props.fieldSettings?.comment,
  '&lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;',
  '&lt;TestResult&gt;&lt;rule-result&gt;&lt;check&gt;&lt;check-content&gt;&lt;sm:comment&gt;',
))

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

const dropdownPt = {
  root: {
    style: 'background-color: var(--color-background-darkest); border-color: var(--color-border-default); color: var(--color-text-primary);',
  },
  itemGroup: { style: 'background-color: var(--color-background-darkest);' },
  item: { style: 'background-color: var(--color-background-darkest); color: var(--color-text-primary);' },
  list: { style: 'background-color: var(--color-background-darkest);' },
  panel: { style: 'background-color: var(--color-background-darkest); border: 1px solid var(--color-border-default); color: var(--color-text-primary);' },
  clearIcon: { style: 'color: var(--color-text-dim);' },
}

const textareaPt = {
  root: ({ context }) => ({
    style: `
      background-color: ${context.disabled ? 'color-mix(in srgb, var(--color-background-light) 30%, transparent)' : 'var(--color-background-darkest)'};
      border-color: var(--color-border-default);
      color: var(--color-text-primary);
      padding: 0.75rem;
      opacity: ${context.disabled ? '0.7' : '1'};
    `,
  }),
}

const cancelBtnPt = {
  root: {
    style: `border: none; padding: 0.5rem 1.5rem; border-radius: 6px;`,
  },
}

const confirmBtnPt = {
  root: ({ context }) => ({
    style: `
    
      border: 1px solid ${context.disabled ? 'var(--color-border-default)' : '#2563eb'};
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
  }),
}

function onConfirm() {
  if (!isMeaningfulChange.value) {
    return
  }

  const payload = {}
  if (result.value) {
    payload.result = result.value
  }
  if (detail.value.trim().length > 0) {
    payload.detail = detail.value.trim()
  }
  if (comment.value.trim().length > 0) {
    payload.comment = comment.value.trim()
  }

  emit('confirm', payload)
  visibleModel.value = false
}

function onCancel() {
  emit('cancel')
  visibleModel.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    :header="`Batch Edit (${rows.length} item${rows.length === 1 ? '' : 's'})`"
    :modal="true"
    :style="{ width: '600px' }"
    :pt="dialogPt"
  >
    <div class="batch-modal__body">
      <div class="batch-modal__field">
        <label class="batch-modal__label">
          Result
          <i v-tooltip="{ value: resultTooltipHtml, ...tooltipOpts }" class="pi pi-question-circle batch-modal__help-icon" />
        </label>
        <Dropdown
          v-model="result"
          :options="resultOptions"
          option-label="label"
          option-value="value"
          placeholder="Leave Unchanged"
          show-clear
          class="batch-modal__dropdown"
          :pt="dropdownPt"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="batch-modal__dropdown-item">
              <ResultBadge :status="resultOptions.find(o => o.value === slotProps.value)?.display" />
              <span>{{ resultOptions.find(o => o.value === slotProps.value)?.label }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
          <template #option="slotProps">
            <div class="batch-modal__dropdown-item">
              <ResultBadge :status="slotProps.option.display" />
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
        </Dropdown>
      </div>

      <div class="batch-modal__field">
        <label class="batch-modal__label">
          Detail
          <i v-tooltip="{ value: detailTooltipHtml, ...tooltipOpts }" class="pi pi-question-circle batch-modal__help-icon" />
          <span v-if="!detailEnabled" class="batch-modal__muted">(disabled for selected result)</span>
        </label>
        <Textarea
          v-model="detail"
          rows="8"
          auto-resize
          placeholder="Leave blank to keep existing details unchanged."
          class="batch-modal__textarea"
          :disabled="!detailEnabled"
          :pt="textareaPt"
        />
      </div>

      <div class="batch-modal__field">
        <label class="batch-modal__label">
          Comment
          <i v-tooltip="{ value: commentTooltipHtml, ...tooltipOpts }" class="pi pi-question-circle batch-modal__help-icon" />
          <span v-if="!commentEnabled" class="batch-modal__muted">(disabled for selected result)</span>
        </label>
        <Textarea
          v-model="comment"
          rows="6"
          auto-resize
          placeholder="Leave blank to keep existing comments unchanged."
          class="batch-modal__textarea"
          :disabled="!commentEnabled"
          :pt="textareaPt"
        />
      </div>
    </div>
    <template #footer>
      <div class="batch-modal__footer">
        <Button
          label="Cancel"
          :pt="cancelBtnPt"
          @click="onCancel"
        />
        <Button
          label="Apply Changes"
          icon="pi pi-check"
          :disabled="!isMeaningfulChange"
          :pt="confirmBtnPt"
          @click="onConfirm"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.batch-modal__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.batch-modal__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.batch-modal__label {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.batch-modal__help-icon {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  margin-left: 0.4rem;
  cursor: pointer;
}

.batch-modal__muted {
  font-weight: 400;
  font-size: 0.9rem;
  color: var(--color-text-dim);
  margin-left: 0.35rem;
}

.batch-modal__dropdown {
  width: 100%;
}

.batch-modal__dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.batch-modal__dropdown-item :deep(.status-badge) {
  width: 2.5rem;
  justify-content: center;
  flex-shrink: 0;
}

.batch-modal__textarea {
  width: 100%;
  resize: vertical;
}

.batch-modal__footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}
</style>
