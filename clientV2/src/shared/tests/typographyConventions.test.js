import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sourceFileContents, SRC_ROOT } from '../../testUtils/sourceFiles.js'
import { TEXT_SCALE_REM } from '../lib/textScale.js'

// Enforces docs/components/TypographyAndSizing.md: every font-size is a
// --text-* token (or --icon-xs for a standalone glyph, or --cell-font-size
// which the density grids set from a token) and every font-family is
// var(--font-mono) or inherit. style.css declares the tokens and is exempt.

const STYLE_CSS = join(SRC_ROOT, 'style.css')
const ALLOWED_SIZE = new Set([
  ...Object.keys(TEXT_SCALE_REM).map(k => `var(--text-${k})`),
  'var(--icon-xs)',
  'var(--cell-font-size)',
  'inherit',
])
const ALLOWED_FAMILY = new Set(['var(--font-mono)', 'inherit'])

// Every `<property>: <value>` in the file, whether a CSS declaration, a pt
// string or a style-object key (`fontSize: '...'`). Also catches the `font:`
// shorthand when asked for 'font', since the hyphen keeps font-size and
// font-family from matching it.
function declarations(src, ...properties) {
  const re = new RegExp(`\\b(?:${properties.join('|')})\\s*:\\s*['"\`]?([^;}'"\`]+?)\\s*(?=[;}'"\`]|$)`, 'gm')
  return [...src.matchAll(re)].map(m => ({ value: m[1].replace(/\s*!important$/, ''), index: m.index }))
}

function offender(file, index, text) {
  return `${file.path}:${file.src.slice(0, index).split('\n').length} ${text}`
}

const files = sourceFileContents(['.vue', '.css', '.js']).filter(f => join(SRC_ROOT, f.path) !== STYLE_CSS)

describe('typography conventions', () => {
  it('sizes text only with the scale tokens', () => {
    const offenders = []
    for (const f of files) {
      for (const { value, index } of declarations(f.src, 'font-size', 'fontSize')) {
        if (!ALLOWED_SIZE.has(value)) {
          offenders.push(offender(f, index, `font-size: ${value}`))
        }
      }
      for (const { value, index } of declarations(f.src, 'font')) {
        if (value !== 'inherit') {
          offenders.push(offender(f, index, `font shorthand: ${value}`))
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('sets a font family only to the mono token or inherit', () => {
    const offenders = []
    for (const f of files) {
      for (const { value, index } of declarations(f.src, 'font-family', 'fontFamily')) {
        if (!ALLOWED_FAMILY.has(value)) {
          offenders.push(offender(f, index, `font-family: ${value}`))
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('keeps textScale.js equal to the style.css tokens', () => {
    const css = readFileSync(STYLE_CSS, 'utf8')
    const tokens = Object.fromEntries([...css.matchAll(/--text-([a-z0-9-]+):\s*([\d.]+)rem;/g)].map(m => [m[1], Number(m[2])]))
    expect(tokens).toEqual(TEXT_SCALE_REM)
  })
})
