import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

/**
 * 部署在 GitHub Pages 的项目页上，地址是：
 *   https://y8n.github.io/kids-learning/
 * 所以所有静态资源必须带上 /kids-learning/ 前缀，否则会 404。
 *
 * 本地 dev 时 base 用 '/'，避免开发时路径也带前缀。
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kids-learning/' : '/',

  plugins: [react()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    // GitHub Actions 的工作流是把仓库里的 ./build 目录整体发布到 Pages
    outDir: 'build',
    emptyOutDir: true,
    sourcemap: false,
  },

  server: {
    port: 5180,
  },
}))
