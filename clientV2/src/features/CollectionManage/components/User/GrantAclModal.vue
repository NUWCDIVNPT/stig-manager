<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import { computed, ref, watch } from 'vue'
import collectionSvg from '../../../../assets/collection.svg'
import labelSvg from '../../../../assets/label.svg'
import shieldSvg from '../../../../assets/shield-green-check.svg'
import targetSvg from '../../../../assets/target.svg'
import AclStateIcon from '../../../../components/common/AclStateIcon.vue'
import LabelChip from '../../../../components/common/Label.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { apiCall } from '../../../../shared/api/apiClient.js'
import { fetchCollectionLabels, fetchCollectionStigs } from '../../../../shared/api/collectionsApi.js'
import { normalizeColor } from '../../../../shared/lib/colorUtils.js'
import { useGrantAcl } from '../../composables/useGrantAcl.js'
import { getAclRuleKey, getAllowedAclAccessOptions, isDuplicateAclRule } from '../../lib/aclRules.js'
import { getGrantDisplay } from '../../lib/grantsUsers.js'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  grant: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['saved'])
const visible = defineModel('visible', { type: Boolean, default: false })

const { defaultAccess, rules, isLoading, isSaving, load, save } = useGrantAcl()

const granteeName = computed(() => getGrantDisplay(props.grant).title)
const accessOptions = computed(() => getAllowedAclAccessOptions(props.grant?.roleId))

// ---- Resource builder ----
// A rule is two independent axes: a scope (whole collection / one asset / one
// label) plus an optional STIG. The old tree encoded these as N×M nested nodes
// and rendered them all at once, which can't scale. Here each axis is its own
// flat, virtualized, filterable Select, so we only ever load N assets + M labels
// + K STIGs — never the product.
const SCOPE_OPTIONS = [
  { label: 'Whole Collection', value: 'collection' },
  { label: 'Asset', value: 'asset' },
  { label: 'Label', value: 'label' },
]

const scope = ref('collection')
const selectedAsset = ref(null)
const selectedLabel = ref(null)
const selectedBenchmarkId = ref(null)

const assets = ref([])
const labels = ref([])
const stigs = ref([])
const assetsLoading = ref(false)
const labelsLoading = ref(false)
const stigsLoading = ref(false)
let assetsLoaded = false
let labelsLoaded = false
let stigsLoaded = false

async function ensureStigs() {
  if (stigsLoaded) {
    return
  }
  stigsLoading.value = true
  try {
    stigs.value = await fetchCollectionStigs(props.collectionId)
    stigsLoaded = true
  }
  finally {
    stigsLoading.value = false
  }
}

async function ensureAssets() {
  if (assetsLoaded) {
    return
  }
  assetsLoading.value = true
  try {
    assets.value = await apiCall('getAssets', { collectionId: props.collectionId })
    assetsLoaded = true
  }
  finally {
    assetsLoading.value = false
  }
}

async function ensureLabels() {
  if (labelsLoaded) {
    return
  }
  labelsLoading.value = true
  try {
    labels.value = await fetchCollectionLabels(props.collectionId)
    labelsLoaded = true
  }
  finally {
    labelsLoading.value = false
  }
}

watch(scope, (value) => {
  selectedAsset.value = null
  selectedLabel.value = null
  if (value === 'asset') {
    ensureAssets()
  }
  else if (value === 'label') {
    ensureLabels()
  }
})

// ---- Add / edit rules ----
const scopeReady = computed(() => {
  if (scope.value === 'asset') {
    return !!selectedAsset.value
  }
  if (scope.value === 'label') {
    return !!selectedLabel.value
  }
  return true
})

function buildRule(access) {
  const rule = {
    benchmarkId: selectedBenchmarkId.value || undefined,
    assetId: undefined,
    assetName: undefined,
    labelId: undefined,
    labelName: undefined,
    label: undefined,
    access,
  }
  if (scope.value === 'asset' && selectedAsset.value) {
    rule.assetId = selectedAsset.value.assetId
    rule.assetName = selectedAsset.value.name
  }
  else if (scope.value === 'label' && selectedLabel.value) {
    const l = selectedLabel.value
    rule.labelId = l.labelId
    rule.labelName = l.name
    rule.label = { labelId: l.labelId, name: l.name, color: l.color }
  }
  // 'collection' scope leaves asset/label selectors undefined
  return rule
}

function addRule(access) {
  if (!scopeReady.value) {
    return
  }
  const rule = buildRule(access)
  if (isDuplicateAclRule(rules.value, rule)) {
    return
  }
  rules.value = [...rules.value, rule]
}

