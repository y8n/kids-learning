# AGENTS.md

> DSH / Codex / Claude Code 会在动手前自动读取本文件。
> 这里只写**必须知道、且容易踩错**的约束，不是完整文档。其余见 `README.md`。

## 这是什么

幼儿园小朋友的学习工作台，四科：**英语 / 思维 / 百科 / 识字**。
线上：<https://y8n.github.io/kids-learning/>

---

## 硬约束

**部署在 GitHub Pages 的子路径下**

- `vite.config.ts` 的 `base` 必须是 `/kids-learning/`（dev 时用 `/`）
- 路由 `basename` 取 `import.meta.env.BASE_URL`，**不要硬编码**
- 引资源用 `import` 或 `./` 相对路径；**写 `/xxx` 这种绝对路径会 404**

**构建产物不进仓库**

- CI 在 Runner 上 `npm ci && typecheck && lint && build`，见 `.github/workflows/static.yml`
- `build/` 已在 `.gitignore` 里，**不要加回版本控制**

**主设备：11 寸 iPad Air 横屏全屏 = 1180×820 pt**

- 这个尺寸必须与设计稿 **1:1**，是回归基线；改动布局后要按下面的流程截图核对
- 触屏优先：可点区域 ≥ 44px，不要依赖 hover
- 次要形态（竖屏 / 手机 / Safari 有工具栏时）只需**可用**，不要求最优

**版本兼容**

- Node ≥ 22（`.nvmrc`）
- TypeScript 锁 **6.x**、ESLint 锁 **9.x** —— 升到 7 / 10 会与 `typescript-eslint`、
  `eslint-plugin-jsx-a11y` 的 peer 范围冲突，原因见 README

---

## 截图对比（重要）

**只要用户说「截图对比」「看看效果」「发个截图」，一律用 iPad 模拟器出图，
不要拿无头 Chrome 的截图交差。** 无头 Chrome 只能自己用来快速迭代。

### 命令

```bash
npm run ios:shot                 # Safari：打开线上地址，竖屏 + 横屏
npm run ios:shot -- --current    # PWA：不打开网页，截当前前台应用，竖屏 + 横屏
```

产物在 `shots/`（已 gitignore），脚本结尾会打印每张的像素尺寸：

| 模式        | 产物                                               |
| ----------- | -------------------------------------------------- |
| 默认        | `ipad-portrait.png` / `ipad-landscape.png`         |
| `--current` | `ipad-pwa-portrait.png` / `ipad-pwa-landscape.png` |

### ⚠️ PWA 截图需要用户点一下图标

**这是目前唯一没法自动化的环节。** 试过并且**全部失败**的路子：

| 尝试                                               | 结果                             |
| -------------------------------------------------- | -------------------------------- |
| `simctl launch com.apple.webapp`                   | 进程起来，但不显示内容           |
| `simctl launch com.apple.WebKit.PushBundle.<uuid>` | `FBSOpenApplicationServiceError` |
| 重启模拟器指望它恢复前台                           | 回到主屏，不会恢复               |
| `⌘空格` 唤起 iOS Spotlight 再搜索                  | 模拟器不透传这个快捷键           |
| 取 DeviceHub 窗口坐标后模拟点击                    | System Events 报窗口数为 0       |

**所以流程是**：让用户在主屏点一下图标（Dock 里那个**金色星星**）→ 再跑 `npm run ios:shot -- --current`。

> 💡 只要不跑默认模式（那个会打开 Safari 把它顶掉），**PWA 会一直留在前台**，
> 之后可以反复 `--current` 截图。

### 模拟器能直接访问 Mac 上的 localhost（迭代神器）

**iOS 模拟器没有独立网络栈，直接用 Mac 的。** 所以模拟器里的 `localhost`
就是 **Mac 的 localhost** —— 实测 `simctl openurl booted http://localhost:5180/`
能打开 Mac 上跑的 Vite dev server。

```bash
npm run dev                                          # Mac 上起 dev server
npm run ios:shot -- --url http://localhost:5180/     # 模拟器 Safari 打开它
```

配合 Vite 的 HMR，**改代码后模拟器里即时生效，完全不用部署**。
调样式时优先用这条，比「推送→等 CI→等自动刷新」快一个数量级。

> ⚠️ 三点差别：
>
> 1. **真机不行** —— 真机上 `localhost` 指 iPad 自己。真机要用 Mac 的局域网 IP
>    （`ipconfig getifaddr en0`），且 dev server 得监听 `0.0.0.0`（`--host`）。
> 2. **PWA 用不了这条** —— Web Clip 的 URL 是添加时写死的，改不了。
>    所以要验 PWA 效果还是得走线上地址。
> 3. **dev 和 build 的 base 不同** —— dev 是 `/`，build 是 `/kids-learning/`。
>    访问 dev server 用 `http://localhost:5180/`，访问本地 build 产物要带子路径。

