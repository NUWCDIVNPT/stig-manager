<script setup>
import { toRefs } from 'vue'

const props = defineProps({
  hasError: { type: Boolean, default: false },
  dbClass: { type: String, default: 'offline' },
  oidcClass: { type: String, default: 'offline' },
})

const { hasError, dbClass, oidcClass } = toRefs(props)
</script>

<template>
  <div v-if="hasError" class="error-alert" role="alert">
    <div class="alert-icon" aria-hidden>
      ⛔
    </div>
    <div class="alert-body">
      <div class="alert-title">
        Service Error
      </div>
      <div class="alert-message">
        API is Offline
      </div>
    </div>
  </div>

  <div v-else class="service-alert" role="status">
    <div class="alert-icon" aria-hidden>
      ⚠️
    </div>
    <div class="alert-body">
      <div class="alert-title">
        Service Alert
      </div>
      <div class="alert-message">
        The API is currently unavailable
      </div>

      <div class="status-row">
        <div class="status-item">
          Database: <span class="badge" :class="[dbClass]">{{ dbClass }}</span>
        </div>
        <div class="status-item">
          Authentication: <span class="badge" :class="[oidcClass]">{{ oidcClass }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-alert {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  color: #fff;
  padding: 14px 18px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  max-width: 560px;
}
.error-alert .alert-icon {
  background: #ef5350;
  color: #2b0f0f;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.error-alert {
  background: #4a1f1f;
  border: 1px solid #ff8a80;
}
.alert-body {
  display: flex;
  flex-direction: column;
}
.alert-title {
  font-weight: 700;
  margin-bottom: 6px;
}
.alert-message {
  margin-bottom: 10px;
  color: #f4e7db;
}

.service-alert {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: #3b2a1f;
  color: #fff;
  padding: 14px 18px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  max-width: 560px;
}
.service-alert .alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f6c85f;
  color: #3b2a1f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.service-alert .alert-body {
  display: flex;
  flex-direction: column;
}
.service-alert .alert-title {
  font-weight: 700;
  margin-bottom: 6px;
}
.service-alert .alert-message {
  margin-bottom: 10px;
  color: #f4e7db;
}
.status-row {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-bottom: 8px;
}
.status-item {
  font-size: 14px;
}
.badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  margin-left: 6px;
}
.online {
  background: #2e7d32;
  color: white;
}
.offline {
  background: #c62828;
  color: white;
}
</style>
