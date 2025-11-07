import { test as base } from '@playwright/test'
import { getCurrentUser, logout, setupAuthMocks, testUsers } from './mocks.js'

/**
 * Extended test function with authentication helpers
 */
export const test = base.extend({
  /**
   * Auto-setup auth mocks before each test
   * This runs before page navigation to ensure workers are mocked
   */
  page: async ({ page }, use) => {
    // Set up auth mocks with admin user by default
    await setupAuthMocks(page, testUsers.admin)
    await use(page)
  },

  /**
   * Fixture: loginAs(userKey)
   * Switch to a different user
   *
   * Usage:
   *   test('my test', async ({ page, loginAs }) => {
   *     await page.goto('/')
   *     await loginAs('collectionOwner')
   *     // Now logged in as collection owner
   *   })
   */
  loginAs: async ({ page }, use) => {
    const loginAs = async (userKey) => {
      const user = testUsers[userKey]
      if (!user) {
        throw new Error(`Unknown user: ${userKey}. Available: ${Object.keys(testUsers).join(', ')}`)
      }

      console.log(`Switching to user: ${user.username}`)

      await setupAuthMocks(page, user)

      await page.reload()
      await page.waitForLoadState('domcontentloaded')

      console.log(`Successfully switched to: ${user.username}`)
    }
    await use(loginAs)
  },

  /**
   * Fixture: getCurrentUser()
   * Get the currently logged-in user's info
   */
  getCurrentUser: async ({ page }, use) => {
    await use(() => getCurrentUser(page))
  },

  /**
   * Fixture: logout()
   * Logout the current user
   */
  logout: async ({ page }, use) => {
    await use(() => logout(page))
  },
})

// Re-export expect for convenience
export { expect } from '@playwright/test'

// Export test users for direct access
export { testUsers }
