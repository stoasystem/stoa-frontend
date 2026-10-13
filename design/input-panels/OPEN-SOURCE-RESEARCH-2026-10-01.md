# STOA 按内容与命令唤起输入面板：开源选型调查

核查日期：2026-10-01（Europe/Zurich）。本记录服务于产品设计与后续原型选型，不是接入验收。

## 建议

首轮优先采用 **MathLive + 现有 KaTeX/mhchem + 现有 Radix UI**。需要搜索、别名、分组和键盘选择的命令菜单时，可增加 **cmdk**。需要在段落中混排多个可编辑公式时，评估 **Tiptap + MathLive**。分子结构绘图另行按需加载 **Ketcher**，不把整个专业化学编辑器放进默认提问框。

这些工具提供编辑器、渲染器或菜单；本次调查没有找到能直接完成 STOA 所需「自然语言判断 → 推荐工具 → 显式命令打开 → 保留草稿和焦点 → 插入表达式」整个行为的成熟成品。产品仍需一层很小的命令和推荐逻辑。

建议把草稿中的表达式保留为可回到面板修改的公式卡片，发送时才转换成传输文本。直接把 MathLive 输出的 LaTeX 塞进可见 textarea，会重新让学生面对源码，不能满足本次设计目标。完整段落内的富文本混排则是 Tiptap 路线。

## STOA 当前可复用的部分

核查本地新设计预览快照 `5c30681a1efd926a3bda62f2d688f58ded5c5922`，路径 `/private/tmp/stoa-preview-enable-20260930/frontend-git`，即此前预览的 PR #107 head；远端 `redesign/planet` 本轮回读为 `bf60cb0b61d4b54d89ffd1847b6c7498ae1b0a54`。不是把本地快照当成当前生产。

- `package.json` 已有 React 19、KaTeX `^0.18.3`、Radix Dialog/Dropdown Menu/Tabs、i18next、Zustand、Zod。
- 已有 `src/components/base/Composer.tsx` 和 `src/components/ui/MathRenderer.tsx`，可以保留现有文本提问和回答渲染基础。
- `src/components/ui/katexLoader.ts` 当前只加载 KaTeX 和 CSS，未加载 mhchem。
- Composer 的 Enter 是发送，已有输入法 composition 保护。新增命令选择/公式编辑须与发送分开处理，不能让选择命令或填写模板时误发。

