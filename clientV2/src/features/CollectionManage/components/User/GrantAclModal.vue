<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Tree from 'primevue/tree'
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
import { fetchAssetWithStigs } from '../../api/assetManageApi.js'
import { fetchAssetsByCollectionStig } from '../../api/stigManageApi.js'
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

// Resource selector kinds that can become an ACL rule (category roots cannot).
const SELECTOR_KINDS = new Set(['collection', 'stig', 'asset', 'assetStig', 'label', 'labelStig'])

const granteeName = computed(() => getGrantDisplay(props.grant).title)
const accessOptions = computed(() => getAllowedAclAccessOptions(props.grant?.roleId))

// ---- Resource browser (lazy tree) ----
const treeNodes = ref([])
const selectionKeys = ref({})
const selectedNode = ref(null)

function makeNode(key, label, data, { leaf = false, icon, selectable = true } = {}) {
  return {
    key,
    label,
    data,
    icon,
    leaf,
    selectable,
    loading: false,
    loaded: false,
    children: leaf ? undefined : [],
  }
}

function buildRootNodes() {
  return [
    makeNode('collection', 'Whole Collection', { kind: 'collection' }, { leaf: true, icon: collectionSvg }),
    makeNode('stigs-root', 'STIGs', { kind: 'stigs-root' }, { icon: shieldSvg, selectable: false }),
    makeNode('assets-root', 'Assets', { kind: 'assets-root' }, { icon: targetSvg, selectable: false }),
    makeNode('labels-root', 'Labels', { kind: 'labels-root' }, { icon: labelSvg, selectable: false }),
  ]
}

async function loadChildren(node) {
  const { collectionId } = props
  const d = node.data
  switch (d.kind) {
    case 'stigs-root': {
      const stigs = await fetchCollectionStigs(collectionId)
      return stigs.map(s => makeNode(
        `stig:${s.benchmarkId}`,
        s.benchmarkId,
        { kind: 'stig', benchmarkId: s.benchmarkId },
        { icon: shieldSvg },
      ))
    }
    case 'assets-root': {
      const assets = await apiCall('getAssets', { collectionId })
      return assets.map(a => makeNode(
        `asset:${a.assetId}`,
        a.name,
        { kind: 'asset', assetId: a.assetId, assetName: a.name },
        { icon: targetSvg },
      ))
    }
    case 'labels-root': {
      const labels = await fetchCollectionLabels(collectionId)
      return labels.map(l => makeNode(
        `label:${l.labelId}`,
        l.name,
        { kind: 'label', labelId: l.labelId, labelName: l.name, color: l.color },
        { icon: labelSvg },
      ))
    }
    case 'stig': {
      const assets = await fetchAssetsByCollectionStig(collectionId, d.benchmarkId)
      return assets.map(a => makeNode(
        `stig:${d.benchmarkId}|asset:${a.assetId}`,
        a.name,
        { kind: 'assetStig', assetId: a.assetId, assetName: a.name, benchmarkId: d.benchmarkId },
        { leaf: true, icon: targetSvg },
      ))
    }
    case 'asset': {
      const asset = await fetchAssetWithStigs(d.assetId)
      return (asset.stigs ?? []).map(s => makeNode(
        `asset:${d.assetId}|stig:${s.benchmarkId}`,
        s.benchmarkId,
        { kind: 'assetStig', assetId: d.assetId, assetName: d.assetName, benchmarkId: s.benchmarkId },
        { leaf: true, icon: shieldSvg },
      ))
    }
    case 'label': {
      const assets = await apiCall('getAssets', { collectionId, labelId: d.labelId, projection: 'stigs' })
      const seen = new Map()
      for (const a of assets) {
        for (const s of (a.stigs ?? [])) {
          if (!seen.has(s.benchmarkId)) {
            seen.set(s.benchmarkId, s)
          }
        }
      }
      return [...seen.values()].map(s => makeNode(
        `label:${d.labelId}|stig:${s.benchmarkId}`,
        s.benchmarkId,
        { kind: 'labelStig', labelId: d.labelId, labelName: d.labelName, color: d.color, benchmarkId: s.benchmarkId },
        { leaf: true, icon: shieldSvg },
      ))
    }
    default:
      return []
  }
}

async function onNodeExpand(node) {
  if (node.loaded || node.leaf) {
    return
  }
  node.loading = true
  try {
    node.children = await loadChildren(node)
    node.loaded = true
  }
  finally {
    node.loading = false
  }
}

function onNodeSelect(node) {
  selectedNode.value = SELECTOR_KINDS.has(node.data?.kind) ? node : null
}

