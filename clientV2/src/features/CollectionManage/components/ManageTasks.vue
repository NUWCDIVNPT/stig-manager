<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Toolbar from 'primevue/toolbar'
import { computed, ref, watch } from 'vue'
import DeleteModal from '../../../components/common/DeleteModal.vue'
import LabelChip from '../../../components/common/Label.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'
import { fetchReviewAgingConfig, fetchTasks, saveReviewAgingConfig } from '../api/tasksManageApi.js'
import { collectionSelectPt } from './pt.js'
import {
  rulesToPutPayload,
  ruleSummary,
  ruleTargetLines,
  ruleTitle,
} from './reviewAgingLogic.js'
import collectionIcon from '../../../assets/collection.svg'
import shieldGreenCheckIcon from '../../../assets/shield-green-check.svg'
import targetIcon from '../../../assets/target.svg'
import ReviewAgingRuleEditModal from './ReviewAgingRuleEditModal.vue'
import TaskOutput from './TaskOutput.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const iconMap = {
  collection: collectionIcon,
  asset: targetIcon,
  stig: shieldGreenCheckIcon,
}

const { triggerError } = useGlobalError()

// Format a task's first schedule event into a human-readable summary,
// e.g. "Every 1 day (disabled)" or "Not scheduled".
const formatSchedule = (events) => {
  const event = events?.[0]
  if (!event) {
    return 'Not scheduled'
  }
  const status = event.enabled ? 'enabled' : 'disabled'
  if (event.type === 'recurring') {
    const { field, value } = event.interval
    const unit = Number(value) === 1 ? field : `${field}s`
    return `Every ${value} ${unit} (${status})`
  }
  return `Once at ${event.starts} (${status})`
}

const { state: tasks, isLoading: tasksLoading } = useAsyncState(
  () => fetchTasks(),
  { initialState: [] },
)

const taskOptions = computed(() => tasks.value.map(task => ({
  label: task.name,
  value: task.taskId,
})))

const selectedTask = ref(null)

// Default to the first task once the list loads.
watch(taskOptions, (options) => {
  if (!selectedTask.value && options.length > 0) {
    selectedTask.value = options[0].value
  }
}, { immediate: true })

// The selected JobTask. Drives the meta display and the output modal (which
// derives the output endpoint's taskName from task.name).
const activeTask = computed(() => tasks.value.find(t => t.taskId === selectedTask.value))

// Review Aging rules for this collection. Each rule carries a UI-only client
// `_clientId` for stable DataTable keys plus the persisted rule fields.
const {
  state: rules,
  isLoading: rulesLoading,
  execute: loadRules,
} = useAsyncState(
  async () => {
    const config = await fetchReviewAgingConfig(props.collectionId)
    return config.map((rule, i) => ({ _clientId: `${i}-${Date.now()}`, ...rule }))
  },
  { initialState: [] },
)

watch(() => props.collectionId, () => loadRules())

// Persist the full rule array (the API replaces all rules on every save), then
// reload so the grid shows the server's canonical rules (with display-rich
// targets). On failure the displayed rules are left untouched.
async function persistRules(next) {
  try {
    await saveReviewAgingConfig(props.collectionId, rulesToPutPayload(next))
    await loadRules()
  }
  catch (err) {
    triggerError(err)
  }
}

const ruleModalVisible = ref(false)
const editingRule = ref(null)
const editingIndex = ref(-1)

const openNewRule = () => {
  editingRule.value = null
  editingIndex.value = -1
  ruleModalVisible.value = true
}

const openEditRule = (rule) => {
  editingRule.value = rule
  editingIndex.value = rules.value.indexOf(rule)
  ruleModalVisible.value = true
}

// Reorder by moving a rule by delta (-1 up / +1 down) in the local array and
// persisting the whole config; the server derives each rule's ordinal from its
// array index. No-op when the move would fall outside the array bounds.
const moveRule = (rule, delta) => {
  const index = rules.value.indexOf(rule)
  const target = index + delta
  if (index < 0 || target < 0 || target >= rules.value.length) {
    return
  }
  const next = [...rules.value]
  next.splice(index, 1)
  next.splice(target, 0, rule)
  persistRules(next)
}

