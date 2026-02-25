<script setup>
import Breadcrumb from 'primevue/breadcrumb'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BreadcrumbSelect from '../../../components/common/BreadcrumbSelect.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import {
  fetchAssetStigs,
  fetchCollection,
  fetchStigRevisions,
} from '../api/assetReviewApi.js'

const props = defineProps({
  asset: {
    type: Object,
    default: null,
  },
})

const route = useRoute()
const router = useRouter()

const collectionId = computed(() => route.params.collectionId)
const assetId = computed(() => route.params.assetId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

// Fetch Collection Details (for breadcrumb name)
const { state: collection, execute: loadCollection } = useAsyncState(
  () => fetchCollection(collectionId.value),
  { immediate: false },
)

// Fetch Asset STIGs (for breadcrumb dropdown)
const { state: assetStigs, execute: loadAssetStigs } = useAsyncState(
  () => fetchAssetStigs(assetId.value),
  { initialState: [], immediate: false },
)

// Fetch Revisions (for breadcrumb dropdown)
const { state: stigRevisions, execute: loadStigRevisions } = useAsyncState(
  () => fetchStigRevisions(benchmarkId.value),
  { initialState: [], immediate: false },
)

// Initial Data Load
watch([assetId, collectionId], () => {
  if (assetId.value) {
    loadAssetStigs()
  }
  if (collectionId.value) {
    loadCollection()
  }
}, { immediate: true })

// Reload revisions when benchmark changes
watch(benchmarkId, loadStigRevisions, { immediate: true })

// Ensure revision is set if missing
watch(assetStigs, (stigs) => {
  if (!revisionStr.value && stigs.length > 0 && benchmarkId.value) {
    const currentStig = stigs.find(s => s.benchmarkId === benchmarkId.value)
    if (currentStig?.revisionStr) {
      router.replace({
        name: 'collection-asset-review',
        params: {
          collectionId: collectionId.value,
          assetId: assetId.value,
          benchmarkId: benchmarkId.value,
          revisionStr: currentStig.revisionStr,
        },
      })
    }
  }
})

// Navigation Handlers
const selectedStigBenchmarkId = computed({
  get: () => benchmarkId.value,
  set: (newBenchmarkId) => {
    if (newBenchmarkId) {
      const stigData = assetStigs.value.find(s => s.benchmarkId === newBenchmarkId)
      router.push({
        name: 'collection-asset-review',
        params: {
          collectionId: collectionId.value,
          assetId: assetId.value,
          benchmarkId: newBenchmarkId,
          revisionStr: stigData?.revisionStr || undefined,
        },
      })
    }
  },
})

const selectedRevisionStr = computed({
  get: () => revisionStr.value,
  set: (newRevisionStr) => {
    if (newRevisionStr) {
      router.push({
        name: 'collection-asset-review',
        params: {
          collectionId: collectionId.value,
          assetId: assetId.value,
          benchmarkId: benchmarkId.value,
          revisionStr: newRevisionStr,
        },
      })
    }
  },
})

function navigateToCollection() {
  router.push({
    name: 'collection-dashboard',
    params: { collectionId: collectionId.value },
  })
}

// Breadcrumb Config
const breadcrumbHome = {
  label: 'Collections',
  route: '/collections',
}

const breadcrumbItems = computed(() => {
  const items = [
    {
      label: collection.value?.name || 'Collection',
      command: navigateToCollection,
    },
    {
      label: props.asset?.name || `Asset ${assetId.value}`,
    },
    {
      label: benchmarkId.value,
      isStigDropdown: true,
    },
  ]

  if (revisionStr.value) {
    items.push({
      label: revisionStr.value,
      isRevisionDropdown: true,
    })
  }

  return items
})
</script>

<template>
  <div class="header-breadcrumb">
    <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems">
      <template #item="{ item, props: itemProps }">
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a :href="href" v-bind="itemProps.action" class="breadcrumb-link" @click="navigate">
            {{ item.label }}
          </a>
        </router-link>
        <a
          v-else-if="item.command"
          v-bind="itemProps.action"
          class="breadcrumb-link"
          href="#"
          @click.prevent="item.command"
        >
          {{ item.label }}
        </a>
        <BreadcrumbSelect
          v-else-if="item.isStigDropdown"
          v-model="selectedStigBenchmarkId"
          :options="assetStigs"
          option-label="benchmarkId"
          option-value="benchmarkId"
          placeholder="Select STIG"
        />
        <BreadcrumbSelect
          v-else-if="item.isRevisionDropdown"
          v-model="selectedRevisionStr"
          :options="stigRevisions"
          option-label="revisionStr"
          option-value="revisionStr"
          placeholder="Select Revision"
        />
        <span v-else class="breadcrumb-current">{{ item.label }}</span>
      </template>
      <template #separator>
        <span class="breadcrumb-separator">/</span>
      </template>
    </Breadcrumb>
  </div>
</template>

<style scoped>
.header-breadcrumb {
  margin-bottom: 0.25rem;
}

/* Breadcrumb Styles */
.breadcrumb-link {
  color: var(--color-primary-highlight);
  text-decoration: none;
  font-size: 1.2rem;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.breadcrumb-separator {
  color: var(--color-text-dim);
  margin: 0 0.5rem;
}

:deep(.p-breadcrumb) {
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.p-breadcrumb-list) {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
}
</style>
