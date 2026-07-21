import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import { useRolePickList } from './useRolePickList.js'

const ROLE_OPTIONS = [
  { label: 'Restricted', value: 1 },
  { label: 'Owner', value: 4 },
]

function setup({
  source = [{ collectionId: '1', name: 'Alpha' }, { collectionId: '2', name: 'Bravo' }],
  target = [{ collectionId: '3', name: 'Charlie', roleId: 1 }],
  roleOptions = ROLE_OPTIONS,
} = {}) {
  const emit = vi.fn()
  const pickList = useRolePickList({ source, target, roleOptions, emit })
  // Stand-in for the template's <Menu ref="addMenu">.
  pickList.addMenu.value = { toggle: vi.fn(), hide: vi.fn() }
  return { emit, source, target, ...pickList }
}

describe('useRolePickList', () => {
  it('copies the initial lists instead of aliasing them', () => {
    const { source, target, localSource, localTarget } = setup()
    expect(localSource.value).toEqual(source)
    expect(localTarget.value).toEqual(target)
    localSource.value.push({ collectionId: '9', name: 'Zulu' })
    expect(source).toHaveLength(2)
  })

  it('builds a menu item per role option', () => {
    const { addMenuItems } = setup()
    expect(addMenuItems.value.map(i => i.label)).toEqual(['with Restricted role', 'with Owner role'])
  })

  it('tracks reactive role options', () => {
    const canModifyOwners = ref(false)
    const roleOptions = computed(() =>
      canModifyOwners.value ? ROLE_OPTIONS : ROLE_OPTIONS.slice(0, 1))
    const { addMenuItems } = setup({ roleOptions })
    expect(addMenuItems.value).toHaveLength(1)
    canModifyOwners.value = true
    expect(addMenuItems.value).toHaveLength(2)
  })

  it('opens the role menu on move-right so a role can be picked', () => {
    const { addMenu, onMoveRight } = setup()
    const event = { type: 'click' }
    onMoveRight(event)
    expect(addMenu.value.toggle).toHaveBeenCalledWith(event)
  })

  it('stamps the picked role on the selection and moves it to the target', () => {
    const { addMenu, addMenuItems, localSource, localTarget, selectionSource } = setup()
    selectionSource.value = [localSource.value[1]]

    addMenuItems.value[1].command() // "with Owner role"

    expect(localSource.value.map(c => c.name)).toEqual(['Alpha'])
    expect(localTarget.value.map(c => c.name)).toEqual(['Charlie', 'Bravo'])
    expect(localTarget.value[1].roleId).toBe(4)
    expect(selectionSource.value).toEqual([])
    expect(addMenu.value.hide).toHaveBeenCalled()
  })

  it('does nothing when a role is picked with no selection', () => {
    const { addMenu, addMenuItems, localSource, localTarget } = setup()
    addMenuItems.value[0].command()
    expect(localSource.value).toHaveLength(2)
    expect(localTarget.value).toHaveLength(1)
    expect(addMenu.value.hide).not.toHaveBeenCalled()
  })

  it('changes a target item role in place without mutating the original object', async () => {
    const { emit, target, localTarget, onRoleChange } = setup()

    onRoleChange(localTarget.value[0], 4)
    await nextTick()

    expect(localTarget.value).toEqual([{ collectionId: '3', name: 'Charlie', roleId: 4 }])
    expect(target[0].roleId).toBe(1)
    const targetUpdate = emit.mock.calls.find(([name]) => name === 'update:target')
    expect(targetUpdate[1]).toEqual([{ collectionId: '3', name: 'Charlie', roleId: 4 }])
  })

  it('keeps the pane selection pointing at the role-changed item', () => {
    const { localTarget, selectionTarget, onRoleChange } = setup()
    selectionTarget.value = [localTarget.value[0]]

    onRoleChange(localTarget.value[0], 4)

    expect(selectionTarget.value).toEqual([localTarget.value[0]])
  })

  it('does not emit when the role is unchanged', async () => {
    const { emit, localTarget, onRoleChange } = setup()

    onRoleChange(localTarget.value[0], 1)
    await nextTick()

    expect(emit).not.toHaveBeenCalled()
  })

  it('discards the role when moving items back to the source', () => {
    const { localSource, localTarget, selectionTarget, onMoveLeft } = setup()
    selectionTarget.value = [localTarget.value[0]]

    onMoveLeft()

    expect(localTarget.value).toEqual([])
    expect(localSource.value.map(c => c.name)).toEqual(['Alpha', 'Bravo', 'Charlie'])
    expect(localSource.value[2]).not.toHaveProperty('roleId')
    expect(selectionTarget.value).toEqual([])
  })

  it('move-all-right selects every source item and opens the role menu', () => {
    const { addMenu, selectionSource, onMoveAllRight } = setup()
    const event = { type: 'click' }
    onMoveAllRight(event)
    expect(selectionSource.value.map(c => c.name)).toEqual(['Alpha', 'Bravo'])
    expect(addMenu.value.toggle).toHaveBeenCalledWith(event)
  })

  it('move-all-left empties the target', () => {
    const { localSource, localTarget, onMoveAllLeft } = setup()
    onMoveAllLeft()
    expect(localTarget.value).toEqual([])
    expect(localSource.value).toHaveLength(3)
  })

  it('emits shallow copies of both lists after a move', async () => {
    const { emit, addMenuItems, localSource, localTarget, selectionSource } = setup()
    selectionSource.value = [localSource.value[0]]
    addMenuItems.value[0].command()

    await nextTick()

    const sourceUpdate = emit.mock.calls.find(([name]) => name === 'update:source')
    const targetUpdate = emit.mock.calls.find(([name]) => name === 'update:target')
    expect(sourceUpdate[1]).toEqual(localSource.value)
    expect(sourceUpdate[1]).not.toBe(localSource.value)
    expect(targetUpdate[1]).toEqual(localTarget.value)
    expect(targetUpdate[1]).not.toBe(localTarget.value)
  })
})
