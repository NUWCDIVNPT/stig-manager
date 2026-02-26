<script setup>
import Menubar from 'primevue/menubar'
import { computed, inject } from 'vue'
import BreadcrumbSelect from '../../../components/common/BreadcrumbSelect.vue'
import { useEnv } from '../../../shared/stores/useEnv.js'
import { useAppBreadcrumb } from '../composables/useAppBreadcrumb.js'

const oidcWorker = inject('worker')
const env = useEnv()
const {
  breadcrumbItems,
  collectionOptions,
  navigateToCollection,
  assetStigOptions,
  stigRevisionOptions,
  navigateToStig,
  navigateToRevision,
} = useAppBreadcrumb()

const tokenTooltip = computed(() => {
  try {
    return JSON.stringify(oidcWorker.tokenParsed, null, 2)
  }
  catch {
    return ''
  }
})

function handleLogout() {
  oidcWorker.logout()
}

function onCollectionSelect(collectionId) {
  navigateToCollection(collectionId)
}

const items = computed(() => {
  const menuItems = []

  if (oidcWorker?.tokenParsed) {
    const name = oidcWorker.tokenParsed.preferred_username
    menuItems.push({
      icon: 'pi pi-user',
      items: [
        {
          isProfileHeader: true,
          label: oidcWorker.tokenParsed.preferred_username,
          subLabel: name,
          class: 'profile-header-item',
          tooltip: tokenTooltip.value,
        },
        {
          label: 'Set status',
          icon: 'pi pi-face-smile',
        },
        {
          separator: true,
        },
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          route: '/settings',
        },
        {
          label: 'Support',
          icon: 'pi pi-info-circle',
          route: '/support',
        },
        {
          separator: true,
        },
        {
          label: 'Sign out',
          icon: 'pi pi-sign-out',
          command: handleLogout,
        },
      ],
    })
  }

  return menuItems
})

const pt = {
  root: {
    style: {
      width: '100%',
      height: '5rem',
      backgroundColor: 'var(--color-background-darkest)',
      border: 'none',
      borderBottom: '2px solid var(--color-border-default)',
      borderRadius: '0',
      padding: '0 1.5rem',
      minWidth: '18rem',
    },
  },
  rootList: {
    style: {
      marginLeft: 'auto',
    },
  },

  itemLink: {
    style: {
      color: 'var(--color-text-primary)',
      gap: '0.2rem',
    },
  },
  submenu: {
    style: {
      right: '0.45rem',
      left: 'auto',
      fontSize: '1.25rem',
      minWidth: '16.5rem',
      width: 'auto',
      zIndex: '1000',
      border: '1px solid var(--color-border-default)',
      borderRadius: '0.55rem',
      padding: '0.35rem 0',
    },
  },
  submenuItemContent: {
    style: {
      padding: '0.2rem 0',
    },
  },
}
</script>

<template>
  <Menubar :model="items" :pt="pt">
    <template #start>
      <div class="left-section">
        <router-link to="/" class="home-link">
          <span class="logo-icon" /> STIG Manager
        </router-link>
        <div class="badges">
          <span class="badge badge-oss">OSS</span>
          <span class="badge badge-version">{{ env?.version }}</span>
        </div>

        <!-- Global breadcrumb -->
        <nav v-if="breadcrumbItems.length" class="breadcrumb" aria-label="Breadcrumb">
          <span class="breadcrumb-separator">/</span>
          <template v-for="(item, index) in breadcrumbItems" :key="index">
            <!-- Link + adjacent collection picker -->
            <template v-if="item.route && item.pickerType === 'collection'">
              <router-link :to="item.route" class="breadcrumb-link">
                {{ item.label }}
              </router-link>
              <BreadcrumbSelect
                picker-only
                :model-value="$route.params.collectionId"
                :options="collectionOptions"
                option-label="name"
                option-value="collectionId"
                @update:model-value="onCollectionSelect"
              />
            </template>

            <!-- STIG dropdown picker -->
            <BreadcrumbSelect
              v-else-if="item.isDropdown && item.dropdownType === 'stig'"
              :model-value="$route.params.benchmarkId"
              :options="assetStigOptions"
              option-label="benchmarkId"
              option-value="benchmarkId"
              placeholder="STIG"
              @update:model-value="navigateToStig"
            />

            <!-- Revision dropdown picker -->
            <BreadcrumbSelect
              v-else-if="item.isDropdown && item.dropdownType === 'revision'"
              :model-value="$route.params.revisionStr"
              :options="stigRevisionOptions"
              option-label="revisionStr"
              option-value="revisionStr"
              placeholder="Revision"
              @update:model-value="navigateToRevision"
            />

            <!-- Clickable link segment -->
            <router-link
              v-else-if="item.route"
              :to="item.route"
              class="breadcrumb-link"
            >
              {{ item.label }}
            </router-link>

            <!-- Static text segment -->
            <span v-else class="breadcrumb-current">{{ item.label }}</span>

            <span
              v-if="index < breadcrumbItems.length - 1"
              class="breadcrumb-separator"
            >/</span>
          </template>
        </nav>
      </div>
    </template>

    <template #item="{ item, props, hasSubmenu }">
      <div v-if="item.isProfileHeader" class="menu-profile-header">
        <div class="profile-avatar">
          <i class="pi pi-user" />
        </div>
        <div class="profile-text">
          <div class="profile-username">
            {{ item.label }}
          </div>
          <div class="profile-name">
            {{ item.subLabel }}
          </div>
        </div>
        <i v-if="item.tooltip" class="pi pi-info-circle tooltip-icon" :title="item.tooltip" />
      </div>

      <router-link v-else-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a :href="href" v-bind="props.action" class="menu-item-link" @click="navigate">
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
          <i v-if="item.tooltip" class="pi pi-info-circle tooltip-icon" :title="item.tooltip" />
        </a>
      </router-link>
      <a v-else v-bind="props.action" class="menu-item-link">
        <span :class="item.icon" />
        <span>{{ item.label }}</span>
        <i v-if="item.tooltip" class="pi pi-info-circle tooltip-icon" :title="item.tooltip" />
        <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down" />
      </a>
    </template>
  </Menubar>
</template>

<style scoped>
.left-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.home-link {
  display: flex;
  align-items: center;
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 600;
  gap: 0.75rem;
}

.logo-icon {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  background-image: url('/src/assets/shield-green-check.svg');
  background-size: contain;
  background-repeat: no-repeat;
  cursor: pointer;
}

.badges {
  display: flex;
  gap: 0.3rem;
  align-items: center;
}

.badge {
  padding: 0.2rem 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 0.45rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-primary);
}

.badge:hover {
  transform: translateY(-1px);
}

.badge-oss {
  background-color: var(--color-oss-blue);
}

.badge-version {
  background-color: var(--color-shield-green-dark);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0;
}

.breadcrumb-separator {
  color: var(--color-text-dim);
  margin: 0 0.4rem;
  font-size: 1.1rem;
}

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

/* Menu Item Styling */
.menu-item-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 1.35rem;
}

.menu-profile-header {
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--color-border-default);
  cursor: default;
}

.profile-avatar {
  width: 3rem;
  height: 3rem;
  background-color: var(--color-bg-hover-strong);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
}

.profile-username {
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

.profile-name {
  font-size: 1.1rem;
  color: var(--color-text-dim);
}
</style>