权威 PRD 当前仍写数学 MVP、7–9 年级与 Gymnasium，以及快速提交和分步引导目标。小学与多学科是这次讨论的扩展方向。[PRD](https://github.com/stoasystem/stoa-docs/blob/main/PRD.md)

## 1. MathLive：数学可视输入的优先候选

- 主仓是 [arnog/mathlive](https://github.com/arnog/mathlive)，由 [官网](https://mathlive.io/mathfield/) 的 GitHub 链接确认；不能将其他同名 fork 当成上游。
- 主项目 [MIT](https://github.com/arnog/mathlive/blob/master/LICENSE.txt)。其 mhchem 实现保留了来源模块 Apache-2.0 声明，分发时应保留相关第三方声明。[mhchem 源码](https://github.com/arnog/mathlive/blob/master/src/latex-commands/mhchem.ts)
- `<math-field>` 是 Web Component，可接实体键盘和虚拟键盘；可定制布局、工具标签、占位模板、样式与显示时机。分数、积分等可做成点选后填空的学生界面。[虚拟键盘](https://mathlive.io/mathfield/guides/virtual-keyboard/)
- 官方提供 [React 接入](https://mathlive.io/mathfield/guides/react/)。React 19 本身支持 Custom Elements，因此优先直接接上游组件，不为此引入一个未经核查的第三方 React wrapper。[React 19](https://react.dev/blog/2024/12/05/react-19)
- 纯编辑可在浏览器中进行，符号计算是单独的 Compute Engine 能力；第一轮表达式输入不需要计算引擎。[交互与序列化](https://mathlive.io/mathfield/guides/interacting/)
- 官方 npm 当前 `0.111.0`，发布时间 `2026-09-30T19:11:32.432Z`，包未声明 dependencies/React peers。[npm registry](https://registry.npmjs.org/mathlive)
- 源码 master 本轮为 `1a615a27f68f23916679f2d4621a42148e35a6eb`。GitHub `releases/latest` 仍返回 2024 的 v0.100.0，不能据此判定项目已停更；npm 和源码为另一个证据面。[GitHub release](https://github.com/arnog/mathlive/releases/tag/v0.100.0)
- npm 解包大小 5,740,779 bytes 是整个包的大小，**不是 STOA 实际 bundle/gzip 大小**。后续原型应测首次加载、字体、CSS 与按需加载。[npm registry](https://registry.npmjs.org/mathlive)

**化学边界：**上游 `mhchem.ts` 定义 `ce`/`pu`，整个化学表达式作为 `ChemAtom` 保存原始参数并捕获选择。这证明上游有化学解析/显示支持，但不能直接证明学生可逐字符可视修改复杂化学式、任意点击化学式内部编辑。优先把化学式编辑做成明确的字段/工具，再复用排版引擎；该交互需要浏览器原型验证。[源码](https://github.com/arnog/mathlive/blob/master/src/latex-commands/mhchem.ts)

### 值得原型比较的 K12 化学 fork

[LatoAndroid/mathlive-chemistry](https://github.com/LatoAndroid/mathlive-chemistry) 是另一个 MIT 项目，README 声称为常见、简单的化学式提供内部 atom 编辑，并支持轻量 `chemfig` 显示；复杂化学式仍可能是整体对象，结构绘图只是子集，不承诺与上游内部行为完全一致。本轮主仓元数据记录该 fork 2026-05-21 创建、2026-05-22 最后 push，不能据此给出长期跟随上游和生产成熟度保证。

本轮核实它已有 npm 包 `mathlive-chemistry@0.109.2-k12.1`，2026-05-22 发布，声明依赖 `@cortex-js/compute-engine: 0.55.6`，与本轮上游 MathLive 无 dependencies 的发布包不同。它不是单纯换一个 import 就可假定等价的版本。[npm registry](https://registry.npmjs.org/mathlive-chemistry)

这是值得针对「编辑 H2O 下标、离子电荷、反应式」做独立原型比较的候选；本轮未运行它的浏览器测试。若使用 fork，需验收它与 STOA 回答渲染器的格式往返，例如现有 KaTeX 对其扩展 `chemfig` 语法不能先假定支持。优先从已有 `ce`/`pu` 范围开始，专业分子结构另用专门工具。上述覆盖与限制依据该项目自己的 [README](https://github.com/LatoAndroid/mathlive-chemistry#readme)。

## 2. KaTeX + mhchem：复用现有公式与化学式显示

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

## 3. 命令菜单：现有 Radix 与可选 cmdk

现有 Radix UI 可以承接显式工具按钮、菜单、标签页和面板容器；Dialog 支持受控开关、焦点管理和 Escape。[Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) · [MIT](https://github.com/radix-ui/primitives/blob/main/LICENSE)

若需要可搜索命令菜单，**cmdk** 是合适的现成 React 组件：分组、关键词别名、筛选、选中项目、内联菜单与 Dialog，样式由应用控制。[官方 README](https://github.com/dip/cmdk)

- MIT，当前包 `1.1.1`，发布于 2025-03-14。[npm registry](https://registry.npmjs.org/cmdk) · [release](https://github.com/dip/cmdk/releases/tag/v1.1.1)
- 发布包 React 和 React DOM peers 都含 `^19`，依赖 Radix；STOA 已有其中一些 Radix 组件。[包源码](https://github.com/dip/cmdk/blob/main/cmdk/package.json)
- 原 `pacocoursey/cmdk` 现重定向为 `dip/cmdk`，引用当前仓身份。
- 1.1.1 修复了输入法 composition 下按键重复触发，仍须和 STOA Composer 自己的 Enter 发送行为组合验证。[release](https://github.com/dip/cmdk/releases/tag/v1.1.1)
- cmdk 是搜索/选择菜单，不理解数学、化学或任意自然语言，不会自行决定哪个面板最合适。`/分数`、`/fraction`、`/Bruch` 等别名和「打开……」规则由 STOA 配置。

初版只有几个可点工具时可以先复用现有组件；命令集合扩大、需要输入筛选与键盘选择时引入 cmdk，避免重复实现整个命令菜单。

## 4. Tiptap：适用于完整的文字与公式混排草稿

- Tiptap 开源核心、`@tiptap/react`、当前 `@tiptap/extension-mathematics` 都声明 MIT。[主仓](https://github.com/ueberdosis/tiptap) · [数学扩展包](https://github.com/ueberdosis/tiptap/blob/main/packages/extension-mathematics/package.json)
- 数学扩展将 LaTeX 保存到 inline/block math 节点并用 KaTeX 渲染，编辑回调可以接自己的面板；它不是现成的学生可视公式键盘。[官方数学扩展](https://tiptap.dev/docs/editor/extensions/nodes/mathematics)
- 可与 MathLive 组合：Tiptap 管理文字、公式节点、选择位置及撤销；MathLive 在公式编辑面板负责数学输入。这是组合建议，未做 STOA 原型验收。
- 本轮 npm 最新包为 `3.31.4`，2026-09-30 发布；React peers 包含 `^19.0.0`；数学扩展允许 KaTeX `^0.18.0`。[React registry](https://registry.npmjs.org/%40tiptap%2Freact) · [数学扩展 registry](https://registry.npmjs.org/%40tiptap%2Fextension-mathematics)
- 官方 [Suggestion](https://tiptap.dev/docs/editor/api/utilities/suggestion) 包可作触发与候选项基础；官方 [Slash Commands 示例](https://tiptap.dev/docs/examples/experiments/slash-commands) 明确标为**未支持/未维护的实验，没有正式发布该扩展包**。不能把它称为可直接装上的成熟 slash-command 产品。
- Tiptap 网站还有云服务、Pro 产品和其他商业功能。本次 MIT 结论仅指查到的开源包，不把整个产品目录一概视为免费。

如果第一版只需自然语言文本旁挂公式卡片，现有 Composer 可继续承接。需要一句话中间嵌多个公式、统一编辑与复杂撤销时再评估 Tiptap，避免仅为一个菜单迁移整个输入框。

## 5. 物理单位的可选辅助：Math.js

[Math.js](https://github.com/josdejong/mathjs) 是 Apache-2.0 的数学运算与解析库，支持 [单位与换算](https://mathjs.org/docs/datatypes/units.html)，不是输入面板。仅当产品需要明确的单位校验或换算时评估；本轮不建议为界面推荐提前引入。学生的错误步骤应保留供讨论，不能因解析/运算结果自动覆盖。

## 6. Ketcher：需要画分子结构时的首选调查对象

[EPAM Ketcher](https://github.com/epam/ketcher) 是 Apache-2.0 的分子结构编辑器，正式版本 `v3.18.0` 发布于 2026-09-02，主分支 2026-09-30 仍有提交。支持原子、键、环、结构反应与 MOL/RXN/KET/SMILES 等格式。它适合乙醇结构、苯环等绘图需求；常见 H₂O、离子电荷与反应方程式用前面的文字面板即可。[版本 README](https://github.com/epam/ketcher/blob/v3.18.0/README.md) · [LICENSE](https://github.com/epam/ketcher/blob/v3.18.0/LICENSE) · [release](https://github.com/epam/ketcher/releases/tag/v3.18.0)

- 官方提供 React 组件及预构建 standalone iframe；`ketcher-react@3.18.0` peerDependencies 允许 React 18.2 与 19，带 TS 类型。这是版本声明兼容，尚未在 STOA 验收。[package.json](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-react/package.json)
- 该 tag 的 `ketcher-react` 与 `ketcher-standalone` 均声明 **Node >=24.14.1**。直接 npm 接入需检查 STOA 构建链；浏览器最终运行 JS/WASM，学生设备无需 Node。预构建 iframe 是另一条接入路径，但仍需处理资源托管、通信与焦点。[standalone package.json](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-standalone/package.json)
- 可选择远端 Indigo REST provider，或本地 Indigo WASM 的 `StandaloneStructServiceProvider`；本地结构处理不要求购买云识别服务。[独立模式 README](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-standalone/README.md)
- **独立模式不支持 OCR**：对应源码 `recognize()` 直接拒绝并返回 `Not supported in standalone mode`。不能用主 README 中的 OCR 功能总表推导出本地包有图片识别。[精确源码](https://github.com/epam/ketcher/blob/v3.18.0/packages/ketcher-standalone/src/infrastructure/services/struct/standaloneStructService.ts)
- 可配置工具按钮可见性和 customButtons。学生版应收起大量专业工具，显式调用“结构式”才加载；本轮没有测 WASM 开销、手机精细画键或学生可用性。[组件说明](https://github.com/epam/ketcher/blob/v3.18.0/README.md)

结构草稿应保留可编辑的结构数据及预览，不能只保存截图；化学式文字和学生原始表达也应保留，排版阶段不自动配平或改错。

## 7. Kekule.js：化学教学组件较广的备选

[Kekule.js](https://github.com/partridgejiang/Kekule.js) 主项目 MIT；`v1.0.4` 发布于 2026-05-22，主分支最近提交为 2026-09-21。除了结构 Composer/Viewer，还提供周期表、谱图、化学数据读写与算法。多数处理可在浏览器中运行。[版本 README](https://github.com/partridgejiang/Kekule.js/blob/v1.0.4/README.md) · [LICENSE](https://github.com/partridgejiang/Kekule.js/blob/v1.0.4/LICENSE) · [release](https://github.com/partridgejiang/Kekule.js/releases/tag/v1.0.4)

支持 DOM widget、ESM/CommonJS 和 Web Component。作者的 Kekule-React wrapper 包为 `0.1.1`，直接依赖 React `^18.2.0`，仓库最后 push 在 2023；不能当作明确适配 React 19 的组件。若选它，先验证原生组件的小适配层。[Web Component 教程](https://partridgejiang.github.io/Kekule.js/documents/tutorial/content/webComponent.html) · [wrapper package.json](https://github.com/partridgejiang/Kekule-React/blob/main/package.json)

源码有移动测试，但测试页最小尺寸 510×350，且禁用缩放，不可照搬为手机方案。[移动测试页](https://github.com/partridgejiang/Kekule.js/blob/v1.0.4/test/mobile/chemEditorMobile.html)

若以后需要周期表或更多化学教学组件，可与 Ketcher 比较；现阶段不同时引入两套结构引擎。

## 8. MathQuill 与 Guppy：数学备选及维护差异

### MathQuill

[MathQuill](https://github.com/mathquill/mathquill) 是 MPL-2.0 的 DOM 公式编辑器，可通过 `MathField`、`latex()`、`cmd()` 等 API 编辑和导出公式，浏览器本地运行。[许可](https://github.com/mathquill/mathquill/blob/master/LICENSE)

最新 GitHub 正式 release `v0.10.1` 为 2016-03-22，那个版本要求 jQuery；主分支 2025-06-02 的提交已经移除 jQuery。这两个证据面不可混用；若采用新实现，需另选固定提交及核查分发版本，不能只装旧正式版却引用新主分支能力。[v0.10.1 README](https://github.com/mathquill/mathquill/blob/v0.10.1/README.md) · [去 jQuery 提交](https://github.com/mathquill/mathquill/commit/1cbc1c4128ec87db3733bc99965522f7d62cde75)

核心没有 React peer 约束，但需要自己处理 DOM 生命周期、reflow 和状态同步。官方 `substituteTextarea` 配置可以配合应用自己的触屏数学键盘，这不等于库已经附带学生键盘。[配置文档](https://github.com/mathquill/mathquill/blob/master/docs/Config.md)

MPL 的覆盖文件修改有源码提供义务，应按实际使用方式核查。相比 MathLive 的现成虚拟键盘与近期 npm 更新，本轮不优先选 MathQuill；这是工程判断，尚未做学生对照试验。

### Guppy

[Guppy 官网](https://guppy.js.org/) 指向 [daniel3735928559/guppy](https://github.com/daniel3735928559/guppy)，支持可视公式、虚拟键盘、矩阵与自定义符号，并可输出 LaTeX、ASCII、JSON/XML。README 和 package.json 声明 MIT，但本轮根目录未找到独立 LICENSE 文件；采用时需核查分发包的完整许可文字。[package.json](https://github.com/daniel3735928559/guppy/blob/master/package.json)

最新正式 GitHub release 为 2016 的 `v1.1.0`；另有 2017 alpha，主分支最后提交在 2020。语义化输出可参考，但不建议让 STOA 新输入入口承担其升级与兼容维护。[releases](https://github.com/daniel3735928559/guppy/releases) · [最近主分支提交](https://github.com/daniel3735928559/guppy/commit/1759992a3885cb99d3ead04241f318a074c9f963)

## 9. Excalidraw：物理与生物示意图的可选面板

[Excalidraw](https://github.com/excalidraw/excalidraw) 提供 React 图形编辑组件，包含矩形、圆、线、带标签箭头、图形库、撤销和 PNG/SVG/JSON 导出。可作为鼠标点选、拖动、连接图形的基础，不要求手写笔。用于受力图、实验装置或生物过程示意图是 STOA 的组合建议，库本身不会判断或生成学科面板，也不是物理仿真器。[官方 README](https://github.com/excalidraw/excalidraw#readme)

本轮官方 npm 最新为 `@excalidraw/excalidraw@0.18.1`，2026-04-20 发布，MIT，React/React DOM peers 允许 17/18/19。[registry](https://registry.npmjs.org/%40excalidraw%2Fexcalidraw) · [LICENSE](https://github.com/excalidraw/excalidraw/blob/master/LICENSE)

有 initialData、图形库更新与 onChange 回调，可承接预置模板和可编辑场景；`handleKeyboardGlobally` 默认 false，可避免未聚焦时截获 STOA 输入框按键。保存草稿应使用场景数据，不能只导出图片。[Props](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/props)

STOA 仍需制作少量学科模板与简化入口。公式键盘不是绘图工具，图形编辑器也不是公式编辑器；明确调用 `/示意图` 或从相关推荐打开时才加载。无需为初版常见公式输入提前安装完整画布。官方站点的实时协作、自动保存等应用功能也不应一概当作 npm 组件的默认能力。

## 10. 有开源部分，但不能视为完整免费开源方案的产品

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

## 接入前需验证的实际流程

1. 普通笔记本：从 `/分数` 打开模板，填完后插入公式卡片、返回文字光标，命令不会误发。
   命令监听应限定在文字输入区；MathLive 内的 `/` 本来用于输入分数，Enter 也有公式完成语义，需要按焦点区分。不能用全局快捷键覆盖数学编辑器自己的行为。[MathLive 快捷键](https://mathlive.io/mathfield/demo/)
2. 手机：系统文字键盘与公式键盘的切换、面板高度、滚动与焦点，题目和当前字段可见。
3. 键盘：进入/退出模板、移动占位、撤销/重做、关闭后恢复草稿；未完成模板可继续编辑。
4. 多语与输入法：de/en/fr/it 别名、德语死键、输入法 composition、数字小数与单位惯例；不会在尚未完成输入时触发。
5. 自动推荐：明确命令优先；编辑中面板保持稳定；歧义表达式可选择；错误推荐可切换。
6. 跨引擎：MathLive 导出的选定公式在现有 KaTeX 中显示一致，化学扩展正确加载；学生始终能看见题目内容而非编译语法。
7. 性能：编辑器按需加载，字体与资源自托管；实际测 bundle 与设备响应，不用包解压大小代替性能结论。

本轮完成文档/源码/npm 元数据调查及四项 KaTeX 函数探针；没有安装新应用依赖、接入应用、跑学生实测、发布或部署。
