import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or your framework plugin

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // or '0.0.0.0' - allows external connections
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // enables hot reload in Docker
    },
    hmr: {
      port: 5173, // ensure HMR uses the same port
    },
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },
})
