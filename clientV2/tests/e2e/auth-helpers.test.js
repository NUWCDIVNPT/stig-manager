import { setupAuthMocks } from '../utils/mocks.js'
import { expect, test, testUsers } from '../utils/testExtentions.js'

// Utility to pull raw localStorage values for validation
async function readAuthStorage(page) {
  return page.evaluate(() => ({
    token: localStorage.getItem('oidc.token'),
    tokenParsed: localStorage.getItem('oidc.tokenParsed'),
    refresh: localStorage.getItem('oidc.refreshToken'),
  }))
}

test.describe('Auth Helpers Integration', () => {
  test('default admin bootstrap provides admin user', async ({ page, getCurrentUser }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const user = await getCurrentUser()
    expect(user).toBeTruthy()
    expect(user.preferred_username).toBe(testUsers.admin.username)
  })

  test('can switch between all testUsers and reflect preferred_username', async ({ page, loginAs, getCurrentUser }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    for (const key of Object.keys(testUsers)) {
      await loginAs(key)
      const current = await getCurrentUser()
      expect(current).toBeTruthy()
      expect(current.preferred_username).toBe(testUsers[key].username)
    }
  })

  test('manual token removal yields null user; built-in logout reload re-injects auth', async ({ page, getCurrentUser, logout }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const initial = await getCurrentUser()
    expect(initial).toBeTruthy()

    // Manually simulate logout WITHOUT reload so initScript does not re-run yet
    await page.evaluate(() => {
      localStorage.removeItem('oidc.token')
      localStorage.removeItem('oidc.tokenParsed')
      localStorage.removeItem('oidc.refreshToken')
    })
    const manualStorage = await readAuthStorage(page)
    expect(manualStorage.token).toBeNull()
    expect(manualStorage.tokenParsed).toBeNull()
    expect(manualStorage.refresh).toBeNull()
    const manualUser = await getCurrentUser()
    expect(manualUser).toBeNull()

    // Now use provided logout helper (which reloads) – init script re-adds tokens
    await logout()
    const postLogoutUser = await getCurrentUser()
    expect(postLogoutUser).toBeTruthy() // Rehydrated due to addInitScript
    expect(postLogoutUser.preferred_username).toBe(testUsers.admin.username)
  })

  test('manual setupAuthMocks overrides current user (collectionOwner)', async ({ page, getCurrentUser }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Initially admin (fixture bootstrap)
    const adminUser = await getCurrentUser()
    expect(adminUser.preferred_username).toBe(testUsers.admin.username)

    // Manually invoke setupAuthMocks with collectionOwner
    await setupAuthMocks(page, testUsers.collectionOwner)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    const ownerUser = await getCurrentUser()
    expect(ownerUser).toBeTruthy()
    expect(ownerUser.preferred_username).toBe(testUsers.collectionOwner.username)
  })

  test('loginAs throws on unknown user key', async ({ loginAs }) => {
    await expect(loginAs('no_such_user')).rejects.toThrow(/Unknown user:/)
  })
})
