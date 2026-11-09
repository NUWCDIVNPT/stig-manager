// Brings up a local stack for screenshot capture: in-process mock OIDC, the API from
// source, and the Vite dev server for clientV2. Expects a MySQL reachable per config.db
// (`npm run db` starts a throwaway container). Optional: --seed <appdata file>.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, createWriteStream } from 'node:fs'
import path from 'node:path'
import { config } from './config.mjs'
import { adminToken, startOidc } from './lib/oidc.mjs'
import { waitForApi, waitForUrl } from './lib/api.mjs'
import { seed } from './lib/seed.mjs'

const args = process.argv.slice(2)
const seedFile = args.includes('--seed') ? args[args.indexOf('--seed') + 1] : null
const noClient = args.includes('--no-client')

mkdirSync(config.stackDir, { recursive: true })
const children = []
const log = name => createWriteStream(path.join(config.stackDir, `${name}.log`), { flags: 'w' })

function spawnLogged(name, cmd, cmdArgs, opts) {
  const out = log(name)
  const child = spawn(cmd, cmdArgs, { ...opts, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.pipe(out); child.stderr.pipe(out)
  child.on('exit', code => console.log(`[stack] ${name} exited (${code})`))
  children.push(child)
  return child
}

let oidc
const stop = async (code = 0) => {
  for (const c of children) c.kill('SIGTERM')
  await oidc?.stop().catch(() => {})
  process.exit(code)
}
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
process.on('unhandledRejection', async (err) => { console.error('[stack] fatal:', err); await stop(1) })

oidc = await startOidc(config.oidcPort)
console.log(`[stack] mock OIDC on :${config.oidcPort}`)
writeFileSync(config.tokenFile, adminToken(oidc))

spawnLogged('api', process.execPath, ['index.js'], {
  cwd: path.join(config.repoRoot, 'api/source'),
  env: {
    ...process.env,
    STIGMAN_API_PORT: String(config.apiPort),
    STIGMAN_DB_HOST: config.db.host,
    STIGMAN_DB_PORT: String(config.db.port),
    STIGMAN_DB_SCHEMA: config.db.schema,
    STIGMAN_DB_USER: config.db.user,
    STIGMAN_DB_PASSWORD: config.db.password,
    STIGMAN_OIDC_PROVIDER: `http://localhost:${config.oidcPort}`,
    // clientV2 loads its OIDC worker from the legacy client's path; serve it unbuilt from source
    STIGMAN_CLIENT_DIRECTORY: process.env.STIGMAN_CLIENT_DIRECTORY || '../../client/src',
    STIGMAN_EXPERIMENTAL_APPDATA: 'true',
    STIGMAN_SWAGGER_ENABLED: 'false',
    STIGMAN_LOG_LEVEL: process.env.STIGMAN_LOG_LEVEL || '2',
  },
})
await waitForApi(`http://localhost:${config.apiPort}/api`)
console.log(`[stack] API on :${config.apiPort}`)

if (seedFile) {
  console.log(`[stack] seeding from ${seedFile}`)
  const result = await seed(path.resolve(seedFile))
  console.log(`[stack] seeded: ${typeof result === 'string' ? result.slice(0, 200) : JSON.stringify(result).slice(0, 200)}`)
}

if (!noClient) {
  const vite = path.join(config.repoRoot, 'clientV2/node_modules/.bin/vite')
  spawnLogged('client', vite, ['--port', String(config.clientPort), '--strictPort'], {
    cwd: path.join(config.repoRoot, 'clientV2'),
    env: {
      ...process.env,
      VITE_API_ORIGIN: `http://localhost:${config.apiPort}`,
      VITE_ENV_ORIGIN: `http://localhost:${config.apiPort}`,
      VITE_HASH_ROUTES: '1',
    },
  })
  await waitForUrl(`http://localhost:${config.clientPort}/`)
  console.log(`[stack] client on :${config.clientPort}`)
}
console.log('[stack] ready. Ctrl-C to stop.')

