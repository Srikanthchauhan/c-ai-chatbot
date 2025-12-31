import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Force no browser to open
process.env.BROWSER = 'none'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
