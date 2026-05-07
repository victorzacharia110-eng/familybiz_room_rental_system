import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
base: "/",
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // 👇 ADD THIS SECTION
  test: {
    environment: 'jsdom', // simulate browser
    globals: true, // allow describe, it, expect without imports
    setupFiles: './tests/setup.js',
  },
})
