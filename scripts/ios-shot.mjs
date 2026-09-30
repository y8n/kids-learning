#!/usr/bin/env node
/**
 * iPad 模拟器截图
 *
 *   npm run ios:shot -- --dev                          # 【日常开发】localhost dev server
 *   npm run ios:shot                                   # 线上地址（Safari）
 *   npm run ios:shot -- --current                      # 当前前台应用（PWA 验收用这个）
 *   npm run ios:shot -- --url http://x/                # 任意地址
 *
 * 产物写到 shots/（已 gitignore），并在结尾打印每张的像素尺寸。
 *
 * ── 用哪个模式 ──
 *   日常改样式 → `--dev`。iOS 模拟器没有独立网络栈、直接用 Mac 的，
 *                所以模拟器里的 localhost 就是 Mac 的 localhost，
 *                配上 Vite HMR 改完即时生效，不用部署。
 *   验收最终效果 → `--current`。看的是真 PWA 全屏（Web Clip 的 URL 写死，
 *                没法指向 localhost，所以只能走线上）。
 *
 * ════════════════════════════════════════════════════════════════
 * 为什么脚本长这样 —— 三个踩过的坑
 * ════════════════════════════════════════════════════════════════
 *
 * ① simctl 没有旋转命令
 *    子命令翻遍了没有 orientation/rotate。DeviceHub（Xcode 27 里 Simulator.app
 *    的新名字）也不会可靠地切横屏，实测两次都失败。
 *    唯一能程序化旋转的是 AppleScript 发 ⌘← / ⌘→，它需要「辅助功能」权限。
 *
 * ② 旋转可能被静默吞掉
 *    所以每次转完都**必须重新截图验方向**，确认变了才落盘。
 *    否则会出现「文件名写着 landscape、内容却是竖屏」的假产物 —— 这比报错还糟。
 *
 * ③ PWA 没法程序化启动
 *    主屏 Web Clip 由 SpringBoard 拉起（试过 com.apple.webapp：
 *    进程起来了但不显示内容；com.apple.WebKit.PushBundle.<uuid>：直接报
 *    FBSOpenApplicationServiceError）。
 *    所以 PWA 只能：你手动点图标 → 再跑 `-- --current`。
 *
 * ⚠️ 已知边界：⌘→ / ⌘← 各转 90°，所以理论上可能停在「倒竖屏」，
 *    而倒竖屏和正常竖屏的像素尺寸一样，脚本分辨不出来（极少见）。
 *    真遇到的话，看截图能一眼发现（整屏是倒的），手动转正再跑一次即可。
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, openSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_URL = 'https://y8n.github.io/kids-learning/'
const DEV_URL = 'http://localhost:5180/'
const DEV_LOG = '/tmp/kids-learning-dev.log'
const DEVICE_NAME = 'iPad Air 11-inch (M4)'
const SHOT_DIR = 'shots'
const PROBE = join(SHOT_DIR, '.probe.png')

/* ── 基础工具 ───────────────────────────────────────────── */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' })

function findSimctl() {
  // xcode-select 常指向 CommandLineTools，那里没有 simctl —— 所以优先绝对路径
  const candidates = [
    '/Applications/Xcode.app/Contents/Developer/usr/bin/simctl',
    '/Library/Developer/CommandLineTools/usr/bin/simctl',
  ]
  for (const p of candidates) if (existsSync(p)) return p
  try {
    return execFileSync('xcrun', ['--find', 'simctl'], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

/* ── dev server ─────────────────────────────────────────── */

async function reachable(url) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(t)
    return res.ok
  } catch {
    return false
  }
}

/** 开发模式：dev server 没跑就顺手拉起来，保持常驻，省得每次手动开 */
async function ensureDevServer() {
  if (await reachable(DEV_URL)) {
    console.log('dev server 已在运行，直接复用')
    return true
  }

  console.log('dev server 没在跑，正在启动…')
  const child = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', openSync(DEV_LOG, 'a'), openSync(DEV_LOG, 'a')],
  })
  child.unref()

  for (let i = 0; i < 30; i++) {
    await sleep(1000)
    if (await reachable(DEV_URL)) {
      console.log(`dev server 就绪（日志：${DEV_LOG}）`)
      return true
    }
  }
  console.error(`✗ dev server 起不来，看日志：${DEV_LOG}`)
  return false
}

/* ── 设备 ───────────────────────────────────────────────── */

