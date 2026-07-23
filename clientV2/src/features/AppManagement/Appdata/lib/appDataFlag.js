import { useEnv } from '../../../../shared/stores/useEnv.js'

// The server serializes this as the literal string "true"/"false" (not a
// Boolean) — see api/source/bootstrap/client.js. Any other value, including
// unset, means disabled.
export function isAppDataEnabled() {
  try {
    return useEnv()?.experimental?.appData === 'true'
  }
  catch {
    return false
  }
}
