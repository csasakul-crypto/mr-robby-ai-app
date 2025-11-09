import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true,
      }
    },
    // --- VVV แก้ไขตรงนี้ VVV ---
    allowedHosts: [
      'undeparting-heaven-evangelistic.ngrok-free.dev', // 1. เพิ่มชื่อเต็มๆ ที่ Error บอก
      '*.ngrok-free.dev'                             // 2. ใส่ Wildcard เดิมไว้ด้วย
    ]
    // --- ^^^ ---------------- ^^^
  }
})