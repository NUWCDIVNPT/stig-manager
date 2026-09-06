// node capture.mjs capture [--only <substring>]   write screenshots into assets/images
// node capture.mjs check   [--only <substring>]   capture to .out/ and diff against assets/images
// node capture.mjs sheet                          write .out/sheet.html for review
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { config, routeUrl } from './config.mjs'
import { manifest, users } from './manifest.mjs'
import { buildLookup } from './lib/lookup.mjs'
import { login } from './lib/session.mjs'
import { runSteps } from './lib/steps.mjs'
import { addHighlights, removeHighlights } from './lib/annotate.mjs'

const [mode = 'capture', ...rest] = process.argv.slice(2)
const only = rest.includes('--only') ? rest[rest.indexOf('--only') + 1] : null
const headed = rest.includes('--headed')

if (mode === 'sheet') { writeSheet(); process.exit(0) }
if (!['capture', 'check'].includes(mode)) { console.error('mode must be capture | check | sheet'); process.exit(1) }

const entries = manifest.filter(e => !only || e.file.includes(only))
if (!entries.length) { console.error(`no manifest entries match "${only}"`); process.exit(1) }
const targetDir = mode === 'capture' ? config.outDir : path.join(config.workDir, 'shots')
mkdirSync(targetDir, { recursive: true })
mkdirSync(path.join(config.workDir, 'diff'), { recursive: true })

const lookup = await buildLookup()
const browser = await chromium.launch({ headless: !headed })
const results = []

// One logged-in context per user and device scale; entries run in manifest order within it.
const groups = new Map()
for (const e of entries) {
  const key = `${e.user || 'admin'}|${e.scale || config.deviceScaleFactor}`
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(e)
}

for (const [key, userEntries] of groups) {
  const [userKey, scale] = key.split('|')
  const user = users[userKey]
  if (!user) throw new Error(`manifest user "${userKey}" is not defined in users`)
  const { context, page } = await login(browser, user, { scale: Number(scale) })
  for (const e of userEntries) {
    const t0 = Date.now()
    try {
      if (e.viewport) await page.setViewportSize(e.viewport)
      const route = typeof e.route === 'function' ? await e.route(lookup) : e.route
      if (route) await page.goto(routeUrl(route), { waitUntil: 'load' })
      await runSteps(page, e.steps, lookup)
      await page.waitForLoadState('load')
      await page.waitForTimeout(e.settleMs ?? config.settleMs)
      if (e.highlights?.length) await addHighlights(page, e.highlights)
      const outPath = path.join(targetDir, e.file)
      if (e.clip) {
        // Element clip, optionally padded so the element keeps some surrounding context
        const box = await page.locator(e.clip).first().boundingBox()
        if (!box) throw new Error(`clip target not visible: ${e.clip}`)
        const pad = e.clipPad ?? 0
        const vp = page.viewportSize()
        const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad)
        const clip = { x, y, width: Math.min(vp.width - x, box.width + pad * 2), height: Math.min(vp.height - y, box.height + pad * 2) }
        await page.screenshot({ path: outPath, animations: 'disabled', clip })
      }
      else {
        await page.screenshot({ path: outPath, animations: 'disabled', fullPage: !!e.fullPage })
      }
      await removeHighlights(page)
      if (e.viewport) await page.setViewportSize(config.viewport)
      const r = { file: e.file, ms: Date.now() - t0 }
      if (mode === 'check') Object.assign(r, compare(e.file, outPath))
      results.push(r)
      console.log(`ok   ${e.file}${r.drift != null ? `  drift=${(r.drift * 100).toFixed(2)}%${r.stale ? '  STALE' : ''}` : ''}`)
    }
    catch (err) {
      results.push({ file: e.file, error: err.message.split('\n')[0] })
      console.log(`FAIL ${e.file}: ${err.message.split('\n')[0]}`)
      await removeHighlights(page).catch(() => {})
      await page.screenshot({ path: path.join(config.workDir, `failed-${e.file}`) }).catch(() => {})
    }
  }
  await context.close()
}
await browser.close()

const failed = results.filter(r => r.error)
const stale = results.filter(r => r.stale)
console.log(`\n${results.length - failed.length}/${results.length} captured${mode === 'check' ? `, ${stale.length} stale` : ''}${failed.length ? `, ${failed.length} failed` : ''}`)
writeFileSync(path.join(config.workDir, 'results.json'), JSON.stringify(results, null, 2))
process.exit(failed.length || (mode === 'check' && stale.length) ? 1 : 0)

function compare(file, freshPath) {
  const committedPath = path.join(config.outDir, file)
  if (!existsSync(committedPath)) return { drift: 1, stale: true, reason: 'missing' }
  const a = PNG.sync.read(readFileSync(committedPath))
  const b = PNG.sync.read(readFileSync(freshPath))
  if (a.width !== b.width || a.height !== b.height) return { drift: 1, stale: true, reason: `size ${a.width}x${a.height} vs ${b.width}x${b.height}` }
  const diff = new PNG({ width: a.width, height: a.height })
  const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: config.pixelmatchThreshold })
  const drift = changed / (a.width * a.height)
  const stale = drift > config.driftThreshold
  if (stale) writeFileSync(path.join(config.workDir, 'diff', file), PNG.sync.write(diff))
  return { drift, stale }
}

function writeSheet() {
  mkdirSync(config.workDir, { recursive: true })
  const rel = p => path.relative(config.workDir, p)
  const rows = manifest.map(e => `
    <figure>
      <a href="${rel(path.join(config.outDir, e.file))}" target="_blank"><img src="${rel(path.join(config.outDir, e.file))}" loading="lazy"></a>
      <figcaption><b>${e.file}</b><br><small>${e.section || ''}</small></figcaption>
    </figure>`).join('')
  const html = `<!doctype html><meta charset="utf-8"><title>Docs screenshots</title>
<style>body{font:14px system-ui;margin:20px}figure{display:inline-block;width:480px;margin:8px;vertical-align:top}img{width:100%;border:1px solid #ccc}figcaption{padding:4px 0}</style>
<h1>Docs screenshots (${manifest.length})</h1>${rows}`
  const out = path.join(config.workDir, 'sheet.html')
  writeFileSync(out, html)
  console.log(`wrote ${out}`)
}
