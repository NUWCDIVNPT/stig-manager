import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // Proxy /api requests
      '/api': {
        target: 'http://localhost:64001',
        changeOrigin: true,
      },
      // Proxy /js/Env.js requests
      '/js/Env.js': {
        target: 'http://localhost:64001',
        changeOrigin: true,
      },
    },
  },
})
