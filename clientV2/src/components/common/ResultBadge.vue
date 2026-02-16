<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: v => ['O', 'NF', 'NA', 'NR', 'I', 'NR+'].includes(v.trim().toUpperCase()),
  },
  count: {
    type: [Number, String],
    default: null,
  },
})

const statusColor = computed(() => {
  const s = props.status.toUpperCase()
  if (s.startsWith('O')) {
    return 'var(--result-fail)'
  }
  if (s.startsWith('NF')) {
    return 'var(--result-pass)'
  }
  if (s.startsWith('NA')) {
    return 'var(--result-na)'
  }
  if (s.startsWith('NR') || s.startsWith('I')) {
    return 'var(--result-nr)'
  }
  return 'var(--color-text-primary)'
})

const statusTooltip = computed(() => {
  const s = props.status.trim().toUpperCase()

  if (s === 'NR+') {
    return 'Not Reviewed or has a non-compliance result such as informational.'
  }
  if (s.startsWith('NR')) {
    return 'Not Checked'
  }
  if (s.startsWith('NF')) {
    return 'Not A Finding/Pass'
  }
  if (s.startsWith('NA')) {
    return 'Not Applicable'
  }
  if (s.startsWith('I')) {
    return 'Informational'
  }
  if (s.startsWith('O')) {
    return 'Open/Fail'
  }

  return ''
})
</script>

<template>
  <div class="status-badge" :title="statusTooltip">
    <span class="status-text" :style="{ color: statusColor }">{{ status }}</span>
    <span v-if="count !== null" class="status-count">{{ count }}</span>
  </div>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #1e2021;
  border: 1px solid #414749;
  border-radius: 3px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  user-select: none;
  min-height: 16px;
}

.status-text {
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}

.status-count {
  display: inline-flex;
  align-items: center;
  font-weight: 400;
}
</style>
