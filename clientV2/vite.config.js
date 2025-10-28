import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import VueDevtools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), VueDevtools()],
})

// afet do web sockets two way with socket.io use ws in express
