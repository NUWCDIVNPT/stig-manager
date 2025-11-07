import { expect, test } from '../utils/testExtentions.js'

test.describe('Logout Tests', () => {
  test('admin can open collections node and select Collection X', async ({ page, getCurrentUser }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const user = await getCurrentUser()
    expect(user).toBeTruthy()
    expect(user.preferred_username).toBe('admin')

    await page.waitForTimeout(1000)

    const collectionsToggle = page.locator('.tree-toggle-btn').nth(1)
    await expect(collectionsToggle).toBeVisible()
    await collectionsToggle.click()

    await page.waitForTimeout(1000)

    const collection = page.getByText('Collection X')
    await expect(collection).toBeVisible()
    await collection.click()

    await page.waitForTimeout(1000)

    const comp = page.getByText('in CollecitonVue.vue')

    await expect(comp).toBeVisible()
  })
})