function findOrCreateDevice(simctl) {
  const listed = run(simctl, ['list', 'devices', 'available']).stdout ?? ''
  const line = listed.split('\n').find((l) => l.includes(`${DEVICE_NAME} (`))
  const udid = line?.match(/\(([0-9A-F-]{36})\)/)?.[1]
  if (udid) return { udid, created: false }

  const types = run(simctl, ['list', 'devicetypes']).stdout ?? ''
  const typeId = types
    .split('\n')
    .find((l) => l.includes('(com.apple.CoreSimulator.SimDeviceType.iPad-Air-11-inch-M4)'))
    ?.match(/\((com\.apple\.CoreSimulator\.SimDeviceType\.[^)]+)\)/)?.[1]
  const runtime = (run(simctl, ['list', 'runtimes']).stdout ?? '')
    .split('\n')
    .find((l) => l.includes('com.apple.CoreSimulator.SimRuntime.iOS'))
    ?.match(/\((com\.apple\.CoreSimulator\.SimRuntime\.[^)]+)\)/)?.[1]

  if (!typeId || !runtime)
    throw new Error('找不到 iPad Air 11 机型或 iOS 运行时，请先用 Xcode 装模拟器运行时')
  const out = run(simctl, ['create', DEVICE_NAME, typeId, runtime])
  if (out.status !== 0) throw new Error(`创建模拟器失败：${out.stderr}`)
  return { udid: out.stdout.trim(), created: true }
}

async function boot(simctl, udid) {
  const isBooted = () =>
    (run(simctl, ['list', 'devices']).stdout ?? '').includes(`${udid}) (Booted)`)
  if (isBooted()) return
  run(simctl, ['boot', udid])
  for (let i = 0; i < 60; i++) {
    if (isBooted()) {
      await sleep(5000) // 等 SpringBoard 起来，早了截到的是黑屏
      return
    }
    await sleep(2000)
  }
  throw new Error('模拟器启动超时')
}

/* ── 截图 / 方向 ────────────────────────────────────────── */

function capture(simctl, udid, file) {
  const out = run(simctl, ['io', udid, 'screenshot', file])
  if (out.status !== 0) throw new Error(`截图失败：${out.stderr}`)
}

/** 用 sips 读像素尺寸判断方向，省得为一个信息引入图片库 */
function sizeOf(pngPath) {
  const out = run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', pngPath]).stdout ?? ''
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1])
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1])
  return w && h ? { w, h } : null
}

function orientationOf(pngPath) {
  const s = sizeOf(pngPath)
  if (!s) return 'unknown'
  return s.w > s.h ? 'landscape' : 'portrait'
}

async function currentOrientation(simctl, udid) {
  await capture(simctl, udid, PROBE)
  return orientationOf(PROBE)
}

/* ── 旋转 ───────────────────────────────────────────────── */

const KEY = { landscape: 123, portrait: 124 } // ⌘← / ⌘→

function pressRotate(direction) {
  const out = run('osascript', [
    '-e',
    'tell application "DeviceHub" to activate',
    '-e',
    'delay 1.2',
    '-e',
    `tell application "System Events" to key code ${KEY[direction]} using command down`,
  ])
  if (out.status === 0) return { ok: true }
  const msg = (out.stderr || '').trim()
  return {
    ok: false,
    reason: /不允许|not allowed|1002/.test(msg) ? 'no-permission' : msg || 'unknown',
  }
}

/**
 * 转到目标方向并**验证**。
 * 验证这一步不能省 —— 快捷键可能被系统吞掉，不验证就会产出名实不符的文件。
 */
async function rotateTo(simctl, udid, target) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if ((await currentOrientation(simctl, udid)) === target) return { ok: true }

    const pressed = pressRotate(target)
    if (!pressed.ok) return pressed

    // 给它时间转动 + 重绘，然后重新确认
    for (let i = 0; i < 6; i++) {
      await sleep(1200)
      if ((await currentOrientation(simctl, udid)) === target) return { ok: true }
    }
  }
  return { ok: false, reason: 'stuck', actual: await currentOrientation(simctl, udid) }
}

/* ── 输出 ───────────────────────────────────────────────── */

function report(files) {
  console.log('\n产物：')
  for (const f of files) {
    const s = sizeOf(f)
    const pt = s ? `${s.w / 2}×${s.h / 2} pt` : '?'
    const px = s ? `${s.w}×${s.h} px` : ''
    console.log(`  ${f.padEnd(28)} ${px.padEnd(14)} ${pt}`)
  }
}

