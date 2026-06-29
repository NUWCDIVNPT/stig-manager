<script setup>
import { computed } from 'vue'
import readOnlyIcon from '../../assets/read-only.svg'

const props = defineProps({
  access: {
    type: String,
    required: true,
  },
})

const isSvg = computed(() => props.access === 'r')
const svgIcon = computed(() => {
  if (props.access === 'r') return readOnlyIcon
  return null
})

const iconClass = computed(() => {
  if (props.access === 'rw') return 'pi pi-pencil'
  if (props.access === 'none') return 'pi pi-lock'
  return 'pi pi-question'
})

const colorClass = computed(() => {
  if (props.access === 'rw') return 'access-rw'
  if (props.access === 'r') return 'access-r'
  if (props.access === 'none') return 'access-none'
  return 'access-unknown'
})

const label = computed(() => {
  if (props.access === 'rw') return 'RW'
  if (props.access === 'r') return 'R'
  if (props.access === 'none') return 'None'
  return props.access?.toUpperCase()
})
</script>

<template>
  <div class="acl-state-icon" :class="colorClass" :title="label">
    <img v-if="isSvg" :src="svgIcon" class="svg-icon" alt="" aria-hidden="true" />
    <i v-else :class="iconClass" />
    <span class="acl-label">{{ label }}</span>
  </div>
</template>

<style scoped>
.acl-state-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-bright);
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  white-space: nowrap;
}

.acl-state-icon i,
.acl-state-icon .svg-icon {
  font-size: 1rem;
  width: 1rem;
  height: 1rem;
  object-fit: contain;
}

/* Ensure the SVG icon is also styled consistently and neutral */
.acl-state-icon .svg-icon {
  opacity: 0.75;
}
</style>
