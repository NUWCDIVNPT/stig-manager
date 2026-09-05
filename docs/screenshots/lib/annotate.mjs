// Draws callout overlays in the DOM before capture. Anchored to selectors so they
// follow the element when layout shifts. Shapes: ellipse (default), box, arrow.
const STYLE = { color: '#e5322d', width: 4, pad: 8 }

export async function addHighlights(page, highlights = []) {
  const boxes = []
  for (const h of highlights) {
    const box = await page.locator(h.selector).first().boundingBox()
    if (!box) throw new Error(`Highlight target not visible: ${h.selector}`)
    boxes.push({ ...h, box })
  }
  await page.evaluate(({ boxes, STYLE }) => {
    const root = document.createElement('div')
    root.id = '__shots_overlay'
    Object.assign(root.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 2147483647 })
    for (const { box, shape = 'ellipse', pad = STYLE.pad, color = STYLE.color, label, from } of boxes) {
      if (shape === 'arrow') {
        const ns = 'http://www.w3.org/2000/svg'
        const svg = document.createElementNS(ns, 'svg')
        svg.setAttribute('width', innerWidth); svg.setAttribute('height', innerHeight)
        svg.style.position = 'absolute'; svg.style.left = 0; svg.style.top = 0
        const tx = box.x + box.width / 2, ty = box.y + box.height / 2
        const side = from || 'right'
        const [sx, sy] = side === 'right' ? [box.x + box.width + 90, ty + 40]
          : side === 'left' ? [box.x - 90, ty + 40]
            : side === 'top' ? [tx + 60, box.y - 80]
              : [tx + 60, box.y + box.height + 80]
        const [ex, ey] = side === 'right' ? [box.x + box.width + pad, ty]
          : side === 'left' ? [box.x - pad, ty]
            : side === 'top' ? [tx, box.y - pad]
              : [tx, box.y + box.height + pad]
        const defs = document.createElementNS(ns, 'defs')
        defs.innerHTML = `<marker id="__shots_head" markerUnits="userSpaceOnUse" markerWidth="18" markerHeight="18" refX="14" refY="9" orient="auto"><path d="M0,0 L18,9 L0,18 z" fill="${color}"/></marker>`
        svg.appendChild(defs)
        const line = document.createElementNS(ns, 'line')
        line.setAttribute('x1', sx); line.setAttribute('y1', sy); line.setAttribute('x2', ex); line.setAttribute('y2', ey)
        line.setAttribute('stroke', color); line.setAttribute('stroke-width', STYLE.width); line.setAttribute('marker-end', 'url(#__shots_head)')
        svg.appendChild(line)
        root.appendChild(svg)
        if (label) {
          const t = document.createElement('div')
          t.textContent = label
          Object.assign(t.style, { position: 'absolute', left: `${sx}px`, top: `${sy}px`, transform: 'translate(-50%, 4px)', color, font: '600 16px system-ui, sans-serif', whiteSpace: 'nowrap' })
          root.appendChild(t)
        }
        continue
      }
      const d = document.createElement('div')
      Object.assign(d.style, {
        position: 'absolute',
        left: `${box.x - pad}px`, top: `${box.y - pad}px`,
        width: `${box.width + pad * 2}px`, height: `${box.height + pad * 2}px`,
        border: `${STYLE.width}px solid ${color}`,
        borderRadius: shape === 'ellipse' ? '50%' : '6px',
        boxSizing: 'border-box',
      })
      root.appendChild(d)
      if (label) {
        const t = document.createElement('div')
        t.textContent = label
        Object.assign(t.style, { position: 'absolute', left: `${box.x - pad}px`, top: `${box.y + box.height + pad + 4}px`, color, font: '600 16px system-ui, sans-serif', whiteSpace: 'nowrap' })
        root.appendChild(t)
      }
    }
    document.body.appendChild(root)
  }, { boxes, STYLE })
}

export async function removeHighlights(page) {
  await page.evaluate(() => document.getElementById('__shots_overlay')?.remove())
}
