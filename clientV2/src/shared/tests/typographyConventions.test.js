import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sourceFiles, SRC_ROOT } from '../../testUtils/sourceFiles.js'
import { TEXT_SCALE_REM } from '../lib/textScale.js'

// Two font families and one type scale, declared once in style.css.
// Components size text with the --text-* tokens (or --icon-xs for standalone
// glyphs, or --cell-font-size which the density grids derive from the scale)
// and set a family only to var(--font-mono) or inherit. style.css itself owns
// the :root px size, the @font-face rules and the body family.

const STYLE_CSS = join(SRC_ROOT, 'style.css')
const ALLOWED_SIZE = /^(?:var\(--text-[a-z0-9-]+\)|var\(--icon-xs\)|var\(--cell-font-size\)|inherit)(?: !important)?$/
const ALLOWED_FAMILY = /^(?:var\(--font-mono\)|inherit)$/

function styleBlocks(path, src) {
  if (path.endsWith('.css')) {
    return [src]
  }
  return [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1])
}

function declarations(src, property) {
  const re = new RegExp(`${property}:\\s*([^;}"'\`]+?)\\s*(?=[;}"'\`]|$)`, 'g')
  return [...src.matchAll(re)].map(m => ({ value: m[1].trim(), line: src.slice(0, m.index).split('\n').length }))
}

const files = [...sourceFiles(['.vue', '.css', '.js'])]
  .filter(p => p !== STYLE_CSS)
  .map(p => ({ path: relative(SRC_ROOT, p), src: readFileSync(p, 'utf8') }))

describe('typography conventions', () => {
  it('scans the source tree', () => {
    expect(files.length).toBeGreaterThan(200)
  })

  it('sizes text only with the scale tokens', () => {
    const offenders = []
    for (const f of files) {
      for (const { value, line } of declarations(f.src, 'font-size')) {
        if (!ALLOWED_SIZE.test(value)) {
          offenders.push(`${f.path}:${line} font-size: ${value}`)
        }
      }
      for (const m of f.src.matchAll(/fontSize:\s*'([^']+)'/g)) {
        if (!ALLOWED_SIZE.test(m[1])) {
          offenders.push(`${f.path} fontSize: '${m[1]}'`)
        }
      }
      for (const block of styleBlocks(f.path, f.src)) {
        for (const m of block.matchAll(/^ *font:([^;]+);/gm)) {
          if (m[1].trim() !== 'inherit') {
            offenders.push(`${f.path} font shorthand: ${m[1].trim()}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('sets a font family only to the mono token or inherit', () => {
    const offenders = []
    for (const f of files) {
      for (const { value, line } of declarations(f.src, 'font-family')) {
        if (!ALLOWED_FAMILY.test(value)) {
          offenders.push(`${f.path}:${line} font-family: ${value}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps textScale.js equal to the style.css tokens', () => {
    const css = readFileSync(STYLE_CSS, 'utf8')
    const tokens = Object.fromEntries([...css.matchAll(/--text-([a-z0-9]+):\s*([\d.]+)rem;/g)].map(m => [m[1], Number(m[2])]))
    expect(tokens).toMatchObject(TEXT_SCALE_REM)
  })
})
