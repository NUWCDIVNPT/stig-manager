import { reactive } from 'vue'

let nextId = 1
const notifications = reactive([])

export function useNotifications() {
  function push(component, props = {}) {
    const id = nextId++
    notifications.push({ id, component, props })
    return id
  }

  function remove(id) {
    const idx = notifications.findIndex(n => n.id === id)
    if (idx !== -1) notifications.splice(idx, 1)
  }

  return { notifications, push, remove }
}
