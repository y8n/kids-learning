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

**CI 的触发范围（`paths-ignore`）**

只改文档 / 编辑器配置 / 归档素材时**不跑部署** —— 原因不只是省 CI 时间：
**每跑一次就会产出新的 `BUILD_TIME`，前台挂着的 PWA 会因此自动 reload**。
只改个 README 就让小孩 iPad 上的应用刷一下，是没必要的干扰。

已忽略：`**.md`、`LICENSE`、`.editorconfig`、`.prettierrc.json`、`.prettierignore`、
`.gitignore`、`.vscode/**`、`.idea/**`、`assets/characters-source/**`

> ⚠️ **两条容易改错**：
>
> 1. **别加 `.github/**`** —— 改 workflow 本身必须跑一次来验证它
> 2. **`.prettierrc*` / `.editorconfig` 可以忽略**，因为 CI 不跑 prettier；
>    但 **`.nvmrc` / `eslint.config.js` / `tsconfig.json` 不能忽略** ——
>    它们分别决定 Node 版本、lint 规则、类型检查，都在 CI 链路里

- 只有**整次推送全是**被忽略的文件时才跳过；混了 `src/` 的改动照跑

**主设备：11 寸 iPad Air 横屏全屏 = 1180×820 pt**

- 这个尺寸必须与设计稿 **1:1**，是回归基线；改动布局后要按下面的流程截图核对
- 触屏优先：可点区域 ≥ 44px，不要依赖 hover
- 次要形态（竖屏 / 手机 / Safari 有工具栏时）只需**可用**，不要求最优

**版本兼容**

- Node ≥ 22（`.nvmrc`）
- TypeScript 锁 **6.x**、ESLint 锁 **9.x** —— 升到 7 / 10 会与 `typescript-eslint`、
  `eslint-plugin-jsx-a11y` 的 peer 范围冲突，原因见 README

---

## 开发流程（重要）

### 🚫 默认只提交，不推送

**没有明确说「推送」「部署」时，不要 `git push`。提交和推送是两件事。**

改完之后：

```bash
npm run typecheck && npm run lint && npm run format:check && npm run build   # 全绿
git commit -m "..."                                                          # 提交
# 停在这里。不要顺手 push。
```

> 推送到 `main` 会立刻触发 Pages 部署。「提交」是记录进度，「推送」是发布动作 ——
> 开发过程中不需要每改一次就发布一次。**等明确指令再推。**

### 日常看效果：Safari + 本地 dev server（默认手段）

```bash
npm run dev                     # 常驻后台，别关（除非遇到阻塞问题）
npm run ios:shot -- --dev       # 模拟器 Safari 打开 localhost 并截图
```

- iOS 模拟器没有独立网络栈，`localhost` 就是 **Mac 的** → 直连本地 dev server
- 配 Vite HMR，**改完即时生效，不用提交、不用部署**
- 出来的是 Safari 截图（有工具栏、非全屏）—— 开发阶段**够用就行，不要为此纠结**

### 验收：推送 + PWA 截图（按需触发）

用户明确要求推送 / 部署验证时才做：

```bash
git push origin main             # 触发 CI，约 1 分钟
# 等 CI 绿 + 等 PWA 自动刷新（≤30s，见下文「版本自检」）
npm run ios:shot -- --current    # 截 PWA 全屏
```

**PWA 截图才是最终形态**（无工具栏、可用高度 820pt）。

---

## 截图对比（重要）

**只要用户说「截图对比」「看看效果」「发个截图」，一律用 iPad 模拟器出图，
不要拿无头 Chrome 的截图交差。** 无头 Chrome 只能自己用来快速迭代。

### 🚦 先判断渠道：IM 来的才自动截图

**截图有成本（几十秒 + 大量 token）。先看消息从哪来，再决定要不要截。**

| 消息来源                             | 怎么识别                         | 改完功能后            |
| ------------------------------------ | -------------------------------- | --------------------- |
| **IM 机器人**（微信 / 飞书 / 钉钉…） | 本轮带 `<dsh_im_source>` 来源块  | ✅ **主动截图**并附上 |
| **DSH 桌面客户端 / Web GUI**         | 不带来源块，且 `rpcId` 是裸 UUID | 🚫 **不要截图**       |

