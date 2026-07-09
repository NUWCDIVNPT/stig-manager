<script setup>
import PickList from '../../../../components/common/PickList.vue'

// User Groups dual-list ([available, assigned] tuple) shared by the User
// Properties panel and the pre-register modal, so the two render identically.
const model = defineModel({ type: Array, required: true })
</script>

<template>
  <PickList
    v-model="model"
    data-key="userGroupId"
    filter-by="name"
    show-source-filter
    show-target-filter
    source-filter-placeholder="Search groups..."
    target-filter-placeholder="Search groups..."
    option-style="padding: 0.4rem 0.75rem;"
    :virtual-scroller-options="{ itemSize: 34 }"
  >
    <template #sourceheader>
      Available Groups
    </template>
    <template #targetheader>
      Assigned Groups
    </template>
    <template #item="{ item }">
      <div class="group-item">
        <i class="pi pi-users" />
        <span>{{ item.name }}</span>
      </div>
    </template>
  </PickList>
</template>

<style scoped>
.group-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.group-item i {
  font-size: 1.15rem;
}
</style>
