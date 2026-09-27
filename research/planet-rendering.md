# 星球渲染选项研究：SVG / Canvas 2D / WebGL 在 500–2000 点带辉光与呼吸动画下的可行性

票据：[stoa-frontend #10](https://github.com/stoasystem/stoa-frontend/issues/10)（属于 #3，阻塞 #11）
日期：2026-09-27 · 分支 `research/planet-rendering` · 基准页 `research/planet-bench/`（不接入应用）

> 状态：**第 1、3、4 题有一手来源与本机测量；第 2 题里的包体数字与库版本兼容性
> 由于研究子代理未按时返回，标为「待核实」，只给出方向性结论。**
> 基准里「空转」（rot=0）与两种「救 SVG」模式的有头（real GPU）跑数尚未完成，
> 已有的行标在表里，缺的标「待补」。

---

## 0. 结论先行

| 方案 | 2000 点、旋转 + 呼吸 | 中端手机 | 包体 | 可访问性 | 三层缩放 / 惯性 | 推荐 |
|---|---|---|---|---|---|---|
| SVG + 每点 `feGaussianBlur` + CSS 呼吸（原型写法） | 有头 Chromium 桌面 **0.8 fps**（1000 点 1.6 fps，500 点 3 fps） | 更差 | 0 | 天然（`<a>` 元素） | 容易 | **否** |
| SVG，去滤镜改径向渐变精灵、只挂前半球、CSS 呼吸 | 500 点 23 fps，1000 点 12 fps，2000 点 6 fps | 更差 | 0 | 天然 | 容易 | 只够 ≤300 点静态 |
| SVG，同上但呼吸由 JS 写属性（无每点合成层）| 待补 | 待补 | 0 | 天然 | 容易 | 待定 |
| SVG，整层一个滤镜（`<g filter>`）| 待补 | 待补 | 0 | 天然 | 容易 | 待定 |
| **Canvas 2D，预渲染精灵 + `drawImage`** | **120 fps**（vsync 上限），3 档点数无差别 | 软件栅格下 2000 点 69 ms/帧（见 §1.3 说明） | 0 | 需自建 DOM 平行层 | 中等（d3-zoom/versor 可直接用于 canvas） | **推荐（先做）** |
| **WebGL，`gl.POINTS` + 片元着色器画光晕** | **120 fps**，3 档无差别 | 软件栅格下 2000 点 27 ms/帧；真机 GPU 会好得多 | 裸 WebGL ≈ 0；regl/ogl 小；three/pixi 大 | 同 canvas | 中等 | 推荐为 Canvas 2D 的升级路径 |

**建议**：用 **Canvas 2D 起步**（一个 `<canvas>`，点的光晕和星形预渲染成精灵，逐帧
`drawImage`，只画前半球），把「可访问性平行 DOM」和「交互层」（versor 旋转 + 惯性、
d3-zoom 缩放、三层语义缩放）做成与渲染器无关的模块；如果真机（iPhone SE/中端
Android）上 2000 点仍掉帧，再把 `draw()` 换成裸 WebGL `gl.POINTS`（本基准里 ~120 行）。
不引入 three.js / pixi.js：这个场景只有一种图元（带光晕的点）加几条线，
不需要场景图，而它们的包体与本仓现有 vendor 分块（`vite.config.ts`）不成比例。
SVG 保留给**单点放大层**（第三层缩放：一个点及其邻居 ≤ 30 个元素，可用 SVG/HTML 拿到
免费的文字排版、链接与焦点环）。

---

## 1. SVG 在 500 / 1000 / 2000 个带滤镜与 CSS 动画元素下的表现

### 1.1 引擎层面的证据（一手来源）

**滤镜怎么被渲染**

- Chromium 的滤镜设计文档：GPU 滤镜路径只对「已经在合成层里的源」触发（canvas、
  WebGL、video、3D CSS），动画期间才临时上 GPU；SVG 引用滤镜（`filter: url(#id)`）
  是「把元素画进缓冲区再跑一遍 SVG 滤镜 DAG」，软件栅格在 impl 线程用 Skia 做。
  <https://www.chromium.org/developers/design-documents/image-filters/>
- Chromium bug 443328「SVG Blur Rasterization is very slow on Retina」：一个带 SVG
  模糊的动画元素软件栅格 **4.3 fps**，开 GPU 栅格 **47 fps**；原因是滤镜结果按
  tile 缓存而非按图元，动画中的滤镜元素每帧全量重算。
  <https://groups.google.com/a/chromium.org/g/chromium-bugs/c/8HE68DmDxxE>
- Chrome 会按页面内容**否决** GPU 栅格：「页面含很多非凸路径的 SVG（图标常见）时
  GPU 栅格可能被禁用」（chrome://tracing 里的 `GPU Rasterization Veto`）。四角星
  是非凸路径，500–2000 个正是触发模式。
  <https://www.chromium.org/developers/design-documents/chromium-graphics/how-to-get-gpu-rasterization/>
- 模糊成本 ∝ 面积 × 半径：web.dev「半径翻倍要看 4 倍像素，所以每翻倍慢 4 倍」，
  `drop-shadow` 同理，`url()` 滤镜「可以包含任意效果，也可能很慢」，要在手机上测。
  <https://web.dev/articles/understanding-css>
  Chrome「Animating a blur」：卷积滤镜「每个输出像素都要看多个输入像素」，动画模糊
  轻易超过 16 ms 预算；官方建议预先算好几档模糊拷贝，用 opacity 交叉淡入。
  <https://developer.chrome.com/blog/animated-blur>
- 滤镜区域默认 `x/y=-10%`、`width/height=120%`；stdDeviation 大时要再扩
  （否则被裁）。内存与处理时间「和这个矩形的大小相关」（SVG 1.1 §15）。
  <https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/filter>
  <https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feGaussianBlur>
  <https://www.w3.org/TR/SVG11/filters.html>
- Firefox 132 起 WebRender 硬件加速 `feGaussianBlur / feDropShadow` 等原语。
  <https://groups.google.com/a/mozilla.org/g/dev-platform/c/-M0HVkCWjx0>
- WebKit：Apple 平台的滤镜有 CoreImage 加速路径，2025 年的 PR 说「accelerated
  filters 默认开启」；**没有找到 Apple 文档列出 iOS Safari 上哪些原语上 GPU**。
  <https://github.com/WebKit/WebKit/pull/68613>

**SVG 元素上的 transform/opacity 动画是否走合成器**

- Chrome ≥ 89：SVG 元素上的 transform/opacity 动画默认硬件加速（合成器驱动）。
  <https://developer.chrome.com/blog/hardware-accelerated-animations>
  代价：每个动画元素一个合成层；「每个层都要内存和管理，不是免费的」，内存受限
  设备上可能得不偿失，「不要不必要地提升元素」。
  <https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count>
  <https://developer.mozilla.org/en-US/docs/Web/CSS/will-change>
- Firefox（Gecko）早就能在合成器上跑 SVG transform 动画。
  <https://groups.google.com/a/chromium.org/g/blink-dev/c/nRNPNwlRS6E/m/iLB-b5H6DAAJ>
- **Safari/WebKit：旧 SVG 引擎不合成 SVG 子元素的 transform；能做到的是 LBSE
  （Layer-Based SVG Engine），截至 2026-07「已进 WebKit 但仍不是默认，要手动开
  运行时开关」。** Safari 26.x / 27.0 发布说明也没宣布 LBSE 默认。
  <https://blogs.igalia.com/nzimmermann/posts/2026-07-14-lbse-conditional-layers/>
  <https://webkit.org/blog/18325/webkit-features-for-safari-27-0/>
  LBSE 团队自己的教训：每个 SVG 元素一个 RenderLayer 时「上千个层，每层占内存，
  更糟的是每帧要参与大量簿记」（MotionMark Suits 上测得），后来改成只给
  opacity 组、clip/mask/filter、blend、3D transform 等建层。
  → 在 iOS Safari 上，每点 CSS 呼吸动画 = 每帧重绘整张 SVG。

**规模证据**

- 同行评审基准（J. Imaging 2026，Chrome 143，Win/mac/Linux + iPhone 17 Pro +
  Galaxy A52s，动画圆 10–10000 个）：「DOM 方案在 100 个对象时稳定，**500 个时
  一致地退化**」；SVG/CSS 与 HTML/CSS 占 GPU 内存最多；5000 个时 SVG 明显掉帧；
  Canvas 把可用数量往上推，5000–10000 应选 WebGL。
  <https://pmc.ncbi.nlm.nih.gov/articles/PMC12843483/>
- `<use>` 在 Blink/WebKit 里是把被引用子树克隆进每个实例的 shadow root，
  **只省标记不省渲染**。
  <https://lists.w3.org/Archives/Public/public-webapps/2015OctDec/0115.html>
- `content-visibility` 只对能做 size containment 的元素生效，MDN 不列 SVG 图形
  元素，不能用来裁剪 SVG 子元素。
  <https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility>

### 1.2 本机基准（`research/planet-bench/`）

场景：N 个点按 Fibonacci 球分布，正交投影，每点「光晕 + 四角星」，呼吸动画
（scale 1→1.25、opacity 1→0.7、3 s、逐点相位），整球每帧转 ~23°/s（模拟惯性
旋转），只有前半球可见。六种模式画**同一个场景**：

| 模式 | 光晕 | 呼吸 | 后半球 |
|---|---|---|---|
| `svg-filter` | 每点 `<circle filter="url(#glow)">`，`feGaussianBlur stdDeviation=3` | CSS keyframes，每点 `animation-delay` | 留在 DOM 里（被球体盖住） |
| `svg-filter-front` | 同上 | 同上 | `display:none` |
| `svg-sprite` | `<use>` 引用一个 `radialGradient` 圆，**无滤镜** | 同上 | 留在 DOM |
| `svg-sprite-front` | 同上 | 同上 | `display:none` |
| `svg-js`（待补） | 同上 | **JS 每帧写 transform/opacity 属性，无 CSS 动画** | `display:none` |
| `svg-groupblur`（待补） | 所有光晕放在**一个** `<g filter>` 里，只跑一次模糊 | JS | `display:none` |
| `canvas2d` | 光晕 + 星预渲染到一张 sprite canvas，逐点 `drawImage` 缩放 + `globalAlpha` | JS | 跳过 |
| `webgl` | 裸 WebGL1，`gl.POINTS`，片元着色器算径向光晕 + 星形，加法混合 | 顶点着色器 | `discard` |

指标：1 s 预热后 4 s 的 rAF 帧间隔（mean / p95 / fps / >50 ms 长帧数）。
两种配置：`desktop` 1280×800 @2x；`phone` 390×844 @3x + CDP CPU 4× 降速
（Chrome DevTools「Mid-tier mobile」预设）。
**机器：Apple M2 Pro，macOS，Playwright Chromium（chromium-1228 构建）。
不是中端手机；见 §1.3 的解读限制。**

**有头 Chromium（真实 GPU：ANGLE Metal / M2 Pro，vsync 120 Hz）**

| profile | mode | n | mean ms | p95 ms | fps | 长帧 |
|---|---|---|---|---|---|---|
| desktop | svg-filter | 500 | 318 | 484 | 3.1 | 14 |
| desktop | svg-filter | 1000 | 620 | 658 | 1.6 | 7 |
| desktop | svg-filter | 2000 | 1240 | 1260 | 0.8 | 4 |
| desktop | svg-filter-front | 500 | 205 | 226 | 4.9 | 25 |
| desktop | svg-filter-front | 1000 | 317 | 391 | 3.2 | 14 |
| desktop | svg-filter-front | 2000 | 617 | 641 | 1.6 | 7 |
| desktop | svg-sprite | 500 | 115 | 118 | 8.7 | 36 |
| desktop | svg-sprite | 1000 | 172 | 184 | 5.8 | 24 |
| desktop | svg-sprite | 2000 | 354 | 368 | 2.8 | 12 |
| desktop | svg-sprite-front | 500 | 44 | 51 | 22.9 | 9 |
| desktop | svg-sprite-front | 1000 | 86 | 99 | 11.6 | 48 |
| desktop | svg-sprite-front | 2000 | 172 | 190 | 5.8 | 24 |
| desktop | canvas2d | 500 / 1000 / 2000 | 8.3 | 9.4–9.8 | 120 | 0 |
| desktop | webgl | 500 / 1000 / 2000 | 8.3 | 9.8–9.9 | 120 | 0 |
| phone(4×) | svg-filter | 500 / 1000 / 2000 | 316 / 627 / 1252 | — | 3.2 / 1.6 / 0.8 | — |
| phone(4×) | svg-filter-front | 500 / 1000 / 2000 | 195 / 325 / 631 | — | 5.1 / 3.1 / 1.6 | — |
| phone(4×) | svg-sprite | 500 / 1000 / 2000 | 87 / 134 / 153 | — | 11.5 / 7.4 / 6.5 | — |
| phone(4×) | svg-sprite-front | 500 / 1000 / 2000 | 25 / 49 / 105 | — | 40 / 20.6 / 9.6 | — |
| phone(4×) | canvas2d | 500 / 1000 / 2000 | 8.3 | 10.1 | 120 | 0 |
| phone(4×) | webgl | 500 / 1000 / 2000 | 8.3 | 10.2 | 120 | 0 |

**无头 Chromium（SwiftShader 软件 GL、无 vsync 背压）**——只作 CPU 侧参考：

| profile | mode | n=500 | n=1000 | n=2000 |
|---|---|---|---|---|
| desktop | svg-filter | 8.4 ms | 14.8 ms | 37 ms |
| desktop | svg-sprite-front | 8.3 ms | 12.4 ms | 32 ms |
| desktop | canvas2d | 8.4 ms | 8.3 ms | 8.9 ms |
| desktop | webgl | 12 ms | 12.8 ms | 14.6 ms |
| phone(4×) | svg-filter | 20 ms | 55 ms | 129 ms |
| phone(4×) | svg-filter-front | 20 ms | 47 ms | 104 ms |
| phone(4×) | svg-sprite-front | 21 ms | 50 ms | 116 ms |
| phone(4×) | canvas2d | 22 ms | 36 ms | 69 ms |
| phone(4×) | webgl | 17 ms | 26 ms | 27 ms |

**空转（rot=0，只有 CSS 呼吸，不旋转）无头 desktop**：`svg-filter-front` 500/1000 点
8.3 ms、2000 点 16.9 ms；`svg-sprite-front` 2000 点 20.4 ms；canvas2d 2000 点 8.5 ms。
有头空转与 `svg-js` / `svg-groupblur` 两种救法：**待补**（跑数未完成时被叫停）。

WebKit（Playwright webkit）：本机缓存的 WebKit 构建版本与安装的 Playwright 不匹配
（缺 `webkit-2287`），**未跑**。

### 1.3 怎么读这些数字

1. **有头 vs 无头差 20–40 倍**是关键发现：无头 Chromium 的 rAF 只反映主线程
   （样式/布局/绘制记录）成本，栅格与合成在别的线程且没有显示器背压，所以
   SVG 看起来「还行」；有头模式里合成器被真实栅格成本拖住，rAF 跟着掉到 1–3 fps。
   要相信有头数字。这也解释了 phone 4× 降速对 SVG 几乎没影响（CPU 降速只作用于
   主线程，瓶颈在栅格/合成）。
2. **每点滤镜是线性灾难**：每翻倍点数帧时间翻倍（318 → 620 → 1240 ms），
   与 Chromium bug 443328 的「动画中的滤镜元素每帧全量重算」一致；只挂前半球
   减半（正好是可见点数减半），说明成本就是「每个可见滤镜元素一次」。
3. **去滤镜（径向渐变精灵）只换来 3–4 倍**，仍远低于 60 fps：500 点 23 fps、
   1000 点 12 fps。剩下的成本来自 (a) 每帧改 2000 个 `transform` 属性引起的
   全量绘制失效，(b) Chrome ≥89 给每个 CSS 动画的 SVG 元素建合成层，2000 层的
   簿记正是 LBSE 文章描述的那种代价。`svg-js`（去 CSS 动画）会把 (b) 去掉，
   `svg-groupblur` 会把滤镜降到 1 次——这两行待补，但即便按无头 CPU 侧数字看，
   2000 个 DOM 节点每帧 setAttribute 在 4× 降速下也已经 100+ ms。
4. **Canvas 2D 与 WebGL 在真 GPU 上三档点数都顶在 vsync**（120 Hz），差别只在
   无头软件栅格下显出来：canvas2d 2000 点 4× 降速 69 ms，WebGL 27 ms。
   真机 Canvas 2D 是 GPU 加速的（Chrome、Safari 都是），所以 69 ms 是悲观上界；
   但它提示：**中端 Android 上 2000 个带缩放的 `drawImage` 可能贴近 16 ms 预算**，
   届时用 WebGL 替换 `draw()`。
5. 本机是 M2 Pro，**真正的中端手机数字仍需在真机上跑基准页**（把 `index.html`
   放到任意静态服务器上，读左上角 HUD 即可）。一手文献里最接近的是 J. Imaging 2026
   的 Galaxy A52s：DOM/SVG 从 500 个动画对象开始退化。

### 1.4 哪些做法能救 SVG，救到什么程度

| 做法 | 依据 | 效果（本基准） |
|---|---|---|
| 去每点滤镜，改 `radialGradient` 圆或预渲染 `<image>` 精灵 | Chrome「Animating a blur」建议预算模糊拷贝；radialGradient 是 paint server，不开中间表面 | 3–4× |
| 只给前半球元素（`display:none` 后半球） | 可见滤镜元素减半 | 1.5–2×（滤镜模式）；精灵模式 2.5× |
| 一个 `<g filter>` 包住整层，模糊只跑一次 | Chromium 滤镜按层做；LBSE 只给 filter 组建层 | 待补 |
| 呼吸改 JS 批量写属性，或只给 3–5 个「组」做 CSS 动画（同相位的点共享一层） | 合成层数量是成本；web.dev「manage layer count」 | 待补 |
| 分层：静态大多数点 + 少数动画点单独一张 SVG/HTML 层 | Using SVG ch.19：最小化脏矩形 | 未测 |
| `shape-rendering="optimizeSpeed"`、圆代替星路径（避免非凸路径否决 GPU 栅格） | Chromium GPU 栅格否决文档 | 未测 |
| `<use>` 精灵 | Blink/WebKit 克隆子树，不省渲染 | 无 |
| `content-visibility` | 不适用于 SVG 子元素 | 无 |

结论：**SVG 只在「≤ 300 个可见点、无每点滤镜、动画元素 ≤ 几十个」时安全**，
也就是第三层（单点视图）和可能的第二层（一个区域）；整球 500–2000 点动画
不应用 SVG 承载。

---

## 2. Canvas 2D 与 WebGL：接入成本、包体、React 同步、可访问性

> 本节包体数字来自记忆与库首页，**未在本次会话用 bundlephobia 逐一核实**，
> 标 ≈；决策前用 `npx bundlephobia <pkg>` 或 <https://bundlephobia.com> 复核。

### 2.1 候选与包体

| 方案 | min+gz | React 19 | 备注 |
|---|---|---|---|
| Canvas 2D（无库） | 0 | 手写 `useRef`+`useEffect` | 本基准 ~70 行画完整个场景 |
| 裸 WebGL1（无库） | 0 | 同上 | 本基准 ~120 行；`gl.POINTS` 在本机 `ALIASED_POINT_SIZE_RANGE=[1,1023]`，但规范只保证 1，**有些实现上限 64 左右**，>64 px 的点要改成实例化四边形（待核实具体设备） |
| regl | ≈ 28 kB（待核实） | 无官方 React 绑定；命令式，适合 `useEffect` | 函数式 WebGL 封装，一种「draw command」= 一个点云 |
| ogl | ≈ 20 kB（待核实） | 无绑定 | 最小场景图 |
| twgl.js | ≈ 15 kB（待核实） | 无绑定 | 只是 WebGL 样板简化 |
| three.js（`WebGLRenderer + Points + ShaderMaterial` 子集） | 三方常引 ≈ 150 kB 全量、tree-shake 后仍 ≈ 100 kB（待核实） | `@react-three/fiber` v9 支持 React 19（待核实版本号） | 带 OrbitControls（`enableDamping`、`dampingFactor` 0.05、`minDistance/maxDistance`，来源见 §3） |
| pixi.js v8 | ≈ 100+ kB（待核实） | `@pixi/react` v8 要求 React 19（待核实） | 自带 AccessibilityPlugin（给 `accessible: true` 的显示对象生成 DOM 影子按钮）、`ParticleContainer`、`pixi-viewport`（drag/pinch/wheel/decelerate/clampZoom，来源见 §3） |

对比本仓：`vite.config.ts` 把 react、router+query+zustand、i18n、radix+lucide 等分成
vendor 块，主流程没有任何图形库；引入 three 或 pixi 相当于再加一个与
`vendor-react` 同量级的块，只为画一种图元。**包体最小者是「不用库」**，其次 regl/ogl。

### 2.2 与 Vite 6 + React 19 + Tailwind v4 的接入

- 三个方案的 React 接法一样：`<canvas ref>` 放在一个 `position: relative` 的容器里，
  `useEffect` 里创建渲染器、`ResizeObserver` 同步尺寸与 `devicePixelRatio`、
  `requestAnimationFrame` 循环，卸载时取消 rAF、（WebGL）`loseContext`。
  React 19 的 ref 回调可以返回清理函数（React 19 发布说明），适合「挂载即建
  渲染器」。
- **状态同步不走 React 渲染**：点数据、选中点、旋转四元数、缩放级别放在
  `src/store` 的 Zustand store（AGENTS.md：只有这一个 store）；渲染器用
  `store.subscribe(selector, cb)` 拿变更，直接改自己的 typed array / uniform，
  不触发 React 重渲染；React 只负责卡片、面板、链接等 DOM。这与 react-three-fiber
  的 `useFrame` + 外部 store 思路一致，但无需 fiber。
- 命中测试：Canvas 2D 与 WebGL 都不给事件；用投影后的屏幕坐标做最近点查询
  （2000 点线性扫描每次 < 0.1 ms；或 d3-quadtree）。GitHub 地球每 5 帧才做一次
  raycast 以省电（见 §4 精灵来源）。
- Tailwind v4 只管容器与覆盖层；颜色 token（Observatory 调色：#0A1020 底、
  #F2C572 点亮金）读 CSS 变量后传给渲染器（`getComputedStyle`），保证与设计 canvas
  一致。
- WebGL 额外事项：`webglcontextlost/restored` 处理；Chrome 每页同时活跃的
  WebGL 上下文有上限（约 16，超出回收最旧的，待核实具体值）——多星球必须共享
  **一个** canvas / 一个上下文，不能每颗星一个。

### 2.3 可访问性：点是链接

Canvas/WebGL 像素对辅助技术不可见，MDN Canvas 的可访问性指南只保证 `<canvas>`
内的**回退内容**可被读屏读到（hit regions 已移除），因此标准做法是**平行 DOM**：

1. 在 canvas 上方叠一个 `<ul role="list">`（或 `role="listbox"` + roving tabindex，
   WAI-ARIA APG 的 listbox/grid 模式），每个可见知识点一个 `<a href="/topic/…">`，
   `position:absolute` 定位到投影坐标，视觉上透明（不是 `display:none`，否则不可聚焦），
   `aria-label` 含名称 + 状态（已点亮 / 进行中）。
2. 焦点移动时渲染器画焦点环（`:focus-visible` 事件 → store → canvas），并把
   球转到该点（键盘用户也能「旋转」）。
3. 2000 个 `<a>` 太多：只为**当前半球且当前缩放层可见**的点生成（第一层 ≤ 几百个，
   可按区域分组成 `<details>`/分组标题；第二层一个区域几十个；第三层一个点）。
   这与「只画前半球」共用同一个可见性列表。
4. 选中/点亮/跳跃用 `aria-live="polite"` 区域播报。
5. PixiJS 的 AccessibilityPlugin 做的就是同一件事（自动生成影子 `<button>`），
   three.js 没有内置方案——**这不是选库的理由**，平行 DOM 手写 ~100 行。

SVG 方案的可访问性天然更好（`<a>` 就是元素本身），这是 SVG 唯一保留的优势，
因此建议第三层（单点视图）用 SVG/HTML。

---

## 3. 惯性旋转、双指缩放、三层缩放；prefers-reduced-motion

### 3.1 手势输入（与渲染器无关）

- 用 **Pointer Events** 统一鼠标/触摸/笔；多指靠 `pointerId` 缓存，两指时
  `Math.hypot` 求距离比得缩放（MDN 官方示例）。
  <https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures>
- canvas 上 `touch-action: none`（球体自己处理拖与捏），否则浏览器接管手势时
  会发 `pointercancel`。若页面还要单指纵向滚动，用 `pan-y`。
  <https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action>
  <https://www.w3.org/TR/pointerevents/>
- Chrome 56 起 `touchstart/touchmove`、73 起 `wheel` 在根目标默认 passive；要拦
  页面缩放就在 canvas 上 `addEventListener(…, {passive:false})`。
  <https://developer.chrome.com/blog/scrolling-intervention>
  <https://developer.chrome.com/blog/scrolling-intervention-2/>
- 触控板捏合 = `wheel` 事件带 `ctrlKey`，`preventDefault` 可抑制浏览器缩放；
  d3-zoom 默认 `wheelDelta` 已按 `ctrlKey ×10` 处理。
  <https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event>
  <https://groups.google.com/a/chromium.org/g/chromium-dev/c/L_kaBhYFi5U/m/RIMFBx12dJoJ>
- **iOS 10 起 Safari 忽略 `user-scalable=no`**，所以只能靠 `touch-action: none`
  + Safari 专有 `gesturestart/gesturechange` 里 `preventDefault`。
  <https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/>
  <https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html>

### 3.2 惯性旋转

- 正交投影：d3-geo `geoOrthographic()` 默认 `clipAngle(90)` 只画前半球；
  `rotate([λ, φ, γ])`、`invert([x,y])`（屏幕点 → 经纬）。
  <https://d3js.org/d3-geo/azimuthal> <https://d3js.org/d3-geo/projection>
- 拖动用**四元数（versor）**而不是「像素 → 角度」：Jason Davies 说明了朴素映射
  为何漂移；Bostock 的 Versor Dragging 给出 15 行核心循环；`versor` 包提供
  `cartesian / delta / multiply / rotation / interpolate`（slerp，飞向另一颗星时用）。
  <https://www.jasondavies.com/maps/rotate/>
  <https://observablehq.com/@d3/versor-dragging>
  <https://github.com/Fil/versor>
- 惯性：d3-inertia 的做法是拖动中指数加权平均速度，松手后按
  `t = limit·(1 − e^(−B·elapsed/A))` 指数缓出，默认 5000 ms；按住 >100 ms 不动再
  松开则无惯性。这个公式 30 行可自实现，**不必引入 d3-drag**。
  <https://github.com/Fil/d3-inertia> <https://unpkg.com/d3-inertia/src/index.js>
- three.js 对应：OrbitControls `enableDamping` + `dampingFactor 0.05`，需每帧
  `update()`；camera-controls 用 SmoothDamp（`smoothTime` 0.25 s）。
  pixi 对应：pixi-viewport `.drag().pinch().wheel().decelerate()`，减速
  `friction 0.98`/帧。三者都是同一种指数衰减，**任何渲染器都能装同一个惯性模块**。
  <https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/controls/OrbitControls.js>
  <https://github.com/yomotsu/camera-controls>
  <https://github.com/pixijs-userland/pixi-viewport>

### 3.3 缩放与三层语义缩放

- 连续缩放：d3-zoom「与 DOM 无关，可用于 HTML、SVG 或 Canvas」，对球体只取
  `transform.k` 驱动 `projection.scale`，旋转仍由 versor 负责；`scaleExtent`
  钳位；触摸捏合内置。
  <https://d3js.org/d3-zoom>
- 层级切换：按 `k` 的阈值切换渲染层（d3-tile 按 scale 选整数层的做法）；
  层与层之间的飞行用 `d3.interpolateZoom`（van Wijk & Nuij 平滑缩放，默认 ρ=√2），
  「Zoomable circle packing」就是 星球 → 区域 → 点 的现成模式：维护
  `view=[x,y,直径]`，点击后 `interpolateZoom(view, [focus.x, focus.y, focus.r*2])`。
  <https://d3js.org/d3-interpolate/zoom>
  <https://observablehq.com/@d3/zoomable-circle-packing>
  <https://observablehq.com/@d3/zoom-to-bounding-box>
- 三层各自的渲染：
  - **星球层**（全部点、旋转、呼吸）：canvas/WebGL。
  - **区域层**（一个大陆，几十到一两百点，带名称）：canvas 继续画点，名称用
    平行 DOM（同时就是可访问性层）。
  - **点层**（一个点 + 前置/后继）：SVG/HTML，卡片、链接、进度环都用普通组件。
  跳跃（560 ms）与点亮（800 ms）两段动画：在 canvas 里做（径向拉伸精灵 / 光晕
  半径与 alpha 的时间函数），与呼吸共用 `t`。
- 实现难度：三方案的手势与惯性是同一份代码；差别只在「把 (λ, φ, k) 喂给谁」。
  SVG 最省事（改 `<g transform>`），Canvas 2D 与 WebGL 各多一次 `draw()`。

### 3.4 prefers-reduced-motion 退化

- 检测：CSS `@media (prefers-reduced-motion: reduce)`；JS
  `matchMedia('(prefers-reduced-motion: reduce)')` 并监听 `change`。MDN 明确
  「缩放或平移大物体的动画可能是前庭触发因素」——旋转与缩放的星球正是。
  <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>
  <https://web.dev/articles/prefers-reduced-motion>
- WCAG 2.2.2（A）：自动开始、>5 s 的运动要能暂停——自转的待机星球需要暂停
  控件或干脆不自转；2.3.3（AAA）：交互触发的运动动画可关闭。
  <https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html>
  <https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html>
- Apple HIG（Accessibility）：Reduce Motion 开启时「减少自动与重复动画，包括
  缩放、比例与周边运动」，「把 x/y/z 轴过渡换成淡入淡出」，「避免动画进出模糊」，
  「让动画直接跟随手势」。Motion 页：「虚拟世界旋转通常会扰乱稳定感，即使由
  用户控制且很轻微」。
  <https://developer.apple.com/design/human-interface-guidelines/accessibility>
  <https://developer.apple.com/design/human-interface-guidelines/motion>
- 退化方案：保留**直接跟手**的旋转（松手立即停，无惯性）；关闭呼吸（或改成
  不动的两档亮度）；三层切换改交叉淡入而非飞行缩放；跳跃/点亮改为淡入 +
  颜色变化；不自转。渲染器无关，只是 store 里一个 `reducedMotion` 标志。
  另外 `@media (update: slow)` 可用于低端设备关闭连续动画。
  <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/update>

---

## 4. 坐标从哪来；多星球场景

### 4.1 现状

- 后端 `curriculum_service.list_catalog` 的层级是 subject → topic → unit →
  lesson → exercise，只有 `order` 字段，**没有坐标、没有前置边**
  （`stoa-backend/src/stoa/services/curriculum_service.py`）。
- 前端 `src/types/curriculumGraph.ts` 有 `x/y` 与 `prerequisite/related` 边，但只被
  `CurriculumGraphView` 一个演示组件用。
- #3 的备注 Q10：「后端只读接口在服务端算状态与坐标」。

### 4.2 建议：后端给经纬 + 区域，前端不做力导向

| 方案 | 优点 | 缺点 |
|---|---|---|
| **后端算好 (lat, lng, regionId) 存下来，前端只投影** | 坐标稳定（学生每次看到同一张星图；老师、家长、AI 引用「北边那片」都一致）；前端零布局成本；四语共用；可缓存 | 后端多一个离线布局步骤（课程改动时重算） |
| 前端力导向（d3-force / d3-force-3d 加球面约束） | 无需后端 | 每次加载跑模拟（2000 节点数百 tick）、结果不确定、手机上耗电；点会「漂」，破坏空间记忆 |
| 前端确定性布局（Fibonacci 螺旋 + 分区） | 无需后端、确定 | 仍要前端知道区域划分；不同设备算出同一结果，但版本升级时会整体变动 |

布局算法（离线，后端或构建脚本，Python/JS 都行）：

1. **区域 = 大陆**：对 subject 下的 topic 做圆填充（d3-hierarchy `pack`，按 unit /
   lesson 数量加权），在单位圆盘里得到 (x, y, r)，再用**等面积方位投影的逆**
   （`geoAzimuthalEqualArea().invert`）映射到球面，面积比例得以保持；一个半球
   一张 pack（两极各一张），或整盘 `clipAngle(180)`。
   <https://d3js.org/d3-hierarchy/pack> <https://d3js.org/d3-geo/azimuthal>
2. **区域内的点**：每个 topic 的 lesson / skill 在其圆内按 Fibonacci 螺旋放置
   （González 2010：每点面积几乎相等，不聚簇，无极点）；需要「相邻」语义时用
   d3-geo-voronoi 求球面 Voronoi 作为区域边界（O(n log n)，2000 点不成问题）。
   <https://arxiv.org/abs/0912.4540> <https://github.com/Fil/d3-geo-voronoi>
3. 输出：`{ id, lat, lng, regionId, state, label }`，前端只做正交投影 + 状态着色。
   `state` 由后端权威判定（#3 术语「点亮」）。

前置边如果将来要画（第三层）：后端在同一读模型里给 `prerequisites: [id]`，
前端画大圆弧（d3-geo `geoInterpolate`）。

### 4.3 多星球

- **一个 canvas、一个渲染循环**：主星球在中心，其他学科作为远处小星球是同一场景
  里半径更小、点数抽样（只画 5–10% 的点或干脆用一张预渲染贴图）的球；Chrome 的
  WebGL 上下文数上限意味着**不能**一颗星一个 canvas。
- 场景状态：`{ planets: [{subjectId, center, radius, rotation(quaternion), lod}], focus }`
  放 store；切换学科 = `versor.interpolate` 飞向 + `interpolateZoom` 改半径，
  远星球在飞行中升 LOD。
- 数据按学科懒加载（TanStack Query 一个 subject 一个 key），远星球只需
  `{ subjectId, pointCount, litCount }` 就能画出「大致亮度」。
- 先例：GitHub 地球用 three.js + `InstancedMesh` 画 ~12000 个圆，监测 FPS，
  低于 55.5 就依次降像素密度、点数、raycast 频率、抗锯齿；Stripe 地球 ~20000 点
  60 fps，关抗锯齿，滚动时暂停；cobe「零依赖 ~5 kB」用片元着色器 + 球面
  Fibonacci 逆映射画点——正是「不用库的 WebGL」在生产里的样子。
  <https://github.blog/engineering/how-we-built-the-github-globe/>
  <https://stripe.com/blog/globe> <https://github.com/shuding/cobe>
  <https://dl.acm.org/doi/10.1145/2816795.2818131>

---

## 5. 推荐与取舍

**推荐**：Canvas 2D（精灵）作为星球层与区域层的渲染器；WebGL `gl.POINTS` 作为
同接口的备用实现（真机不达标时切换）；SVG/HTML 只承载第三层；交互（versor +
惯性 + d3-zoom 风格的 k）、可访问性平行 DOM、reduced-motion 开关全部做成与渲染器
无关的模块；坐标由后端离线算好随读模型下发。

取舍：

- 放弃原型的 SVG 写法：有头 Chromium 上 500 点已只有 3 fps，去滤镜后也只有 23 fps；
  iOS Safari 因 LBSE 未默认更差。原型的**视觉**（辉光、四角星、呼吸、跳跃、点亮）
  全部能在 canvas 精灵/着色器里复现，本基准已画出同款。
- 不引入 three/pixi：包体与场景复杂度不匹配；它们解决的（场景图、材质、控制器）
  这里只需要 ~200 行。代价是 OrbitControls/pixi-viewport 那种现成手势要自己写
  （§3 给了公式与来源）。
- 可访问性需要自建平行 DOM（~100 行），SVG 方案免费——这是把第三层留给 SVG 的原因。
- 数字来自 M2 Pro，**中端手机的最终判断要在真机上跑 `research/planet-bench/`**；
  `svg-js`、`svg-groupblur`、有头空转三组数据待补，但即便它们把 SVG 救到 30 fps，
  也改变不了 canvas 在同机顶到 vsync 的差距。
- 待核实清单：§2 包体数字与 React 19 兼容版本号；`gl_PointSize` 在目标 Android
  GPU 上的上限；Chrome WebGL 上下文上限具体值；WebKit（Safari）本地基准未跑。

---

## 6. 来源

一手（引擎 / 规范 / 官方文档）：

- Chromium 滤镜设计文档 <https://www.chromium.org/developers/design-documents/image-filters/>
- Chromium bug 443328（SVG 模糊 4.3 → 47 fps）<https://groups.google.com/a/chromium.org/g/chromium-bugs/c/8HE68DmDxxE>
- Chromium GPU 栅格否决 <https://www.chromium.org/developers/design-documents/chromium-graphics/how-to-get-gpu-rasterization/>
- Chrome：SVG 动画硬件加速（89）<https://developer.chrome.com/blog/hardware-accelerated-animations>
- Chrome：Animating a blur <https://developer.chrome.com/blog/animated-blur>
- Chrome：RenderingNG 数据结构 <https://developer.chrome.com/docs/chromium/renderingng-data-structures>
- web.dev：CSS filter 性能 <https://web.dev/articles/understanding-css>；合成层数量 <https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count>；prefers-reduced-motion <https://web.dev/articles/prefers-reduced-motion>
- Chrome：passive 监听器 <https://developer.chrome.com/blog/scrolling-intervention> <https://developer.chrome.com/blog/scrolling-intervention-2/>；touch-action <https://developer.chrome.com/blog/touch-action>
- Chromium PSA：触控板捏合 = ctrl+wheel <https://groups.google.com/a/chromium.org/g/chromium-dev/c/L_kaBhYFi5U/m/RIMFBx12dJoJ>
- WebKit / Igalia：LBSE 条件建层 <https://blogs.igalia.com/nzimmermann/posts/2026-07-14-lbse-conditional-layers/>；Safari 27.0 特性 <https://webkit.org/blog/18325/webkit-features-for-safari-27-0/>；iOS 10 忽略 user-scalable <https://webkit.org/blog/7367/new-interaction-behaviors-in-ios-10/>；加速滤镜 PR <https://github.com/WebKit/WebKit/pull/68613>
- Firefox：WebRender SVG 滤镜加速 <https://groups.google.com/a/mozilla.org/g/dev-platform/c/-M0HVkCWjx0>；bug 925025 <https://bugzilla.mozilla.org/show_bug.cgi?id=925025>
- MDN：`<filter>` <https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/filter>；`feGaussianBlur` <https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feGaussianBlur>；`will-change` <https://developer.mozilla.org/en-US/docs/Web/CSS/will-change>；`content-visibility` <https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility>；Pointer Events 捏合 <https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures>；`touch-action` <https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action>；`wheel` <https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event>；prefers-reduced-motion <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion>；`update` <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/update>
- W3C：SVG 1.1 Filters <https://www.w3.org/TR/SVG11/filters.html>；Pointer Events <https://www.w3.org/TR/pointerevents/>；WCAG 2.2.2 <https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html>；WCAG 2.3.3 <https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html>；`<use>` 克隆语义 <https://lists.w3.org/Archives/Public/public-webapps/2015OctDec/0115.html>
- Apple：HIG Accessibility <https://developer.apple.com/design/human-interface-guidelines/accessibility>；HIG Motion <https://developer.apple.com/design/human-interface-guidelines/motion>；Safari 手势事件 <https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html>
- d3：geo 投影 <https://d3js.org/d3-geo/projection> <https://d3js.org/d3-geo/azimuthal>；zoom <https://d3js.org/d3-zoom>；interpolateZoom <https://d3js.org/d3-interpolate/zoom>；hierarchy pack <https://d3js.org/d3-hierarchy/pack>；Versor Dragging <https://observablehq.com/@d3/versor-dragging>；Zoomable circle packing <https://observablehq.com/@d3/zoomable-circle-packing>；versor <https://github.com/Fil/versor>；d3-inertia <https://github.com/Fil/d3-inertia>；d3-geo-voronoi <https://github.com/Fil/d3-geo-voronoi>；d3-force-3d <https://github.com/vasturiano/d3-force-3d>
- three.js OrbitControls 源码 <https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/controls/OrbitControls.js>；camera-controls <https://github.com/yomotsu/camera-controls>；pixi-viewport <https://github.com/pixijs-userland/pixi-viewport>；three-globe <https://github.com/vasturiano/three-globe>
- 论文：J. Imaging 2026 跨设备动画基准 <https://pmc.ncbi.nlm.nih.gov/articles/PMC12843483/>；González 2010 Fibonacci 格 <https://arxiv.org/abs/0912.4540>；Keinert 等 Spherical Fibonacci Mapping <https://dl.acm.org/doi/10.1145/2816795.2818131>
- 先例：GitHub 地球 <https://github.blog/engineering/how-we-built-the-github-globe/>；Stripe 地球 <https://stripe.com/blog/globe>；cobe <https://github.com/shuding/cobe>
- 本仓：`vite.config.ts`（vendor 分块）、`src/types/curriculumGraph.ts`；后端 `stoa-backend/src/stoa/services/curriculum_service.py`

二手（有测量，标为二手）：Jason Davies「Rotate the World」<https://www.jasondavies.com/maps/rotate/>；Using SVG ch.19 <https://oreillymedia.github.io/Using_SVG/extras/ch19-performance.html>；Cloud Four 图标压力测试 <https://cloudfour.com/thinks/svg-icon-stress-test/>；motion.dev 动画性能分级 <https://motion.dev/magazine/web-animation-performance-tier-list>

---

## English summary

- **Question**: can the student-home "planet" (500–2000 glowing, breathing points on an
  orthographic sphere, inertial rotation, pinch zoom, three zoom levels) be built in SVG as
  prototyped, or does it need Canvas 2D / WebGL?
- **Measured (headed Chromium, M2 Pro, real GPU, 120 Hz)**: the prototype's SVG with a
  per-point `feGaussianBlur` and per-point CSS breathe runs at **3.1 fps at 500 points,
  1.6 at 1000, 0.8 at 2000**. Removing the filter (radial-gradient sprite via `<use>`) and
  dropping back-hemisphere nodes gets **23 / 12 / 6 fps**. Canvas 2D with a pre-rendered
  sprite and raw WebGL `gl.POINTS` sit at the **120 Hz vsync cap at all three counts**.
  Headless numbers (no raster back-pressure) under-report SVG cost by 20–40×; believe the
  headed run. Two further SVG rescue modes (JS-driven breathe, one group filter) and a
  headed idle run are still pending; WebKit was not run (browser build mismatch).
- **Engine evidence**: Chromium recomputes animated SVG filters every frame (bug 443328:
  4.3 fps software vs 47 fps GPU raster); many non-convex paths (stars) can veto GPU raster;
  Chrome ≥89 composites SVG transform/opacity animations but every animated element becomes
  a layer; **Safari's layer-based SVG engine (LBSE) is still not default as of July 2026**,
  so per-point CSS animation repaints the whole SVG on iOS. A 2026 peer-reviewed benchmark
  sees DOM/SVG degrade from ~500 animated objects on phones.
- **Recommendation**: Canvas 2D (sprites) for the planet and region levels, with a
  drop-in raw-WebGL `gl.POINTS` renderer as the upgrade path if mid-range phones miss
  16 ms; SVG/HTML only for the third (single-point) level where it gives free links and
  focus rings. No three.js / pixi.js: one primitive does not justify a vendor-chunk-sized
  dependency (bundle figures in §2 are unverified estimates). Accessibility via a parallel
  DOM of `<a>` elements for the visible hemisphere at the current level, `aria-live` for
  events. Gestures: Pointer Events + `touch-action: none`, versor (quaternion) drag,
  d3-inertia-style exponential decay, d3-zoom-style `k` with `interpolateZoom` for level
  transitions; all renderer-agnostic. Reduced motion: keep gesture-tracked rotation, drop
  inertia/auto-rotate/breathe, crossfade instead of zoom-fly (MDN, WCAG 2.2.2/2.3.3, Apple HIG).
- **Coordinates**: backend computes and stores `(lat, lng, regionId)` offline (circle-pack
  regions → inverse equal-area projection; Fibonacci spiral inside regions); no
  force-directed layout in the client. Multiple planets share one canvas/context.
- **Still to do**: run `research/planet-bench/index.html` on real mid-range phones;
  verify bundle sizes; complete the pending SVG rescue rows.
