<script setup>
import { computed, inject } from 'vue'

const emit = defineEmits(['logout'])
const oidcWorker = inject('worker')

const tokenTooltip = computed(() => {
  try {
    return JSON.stringify(oidcWorker.tokenParsed, null, 2)
  }
  catch {
    return ''
  }
})
</script>

<template>
  <div class="footer-content">
    <div class="user-info" :title="tokenTooltip">
      <i class="pi pi-user user-icon" />
      <span class="username">{{ oidcWorker.tokenParsed.preferred_username }}</span>
    </div>
    <button type="button" class="btn-unstyled logout-btn" aria-label="Log out" @click="emit('logout')">
      <span aria-hidden="true" class="icon icon-logout" />
    </button>
  </div>
</template>

<style scoped>
.footer-content {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: #2f3031;
  height: 70px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.user-icon {
  font-size: 1rem;
  color: #7a7a7a;
}

.username {
  font-size: 13px;
  font-weight: 500;
  color: #e4e4e7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-unstyled {
  background: none;
  border: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  transition: background-color 0.2s;
  flex-shrink: 0;
  margin-left: 8px;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.icon {
  display: inline-block;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.icon-logout {
  width: 16px;
  height: 16px;
  background-image: url('/src/assets/logout.svg');
  opacity: 0.7;
  transition: opacity 0.2s;
}

.logout-btn:hover .icon-logout {
  opacity: 1;
}
</style>
