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
    setupFiles: ['src/testUtils/setupTests.js'],
    css: true,
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      'tests/e2e/**',
      'test-results/**',
    ],
    watchExclude: [
      '**/node_modules/**',
      'tests/e2e/**',
      'test-results/**',
    ],
  },
})
