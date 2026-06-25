<script setup>
import { computed } from 'vue'
import collectionSvg from '../../../../assets/collection.svg'
import labelSvg from '../../../../assets/label.svg'
import shieldSvg from '../../../../assets/shield-green-check.svg'
import targetSvg from '../../../../assets/target.svg'
import LabelChip from '../../../../components/common/Label.vue'
import { resourceParts } from '../../lib/aclRules.js'

const props = defineProps({
  rule: {
    type: Object,
    required: true,
  },
})

const ICONS = {
  collection: collectionSvg,
  asset: targetSvg,
  label: labelSvg,
  stig: shieldSvg,
}

const parts = computed(() => resourceParts(props.rule))
</script>

<template>
  <span class="resource-cell">
    <span v-for="(part, i) in parts" :key="i" class="resource-piece">
      <img :src="ICONS[part.type]" class="svg-icon" :alt="part.type">
      <LabelChip v-if="part.type === 'label'" :value="part.text" :color="part.color" />
      <span v-else>{{ part.text }}</span>
    </span>
  </span>
</template>

<style scoped>
.resource-cell {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resource-piece {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.25rem;
}

.svg-icon {
  width: 1.1em;
  height: 1.1em;
  object-fit: contain;
}
</style>
