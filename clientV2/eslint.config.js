import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  jsonc: true,
  yaml: true,
  typescript: false,
  semi: false,
  lessOpinionated: true,

  css: true,
  stylistic: {
    quotes: 'single',
  },
  ignores: [
    '**/vite.config.js',
    '**/eslint.config.js',
    'node_modules/**',
    'coverage/**',
    'package.json',
    'index.html',
    'src/assets/**',
  ],
  rules: {
    // console output is gated at runtime by src/init.js (silent unless consoleMode is development)
    'no-console': 'off',
    'vue/custom-event-name-casing': 'off',
    'antfu/no-top-level-await': 'off',
  }
})
