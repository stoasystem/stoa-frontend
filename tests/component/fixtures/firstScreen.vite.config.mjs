/*
 * The production build of vite.config.ts, plus a report of what the first
 * screen loads (firstScreenChunks415.test.ts), written to the file named by
 * FIRST_SCREEN_REPORT. Plain JavaScript: the test project's TypeScript
 * settings are not the ones vite.config.ts is checked with.
 *
 * The first screen imports what src/main.tsx imports, the modules its start-up
 * imports on demand (the stylesheet, i18n, React, the App), and everything
 * those import statically. Its chunks are the ones that load before the first
 * render: the entry, the chunks that hold those start-up imports, and the
 * chunks these import statically (#456 audit: a chunk merely holding a module
 * the first screen imports may still load later). Among them is the
 * stylesheet's empty stub, which Vite drops from the output after this runs;
 * not among them is the de, fr or it copy i18n loads before the first render,
 * which imports nothing. For every chunk the report
 * lists the installed packages' modules in it that the first screen never
 * imports: in a first-screen chunk, that is code every visitor downloads for
 * a page they may never open.
 *
 * "Imports" follows the module graph before tree-shaking, so a module a
 * package's index re-exports counts as imported wherever the index is, used or
 * not: lucide-react's icons, for one, all count as the first screen's.
 *
 * Each entry: { name, fileName, firstScreen, notImported: ['package/path', ...] }.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { mergeConfig } from 'vite'
import config from '../../../vite.config.ts'

const ROOT = path.resolve(import.meta.dirname, '../../..')
const ENTRY = path.join(ROOT, 'src/main.tsx')

// Below the outermost node_modules/, so a copy nested under a package is named
// with it: `@radix-ui/react-tabs/node_modules/@radix-ui/react-slot/...`.
function installedPath(id) {
  const file = id.split('\\').join('/').split('?')[0]
  const at = file.indexOf('/node_modules/')
  return at === -1 ? null : file.slice(at + '/node_modules/'.length)
}

function firstScreenReport() {
  return {
    name: 'stoa:first-screen-report',
    apply: 'build',
    generateBundle(_options, bundle) {
      const staticClosure = (starts) => {
        const seen = new Set()
        const queue = [...starts]
        while (queue.length > 0) {
          const id = queue.pop()
          if (seen.has(id)) continue
          seen.add(id)
          queue.push(...(this.getModuleInfo(id)?.importedIds ?? []))
        }
        return seen
      }
      const entry = this.getModuleInfo(ENTRY)
      if (!entry) this.error(`no module ${ENTRY}`)
      const startUp = [ENTRY, ...entry.dynamicallyImportedIds]
      const imported = staticClosure(startUp)

      const chunks = Object.values(bundle).filter((output) => output.type === 'chunk')
      const firstScreenFiles = new Set()
      const queue = chunks.filter((chunk) => startUp.some((id) => chunk.moduleIds.includes(id))).map((chunk) => chunk.fileName)
      while (queue.length > 0) {
        const fileName = queue.pop()
        if (firstScreenFiles.has(fileName)) continue
        firstScreenFiles.add(fileName)
        queue.push(...bundle[fileName].imports)
      }

      const report = chunks.map((chunk) => ({
        name: chunk.name,
        fileName: chunk.fileName,
        firstScreen: firstScreenFiles.has(chunk.fileName),
        notImported: Object.entries(chunk.modules)
          .filter(([id, module]) => module.renderedLength > 0 && !imported.has(id))
          .flatMap(([id]) => installedPath(id) ?? []),
      }))
      writeFileSync(process.env.FIRST_SCREEN_REPORT, JSON.stringify(report, null, 2))
    },
  }
}

export default mergeConfig(config, { plugins: [firstScreenReport()] })
