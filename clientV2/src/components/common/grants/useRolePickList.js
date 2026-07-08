import { computed, ref, toValue, watch } from 'vue'

/**
 * Shared state machine for the dual-list role pickers (GrantsPickList,
 * CollectionGrantPickList): local copies of the source/target lists, the
 * pane selections, and the move handlers where "Add" opens a role menu and
 * picking a role stamps `roleId` on the moved items ("Remove" strips it).
 *
 * Callers own the templates; this owns the logic. Callers must be created
 * fresh per dataset (v-if / :key guarded) — the lists are copied once here.
 *
 * @param {object} options
 * @param {Array} options.source - initial source items
 * @param {Array} options.target - initial target items ({ ...item, roleId })
 * @param {Array|import('vue').Ref} options.roleOptions - assignable roles
 *   as { label, value }; may be reactive (e.g. computed from permissions)
 * @param {Function} options.emit - component emit; used for
 *   'update:source' / 'update:target'
 */
export function useRolePickList({ source, target, roleOptions, emit }) {
  const localSource = ref([...source])
  const localTarget = ref([...target])

  // Emit shallow copies so the parent never aliases (and can't mutate) the
  // internal arrays — the parent owns its own snapshot.
  watch(localSource, (newVal) => {
    emit('update:source', [...newVal])
  }, { deep: true })

  watch(localTarget, (newVal) => {
    emit('update:target', [...newVal])
  }, { deep: true })

  const selectionSource = ref([])
  const selectionTarget = ref([])
  const addMenu = ref()

  const addMenuItems = computed(() => toValue(roleOptions).map(option => ({
    label: `with ${option.label} role`,
    icon: 'pi pi-angle-right text-green-500',
    command: () => onSelectRole(option),
  })))

  function onSelectRole(option) {
    if (selectionSource.value.length > 0) {
      const itemsToMove = [...selectionSource.value]

      itemsToMove.forEach((item) => {
        item.roleId = option.value
        localTarget.value.push(item)
      })

      localSource.value = localSource.value.filter(item => !itemsToMove.includes(item))
      selectionSource.value = []

      // close the role menu now that the selection has been moved
      addMenu.value?.hide()
    }
  }

  function onMoveRight(event) {
    // open the role menu; picking a role moves the selection (see onSelectRole)
    addMenu.value.toggle(event)
  }

  function onMoveLeft() {
    if (selectionTarget.value.length > 0) {
      const itemsToMove = [...selectionTarget.value]
      // discard the role when moving back
      itemsToMove.forEach(item => delete item.roleId)

      localSource.value.push(...itemsToMove)
      localTarget.value = localTarget.value.filter(item => !itemsToMove.includes(item))
      selectionTarget.value = []
    }
  }

  function onMoveAllRight(event) {
    selectionSource.value = [...localSource.value]
    onMoveRight(event)
  }

  function onMoveAllLeft() {
    selectionTarget.value = [...localTarget.value]
    onMoveLeft()
  }

  return {
    localSource,
    localTarget,
    selectionSource,
    selectionTarget,
    addMenu,
    addMenuItems,
    onSelectRole,
    onMoveRight,
    onMoveLeft,
    onMoveAllRight,
    onMoveAllLeft,
  }
}
