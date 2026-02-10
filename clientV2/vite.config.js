import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import VueDevtools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const envOrigin = env.VITE_ENV_ORIGIN
  return {
    base: command === 'build' ? './' : '/',
    plugins: [vue(), VueDevtools()],
    server: {
      // Proxy requests for Env.js to the API server in development only
      proxy: {
        '/Env.js': {
          target: envOrigin,
          changeOrigin: true,
          rewrite: (path) => `/client-v2/Env.js`,
        },
      },
    },
    build: {
      sourcemap: true,
    },
  }
})
