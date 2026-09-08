<script setup>
import { computed } from 'vue'
import librarySvg from '../../../assets/library.svg'
import ClassificationBadge from '../../../components/common/ClassificationBadge.vue'

const props = defineProps({
  benchmark: {
    type: Object,
    default: null,
  },
  /** Route param, shown while the benchmark list is still loading. */
  benchmarkId: {
    type: String,
    default: null,
  },
})

defineEmits(['close'])

const title = computed(() => props.benchmark?.title ?? 'Loading benchmark…')
const id = computed(() => props.benchmark?.benchmarkId ?? props.benchmarkId)
</script>

<template>
  <header class="stiglib-panel__header">
    <img :src="librarySvg" class="stiglib-panel__title-icon" alt="">
    <span
      class="stiglib-panel__title stiglib-panel__title--truncate rule-pane-header__name"
      :title="title"
    >
      {{ title }}
    </span>
    <span v-if="id" class="stiglib-chip">{{ id }}</span>
    <ClassificationBadge v-if="benchmark?.marking" :level="benchmark.marking" />
    <button
      type="button"
      class="stiglib-iconbtn"
      title="Close benchmark"
      @click="$emit('close')"
    >
      <i class="pi pi-times" />
    </button>
  </header>
</template>

<style scoped>
@import "../styles/stigLibrary.css";

.rule-pane-header__name {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
