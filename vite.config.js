import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiRoot = env.VITE_API_ROOT_URL || 'http://localhost:8091'

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
