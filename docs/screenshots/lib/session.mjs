import { config, routeUrl } from '../config.mjs'

const NO_MOTION_CSS = `*, *::before, *::after {
  transition-duration: 0s !important; transition-delay: 0s !important;
  animation-duration: 0s !important; animation-delay: 0s !important;
  caret-color: transparent !important;
}
/* Vite/Vue devtools overlay in dev mode */
#vue-devtools-anchor, [id^="vue-devtools"], vue-devtools-container, .vue-devtools__anchor { display: none !important; }`

// Opens a browser context logged in as `user` through the mock OIDC form.
export async function login(browser, user, { scale = config.deviceScaleFactor } = {}) {
  const context = await browser.newContext({
    viewport: config.viewport,
    deviceScaleFactor: scale,
    colorScheme: user.colorScheme || 'light',
  })
  const page = await context.newPage()
  await page.goto(routeUrl('/'))
  // The client redirects to the mock provider's form
  await page.waitForSelector('#username', { timeout: 30_000 })
  await page.fill('#username', user.username)
  await page.setChecked('#privilege-admin', !!user.admin)
  await page.setChecked('#privilege-create-collection', user.createCollection ?? true)
  await page.click('input[type="submit"], button[type="submit"]')
  await page.waitForURL(u => u.href.startsWith(config.clientUrl), { timeout: 30_000 })
  await page.waitForSelector(config.readySelector, { timeout: 30_000 })
  await page.addStyleTag({ content: NO_MOTION_CSS })
  await dismissWhatsNew(page)
  return { context, page }
}

// The What's New dialog opens on a user's first visit; suppress it for the session.
async function dismissWhatsNew(page) {
  const dontShow = page.getByRole('button', { name: /Don't show these features again/i })
  try {
    await dontShow.waitFor({ state: 'visible', timeout: 5000 })
    await dontShow.click()
    await dontShow.waitFor({ state: 'hidden', timeout: 5000 })
  }
  catch { /* dialog did not appear */ }
}
