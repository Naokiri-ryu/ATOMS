import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//export default defineConfig({
//  plugins: [react()],
//})

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Biar bisa diakses dari jaringan
    port: 5173,
    watch: {
      usePolling: true // Opsional, buat yang pakai WSL
    }
  }
})
