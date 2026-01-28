import { smFetch } from '../../../shared/api/smFetch.js'

export function fetchAppManagers() {
  return smFetch('/users?privilege=admin&status=available')
}
