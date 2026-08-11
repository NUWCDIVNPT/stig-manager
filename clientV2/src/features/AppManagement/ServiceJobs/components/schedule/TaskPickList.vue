<script setup>
import PickList from '../../../../../components/common/PickList.vue'

// Dual-list of job tasks: [available, selected]. Selected order is the run
// order, matching the legacy "run in order shown" grid.
const model = defineModel({ type: Array, required: true })

function taskFilter(task, searchText) {
  const term = searchText.toLowerCase()
  return task.name?.toLowerCase().includes(term)
    || task.description?.toLowerCase().includes(term)
}
</script>

<template>
  <PickList
    v-model="model"
    data-key="taskId"
    :text-filter-fn="taskFilter"
    show-source-filter
    show-target-filter
    source-filter-placeholder="Search tasks..."
    target-filter-placeholder="Search tasks..."
    option-style="padding: 0.4rem 0.75rem;"
    :virtual-scroller-options="{ itemSize: 52 }"
  >
    <template #sourceheader>
      Available Tasks
    </template>
    <template #targetheader>
      Job Tasks (run in order shown)
    </template>
    <template #item="{ item }">
      <div class="task-item">
        <i class="pi pi-cog" />
        <div class="task-names">
          <span class="task-name">{{ item.name }}</span>
          <span class="task-desc">{{ item.description }}</span>
        </div>
      </div>
    </template>
  </PickList>
</template>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  min-width: 0;
}

.task-item i {
  font-size: 1.15rem;
  flex-shrink: 0;
}

.task-names {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.task-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-desc {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
