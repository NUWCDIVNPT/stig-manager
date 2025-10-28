import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevtools from 'vite-plugin-vue-devtools'
function sseMockPlugin() {
  return {
    name: 'mock-sse',
    configureServer(server) {
      server.middlewares.use('/api/mock-sse', (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        })
        res.write(`retry: 2000\n\n`)

        let id = 0
        const send = (event, data) => {
          if (event) res.write(`event: ${event}\n`)
          res.write(`id: ${++id}\n`)
          res.write(`data: ${JSON.stringify(data || {})}\n\n`)
        }

        send('welcome', { message: 'connected', at: Date.now() })
        send('connect', { at: Date.now() })

        const tickInterval = setInterval(() => {
          const rand = Math.random().toString(36).slice(2, 10)
          send('tick', { str: rand, at: Date.now() })
        }, 5000)

        req.on('close', () => clearInterval(tickInterval))
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), sseMockPlugin(), VueDevtools()],
})

// afet do web sockets two way with socket.io use ws in express
