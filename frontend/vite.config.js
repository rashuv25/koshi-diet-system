// user-client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // IMPORTANT: Use the one from your user-client/package.json

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port:  5003, // Changed to match backend CORS_ORIGIN for local development
  }
})