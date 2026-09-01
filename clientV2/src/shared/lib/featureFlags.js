import { useEnv } from '../stores/useEnv.js'

// Generic reader for the server's experimental feature flags. The server
// serializes each flag as the literal string "true"/"false" (not a Boolean)
// — see api/source/bootstrap/client.js. Any other value, including unset,
// means disabled.
export function isExperimentalEnabled(flag) {
  try {
    return useEnv()?.experimental?.[flag] === 'true'
  }
  catch {
    return false
  }
}

export const isAppDataEnabled = () => isExperimentalEnabled('appData')

export const isLogStreamEnabled = () => isExperimentalEnabled('logStream')
