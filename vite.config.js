import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.', // project root
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src')
    }
  },
  build: {
    outDir: 'dist'
  }
})
