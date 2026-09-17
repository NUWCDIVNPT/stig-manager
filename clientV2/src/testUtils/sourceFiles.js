import { readdirSync } from 'node:fs'
import { join } from 'node:path'

export const SRC_ROOT = join(import.meta.dirname, '..')

// Every .vue file under src/, for convention tests that scan components.
export function* vueSourceFiles(dir = SRC_ROOT) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* vueSourceFiles(full)
    }
    else if (entry.name.endsWith('.vue')) {
      yield full
    }
  }
}
