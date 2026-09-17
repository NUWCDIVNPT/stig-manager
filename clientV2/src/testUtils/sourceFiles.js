import { readdirSync } from 'node:fs'
import { join } from 'node:path'

export const SRC_ROOT = join(import.meta.dirname, '..')

// Directories holding test-only components; convention tests scan components,
// not fixtures.
const SKIPPED_DIRS = new Set(['tests', 'testUtils'])

// Every component .vue file under src/, for convention tests that scan them.
export function* vueSourceFiles(dir = SRC_ROOT) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) {
        yield* vueSourceFiles(full)
      }
    }
    else if (entry.name.endsWith('.vue')) {
      yield full
    }
  }
}
