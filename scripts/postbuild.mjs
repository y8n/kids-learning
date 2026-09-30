/**
 * 构建后处理
 *
 * 1. 404.html —— GitHub Pages 上直接访问子路径（如 /kids-learning/course/1）
 *    时，服务端找不到文件会返回 404.html。把它做成 index.html 的副本，
 *    SPA 就能接管路由而不是给用户一个 GitHub 的 404 页面。
 * 2. .nojekyll —— 告诉 Pages 不要用 Jekyll 处理产物。
 *    虽然现在用的是 upload-pages-artifact（本身不走 Jekyll），
 *    但留着可以防止将来切回分支发布时，带下划线开头的文件被吞掉。
 */
import { copyFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'build'
const index = join(OUT, 'index.html')

if (!existsSync(index)) {
  console.error(`[postbuild] 找不到 ${index}，请先执行 vite build`)
  process.exit(1)
}

copyFileSync(index, join(OUT, '404.html'))
writeFileSync(join(OUT, '.nojekyll'), '')

console.log('[postbuild] 已生成 404.html 与 .nojekyll')
