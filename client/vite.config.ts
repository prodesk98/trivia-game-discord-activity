import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/colyseus': {
        target: 'http://game-server:2567', // game-server is the name of the service in the docker-compose file
        changeOrigin: true,
        secure: false,
        ws: true,
        // rewrite: (path) => path.replace(/^\/colyseus/, '')
      }
    }
  }
})
