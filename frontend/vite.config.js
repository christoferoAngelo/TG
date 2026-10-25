import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-aria-components': path.resolve('node_modules/react-aria-components/dist/exports/index.mjs')
    }
  }
})
