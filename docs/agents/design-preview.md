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
- `points`：整片天空的星数 `10` / `1000` / `2000`，默认 1000（演示天空 `src/dev/demo/sky/demoSky.ts`，只经星图数据源接缝注入，见下文「演示数据」，#131）。
- `lang`：`de` / `en` / `fr` / `it`；不给时按浏览器语言。界面文字和演示内容（章节、对话、通知、星名）同一种语言；在 /me 或账号菜单改语言后，后续请求也按新语言作答。
- `signedIn=0`：以未登录访客打开（`login` 默认如此）。
- `longNames=1`：星云用四语里最长的名字（经预览自己的星图覆盖，`withLongNebulaNames`）；全景只画悬停的那团星云名，放大后（#134 按星云屏上大小淡入）才看得到。
- `fresh=1`：清掉演示后端在本标签页里记住的状态（已完成课时、点亮与确认、Ask 里新建的对话和发出的消息，见下文「演示后端的状态」），回到 #116 的开场状态。

页面里一旦移动过，地址栏就始终写回 `path`；登出后写回 `signedIn=0`，在页面里改过语言后写回 `lang`。所以刷新总是回到离开时的那一页、那个登录状态和语言。

| surface | 路由 | 状态 |
| --- | --- | --- |
| `login` | `/login` | 可看 |
| `map` / `map-nebula` / `map-star` | `/map/math`、`/map/math/trigonometry`、`/map/math/trigonometry/demo-sine-cosine` | 可看；#134 起这三个是「什么都没选 / 选了三角函数 / 选了演示知识点」，打开时缩放分别是全景、星形 28 px、34 px，之后可以无级缩放；演示知识点的星卡片「Continue」进入章节 |
| `map-focus-optics` / `map-focus-star` | `/map/physics`（键盘聚焦「光学」）、`/map/math/trigonometry`（聚焦演示知识点） | 可看：聚焦时点亮的连线（#121） |
| `map-optics` / `map-refraction` | `/map/physics/optics`、`/map/physics/optics/demo-refraction` | 可看：跨学科前置（#121） |
| `chapter` | `/chapter/demo-sine-cosine` | 可看：3 个课时，开场时第 1 课已完成 |
| `lesson` | `/chapter/demo-sine-cosine/demo-sine-cosine-2` | 可看：4 道题（单选 ×2、填空、排序），能答错、重试、答对、完成课时 |
| `ask` / `ask-conversation` | `/ask`、`/ask/demo-ask-sine` | 可看；桌面为侧栏，手机为全屏 sheet；`demo-ask-sine` 带一位进行中的老师；能发消息（答复为固定文字）、请老师 |
| `me` | `/me` | 可看 |
| `account-menu` | `/me` 并自动打开头像菜单 | 可看，能退出（回到登录页） |
| `lighting` | `/map/math/trigonometry/demo-sine-cosine` | 可看：打开前把演示知识点的课时全部记为完成、点亮尚未确认，打开这颗星（星卡片）即在这颗星上播放一次点亮动画（#51）；截图等动画结束（`data-lighting="done"`）后再拍 |

## 拦截：怎么做到零后端请求

应用访问后端只有三条路：共用的 axios 实例 `httpClient`、`fetch`（Ask 答复流、统计、角色切换器的会话检查）、WebSocket（实时通知）。`src/dev/preview/interception.ts` 在应用模块加载**之前**把三条路都接管：

- **axios**：给 `httpClient` 换一个 adapter，按 `handlers.ts` 的路由表答以演示数据。`httpClient` 自己的拦截器（令牌、`Accept-Language`、错误映射）照常运行，页面拿到的响应与错误形态和生产一致。
- **fetch**：发往 API 源、开发服务器 `/api` 代理会转发的任何路径（代理按裸前缀匹配：`/api`、`/api?x=1`、`/apiauth/me` 都会被转发，所以都在这里作答并记入 `unanswered`；#126 审计 F2，`tests/component/designPreviewInterception.test.ts` 锁住，并核对 `vite.config.ts` 的代理键就是 `DEV_PROXY_PREFIX`）或任何其他源的请求就地作答（答复流按 SSE 格式返回），只有开发服务器自身的文件放行。
- **WebSocket**：除了 Vite 热更新，一律给一个永远不连接的假套接字。

运行时配置的 API 源登记为 `https://api.design-preview.invalid`（`.invalid` 是保留域名，无法解析）。万一有请求绕过以上三处，它只会在 DNS 失败，并以这个名字出现在网络日志里，到不了任何服务器。

没有演示答复的请求一律答 404，记进 `window.__stoaPreview.unanswered`，不写控制台；页面显示自己的错误态。`window.__stoaPreview.answered` 是已作答的请求清单。

