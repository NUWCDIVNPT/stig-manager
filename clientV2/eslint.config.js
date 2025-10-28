import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import pluginPrettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'deprecated/**' ],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: { prettier: pluginPrettier },
    rules: {
      'prettier/prettier': ['error', {}, { usePrettierrc: true }],
      'vue/multi-word-component-names': 'off',
    },
  },

  // Web worker and public scripts (e.g., SharedWorker in public/oidc-worker.js)
  {
    files: ['public/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
    },
  },

  {
    files: [
      '*.{js,cjs,mjs}',
      'vite.config.{js,cjs,mjs}',
      'vitest.config.{js,cjs,mjs}',
      '.eslintrc.{js,cjs}', 
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },

  prettierConfig,
]


// settings.json vscode:
// {
//   "eslint.validate": ["javascript", "vue"],
//   "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
//   "editor.formatOnSave": true,
// }
