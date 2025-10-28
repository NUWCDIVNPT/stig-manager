import { computed } from 'vue'

export function useNavTreeNodes(collections, config) {
  return computed(() => {
    const cols = collections?.value || []

    const collectionChildren = cols.map((col) => ({
      key: String(col.collectionId),
      component: String(col.collectionId),
      label: col.name,
      data: col,
      icon: 'icon-collection',
    }))

    const createNewChild = {
      key: 'new-collection-action',
      label: 'Create New Collection…',
      component: 'CollectionView',
      data: { type: 'new', italic: true },
      icon: 'icon-add',
    }

    const collectionsSection = {
      key: 'Collections',
      label: 'Collections',
      data: { type: 'root' },
      icon: 'icon-collection-color',
      children: [createNewChild, ...collectionChildren],
    }

    const sections = config?.sections || []
    const [appManagement, ...rest] = sections
    if (appManagement) return [appManagement, collectionsSection, ...rest]
    return [collectionsSection, ...sections]
  })
}