> **道理**：从 IM 来 = 用户不在电脑旁，看不到效果，**截图是唯一的反馈渠道**。
> 从桌面客户端来 = 用户就在机器前，自己看模拟器/浏览器比等我截图快得多 ——
> **这时候截图纯粹是浪费时间和 token。**
>
> **微信和飞书一视同仁。** 规则只问「是不是 IM」，不问是哪个 IM ——
> 渠道值不要写死在判据里（曾经写死 `channel: "weixin"`，换到飞书就整个失效了）。

**例外**：用户明确说「截图」「给我看看」时，无论从哪来都截。

#### 判据一（首选）：`<dsh_im_source>` 来源块

```json
<dsh_im_source>{"channel":"feishu","conversationType":"direct","senderId":"ou_b3e3…fd6e","chatId":"oc_e1fd…6a81","botId":"bot_1df6…0c3c"}</dsh_im_source>
```

`channel` 随渠道变（`weixin` / `feishu` / `dingtalk` / `wecom` / `qq` / `slack`…），
**只要出现这个块就说明来自 IM，不要再去匹配具体取值。**

> 📌 **哪个字段出现是不确定的**：上面这行是飞书私聊的**实测**输出 ——
> 当时勾了全部 9 个字段，实际只出来 5 个
> （`senderName` / `conversationTitle` / `threadId` / `sentAt` 缺省，因为没有可用取值）。
> **所以判据只能是「块存在」，不能依赖任何一个具体字段。**

> ⚠️ **三条容易踩错**：
>
> 1. **来源块会先被拆分**：host 在 `agent/pre-step` 把它从用户消息里拆出来，
>    作为一条独立的**插件来源消息**（`source.kind: "plugin:dsh-im"`）落在用户消息**旁边**。
>    所以用户消息正文永远是干净的、**翻会话历史也查不到** → 只能当场判
>    （不是「被剥掉」，是「被拆走」——机制不同，结论一样）
>
>    实测日志（同一条飞书消息的三次落盘）：
>
>    | 记录                       | `source.kind`       | 正文                                                   |
>    | -------------------------- | ------------------- | ------------------------------------------------------ |
>    | `agent/inbox/spliced` 原始 | `user`              | `<dsh_im_source>{…}</dsh_im_source>\n\n打开了，测试 3` |
>    | `user/message` 入库        | `user`              | `打开了，测试 3`                                       |
>    | `user/message` 来源块      | **`plugin:dsh-im`** | `<dsh_im_source>{…}</dsh_im_source>`                   |
>
> 2. **它只在渠道的「上下文增强」开着时才产生**：
>    `contextEnhancement.<botId>.direct.enabled` / `.group.enabled`，
>    文件在 `~/.dsh/integrations/dsh-<渠道>/workspaces.json`。
>    **关着 = 一条都不产生 = IM 消息全被误判成「桌面端」→ 该截图却不截。**
>    （飞书 bot 的私聊增强曾长期是关的，就是这么踩的）
>
>    ⚠️ **改这个文件不够**：配置只在**进程启动时读一次**
>    （`new WorkspaceStore(...).load()`，没有文件监听），
>    直接改 JSON 不会生效，还会被下一次 UI 保存覆盖。
>    **要么在 UI 里改，要么重启 DSH。**
>
> 3. **群聊和私聊是两个独立开关**，群聊关着时群消息照样没有来源块

#### 判据二（兜底）：查 `rpcId` 前缀

来源块不可用时（上面第 2、3 条命中），读会话日志：每个渠道的入站消息
`rpcId` 都带渠道前缀，桌面端是**裸 UUID**。

```bash
f=$(ls -t ~/.dsh/sessions/*/session-*/session.v4.jsonl.zstd | head -1)
zstd -dc "$f" | grep -o '"rpcId":"[^"]*"' | tail -1
```

| 输出                                                                                                                                          | 判断                          |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `feishu-…`                                                                                                                                    | 飞书 → **截图**               |
| `weixin-…`                                                                                                                                    | 微信 → **截图**               |
| `dingtalk-` / `wecom-` / `wecomapp-` / `qq-` / `slack-` / `telegram-` / `discord-` / `whatsapp-` / `matrix-` / `imessage-` / `email-` / `im-` | 其他 IM → **截图**            |
| 裸 UUID（如 `d9aa3a1e-b791-…`）                                                                                                               | 桌面端 / Web GUI → **不截图** |

