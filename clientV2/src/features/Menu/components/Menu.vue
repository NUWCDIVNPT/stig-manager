<script setup>
import Badge from 'primevue/badge'
import Drawer from 'primevue/drawer'
import PrimeMenu from 'primevue/menu'
import { computed } from 'vue'
import { useMenuNodes } from '../composeables/useMenuNodes.js'

const open = defineModel('open', { type: Boolean, default: false })

const drawerPt = {
  header: {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      padding: '10px',
    },
  },
  root: {
    style: {
      width: '350px',
    },
  },
  pcCloseButton: {
    root: {
      style: {
        width: '32px',
        height: '32px',
        borderRadius: '4px',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
      },
    },
  },
}

// Use Menu nodes composable
const menuNodes = useMenuNodes()

const items = computed(() => {
  const menuItems = menuNodes.value.map((node) => {
    let route = null
    if (node.component === 'CollectionView') {
      route = { name: 'collection', params: { collectionId: node.key } }
    }
    else if (node.routeName) {
      route = { name: node.routeName }
    }

    return {
      label: node.label,
      icon: node.icon,
      route,
    }
  })

  // Add separator and Recent Collections
  menuItems.push({
    separator: true,
  })

  menuItems.push({
    label: 'Recent Collections',
    icon: 'pi pi-clock',
    items: [
      // This will be populated dynamically with recent collections evenetually?
    ],
  })

  return menuItems
})
</script>

<template>
  <div class="flex justify-center">
    <Drawer v-model:visible="open" position="left" :pt="drawerPt">
      <template #header>
        <div class="drawer-header">
          <span class="stig-manager-logo" />
        </div>
      </template>
      <!-- TODO: needs to be looked at this is AI written/styled -->
      <PrimeMenu :model="items" class="w-full md:w-60">
        <template #submenulabel="{ item }">
          <span class="text-primary font-bold">{{ item.label }}</span>
        </template>
        <template #item="{ item, props }">
          <router-link
            v-if="item.route"
            :to="item.route"
            class="flex items-center menu-item-link"
            @click="open = false"
          >
            <span class="icon sm-icon" :class="item.icon" />
            <span>{{ item.label }}</span>
            <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
            <span v-if="item.shortcut" class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{ item.shortcut }}</span>
          </router-link>
          <a v-else class="flex items-center" v-bind="props.action">
            <span class="icon sm-icon" :class="item.icon" />
            <span>{{ item.label }}</span>
            <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
            <span v-if="item.shortcut" class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{ item.shortcut }}</span>
          </a>
        </template>
      </PrimeMenu>
    </Drawer>
  </div>
</template>

<style scoped>
.drawer-header {
  display: flex;
  align-items: center;
  flex: 1;
}

.stig-manager-logo {
  width: 44px;
  height: 44px;
  background-size: contain;
  background-repeat: no-repeat;
  background-image: url('/src/assets/shield-green-check.svg');
  flex-shrink: 0;
}

.icon {
  display: inline-block;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-app-management {
  background-image: url('/src/assets/gear.svg');
}

.icon-collection-color {
  background-image: url('/src/assets/collection-color.svg');
}

.icon-stig-library {
  background-image: url('/src/assets/library.svg');
}

.sm-icon {
  width: 14px;
  height: 14px;
  display: inline-block;
  margin-right: 5px;
}

.menu-item-link {
  text-decoration: none;
  color: inherit;
  padding: 0.75rem 1rem;
}

.menu-item-link:hover {
  background-color: var(--color-button-hover-bg);
}

.pi-home {
  filter: grayscale(100%) opacity(0.6);
}
</style>