**为什么不用 MSW 浏览器 worker**：worker 要求 `public/mockServiceWorker.js`，而 `public/` 整个会被复制进 `dist`，这条路天然靠近生产包；worker 还要异步注册，首屏请求可能抢在它前面发出。adapter 加 fetch 垫片只存在于预览入口的模块图里，同步装好，构建产物里没有它的位置。`src/mocks/handlers` 仍只给 vitest 用：它覆盖的路由少、形状偏旧（例如 `/me`），复用它反而要先改它。

**存储隔离**：预览与 `npm run dev` 的真实应用同源。`storage.ts` 把 `localStorage` / `sessionStorage` 换成内存实现，每次加载都从同一状态开始：真实应用留下的令牌或「上次学科」影响不到预览，预览的假登录也不会留下令牌被真实应用发往后端；同一界面的两次截图只差被比较的改动。唯一的例外是演示后端自己的状态（#51），它留在本标签页里，见「演示后端的状态」。

**假登录**：入口直接把演示学生写进 `useAuthStore`（令牌只在内存里），再由真实的 `AuthBootstrap` 读 `/auth/me`，与登录后的路径一致。

## 截图

无级缩放（#134）的连续帧另用 `node scripts/design-preview-zoom-frames.mjs --base <开发服务器> --label <集>`，见 `starmap-demo.md`「无级缩放」。

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
- 可选：`--surfaces map,lesson`、`--points 1000`、`--viewports phone`、`--lang de`、`--long-names`（`index.json` 会记录）。
- 对照页只取与所请求完全相同的星数档；缺那一档时明确写出「No 2000-star screenshot … (taken: 1000 stars)」，不拿别的档顶替。实时模式有「Long names」开关。
- 脚本同时监听页面的每个请求与 WebSocket：发往开发服务器以外（或其 `/api` 代理，同样按裸前缀判断）的请求会列出，并使脚本以 1 退出；无演示答复的请求、控制台错误与警告也会列出。

界面清单由页面自己报告（`window.__stoaPreviewSurfaces`，来自 `surfaces.ts`），脚本不另存一份。

## 不进生产包

两道互相独立的防线，任一道都能单独拦下。

**构建期守卫**（#126 审计 F1 之后加的，最硬的一道）：`vite.config.ts` 里的插件 `devOnlyCodeStaysOut`（名字 `stoa:dev-only-code-stays-out`）。生产构建结束时检查 Rollup 模块图里的每个模块 id（去掉 `?raw` 之类的查询）和每个产出资源的来源文件，只要有一个在 `src/dev/` 或 `src/mocks/` 下，构建直接失败，报错列出文件。它不管代码是怎么进来的——根绝对路径、`import.meta.glob`、`new URL(…, import.meta.url)`、`?url` / `?raw`、新加的别名都一样。`apply: 'build'`，所以开发服务器（本来就要伺服 `src/dev/`）不受影响；vitest 用的是自己的 `vitest.config.ts`，也不受影响；星图台架 `vite.bench.config.ts` 构建的就是 `src/dev/starmap.html`，按名字把这个插件去掉，全仓只有那一处。`npm run build` 与部署工作流用的都是 `vite.config.ts`，所以 push 到 `main` 的门禁本身就会被它拦下。

**`tests/component/designPreviewExcluded.test.ts`**（在 `npm test` 里；没放进 `test:release`，因为那条脚本被 `scripts/verify-release.mjs` 逐字锁定）：

1. 从 `src/main.tsx` 走完整个模块图，`src/dev/` 与 `src/mocks/` 下的文件一个都不能出现。跟随 Vite 收文件的每一种方式：静态 import、re-export、字面量 `import()`、`@/` / 相对 / 根绝对（`/src/...`，按项目根解析）说明符、`import.meta.glob`（字符串或数组模式，按导入文件解析后用 `fs.globSync` 展开；`!` 排除模式忽略，只会多算不会少算）、`new URL('…', import.meta.url)`。读不出来的一律抛错而不是放过：非字面量的 `import()` / glob / `new URL`、既不是文件也不是 `node_modules` 里已装包的说明符（未知别名、`virtual:`、URL）、不存在的路径。另有阳性对照（在临时文件里依次写入审计的两种投毒、数组 glob、`?raw`、`new URL`，断言都走到 `src/dev/` / `src/mocks/`，五种读不出来的写法都抛错）和阴性对照（走到 `App.tsx`、`AppRoutes.tsx` 等 200 个以上的模块）。
2. 生产构建到临时目录（约 3 秒，上面的构建期守卫在这一步生效）：只允许 `index.html` 一个 HTML，任何 JS 包里不得出现预览独有的标记（`stoa.design-preview.v1`、`api.design-preview.invalid`、`__stoaPreview`）；阴性对照确认包里有 `stoa.web.runtime-config.v1`。

