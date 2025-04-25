import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/ask': {  // Add this
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      'upload': {  // Add this
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