const onRuleSaved = (rule) => {
  const next = [...rules.value]
  if (editingIndex.value >= 0) {
    next.splice(editingIndex.value, 1, rule)
  }
  else {
    next.push(rule)
  }
  persistRules(next)
}

const showDeleteModal = ref(false)
const ruleToDelete = ref(null)

const deleteMessage = computed(() =>
  `Delete the rule "${ruleToDelete.value?.title || 'Untitled'}"? This action cannot be undone.`,
)

const confirmDeleteRule = (rule) => {
  ruleToDelete.value = rule
  showDeleteModal.value = true
}

// DeleteModal closes itself on confirm; we just perform the removal.
const performDeleteRule = async () => {
  const rule = ruleToDelete.value
  if (!rule) {
    return
  }
  await persistRules(rules.value.filter(r => r !== rule))
  ruleToDelete.value = null
}

const taskOutputVisible = ref(false)

const showTaskOutput = () => {
  taskOutputVisible.value = true
}

const tablePt = {
  root: { style: 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;' },
  wrapper: { style: 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;' },
  tbody: { style: 'background-color: var(--color-background-dark);' },
  footer: { style: 'padding: 0; border: none;' },
}

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="manage-tasks">
    <div class="action-section">
      <div class="action-header">
        <div class="action-title-row">
          <i class="pi pi-cog action-icon" />
          <h3>Tasks</h3>
        </div>
        <p class="group-desc">
          Configure scheduled tasks that run against this collection.
        </p>
      </div>

      <div v-if="tasksLoading" class="loading-state">
        <i class="pi pi-spin pi-spinner" /> Loading tasks...
      </div>
      <div v-else-if="taskOptions.length === 0" class="action-form">
        <p class="rules-empty">
          No configurable tasks are available.
        </p>
      </div>
      <div v-else class="action-form">
        <div class="dropdown-field">
          <label class="flabel" for="taskSelect">Task</label>
          <Select
            id="taskSelect"
            v-model="selectedTask"
            :options="taskOptions"
            option-label="label"
            option-value="value"
            :pt="collectionSelectPt"
            class="w-full"
          />
        </div>

        <div class="task-meta">
          <div class="task-meta-row">
            <span class="task-meta-label">Description:</span>
            <span class="task-meta-value">{{ activeTask?.description }}</span>
          </div>
          <div class="task-meta-row">
            <span class="task-meta-label">Schedule:</span>
            <span class="task-meta-value">{{ formatSchedule(activeTask?.events) }}</span>
          </div>
        </div>

        <div class="task-toolbar">
          <button class="action-btn action-btn--filled" @click="showTaskOutput">
            <i class="pi pi-list icon-blue" /> Task Output...
          </button>
        </div>

        <div class="rules-panel">
          <Toolbar class="rules-toolbar">
            <template #start>
              <button class="action-btn" @click="openNewRule">
                <i class="pi pi-plus-circle icon-green" /> New Rule
              </button>
            </template>
          </Toolbar>

          <DataTable
            :value="rules"
            data-key="_clientId"
            :loading="rulesLoading"
            scrollable
            scroll-height="flex"
            class="rules-table"
            :pt="tablePt"
            @row-dblclick="openEditRule($event.data)"
          >
            <Column header="Rule" :pt="borderPt">
              <template #body="{ data }">
                <div class="rule-cell">
                  <div class="rule-title-line">
                    <Tag
                      :value="data.enabled ? 'Enabled' : 'Disabled'"
                      :severity="data.enabled ? 'success' : 'secondary'"
                      rounded
                    />
                    <span class="rule-title">{{ ruleTitle(data) }}</span>
                  </div>

                  <div class="rule-targets">
                    <span v-for="(line, i) in ruleTargetLines(data)" :key="i" class="rule-target">
                      <LabelChip
                        v-if="line.type === 'label'"
                        :value="line.label.name"
                        :color="normalizeColor(line.label.color, '#cccccc')"
                      />
                      <template v-else>
                        <img
                          v-if="iconMap[line.type]"
                          :src="iconMap[line.type]"
                          class="rule-target-svg"
                          alt=""
                        />
                        <i v-else class="pi rule-target-icon" :class="line.icon" />
                        <span>{{ line.text }}</span>
                      </template>
                    </span>
                  </div>

                  <div class="rule-summary">
                    {{ ruleSummary(data) }}
                  </div>
                </div>
              </template>
            </Column>
            <Column header="" style="width: 9rem;">
              <template #body="{ data, index }">
                <div class="rule-actions">
                  <Button
                    icon="pi pi-arrow-up"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    title="Move up"
                    :disabled="index === 0"
                    @click="moveRule(data, -1)"
                  />
                  <Button
                    icon="pi pi-arrow-down"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    title="Move down"
                    :disabled="index === rules.length - 1"
                    @click="moveRule(data, 1)"
                  />
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    title="Edit rule"
                    @click="openEditRule(data)"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    title="Delete rule"
                    @click="confirmDeleteRule(data)"
                  />
                </div>
              </template>
            </Column>

            <template #empty>
              No rules configured. Click "New Rule" to add one.
            </template>

            <template #footer>
              <StatusFooter
                :show-refresh="false"
                :show-export="false"
                :total-count="rules.length"
                total-label="rules"
                total-icon="pi pi-cog"
              />
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <ReviewAgingRuleEditModal
      v-model:visible="ruleModalVisible"
      :collection-id="props.collectionId"
      :rule="editingRule"
      @save="onRuleSaved"
    />

    <TaskOutput
      v-model:visible="taskOutputVisible"
      :collection-id="props.collectionId"
      :task="activeTask"
    />

    <DeleteModal
      v-model:visible="showDeleteModal"
      title="Delete Rule"
      :message="deleteMessage"
      @confirm="performDeleteRule"
    />
  </div>
</template>

<style scoped>
@import "./collection-manage.css";

.manage-tasks {
  max-width: 700px;
  width: 100%;
  padding-top: 1rem;
  margin: 0 auto;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.25rem;
}

.action-header h3 {
  font-size: 1.25rem;
  color: var(--color-text-bright);
  margin: 0;
}

.action-header p {
  color: var(--color-text-dim);
  margin: 0;
}

.action-icon {
  color: var(--color-text-dim);
  font-size: 1.25rem;
}

.action-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--color-background-subtle);
  padding: 1.25rem;
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
}

