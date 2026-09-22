import { readdirSync } from 'node:fs'
import { join } from 'node:path'

export const SRC_ROOT = join(import.meta.dirname, '..')

// Directories holding test-only components; convention tests scan components,
// not fixtures.
const SKIPPED_DIRS = new Set(['tests', 'testUtils'])

// Every file under src/ with one of the given extensions, for convention tests
// that scan source. Test files are skipped.
export function* sourceFiles(extensions, dir = SRC_ROOT) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) {
        yield* sourceFiles(extensions, full)
      }
    }
    else if (!entry.name.endsWith('.test.js') && extensions.some(ext => entry.name.endsWith(ext))) {
      yield full
    }
  }
}

// Every component .vue file under src/.
export function vueSourceFiles() {
  return sourceFiles(['.vue'])
}
