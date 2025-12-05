import { computed } from 'vue'

export function useNavTreeNodes(collections, config, canCreateCollection) {
  return computed(() => {
    const cols = collections?.value || []

    // this may need cleaning up idk?
    const collectionChildren = cols.map(col => ({
      key: String(col.collectionId),
      component: 'CollectionView',
      label: col.name,
      data: col,
      icon: 'icon-collection',
    }))

    const createNewChild = {
      key: 'new-collection-action',
      label: 'Create New Collection…',
      component: 'CreateCollection',
      data: { type: 'new', italic: true },
      icon: 'icon-add',
    }

    const children = [...collectionChildren]
    if (canCreateCollection?.value) {
      children.unshift(createNewChild)
    }

    const collectionsSection = {
      key: 'Collections',
      label: 'Collections',
      //    data: { type: 'root' },
      icon: 'icon-collection-color',
      children,
    }

    const sections = config.sections
    const [appManagement, ...rest] = sections
    return [appManagement, collectionsSection, ...rest]
  })
}
