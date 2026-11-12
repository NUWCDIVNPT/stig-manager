<script setup>
import engineIcon from '../../assets/bot2.svg'
import overrideIcon from '../../assets/override2.svg'
import manualIcon from '../../assets/user.svg'

defineOptions({ inheritAttrs: false })

defineProps({
  display: { type: String, default: '' },
  iconClass: { type: String, default: 'engine-icon' },
})

const ICONS = {
  engine: { src: engineIcon, alt: 'Engine', title: 'Result engine' },
  override: { src: overrideIcon, alt: 'Override', title: 'Overridden result' },
  manual: { src: manualIcon, alt: 'Manual', title: 'Manual result' },
}
</script>

<template>
  <img
    v-if="ICONS[display]"
    :src="ICONS[display].src"
    :alt="ICONS[display].alt"
    :title="ICONS[display].title"
    :class="iconClass"
  >
</template>
