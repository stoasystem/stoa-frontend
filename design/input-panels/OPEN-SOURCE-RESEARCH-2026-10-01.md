# STOA 辅助公式输入：交互设计与开源工具选型

> 原讨论与调查日期：2026-10-01（Europe/Zurich）。恢复整理日期：2026-10-23。
>
> 状态：历史设计讨论与选型记录，供继续评审和制作原型使用。用户提出了方向，助手给出了交互与选型建议；记录不代表全部方案已获批准、已实现或已上线。
>
> 本文从原始聊天和原文档编辑记录恢复。第一部分合并当时的设计讨论，并保留后续修正；第二部分保留完整选型原文的正文，仅调整标题层级以便合并阅读，并在前面补充历史时态说明。工具版本、维护状态、兼容性及许可调查均截至原调查日期，本次未重新联网核查。

## 阅读导航

- [第一部分：交互设计](#第一部分交互设计)
- [第二部分：开源工具选型记录](#第二部分开源工具选型记录)
- [第三部分：来源与恢复说明](#第三部分来源与恢复说明)

本文件是历史材料，不替代 `stoasystem/stoa-docs` 中的产品需求、架构和进度。继续实施时，应先与该仓的 [PRD](https://github.com/stoasystem/stoa-docs/blob/main/PRD.md)、[HLD](https://github.com/stoasystem/stoa-docs/blob/main/HLD.md)、[PLAN](https://github.com/stoasystem/stoa-docs/blob/main/PLAN.md)、[ADR](https://github.com/stoasystem/stoa-docs/blob/main/ADR.md) 和 [DEPLOYMENT](https://github.com/stoasystem/stoa-docs/blob/main/DEPLOYMENT.md) 核对。下文提及的预览分支、源码路径和依赖是当时快照。

## 第一部分：交互设计

### 1. 问题与用户提出的方向

目标用户是中小学生。他们不熟悉 Markdown、LaTeX 等表达语法，但需要输入数学、物理、化学、生物问题。除了上传照片和文档，还需要帮助他们表达公式、过程和困惑。

设计同时处理两个门槛：题目如何输进去，以及学生如何指出自己哪里不懂。学生看到课本式的表达，系统承担公式排版。

用户在讨论中提出：

> 我们是否可以设计成靠语言命令唤起的不同输入面板呢？比如说输入数学问题，比如说分数，积分之类的，那就出现数学的输入面板，化学的就出现化学的面板。这个不同的输入面板会根据用户输入自主调整最合适用户目前的内容，可以靠用户的固定命令主动唤起？

当时形成的交互建议是：**自然语言推荐、固定命令直接唤起、按钮随时可用。三种入口共用同一套输入面板。**

小学与多学科是这次讨论的扩展方向。当时核查的 PRD 仍限定数学 MVP、7–9 年级与 Gymnasium，不能把本讨论直接视为扩大后的正式产品范围。

### 2. 三种入口与面板响应

| 入口或用户输入 | 建议的界面响应 |
| --- | --- |
| 点击「输入工具」 | 展示「分数」「积分」「化学式」等选项，同时显示对应命令 |
| 在文字输入区输入 `/` | 打开同一个菜单，可继续输入筛选 |
| “这道题有分数……” | 在输入框旁推荐「用分数工具输入」 |
| “打开分数输入”或 `/分数` | 直接展开分数模板，填写分子、分母 |
| “打开积分输入”或 `/积分` | 展开上下限、被积函数、积分变量的填写位置 |
| “打开化学输入”或 `/化学` | 展开下标、电荷、反应箭头等工具 |
| “帮我输入一个反应式” | 展开反应物、生成物和可选反应条件 |

关键区分是：**学生正在谈什么，不等于学生要调用什么工具。** “我不懂积分”可能是在求解释；“打开积分输入”才明确表示调用工具。普通问题中的关键词先产生建议，不因一个学科词自动展开面板。

固定命令通过按钮菜单和 `/` 菜单展示，不要求初次使用的学生记住命令。中文示例用于说明交互；de/en/fr/it 的正式命令、别名与文案仍需设计和验证。

### 3. 自动推荐与编辑稳定性

| 规则 | 具体含义 |
| --- | --- |
| 主动命令优先 | 学生手动选了化学面板，保持该选择，直到学生切换或关闭 |
| 推荐先于展开 | 普通语言给出工具建议；明确的“打开……”命令直接展开 |
| 自动变化限于推荐区域 | 数学面板保留分数、幂、根号等基础工具；当前内容只改变推荐重点 |
| 编辑过程保持稳定 | 填分母期间不替换面板、不移动按钮、不抢走光标 |
| 保留原文和草稿 | 模板填完先展示预览，由学生插入；支持回到面板修改 |
| 歧义交给学生选择 | 无法确定工具或表达含义时，提供少量明确选项 |
| 面板跟随当前表达 | 化学问题中也可推荐数学或单位工具，不把整个学习会话锁定成单一学科 |

例如，输入“从 0 到 1 的积分”时，推荐区突出定积分模板；“浓度计算”可以同时推荐反应式和数值与单位。第一版建议使用固定命令、常见表达和当前题目上下文，再根据实测判断哪些模糊表达值得交给 AI。

命令监听应限定在文字输入区。数学编辑器内部的 `/` 可能表示分数，Enter 可能表示完成编辑；命令选择、输入法 composition 和模板填写不能被外层 Enter 发送逻辑误判。具体组合验证见第二部分。

### 4. 填空式公式与可编辑预览

点击「公式」后，先展示少量常用工具：分数、平方、根号、括号、不等号。

- 点分数，出现分子和分母两个填写位置。
- 点平方，选中的内容变成上标。
- 点积分，按模板填写上下限、被积函数和积分变量。
- 公式在编辑时就呈现排版效果，学生无需看到 `\frac` 或 `$...$`。
- 插入后保留可再次编辑的公式卡片；需要完整段落混排时，再评估富文本编辑器。

自然语言也可作为输入。例如“x 的平方加三倍 x 等于 4”，系统提供可编辑的公式预览，保留原文，并允许撤销转换。这是当时提出的能力方向，尚无自然语言转换的运行验收记录。

`1/2x` 有歧义时，分别展示分母为 `2` 和分母为 `2x` 的排版，让学生选择。排版助手只帮助表达，学生写错的计算步骤应原样保留，供后续讨论；不能在排版阶段自动改错或配平。

### 5. 学科工具范围

| 学科 | 当时建议的表达工具 | 范围说明 |
| --- | --- | --- |
| 数学 | 分数、幂、根号、角度、积分、简单坐标图 | 模板输入与图示分别处理；低年级减少工具数量 |
| 物理 | 公式、单位、向量箭头、受力草图 | 单位排版不等于单位校验，图示不等于物理仿真 |
| 化学 | 下标、离子电荷、反应箭头、反应条件 | 常见化学式与分子结构绘图分开选择工具 |
| 生物 | 圈选、标注、箭头、过程图、实验数据表 | 图示属于扩展面板，不要求默认加载完整画布 |

工具可参考当前题目或章节提供建议，也允许学生手动切换。无需先让学生选一套复杂编辑模式。

### 6. 少抄题、问这一步与帮助按钮

公式输入只是提问体验的一部分。最先考虑减少重复输入：

- 在 STOA 内做题时，提问携带当前题目和自己的尝试。
- 点击公式或解题步骤，选择「问这一步」。
- 选中题目中的一句话，选择「解释这句话」。
- 提问框上方显示可移除的上下文，如「正在问：第 3 题 / 第二步」。

输入框的提示可表达为：“写下题目，或者告诉我你卡在哪里。公式也可以用文字描述。” 输入框附近可提供「看不懂题意」「给我一点提示」「检查我的步骤」「解释这里」等帮助按钮。需要补充信息时，一次只追问一个必要问题。

当时提到 Ask 已有练习上下文和引用回答的基础。这是历史快照的判断，本次恢复没有重新审计当前实现。

### 7. 设备、步骤区与草稿纸的修正

初始建议包含自由手写草稿纸。用户随后质疑没有 iPad 等设备时是否可行，后续方案据此收敛：**先做自然语言提问、可视公式输入、问这一步和图上标注；自由手写画布后置。**

| 输入设备 | 后续建议 |
| --- | --- |
| 鼠标、触控板 | 点选、标注、连接图形；长篇手写公式优先级低 |
| 手机手指 | 圈选、简单箭头；精细公式使用键盘和模板 |
| 触控笔 | 可提供完整手写草稿，作为可选入口 |

对没有笔的用户，优先讨论了两种方式：

1. **解题步骤区。** 用文字和可视公式逐行记录尝试，能对某一步请求检查或提示。例如保留“第一步：2x + 3 = 11；第二步：2x = 14”，让系统看到学生的真实思路。
2. **点选式图示与标注。** 在已有题图上点一个位置再提问；用端点生成线段，用方向选择添加箭头。Desmos 的操作可作为参考，但不是免费嵌入其完整产品的许可依据，也未经过学生实测。

后续若做自由草稿纸，最小工具曾建议为笔、橡皮、撤销、文字标注和「问圈出的地方」。手写可先作为图片发送，再单独评估识别与编辑。语音也是后续方向：先转成可编辑文字，涉及公式时提供预览确认。识别服务与输入面板的选型分别评估。

### 8. 视觉布局与首轮验证

所有面板共用一致的容器、字号和操作位置，只更换工具内容。默认界面收起工具，每次只突出当前需要的操作。

- **桌面：** 面板放在输入框下方。步骤区像整洁的作业本，公式对齐；点击当前行才显示该行操作。
- **手机：** 面板从底部展开；系统文字键盘与公式键盘轮流出现，题目和当前填写位置保持可见。
- **阅读区：** 正文和公式使用稳定的阅读基线、高对比和稳定背景；星空用于周围氛围。

当时建议先验证三个完整流程：

| 流程 | 观察重点 |
| --- | --- |
| 分数输入 | 能否发现入口，填写分子分母，预览、插入并继续写文字 |
| 积分输入 | 能否理解模板字段，在填写时保持光标和面板稳定 |
| 化学反应式输入 | 能否填写反应物、生成物与条件，并重新编辑表达式 |

共同观察工具是否容易发现、错误推荐能否轻松切换、学生能否独立完成表达。不同学段应分别验证，先在普通笔记本和手机上确认收益，再决定是否投入完整草稿纸。

以下内容当时仍未确定，不应从讨论中推断已完成：正式四语命令表、自然语言转换与推荐效果、模板未完成时的最终交互、草稿持久化范围、文字与公式卡片的传输约定、真实手机键盘与无障碍体验，以及学生可用性。原型验证项目详见第二部分末尾。

## 第二部分：开源工具选型记录

以下恢复的是 2026-10-01 的完整研究内容。此部分中的“当前”“本轮”“已有”“最新”均指当时调查和明确列出的源码快照，不指恢复日期的环境。版本与许可结论没有在本次恢复中重新验证。


核查日期：2026-10-01（Europe/Zurich）。本记录服务于产品设计与后续原型选型，不是接入验收。

### 建议

首轮优先采用 **MathLive + 现有 KaTeX/mhchem + 现有 Radix UI**。需要搜索、别名、分组和键盘选择的命令菜单时，可增加 **cmdk**。需要在段落中混排多个可编辑公式时，评估 **Tiptap + MathLive**。分子结构绘图另行按需加载 **Ketcher**，不把整个专业化学编辑器放进默认提问框。

这些工具提供编辑器、渲染器或菜单；本次调查没有找到能直接完成 STOA 所需「自然语言判断 → 推荐工具 → 显式命令打开 → 保留草稿和焦点 → 插入表达式」整个行为的成熟成品。产品仍需一层很小的命令和推荐逻辑。

建议把草稿中的表达式保留为可回到面板修改的公式卡片，发送时才转换成传输文本。直接把 MathLive 输出的 LaTeX 塞进可见 textarea，会重新让学生面对源码，不能满足本次设计目标。完整段落内的富文本混排则是 Tiptap 路线。

### STOA 当前可复用的部分

核查本地新设计预览快照 `5c30681a1efd926a3bda62f2d688f58ded5c5922`，路径 `/private/tmp/stoa-preview-enable-20260930/frontend-git`，即此前预览的 PR #107 head；远端 `redesign/planet` 本轮回读为 `bf60cb0b61d4b54d89ffd1847b6c7498ae1b0a54`。不是把本地快照当成当前生产。

- `package.json` 已有 React 19、KaTeX `^0.18.3`、Radix Dialog/Dropdown Menu/Tabs、i18next、Zustand、Zod。
- 已有 `src/components/base/Composer.tsx` 和 `src/components/ui/MathRenderer.tsx`，可以保留现有文本提问和回答渲染基础。
- `src/components/ui/katexLoader.ts` 当前只加载 KaTeX 和 CSS，未加载 mhchem。
- Composer 的 Enter 是发送，已有输入法 composition 保护。新增命令选择/公式编辑须与发送分开处理，不能让选择命令或填写模板时误发。

权威 PRD 当前仍写数学 MVP、7–9 年级与 Gymnasium，以及快速提交和分步引导目标。小学与多学科是这次讨论的扩展方向。[PRD](https://github.com/stoasystem/stoa-docs/blob/main/PRD.md)

### 1. MathLive：数学可视输入的优先候选

- 主仓是 [arnog/mathlive](https://github.com/arnog/mathlive)，由 [官网](https://mathlive.io/mathfield/) 的 GitHub 链接确认；不能将其他同名 fork 当成上游。
- 主项目 [MIT](https://github.com/arnog/mathlive/blob/master/LICENSE.txt)。其 mhchem 实现保留了来源模块 Apache-2.0 声明，分发时应保留相关第三方声明。[mhchem 源码](https://github.com/arnog/mathlive/blob/master/src/latex-commands/mhchem.ts)
- `<math-field>` 是 Web Component，可接实体键盘和虚拟键盘；可定制布局、工具标签、占位模板、样式与显示时机。分数、积分等可做成点选后填空的学生界面。[虚拟键盘](https://mathlive.io/mathfield/guides/virtual-keyboard/)
- 官方提供 [React 接入](https://mathlive.io/mathfield/guides/react/)。React 19 本身支持 Custom Elements，因此优先直接接上游组件，不为此引入一个未经核查的第三方 React wrapper。[React 19](https://react.dev/blog/2024/12/05/react-19)
- 纯编辑可在浏览器中进行，符号计算是单独的 Compute Engine 能力；第一轮表达式输入不需要计算引擎。[交互与序列化](https://mathlive.io/mathfield/guides/interacting/)
- 官方 npm 当前 `0.111.0`，发布时间 `2026-09-30T19:11:32.432Z`，包未声明 dependencies/React peers。[npm registry](https://registry.npmjs.org/mathlive)
- 源码 master 本轮为 `1a615a27f68f23916679f2d4621a42148e35a6eb`。GitHub `releases/latest` 仍返回 2024 的 v0.100.0，不能据此判定项目已停更；npm 和源码为另一个证据面。[GitHub release](https://github.com/arnog/mathlive/releases/tag/v0.100.0)
- npm 解包大小 5,740,779 bytes 是整个包的大小，**不是 STOA 实际 bundle/gzip 大小**。后续原型应测首次加载、字体、CSS 与按需加载。[npm registry](https://registry.npmjs.org/mathlive)

**化学边界：**上游 `mhchem.ts` 定义 `ce`/`pu`，整个化学表达式作为 `ChemAtom` 保存原始参数并捕获选择。这证明上游有化学解析/显示支持，但不能直接证明学生可逐字符可视修改复杂化学式、任意点击化学式内部编辑。优先把化学式编辑做成明确的字段/工具，再复用排版引擎；该交互需要浏览器原型验证。[源码](https://github.com/arnog/mathlive/blob/master/src/latex-commands/mhchem.ts)

#### 值得原型比较的 K12 化学 fork

[LatoAndroid/mathlive-chemistry](https://github.com/LatoAndroid/mathlive-chemistry) 是另一个 MIT 项目，README 声称为常见、简单的化学式提供内部 atom 编辑，并支持轻量 `chemfig` 显示；复杂化学式仍可能是整体对象，结构绘图只是子集，不承诺与上游内部行为完全一致。本轮主仓元数据记录该 fork 2026-05-21 创建、2026-05-22 最后 push，不能据此给出长期跟随上游和生产成熟度保证。

本轮核实它已有 npm 包 `mathlive-chemistry@0.109.2-k12.1`，2026-05-22 发布，声明依赖 `@cortex-js/compute-engine: 0.55.6`，与本轮上游 MathLive 无 dependencies 的发布包不同。它不是单纯换一个 import 就可假定等价的版本。[npm registry](https://registry.npmjs.org/mathlive-chemistry)

这是值得针对「编辑 H2O 下标、离子电荷、反应式」做独立原型比较的候选；本轮未运行它的浏览器测试。若使用 fork，需验收它与 STOA 回答渲染器的格式往返，例如现有 KaTeX 对其扩展 `chemfig` 语法不能先假定支持。优先从已有 `ce`/`pu` 范围开始，专业分子结构另用专门工具。上述覆盖与限制依据该项目自己的 [README](https://github.com/LatoAndroid/mathlive-chemistry#readme)。

### 2. KaTeX + mhchem：复用现有公式与化学式显示

- KaTeX 主项目 MIT；mhchem 源码保留其来源 Apache-2.0 声明。[KaTeX](https://github.com/KaTeX/KaTeX) · [mhchem 源码](https://github.com/KaTeX/KaTeX/blob/main/contrib/mhchem/mhchem.js)
- mhchem 添加 `\ce`（化学表达式）和 `\pu`（物理单位）功能，需要在 KaTeX 上显式加载。它是渲染扩展，不是学生输入面板，也不是分子结构绘图或化学正确性检查器。[官方 README](https://github.com/KaTeX/KaTeX/blob/main/contrib/mhchem/README.md)
- 已安装 KaTeX 包包含扩展，使用 `import 'katex/contrib/mhchem'` 可以复用；不需要另写化学排版器。

本轮用预览快照已有依赖运行 Node 渲染探针，`throwOnError: true`，KaTeX 实际版本 `0.18.3`，以下四项均成功生成 HTML：

| 表达式 | 结果 |
|---|---|
| `\ce{H2O}` | 成功 |
| `\ce{SO4^2-}` | 成功 |
| `\ce{2H2 + O2 -> 2H2O}` | 成功 |
| `\pu{9.8 m/s2}` | 成功 |

这是渲染函数的运行证据，不是学生界面、移动 Safari、无障碍、交互或化学正确性验收；当前应用未接入该扩展。

### 3. 命令菜单：现有 Radix 与可选 cmdk

现有 Radix UI 可以承接显式工具按钮、菜单、标签页和面板容器；Dialog 支持受控开关、焦点管理和 Escape。[Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) · [MIT](https://github.com/radix-ui/primitives/blob/main/LICENSE)

若需要可搜索命令菜单，**cmdk** 是合适的现成 React 组件：分组、关键词别名、筛选、选中项目、内联菜单与 Dialog，样式由应用控制。[官方 README](https://github.com/dip/cmdk)

- MIT，当前包 `1.1.1`，发布于 2025-03-14。[npm registry](https://registry.npmjs.org/cmdk) · [release](https://github.com/dip/cmdk/releases/tag/v1.1.1)
- 发布包 React 和 React DOM peers 都含 `^19`，依赖 Radix；STOA 已有其中一些 Radix 组件。[包源码](https://github.com/dip/cmdk/blob/main/cmdk/package.json)
- 原 `pacocoursey/cmdk` 现重定向为 `dip/cmdk`，引用当前仓身份。
- 1.1.1 修复了输入法 composition 下按键重复触发，仍须和 STOA Composer 自己的 Enter 发送行为组合验证。[release](https://github.com/dip/cmdk/releases/tag/v1.1.1)
- cmdk 是搜索/选择菜单，不理解数学、化学或任意自然语言，不会自行决定哪个面板最合适。`/分数`、`/fraction`、`/Bruch` 等别名和「打开……」规则由 STOA 配置。

初版只有几个可点工具时可以先复用现有组件；命令集合扩大、需要输入筛选与键盘选择时引入 cmdk，避免重复实现整个命令菜单。

### 4. Tiptap：适用于完整的文字与公式混排草稿

- Tiptap 开源核心、`@tiptap/react`、当前 `@tiptap/extension-mathematics` 都声明 MIT。[主仓](https://github.com/ueberdosis/tiptap) · [数学扩展包](https://github.com/ueberdosis/tiptap/blob/main/packages/extension-mathematics/package.json)
- 数学扩展将 LaTeX 保存到 inline/block math 节点并用 KaTeX 渲染，编辑回调可以接自己的面板；它不是现成的学生可视公式键盘。[官方数学扩展](https://tiptap.dev/docs/editor/extensions/nodes/mathematics)
- 可与 MathLive 组合：Tiptap 管理文字、公式节点、选择位置及撤销；MathLive 在公式编辑面板负责数学输入。这是组合建议，未做 STOA 原型验收。
- 本轮 npm 最新包为 `3.31.4`，2026-09-30 发布；React peers 包含 `^19.0.0`；数学扩展允许 KaTeX `^0.18.0`。[React registry](https://registry.npmjs.org/%40tiptap%2Freact) · [数学扩展 registry](https://registry.npmjs.org/%40tiptap%2Fextension-mathematics)
- 官方 [Suggestion](https://tiptap.dev/docs/editor/api/utilities/suggestion) 包可作触发与候选项基础；官方 [Slash Commands 示例](https://tiptap.dev/docs/examples/experiments/slash-commands) 明确标为**未支持/未维护的实验，没有正式发布该扩展包**。不能把它称为可直接装上的成熟 slash-command 产品。
- Tiptap 网站还有云服务、Pro 产品和其他商业功能。本次 MIT 结论仅指查到的开源包，不把整个产品目录一概视为免费。

如果第一版只需自然语言文本旁挂公式卡片，现有 Composer 可继续承接。需要一句话中间嵌多个公式、统一编辑与复杂撤销时再评估 Tiptap，避免仅为一个菜单迁移整个输入框。

### 5. 物理单位的可选辅助：Math.js

[Math.js](https://github.com/josdejong/mathjs) 是 Apache-2.0 的数学运算与解析库，支持 [单位与换算](https://mathjs.org/docs/datatypes/units.html)，不是输入面板。仅当产品需要明确的单位校验或换算时评估；本轮不建议为界面推荐提前引入。学生的错误步骤应保留供讨论，不能因解析/运算结果自动覆盖。

### 6. Ketcher：需要画分子结构时的首选调查对象

[EPAM Ketcher](https://github.com/epam/ketcher) 是 Apache-2.0 的分子结构编辑器，正式版本 `v3.18.0` 发布于 2026-09-02，主分支 2026-09-30 仍有提交。支持原子、键、环、结构反应与 MOL/RXN/KET/SMILES 等格式。它适合乙醇结构、苯环等绘图需求；常见 H₂O、离子电荷与反应方程式用前面的文字面板即可。[版本 README](https://github.com/epam/ketcher/blob/v3.18.0/README.md) · [LICENSE](https://github.com/epam/ketcher/blob/v3.18.0/LICENSE) · [release](https://github.com/epam/ketcher/releases/tag/v3.18.0)

- 官方提供 React 组件及预构建 standalone iframe；`ketcher-react@3.18.0` peerDependencies 允许 React 18.2 与 19，带 TS 类型。这是版本声明兼容，尚未在 STOA 验收。[package.json](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-react/package.json)
- 该 tag 的 `ketcher-react` 与 `ketcher-standalone` 均声明 **Node >=24.14.1**。直接 npm 接入需检查 STOA 构建链；浏览器最终运行 JS/WASM，学生设备无需 Node。预构建 iframe 是另一条接入路径，但仍需处理资源托管、通信与焦点。[standalone package.json](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-standalone/package.json)
- 可选择远端 Indigo REST provider，或本地 Indigo WASM 的 `StandaloneStructServiceProvider`；本地结构处理不要求购买云识别服务。[独立模式 README](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-standalone/README.md)
- **独立模式不支持 OCR**：对应源码 `recognize()` 直接拒绝并返回 `Not supported in standalone mode`。不能用主 README 中的 OCR 功能总表推导出本地包有图片识别。[精确源码](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-standalone/src/infrastructure/services/struct/standaloneStructService.ts)
- 可配置工具按钮可见性和 customButtons。学生版应收起大量专业工具，显式调用“结构式”才加载；本轮没有测 WASM 开销、手机精细画键或学生可用性。[组件说明](https://github.com/epam/ketcher/blob/v3.18.0/README.md)

结构草稿应保留可编辑的结构数据及预览，不能只保存截图；化学式文字和学生原始表达也应保留，排版阶段不自动配平或改错。

### 7. Kekule.js：化学教学组件较广的备选

[Kekule.js](https://github.com/partridgejiang/Kekule.js) 主项目 MIT；`v1.0.4` 发布于 2026-05-22，主分支最近提交为 2026-09-21。除了结构 Composer/Viewer，还提供周期表、谱图、化学数据读写与算法。多数处理可在浏览器中运行。[版本 README](https://github.com/partridgejiang/Kekule.js/blob/v1.0.4/README.md) · [LICENSE](https://github.com/partridgejiang/Kekule.js/blob/v1.0.4/LICENSE) · [release](https://github.com/partridgejiang/Kekule.js/releases/tag/v1.0.4)

支持 DOM widget、ESM/CommonJS 和 Web Component。作者的 Kekule-React wrapper 包为 `0.1.1`，直接依赖 React `^18.2.0`，仓库最后 push 在 2023；不能当作明确适配 React 19 的组件。若选它，先验证原生组件的小适配层。[Web Component 教程](https://partridgejiang.github.io/Kekule.js/documents/tutorial/content/webComponent.html) · [wrapper package.json](https://github.com/partridgejiang/Kekule-React/blob/main/package.json)

源码有移动测试，但测试页最小尺寸 510×350，且禁用缩放，不可照搬为手机方案。[移动测试页](https://github.com/partridgejiang/Kekule.js/blob/v1.0.4/test/mobile/chemEditorMobile.html)

若以后需要周期表或更多化学教学组件，可与 Ketcher 比较；现阶段不同时引入两套结构引擎。

### 8. MathQuill 与 Guppy：数学备选及维护差异

#### MathQuill

[MathQuill](https://github.com/mathquill/mathquill) 是 MPL-2.0 的 DOM 公式编辑器，可通过 `MathField`、`latex()`、`cmd()` 等 API 编辑和导出公式，浏览器本地运行。[许可](https://github.com/mathquill/mathquill/blob/master/LICENSE)

最新 GitHub 正式 release `v0.10.1` 为 2016-03-22，那个版本要求 jQuery；主分支 2025-06-02 的提交已经移除 jQuery。这两个证据面不可混用；若采用新实现，需另选固定提交及核查分发版本，不能只装旧正式版却引用新主分支能力。[v0.10.1 README](https://github.com/mathquill/mathquill/blob/v0.10.1/README.md) · [去 jQuery 提交](https://github.com/mathquill/mathquill/commit/1cbc1c4128ec87db3733bc99965522f7d62cde75)

核心没有 React peer 约束，但需要自己处理 DOM 生命周期、reflow 和状态同步。官方 `substituteTextarea` 配置可以配合应用自己的触屏数学键盘，这不等于库已经附带学生键盘。[配置文档](https://github.com/mathquill/mathquill/blob/master/docs/Config.md)

MPL 的覆盖文件修改有源码提供义务，应按实际使用方式核查。相比 MathLive 的现成虚拟键盘与近期 npm 更新，本轮不优先选 MathQuill；这是工程判断，尚未做学生对照试验。

#### Guppy

[Guppy 官网](https://guppy.js.org/) 指向 [daniel3735928559/guppy](https://github.com/daniel3735928559/guppy)，支持可视公式、虚拟键盘、矩阵与自定义符号，并可输出 LaTeX、ASCII、JSON/XML。README 和 package.json 声明 MIT，但本轮根目录未找到独立 LICENSE 文件；采用时需核查分发包的完整许可文字。[package.json](https://github.com/daniel3735928559/guppy/blob/master/package.json)

最新正式 GitHub release 为 2016 的 `v1.1.0`；另有 2017 alpha，主分支最后提交在 2020。语义化输出可参考，但不建议让 STOA 新输入入口承担其升级与兼容维护。[releases](https://github.com/daniel3735928559/guppy/releases) · [最近主分支提交](https://github.com/daniel3735928559/guppy/commit/1759992a3885cb99d3ead04241f318a074c9f963)

### 9. Excalidraw：物理与生物示意图的可选面板

[Excalidraw](https://github.com/excalidraw/excalidraw) 提供 React 图形编辑组件，包含矩形、圆、线、带标签箭头、图形库、撤销和 PNG/SVG/JSON 导出。可作为鼠标点选、拖动、连接图形的基础，不要求手写笔。用于受力图、实验装置或生物过程示意图是 STOA 的组合建议，库本身不会判断或生成学科面板，也不是物理仿真器。[官方 README](https://github.com/excalidraw/excalidraw#readme)

本轮官方 npm 最新为 `@excalidraw/excalidraw@0.18.1`，2026-04-20 发布，MIT，React/React DOM peers 允许 17/18/19。[registry](https://registry.npmjs.org/%40excalidraw%2Fexcalidraw) · [LICENSE](https://github.com/excalidraw/excalidraw/blob/master/LICENSE)

有 initialData、图形库更新与 onChange 回调，可承接预置模板和可编辑场景；`handleKeyboardGlobally` 默认 false，可避免未聚焦时截获 STOA 输入框按键。保存草稿应使用场景数据，不能只导出图片。[Props](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props)

STOA 仍需制作少量学科模板与简化入口。公式键盘不是绘图工具，图形编辑器也不是公式编辑器；明确调用 `/示意图` 或从相关推荐打开时才加载。无需为初版常见公式输入提前安装完整画布。官方站点的实时协作、自动保存等应用功能也不应一概当作 npm 组件的默认能力。

### 10. 有开源部分，但不能视为完整免费开源方案的产品

| 产品 | 核查出的范围 | 对本次选型的影响 |
|---|---|---|
| MyScript | 当前 iinkTS 客户端 Apache-2.0；识别操作在 Cloud 或商业 Server 端 | 开源客户端不含可免费自托管的识别引擎 |
| Mathpix | mathpix-markdown-it 等客户端/渲染器开源；OCR 是商业 API，on-prem 需要授权 | 可以另作识别服务采购调查，不能替代可视输入面板 |
| Desmos | 完整 calculator/API 是有限使用许可的产品；生产商业使用有商业方案 | 底层 MathQuill 开源不代表整个 Desmos 可免费商用复用 |
| GeoGebra | 当前源码 EUPL 1.2；完整产品、UI/语言材料及服务另有非商业条件 | 单独源码与完整产品必须分开评估，不能因为用户是学生就默认免费嵌入 |

**MyScript：**[iinkTS](https://github.com/MyScript/iinkTS) 当前包 `4.1.0`，2026-08-25 更新，官方 Web 文档说明识别操作在服务器端；旧 iinkJS 已归档。免费额度不等于开源识别模型。[架构文档](https://developer.myscript.com/doc/interactive-ink/4.1/web/overview/introduction/)

**Mathpix：**[mathpix-markdown-it](https://github.com/Mathpix/mathpix-markdown-it) 是 MIT 渲染器，处理已有文本。OCR 的 [API 定价](https://mathpix.com/pricing/api) 与 [on-prem 部署](https://github.com/Mathpix/mathpix-on-prem) 是另外的产品；公开部署配置不代表模型或授权镜像免费开放。

**Desmos：**当前 [API 文档](https://www.desmos.com/api/v1.12/docs/index.html) 与 [API Terms](https://www.desmos.com/api-terms) 区分 trial 和商业许可，商业面向终端用户的生产嵌入不能按非商业试用处理。

**GeoGebra：**本轮 [官方许可](https://www.geogebra.org/license) 写源码 EUPL 1.2，而非笼统 GPL；[官方 legal repo](https://github.com/geogebra/legal/blob/main/geogebra_license.md) 另列完整产品、材料与语言/UI 文件的条件。不能用源码许可代替完整产品许可。

上述是本次调查的产品/许可边界记录，未运行识别服务或作合同审查。

### 接入前需验证的实际流程

1. 普通笔记本：从 `/分数` 打开模板，填完后插入公式卡片、返回文字光标，命令不会误发。
   命令监听应限定在文字输入区；MathLive 内的 `/` 本来用于输入分数，Enter 也有公式完成语义，需要按焦点区分。不能用全局快捷键覆盖数学编辑器自己的行为。[MathLive 快捷键](https://mathlive.io/mathfield/demo/)
2. 手机：系统文字键盘与公式键盘的切换、面板高度、滚动与焦点，题目和当前字段可见。
3. 键盘：进入/退出模板、移动占位、撤销/重做、关闭后恢复草稿；未完成模板可继续编辑。
4. 多语与输入法：de/en/fr/it 别名、德语死键、输入法 composition、数字小数与单位惯例；不会在尚未完成输入时触发。
5. 自动推荐：明确命令优先；编辑中面板保持稳定；歧义表达式可选择；错误推荐可切换。
6. 跨引擎：MathLive 导出的选定公式在现有 KaTeX 中显示一致，化学扩展正确加载；学生始终能看见题目内容而非编译语法。
7. 性能：编辑器按需加载，字体与资源自托管；实际测 bundle 与设备响应，不用包解压大小代替性能结论。

本轮完成文档/源码/npm 元数据调查及四项 KaTeX 函数探针；没有安装新应用依赖、接入应用、跑学生实测、发布或部署。

## 第三部分：来源与恢复说明

### 1. 原始讨论

来源聊天：[《审计前端预览部署方案》](codex://threads/01a0f2ce-8572-7963-84d2-20d322e6dbd4)。辅助公式输入的讨论出现在这条聊天的后半段，聊天标题未反映这一主题。

| 时间（Europe/Zurich） | 原始内容 | 本文处理 |
| --- | --- | --- |
| 2026-10-01 00:04–00:07 | 用户提出中小学生不熟悉 Markdown/LaTeX，讨论多学科表达工具 | 合并为问题、模板、上下文提问与视觉建议 |
| 2026-10-01 01:34–01:35 | 用户质疑非 iPad 用户是否适合草稿纸 | 保留后续修正：键盘模板、步骤区和标注优先，自由手写后置 |
| 2026-10-01 01:42–01:44 | 用户提出按语言与固定命令唤起、自动调整输入面板 | 保留三种入口、面板稳定与推荐规则 |
| 2026-10-01 01:45–02:05 | 用户要求深入调查可直接使用的开源工具 | 恢复完整选型正文和来源链接 |

第一部分是上述讨论的合并整理，不是逐字聊天转录。用户问题、助手建议、已运行的探针和未完成的验证分别标明，未把建议升级为用户批准的实施规格。

### 2. 选型原文的恢复依据

原文标题为《STOA 按内容与命令唤起输入面板：开源选型调查》，原保存位置即本文件路径：`design/input-panels/OPEN-SOURCE-RESEARCH-2026-10-01.md`。

恢复依据为原始会话文件 `rollout-2026-09-30T16-53-36-01a0f2ce-8572-7963-84d2-20d322e6dbd4.jsonl`，会话 ID 为 `01a0f2ce-8572-7963-84d2-20d322e6dbd4`。文件名按 UTC 日期记录，相关讨论在苏黎世已是 10 月 1 日。

| 原始记录行 | 证据 |
| --- | --- |
| 1195、1242 | 首轮问题与设计建议 |
| 1249、1261 | 草稿纸质疑与方案修正 |
| 1268、1282 | 语言命令面板提案与交互规则 |
| 1289、1561 | 开源调查请求与最终汇报 |
| 1357 | KaTeX 0.18.3 四项函数渲染探针结果 |
| 1433 | 原文档初始 Add，共 93 行 |
| 1448、1479、1513、1543 | 后续四次文档修改 |
| 1521 | 原历史操作修正六处 LaTeX 示例的双反斜杠 |
| 1502、1544 | 中间全文与最终第 90 行起的读取结果，用于逐字核对 |

按顺序重放这些操作后，完整选型原文为 171 行；中间版本与历史读取结果相符，最终第 90–171 行与最后一次读取结果相符，没有发现恢复缺口。合并前原文 SHA-256 为：

```text
29ebe8ac5292d6d915f521b96ed86a5210a84474030331bb561e945551a15908
```

该哈希用于标识恢复出的选型原文，不是本整合文档的哈希。第二部分去掉了原一级标题，并将其余标题下移一级，正文和来源链接保留。

### 3. 证据范围与下一步

历史调查实际运行的是四项 KaTeX 函数探针。候选工具的其他结论来自当时的官方文档、源码、许可证与 npm 元数据。它们不构成 STOA 集成、移动设备、无障碍或学生使用验收。

本次完成的是历史设计与研究文档恢复。未重新选择依赖版本、安装依赖、接入应用或执行新的产品验收。继续实施时，先核对现行产品范围与源码，再更新候选版本、兼容性和许可调查，并执行第二部分列出的实际流程验证。
