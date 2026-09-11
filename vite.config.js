import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiRoot = env.VITE_API_ROOT_URL || 'https://tailoring-shop-backend-production.up.railway.app'

  return {
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiRoot,
        changeOrigin: true,
      },
      '/stichingorder': {
        target: apiRoot,
        changeOrigin: true,
      },
    },
  },
  }
})
