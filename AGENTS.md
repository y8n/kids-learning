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

- 这个尺寸必须与设计稿 **1:1**，是回归基线；改动布局后要按这个尺寸截图核对
- 核对手段：`npm run ios:shot` 出 iPad 横竖屏截图（真实 iPadOS Safari），
  比无头 Chrome 可信；无头 Chrome 只用来快速迭代
- 触屏优先：可点区域 ≥ 44px，不要依赖 hover
- 次要形态（竖屏 / 手机 / Safari 有工具栏时）只需**可用**，不要求最优

**版本兼容**

- Node ≥ 22（`.nvmrc`）
- TypeScript 锁 **6.x**、ESLint 锁 **9.x** —— 升到 7 / 10 会与 `typescript-eslint`、
  `eslint-plugin-jsx-a11y` 的 peer 范围冲突，原因见 README

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
