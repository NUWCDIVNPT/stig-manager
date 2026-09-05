// Cross-checks the docs against the manifest:
//  - every image a doc references must come from a manifest entry or be listed as static
//  - manifest entries no doc references are reported
//  - image files in assets/images that nothing references are reported
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { config } from './config.mjs'
import { manifest } from './manifest.mjs'
import { staticImages } from './static-images.mjs'

const docsRoot = path.join(config.repoRoot, 'docs')
const rstFiles = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    if (name === '_build' || name === 'node_modules') continue
    if (statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.rst')) rstFiles.push(p)
  }
})(docsRoot)

const referenced = new Map() // image -> [file:line]
for (const f of rstFiles) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(/\.\.\s+(?:thumbnail|image|figure)::\s*(\S+)/)
    if (m) {
      const img = path.basename(m[1])
      if (!referenced.has(img)) referenced.set(img, [])
      referenced.get(img).push(`${path.relative(docsRoot, f)}:${i + 1}`)
    }
  })
}

const generated = new Set(manifest.map(e => e.file))
const statics = new Set(staticImages)
const problems = []

for (const [img, where] of referenced) {
  if (!generated.has(img) && !statics.has(img)) problems.push(`no source for referenced image ${img} (${where[0]})`)
}
for (const e of manifest) {
  if (!referenced.has(e.file)) problems.push(`manifest entry "${e.file}" is not referenced by any doc`)
}
const onDisk = readdirSync(config.outDir)
for (const img of onDisk) {
  if (!referenced.has(img)) problems.push(`unreferenced file assets/images/${img}`)
}
for (const img of [...generated, ...statics]) {
  if (!onDisk.includes(img)) problems.push(`missing file assets/images/${img}`)
}

if (problems.length) {
  console.log(problems.map(p => `- ${p}`).join('\n'))
  console.log(`\n${problems.length} problem(s)`)
  process.exit(process.argv.includes('--strict') ? 1 : 0)
}
else console.log('docs, manifest and assets/images are consistent')
