import { ref } from 'vue'
import { fetchGrantAcl, replaceGrantAcl } from '../../../shared/api/grantsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { aclRuleToPayload, normalizeAclRule } from '../lib/aclRules.js'

/**
 * Loads and saves a single grant's ACL rules.
 *
 * `rules` is a writable copy of the server's ACL that the editor mutates
 * directly; `defaultAccess` mirrors the server value. Both are re-applied from
 * the response after every load/save. Errors are routed to the global error
 * modal by `useAsyncState`.
 *
 * @returns {object} Reactive ACL state plus load/save actions.
 */
export function useGrantAcl() {
  const defaultAccess = ref('rw')
  const rules = ref([])

  function applyResponse(response) {
    defaultAccess.value = response?.defaultAccess ?? 'rw'
    rules.value = (response?.acl ?? []).map(normalizeAclRule)
  }

  const { isLoading, execute: executeLoad } = useAsyncState(
    (collectionId, grantId) => fetchGrantAcl(collectionId, grantId),
    { immediate: false },
  )

  const { isLoading: isSaving, execute: executeSave } = useAsyncState(
    (collectionId, grantId, payload) => replaceGrantAcl(collectionId, grantId, payload),
    { immediate: false },
  )

  async function load(collectionId, grantId) {
    const response = await executeLoad(collectionId, grantId)
    if (response) {
      applyResponse(response)
    }
  }

  async function save(collectionId, grantId) {
    const payload = rules.value.map(aclRuleToPayload)
    const response = await executeSave(collectionId, grantId, payload)
    if (!response) {
      return false
    }
    applyResponse(response)
    return true
  }

  return { defaultAccess, rules, isLoading, isSaving, load, save }
}
