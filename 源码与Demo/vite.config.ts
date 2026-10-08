import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    base: './',
    plugins: [react()],
    server: { watch: { ignored: ['**/参赛材料/**', '**/.deck-build/**'] }, proxy: { '/api': `http://127.0.0.1:${env.PORT || 4174}` } },
  }
})