.dropdown-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-meta-row {
  display: flex;
  gap: 1rem;
  font-size: 1rem;
}

.task-meta-label {
  flex: 0 0 5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.task-meta-value {
  color: var(--color-text-dim);
  font-weight: 500;
}

.task-toolbar {
  display: flex;
}

/* Grid/toolbar action button — matches AssetsToolbar / LabelsToolbar */
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

.action-btn:hover:not(:disabled) {
  background: var(--color-bg-hover-strong);
  color: var(--color-text-bright);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

/* Filled variant (Task Output) — distinct surface, lightens to grey on hover */
.action-btn--filled {
  background: var(--p-button-secondary-background);
  border: 1px solid var(--p-button-secondary-border-color);
  color: var(--p-button-secondary-color);
}

.action-btn--filled:hover:not(:disabled) {
  background: var(--color-bg-hover-strong);
  color: var(--color-text-bright);
}

.action-btn i.icon-green {
  color: var(--color-action-green);
}

.action-btn i.icon-blue {
  color: var(--color-action-blue);
}

.rules-panel {
  display: flex;
  flex-direction: column;
  height: 32rem;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-background-dark);
  overflow: hidden;
}

.rules-toolbar {
  padding: 0.25rem 0.5rem;
  border: none;
  border-bottom: 1px solid var(--color-border-default);
  border-radius: 0;
  background: var(--color-background-light);
  flex-shrink: 0;
}

.rules-table {
  flex: 1 1 auto;
  min-height: 0;
}

.rule-cell {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.35rem 0;
}

.rule-title-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rule-title {
  font-weight: 600;
  color: var(--color-text-bright);
}

.rule-targets {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.85rem;
  padding-left: 1.2rem;
}

.rule-target {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-text-primary);
}

.rule-target-icon {
  font-size: 0.8rem;
  color: var(--color-text-dim);
}

.rule-target-svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.rule-summary {
  padding-left: 1.2rem;
  color: var(--color-text-dim);
  font-size: 1rem;
}

.rule-actions {
  display: flex;
  gap: 0.1rem;
}

.rules-empty {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-dim);
}

.w-full {
  width: 100%;
}
</style>
