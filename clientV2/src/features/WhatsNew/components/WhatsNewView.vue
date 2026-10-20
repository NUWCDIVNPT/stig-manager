<script setup>
import Button from 'primevue/button'
import WhatsNewContent from '../../../components/global/WhatsNewContent.vue'
import { Sources } from '../../../components/global/whatsNewSources.js'
import { useTours } from '../../../shared/composables/useTours.js'

const { startTour } = useTours()
</script>

<template>
  <div class="whats-new-page">
    <div class="page-inner">
      <div class="header">
        <h1>What's New</h1>
        <Button
          label="Start tour"
          icon="pi pi-compass"
          outlined
          size="small"
          @click="startTour('shell')"
        />
      </div>
      <div class="whats-new-content">
        <WhatsNewContent :features="Sources" :scrollable="false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.whats-new-page {
  height: 100%;
  overflow-y: auto;
  background-color: var(--color-background-dark);
  color: var(--color-text-primary);
}

.page-inner {
  padding: 2rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-shrink: 0;
}

h1 {
  font-size: var(--text-2xl);
  font-weight: 600;
  margin: 0;
  color: var(--color-text-primary);
}

.whats-new-content {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}
</style>
