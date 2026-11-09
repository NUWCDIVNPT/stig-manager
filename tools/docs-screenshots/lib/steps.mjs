import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { routeUrl } from '../config.mjs'

const PKG_DIR = fileURLToPath(new URL('..', import.meta.url))

// Small step vocabulary so manifest entries stay declarative.
// A step is [op, ...args]. Selectors are Playwright selector strings
// (css, text=, role=button[name="X"], etc.).
const ops = {
  // route may be a function of the lookup context, like a manifest entry's route
  goto: (page, route, ctx) => page.goto(routeUrl(typeof route === 'function' ? route(ctx) : route), { waitUntil: 'load' }),
  click: (page, sel, opts) => page.locator(sel).first().click(opts),
  dblclick: (page, sel) => page.locator(sel).first().dblclick(),
  hover: (page, sel) => page.locator(sel).first().hover(),
  fill: (page, sel, text) => page.locator(sel).first().fill(text),
  press: (page, key) => page.keyboard.press(key),
  wait: (page, ms) => page.waitForTimeout(ms),
  waitFor: (page, sel, state = 'visible') => page.locator(sel).first().waitFor({ state }),
  idle: page => page.waitForLoadState('load'),
  scrollTo: (page, sel) => page.locator(sel).first().scrollIntoViewIfNeeded(),
  check: (page, sel) => page.locator(sel).first().check(),
  // click a control that opens the file chooser, then supply files (paths relative to tools/docs-screenshots)
  upload: async (page, sel, ...files) => {
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator(sel).first().click()])
    await chooser.setFiles(files.map(f => path.resolve(PKG_DIR, f)))
  },
  // escape hatch: async (page, ctx) => {}
  run: (page, fn, ctx) => fn(page, ctx),
}

export async function runSteps(page, steps = [], ctx) {
  for (const step of steps) {
    const [op, ...args] = step
    const fn = ops[op]
    if (!fn) throw new Error(`Unknown step op "${op}"`)
    if (op === 'run' || op === 'goto') await fn(page, args[0], ctx)
    else await fn(page, ...args)
  }
}
