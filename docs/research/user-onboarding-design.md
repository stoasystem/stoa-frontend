# 用户导引设计：skills、样例与动画调研

调研日期 2026-10-22。目的：为 STOA 设计用户导引（首次进入、角色分流、功能讲解）
收集可用的 agent skills、实现库、动画方案和参考样例。产品决策以 `stoa-docs` 为准，
这份只是素材整理。标「未核实」的数字来自厂商博客或二手转述，别直接引用。

## 1. 仓内现状

- `/onboarding`（`src/pages/onboarding/OnboardingPage.tsx`）是公开的静态说明页，路由清单里
  标 `status: 'demo'`：三张角色卡（学生 / 家长 / 老师），每张列编号步骤，文案在
  `support` 命名空间。没有应用内导引、没有进度状态、没有动画。
- 已有动效 token（`src/styles/brand-tokens.css:207-235`）：`--motion-press 120ms`、
  `--motion-panel 280ms`、`--motion-sheet 320ms`、`--motion-jump 560ms`、
  `--motion-reduced 200ms`（减弱动效时全部换成线性淡入淡出），以及 `--ease-out`、
  `--ease-standard`、`--ease-jump`。
- 星图已经有一套成文的动效政策（`src/features/starmap/motion/motionPolicy.ts`）：
  「除了推荐星的呼吸，没有东西自己动」；减弱动效时去掉惯性和呼吸，换层改成 200 ms 淡入淡出。
  有 `usePrefersReducedMotion` hook。**导引动画应直接沿用这套政策和 token**，不另起一套。
- 依赖里没有任何动画库或导引库（无 framer-motion / lottie / joyride）。已有 Radix Dialog，
  可用来做欢迎弹窗；`sonner` 可做轻提示。
- 依赖审计门禁只看 `dependencies`：新增的导引库或动画库会进入生产审计范围，选型时要算进去。

## 2. 可用的 agent skills / 插件

本机 claude.ai skill 目录里没有导引相关 skill。可装的：

| 名称 | 内容 | 许可 | 安装 |
|---|---|---|---|
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 一个设计 skill + 24 个命令，其中 `onboard`（首次流程、空状态、激活路径）、`animate`（有目的的动效）、`delight`（惊喜时刻），另有 `critique` / `audit` / `polish` | Apache 2.0 | `npx impeccable install` 或 `/plugin marketplace add pbakaus/impeccable` |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | 写动画代码前先讲动效原则：8 步清单、时长 / 缓动表、编排、迪士尼 12 原则的 UI 版、入场 / 退场 / 状态反馈配方。与实现无关（CSS、Motion、GSAP、Lottie 都适用） | MIT | `npx skills add LottieFiles/motion-design-skill` |
| Anthropic 目录插件 **Design** | 设计评审、UX 文案、无障碍审查、用户研究综合、交付规格 | Anthropic 官方 | claude.ai 插件目录 |
| 目录插件 **design-skills** | 交互设计、旅程地图、UX 文案、无障碍审计等 10 个 skill | 社区 | claude.ai 插件目录 |
| 目录插件 **Mobile App Design (iOS)** | 含 `/onboarding` 命令和 300+ 真实 iOS app 流程库（UXKIN MCP）。偏 iOS 原生，可当样例库用 | 社区 | claude.ai 插件目录 |

另有社区 skill `onboarding-ux`（moderndegree/agent-skills）、`ui-animation`
（travisjneuman/.claude、mblode/agent-skills），搜索结果有列，但仓库页面未能打开，**未核实**。

建议：装 `impeccable`（拿 `onboard` + `animate`）和 `motion-design-skill` 两个就够；
都是纯文本 skill，不进依赖树。

## 3. 实现库

