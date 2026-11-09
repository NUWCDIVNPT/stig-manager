import { fileURLToPath } from 'node:url'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const env = process.env

export const config = {
  // Where the new client is served. Vite dev server by default; can be the API-served build.
  clientUrl: env.SHOTS_CLIENT_URL || 'http://localhost:5174/',
  hashRoutes: (env.SHOTS_HASH_ROUTES ?? '1') === '1',
  apiUrl: env.SHOTS_API_URL || 'http://localhost:64011/api',
  // Bearer token with admin privileges, used for seeding and name-to-id lookups.
  // stack.mjs writes one to .stack/admin.token; SHOTS_TOKEN overrides it.
  tokenFile: here('.stack/admin.token'),
  token: env.SHOTS_TOKEN,

  // Local stack (stack.mjs) settings
  oidcPort: Number(env.SHOTS_OIDC_PORT || 8080),
  apiPort: Number(env.SHOTS_API_PORT || 64011),
  clientPort: Number(env.SHOTS_CLIENT_PORT || 5174),
  db: {
    host: env.SHOTS_DB_HOST || 'localhost',
    port: env.SHOTS_DB_PORT || '3308',
    schema: env.SHOTS_DB_SCHEMA || 'stigman',
    user: env.SHOTS_DB_USER || 'stigman',
    password: env.SHOTS_DB_PASSWORD || 'stigman',
  },
  repoRoot: here('../../'),
  stackDir: here('.stack/'),

  // Capture settings
  outDir: env.SHOTS_OUT_DIR || here('../../docs/assets/images/'),
  workDir: here('.out/'),
  // Unannotated copy of every capture that has highlights, for hand-editing
  rawDir: env.SHOTS_RAW_DIR || here('raw/'),
  viewport: { width: 2560, height: 1440 },
  // Entries may set `scale: 2` for crisp close-ups; contexts are created per scale.
  deviceScaleFactor: 1,
  highlightColor: '#80d6ff',
  settleMs: 600,
  // Selector that proves the app shell has rendered after login
  readySelector: env.SHOTS_READY_SELECTOR || '#app',
  // Drift tolerance for `check`: fraction of pixels allowed to differ
  driftThreshold: 0.002,
  pixelmatchThreshold: 0.15,
}

export function routeUrl(route) {
  const base = config.clientUrl.endsWith('/') ? config.clientUrl : `${config.clientUrl}/`
  const path = route.startsWith('/') ? route : `/${route}`
  return config.hashRoutes ? `${base}#${path}` : `${base}${path.slice(1)}`
}
