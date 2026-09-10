<script setup>
import { computed } from 'vue'
import ActionButton from '../../../components/common/ActionButton.vue'
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
  <div class="stiglib-subbar">
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
      <ActionButton
        v-if="diffMode"
        icon="pi pi-times icon-grey"
        title="Return to single-revision view"
        @click="onChangeCompareRev(null)"
      >
        Exit diff
      </ActionButton>
    </template>
    <div class="stiglib-panel__spacer" />
    <DensityControls grid-key="stig-library-rules" :default-line-clamp="2" />
  </div>
</template>

<style scoped>
@import "../styles/stigLibrary.css";
</style>
