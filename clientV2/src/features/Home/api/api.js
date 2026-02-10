import { apiCall } from '../../../shared/api/apiClient.js'

export function fetchAppManagers() {
  return apiCall('getUsers', { privilege: 'admin', status: 'available' })
}