// ---- Add / Remove (picklist-style) ----
const addMenu = ref()
const selectedRules = ref([])
const rulesDt = ref()

// Live preview of the rule the builder will create (access is irrelevant here).
const previewRule = computed(() => (scopeReady.value ? buildRule('r') : null))
const isPreviewDuplicate = computed(() =>
  !!previewRule.value && isDuplicateAclRule(rules.value, previewRule.value))

const canAdd = computed(() => !!previewRule.value && !isPreviewDuplicate.value)

const ACCESS_MENU_LABEL = {
  rw: 'with Read/Write access',
  r: 'with Read Only access',
  none: 'with No access',
}

const addMenuItems = computed(() => accessOptions.value.map(option => ({
  label: ACCESS_MENU_LABEL[option.value],
  icon: 'pi pi-angle-double-right text-green-500',
  command: () => addRule(option.value),
})))

function toggleAddMenu(event) {
  addMenu.value.toggle(event)
}

function removeSelected() {
  if (!selectedRules.value.length) {
    return
  }
  const keys = new Set(selectedRules.value.map(getAclRuleKey))
  rules.value = rules.value.filter(rule => !keys.has(getAclRuleKey(rule)))
  selectedRules.value = []
}

const exportCSV = () => {
  rulesDt.value?.exportCSV()
}

const onFooterAction = (key) => {
  if (key === 'export') {
    exportCSV()
  }
}

// Break a rule into its component resources, each rendered with its own icon
// (or a colored chip for labels), mirroring the old client's renderResource.
function resourceParts(rule) {
  const parts = []
  if (!rule.assetName && !rule.labelName && !rule.benchmarkId) {
    parts.push({ type: 'collection', icon: collectionSvg, text: 'Whole Collection' })
  }
  if (rule.assetName) {
    parts.push({ type: 'asset', icon: targetSvg, text: rule.assetName })
  }
  if (rule.labelName) {
    parts.push({
      type: 'label',
      icon: labelSvg,
      text: rule.labelName,
      color: normalizeColor(rule.label?.color ?? rule.color),
    })
  }
  if (rule.benchmarkId) {
    parts.push({ type: 'stig', icon: shieldSvg, text: rule.benchmarkId })
  }
  return parts
}

const resourceSortValue = rule => resourceParts(rule).map(p => p.text).join(' ')

// ---- Lifecycle ----
function reset() {
  scope.value = 'collection'
  selectedAsset.value = null
  selectedLabel.value = null
  selectedBenchmarkId.value = null
  selectedRules.value = []
  // Drop caches so a reopen (possibly on a different collection) refetches.
  assets.value = []
  labels.value = []
  stigs.value = []
  assetsLoaded = false
  labelsLoaded = false
  stigsLoaded = false
  ensureStigs()
}

watch([visible, () => props.grant?.grantId], ([isOpen, grantId]) => {
  if (isOpen && grantId) {
    reset()
    load(props.collectionId, grantId)
  }
}, { immediate: true })

async function onSave() {
  const ok = await save(props.collectionId, props.grant.grantId)
  if (ok) {
    emit('saved')
    visible.value = false
  }
}

