# Kids Learning

A learning workspace for my kids.

面向幼儿园小朋友的学习工作台：**英语 / 思维 / 百科 / 识字** 四科入口 + 今日进度 + 打卡记录。

线上地址：<https://y8n.github.io/kids-learning/>

---

## 技术栈

| 项       | 选择                   | 说明                                       |
| -------- | ---------------------- | ------------------------------------------ |
| 框架     | React 19 + TypeScript  |                                            |
| 构建     | Vite                   | `base = /kids-learning/`，`outDir = build` |
| 路由     | react-router-dom 7     | 目前只有首页一条路由                       |
| 样式     | CSS Modules + CSS 变量 | 见 `src/styles/tokens.css`                 |
| 代码规范 | ESLint 9 + Prettier 3  | 扁平配置，`npm run lint`                   |
| 接口     | **本地 mock**          | 尚未对接后端                               |

> **TypeScript 为什么是 6 而不是 7**：`typescript-eslint@8` 的 peer 范围是 `>=4.8.4 <6.1.0`，
> 尚不支持 TS 7。等它跟上再升。

---

## 快速开始

```bash
npm install
npm run dev          # 本地开发，http://localhost:5180
npm run build        # 类型检查 + 构建到 build/
npm run preview      # 预览构建产物
npm run lint         # ESLint（CI 会跑，0 warning 才通过）
npm run format       # Prettier 格式化
npm run ios:shot     # iPad 模拟器截图（横屏 + 竖屏）
```

### 开发流程：提交与推送分开

**默认只提交，不推送。** 推送到 `main` 会触发 Pages 部署，那是发布动作 ——
等明确指令再做。

日常看效果走本地 dev server，快得多：

```bash
npm run dev                     # 常驻
npm run ios:shot -- --dev       # 模拟器 Safari 打开 localhost 截图
```

模拟器没有独立网络栈，`localhost` 就是 Mac 的 localhost，配上 Vite HMR
改完即时生效。**截图细节见 `AGENTS.md`。**

### 版本自动刷新

「添加到主屏幕」的 PWA 会一直挂在前台不发请求，改完代码也看不到新版。
App 内置了版本自检（`src/lib/versionWatch.ts`）：每 30 秒拉一次 `version.json`，
构建时间变了就强制刷新。**部署后最多 30 秒，已打开的页面会自己变成新版。**

### iPad 模拟器截图

要验证「真机 Safari 到底渲染成什么样」时用它 —— 比无头 Chrome 可信，因为跑的是真正的 iPadOS Safari。

```bash
npm run ios:shot                                   # 截线上地址（Safari，横屏 + 竖屏）
npm run ios:shot -- --url http://127.0.0.1:5180/   # 截本地 dev
npm run ios:shot -- --current                      # 只截当前画面
```

**要截 PWA 全屏效果，得用 `--current`。** 主屏 Web Clip 是 SpringBoard 拉起的，
`simctl` 没有对应命令（试过 `com.apple.webapp` 和 `WebKit.PushBundle.<uuid>`，
前者起来了但不显示内容，后者直接报错）。所以流程是：

1. 在模拟器主屏点一下应用图标
2. `npm run ios:shot -- --current`

产物写到 `shots/`（已 gitignore）：`ipad-landscape.png` + `ipad-portrait.png`。

**首次使用需要开一次权限**：脚本靠 AppleScript 发 ⌘← 来旋转设备，
系统的「辅助功能」权限没开的话转不动，这时它会打印开通步骤
（系统设置 → 隐私与安全性 → 辅助功能 → 加上你的终端）。开完一劳永逸。

> 两个 Xcode 27 的坑：`Simulator.app` 已改名 `DeviceHub.app`，
> 且它在 `Xcode.app/Contents/Applications/` 下；`xcode-select` 若指向
> CommandLineTools，`xcrun simctl` 会失败 —— 脚本里已按绝对路径兜底。

---

## 部署

**构建在 GitHub Actions 的 Runner 上完成，仓库里不提交任何构建产物。**

