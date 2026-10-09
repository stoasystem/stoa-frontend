# stoa-frontend

STOA 学习平台前端，React 19 + TypeScript + Vite 的 SPA。生产环境
https://app.stoaedu.ch ，后端 https://api.stoaedu.ch 。

## 权威文档在别处

这份文件只讲本仓的操作要点。产品需求、架构、API、数据模型、当前进度一律以
`stoasystem/stoa-docs` 为准：`PRD.md` → `HLD.md` → `PLAN.md` → `ADR.md` →
`DEPLOYMENT.md`，技术债清单见 `PROJECT_SLIM_PLAN.md`。多仓协作的纪律写在工作区根目录的
`CLAUDE.md` 里。**动代码前先读那边，不要只读这一份。**

## 技术栈（以 package.json 为准）

```
React 19 · TypeScript 5.5 · Vite 6 · Zustand 5 · TanStack Query 5
react-router-dom 7 · i18next 26（de / en / fr / it 四语）
测试：Vitest 4 · Playwright 1.60 · node:test（release 契约）
```

不使用 aws-amplify。旧文档里写的「AWS Amplify JS」已经不成立，仓里没有这个依赖，
源码也没有任何引用；Cognito 走后端。

## 常用命令

```bash
npm install
npm run dev          # scripts/vite.mjs 包了一层，不要直接 vite
npm run lint         # eslint . --max-warnings=0，零容忍
npm run typecheck    # tsc -b
npm test             # vitest run
npm run test:smoke   # playwright，打真部署，需要 STOA_SMOKE_PASSWORD
npm run test:e2e:dist  # playwright，打本地 dist、mock 后端按 OpenAPI 校验；先 build，见 tests/e2e-dist/README.md
npm run build        # tsc -b && vite build
```

冒烟不在 CI 里，部署之后由发布的人手动跑；什么时候必须跑、跑哪些条目，见
[stoa-backend#27 决议的「频率」一节](https://github.com/stoasystem/stoa-backend/issues/27#issuecomment-5846611751)。
怎么跑、哪些 AI 回答要人工确认，写在 `tests/smoke/01-preflight.spec.ts` 开头。

两个守卫脚本在 CI 里会跑，本地改动相关区域时也该跑：

```bash
npm run check:api-contract   # 比对后端 main 的 route-authorization-inventory.json
npm run check:untranslated   # 未翻译文案的棘轮，基线在 scripts/untranslated-baseline.json
```

## push 即部署

`main` 分支 push 会触发 `.github/workflows/deploy-production.yml`，先过一道门
（lint → typecheck → API 契约 → 翻译守卫 → 单测 → release 契约 → publisher 测试），
过了才 build 并发布到 S3 + CloudFront。**没有预发环境，提交前想清楚。**

API 契约那步是从 `stoasystem/stoa-backend` 的 **main 分支**实时拉取路由清单。所以涉及
接口变更时，先推后端再推前端，否则这道门会拦下来。

改版在集成分支 `redesign/planet` / `redesign/cute` 上进行，不直接进 `main`，
分支命名与门禁见 `docs/agents/redesign-branches.md`。

## 目录约定

```
src/app        应用装配与 provider
src/pages      路由页面
src/layouts    布局骨架
src/features   按领域切分的功能模块（uploads 等）
src/components 跨页复用组件
src/hooks      按领域分组的 hooks
src/services   API 客户端与外部服务
src/store      Zustand store —— 只有这一个，写新状态放这里
src/i18n       四语言 locale 资源
tests/         unit · component · smoke（真部署）· release
```

## 判断死代码

「这个模块还有没有人用」只认 `node scripts/dead-code-scan.mjs`（import 图 + 整词计数取交集，
自带阴性 / 阳性对照，自检失败 exit 1）。**不要拿裸 `grep` 的零命中当删除依据**：agent shell
里的 `grep` 是带 `-I` 的 ugrep，会静默跳过含 NUL 等二进制字节的文件；BSD `command grep -n`
对这种文件只打印 `Binary file … matches`。用法、结论含义、盲区和复现见
`docs/agents/dead-code.md`。

## 还没清理干净的地方

改到这些区域时先确认状态，别在废弃分支上加功能：

- `backend/` —— SQLite 的 demo 后端（含 `local.db`），与真正的 `stoa-backend` 并存，
  是契约漂移的来源。**新功能一律写 `stoa-backend`，不要往这里加东西。**
- `.planning/` —— GSD 工具留下的 1051 个文件，占仓库一半以上，最后改动 2026-08-15。
- `docs/` —— 273 个入库文件，最后改动 2026-07-07，与 `stoa-docs` 职责重叠。
- `vercel.json` —— 部署实际走 S3 + CloudFront，这个文件是历史遗留。
- 未挂路由的旧版 student / teacher / parent 页面，以及双首页、双 Mistakes 页实验。

`src/stores/`（与 `src/store/` 并存的那个空壳）已经删除，旧文档若还提到它，是旧文档过时。

## Agent skills

### Issue tracker

GitHub Issues via the `gh` CLI (stoasystem/stoa-frontend). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
