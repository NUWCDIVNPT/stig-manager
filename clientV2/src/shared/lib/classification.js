/**
 * Maps an API classification code to banner presentation. Unknown codes and
 * 'NONE' hide the banner, matching the legacy client.
 */
const BANNERS = {
  U: { cls: 'unclassified', text: 'UNCLASSIFIED (U)' },
  CUI: { cls: 'cui', text: 'CONTROLLED (CUI)' },
  // FOUO is treated as controlled but uses its own color class
  FOUO: { cls: 'fouo', text: 'CONTROLLED (FOUO)' },
  C: { cls: 'confidential', text: 'CONFIDENTIAL (C)' },
  S: { cls: 'secret', text: 'SECRET (S)' },
  TS: { cls: 'topsecret', text: 'TOP SECRET (TS)' },
  SCI: { cls: 'sci', text: 'TOP SECRET / SCI (TS/SCI)' },
}

export function classificationBanner(apiClassification) {
  const banner = BANNERS[apiClassification]
  return banner
    ? { showBanner: true, classificationCls: banner.cls, classificationText: banner.text }
    : { showBanner: false }
}
