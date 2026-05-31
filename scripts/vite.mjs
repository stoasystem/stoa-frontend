#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const viteBin = resolve('node_modules/vite/bin/vite.js')
const nodeArgs = []

// Tailwind CSS 4.3.0 still calls module.register() while Node 26 emits DEP0205.
// Keep the known upstream warning out of local scripts until Tailwind ships its fix.
if (process.allowedNodeEnvironmentFlags?.has('--disable-warning')) {
  nodeArgs.push('--disable-warning=DEP0205')
}

const child = spawn(process.execPath, [...nodeArgs, viteBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
