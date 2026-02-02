import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import VueDevtools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiOrigin = env.VITE_API_ORIGIN
  return {
    base: './',
    plugins: [vue(), VueDevtools()],
    server: {
      // Proxy requests for Env.js to the API server in development only
      proxy: {
        '/Env.js': {
          target: apiOrigin,
          changeOrigin: true,
          rewrite: (path) => `/client-v2/Env.js`,
        },
        '^/js/Env\\.js$': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: true,
    },
  }
})
