<script setup>
import LabelChip from '../Label.vue'

// A filter value drawn as its grid cell: the column's optionComponent, a label chip, or plain text
defineProps({
  // { value, name, color }
  option: {
    type: Object,
    required: true,
  },
  // A filterColumns entry; its optionComponent takes { option, field }
  column: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <component :is="column.optionComponent" v-if="column?.optionComponent" :option="option" :field="column.field" />
  <LabelChip v-else-if="option.color" :value="option.name" :color="option.color" />
  <span v-else :class="{ 'grid-filter-option--empty': option.value === '' }">{{ option.name }}</span>
</template>

<style scoped>
.grid-filter-option--empty {
  font-style: italic;
  color: var(--color-text-dim);
}
</style>
