import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { navTreeConfig } from '../composeables/navTreeConfig'
import { useNavTreeNodes } from '../composeables/useNavTreeNodes'

describe('useNavTreeNodes', () => {
  const collections = [
    {
      collectionId: '1',
      name: 'Collection1',
      description: null,
      settings: {
        fields: {
          detail: {
            enabled: 'always',
            required: 'always',
          },
          comment: {
            enabled: 'findings',
            required: 'findings',
          },
        },
        status: {
          canAccept: true,
          resetCriteria: 'result',
          minAcceptGrant: 3,
        },
        history: {
          maxReviews: 5,
        },
        importOptions: {
          autoStatus: {
            fail: 'submitted',
            pass: 'submitted',
            notapplicable: 'submitted',
          },
          unreviewed: 'commented',
          allowCustom: true,
          emptyDetail: 'replace',
          emptyComment: 'ignore',
          unreviewedCommented: 'informational',
        },
      },
      metadata: {
        reqRar: 'true',
        pocName: 'poc2Patched',
        pocEmail: 'pocEmail@email.com',
        pocPhone: '12342',
      },
    },
  ]

  it('should return computed nav tree nodes with collections and config', async () => {
    const collectionsRef = ref(collections)

    const nodesComputed = useNavTreeNodes(collectionsRef, navTreeConfig)

    const nodes = nodesComputed.value

    expect(nodes).toBeInstanceOf(Array)
    expect(nodes.length).toBe(navTreeConfig.sections.length + 1) // +1 for collection

    // should be in order AppManagement, Collections, Stig, Settings
    expect(nodes[0].key).toBe('AppManagement')
    expect(nodes[1].key).toBe('Collections')
    expect(nodes[2].key).toBe('Stig')
    expect(nodes[3].key).toBe('Settings')

    // new-create-collection-action should have data with type new and italic true
    const newCollectionNode = nodes[1].children.find(
      child => child.key === 'new-collection-action',
    )
    expect(newCollectionNode).toBeDefined()
    expect(newCollectionNode.data).toEqual({ type: 'new', italic: true })

    const collectionsSection = nodes.find(node => node.key === 'Collections')
    expect(collectionsSection).toBeDefined()
    expect(collectionsSection.children).toBeInstanceOf(Array)
    expect(collectionsSection.children.length).toBe(collections.length + 1) // +1 for create new collection

    // all children of collections besides key new-collection-action have string values for key, component, label, icon and object for data
    for (const node of collectionsSection.children) {
      expect(typeof node.key).toBe('string')
      expect(typeof node.component).toBe('string')
      expect(typeof node.label).toBe('string')
      expect(typeof node.icon).toBe('string')
      expect(typeof node.data).toBe('object')
      expect(node.data).not.toBeNull()
    }

    const firstCollectionNode = collectionsSection.children.find(child => child.key === '1')
    expect(firstCollectionNode).toBeDefined()
    expect(firstCollectionNode.label).toBe('Collection1')
    expect(firstCollectionNode.icon).toBe('icon-collection')
    expect(firstCollectionNode.data).toEqual(collections[0])
    expect(firstCollectionNode.component).toBe('CollectionView')

    // clear collections ref and check that there are no collection children except create new collection (testing reactivity to api fetch)
    collectionsRef.value = []
    await nextTick()
    const updatedNodes = nodesComputed.value
    const updatedCollectionsSection = updatedNodes.find(node => node.key === 'Collections')
    expect(updatedCollectionsSection.children.length).toBe(1) // only create new collection left
  })
})
