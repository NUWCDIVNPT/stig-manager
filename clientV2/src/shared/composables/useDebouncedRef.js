import { customRef } from 'vue'

export function useDebouncedRef(value, delay = 200) {
  let timeout
  let triggerFn
  const ref = customRef((track, trigger) => {
    triggerFn = trigger
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      },
    }
  })
  ref.immediate = (newValue) => {
    clearTimeout(timeout)
    value = newValue
    triggerFn()
  }
  return ref
}