// Compact table styling via PassThrough (no scoped ::v-deep).
const tablePt = {
  root: { style: 'background: var(--p-datatable-row-background);' },
  tableContainer: { style: 'background: var(--p-datatable-row-background);' },
  column: {
    headerCell: { style: 'font-size: 1rem; font-weight: 600;' },
    bodyCell: { style: 'padding: 0.4rem 0.6rem; font-size: 0.9rem;' },
  },
  footer: { style: 'padding: 0; border-top: 1px solid var(--color-border-default); background: transparent;' },
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :pt="{
      root: { style: 'width: 1150px; max-width: 97vw; height: 700px;' },
      content: { style: 'flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden;' },
    }"
  >
    <template #header>
      <div class="modal-title">
        <img :src="targetSvg" alt="Target icon" />
        <div class="title-text">
          <span class="title-main">Access Control List for {{ granteeName }}</span>
          <span class="title-sub">Default access = {{ defaultAccess }}</span>
        </div>
      </div>
    </template>

    <div class="acl-body" :class="{ loading: isLoading }">
      <div class="acl-col resource-col">
        <h4 class="col-header">
          Add a Resource Rule
        </h4>
        <div class="builder">
          <p class="builder-intro">
            Pick what this rule applies to, then <strong>Add</strong> it with an access level.
          </p>

          <div class="field">
            <span class="field-label">Scope</span>
            <SelectButton
              v-model="scope"
              :options="SCOPE_OPTIONS"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              class="scope-buttons"
              :pt="{ button: { style: 'flex: 1;' } }"
            />
          </div>

          <div v-if="scope === 'asset'" class="field">
            <label class="field-label">Asset</label>
            <Select
              v-model="selectedAsset"
              :options="assets"
              :loading="assetsLoading"
              option-label="name"
              data-key="assetId"
              filter
              reset-filter-on-hide
              :virtual-scroller-options="{ itemSize: 38 }"
              placeholder="Select an asset"
              class="builder-input"
              :pt="{ label: { style: 'font-size: 1.15rem;' }, item: { style: 'font-size: 1.15rem;' } }"
            >
              <template #value="{ value, placeholder }">
                <span v-if="value" class="builder-option">
                  <img :src="targetSvg" class="svg-icon">
                  <span>{{ value.name }}</span>
                </span>
                <span v-else class="builder-placeholder">{{ placeholder }}</span>
              </template>
              <template #option="{ option }">
                <span class="builder-option">
                  <img :src="targetSvg" class="svg-icon">
                  <span>{{ option.name }}</span>
                </span>
              </template>
            </Select>
          </div>

          <div v-else-if="scope === 'label'" class="field">
            <label class="field-label">Label</label>
            <Select
              v-model="selectedLabel"
              :options="labels"
              :loading="labelsLoading"
              option-label="name"
              data-key="labelId"
              filter
              reset-filter-on-hide
              :virtual-scroller-options="{ itemSize: 38 }"
              placeholder="Select a label"
              class="builder-input"
              :pt="{ label: { style: 'font-size: 1.15rem;' }, item: { style: 'font-size: 1.15rem;' } }"
            >
              <template #value="{ value, placeholder }">
                <LabelChip v-if="value" :value="value.name" :color="normalizeColor(value.color)" />
                <span v-else class="builder-placeholder">{{ placeholder }}</span>
              </template>
              <template #option="{ option }">
                <LabelChip :value="option.name" :color="normalizeColor(option.color)" />
              </template>
            </Select>
          </div>

          <div class="field">
            <label class="field-label">
              STIG <span class="field-optional">optional</span>
            </label>
            <Select
              v-model="selectedBenchmarkId"
              :options="stigs"
              :loading="stigsLoading"
              option-label="benchmarkId"
              option-value="benchmarkId"
              filter
              show-clear
              reset-filter-on-hide
              :virtual-scroller-options="{ itemSize: 38 }"
              placeholder="Any STIG"
              class="builder-input"
              :pt="{ label: { style: 'font-size: 1.15rem;' }, item: { style: 'font-size: 1.15rem;' } }"
            >
              <template #option="{ option }">
                <span class="builder-option">
                  <img :src="shieldSvg" class="svg-icon">
                  <span>{{ option.benchmarkId }}</span>
                </span>
              </template>
            </Select>
          </div>

          <div class="builder-spacer" />

          <div class="rule-preview">
            <span class="rule-preview-label">Rule preview</span>
            <span v-if="previewRule" class="resource-cell">
              <template v-for="(part, i) in resourceParts(previewRule)" :key="i">
                <span class="resource-piece">
                  <img v-if="part.icon && !part.icon.startsWith('pi')" :src="part.icon" class="svg-icon">
                  <i v-else-if="part.icon" :class="part.icon" />
                  <LabelChip v-if="part.type === 'label'" :value="part.text" :color="part.color" />
                  <span v-else>{{ part.text }}</span>
                </span>
              </template>
            </span>
            <span v-else class="rule-preview-hint">
              {{ scope === 'asset' ? 'Select an asset to continue.' : 'Select a label to continue.' }}
            </span>
            <span v-if="isPreviewDuplicate" class="rule-preview-dupe">
              <i class="pi pi-exclamation-triangle" /> This rule already exists.
            </span>
          </div>
        </div>
      </div>

      <!-- Add / Remove controls -->
      <div class="acl-controls">
        <Button
          label="Add"
          icon="pi pi-angle-down"
          icon-pos="right"
          severity="secondary"
          :disabled="!canAdd"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: '#22c55e' } }) }"
          @click="toggleAddMenu"
        />
        <Menu ref="addMenu" :model="addMenuItems" popup />
        <Button
          label="Remove"
          icon="pi pi-angle-left"
          severity="secondary"
          :disabled="!selectedRules.length"
          class="control-btn"
          :pt="{ icon: ({ context }) => ({ style: context?.disabled ? {} : { color: '#ef4444' } }) }"
          @click="removeSelected"
        />
      </div>

      <!-- Rules table -->
      <div class="acl-col rules-col">
        <h4 class="col-header">
          ACL Rules, default access = {{ defaultAccess }}
        </h4>
        <DataTable
          ref="rulesDt"
          v-model:selection="selectedRules"
          :value="rules"
          :loading="isLoading"
          selection-mode="multiple"
          :meta-key-selection="false"
          size="small"
          scrollable
          scroll-height="flex"
          :sort-field="resourceSortValue"
          :sort-order="1"
          :virtual-scroller-options="{ itemSize: 41, delay: 0 }"
          class="rules-table"
          :pt="tablePt"
        >
          <template #empty>
            No ACL rules.
          </template>
          <Column header="Resource" sortable :sort-field="resourceSortValue" :export-field="resourceSortValue">
            <template #body="{ data }">
              <span class="resource-cell">
                <template v-for="(part, i) in resourceParts(data)" :key="i">
                  <span class="resource-piece">
                    <img v-if="part.icon && !part.icon.startsWith('pi')" :src="part.icon" class="svg-icon">
                    <i v-else-if="part.icon" :class="part.icon" />
                    <LabelChip v-if="part.type === 'label'" :value="part.text" :color="part.color" />
                    <span v-else>{{ part.text }}</span>
                  </span>
                </template>
              </span>
            </template>
          </Column>
          <Column header="Access" field="access" sortable style="width: 140px">
            <template #body="{ data }">
              <Select
                :model-value="data.access"
                :options="accessOptions"
                option-label="label"
                option-value="value"
                class="access-select"
                @update:model-value="value => data.access = value"
                @click.stop
              >
                <template #value>
                  <AclStateIcon :access="data.access" />
                </template>
                <template #option="{ option }">
                  <AclStateIcon :access="option.value" />
                  <span class="access-option-label">{{ option.label }}</span>
                </template>
              </Select>
            </template>
          </Column>
          <template #footer>
            <StatusFooter
              :show-refresh="false"
              :total-count="rules.length"
              total-label="rules"
              @action="onFooterAction"
            />
          </template>
        </DataTable>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text :disabled="isSaving" @click="visible = false" />
      <Button label="Save" icon="pi pi-check" :loading="isSaving" @click="onSave" />
    </template>
  </Dialog>
