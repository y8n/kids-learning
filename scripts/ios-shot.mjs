#!/usr/bin/env node
/**
 * iPad 模拟器截图 —— 横屏 + 竖屏
 *
 *   npm run ios:shot                     # 截线上地址（Safari，横屏 + 竖屏）
 *   npm run ios:shot -- --url http://127.0.0.1:5180/   # 截本地 dev
 *   npm run ios:shot -- --current        # 只截当前画面（用于 PWA，见下）
 *
 * 产物写到 shots/ （已 gitignore）。
 *
 * ── 为什么脚本长这样 ──
 * `simctl` **没有**旋转设备的命令，DeviceHub 也不会可靠地切横屏（实测两次都失败）。
 * 唯一能程序化旋转的办法是 AppleScript 发 ⌘←，而它需要「辅助功能」权限。
 * 所以：
 *   · 有权限 → 两个方向全自动截图
 *   · 没权限 → 能截的先截，并打印开通权限的确切步骤（一次开通，以后全自动）
 *
 * ── PWA 为什么要用 --current ──
 * 主屏 Web Clip 是由 SpringBoard 拉起的，`simctl` 没有对应命令
 * （试过 com.apple.webapp 和 WebKit.PushBundle.<uuid>，前者起来了但不显示内容，
 *   后者直接报 FBSOpenApplicationServiceError）。
 * 所以 PWA 截图只能：你先在模拟器里点一下图标 → 再跑 `-- --current`。
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_URL = 'https://y8n.github.io/kids-learning/'
const DEVICE_NAME = 'iPad Air 11-inch (M4)'
const SHOT_DIR = 'shots'

/* ── 工具 ───────────────────────────────────────────────── */

function findSimctl() {
  // xcode-select 可能指向 CommandLineTools，那里没有 simctl，所以优先试 Xcode 内的绝对路径
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

function run(cmd, args) {
  return spawnSync(cmd, args, { encoding: 'utf8' })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* ── 设备 ───────────────────────────────────────────────── */

function findOrCreateDevice(simctl) {
  const listed = run(simctl, ['list', 'devices', 'available']).stdout ?? ''
  const line = listed.split('\n').find((l) => l.includes(` ${DEVICE_NAME} (`) && l.includes('('))
  const udid = line?.match(/\(([0-9A-F-]{36})\)/)?.[1]
  if (udid) return { udid, created: false }

  // 没有就按名字找一个可用的同系列机型创建一个
  const types = run(simctl, ['list', 'devicetypes']).stdout ?? ''
  const typeId = types
    .split('\n')
    .find((l) => l.includes(`(M4) (com.apple.CoreSimulator.SimDeviceType.iPad-Air-11-inch-M4)`))
    ?.match(/\((com\.apple\.CoreSimulator\.SimDeviceType\.[^)]+)\)/)?.[1]
  const runtime = (run(simctl, ['list', 'runtimes']).stdout ?? '')
    .split('\n')
    .find((l) => l.includes('iOS') && l.includes('com.apple.CoreSimulator.SimRuntime.iOS'))
    ?.match(/\((com\.apple\.CoreSimulator\.SimRuntime\.[^)]+)\)/)?.[1]

  if (!typeId || !runtime)
    throw new Error('找不到可用的 iPad 机型或 iOS 运行时，请先用 Xcode 装一个模拟器运行时')
  const out = run(simctl, ['create', DEVICE_NAME, typeId, runtime])
  if (out.status !== 0) throw new Error(`创建模拟器失败：${out.stderr}`)
  return { udid: out.stdout.trim(), created: true }
}

async function boot(simctl, udid) {
  const state = () => run(simctl, ['list', 'devices']).stdout?.includes(`${udid}) (Booted)`)
  if (state()) return
  run(simctl, ['boot', udid])
  for (let i = 0; i < 60; i++) {
    if (state()) {
      await sleep(5000) // 等 SpringBoard 起来，早了截到的是黑屏
      return
    }
    await sleep(2000)
  }
  throw new Error('模拟器启动超时')
}

/* ── 旋转 ───────────────────────────────────────────────── */

const ROTATE_KEYCODE = { landscapeLeft: 123, portrait: 124 } // ⌘← / ⌘→

function rotate(direction) {
  const key = ROTATE_KEYCODE[direction]
  const script = [
    'tell application "DeviceHub" to activate',
    'delay 1.2',
    `tell application "System Events" to key code ${key} using command down`,
  ]
  const out = run(
    'osascript',
    script.flatMap((s) => ['-e', s]),
  )
  if (out.status !== 0) {
    const msg = (out.stderr || '').trim()
    const denied = /不允许|not allowed|1002/.test(msg)
    return { ok: false, reason: denied ? 'no-permission' : msg || 'unknown' }
  }
  return { ok: true }
}

