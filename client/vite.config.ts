import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/colyseus': {
        target: 'http://game-server:2567',
        changeOrigin: true,
        secure: false,
        ws: true,
        // rewrite: (path) => path.replace(/^\/colyseus/, '')
      },
      '/streaming/lofi': {
        target: 'http://lofi-icecast:8000',
        changeOrigin: true,
        secure: false,
        ws: false,
        // rewrite: (path) => path.replace(/^\/streaming/, '')
      }
    }
  }
})
