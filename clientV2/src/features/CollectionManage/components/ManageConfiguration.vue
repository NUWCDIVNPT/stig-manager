<script setup>
import ScrollSpyLayout from '../../../components/common/ScrollSpyLayout.vue'
import ManageActions from './ManageActions.vue'
import ManageImportOptions from './ManageImportOptions.vue'
import ManageMetadata from './ManageMetadata.vue'
import ManageProperties from './ManageProperties.vue'
import ManageSettings from './ManageSettings.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['imported'])

const sections = [
  { id: 'properties', title: 'Properties', icon: 'pi-building', desc: 'Manage collection name and description' },
  { id: 'settings', title: 'Review Settings', icon: 'pi-cog', desc: 'Review fields, status transitions, and history behavior' },
  { id: 'import', title: 'Import Options', icon: 'pi-download', desc: 'Configure auto-status, unreviewed rules, and empty field handling' },
  { id: 'metadata', title: 'Metadata', icon: 'pi-tag', desc: 'Custom key-value pairs for collection tracking' },
  { id: 'actions', title: 'Actions', icon: 'pi-bolt', desc: 'Clone or permanently delete this collection' },

]
</script>

<template>
  <div class="manage-configuration">
    <ScrollSpyLayout :sections="sections">
      <template #properties>
        <ManageProperties :collection-id="props.collectionId" />
      </template>

      <template #settings>
        <ManageSettings :collection-id="props.collectionId" />
      </template>
      <template #import>
        <ManageImportOptions :collection-id="props.collectionId" @imported="emit('imported')" />
      </template>
      <template #metadata>
        <ManageMetadata :collection-id="props.collectionId" />
      </template>
      <template #actions>
        <ManageActions :collection-id="props.collectionId" />
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
</style>
