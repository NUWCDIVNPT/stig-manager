<script setup>
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useAssetQuery } from '../queries/assetQueries.js'
import ChecklistInfo from './ChecklistInfo.vue'
import ReviewForm from './ReviewForm.vue'
import ReviewResources from './ReviewResources.vue'
import RuleInfo from './RuleInfo.vue'

const props = defineProps({
  assetId: {
    type: [String, Number],
    default: null,
  },
})

const route = useRoute()
// Use prop if provided, otherwise fall back to route param
const assetId = computed(() => props.assetId || route.params.assetId)
const oidcWorker = inject('worker')

const { asset, isLoading, error } = useAssetQuery({
  assetId,
  token: computed(() => oidcWorker?.token),
})
</script>

<template>
  <div class="asset-review">
    <div v-if="isLoading" class="asset-review__loading">
      Loading asset details...
    </div>
    <div v-else-if="error" class="asset-review__error">
      {{ error.message || 'Error loading asset' }}
    </div>
    <div v-else-if="asset" class="asset-review__content">
      <header class="asset-review__header">
        <h1 class="asset-review__title">
          {{ asset.name }}
        </h1>
        <div class="asset-review__meta">
          <span class="asset-review__meta-item">ID: {{ asset.assetId }}</span>
          <span v-if="asset.ip" class="asset-review__meta-item">IP: {{ asset.ip }}</span>
          <span v-if="asset.fqdn" class="asset-review__meta-item">FQDN: {{ asset.fqdn }}</span>
        </div>
      </header>

      <div class="asset-review__grid">
        <section class="grid-column">
          <ChecklistInfo />
        </section>

        <section class="grid-column">
          <RuleInfo />
        </section>

        <section class="grid-column split-column">
          <div class="split-row">
            <ReviewResources />
          </div>
          <div class="split-row">
            <ReviewForm />
          </div>
        </section>
      </div>
    </div>
    <div v-else class="asset-review__empty">
      Asset not found.
    </div>
  </div>
</template>

<style scoped>
.asset-review {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #000000;
  color: #e4e4e7;
}

.asset-review__content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.asset-review__header {
  flex: 0 0 auto;
  padding: 1rem 1.5rem;
  background-color: #1f1f1f;
  border-bottom: 1px solid #3a3d40;
}

.asset-review__title {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.asset-review__meta {
  display: flex;
  gap: 1.5rem;
  color: #a6adba;
  font-size: 0.9rem;
}

.asset-review__grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.grid-column {
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.split-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.split-row {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.asset-review__loading,
.asset-review__error,
.asset-review__empty {
  padding: 2rem;
  text-align: center;
  color: #a6adba;
}

.asset-review__error {
  color: #f16969;
}
</style>