```
push main  →  checkout  →  npm ci  →  typecheck  →  lint  →  build  →  发布 ./build 到 Pages
```

- 工作流：`.github/workflows/static.yml`
- `build/` 已在 `.gitignore` 中忽略
- `scripts/postbuild.mjs` 在构建后生成 `404.html`（SPA 深链兜底）和 `.nojekyll`
- 所有静态资源带 `/kids-learning/` 前缀（`vite.config.ts` 的 `base`），
  路由 `basename` 复用 `import.meta.env.BASE_URL`，两者永远一致

### 纯文档改动不会触发部署

`**.md`、`LICENSE`、编辑器配置（`.prettierrc.json` / `.editorconfig` / `.vscode/`）
以及归档素材 `assets/characters-source/` 都在 `paths-ignore` 里。

**原因不只是省 CI 时间**：每跑一次都会产出新的 `BUILD_TIME`（来自 `run_started_at`），
**前台挂着的 PWA 会因此自动刷新** —— 只改个文档就让小孩 iPad 上的应用刷一下，
是没必要的干扰。

> ⚠️ 两条容易改错：**别把 `.github/**` 加进去**（改 workflow 必须跑一次验证它自己）；
> `.nvmrc` / `eslint.config.js` / `tsconfig.json` 看着像配置，但都在 CI 链路上，也不能忽略。
> 详见 `AGENTS.md`。

---

## 响应式策略

设计基准是 **11 寸 iPad Air 横屏全屏 = 1180×820 pt**，这个尺寸下与设计稿 **1:1**。

| 形态                  | 视口         | 布局                                      |
| --------------------- | ------------ | ----------------------------------------- |
| **iPad 横屏（锚点）** | **1180×820** | 整屏铺满、无滚动                          |
| iPad 横屏 Safari      | 1180×~740    | 同布局，纵向按 `min(vw, vh)` 收缩，不溢出 |
| iPad 竖屏 / 分屏      | <900 或竖屏  | 单列堆叠、整页滚动                        |
| 手机                  | 393×852 等   | 同上，学科仍是 2×2                        |

两个关键实现：

1. **尺寸用 `clamp(下限, min(vw系数, vh系数), 上限)`**
   vw 系数按 1180 反推、vh 系数按 820 反推，在 1180×820 两支相等（= 设计稿数值）。
   iPad 横屏 Safari 高度只剩 ~740 时 vh 支生效，纵向自动收缩。
2. **卡片内部用容器查询单位 `cqw`**（`container-type: inline-size` 在外层 `.slot` 上）
   卡片排版跟着**卡片自身宽度**缩放，而不是跟着视口。
   所以同一张卡在横屏/竖屏/手机下比例完全一致，只是整体大小不同。

---

## 目录结构

```
├── .github/workflows/static.yml   CI：远端构建 + 发布
├── assets/characters-source/      角色立绘原始 PNG（不参与打包，仅留档）
├── public/                        favicon / PWA 图标 / manifest
├── scripts/postbuild.mjs          构建后处理
└── src/
    ├── api/                       接口层（唯一的数据出入口）
    │   ├── types.ts               领域模型 —— 前后端的共同语言
    │   ├── client.ts              请求客户端（mock / 真实后端 一键切换）
    │   ├── endpoints/             按业务分的接口函数（页面只调这里）
    │   └── mock/                  本地 mock 服务
    │       ├── server.ts          路由 / 延迟 / 错误码 / 取消
    │       ├── db.ts              假数据
    │       └── handlers/          各接口的 mock 实现
    ├── components/
    │   ├── TopBar/                顶栏
    │   ├── SubjectCard/           学科卡片
    │   ├── Panel/                 右栏卡片外壳（含错误态）
    │   ├── TodayPanel/            今日学习
    │   ├── WeeklyPanel/           最近一周
    │   └── ErrorBoundary/         应用级错误边界
    ├── constants/ui.ts            魔法数字与固定文案
    ├── hooks/useRequest.ts        请求三态
    ├── pages/Home/                首页
    ├── styles/                    tokens.css + global.css
    └── assets/characters/         打包用的 WebP 立绘
```