投毒验证：在 `src/main.tsx` 的 `loadApplication` 里加一行 `void import('./dev/preview/main')`，两项都变红（模块图列出 `src/dev/preview/*` 七个文件；构建产物 `main-*.js` 带上三个标记）。#126 审计之后又在 `src/App.tsx`（或 barrel）里投毒六种，测试与单独的 `npm run build` 结果如下：

| 投毒 | 模块图 | 生产构建 |
| --- | --- | --- |
| `import { PreviewChrome } from '/src/dev/preview/PreviewChrome'` | 红，列出 10 个 `src/dev/` 文件 | 失败：`The production build takes in dev-only code: src/dev/preview/PreviewChrome.tsx` |
| `import.meta.glob('./dev/preview/PreviewChrome.tsx', { eager: true })` | 红，同上 | 失败，同上 |
| `import './dev/preview/PreviewChrome'` | 红 | 失败 |
| `src/components/base/index.ts` 里 `export * from '@/dev/preview/PreviewChrome'` | 红 | 失败 |
| `import('./dev/preview/' + 'PreviewChrome')` | 红：`has an import() this walk cannot follow` | 通过（Vite 不打包运行时拼出的路径，代码不进包） |
| `new URL('./dev/demo/sky/demo-sky.json', import.meta.url)` | 红 | 失败：`The production build emits dev-only files: src/dev/demo/sky/demo-sky.json` |

前两种在审计时（`871ec24`）测试全绿、代码进了 `assets/App-*.js`。

**演示天空也不进生产包**（#131）。第 2 项同时在 JS 包里搜演示天空的标记：演示知识点 id `demo-sine-cosine`、桥接星 id `demo-refraction`、演示知识点四语名称（Sine and cosine 等）、只在 `demo-sky.json` 里的占位星技能名 `Ordering integers`，以及演示专用文案的四语版本（Demo 横幅「Demo · Sample content and progress」、占位星说明「Placeholder star · demo content, no chapter.」、长星云名）。标记从 `src/dev/demo/sky` 本身取，另有一项断言它们确实出现在 `demo-sky.json` / 文案里，不会悄悄失效；阴性对照是空星图标题「Your star map is on its way」必须在包里。投毒两次：`useStarMap` 重新 import `demoStarMap` → 模块图列出 `src/dev/demo/sky/` 三个文件、`PlanetScreen-*.js` 带上 7 个标记；把 `demo` 文案放回 `en/starmap.json` → `index-*.js` 带上三条英文文案。

`vite.config.ts` 只以 `index.html` 为构建入口，`src/dev/*.html` 本来就不会被构建；以上测试与构建期守卫锁住的是「应用不会把它带进来」。

## 演示数据

数据来自 #116 的演示数据集 `src/dev/demo/data`（契约见其 `index.ts`）。`src/dev/preview/demoSource.ts` 是 handlers 读它的唯一入口：按当前语言取 `demoDataFor(language)`，并记住本页已完成的课时。`handlers.ts` 的练习接口直接用 #116 的 `checkDemoAnswer`（判题）、`demoHint`（提示）、`demoLessonResult`（完成课时）、`demoRoadmap(completed)`（章节进度），老师求助用 `demoTeacherHelpRequests` / `demoTeacherAvailability`。

**星图的数据源接缝**（#131，由 #51 的覆盖接缝泛化而来）：`src/features/starmap/starMapSource.ts` 的 `StarMapSourceContext`，值是 `{ read(request), demo }`。`useStarMap` 只读它，不 import 任何演示数据。生产默认 `emptyStarMapSource`：空天空（没有学科、星云、星）、`demo: false`，正式路由显示空状态（`starmap:emptySky.*`），不显示 Demo 横幅；#48 接读模型时就换掉这个默认。演示天空、生成器和演示专用文案在 `src/dev/demo/sky/`（`demo-sky.json`、`demoSky.ts`、`demoStarMap.ts`、`strings.ts`、`source.tsx`）；`source.tsx` 的 `demoStarMapSource` / `<DemoStarMapSource>` 给台架和测试用，import 它时把 `starmap:demo.*` 文案加进 i18next（这些文案已不在 locale 文件里，所以不进生产包，也不进 `check:untranslated` 的视野）。

