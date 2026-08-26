import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 8/Rolldown accepts a function here instead of Rollup's former
        // object shorthand. Keep third-party code in a long-lived vendor chunk.
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      }
    }
  }
})