---

## 接口与 Mock

### 现有接口

| 方法 | 路径               | 说明         | 返回类型        |
| ---- | ------------------ | ------------ | --------------- |
| GET  | `/profile`         | 孩子档案     | `ChildProfile`  |
| GET  | `/subjects`        | 四张学科卡片 | `Subject[]`     |
| GET  | `/progress/today`  | 今日学习总览 | `TodayProgress` |
| GET  | `/progress/weekly` | 最近一周记录 | `WeeklyRecord`  |

### Mock 模拟的不只是数据

`src/api/mock/server.ts` 模拟真实网络行为，所以 loading / error / 空态都是**真的能跑到的**：

```
?__fail=1       # 返回 500 → 走错误分支
?__slow=1500    # 延迟 1.5 秒 → 观察 loading
```

默认每次请求 120~420ms 随机延迟，`AbortSignal` 取消也是真的。

### 接后端时怎么改

1. 在 `src/api/mock/handlers/` 里对照着实现真实后端
2. 把 `src/api/client.ts` 的 `USE_MOCK` 置为 `false`（或构建时设 `VITE_USE_MOCK=false`）
3. 删掉 `src/api/index.ts` 里的 `import './mock'`

**页面代码一行都不用改。** 后端返回支持信封 `{ code, message, data }` 或直接返回数据。

---

## 设计约定

### 布局节奏

顶栏距页边 `--page-pad`，卡片区再内缩 `--card-inset`（合计 120px @1180），
形成「头部宽、内容窄」的居中构图。所有尺寸都从 `tokens.css` 取，不散写。

### 学科卡片的文字为什么是深色

卡片用的是浅色糖果渐变（`#FF8FB6` / `#4FD8F5` / `#FFB067` / `#8BE06A`），
**白色文字压上去只有 1.6~2.1:1**，远低于 WCAG AA 的 4.5。

试过两种「救白字」的方案，都不理想：

- 整体压暗卡片 → 糖果色变成灰玫瑰 / 橄榄绿，丢了童趣
- 加渐变压暗遮罩 → 卡片上露出一块明显的暗斑，像污渍

最终解法是**把文字换成深色**，而不是把背景调暗：

|        | 颜色                           | 文字框内最低对比度 |
| ------ | ------------------------------ | ------------------ |
| 标题   | `--ink-on-card` `#2E1065`      | 5.69               |
| 副标题 | `--ink-on-card-soft` `#341666` | 5.40               |

卡片保持原始鲜亮，对比度反而更高，且没有任何遮罩痕迹。

### 其他

- 卡片点击反馈：**整卡轻微缩放 + 阴影收紧**（没有独立按钮）
- 触摸目标 ≥ 44px；`prefers-reduced-motion` 与 `prefers-contrast` 均已处理
- 进度条有 `role="progressbar"`，周记录的星星有完整 `aria-label`
- 焦点样式：全局 `:focus-visible` 兜底，卡片与按钮各自覆盖

---

## 资源说明

- 打包用的立绘是 **WebP（q92）**，4 张合计约 153 KB；
  对应的原始 PNG 留档在 `assets/characters-source/`（约 496 KB，不参与打包）
- 重新生成 WebP：
  ```bash
  python3 -c "
  from PIL import Image; import os
  for f in os.listdir('assets/characters-source'):
      if f.endswith('.png'):
          Image.open(f'assets/characters-source/{f}').convert('RGBA') \
              .save(f'src/assets/characters/{f[:-4]}.webp','WEBP',quality=92,method=6)"
  ```
- 角色立绘的**缩放系数**是数据层字段（`Subject.artScale`），不是 CSS 魔法字符串 ——
  小马宝莉宽高比 0.87 比别的角色宽，配 `artScale: 0.76` 收一点
