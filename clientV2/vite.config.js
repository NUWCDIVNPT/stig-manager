import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import VueDevtools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const envOrigin = env.VITE_ENV_ORIGIN
  const apiOrigin = env.VITE_API_ORIGIN
  return {
    base: command === 'build' ? './' : '/',
    plugins: [vue(), VueDevtools()],
    server: {
      // Development only: Env.js, the OIDC worker and the API are proxied so the
      // page stays same-origin with the API, as it is in production.
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
        '/Env.js': {
          target: envOrigin,
          changeOrigin: true,
          rewrite: (path) => `/client-v2/Env.js`,
        },
        '/js/workers/oidc-worker.js': {
          target: envOrigin,
          changeOrigin: true,
        },
        // Log Stream websocket (Admin > Log Stream)
        '/socket': {
          target: apiOrigin,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      sourcemap: true,
    },
  }
})