async function capture(simctl, udid, file) {
  const out = run(simctl, ['io', udid, 'screenshot', file])
  if (out.status !== 0) throw new Error(`截图失败：${out.stderr}`)
}

function orientationOf(pngPath) {
  // 用 sips 读尺寸判断方向，避免为了这一个信息引入图片库
  const out = run('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', pngPath]).stdout ?? ''
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1])
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1])
  if (!w || !h) return 'unknown'
  return w > h ? 'landscape' : 'portrait'
}

/* ── 主流程 ─────────────────────────────────────────────── */

async function main() {
  const argv = process.argv.slice(2)
  const urlArg = argv.indexOf('--url')
  const url = urlArg >= 0 ? argv[urlArg + 1] : DEFAULT_URL

  const simctl = findSimctl()
  if (!simctl) {
    console.error('✗ 找不到 simctl。请安装 Xcode：https://developer.apple.com/xcode/')
    process.exit(1)
  }
  console.log(`simctl   ${simctl}`)
  console.log(`目标地址 ${url}\n`)

  const { udid, created } = findOrCreateDevice(simctl)
  console.log(`设备     ${DEVICE_NAME}  ${udid}${created ? '  (新建)' : ''}`)

  await boot(simctl, udid)
  console.log('状态     已启动')

  // --current：不打开网页、不旋转，只把当前画面截下来。
  // PWA 的图标只能手动点，这是目前唯一能截到它的办法。
  if (argv.includes('--current')) {
    mkdirSync(SHOT_DIR, { recursive: true })
    const probeNow = join(SHOT_DIR, '.probe.png')
    await capture(simctl, udid, probeNow)
    const now = orientationOf(probeNow)
    rmSync(probeNow, { force: true })
    const file = join(SHOT_DIR, `ipad-${now}.png`)
    await capture(simctl, udid, file)
    console.log(`✓ ${file}  (${now})`)
    console.log('\n--current 只截当前画面：不打开网页、不旋转。')
    return
  }

  run(simctl, ['openurl', udid, url])
  console.log('状态     已在 Safari 打开，等待渲染…')
  await sleep(10000)

  mkdirSync(SHOT_DIR, { recursive: true })

  // 先看看现在是什么方向，截下来
  const probe = join(SHOT_DIR, '.probe.png')
  await capture(simctl, udid, probe)
  const current = orientationOf(probe)
  const first = current === 'landscape' ? 'landscape' : 'portrait'
  const second = first === 'landscape' ? 'portrait' : 'landscape'

  const firstPath = join(SHOT_DIR, `ipad-${first}.png`)
  await capture(simctl, udid, firstPath)
  console.log(`✓ ${firstPath}  (${first})`)

  // 转过去截第二个方向
  const target = second === 'landscape' ? 'landscapeLeft' : 'portrait'
  const rot = rotate(target)
  if (!rot.ok) {
    console.log(`\n⚠️  无法自动旋转到 ${second}（原因：${rot.reason}）`)
    if (rot.reason === 'no-permission') {
      console.log(
        [
          '',
          '  要让它全自动，给终端开一次「辅助功能」权限即可：',
          '',
          '    系统设置 → 隐私与安全性 → 辅助功能',
          '    把「终端」（或你运行本命令的 App）加进去并勾选',
          '',
          '  开完之后再跑一次本命令，两个方向都会自动出图。',
          '  或者现在手动在模拟器窗口里按 ⌘← / ⌘→ 转好方向，再跑一次也行。',
          '',
        ].join('\n'),
      )
    }
    process.exit(1)
  }

  // 旋转本质是「发一个快捷键」，可能被系统静默吞掉。
  // 落盘前必须校验方向，否则会出现文件名写着 landscape、内容却是竖屏的假产物。
  let actual = 'unknown'
  for (let i = 0; i < 8; i++) {
    await sleep(1500)
    await capture(simctl, udid, probe)
    actual = orientationOf(probe)
    if (actual === second) break
  }
  if (actual !== second) {
    console.log(`\n⚠️  发了旋转快捷键，但方向仍是 ${actual}，没切成 ${second}。`)
    console.log('   手动在模拟器窗口按 ⌘← / ⌘→ 转一下，再跑一次本命令即可。')
    rmSync(probe, { force: true })
    process.exit(1)
  }

  const secondPath = join(SHOT_DIR, `ipad-${second}.png`)
  await capture(simctl, udid, secondPath)
  console.log(`✓ ${secondPath}  (${second})`)

  rmSync(probe, { force: true })
  console.log(`\n完成，共 2 张，在 ${SHOT_DIR}/`)
}

main().catch((err) => {
  console.error(`✗ ${err.message}`)
  process.exit(1)
})
