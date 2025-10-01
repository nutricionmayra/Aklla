import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Muy importante: el "base" debe ser exactamente el nombre del repo en GitHub
export default defineConfig({
  plugins: [react()],
  base: '/Aklla/',   // 👈 nombre exacto del repo
})
