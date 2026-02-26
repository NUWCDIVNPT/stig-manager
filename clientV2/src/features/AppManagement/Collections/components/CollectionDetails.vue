<script setup>
import CollectionInfoForm from '../../../../components/common/CollectionInfoForm.vue'
import GrantsPanel from '../../../../components/common/grants/GrantsPanel.vue'

const props = defineProps({
  collection: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['updated'])
</script>

<template>
  <div class="details-container">
    <div class="details-header">
      <h2 class="details-title">
        Properties
      </h2>
    </div>

    <div v-if="collection" class="details-content">
      <CollectionInfoForm
        :collection="collection"
        :elevate="true"
        @updated="emit('updated')"
      />
      <GrantsPanel
        :collection-id="collection.collectionId"
        :elevate="true"
        @updated="emit('updated')"
      />
    </div>
  </div>
</template>

<style scoped>
.details-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid var(--color-border-default);
}

.details-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-default);
}

.details-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.details-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1 1 auto;
  overflow: hidden;
}
</style>