</template>

<style scoped>
.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-title > img {
  width: 2rem;
  height: 2rem;
}

.title-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.title-main {
  font-weight: 700;
  font-size: 1.6rem;
}

.title-sub {
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.acl-body {
  display: flex;
  gap: 0.75rem;
  flex: 1 1 auto;
  min-height: 0;
}

.acl-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
}

.resource-col {
  flex: 0 0 340px;
}

.acl-controls {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: 1.2rem;
  padding: 0 0.25rem;
}

.control-btn {
  min-width: 7rem;
  padding: 0.6rem 1rem;
  font-size: 1.1rem;
}



.rules-col {
  flex: 1 1 auto;
}

.col-header {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  background: var(--p-datatable-row-background);
  border-bottom: 1px solid var(--color-border-default);
}

.builder {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.25rem;
  overflow-y: auto;
}

.builder-intro {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--color-text-dim);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 400;
  color: #ffffff;
}

.field-optional {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-dim);
}

.scope-buttons {
  display: flex;
  width: 100%;
}

.builder-input {
  width: 100%;
}

.builder-option {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
}

.builder-placeholder {
  color: var(--color-text-dim);
  font-size: 1.15rem;
}

/* Push the live preview to the bottom of the column. */
.builder-spacer {
  flex: 1 1 auto;
  min-height: 0.5rem;
}

.rule-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem 0.9rem;
  border: 1px dashed var(--color-border-default);
  border-radius: 8px;
  background: var(--p-datatable-row-background);
}

.rule-preview-label {
  font-size: 1rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-dim);
}

.rule-preview-hint {
  font-size: 1.25rem;
  font-style: italic;
  color: var(--color-text-dim);
}

.rule-preview-dupe {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.1rem;
  color: #fb923c;
}

.rules-table {
  flex: 1 1 auto;
  min-height: 0;
}

.resource-cell {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resource-piece {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.25rem;
}

.svg-icon {
  width: 1.1em;
  height: 1.1em;
  object-fit: contain;
}

/* Inline access editor: keep it compact and chrome-free so the colored Tag reads as the value. */
.access-select {
  background: transparent;
  border: none;
}

.access-option-label {
  margin-left: 0.5rem;
  color: var(--color-text-dim);
}
</style>
