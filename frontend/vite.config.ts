import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Only the API namespace is proxied. The SPA also owns a client-side
      // route called /compare, so proxying bare paths would swallow navigation.
      '/api': 'http://localhost:8000',
    },
  },
})
