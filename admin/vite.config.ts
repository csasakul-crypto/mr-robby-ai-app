import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { vuestic } from '@vuestic/compiler/vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    vuestic(),
    vue(),
    VueI18nPlugin({
      include: resolve(dirname(fileURLToPath(import.meta.url)), './src/i18n/locales/**'),
    }),
  ],

  // --- VVV เพิ่มบล็อกนี้เข้าไป ---
  server: {
    // 1. กำหนด Port 5174 ไว้ถาวรเลย
    port: 5174, 
    proxy: {
      // 2. ตั้งค่า Proxy ให้ /api วิ่งไปหา Backend (Port 3000)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
  // --- ^^^ ------------------- ^^^
})