import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
// vitest.config.js
import { defineConfig } from 'vitest/config'
// import vue dev toosl from '@vue/devtools' --- IGNORE ---
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setupTests.js'],
    css: true,
  },
})
