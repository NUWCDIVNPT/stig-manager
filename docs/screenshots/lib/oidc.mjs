// Hosts clientV2's mock OIDC provider in-process so tokens can be minted for seeding
// and the browser can log in through its form.
import MockOidc from '../../../clientV2/mockOidc.js'

export async function startOidc(port) {
  const oidc = new MockOidc()
  await oidc.start({ port })
  return oidc
}

export function adminToken(oidc, { username = 'admin', expiresIn = '8h' } = {}) {
  return oidc.getToken({ username, privileges: ['create_collection', 'admin'], expiresIn })
}
