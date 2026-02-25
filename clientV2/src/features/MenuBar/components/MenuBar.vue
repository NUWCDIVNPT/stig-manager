<script setup>
import Menubar from 'primevue/menubar'
import { computed, inject } from 'vue'
import { useEnv } from '../../../shared/stores/useEnv.js'

defineEmits(['toggle-menu'])
const oidcWorker = inject('worker')
const env = useEnv()

const tokenTooltip = computed(() => {
  try {
    return JSON.stringify(oidcWorker.tokenParsed, null, 2)
  }
  catch {
    return ''
  }
})

function handleLogout() {
  const logoutHandler = oidcWorker.logout.bind(oidcWorker)
  logoutHandler()
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
      height: '80px',
      backgroundColor: '#000000',
      border: 'none',
      borderBottom: '2px solid #464545',
      borderRadius: '0',
      padding: '0 16px',
      minWidth: '200px',
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
      gap: '2px',
    },
  },
  submenu: {
    style: {
      right: '5px',
      left: 'auto',
      fontSize: '1.25rem',
      minWidth: '180px',
      width: 'auto',
      zIndex: '1000',
      border: '1px solid #3a3d40',
      borderRadius: '6px',
      padding: '4px 0',
    },
  },
  submenuItemContent: {
    style: {
      padding: '2px 0',
    },
  },
}
</script>

<template>
  <Menubar :model="items" :pt="pt">
    <template #start>
      <div class="left-section">
        <button class="icon-btn" aria-label="Menu" @click="$emit('toggle-menu')">
          <i class="pi pi-bars" />
        </button>
        <router-link to="/" class="home-link">
          <span class="logo-icon" /> Stig-Manager
        </router-link>
        <div class="badges">
          <span class="badge badge-oss">OSS</span>
          <span class="badge badge-version">{{ env?.version }}</span>
        </div>
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
  gap: 16px;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
}

.icon-btn:focus,
.icon-btn:active {
  outline: none;
}

.icon-btn:hover {
  opacity: 0.8;
}

.pi-bars {
  font-size: 1.2rem;
}

.home-link {
  display: flex;
  align-items: center;
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: 600;
  gap: 8px;
}

.logo-icon {
  display: block;
  width: 25px;
  height: 25px;
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
  padding: 2px 3px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 5px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-text-primary);
}

.badge:hover {
  transform: translateY(-1px);
}

.badge-oss {
  background-color: rgba(99, 110, 123, 0.9);
}

.badge-version {
  background-color: var(--color-primary-green, #10b981); /* Use fallback if var not available */
}

/* Menu Item Styling */
.menu-item-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 15px;
}

.menu-profile-header {
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #3a3d40;
  cursor: default;
}

.profile-avatar {
  width: 32px;
  height: 32px;
  background-color: #3a3d40;
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