### 改了代码怎么让 PWA 刷到新版

**PWA 挂在前台时不会自己发请求**，所以永远停在打开时那个版本。
「关掉重开」也不保险：GitHub Pages 给 `index.html` 的是 `cache-control: max-age=600`，
10 分钟内重开仍可能命中**旧 HTML**，而旧 HTML 指向旧的 hash 资源 → 整个应用还是旧的。

**解**：App 内置版本自检，见 `src/lib/versionWatch.ts`。

- 构建时 `vite.config.ts` 额外产出 `build/version.json`，与 bundle 里的 `__BUILD_TIME__` 同值
- 前端每 30 秒（且页面可见时）用 `cache: 'no-store'` 拉一次它
- 构建时间变了 → 强制刷新

> ⚠️ 两处容易改错：
>
> 1. `version.json` **必须在 `vite.config.ts` 里生成**，不能丢给 `scripts/postbuild.mjs` ——
>    那是另一个进程，`new Date()` 会算出不一样的时间，App 就会永远认为「有新版」，无限刷新。
> 2. 刷新用「带一个新查询参数后 `location.replace`」而不是 `location.reload()`：
>    缓存按完整 URL 索引，换 URL 必然绕过缓存，不依赖 reload 的重验行为。

**新增部署后，最多等 30 秒，PWA 会自己变成新版**，不用手动重开。

### 为什么是这个命令

| 事实                                                          | 影响                                             |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `simctl` **没有**旋转命令                                     | 只能靠 AppleScript 发 ⌘← / ⌘→                    |
| DeviceHub（Xcode 27 里 Simulator.app 的新名字）不会可靠切横屏 | 别指望它                                         |
| 旋转可能被系统**静默吞掉**                                    | 脚本每次转完都重新截图验方向，**确认变了才落盘** |
| PWA 由 SpringBoard 拉起，`simctl` 起不来                      | PWA 只能手动点图标 + `--current`                 |

### 一次性准备：辅助功能权限

自动旋转需要「辅助功能」权限，**授权对象是运行命令的那个 App**：

| 谁在跑           | 要授权的 App         |
| ---------------- | -------------------- |
| **AI（我）执行** | **DeepSeek Harness** |
| 用户自己在终端跑 | 终端 / iTerm         |

> 系统设置 → 隐私与安全性 → 辅助功能 → 添加并勾选

**没开权限时**：脚本会只出竖屏，并打印上面这段指引 —— 它**不会**假装成功、
也不会产出「文件名写 landscape、内容却是竖屏」的假图。

**不想开权限的替代流程**：在模拟器窗口按 `⌘←` / `⌘→` 转到想要的方向，
然后跑 `npm run ios:shot -- --current`。

### 怎么分辨截到的是 PWA 还是 Safari

**看状态栏那一行字**（最容易验证，务必自己先核对再发给用户）：

| 状态栏显示       | 是什么       | 有地址栏吗 |
| ---------------- | ------------ | ---------- |
| **`学习工作台`** | **PWA 全屏** | 没有       |
| `Safari 浏览器`  | Safari       | 有         |

> 📌 这条是踩过坑加的：曾经把 Safari 的截图当成 PWA 发给用户，被当场指出。

### 三种模式的实际可用高度

改布局前先想清楚用户是在哪种模式下用：

| 打开方式                     | 可用高度   | 备注                                                        |
| ---------------------------- | ---------- | ----------------------------------------------------------- |
| **PWA 全屏**（添加到主屏幕） | **820 pt** | 设计基准，卡片 256 pt 与设计稿 1:1                          |
| Safari                       | ~740 pt    | 工具栏半透明悬浮，靠 `env(safe-area-inset-top)` 避让约 80pt |
| 微信等内置浏览器             | ~654 pt    | 上下都有实心栏                                              |

### 模拟器能验什么、不能验什么

- ✅ 布局、尺寸、真实 iPadOS Safari 的渲染（字体 / 圆角 / 毛玻璃）
- ❌ **触摸手势**（只有鼠标点击）、**性能**（跑在 Mac 上）、
  **系统版本差异**（模拟器 27.0 ≠ 用户 iPad 的版本）

**所以：模拟器过 ≠ 真机过。上线前仍要让用户在真机上点一遍。**

---

## 版本发布流程

### 🚫 第一原则：AI 不得自行发版

**版本号只能由人显式指令触发。**

AI **不得**因为下面任何一条理由，去 bump `package.json` 的 `version`、
写 CHANGELOG、打 tag 或推 tag：

- 「修完 bug 了」/「加了新功能」/「改完了顺手补个版本」
- 「线上那个版本是坏的，得补一个」
- 「这次重构动了很多文件」

**没收到明确的发版指令（如「发个版本」「升到 0.2.0」）时，一律：**
改动照常 `commit` + `push` 到 `main`，**`version` 保持不变，不写 CHANGELOG，不打 tag。**

