# stoa-frontend

STOA 学习平台的前端：React 19 + TypeScript + Vite 的单页应用。

- 线上：<https://app.stoaedu.ch>
- 后端 API：<https://api.stoaedu.ch>（健康检查 `/health`）
- 部署形态：构建产物发布到 S3 + CloudFront，由 `scripts/publish-web-release.mjs` 投递

技术栈以 `package.json` 为准：Zustand 5 · TanStack Query 5 · react-router-dom 7 ·
i18next 26（de / en / fr / it 四语）· Tailwind 4 · Radix UI。
测试用 Vitest 4、Playwright 1.60 与 `node:test`。

## 跑起来

```bash
npm install
npm run dev     # http://localhost:5173
```

`npm run dev` 走的是 `scripts/vite.mjs` 这层包装，不要直接调 `vite`。
环境变量看 `.env.example`。

构建：

```bash
npm run build   # tsc -b && vite build
```

## 门禁：push `main` 即生产部署

本仓只有 `main`，push 到 `main` 会立刻触发
`.github/workflows/deploy-production.yml`。它的 verify job 失败只能拦住 deploy job，
**提交本身已经在 `main` 上了，没有预发环境可以回头**。

所以这一串必须在本地跑完全绿再推。下面逐项照抄 verify job 的步骤，不要凭印象改：

```bash
npm run lint
npm run typecheck
npm run check:api-contract
npm run check:untranslated
npm test
npm run test:release
node --test tests/release/verify-release.test.mjs
node --test tests/release/publish-web-release.test.mjs
```

两点容易踩：

- `check:api-contract` 实时拉 `stoasystem/stoa-backend` **main 分支**的
  `docs/security/route-authorization-inventory.json`。前后端同时改接口时，
  **必须先推后端**，否则这道门拦你。
- verify job **不含 `npm run build`**，也不含任何浏览器测试。
  UI 回归和构建失败这道闸挡不住，自己跑。

## 冒烟测试

```bash
STOA_SMOKE_PASSWORD='<测试账号口令>' npm run test:smoke
```

`tests/smoke/` 下 6 条，约一分钟：四个角色（student / parent / teacher / admin）
各登录一次并要求零 4xx/5xx 与零页面错误、学生提问要等到助手真的作答、
管理员要在控制台看见全部账号。

它**不在 CI 里**，因为它打的是真部署（默认 `https://app.stoaedu.ch`，
用 `PLAYWRIGHT_BASE_URL` 改指向），需要真账号口令。
口令不在仓里，`STOA_SMOKE_PASSWORD` 没设就直接拒跑而不是猜一个。
改了前端就自己跑一遍。

## 目录导览

```
src/app         应用装配：providers、QueryClient、路由表（routeManifest 是路由与权限的单一来源）
src/pages       路由页面，按角色与领域分子目录（ask / map / chapter / teacher / parent / admin …）
src/layouts     布局骨架：App / Auth / Dashboard / Marketing 四套外壳
src/features    按领域切分的功能模块：starmap（星图）· ask（问答）· chapter（章节学习）· uploads · account · live-classroom
src/components  跨页复用组件；base/ 是本设计系统的基础件，ui/ 是 Radix 包装层
src/hooks       按领域分组的 hooks，与 services 一一对应
src/services    API 客户端与外部服务封装（含 monitoring / logging / analytics）
src/store       Zustand store，全仓只有这一个，新状态写这里
src/lib         无状态工具与路由/环境常量（env、runtimeConfig、navigation、validation …）
src/i18n        四语言 locale 资源与命名空间定义
src/styles      设计 token 与主题 CSS，样式参数一律走 token
src/types       跨层共享的类型与接口契约
src/dev         仅开发期使用的预览与基准页面
src/mocks       MSW handler，供测试使用；与 src/dev 一样由 vite 插件挡在生产产物之外
tests/          component（组件）· release（发布契约）· smoke（真部署）· e2e-dist（打本地 dist）
scripts/        构建包装、守卫脚本、发布投递、死代码扫描
```

判断「这个模块还有没有人用」只认 `node scripts/dead-code-scan.mjs`，
**不要拿裸 `grep` 的零命中当删除依据**，原因见 `docs/agents/dead-code.md`。

## 权威文档在别处

产品需求、架构、API、数据模型、当前进度一律以 `stoasystem/stoa-docs` 为准，按这个顺序读：

`PRD.md` → `HLD.md` → `PLAN.md` → `ADR.md` → `DEPLOYMENT.md`，
技术债清单 `PROJECT_SLIM_PLAN.md`，任务卡 `任务卡.md`（四仓共用这一份）。

本仓自己的：`AGENTS.md`（本仓操作要点，Cursor 会读）、`CONTEXT.md`（领域上下文）、
`docs/adr/`、`docs/agents/`。多仓协作纪律写在工作区根目录的 `CLAUDE.md` 里。

**动代码前先读 `stoa-docs/`，不要只读这一份。**

## 还没清理干净的地方

改到这些区域前先确认状态，别在废弃分支上加功能：

- `.planning/` —— 旧工具留下的 1000 多个入库文件，最后改动 2026-08-15，占仓库很大一块。
- `docs/` —— 280 多个入库文件，大部分写于 2026-07 以前，与 `stoa-docs/` 职责重叠。
  新文档写 `stoa-docs/`。
- `vercel.json` —— 部署实际走 S3 + CloudFront，这个文件是历史遗留。
- `demo-harness/`、`src/dev/demo/`、`src/lib/demoVisibility.ts` 与 `demoSurface` 路由标记
  —— demo 期的残留，受环境变量控制，默认对生产用户不可见。不要往里加新功能。
- `/classroom` 在线课堂：后端没有对应实现，学生侧入口已撤、链接重定向到 `/`，
  只剩 teacher 侧路由还挂着（见 `src/app/router/routeManifest.ts` 的说明）。
- 角色命名历史上叫 `tutor`，2026-10 已全量改为 `teacher`。
  仍残留的 `tutor` 字样是后端枚举值（`tutoring_center`、`tutor_supported`）与
  一条 `/tutor` 旧路径重定向，不是漏改。

历史版 README（demo 阶段的阶段叙事）归档在
`docs/history/README-phases-2026-08.md`，**只供追溯，不要据此上手**。
