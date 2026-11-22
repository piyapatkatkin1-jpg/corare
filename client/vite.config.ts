import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: ['corare.up.railway.app', process.env.RAILWAY_PUBLIC_DOMAIN].filter(Boolean) as string[],
    proxy: {
      '/api': {
        target: 'https://corare-production.up.railway.app',
        changeOrigin: true
      }
    }
  }
})
