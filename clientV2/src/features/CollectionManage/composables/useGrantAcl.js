import { ref } from 'vue'
import { fetchGrantAcl, replaceGrantAcl } from '../../../shared/api/grantsApi.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { aclRuleToPayload, normalizeAclRule } from '../lib/aclRules.js'

/**
 * Loads and saves a single grant's ACL rules.
 *
 * @returns {object} Reactive ACL state plus load/save actions.
 */
export function useGrantAcl() {
  const { triggerError } = useGlobalError()

  const defaultAccess = ref('rw')
  const rules = ref([])
  const isLoading = ref(false)
  const isSaving = ref(false)

  function applyResponse(response) {
    defaultAccess.value = response?.defaultAccess ?? 'rw'
    rules.value = (response?.acl ?? []).map(normalizeAclRule)
  }

  async function load(collectionId, grantId) {
    isLoading.value = true
    try {
      applyResponse(await fetchGrantAcl(collectionId, grantId))
    }
    catch (error) {
      triggerError(error)
    }
    finally {
      isLoading.value = false
    }
  }

  async function save(collectionId, grantId) {
    isSaving.value = true
    try {
      const payload = rules.value.map(aclRuleToPayload)
      applyResponse(await replaceGrantAcl(collectionId, grantId, payload))
      return true
    }
    catch (error) {
      triggerError(error)
      return false
    }
    finally {
      isSaving.value = false
    }
  }

  return { defaultAccess, rules, isLoading, isSaving, load, save }
}
