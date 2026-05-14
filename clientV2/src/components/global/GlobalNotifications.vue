<script setup>
import { useNotifications } from '../../shared/composables/useNotifications.js'

const { notifications, remove } = useNotifications()
</script>

<template>
  <div class="global-notifications">
    <TransitionGroup name="notif-slide">
      <component
        v-for="n in notifications"
        :key="n.id"
        :is="n.component"
        v-bind="n.props"
        @dismiss="remove(n.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.global-notifications {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.global-notifications > * {
  pointer-events: auto;
}
</style>

<style>
.notif-slide-enter-active,
.notif-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.notif-slide-enter-from,
.notif-slide-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
