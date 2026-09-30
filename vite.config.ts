import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
) as { version: string }

/**
 * 构建时间：CI 里由 GitHub Actions 注入 `BUILD_TIME`（工作流触发时刻，ISO 8601）。
 * 本地构建没有这个变量，退回「此刻」，保证页面上永远有值。
 * 展示时统一按 Asia/Shanghai 格式化，见 src/constants/version.ts。
 */
// 注意用 `||` 而不是 `??`：CI 里变量存在但为空串的情况出现过
// （`github.run_started_at` 在某些触发方式下取不到值），
// `??` 只在 null/undefined 时兜底，空串会一路带着走，页面上就会出现「v0.1.0发布于」这种残句。
const buildTime = process.env.BUILD_TIME?.trim() || new Date().toISOString()

/**
 * 额外产出一个 `version.json`，供 App 的「版本自检」用（见 src/lib/versionWatch.ts）。
 *
 * ⚠️ 它必须和 `__BUILD_TIME__` 是**同一个值**，所以在这里生成。
 * 不能丢给 scripts/postbuild.mjs —— 那是另一个进程，`new Date()` 会算出不一样的时间，
 * 结果就是 App 永远认为「有新版本」，陷入无限刷新。
 */
function emitVersionFile(): Plugin {
  return {
    name: 'emit-version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: pkg.version, buildTime }, null, 2),
      })
    },
  }
}

/**
 * 部署在 GitHub Pages 的项目页上，地址是：
 *   https://y8n.github.io/kids-learning/
 * 所以所有静态资源必须带上 /kids-learning/ 前缀，否则会 404。
 *
 * 本地 dev 时 base 用 '/'，避免开发时路径也带前缀。
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kids-learning/' : '/',

  plugins: [react(), emitVersionFile()],

  define: {
    // 版本号唯一来源是 package.json，不在这里另写一份，避免两处不一致
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    outDir: 'build',
    emptyOutDir: true,
    sourcemap: false,
  },

  server: {
    port: 5180,
  },
}))