完成一个课时后，章节与路线图跟着前进（例如 1/3 → 2/3）。星图也跟着走（#51）：`src/dev/preview/lighting.tsx` 的 `PreviewLighting` 经数据源接缝提供演示天空，再过一遍 `demoStarMapOverride`，把演示知识点的状态换成 #116 的 `demoKnowledgePointState(completed)`；课时全部完成后它点亮，物理里唯一还差它这个前置的 Refraction 变成可开始，推荐标记按后端规则移到下一个（#9 第 8 条）。

### 演示后端的状态（#51）

演示后端记住这些：Ask 里新建的对话、每个问题及其答复（id 用后端按命令推导的 `commandMessageIds`，流事件同一个 id，不会显示两遍）、已完成的课时、演示知识点第一次点亮的时间（完成最后一个课时的那次写入时记下，`litAtSource: observed`）、学生是否已确认这次点亮（stoa-backend#71 的形状）。这些是「服务端」的状态：存在 `demoSource.ts` 里，并镜像到**本标签页真实的** `sessionStorage`（键 `stoa.design-preview.v1.demo-server`，由 `storage.ts` 在模块加载、隔离之前取得，应用本身看不到）。所以：

- 同一标签页刷新：课时仍是完成的，星仍点亮，确认也还在，**不重播**；
- 新标签页、新浏览器上下文（截图脚本每张图都是）或 `?fresh=1`：回到 #116 的开场状态；
- `lighting` 界面每次打开都重新设成「已点亮、未确认」，用来反复看动画。

应用这边不存任何东西：是否庆祝只看事件源给的「未确认点亮」，确认后由事件源去掉（`LightingEventSourceContext`，生产默认是永不发事件、不发请求的空源）。Ask 里的点亮卡片只在本次会话的内存里（`store/litMomentsStore.ts`），刷新后消失；把卡片写进对话本身需要后端，留给 #3。

只有演示知识点 `demo-sine-cosine`（数学 · 三角函数）有章节；占位星的星卡片没有进入章节的按钮。

## 交互走查

```bash
node scripts/design-preview-flows.mjs --base http://127.0.0.1:5173
```

依次走：登录表单登录 → 从演示知识点的星卡片进入章节 → 下一课时每道题先答错、重试、再答对，直到完成课时（并确认路线图把它记为完成）→ Ask 发消息收到流式答复 → 账号菜单退出 → 打开通知铃 → 切换学科。完成课时后的画面存为 `.codex-screenshots/design-preview/flows/lesson-finished.png`。

每一步都在沉淀 2 秒（Ask 7 秒）后检查屏幕上的终态，而不是只看 URL 或某个事件出现过：例如切换学科后标题和切换器仍在 Physics、Ask 的问题和答复在气泡里各出现一次、通知面板先开后关。

然后是点亮时刻（`scripts/design-preview-lighting-flows.mjs`，每段各用一个新的浏览器上下文）：做完演示知识点剩下的课时 → 从章节回星图，动画在这颗星上只播一次、`aria-live` 播报「Sine and cosine is lit」→ 物理的 Refraction 读作「Ready to start」→ 从星图的输入框打开 Ask、进入一段对话，看到点亮卡片 → 刷新不重播、星仍点亮 → Refraction 的星卡片读作可开始 → 开 reduced motion：不播动画但仍播报 → 手机（390×844）上的动画与 Ask sheet 里的卡片。帧序列与各状态截图存在 `.codex-screenshots/design-preview/lighting/`。任何一步失败、任何请求离开开发服务器、任何请求没有演示答复、任何控制台错误或警告，脚本都以 1 退出。

## 逐项核查

```bash
node scripts/design-preview-checks.mjs --base http://127.0.0.1:5173
```

2026-10-02 审计（#123）里预览与点亮时刻的每条发现各有一项核查（点亮只算焦点星系、推荐按学科、只在星真正上屏后确认、法意文案、Ask 消息保留、刷新回到原处、对照页不顶替档位、长名称），`--only 1,5` 只跑其中几项。

## 已知限制

- 点亮时刻只演示「演示知识点」这一颗；判据只看课时是否全部完成（#9 还要求每道题至少答对一次，演示数据里完成课时前已逐题答对）。
- Ask 的答复是固定文字（只有英文），不是 AI；新发起的老师求助只返回「等待中」。
- 点亮只在星真正上屏、所在星系在焦点、页面可见时开始，并在动画播完（reduced motion 下在播报）时才确认；星一直不在屏上时只是等着，不提示、不超时。
- 写操作只回一个合理答复；除了「完成课时」在本页内记住之外都不保存，刷新即复原。
- 浏览器模拟视口，不是真机（#114 已接受这一限制）。
- `src/dev/starmap.html`（#48 的星图台架）没有接这层拦截，通知组件仍会请求 `localhost:8000`；看设计请用本预览。
