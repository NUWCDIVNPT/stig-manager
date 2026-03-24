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
  variant: {
    type: String,
    default: 'count',
    validator: value => ['count', 'label'].includes(value),
  },
})

const badgeClass = computed(() => {
  const cat = String(props.category)
  return {
    [`cat-${cat}`]: true,
    'cat-badge--label': props.variant === 'label',
  }
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
    {{ variant === 'label' ? `CAT ${category}` : formattedCount }}
  </div>
</template>

<style scoped>
.cat-badge {
  border-radius: 5px;
  outline: #bbb solid 1px;
  outline-offset: -1px;
  width: 35px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #111;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
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

.cat-badge--label {
  background-color: transparent;
  width: auto;
  padding: 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  outline: none;
}

.cat-badge--label.cat-1 {
  color: var(--color-cat1);
  border: 1px solid var(--color-cat1);
}

.cat-badge--label.cat-2 {
  color: var(--color-cat2);
  border: 1px solid var(--color-cat2);
}

.cat-badge--label.cat-3 {
  color: var(--color-cat3);
  border: 1px solid var(--color-cat3);
}
</style>