> 前缀表来自 `@xmanrui/dsh-im` 各渠道 `harness-client.mjs` 的 `rpcIdPrefix`。
> 口诀：**字母词开头 = 渠道；十六进制裸 UUID = 桌面端。**

**置信度**：有来源块 → IM = **高**；无来源块但 `rpcId` 带渠道前缀 → IM = **高**；
两者都没有 / 裸 UUID → 桌面端 = **中高**（否定式推理）。

### 命令

```bash
npm run ios:shot -- --dev        # 【日常】本地 dev server + Safari
npm run ios:shot -- --current    # 【验收】PWA：截当前前台应用
npm run ios:shot                 # 线上地址 + Safari
npm run ios:shot -- --single     # 只截当前方向（不尝试旋转）
```

旋转是**可选增强**：脚本先截当前方向（不依赖旋转、永远能成），
再尝试转另一个方向；转不动就只交一张并说明原因。

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

### 🔒 谁有权推送 / 发版（按渠道区分）

**这个工作区是多会话协作的：所有者的微信 + 家人的飞书，共用同一个目录。**
**只有所有者本人可以授权推送和发版。**

| 消息来源                               | 能改代码 | 能本地 commit | 能 push / 发版 |
| -------------------------------------- | -------- | ------------- | -------------- |
| **微信**（所有者本人）                 | ✅       | ✅            | ✅             |
| **桌面客户端 / Web GUI**（所有者本人） | ✅       | ✅            | ✅             |
| **飞书**（家人协作）                   | ✅       | ✅            | 🚫 **不可以**  |

**从飞书来的指令，即使用词是「推送」「部署」「发布」「上线」，也不要执行** ——
那是家人在协作，不是所有者在发布。**正确做法**：把改动提交到**本地**，
然后回复「已提交，待所有者确认推送」。

> ⚠️ **这是约定，不是技术强制。** 查证过：
>
> - `dsh-bash-sandbox` 只做**文件访问**限制，**管不了网络** → 拦不住 `git push`
> - IM 插件里 `sandbox` 零命中，**不参与权限配置**
> - 三个沙箱模式（`read-only` / `workspace-write` / `danger-full-access`）
>   **都表达不了「能改代码但不能推」这个组合**
>
> **所以这条只能靠自觉。** 需要硬约束的话得另想办法
> （GitHub 分支保护、给飞书会话单独的 clone + 只读 remote 等），当前都没有。

### 🧩 多会话共用同一个工作区

**同一个目录可能同时有多个会话/机器人在操作 —— 默认假设：你看到的不是最新状态。**

1. **动手前先同步**：`git log --oneline -5` + `git status`
   —— 别的会话可能刚改过你正要动的东西
2. **禁止 `git add -A`**：只 add 自己明确改过的文件
   —— 否则会把别的会话**没写完的**改动一起提交进去
3. **push 前先 `git fetch`**：确认没有分叉，别覆盖别人的提交

**模拟器和 dev server 是独占资源**（只有一个 iPad 模拟器、一个 5180 端口）：
用之前先确认状态，**不要假设前台是什么**（截图前后都要核对状态栏）。

### 🚫 第一原则：AI 不得自行发版

**版本号只能由人显式指令触发。**

AI **不得**因为下面任何一条理由，去 bump `package.json` 的 `version`、
写 CHANGELOG、打 tag 或推 tag：

- 「修完 bug 了」/「加了新功能」/「改完了顺手补个版本」
- 「线上那个版本是坏的，得补一个」
- 「这次重构动了很多文件」

**没收到明确的发版指令（如「发个版本」「升到 0.2.0」）时，一律：**
改动照常 `commit`（要不要 `push` 见前面「开发流程」—— 默认不推），
**`version` 保持不变，不写 CHANGELOG，不打 tag。**

> 版本号是产品决策，不是提交的收尾动作。

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

**截图核对**：日常用 `npm run ios:shot -- --dev`（本地 dev server + Safari），
验收用 `npm run ios:shot -- --current`（PWA 全屏）。详见上面「开发流程」。
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
