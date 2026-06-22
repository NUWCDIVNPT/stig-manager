import { markRaw, reactive } from 'vue'

let nextId = 1
const notifications = reactive([])

export function useNotifications() {
  function push(component, props = {}) {
    const id = nextId++
    // markRaw the component definition so Vue doesn't make it reactive when it
    // lands in the reactive notifications array (avoids a perf-overhead warning).
    notifications.push({ id, component: markRaw(component), props })
    return id
  }

  function remove(id) {
    const idx = notifications.findIndex(n => n.id === id)
    if (idx !== -1) notifications.splice(idx, 1)
  }

  return { notifications, push, remove }
}
