import { nextTick, ref } from 'vue'

// Keeps a target row visible in a fixed-item-size virtual scroller while
// "pinned". Scrolling the target out of view unpins (auto-scroll stops);
// scrolling it back into view re-pins.
export function useFollowRow(getViewportEl, { itemSize }) {
  const pinned = ref(true)
  let el = null
  let targetIndex = 0

  function isTargetVisible() {
    const top = targetIndex * itemSize
    return top >= el.scrollTop - itemSize && top + itemSize <= el.scrollTop + el.clientHeight + itemSize
  }

  function onScroll() {
    if (el) {
      pinned.value = isTargetVisible()
    }
  }

  function attach() {
    detach()
    el = getViewportEl()
    el?.addEventListener('scroll', onScroll, { passive: true })
  }

  function detach() {
    el?.removeEventListener('scroll', onScroll)
    el = null
  }

  // Scrolls so row `index` sits at the bottom of the viewport, if pinned
  async function followRow(index) {
    targetIndex = index
    if (!pinned.value) {
      return
    }
    await nextTick()
    if (!el) {
      attach()
    }
    if (el) {
      el.scrollTop = Math.max(0, (index + 1) * itemSize - el.clientHeight)
    }
  }

  return { pinned, attach, detach, followRow }
}
