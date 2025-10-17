// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // <-- 1. Importe o plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // <-- 2. Adicione o plugin aqui
  ],
})