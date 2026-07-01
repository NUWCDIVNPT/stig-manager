<script setup>
import CollectionInfoForm from '../../../../components/common/CollectionInfoForm.vue'
import GrantsPanel from '../../../../components/common/grants/GrantsPanel.vue'

defineProps({
  collection: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['updated', 'grants-updated'])
</script>

<template>
  <div class="details-container">
    <div class="details-card">
      <div class="details-header">
        <i class="pi pi-sliders-h details-icon" />
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
          @updated="emit('grants-updated')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.details-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  min-height: 0;
}

.details-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-dark);
  border-radius: 6px;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.details-icon {
  color: var(--color-primary-highlight);
  font-size: 1rem;
}

.details-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  margin: 0;
}

.details-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1 1 auto;
  overflow: hidden;
}
</style>
