import { apiCall } from './apiClient.js'

export function fetchGrantsByCollection(collectionId, { elevate } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch grants.')
  }
  const params = { collectionId }
  if (elevate) {
    params.elevate = elevate
  }
  return apiCall('getGrantsByCollection', params)
}

export function createGrants(collectionId, grants, { elevate } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to create grants.')
  }
  const params = { collectionId }
  if (elevate) {
    params.elevate = elevate
  }
  return apiCall('postGrantsByCollection', params, grants)
}

export function updateGrant(collectionId, grantId, body, { elevate } = {}) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to update a grant.')
  }
  const params = { collectionId, grantId }
  if (elevate) {
    params.elevate = elevate
  }
  return apiCall('putGrantByCollectionGrant', params, body)
}

export function deleteGrant(collectionId, grantId, { elevate } = {}) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to delete a grant.')
  }
  const params = { collectionId, grantId }
  if (elevate) {
    params.elevate = elevate
  }
  return apiCall('deleteGrantByCollectionGrant', params)
}

export function fetchGrantByCollectionGrant(collectionId, grantId, { elevate } = {}) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to fetch a grant.')
  }
  const params = { collectionId, grantId }
  if (elevate) {
    params.elevate = elevate
  }
  return apiCall('getGrantByCollectionGrant', params)
}

export function fetchGrantAcl(collectionId, grantId) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to fetch grant ACL.')
  }
  return apiCall('getAclRulesByCollectionGrant', { collectionId, grantId })
}

export function replaceGrantAcl(collectionId, grantId, acl) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to replace grant ACL.')
  }
  return apiCall('putAclRulesByCollectionGrant', { collectionId, grantId }, acl)
}

export function fetchEffectiveAclByCollectionUser(collectionId, userId) {
  if (!collectionId || !userId) {
    throw new Error('A collectionId and userId are required to fetch effective ACL.')
  }
  return apiCall('getEffectiveAclByCollectionUser', { collectionId, userId })
}
