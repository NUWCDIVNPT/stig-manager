// Optional visual skins. A skin is a stylesheet in public/skins/<name>.css
// whose rules are scoped to html[data-skin="<name>"], so loading it is harmless
// until the attribute is set. Chosen via ?skin=<name> (persisted) or the user menu.

import { readStoredValue, storeValue } from './localStorage.js'

export const SKIN_STORAGE_KEY = 'stigman:skin'
export const SKINS = ['lcars']
const LINK_ID = 'stigman-skin-stylesheet'

export function currentSkin() {
  const stored = readStoredValue(SKIN_STORAGE_KEY, '')
  return SKINS.includes(stored) ? stored : ''
}

export function applySkin(name) {
  if (typeof document === 'undefined') {
    return
  }
  const root = document.documentElement
  const existing = document.getElementById(LINK_ID)
  if (!name || !SKINS.includes(name)) {
    root.removeAttribute('data-skin')
    existing?.remove()
    storeValue(SKIN_STORAGE_KEY, '')
    return
  }
  const href = `${import.meta.env.BASE_URL}skins/${name}.css`
  if (existing) {
    if (existing.getAttribute('href') !== href) {
      existing.setAttribute('href', href)
    }
  }
  else {
    const link = document.createElement('link')
    link.id = LINK_ID
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }
  root.setAttribute('data-skin', name)
  storeValue(SKIN_STORAGE_KEY, name)
}

// `?skin=lcars` (or `?skin=` to clear) wins over the stored choice.
export function applyStoredSkin() {
  if (typeof window === 'undefined') {
    return
  }
  const fromQuery = new URLSearchParams(window.location.search).get('skin')
  applySkin(fromQuery !== null ? fromQuery : currentSkin())
}
