<script setup>
import Column from 'primevue/column'
import collectionColorIcon from '../../assets/collection-color.svg'
import collectionIcon from '../../assets/collection.svg'
import shieldGreenCheck from '../../assets/shield-green-check.svg'

const props = defineProps({
  field: String,
  header: String,
  showShield: {
    type: Boolean,
    default: false,
  },
  onShieldClick: {
    type: Function,
    default: null,
  },
  showCollectionIcon: {
    type: Boolean,
    default: false,
  },
  onCollectionIconClick: {
    type: Function,
    default: null,
  },
})

function handleShieldClick(rowData) {
  if (props.showShield && props.onShieldClick) {
    props.onShieldClick(rowData)
  }
}

function handleCollectionIconClick(rowData) {
  if (props.showCollectionIcon && props.onCollectionIconClick) {
    props.onCollectionIconClick(rowData)
  }
}
</script>

<template>
  <Column :field="field" :header="header">
    <template #body="slotProps">
      <div class="sm-grid-cell-with-toolbar">
        <div class="sm-info">
          {{ slotProps.data.collectionName }}
        </div>
        <button
          v-if="showCollectionIcon"
          type="button"
          class="collection-icon-action"
          title="Go to Collection"
          @click.stop="handleCollectionIconClick(slotProps.data)"
        >
          <img class="collection-icon-default" :src="collectionIcon" width="14" height="14" alt="Collection">
          <img class="collection-icon-hover" :src="collectionColorIcon" width="14" height="14" alt="Collection">
        </button>
        <button
          v-if="showShield"
          type="button"
          class="shield-action"
          title="Open Collection"
          @click.stop="handleShieldClick(slotProps.data)"
        >
          <img :src="shieldGreenCheck" width="14" height="14" alt="Review">
        </button>
      </div>
    </template>
  </Column>
</template>

<style scoped>
.sm-grid-cell-with-toolbar {
  display: flex;
  align-items: center;
}

.sm-info {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.collection-icon-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  visibility: hidden;
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.collection-icon-action .collection-icon-hover {
  display: none;
}

.collection-icon-action:hover .collection-icon-default {
  display: none;
}

.collection-icon-action:hover .collection-icon-hover {
  display: inline;
}

.collection-icon-action:hover {
  background-color: var(--color-button-hover-bg);
}

.collection-icon-action img {
  pointer-events: none;
}

.shield-action {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s, transform 0.15s, background-color 0.15s;
}

.shield-action:hover {
  opacity: 1;
  transform: scale(1.2);
  background-color: var(--color-button-hover-bg);
}

.shield-action img {
  pointer-events: none;
}
</style>
