<script setup>
import WhatsNewContent from '../../../components/global/WhatsNewContent.vue'
import { Sources } from '../../../components/global/whatsNewSources.js'
</script>

<template>
  <div class="whats-new-page">
    <div class="page-inner">
      <div class="header">
        <h1>What's New</h1>
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
  margin-bottom: 2rem;
  flex-shrink: 0;
}

h1 {
  font-size: 1.8rem;
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
