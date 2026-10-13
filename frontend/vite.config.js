import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['cookie', 'set-cookie-parser', 'recharts'] },
  server: { port: 5173, host: true },
})
