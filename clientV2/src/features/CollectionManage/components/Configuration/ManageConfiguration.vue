<script setup>
import ScrollSpyLayout from '../../../../components/common/ScrollSpyLayout.vue'
import { provideCollectionResource } from '../../composables/useCollectionResource.js'
import ManageActions from './ManageActions.vue'
import ManageDeleteCollection from './ManageDeleteCollection.vue'
import ManageImportOptions from './ManageImportOptions.vue'
import ManageMetadata from './ManageMetadata.vue'
import ManageProperties from './ManageProperties.vue'
import ManageSettings from './ManageSettings.vue'
import ManageTasks from './ManageTasks.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['imported'])

// Fetch the collection once and share it with every panel below.
provideCollectionResource(() => props.collectionId)

const sections = [
  { id: 'properties', title: 'Properties', icon: 'pi-building', desc: 'Manage collection name, description, and custom attributes' },
  { id: 'settings', title: 'Review Settings', icon: 'pi-cog', desc: 'Review fields, status transitions, and history behavior' },
  { id: 'import', title: 'Import Options', icon: 'pi-download', desc: 'Configure auto-status, unreviewed rules, and empty field handling' },
  { id: 'actions', title: 'Actions', icon: 'pi-bolt', desc: 'Clone this collection or run tasks' },
  { id: 'danger', title: 'Danger Zone', icon: 'pi-exclamation-triangle', desc: 'Permanently delete this collection' },
]
</script>

<template>
  <div class="manage-configuration">
    <ScrollSpyLayout :sections="sections">
      <template #properties>
        <ManageProperties :collection-id="props.collectionId" />
        <div class="card-subsection">
          <ManageMetadata :collection-id="props.collectionId" />
        </div>
      </template>

      <template #settings>
        <ManageSettings :collection-id="props.collectionId" />
      </template>
      <template #import>
        <ManageImportOptions :collection-id="props.collectionId" @imported="emit('imported')" />
      </template>
      <template #actions>
        <ManageActions :collection-id="props.collectionId" />
        <div class="card-subsection">
          <ManageTasks :collection-id="props.collectionId" />
        </div>
      </template>
      <template #danger>
        <ManageDeleteCollection :collection-id="props.collectionId" />
      </template>
    </ScrollSpyLayout>
  </div>
</template>

<style scoped>
.manage-configuration {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

/* Metadata shares the Properties card; separate it from the fields above. */
.card-subsection {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-default);
}
</style>
