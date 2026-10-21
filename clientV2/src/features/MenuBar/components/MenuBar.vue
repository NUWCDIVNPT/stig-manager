<script setup>
import Button from 'primevue/button'
import Menubar from 'primevue/menubar'
import Popover from 'primevue/popover'
import { computed, inject, ref } from 'vue'
import { useRoute } from 'vue-router'
import LabelFilterPills from '../../../components/common/LabelFilterPills.vue'
import { TOOLTIPS } from '../../../shared/lib/tooltips.js'
import { formatDateTimeString } from '../../../shared/lib.js'
import { useEnv } from '../../../shared/stores/useEnv.js'
import CollectionFilterPills from '../../MetaCollectionView/components/CollectionFilterPills.vue'
import { useAppBreadcrumb } from '../composables/useAppBreadcrumb.js'
import BreadcrumbSelect from './BreadcrumbSelect.vue'

// Routes flag which filter shows after the breadcrumb: `meta.labelFilter` (collection
// labels) or `meta.collectionFilter` (Collections page).
const route = useRoute()

const oidcWorker = inject('worker')
const env = useEnv()
const {
  breadcrumbItems,
  collectionOptions,
  navigateToCollection,
  assetStigOptions,
  isStigOptionsLoading,
  stigInvalidTooltip,
  stigRevisionOptions,
  isRevisionOptionsLoading,
  navigateToStig,
  navigateToRevision,
} = useAppBreadcrumb()

// Epoch-second claims also get a readable date, as in the legacy client.
const TOKEN_DATE_CLAIMS = ['exp', 'iat', 'auth_time', 'nbf']

const tokenPopover = ref(null)
const tokenText = ref('')

// Built on open, not cached, so a refreshed token shows its current claims.
function tokenPayloadText() {
  try {
    const payload = { ...oidcWorker.tokenParsed }
    for (const claim of TOKEN_DATE_CLAIMS) {
      if (typeof payload[claim] === 'number') {
        payload[claim] = `${payload[claim]} (${formatDateTimeString(payload[claim] * 1000)})`
      }
    }
    return JSON.stringify(payload, null, 2)
  }
  catch {
    return ''
  }
}

function showTokenPayload(event) {
  tokenText.value = tokenPayloadText()
  tokenPopover.value.show(event)
}

// navigator.clipboard is undefined on insecure origins; keep the popover open
// so the text stays selectable when the copy fails.
async function copyToken() {
  try {
    await navigator.clipboard.writeText(tokenText.value)
    tokenPopover.value.hide()
  }
  catch {
    // leave popover open
  }
}

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
          showToken: true,
        },
        {
          separator: true,
        },
        ...(oidcWorker.logoutAvailable ? [{
          label: 'Sign out',
          icon: 'pi pi-sign-out',
          command: handleLogout,
        }] : []),
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
  // Left side shrinks (label filter first) so it never runs under the menu items
  start: {
    style: {
      flex: '0 1 auto',
      minWidth: 0,
    },
  },
  rootList: {
    'data-tour': 'user-menu',
    'style': {
      marginLeft: 'auto',
      flexShrink: 0,
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
      fontSize: 'var(--text-xl)',
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
            <!-- Collection dropdown picker -->
            <!-- <BreadcrumbSelect
              v-if="item.pickerType === 'collection'"
              is-link
              :model-value="$route.params.collectionId"
              :options="collectionOptions"
              option-label="name"
              option-value="collectionId"
              placeholder="Collection"
              @update:model-value="onCollectionSelect"
            /> -->

            <!-- STIG dropdown picker -->
            <BreadcrumbSelect
              v-else-if="item.isDropdown && item.dropdownType === 'stig'"
              :model-value="$route.params.benchmarkId"
              :options="assetStigOptions"
              option-label="benchmarkId"
              option-value="benchmarkId"
              placeholder="STIG"
              :invalid-tooltip="stigInvalidTooltip"
              :loading="isStigOptionsLoading"
              @update:model-value="navigateToStig"
            />

            <!-- Revision dropdown picker -->
            <BreadcrumbSelect
              v-else-if="item.isDropdown && item.dropdownType === 'revision'"
              :model-value="$route.params.revisionStr"
              :options="stigRevisionOptions"
              option-label="revisionStr"
              option-value="revisionStr"
              :invalid-tooltip="TOOLTIPS.breadcrumb.revisionNotFound"
              :loading="isRevisionOptionsLoading"
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
        <div v-if="route.meta.labelFilter || route.meta.collectionFilter" class="breadcrumb-filter">
          <LabelFilterPills v-if="route.meta.labelFilter" />
          <CollectionFilterPills v-else />
        </div>
        <!-- Inside a slot so MenuBar keeps one root; the popover teleports to body -->
        <Popover ref="tokenPopover">
          <Button label="Copy" icon="pi pi-copy" size="small" text @click="copyToken" />
          <pre class="token-payload">{{ tokenText }}</pre>
        </Popover>
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
        <button
          v-if="item.showToken"
          type="button"
          class="token-info-btn"
          title="Show token payload"
          aria-label="Show token payload"
          @click.stop="showTokenPayload"
        >
          <i class="pi pi-info-circle tooltip-icon" />
        </button>
      </div>

      <router-link v-else-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a :href="href" v-bind="props.action" class="menu-item-link" @click="navigate">
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>
      </router-link>
      <a v-else v-bind="props.action" class="menu-item-link">
        <span :class="item.icon" />
        <span>{{ item.label }}</span>
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
  min-width: 0;
}

.home-link,
.badges,
.breadcrumb {
  flex-shrink: 0;
}

.home-link {
  display: flex;
  align-items: center;
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: var(--text-xl);
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
  font-size: var(--text-md);
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
.breadcrumb-filter {
  flex: 0 1 auto;
  min-width: 0;
  margin-left: 0.5rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0;
}

.breadcrumb-separator {
  color: var(--color-text-dim);
  margin: 0 0.4rem;
  font-size: var(--text-lg);
}

.breadcrumb-link {
  color: var(--color-primary-highlight);
  text-decoration: none;
  font-size: var(--text-xl);
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--color-text-primary);
  font-size: var(--text-xl);
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

.token-info-btn {
  display: flex;
  align-items: center;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
}

.token-payload {
  margin: 0;
  max-height: 24rem;
  overflow: auto;
  font-family: var(--font-mono);
  user-select: text;
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
  font-size: var(--text-xl);
  color: var(--color-text-primary);
}

.profile-name {
  font-size: var(--text-lg);
  color: var(--color-text-dim);
}
</style>