// ---- Add / edit rules ----
function buildRuleFromNode(node, access) {
  const d = node.data
  const rule = {
    benchmarkId: undefined,
    assetId: undefined,
    assetName: undefined,
    labelId: undefined,
    labelName: undefined,
    label: undefined,
    access,
  }
  switch (d.kind) {
    case 'stig':
      rule.benchmarkId = d.benchmarkId
      break
    case 'asset':
      rule.assetId = d.assetId
      rule.assetName = d.assetName
      break
    case 'assetStig':
      rule.assetId = d.assetId
      rule.assetName = d.assetName
      rule.benchmarkId = d.benchmarkId
      break
    case 'label':
      rule.labelId = d.labelId
      rule.labelName = d.labelName
      rule.label = { labelId: d.labelId, name: d.labelName, color: d.color }
      break
    case 'labelStig':
      rule.labelId = d.labelId
      rule.labelName = d.labelName
      rule.label = { labelId: d.labelId, name: d.labelName, color: d.color }
      rule.benchmarkId = d.benchmarkId
      break
    // 'collection' leaves all selectors undefined
  }
  return rule
}

function addRule(access) {
  if (!selectedNode.value) {
    return
  }
  const rule = buildRuleFromNode(selectedNode.value, access)
  if (isDuplicateAclRule(rules.value, rule)) {
    return
  }
  rules.value = [...rules.value, rule]
}

// ---- Add / Remove (picklist-style) ----
const addMenu = ref()
const selectedRules = ref([])
const rulesDt = ref()

const canAdd = computed(() => {
  if (!selectedNode.value) {
    return false
  }
  const candidate = buildRuleFromNode(selectedNode.value, 'r')
  return !isDuplicateAclRule(rules.value, candidate)
})

const ACCESS_MENU_LABEL = {
  rw: 'with Read/Write access',
  r: 'with Read Only access',
  none: 'with No access',
}

const addMenuItems = computed(() => accessOptions.value.map(option => ({
  label: ACCESS_MENU_LABEL[option.value],
  icon: 'pi pi-angle-double-right',
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

// Severity used by the colored access Tag (matches EffectiveAclModal).
const accessSeverity = (access) => {
  if (access === 'rw') {
    return 'success'
  }
  if (access === 'r') {
    return 'info'
  }
  return 'secondary'
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

const resourceSortValue = (rule) => resourceParts(rule).map(p => p.text).join(' ')

// ---- Lifecycle ----
function reset() {
  treeNodes.value = buildRootNodes()
  selectionKeys.value = {}
  selectedNode.value = null
  selectedRules.value = []
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
        <i class="pi pi-bullseye" />
        <div class="title-text">
          <span class="title-main">Access Control List for {{ granteeName }}</span>
          <span class="title-sub">Default access = {{ defaultAccess }}</span>
        </div>
      </div>
    </template>

    <div class="acl-body" :class="{ loading: isLoading }">
      <!-- Resource browser -->
      <div class="acl-col resource-col">
        <h4 class="col-header">
          Collection Resources
        </h4>
        <Tree
          v-model:selection-keys="selectionKeys"
          :value="treeNodes"
          selection-mode="single"
          :pt="{ root: { style: 'flex:1 1 auto; min-height:0; overflow:auto; padding:0;' } }"
          @node-expand="onNodeExpand"
          @node-select="onNodeSelect"
        >
          <template #default="{ node }">
            <span class="tree-node">
              <i v-if="node.loading" class="pi pi-spin pi-spinner" />
              <img v-else-if="node.icon && !node.icon.startsWith('pi')" :src="node.icon" class="svg-icon" />
              <i v-else-if="node.icon" :class="node.icon" />
              <LabelChip
                v-if="node.data?.kind === 'label'"
                :value="node.data.labelName"
                :color="normalizeColor(node.data.color)"
              />
              <span v-else>{{ node.label }}</span>
            </span>
          </template>
        </Tree>
      </div>

      <!-- Add / Remove controls -->
      <div class="acl-controls">
        <Button
          label="Add"
          icon="pi pi-angle-down"
          icon-pos="right"
          severity="secondary"
          :disabled="!canAdd"
          class="control-btn add-btn"
          @click="toggleAddMenu"
        />
        <Menu ref="addMenu" :model="addMenuItems" popup />
        <Button
          label="Remove"
          icon="pi pi-angle-left"
          severity="secondary"
          :disabled="!selectedRules.length"
          class="control-btn remove-btn"
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
                    <img v-if="part.icon && !part.icon.startsWith('pi')" :src="part.icon" class="svg-icon" />
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
              total-icon="pi pi-bullseye"
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

.modal-title > i {
  font-size: 2rem;
  color: var(--color-text-dim);
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
}

.add-btn:not(:disabled) :deep(.p-button-icon) {
  color: #22c55e;
}

.remove-btn:not(:disabled) :deep(.p-button-icon) {
  color: #ef4444;
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

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
