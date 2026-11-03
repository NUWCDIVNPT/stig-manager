<script setup>
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { computed, ref } from 'vue'
import { TOURS } from '../../../components/global/tours.js'
import WhatsNewContent from '../../../components/global/WhatsNewContent.vue'
import { Sources } from '../../../components/global/whatsNewSources.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { useTours } from '../../../shared/composables/useTours.js'

const { startTour, recordedTourIds, hasSeen, forget } = useTours()
const { triggerError } = useGlobalError()
const menuRef = ref(null)

async function forgetTours(ids, then) {
  try {
    await forget(ids)
    then?.()
  }
  catch (error) {
    triggerError(error)
  }
}

const menuItems = computed(() => [
  { label: 'Start the orientation tour now', icon: 'pi pi-play', command: () => startTour('shell') },
  { separator: true },
  ...Object.entries(TOURS).map(([id, tour]) => {
    const seen = hasSeen(id)
    return {
      label: seen ? `Offer the ${tour.title} tour again` : `${tour.title} tour not seen yet`,
      icon: seen ? 'pi pi-refresh' : 'pi pi-circle',
      disabled: !seen,
      command: () => forgetTours([id]),
    }
  }),
  { separator: true },
  {
    // View tours wait for the shell tour, so starting it here is what lets
    // each of them be offered again when its view opens.
    label: 'Reset all tours and start over',
    icon: 'pi pi-replay',
    disabled: !recordedTourIds.value.length,
    command: () => forgetTours(recordedTourIds.value, () => startTour('shell')),
  },
])
</script>

<template>
  <div class="whats-new-page">
    <div class="page-inner">
      <div class="header">
        <h1>What's New</h1>
        <div class="header-actions">
          <Button
            label="Tours"
            icon="pi pi-compass"
            outlined
            size="small"
            aria-haspopup="true"
            aria-controls="tours-menu"
            @click="menuRef.toggle($event)"
          />
          <Menu id="tours-menu" ref="menuRef" :model="menuItems" popup>
            <template #end>
              <p class="tours-menu-note">
                <i class="pi pi-info-circle" />
                Tours will replay the next time you visit their view.
              </p>
            </template>
          </Menu>
        </div>
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tours-menu-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 18rem;
  margin: 0.25rem 0 0;
  padding: 0.5rem 0.8rem;
  border-top: 1px solid var(--color-border-default);
  color: var(--color-text-dim);
  line-height: 1.35;
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