function permissionHint() {
  console.log(
    [
      '',
      '  自动旋转靠 AppleScript 发 ⌘← / ⌘→，需要「辅助功能」权限。',
      '  授权对象是**运行本命令的那个 App**：',
      '',
      '    我（AI）执行时   → DeepSeek Harness',
      '    你在终端里跑时   → 终端 / iTerm',
      '',
      '  开通路径：',
      '    系统设置 → 隐私与安全性 → 辅助功能 → 添加并勾选上面那个 App',
      '',
      '  开完再跑一次即可两个方向全自动（一次开通，长期有效）。',
      '',
      '  不想开权限的话，手动在模拟器窗口按 ⌘← / ⌘→ 转好方向，然后：',
      '    npm run ios:shot -- --current',
      '',
    ].join('\n'),
  )
}

/* ── 主流程 ─────────────────────────────────────────────── */

async function main() {
  const argv = process.argv.slice(2)
  const dev = argv.includes('--dev')
  const urlIdx = argv.indexOf('--url')
  const url = urlIdx >= 0 ? argv[urlIdx + 1] : dev ? DEV_URL : DEFAULT_URL
  const onlyCurrent = argv.includes('--current')

  if (dev && !(await ensureDevServer())) process.exit(1)

  const simctl = findSimctl()
  if (!simctl) {
    console.error('✗ 找不到 simctl，请先安装 Xcode。')
    process.exit(1)
  }

  const { udid, created } = findOrCreateDevice(simctl)
  mkdirSync(SHOT_DIR, { recursive: true })

  console.log(`simctl   ${simctl}`)
  console.log(`设备     ${DEVICE_NAME}${created ? '（新建）' : ''}`)
  console.log(`目标     ${onlyCurrent ? '当前画面' : url}\n`)

  await boot(simctl, udid)

  /* --current：不打开网页，截「当前正在跑的那个 App」。
     PWA 只能用这个模式 —— 它的图标是 SpringBoard 拉起的，simctl 起不来。 */
  if (onlyCurrent) {
    console.log('PWA 模式：不打开任何网页，直接截当前前台画面')
    console.log('（没看到应用的话，先在模拟器主屏点一下那个金色星星图标）\n')
  } else {
    run(simctl, ['openurl', udid, url])
    console.log('已用 Safari 打开，等待渲染…')
    await sleep(10000)
  }

  const prefix = onlyCurrent ? 'ipad-pwa' : 'ipad'

  /* ── 先截「当前方向」。这一步不依赖任何旋转，永远能成。 ──
     旋转是**可选增强**：它靠 AppleScript 发 ⌘← / ⌘→，需要模拟器窗口开着
     且有「辅助功能」权限。任何一环不到位都不该让整次截图失败。 */
  const first = await currentOrientation(simctl, udid)
  const firstFile = join(SHOT_DIR, `${prefix}-${first}.png`)
  await capture(simctl, udid, firstFile)
  const files = [firstFile]
  console.log(`✓ ${firstFile}  (${first})`)

  if (argv.includes('--single')) {
    rmSync(PROBE, { force: true })
    report(files)
    return
  }

  /* ── 再试另一个方向 ── */
  const second = first === 'landscape' ? 'portrait' : 'landscape'
  const rot = await rotateTo(simctl, udid, second)

  if (rot.ok) {
    const secondFile = join(SHOT_DIR, `${prefix}-${second}.png`)
    await capture(simctl, udid, secondFile)
    files.push(secondFile)
    console.log(`✓ ${secondFile}  (${second})`)
  } else {
    rmSync(PROBE, { force: true })
    report(files)
    console.log(`\n⚠️  只交了这一张 —— 转不到 ${second}（原因：${rot.reason}）`)
    if (rot.reason === 'no-permission') permissionHint()
    else {
      console.log('\n  旋转需要**模拟器窗口开着**（DeviceHub 有可见窗口时 ⌘← / ⌘→ 才有效）。')
      console.log('  打开窗口后在设备里按 ⌘← / ⌘→ 转好方向，再跑一次本命令即可。')
      console.log('  —— 或者就用当前方向这张，开发时通常够看。')
    }
    return
  }

  rmSync(PROBE, { force: true })
  report(files)
}

main().catch((err) => {
  console.error(`✗ ${err.message}`)
  process.exit(1)
})
