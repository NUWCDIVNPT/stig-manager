<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: [String, Number],
    required: true,
    validator: value => ['1', '2', '3', 1, 2, 3].includes(value),
  },
  count: {
    type: [Number, String],
    default: null,
  },
})

const badgeClass = computed(() => {
  const cat = String(props.category)
  return `cat-${cat}`
})

const formattedCount = computed(() => {
  return (props.count !== null && props.count !== undefined && props.count !== '') ? props.count : ''
})

const title = computed(() => `CAT ${props.category}`)
</script>

<template>
  <div
    class="cat-badge"
    :class="badgeClass"
    :title="title"
  >
    {{ formattedCount }}
  </div>
</template>

<style scoped>
.cat-badge {
  border-radius: 5px;
  outline: #bbb solid 1px;
  outline-offset: -1px;
  width: 35px;
  font-weight: 600;
  color: #111;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  font-size: 12px;
}

.cat-1 {
  background-color: var(--color-cat1);
}

.cat-2 {
  background-color: var(--color-cat2);
}

.cat-3 {
  background-color: var(--color-cat3);
}
</style>
