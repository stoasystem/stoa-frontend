/*
 * The production build of vite.config.ts, plus a report of what the first
 * screen loads (firstScreenChunks415.test.ts), written to the file named by
 * FIRST_SCREEN_REPORT. Plain JavaScript: the test project's TypeScript
 * settings are not the ones vite.config.ts is checked with.
 *
 * The first screen is what src/main.tsx imports, the modules its start-up
 * imports on demand (the stylesheet, i18n, React, the App), and everything
 * those import statically. A chunk that holds any of it loads before the
 * first render. For every chunk the report lists the installed packages'
 * modules in it that the first screen never imports: in a first-screen chunk,
 * that is code every visitor downloads for a page they may never open.
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

function installedPath(id) {
  const file = id.split('\\').join('/').split('?')[0]
  const at = file.lastIndexOf('/node_modules/')
  return at === -1 ? null : file.slice(at + '/node_modules/'.length)
}

function firstScreenReport() {
  return {
    name: 'stoa:first-screen-report',
    apply: 'build',
    generateBundle(_options, bundle) {
      const entry = this.getModuleInfo(ENTRY)
      if (!entry) this.error(`no module ${ENTRY}`)
      const firstScreen = new Set()
      const queue = [ENTRY, ...entry.dynamicallyImportedIds]
      while (queue.length > 0) {
        const id = queue.pop()
        if (firstScreen.has(id)) continue
        firstScreen.add(id)
        queue.push(...(this.getModuleInfo(id)?.importedIds ?? []))
      }
      const report = Object.values(bundle).flatMap((output) => {
        if (output.type !== 'chunk') return []
        const rendered = Object.entries(output.modules).filter(([, module]) => module.renderedLength > 0)
        return [
          {
            name: output.name,
            fileName: output.fileName,
            firstScreen: rendered.some(([id]) => firstScreen.has(id)),
            notImported: rendered.flatMap(([id]) => {
              const installed = installedPath(id)
              return installed !== null && !firstScreen.has(id) ? [installed] : []
            }),
          },
        ]
      })
      writeFileSync(process.env.FIRST_SCREEN_REPORT, JSON.stringify(report, null, 2))
    },
  }
}

export default mergeConfig(config, { plugins: [firstScreenReport()] })
