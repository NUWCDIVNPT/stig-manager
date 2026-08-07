import { klona } from '../../../../shared/lib/klona.js'

export function generateSharable(data, options) {
  const kloned = klona(data)
  const { collections, requests, users, groups, nodejs } = kloned
  if (options.collectionName) {
    const padLength = Object.keys(collections).at(-1)?.length
    for (const id in collections) {
      collections[id].name = id.padStart(padLength, '0')
    }
  }
  if (options.userAndGroupName) {
    const padLengthUsers = Object.keys(users.userInfo).at(-1)?.length
    for (const id in users.userInfo) {
      users.userInfo[id].username = id.padStart(padLengthUsers, '0')
    }
    const padLengthGroups = Object.keys(groups).at(-1)?.length
    for (const id in groups) {
      groups[id].name = id.padStart(padLengthGroups, '0')
    }
  }
  if (options.clientId) {
    obfuscateClients(requests.operationIds)
  }
  if (options.envvar) {
    delete nodejs.environment
  }
  return kloned

  function obfuscateClients(operationIds) {
    const obfuscationMap = {
      [STIGMAN.Env.oauth.clientId]: 'webapp',
    }
    let obfuscatedCounter = 1

    function getObfuscatedKey(client) {
      if (client === 'unknown' || client === 'webapp') {
        return client
      }
      if (!obfuscationMap[client]) {
        obfuscationMap[client] = `client${obfuscatedCounter++}`
      }
      return obfuscationMap[client]
    }

    for (const id in operationIds) {
      if (operationIds[id].clients) {
        const clients = operationIds[id].clients
        const newClients = {}
        for (const client in clients) {
          const obfuscatedName = getObfuscatedKey(client)
          newClients[obfuscatedName] = clients[client]
        }
        operationIds[id].clients = newClients
      }
    }
  }
}
