<script setup>
import Select from 'primevue/select'
import { computed, ref, watch } from 'vue'
import DeleteModal from '../../../../components/common/DeleteModal.vue'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { fetchReviewAgingConfig, fetchTasks, saveReviewAgingConfig } from '../../api/tasksManageApi.js'
import { collectionSelectPt } from './pt.js'
import { rulesToPutPayload } from './reviewAgingLogic.js'
import ReviewAgingRuleEditModal from './ReviewAgingRuleEditModal.vue'
import ReviewAgingRulesTable from './ReviewAgingRulesTable.vue'
import { formatSchedule } from './scheduleFormat.js'
import TaskOutput from './TaskOutput.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const { triggerError } = useGlobalError()
const { getCollectionRoleId } = useCurrentUser()

// Only Collection Owners (roleId 4) may mutate task config; the API requires
// Owner for PUT/DELETE while Manage (roleId 3) can still read it. Non-owners
// therefore get a read-only view of the rules.
const canEdit = computed(() => getCollectionRoleId(props.collectionId) === 4)

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

        <ReviewAgingRulesTable
          :rules="rules"
          :loading="rulesLoading"
          :can-edit="canEdit"
          @new="openNewRule"
          @edit="openEditRule"
          @move="moveRule"
          @delete="confirmDeleteRule"
        />
      </div>
    </div>

    <ReviewAgingRuleEditModal
      v-model:visible="ruleModalVisible"
      :collection-id="props.collectionId"
      :rule="editingRule"
      :is-read-only="!canEdit"
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
@import "../collection-manage.css";

.manage-tasks {
  max-width: 700px;
  width: 100%;
  padding-top: 1rem;
  margin: 0 auto;
}

.action-icon {
  color: var(--color-text-dim);
  font-size: 1.25rem;
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

.action-btn i.icon-blue {
  color: var(--color-action-blue);
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
