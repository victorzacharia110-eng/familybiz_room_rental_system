import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: "/",
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // 👇 ADD THIS SECTION
  test: {
    environment: 'jsdom', // simulate browse
    globals: true, // allow describe, it, expect without imports
    setupFiles: './tests/setup.js',
  },
})
