import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/compare': 'http://localhost:8000',
      '/algorithms': 'http://localhost:8000',
    },
  },
})
