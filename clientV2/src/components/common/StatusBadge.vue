<script setup>
import { computed } from 'vue'
import rejectIcon from '../../assets/reject.png'
import saveIcon from '../../assets/save-icon-60.svg'
import acceptedIcon from '../../assets/star.svg'
import submitIcon from '../../assets/submit.svg'

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  count: {
    type: [Number, String],
    default: null,
  },
})

const normalizedStatus = computed(() => props.status.trim().toLowerCase())

const statusMeta = computed(() => {
  const s = normalizedStatus.value

  if (s === 'saved' || s === 'save') {
    return { tooltip: 'Saved', icon: saveIcon, spriteClass: 'status-saved' }
  }
  if (s === 'submitted' || s === 'submit') {
    return { tooltip: 'Submitted', icon: submitIcon, spriteClass: 'status-submitted' }
  }
  if (s === 'rejected' || s === 'reject') {
    return { tooltip: 'Rejected', icon: rejectIcon, spriteClass: 'status-rejected' }
  }
  if (s === 'accepted' || s === 'accept') {
    return { tooltip: 'Accepted', icon: acceptedIcon, spriteClass: 'status-accepted' }
  }

  return { tooltip: props.status, icon: null, spriteClass: '' }
})
</script>

<template>
  <div
    class="status-badge"
    :class="statusMeta.spriteClass"
    :title="statusMeta.tooltip"
  >
    <img
      v-if="statusMeta.icon"
      :src="statusMeta.icon"
      :alt="statusMeta.tooltip"
      class="status-icon"
    >
    <span v-if="count !== null" class="status-count">{{ count }}</span>
  </div>
</template>

<style scoped>
.status-count {
  font-weight: 600;
}

.status-badge {
  color: hsl(0deg 0% 80%);
  font-weight: 600;
  line-height: 1;
  position: relative;
  top: 0;
  background-color: hsl(0 0% 14% / 1);
  padding: 1px 4px 2px 3px;
  border-radius: 3px;
  user-select: none;
  border: 1px solid hsl(0 0% 25% / 1);
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: 0;
}

.status-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.status-submitted .status-icon {
  filter: invert(54%) sepia(44%) saturate(589%) hue-rotate(58deg) brightness(92%) contrast(86%);
}
</style>
