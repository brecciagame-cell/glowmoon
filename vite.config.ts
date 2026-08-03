import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // W trybie dev żądania /api trafiają do backendu Express (npm run server)
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
