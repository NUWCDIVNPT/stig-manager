import { computed, ref } from 'vue'

export function useChecklistDisplayMode() {
  const displayMode = ref('groupRule')

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

  return {
    displayMode,
    displayModeItems,
    showGroupId,
    showRuleId,
    showRuleTitle,
    showGroupTitle,
  }
}
