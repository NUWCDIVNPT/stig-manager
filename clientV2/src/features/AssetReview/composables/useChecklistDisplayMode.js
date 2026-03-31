import { computed, ref } from 'vue'

// Shared state across all consumers
const displayMode = ref('groupRule')
const lineClamp = ref(3)

export function useChecklistDisplayMode() {
  const displayModeItems = ref([
    {
      label: 'Group/Rule display',
      items: [
        {
          label: 'Group ID and Rule title',
          icon: () => displayMode.value === 'groupRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
          command: () => { displayMode.value = 'groupRule' },
        },
        {
          label: 'Group ID and Group title',
          icon: () => displayMode.value === 'groupGroup' ? 'pi pi-circle-fill' : 'pi pi-circle',
          command: () => { displayMode.value = 'groupGroup' },
        },
        {
          label: 'Rule ID and Rule title',
          icon: () => displayMode.value === 'ruleRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
          command: () => { displayMode.value = 'ruleRule' },
        },
      ],
    },
  ])

  const showGroupId = computed(() => displayMode.value !== 'ruleRule')
  const showRuleId = computed(() => displayMode.value === 'ruleRule')
  const showRuleTitle = computed(() => displayMode.value !== 'groupGroup')
  const showGroupTitle = computed(() => displayMode.value === 'groupGroup')

  // Row height control (line-clamp 1-10, default 3)
  const itemSize = computed(() => (15 * lineClamp.value) + 6)

  function increaseRowHeight() {
    if (lineClamp.value < 10) {
      lineClamp.value++
    }
  }

  function decreaseRowHeight() {
    if (lineClamp.value > 1) {
      lineClamp.value--
    }
  }

  return {
    displayMode,
    displayModeItems,
    showGroupId,
    showRuleId,
    showRuleTitle,
    showGroupTitle,
    lineClamp,
    itemSize,
    increaseRowHeight,
    decreaseRowHeight,
  }
}