| 库 | 许可 | 特点 | 适配度 |
|---|---|---|---|
| [driver.js](https://github.com/kamranahmedse/driver.js) | MIT | ~5 KB gzip，零依赖，TS，高亮 + 弹层 + 遮罩，全键盘可控；无 React 绑定，用 DOM 选择器 | 高。体积小，适合「高亮某个按钮讲一句」 |
| [react-joyride](https://github.com/gilbarbara/react-joyride) | MIT | React 原生，支持 React 16.8–19，步骤器、主题齐全 | 中。功能全但重；有厂商称维护放缓，**未核实**，选前看 commit 记录 |
| Shepherd.js / Intro.js | AGPL 或付费商业许可 | — | **不建议**，许可证不合适 |
| Reactour | 宽松许可 | React 组件 | 备选 |
| 自写（Radix Dialog + Popover 定位 + Zustand 记进度） | — | 完全对齐品牌和动效 token，无新依赖 | 高。步骤少（≤5）时最划算 |

比较来源：[inlinemanual 2026 对比](https://inlinemanual.com/blog/driverjs-vs-introjs-vs-shepherdjs-vs-reactour)、
[Chameleon JS 导引库 2026](https://www.chameleon.io/blog/javascript-product-tours)。

## 4. 动画方案

| 方案 | 用途 | 备注 |
|---|---|---|
| CSS transition + 现有 token | 弹层出现、高亮框移动、步骤切换 | 首选，零依赖，直接读 `--motion-*` |
| [Motion](https://motion.dev)（原 Framer Motion） | 需要编排 / 布局动画时 | 官方称 `m` + `LazyMotion` 首屏约 4.6 KB；`MotionConfig reducedMotion="user"` 跟随系统设置。许可证据称 MIT，未在官方页核实 |
| Lottie | 设计师做的插画动画（欢迎页吉祥物、完成庆祝） | 生态大，文件偏大 |
| Rive | 有状态的交互动画（会对点击做反应的角色） | 厂商称文件比 Lottie 小 10–15 倍，**未核实** |

参考：[Lottie vs Rive vs CSS 2026](https://www.pkgpulse.com/guides/lottie-vs-rive-vs-css-animations-web-animation-formats-2026)、
[Motion 减小包体积](https://motion.dev/docs/react-reduce-bundle-size)。

动效规则（结合星图政策）：

- 导引里只有「当前要看的东西」可以动，一次一个焦点。
- 时长沿用 token：弹层 280 ms、手机 sheet 320 ms、按压 120 ms。`--motion-jump 560ms` 是进入章节的跃迁，不挪作他用。
- `prefers-reduced-motion` 下：不位移、不缩放、不循环，统一 200 ms 线性淡入淡出。

## 5. 设计原则与样例

**先给价值，再要东西。** Duolingo 把注册挪到做完几道题之后，联合创始人称日活提升约 20%
（[Taplytics](https://taplytics.com/blog/duolingo-ab-test-onboarding)）。顺序是：目的 → 水平 →
投入承诺 → 练习，最后才是探索产品（[screensdesign 拆解](https://screensdesign.com/articles/duolingo-onboarding-design/)）。

**目标问题放最前，答案用于个性化。** Lazyweb 2026 年调研 119 个问卷式 app，24 个在导引里问目标，
建议放第一题（[Lazyweb](https://www.lazyweb.com/research/how-many-apps-ask-goal-question-onboarding)）。

**家长设置、孩子使用。** Khan Academy Kids 由家长建账号、配孩子档案
（[cchub 对比](https://cchub.africa/a-snapshot-of-onboarding-strategies-of-selected-edtech-companies/)）。
STOA 的学生 / 家长 / 老师三角色正好需要分流。

**空状态就是导引。** 空白页应像邀请而不是报错：一句标题 + 一个行动按钮，往往不需要单独的教程
（[designproject 指南](https://www.newsletter.designproject.io/p/onboarding-ux-design-guide)）。

**渐进披露，少用连环弹层。** 功能在用到时再讲，而不是首次登录一口气讲完
（[Userpilot](https://userpilot.com/blog/progressive-disclosure/)）。

更多样例：[Appcues 十佳导引](https://www.appcues.com/blog/the-10-best-user-onboarding-experiences)、
[UXCam 十个 app](https://uxcam.com/blog/10-apps-with-great-user-onboarding/)、
[Brilliant 截屏](https://screensdesign.com/showcase/brilliant-learn-by-doing)。

## 6. 无障碍硬要求

- 弹层打开时焦点移入，关闭时回到触发元素；模态时背景 inert（WAI-ARIA APG）。
- `role="dialog"`、`aria-modal`、`aria-labelledby` 指向可见标题。
- WCAG 2.1.1 键盘、2.1.2 无键盘陷阱、2.4.3 焦点顺序、2.4.11 焦点不被遮挡（导引气泡不能盖住正在讲的控件）。
- 永远有「跳过」和「以后再看」，Esc 可关。
- 四语文案都要进 locale，`check:untranslated` 棘轮会拦。

## 7. 非线性星图：从哪里开始

Duolingo 的路径是一条线，起点不言自明。STOA 是一片天空（ADR 0001）：多个星系、
每个星系多片星云和多颗星，第一眼看不出该从哪开始。

### 天空其实有结构

- 前置关系（stoa-backend#56）让星图成为有向无环图。新生能走的只有 `ready` 的根节点，
  `locked` 的星都在后面，所以真正能选的只是一条很窄的边界。
- #9 第 8 点：每个学科最多推荐一颗星，先取进行中的，没有就取可开始的，按
  `(topic.order, unit.order, unit_id)` 取第一个。所以每个星系里，系统本来就有一条隐含的线性主干。
- 推荐星是全图唯一自己会动的东西（呼吸），也是每个视图里都保留的 Tab 停靠点
  （`StarMapView.tsx:815-817` 的注释：「it is the way in」）。

### 真正不显然的是两件事

1. **从哪个星系开始。** 修 N 门课就有 N 颗推荐星，散在整片天空里。
2. **推荐的起点是课程开头，不是学生在学校实际学到的地方。** 新生没有证据，规则会落到
   每个学科的第一颗星；学期中途加入的学生会被推荐去学早就学过的东西。

### 可参考的非线性导引

- **《塞尔达：旷野之息》初始台地**：先把玩家放在一块封闭的小区域里学会基本操作，
  离开台地时世界才整个打开。
- **《艾尔登法环》赐福指引**：开放世界里只给一道指向下一步的金光，不画路线。
- **《星际拓荒》飞船日志的「传闻模式」**：知识是节点和箭头组成的星座图，没去过的节点是「?」，
  随探索逐个显现。它的起点也是一座天文台，和 Murmi 的设定对得上。
- **禀赋进度效应**（Nunes & Drèze 2006，洗车集章卡实验）：一开始就送两格进度的卡比从零开始的卡
  完成率高。对应到星图：第一眼看到的天空不应该全黑。

### 方案

- **A. 先到一颗星，再看到宇宙。** 首次进入时镜头直接停在推荐星近处，周围压暗，只露出这一片星云，
  Murmi 说一句话，按钮只有「开始这颗星」。第一次点亮之后镜头拉远，让整片天空和从这颗星出发的
  前置连线一起显现，在有意义的时刻教会结构。只做一次；减弱动效时换成 200 ms 淡入淡出。
  纯前端，不需要后端。（注：`--motion-jump 560ms` 已有用途，是从星进入章节的「跃迁」，
  `src/features/chapter/jump.ts`，揭示镜头要另定时长。）
- **B. 一个问题选星系。** 用「这周学校在上哪门课 / 哪一章？」代替让学生在宇宙里自己挑，
  答案映射到星系或星云，镜头飞过去。对应 Duolingo 把目标问题放第一题的做法。
  如果只选星系，前端就能做；如果要选到星云，需要把答案存到后端。
- **C. 让起点贴近学校进度。** 三条来源，可以叠加：
  1. 老师指定。`source: 'teacher'` 的形状已经留好，后端还没做。
  2. 入门小测：几道题批量点亮已经会的星。第一眼天空就有亮处，推荐也自然落到边界上。
     需要后端支持「凭小测点亮」，而这和 #9 第 3 点「点亮 = 完成全部课时 + 每题答对过」冲突，
     要么改规则，要么另设一种「已掌握（测出）」的标记。
  3. 年级默认：按学生年级，把推荐的起点挪到对应的星云。
- **不建议**：一进来就展示全景再逐个讲解区域，等于连环弹层讲一张地图；
  或者让学生在 N 颗推荐星里自由挑，选择本身就是负担。

### 建议顺序

A 和 B 只动前端，先做。C 决定了推荐对不对，但规则在后端（#9），需要单开后端议题；
在那之前，A 至少保证新生「知道按哪里」，只是按下去的未必是最合适的那颗。

### A 和 B 要补什么（2026-10-22 盘点）

已有、直接复用：

| 需要 | 已有 |
|---|---|
| 镜头落到推荐星所在星云、星保持在视野里 | `LayerTarget` 的 `{ layer: 'nebula', nebulaId, whole: { star } }`（`view/layers.ts`），点亮后回图就是这么落的 |
| 周围压暗 | 注视点渲染（`view/foveation.ts`）：没选中的星云本来就画成模糊低清贴图 |
| 第一次点亮的庆祝 | `LightingOverlay` + `flare.ts`，生产源已接 `unacknowledgedLit`（stoa-backend#71 已关），确认记在服务端 |
| 气泡放在星旁边、不挡名字 | `lighting/labelPlace.ts` 的 `placeBesideStar` + 引擎的 `starOnScreen` |
| 引导角色 | `Murmi`，`watching`（有东西值得看）/ `delighted`（点亮） |
| 拉远的飞行曲线 | 引擎的 van Wijk 平滑缩放，远距离会先拉远再推近 |
| 减弱动效 | `motionPolicy` + `usePrefersReducedMotion` |
| B 的选项 | 读模型的 `subjects: Galaxy[]`，`enrolled` 标出在修的学科 |

不需要：

- **导引库。** driver.js / react-joyride 高亮的是 DOM 元素的矩形。星画在 canvas 上，
  会随镜头移动，位置只能从引擎拿。引库反而要绕过它。
- **动画库。** 镜头飞行在引擎里，气泡用 CSS + `--motion-*` token 就够。Lottie / Rive 只有在
  Murmi 要做成会动的角色时才考虑，现在的 Murmi 是 SVG，表情靠换脸。

要新写：

1. **「新生」的判定。** 建议直接从数据推：整片天空没有 `lit`、也没有 `in_progress` 的星，就是新生。
   不存「看过导引」的标记。好处：真相在服务端、共享设备上换人也对（ADR 0003），退出登录清本地状态
   也不影响。代价：没开始学的学生每次进来都会落到推荐星，这本身是对的。气泡「知道了」只记在
   sessionStorage，本标签页内不再出现。
> 2026-10-22 起，第 1–3 项与第 7 项的演示数据已做成设计预览：`preview.html?surface=map-newcomer`
> （`src/features/starmap/onboarding/`、`src/dev/demo/sky/newcomer.ts`）。

2. **首屏落点。** 新生进 `/map` 时，路由改指向推荐星的星云（`whole: { star }`），不开卡片。
   修多门课时，先经过 B 再落点。
3. **气泡组件。** Murmi + 一句话 + 「开始这颗星」（进章节）+「先随便看看」。非模态：
   不锁焦点、不盖住星，Esc 关闭，`aria-live` 读出同样的话。
4. **揭示编排（A 的后半段）。** 触发条件：一次 `observed` 点亮之后，整片天空的 `lit` 正好是 1。
   顺序：flare 播完 → 停一拍 → 镜头拉远到整片天空 → 从这颗星出发的前置连线亮起 →
   下一颗推荐星开始呼吸。需要一个比 `ZOOM_MS 420` 长的一次性飞行时长（新 token），
   以及 `linkTiers` 里「从这颗星出发」这一层的强调。减弱动效时：不飞，200 ms 淡入到全景。
5. **B 的问题卡。** 只在 `enrolled` 的学科多于一门时出现，一门就跳过。选项是星系名，
   外加「我不确定」（落到 `order` 最前的星系）。只用来决定镜头飞去哪个星系，不存答案。
6. **四语文案。** Murmi 的话、按钮、B 的问题，进 `starmap` 命名空间，过 `check:untranslated`。
7. **演示数据与测试。** 设计预览需要一片「新生天空」：零点亮、只有根节点 `ready`
   （`src/dev/demo/sky`）。e2e-dist 的 mock 后端加同样的 fixture；单测覆盖新生判定、
   B 的跳过条件、揭示只触发一次。

### skills

不是必需的。真正的难点在编排上，而这些已经写在星图的动效政策里。可选：

- `impeccable` 的 `critique` / `onboard`：做出预览后让它挑问题，当第二双眼睛。
- `motion-design-skill`：给揭示的那段镜头定时长和停顿时，可以参考它的编排章节。

设计侧要给的：Murmi 的台词、揭示镜头的分镜（每段时长）、是否需要比注视点渲染更强的压暗。

## 7b. 录屏暴露的两个问题（2026-10-22）

### 学完三角函数，还推荐「整数 / 分数」

- 直接原因：推荐规则（#9 第 8 点）按 `(topic.order, unit.order)` 取第一颗可开始的星，
  这等于课程开头。
- 演示里还有一处是我作弊：为了让「正弦和余弦」能当起点，新生天空删掉了它的前置。
  按 CONTEXT.md 的规则，真实新生的三角函数是**锁定**的，根本开始不了。这比「多余」更严重。
- 星本身不该删：一片天空是 ADR 0001 的决定；分数正是三角函数的前置，
  正是它们让结构有意义。问题在于它们画得和「还没学」一样，等于告诉学生「这些你都还要做」。

方向（需要后端与 ADR，状态由后端判定）：

1. **推定掌握**：点亮一颗星，它（递归）未点亮的前置视为「推定已会」。
   画成暗金，不计入点亮数（#9 的「点亮」保持严格），但算作满足前置、不再进入推荐。
   这是知识空间理论（ALEKS）的做法。CONTEXT.md 规定只有四种状态，所以它应是一个标记，
   并且要改「可开始」的定义：前置全部「点亮或推定掌握」。
2. **推荐沿着学生的边界走**：先推荐刚点亮的星的后继，而不是全局第一颗。
3. **整颗星的跳过测验**：课时级的跳过测验已经有了（`quiz.ts`，stoa-backend#92）。
   扩到星级，对应「这个我会了」。

### 想练导数，怎么找到

用底部的输入框：「我想继续练导数」→ 系统找到这颗星。像地图 App 规划路线：

- **识别**：两层。先在本地按星名和星云名匹配（天空数据已经在前端，零延迟）。
  匹配不到或说法模糊（「怎么算变化有多快」），交给 Ask 后端，由它返回结构化的「目标知识点」，
  而不只是一段文字。
- **回应**：镜头飞到导数；从学生已点亮的星到导数，把还缺的那几颗星连成一条亮起的路径。
  Murmi 说：「导数要先学极限和变化率。你已经点亮了函数，从极限开始。」
  按钮：开始第一颗缺的星 / 用测验跳过它 / 先看看导数。
- **导数锁定时**：现在锁定的课时会被后端拒绝（`lesson_locked`）。建议不放开，而是走路径，
  每一步都可以测验跳过，会的学生几分钟就能到。
- 路径计算可以在前端做，前置关系已在读模型里。意图识别要后端。
- 演示天空没有微积分，原型需要先加一片「微积分」星云。

## 8. 待决定的问题

1. 导引范围：只做首次登录的角色分流，还是也做功能点讲解（星图、Ask、练习）？
2. 进度存哪：本地（Zustand + localStorage）还是后端用户档案（跨设备、家长可见）？后者要先推后端。
3. 自写还是引 driver.js？步骤少就自写。
4. 要不要吉祥物 / 插画动画（Lottie 或 Rive）？需要设计资源。
