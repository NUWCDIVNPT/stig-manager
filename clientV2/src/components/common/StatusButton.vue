<script setup>
import { computed } from 'vue'
import saveIcon from '../../assets/save-icon-60.svg'
import starIcon from '../../assets/star.svg'
import submitIcon from '../../assets/submit.svg'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])

const actionIcon = computed(() => {
  const a = props.action
  const l = props.label?.toLowerCase()
  if (a === 'accept' || l === 'accept') {
    return starIcon
  }
  if (a === 'submit' || a === 'save and submit' || l === 'submit' || l === 'resubmit') {
    return submitIcon
  }
  return saveIcon
})
</script>

<template>
  <button
    class="status-button"
    :class="{
      'status-button--disabled': disabled,
      'status-button--active': active,
    }"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <img :src="actionIcon" class="status-button__icon">
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.status-button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  font-size: 1rem;
  font-weight: 600;
  color: hsl(0deg 0% 80%);
  background-color: hsl(0 0% 14% / 1);
  border: 1px solid hsl(0 0% 25% / 1);
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
}

.status-button:hover:not(:disabled) {
  background-color: hsl(0 0% 20%);
}

.status-button--active {
  border-color: var(--color-shield-green-dark, hsl(150, 30%, 40%));
  background-color: hsl(150, 20%, 18%);
}

.status-button--disabled {
  opacity: 0.4;
  cursor: default;
}

.status-button__icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}
</style>
