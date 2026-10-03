# 本地设计预览（#115）

在开发服务器上、**不连任何后端**，以一个已登录的演示学生打开 #114 范围内的界面，并出三种视口的截图对照。只在开发服务器上存在，不进生产包。

## 启动

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

| 页面 | 地址 |
| --- | --- |
| 单个界面 | `/src/dev/preview.html?surface=map&points=1000` |
| 任意路由 | `/src/dev/preview.html?path=/chapter/demo-sine-cosine&lang=de` |
| 三视口并排（实时） | `/src/dev/preview-compare.html?surface=map&points=1000` |
| 三视口并排（截图，改前 / 改后） | `/src/dev/preview-compare.html?mode=shots&surface=map&before=<集>&after=<集>` |

预览挂的是**真实**的 `AppProviders`、`AuthBootstrap`、`AppRoutes`（由 `routeManifest.ts` 生成，与生产同一份路由与守卫）和 `AppLayout`，只是路由器换成 `MemoryRouter`。所以评审看到的就是会发布的那套页面；在页面里点来点去会改写地址栏的 `path=`，刷新停在原处。

## 参数

- `surface`：见下表；与 `path` 同给时 `path` 优先。
- `points`：整片天空的星数 `10` / `1000` / `2000`，默认 1000（演示天空 `demoSky`，#119 起是星图唯一的数据）。
- `lang`：`de` / `en` / `fr` / `it`；不给时按浏览器语言。界面文字和演示内容（章节、对话、通知、星名）同一种语言；在 /me 或账号菜单改语言后，后续请求也按新语言作答。
- `signedIn=0`：以未登录访客打开（`login` 默认如此）。

| surface | 路由 | 状态 |
| --- | --- | --- |
| `login` | `/login` | 可看 |
| `map` / `map-nebula` / `map-star` | `/map/math`、`/map/math/trigonometry`、`/map/math/trigonometry/demo-sine-cosine` | 可看；星层停在演示知识点上，它的星卡片「Continue」进入章节 |
| `chapter` | `/chapter/demo-sine-cosine` | 可看：3 个课时，开场时第 1 课已完成 |
| `lesson` | `/chapter/demo-sine-cosine/demo-sine-cosine-2` | 可看：4 道题（单选 ×2、填空、排序），能答错、重试、答对、完成课时 |
| `ask` / `ask-conversation` | `/ask`、`/ask/demo-ask-sine` | 可看；桌面为侧栏，手机为全屏 sheet；`demo-ask-sine` 带一位进行中的老师；能发消息（答复为固定文字）、请老师 |
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

数据来自 #116 的演示数据集 `src/dev/demo/data`（契约见其 `index.ts`）。`src/dev/preview/demoSource.ts` 是 handlers 读它的唯一入口：按当前语言取 `demoDataFor(language)`，并记住本页已完成的课时。`handlers.ts` 的练习接口直接用 #116 的 `checkDemoAnswer`（判题）、`demoHint`（提示）、`demoLessonResult`（完成课时）、`demoRoadmap(completed)`（章节进度），老师求助用 `demoTeacherHelpRequests` / `demoTeacherAvailability`。

完成一个课时后，章节与路线图在本页内跟着前进（例如 1/3 → 2/3），刷新回到 #116 的开场状态。星图本身走 `useStarMap` 的夹具，不读这些接口，所以星的学习状态不随完成课时变化；那是点亮时刻要做的事。

只有演示知识点 `demo-sine-cosine`（数学 · 三角函数）有章节；占位星的星卡片没有进入章节的按钮。

## 交互走查

```bash
node scripts/design-preview-flows.mjs --base http://127.0.0.1:5173
```

依次走：登录表单登录 → 从演示知识点的星卡片进入章节 → 下一课时每道题先答错、重试、再答对，直到完成课时（并确认路线图把它记为完成）→ Ask 发消息收到流式答复 → 账号菜单退出 → 打开通知铃 → 切换学科。完成课时后的画面存为 `.codex-screenshots/design-preview/flows/lesson-finished.png`。任何一步失败、任何请求离开开发服务器、任何请求没有演示答复、任何控制台错误或警告，脚本都以 1 退出。

## 已知限制

- 点亮时刻未实现，`lighting` 只是占位。
- Ask 的答复是固定文字，不是 AI；新发起的老师求助只返回「等待中」。
- 写操作只回一个合理答复；除了「完成课时」在本页内记住之外都不保存，刷新即复原。
- 浏览器模拟视口，不是真机（#114 已接受这一限制）。
- `src/dev/starmap.html`（#48 的星图台架）没有接这层拦截，通知组件仍会请求 `localhost:8000`；看设计请用本预览。
