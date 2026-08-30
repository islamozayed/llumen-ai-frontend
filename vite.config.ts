import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Project Pages site: https://islamozayed.github.io/llumen-ai-frontend/
  base: '/llumen-ai-frontend/',
  plugins: [react(), tailwindcss()],
})
