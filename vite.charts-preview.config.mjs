import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  root: 'D:/Sanket/GitSanket/BachatBook/.charts-preview',
  plugins: [react()],
  resolve: {
    alias: {
      '@': 'D:/Sanket/GitSanket/BachatBook/src',
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: 'D:/Sanket/GitSanket/BachatBook/tailwind.config.ts' }),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 4602,
    strictPort: true,
  },
})
