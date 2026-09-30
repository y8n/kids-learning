# Kids Learning

A learning workspace for my kids.

面向幼儿园小朋友的学习工作台：**英语 / 思维 / 百科 / 识字** 四科入口 + 今日进度 + 打卡记录。

线上地址：<https://y8n.github.io/kids-learning/>

---

## 技术栈

| 项 | 选择 |
| --- | --- |
| 框架 | React + TypeScript |
| 构建 | Vite |
| 路由 | react-router-dom（`basename` 跟随 `import.meta.env.BASE_URL`） |
| 样式 | CSS Modules + CSS 变量（`src/styles/tokens.css`） |
| 接口 | **本地 mock**，尚未对接后端 |

---

## 快速开始

```bash
npm install
npm run dev        # 本地开发，http://localhost:5180
npm run build      # 类型检查 + 构建到 build/
npm run preview    # 预览构建产物
```

## 部署

`.github/workflows/static.yml` 会把仓库里的 **`build/` 目录**整体发布到 GitHub Pages。

所以：

- **`build/` 必须提交进仓库**（`.gitignore` 里已刻意不忽略它）
- 构建产物必须放 `build/`（`vite.config.ts` 里 `build.outDir = 'build'`）
- 所有静态资源必须带 `/kids-learning/` 前缀（`vite.config.ts` 里 `base = '/kids-learning/'`）

发布流程：`npm run build` → `git add build` → commit → push 到 `main`。

---

## 目录结构

```
src/
├── api/                    接口层（唯一的数据出入口）
│   ├── types.ts            领域模型 —— 前后端的共同语言
│   ├── client.ts           请求客户端（mock / 真实后端 一键切换）
│   ├── endpoints/          按业务分的接口函数（页面只调这里）
│   │   ├── profile.ts
│   │   ├── subjects.ts
│   │   └── progress.ts
│   └── mock/               本地 mock 服务
│       ├── server.ts       迷你 mock 服务器：路由 / 延迟 / 错误码 / 取消
│       ├── db.ts           假数据
│       └── handlers/       各接口的 mock 实现
├── components/             展示组件
│   ├── TopBar/             顶栏：孩子信息 + 日期 + 个人中心
│   ├── SubjectCard/        学科卡片
│   ├── Panel/              右栏卡片外壳
│   ├── TodayPanel/         今日学习
│   └── WeeklyPanel/        最近一周
├── hooks/
│   └── useRequest.ts       请求三态（loading / error / data）
├── pages/
│   └── Home/               首页
├── styles/
│   ├── tokens.css          设计变量
│   └── global.css          全局重置与背景
└── assets/characters/      四个学科的角色立绘
```

---

## 接口与 Mock

### 现有接口

| 方法 | 路径 | 说明 | 返回类型 |
| --- | --- | --- | --- |
| GET | `/profile` | 孩子档案 | `ChildProfile` |
| GET | `/subjects` | 四张学科卡片 | `Subject[]` |
| GET | `/progress/today` | 今日学习总览 | `TodayProgress` |
| GET | `/progress/weekly` | 最近一周记录 | `WeeklyRecord` |

类型定义见 `src/api/types.ts`。

### Mock 模拟的不只是数据

`src/api/mock/server.ts` 模拟了真实的网络行为，所以 UI 的 **loading / error / 空态** 都是真的能跑到的：

```bash
# 任意请求加参数即可触发，方便调试状态分支
?__fail=1       # 返回 500 → 走错误分支
?__slow=1500    # 延迟 1.5 秒 → 观察 loading
```

默认每次请求有 120~420ms 的随机延迟。`AbortSignal` 取消也是真的（页面快速切换时不会 setState 到已卸载组件）。

### 接后端时怎么改

1. 在 `src/api/mock/handlers/` 里对照着实现真实后端
2. 把 `src/api/client.ts` 的 `USE_MOCK` 置为 `false`（或构建时设 `VITE_USE_MOCK=false`）
3. 删掉 `src/api/index.ts` 里的 `import './mock'`

**页面代码一行都不用改。**

后端返回支持两种格式：带信封 `{ code, message, data }`，或直接返回数据。

### 新增一个接口

1. `src/api/types.ts` 加类型
2. `src/api/mock/handlers/xxx.ts` 写 `defineMock('GET', '/xxx', handler)`
3. `src/api/mock/index.ts` 加一行 `import`
4. `src/api/endpoints/xxx.ts` 写类型安全的调用函数
5. `src/api/index.ts` 导出

---

## 设计约定

- 以 **iPad 横屏 1180×820** 为设计基准，用 `clamp()` 做流式适配
- 顶栏距页边 `--page-pad`，卡片区再内缩 `--card-inset`，形成「头部宽、内容窄」的构图
- 学科卡片：左上主标题 + 副标题（≤6 个汉字）+ 右下角角色立绘
- 卡片点击反馈：**整卡轻微缩放 + 阴影收紧**（没有独立按钮）
- 字号下限：正文 ≥ 11px，可点区域 ≥ 44px
