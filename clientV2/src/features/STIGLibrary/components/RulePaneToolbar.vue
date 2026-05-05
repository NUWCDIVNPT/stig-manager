<script setup>
import Button from 'primevue/button'
import { computed } from 'vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import RevisionSelect from './RevisionSelect.vue'

const props = defineProps({
  revisions: {
    type: Array,
    default: () => [],
  },
  revisionsLoading: {
    type: Boolean,
    default: false,
  },
  viewRev: {
    type: String,
    default: null,
  },
  compareRev: {
    type: String,
    default: null,
  },
})

const emit = defineEmits([
  'change-view-rev',
  'change-compare-rev',
])

const diffMode = computed(() => !!props.compareRev)
const hasOtherRevisions = computed(() => (props.revisions ?? []).length > 1)

function onChangeViewRev(rev) {
  emit('change-view-rev', rev)
}

function onChangeCompareRev(rev) {
  emit('change-compare-rev', rev)
}
</script>

<template>
  <div class="rule-pane-toolbar">
    <RevisionSelect
      label="Viewing:"
      :options="revisions"
      :model-value="viewRev"
      :exclude-value="compareRev"
      :disabled="revisionsLoading"
      @update:model-value="onChangeViewRev"
    />
    <template v-if="hasOtherRevisions">
      <RevisionSelect
        label="Compare with:"
        :options="revisions"
        :model-value="compareRev"
        :exclude-value="viewRev"
        allow-none
        none-label="— None (view mode) —"
        :disabled="revisionsLoading"
        @update:model-value="onChangeCompareRev"
      />
      <Button
        v-if="diffMode"
        icon="pi pi-times"
        label="Exit diff"
        severity="secondary"
        size="small"
        @click="onChangeCompareRev(null)"
      />
    </template>
    <div class="rule-pane-toolbar__spacer" />
    <DensityControls grid-key="stig-library-rules-v2" :default-line-clamp="2" />
  </div>
</template>

<style scoped>
.rule-pane-toolbar {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.55rem 0.9rem;
  background-color: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  flex-wrap: wrap;
}

.rule-pane-toolbar__spacer {
  flex: 1;
}
</style>
