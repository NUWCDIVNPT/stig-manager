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
    // Only pick up unit/component tests
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    // Prevent Vitest from picking up Playwright E2E tests
    exclude: [
      '**/node_modules/**',
      'tests/e2e/**',
      'playwright-report/**',
      'test-results/**',
    ],
    // Also avoid watching E2E artifacts
    watchExclude: [
      '**/node_modules/**',
      'tests/e2e/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
})
