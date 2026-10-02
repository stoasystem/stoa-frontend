# 本地设计预览（#115）

在开发服务器上、**不连任何后端**，以一个已登录的演示学生打开 #114 范围内的界面，并出三种视口的截图对照。只在开发服务器上存在，不进生产包。

## 启动

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

| 页面 | 地址 |
| --- | --- |
| 单个界面 | `/src/dev/preview.html?surface=map&points=1000` |
| 任意路由 | `/src/dev/preview.html?path=/chapter/u-1-1&lang=de` |
| 三视口并排（实时） | `/src/dev/preview-compare.html?surface=map&points=1000` |
| 三视口并排（截图，改前 / 改后） | `/src/dev/preview-compare.html?mode=shots&surface=map&before=<集>&after=<集>` |

预览挂的是**真实**的 `AppProviders`、`AuthBootstrap`、`AppRoutes`（由 `routeManifest.ts` 生成，与生产同一份路由与守卫）和 `AppLayout`，只是路由器换成 `MemoryRouter`。所以评审看到的就是会发布的那套页面；在页面里点来点去会改写地址栏的 `path=`，刷新停在原处。

## 参数

- `surface`：见下表；与 `path` 同给时 `path` 优先。
- `points`：星图星数 `10` / `1000` / `2000`，默认 1000（沿用 `starMapFixture`）。
- `lang`：`de` / `en` / `fr` / `it`；不给时按浏览器语言。
- `signedIn=0`：以未登录访客打开（`login` 默认如此）。

| surface | 路由 | 状态 |
| --- | --- | --- |
| `login` | `/login` | 可看 |
| `map` / `map-nebula` / `map-star` | `/map/math`、第一团星云、它的第一颗星 | 可看；星卡片显示「内容即将推出」，见下 |
| `chapter` | `/chapter/u-1-1` | 可看（临时桩数据：2 个课时） |
| `lesson` | `/chapter/u-1-1/demo-lesson-2` | 可看，能作答、看反馈、完成课时 |
| `ask` / `ask-conversation` | `/ask`、`/ask/demo-conversation-1` | 可看；桌面为侧栏，手机为全屏 sheet；能发消息（答复为固定文字）、请老师 |
| `me` | `/me` | 可看 |
| `account-menu` | `/me` 并自动打开头像菜单 | 可看，能退出（回到登录页） |
| `lighting` | `/map/math` | **未实现**：点亮时刻还没有代码，页面左下角有提示条 |

## 拦截：怎么做到零后端请求

应用访问后端只有三条路：共用的 axios 实例 `httpClient`、`fetch`（Ask 答复流、统计、角色切换器的会话检查）、WebSocket（实时通知）。`src/dev/preview/interception.ts` 在应用模块加载**之前**把三条路都接管：

- **axios**：给 `httpClient` 换一个 adapter，按 `handlers.ts` 的路由表答以演示数据。`httpClient` 自己的拦截器（令牌、`Accept-Language`、错误映射）照常运行，页面拿到的响应与错误形态和生产一致。
- **fetch**：发往 API 源、开发服务器 `/api` 代理或任何其他源的请求就地作答（答复流按 SSE 格式返回），只有开发服务器自身的文件放行。
- **WebSocket**：除了 Vite 热更新，一律给一个永远不连接的假套接字。

运行时配置的 API 源登记为 `https://api.design-preview.invalid`（`.invalid` 是保留域名，无法解析）。万一有请求绕过以上三处，它只会在 DNS 失败，并以这个名字出现在网络日志里，到不了任何服务器。

没有演示答复的请求一律答 404，记进 `window.__stoaPreview.unanswered`，不写控制台；页面显示自己的错误态。`window.__stoaPreview.answered` 是已作答的请求清单。

**为什么不用 MSW 浏览器 worker**：worker 要求 `public/mockServiceWorker.js`，而 `public/` 整个会被复制进 `dist`，这条路天然靠近生产包；worker 还要异步注册，首屏请求可能抢在它前面发出。adapter 加 fetch 垫片只存在于预览入口的模块图里，同步装好，构建产物里没有它的位置。`src/mocks/handlers` 仍只给 vitest 用：它覆盖的路由少、形状偏旧（例如 `/me`），复用它反而要先改它。