> 推送到 `main` 就会自动部署 —— **「只修不发版」是完全支持的常规操作**，
> 不要把它当成需要补版本号的理由。版本号是产品决策，不是提交的收尾动作。

> 📌 这条规则是有代价换来的：0.1.0 之后曾在未获指令的情况下自行发布了 0.1.1、0.1.2，
> 两个 tag 最终都被撤销、版本号退回 0.1.0。**不要再犯。**

---

版本号**唯一来源是 `package.json` 的 `version`**。
构建时 `vite.config.ts` 把它和 `BUILD_TIME`（CI 注入的工作流触发时刻）写进产物，
首页右下角显示，点击弹出「vX.Y.Z发布于yyyy-MM-dd HH:mm:ss」。

**收到发版指令后**，执行下面五步：

**1. 定版本号**（语义化版本）

| 改动性质                 | 版本位 |
| ------------------------ | ------ |
| 不兼容的改动             | major  |
| 新增功能                 | minor  |
| 修 bug / 重构 / 样式调整 | patch  |

**2. 看上次发布之后改了什么**

```bash
git log "$(git describe --tags --abbrev=0)"..HEAD --oneline --no-merges
git diff "$(git describe --tags --abbrev=0)"..HEAD --stat
```

首次发布还没有 tag 时，用第一个 commit：`git log --oneline`。

**3. 写 `CHANGELOG.md`**

在**最上方**（`## [Unreleased]` 之后）插入新条目，格式：

```markdown
## [x.y.z] - YYYY-MM-DD HH:mm:ss

- **提交**：`<本次发布包含的最后一个 commit 短 hash>`
- **内容**：
  - 面向人的一句话说明，不要照抄 commit message
  - 破坏性改动单独标 **BREAKING**
```

内容要**按用户视角归纳**，不是罗列 commit。同一件事的多次修改合并成一条。

**4. 改 `package.json` 的 `version`**

**5. 提交 + 打标签 + 推送**

```bash
git add -A && git commit -m "chore(release): vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main --follow-tags
```

> 推送到 `main` 会自动触发 Pages 部署，约 1 分钟。
> **本仓库的 remote 用 SSH**（`git@github.com:y8n/kids-learning.git`）——
> 这台机器上 `github.com:443` 连不通，HTTPS 推送会超时。

---

## 必须遵守的规范

**提交信息**：Conventional Commits —— `feat|fix|refactor|docs|chore|perf(scope): 说明`

**截图核对**：`npm run ios:shot`（iPad 模拟器，横屏 + 竖屏）。
模拟器只能验布局，**验不了触摸、性能、系统版本差异**，上线前仍要真机点一遍。

**提交前必须全绿**：

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build
```

**样式**：一律 CSS Modules + `src/styles/tokens.css` 的变量。
颜色 / z-index / 圆角 / 阴影**不要散写**，先看有没有现成的 token，没有再往 tokens 里加。

**尺寸**：布局尺寸用 `clamp(下限, min(vw系数, vh系数), 上限)`；
卡片**内部**用容器查询单位 `cqw`，跟着卡片自身宽度缩放，不要跟着视口。

**绝对定位子元素的尺寸一律用 `cqw`，不要用 `%`。**
`%` 的解析基准取决于包含块，实测会落到卡片**外框**（256）而不是内边距盒（212），
一旦基准变了，宽度受限的角色（佩奇这种接近正方的）会被明显放大 ——
曾经把立绘宽度写成 `87%`，佩奇就被放到了 222.8px（比设计稿大 10.3%）。
`cqw` 的基准由 `container-type` 明确指定，不受包含块规则影响。

**数据**：组件里**不要直接 fetch**。一律走 `src/api/`：
`types.ts` 定义模型 → `mock/handlers/` 实现 → `endpoints/` 暴露函数。

**版本号 / 构建时间**：不要硬编码，走 `src/constants/version.ts`。

---

## 无障碍基线（只能加固，不能回退）

- 正文对比度 ≥ **4.5:1**。
  **学科卡片是「浅色底 + 深色字」**——白字压在那四个浅色渐变上只有 1.6~2.1:1，
  改回白字就是回退，不要再试。
- 可点区域 ≥ 44px
- 可交互元素要有 `:focus-visible` 样式
- 纯图标 / emoji 承载的信息要补 `aria-label`
- 动效要能被 `prefers-reduced-motion` 关掉

---

## 不要做的事

- 不要把 `build/` 加回版本控制
- 不要在代码里硬编码版本号、构建时间、`/kids-learning/` 前缀
- 不要为单个组件引入新的样式方案或状态管理库（Tailwind / styled-components / Redux…），先问
- 不要动 `assets/characters-source/` 里的原始图；要换素材先确认
- 不要把 `~/skills` 那类个人技能目录、`.dsh/` 之类的东西带进这个仓库
