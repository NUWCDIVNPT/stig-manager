import { ref } from 'vue'

const items = [
  { key: 'StigAE', component: 'StigAE', label: 'A-E', icon: 'icon-folder', routeName: 'library' },
  { key: 'StigFM', component: 'StigFM', label: 'F-M', icon: 'icon-folder', routeName: 'library' },
  { key: 'StigNV', component: 'StigNV', label: 'N-V', icon: 'icon-folder', routeName: 'library' },
  { key: 'StigWZ', component: 'StigWZ', label: 'W-Z', icon: 'icon-folder', routeName: 'library' },
]

export function useStigLibraryItems() {
  const stigLibraryItems = ref(items)

  return {
    stigLibraryItems,
  }
}