**存储隔离**：预览与 `npm run dev` 的真实应用同源。`storage.ts` 把 `localStorage` / `sessionStorage` 换成内存实现，每次加载都从同一状态开始：真实应用留下的令牌或「上次学科」影响不到预览，预览的假登录也不会留下令牌被真实应用发往后端；同一界面的两次截图只差被比较的改动。

**假登录**：入口直接把演示学生写进 `useAuthStore`（令牌只在内存里），再由真实的 `AuthBootstrap` 读 `/auth/me`，与登录后的路径一致。

## 截图

开发服务器运行时：

```bash
npm run design-preview:capture -- --base http://127.0.0.1:5173 --label before
# 改代码
npm run design-preview:capture -- --base http://127.0.0.1:5173 --label after
```

然后打开 `/src/dev/preview-compare.html?mode=shots&before=before&after=after`。

- 输出：`.codex-screenshots/design-preview/<label>/<surface>__<desktop|phone|narrow>__<points>.png`，Git 忽略；`index.json` 记录每一组。
- 视口：`desktop` 1440×900、`phone` 390×844、`narrow` 375×812；手机两档开启触屏与移动端模拟，`deviceScaleFactor` 为 1。
- 显示星图的界面拍 10 / 1000 / 2000 三档，其余只拍一档。
- 可选：`--surfaces map,lesson`、`--points 1000`、`--viewports phone`、`--lang de`。
- 脚本同时监听页面的每个请求与 WebSocket：发往开发服务器以外（或其 `/api` 代理）的请求会列出，并使脚本以 1 退出；无演示答复的请求、控制台错误与警告也会列出。

界面清单由页面自己报告（`window.__stoaPreviewSurfaces`，来自 `surfaces.ts`），脚本不另存一份。

## 不进生产包

`tests/component/designPreviewExcluded.test.ts`（在 `npm test` 里；没放进 `test:release`，因为那条脚本被 `scripts/verify-release.mjs` 逐字锁定）：

1. 从 `src/main.tsx` 沿静态 import、re-export 与字面量 `import()` 走完整个模块图，`src/dev/` 与 `src/mocks/` 下的文件一个都不能出现；另有阴性对照确认走到了 `App.tsx`、`AppRoutes.tsx` 等 200 个以上的模块。
2. 生产构建到临时目录（约 3 秒）：只允许 `index.html` 一个 HTML，任何 JS 包里不得出现预览独有的标记（`stoa.design-preview.v1`、`api.design-preview.invalid`、`__stoaPreview`）；阴性对照确认包里有 `stoa.web.runtime-config.v1`。

投毒验证：在 `src/main.tsx` 的 `loadApplication` 里加一行 `void import('./dev/preview/main')`，两项都变红（模块图列出 `src/dev/preview/*` 七个文件；构建产物 `main-*.js` 带上三个标记）。

`vite.config.ts` 只以 `index.html` 为构建入口，`src/dev/*.html` 本来就不会被构建；以上测试锁住的是「应用不会 import 它」。

## 演示数据

`src/dev/preview/demoSource.ts` 是 handlers 读取演示数据的唯一入口，目前是最小的临时桩（一个学生、一条通知、一段对话、一个两课时的章节），用应用自己的类型标注。#116 的演示数据集落在 `src/dev/demo/data/index.ts` 后，这个文件改为从那里 re-export `demoStudent`、`demoProfile`、`demoNotifications`、`demoConversations`、`demoChapter`，桩删除。星图本身仍走 `useStarMap` 的夹具，#116 若改了星图演示数据，预览自动跟随。

章节桩的知识点是 1000 / 2000 星图的第一颗星 `u-1-1`。星图夹具把每颗星的 `chapter.lessonCount` 置 0，所以星卡片显示「内容即将推出」、没有进入章节的链接；从星图点进章节要等 #116 给出那颗有完整内容的演示知识点。

## 已知限制

- 点亮时刻未实现，`lighting` 只是占位。
- Ask 的答复是固定文字，不是 AI；老师求助只返回「等待中」。
- 写操作（作答、改语言、改通知偏好）只回一个合理答复，不保存；刷新即复原。
- 浏览器模拟视口，不是真机（#114 已接受这一限制）。
- `src/dev/starmap.html`（#48 的星图台架）没有接这层拦截，通知组件仍会请求 `localhost:8000`；看设计请用本预览。
