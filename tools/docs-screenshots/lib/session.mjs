import { config, routeUrl } from '../config.mjs'
import { TOURS } from '../../../clientV2/src/components/global/tours.js'

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
  await markToursSeen(page)
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

// Guided tours open on a view's first visit for a user who has not seen them, judged
// by webPreferences.tours in the GET /user response. Rewrite that response so every
// tour reads as seen, which needs no token and leaves the user's stored preferences alone.
async function markToursSeen(page) {
  const seen = Object.fromEntries(Object.keys(TOURS).map(id => [id, '9999-12-31']))
  await page.route(/\/api\/user(\?|$)/, async route => {
    const res = await route.fetch()
    let body
    try { body = await res.json() }
    catch { return route.fulfill({ response: res }) }
    body.webPreferences = { ...(body.webPreferences ?? {}), tours: { ...(body.webPreferences?.tours ?? {}), ...seen } }
    await route.fulfill({ response: res, json: body })
  })
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

// The Nav Rail state persists in localStorage, so it carries across entries in a
// context. Entries default to collapsed so the content stays the focus.
export async function setRail(page, expanded) {
  const toggle = page.locator('button.nav-rail-toggle').first()
  if (!await toggle.count()) return
  const label = await toggle.getAttribute('aria-label')
  const isExpanded = label === 'Collapse navigation'
  if (isExpanded !== expanded) {
    await toggle.click()
    await page.waitForTimeout(400)
  }
}
