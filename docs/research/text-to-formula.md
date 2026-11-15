# 文字写法怎么转成公式

调研工单：stoa-frontend#493（地图 #492 的子票）。日期：2026-10-23。

本文用了三类证据。一手资料：各库的官方文档、源码、npm 元数据，UnicodeMath 规范，相关论文。本机实测：在 Node 24.19 里实际跑了 5 个解析器和一个自写原型，样本集见附录 A；包体积用 esbuild 0.25.10 打包后实测。仓内现状：前端 `MathRenderer`，后端 `ai_service.py`、`config.py` 和课程清单。
**没有调用 Bedrock。** 关于 AI 转换的准确率与延迟，下文只引用公开发表的数字，并给出估算，没有做现场测量。
引文都短于 15 个词，其余是转述；来源清单在文末。

## 结论

孩子写的是两种东西：一种是计算器写法（`x^2`、`3/4*120`、`12:4·3`），一种是夹着词的口头写法（「x hoch 2」「drei Viertel von 120」「x au carré」「un mezzo più un terzo」）。现成的解析器只认前一种，而且认得不完整：瑞士常用的 `·`，还有 `²` 和 `√`，至少有一个库认不了。更要紧的是，碰到不认识的词它们**不会说「不认识」**。asciimath2tex 和 MathLive 会把「Wurzel aus 16」排成一串斜体字母，照样输出，所以没法拿它们来判断「这句认不认得出」。
用一个很小的自写规则转换器（两步：先把四种语言的词改写成计算器写法，再解析成 LaTeX），在 32 句开发样本上全对，4 个歧义样本全部标出。在 15 句事先写好、没拿来调规则的留出样本上，对 14 句；剩下 1 句（「wie viel ist 3/5 von 45」）它主动放弃，**没有一句给出错误的公式**。打包后约 2.9 KB（gzip）。

建议分工如下：

1. **规则先认，在浏览器里做，不引第三方解析器。** 自写的转换器加四语词表。认得出就给可编辑的公式预览，让孩子确认；有歧义就并排给出几种排法让孩子选；认不出就保持原文。
2. **第一版不做 AI 兜底。** 理由：认不出时原文照样发给 Ask，回答用的 Claude 本来就读得懂「x hoch 2」，所以没认出只是少了一个预览，回答不会变差。AI 兜底要多一次 Bedrock 往返。按公开测量估算，这一次要 1.5–2 秒以上，边打边认用不上，还要在后端登记一个新的 InvokeModel 调用方，并决定这笔费用算不算进学生额度。等上线后看真实输入里规则放弃的比例，再决定要不要加一个「用 AI 认一下」按钮。
3. **难点不在词表，在范围和歧义。** 例如 `1/2x`（各工具的读法互相矛盾）、`x2`、`2 1/2`；「Wurzel aus x plus 1」「x hoch n plus 1」「eins durch x plus 2」里根号、指数、分数线管到哪里；还有 `:` 既是除号又是比号（课程里有「Verhältnis」）。这些情况一律交给孩子选，不由系统猜。

预览插入消息时用 `$…$` 包住 LaTeX。学生自己的消息已经走 `MathRenderer plain`（`src/features/ask/AskMessage.tsx`），KaTeX 已经按需加载，不需要新的渲染依赖。

## 一、现成解析器

体积是我用 esbuild 0.25.10 打包实测的（`--bundle --minify`，ESM，platform=browser，然后 gzip -9），只算 JS，不含 CSS 和字体。「样本」一列是附录 A 三组样本的得分。

| 方案 | 认什么 | 许可 | min / gzip | 能在哪跑 | 样本（口头 32 / 留出 15 / 计算器 13） |
|---|---|---|---|---|---|
| **asciimath2tex** 1.5.0 | AsciiMath 语法：`^`、`_`、`/`、`sqrt`、`root(n)(x)`、`xx`、`*`→`\cdot`、`-:`→÷ | Apache-2.0 | 25.3 KB / 6.2 KB | 浏览器、Node，无 DOM | 3 / 0 / 10 |
| **asciimath-parser** 0.6.11 | 第三方 TS 实现，仓库简介自称与 asciimath.org **不完全兼容** | MIT | 29.2 KB / 7.4 KB | 同上；输出外面包了一层 `\displaystyle{}` | 3 / 0 / 10 |
| **math.js** 15.2.0 `parse` + `toTex` | 计算表达式：`^`、`/`、`*`、隐式乘法、`%`、函数调用 | Apache-2.0 | 整包 670 KB / 192 KB；`create({ parseDependencies })` 317 KB / 91 KB | 浏览器、Node | 2 / 0 / 7（4 句直接报错） |
| **MathLive** 0.111.1 `convertAsciiMathToLatex` | AsciiMath 子集加 MathLive 的内联快捷词（约 250 条，全是英文或 ASCII） | MIT | 走 `mathlive/ssr` 入口 361 KB / 101 KB；走主入口 832 KB / 225 KB（不能 tree-shake） | ssr 入口在 Node 能跑 | 3 / 0 / 9 |
| **Compute Engine** 0.161.0 | 输入是 **LaTeX**，不是文字；做规范化和计算 | MIT | 4.8 MB / 1.42 MB | 浏览器、Node | 未跑：不解决本题 |
| **UnicodeMathML** | UnicodeMath → MathML | MIT | 未测 | 浏览器 | 未跑：输出 MathML，不是 LaTeX |
| 自写原型（附录 B） | 四语词表加计算器写法，会标歧义，认不出就放弃 | — | 6.8 KB / 2.9 KB | 浏览器、Node | 32 / 14 / 13 |
| 参照：KaTeX 0.18.3（已在用） | 渲染 | MIT | 267 KB / 77 KB | — | — |

逐个说明：

- **AsciiMath 本身。** 官方语法页只给了一套文法（`S`、`I`、`E`），分数写作 `I/I`，没有写清分子、分母延伸到哪里；文档建议用括号分组。乘号列了 `*`（排成 `\cdot`）和 `xx`（排成 ×），除号列了 `-:`（排成 ÷）。`:` 和 `·` 都没列；百分比和带分数也没有（[asciimath.org][am]）。原版 ASCIIMathML.js 在 `asciimath/asciimathml` 仓，MIT 许可，输出的是 MathML（[仓库][am-repo]）。
- **asciimath2tex** 是这一类里最贴近需求的：小，没有依赖，不碰 DOM。它把 `:` 原样输出，排出来正好是瑞士的除号。实测 `12:4·3` 里的 `·`，还有 `x²`、`√16`，都原样留下，没有转换；`x2` 排成 `x 2`。碰到德语词会逐个字母排成斜体，例如「W u r z e l」；`hoch` 不认，`in` 被认成 ∈，`min` 被认成命令（附录 A 有实测输出）。
- **math.js** 是计算库，不是排版库，有几处和孩子的写法正面冲突。`:` 是区间运算符（`1:4` 得 `[1,2,3,4]`）；`'` 是转置，所以 `f'(x)` 不是导数；`%` 会被改写成 `\frac{15}{100}`；`·`、`²`、`√`、小数逗号 `3,5`、带分数 `2 1/2` 都直接报语法错误（[语法文档][mathjs-syntax]，加上实测）。它对 `1/2x` 有明确规则，见第三节。
- **MathLive。** `convertAsciiMathToLatex` 走的是源码里的 `parseMathString`。分子、分母各只取一个记号（数字、单个字母、括号组或快捷词），所以 `1/2x` 排成 `\frac{1}{2}x`。它不做隐式乘法，也不推断 `x2` 是指数（[源码][ml-parse]）。实测 `15%*80` 输出的是原样的 `15%*80`，而在 LaTeX 里 `%` 是注释符，后面的内容会被 KaTeX 当注释吞掉。内联快捷词约 250 条，没有德、法、意的词，也没有 squared、cubed、hoch；可以通过 `inlineShortcuts` 扩充（[快捷词源码][ml-shortcuts]，[文档][ml-shortcut-doc]）。#491 选 MathLive 是为了做可视公式面板；那块的价值不受本文影响，但它的文字转换不能替孩子认口头写法。
- **UnicodeMath**（Word 的线性格式）给了另一种分数规则：分子、分母是**连续的字母和数字**，所以 `1/2x` 排成 `\frac{1}{2x}`；规范还专门提到，语音输入可以先转成 UnicodeMath 再排版（[UTN #28][utn28] §2.1、§4.8）。开源实现 UnicodeMathML 输出 MathML（[仓库][umml]），要接 KaTeX 还得再转一层。
- **其他。** nerdamer（Apache-2.0）和 Algebrite（MIT）是符号计算库，输入同样是计算器写法，不解决词的问题。没有找到能把德语、法语、意大利语的口头数学写法转成公式的开源工具。最接近的是希腊语的 Greek2MathTex（[论文][greek2mathtex]）和英语的 TalkMaths 命令表（[TalkMaths][talkmaths]）。

**选型结论：** 不需要引第三方解析器做主力。第三方解析器解决的只是最容易的那一半（`^`、`/`、`sqrt`、括号），而 STOA 自己必须写的部分它们都不提供：四语词表、瑞士符号、小数逗号、歧义标记、「认不出」的信号。原型里解析计算器写法的那部分约 120 行，13 句计算器写法全对。如果以后想少维护一点，可以把 asciimath2tex 当作计算器写法的参照实现（6 KB，Apache-2.0）；但它不会报「认不出」，结果必须再过一道检查（例如有没有残留的多字母词）。

## 二、四种语言里怎么说

先说明来源：**没有找到瑞士六到九年级孩子写数学的语料或词表。** 下表是我按四种语言的常见说法整理的，再用 STOA 自己的数据对照了一遍：后端种子题 `scripts/seed_practice.py`，以及课程清单 `src/stoa/services/curriculum_translations.py`。表里的说法要找孩子和老师核对后才能定稿。原型的词表（附录 B）只覆盖了表里的一部分。

| 概念 | de | en | fr | it |
|---|---|---|---|---|
| 平方 | x hoch 2, x Quadrat, x im Quadrat | x squared, x to the power of 2 | x au carré, x puissance 2 | x al quadrato, x alla seconda |
| 立方 / 一般幂 | x hoch 3, x hoch n | x cubed, x to the power of n | x au cube, x puissance n, x exposant n | x al cubo, x alla terza, x elevato alla n |
| 平方根 | Wurzel aus 16, Quadratwurzel von 16 | square root of 16, root of 16 | racine de 16, racine carrée de 16 | radice di 16, radice quadrata di 16 |
| 立方根 | dritte Wurzel aus 27, Kubikwurzel | cube root of 27 | racine cubique de 27 | radice cubica di 27 |
| 分数 | drei Viertel, ein Drittel, die Hälfte | three quarters, one third, half | trois quarts, un tiers, la moitié, un demi | tre quarti, un terzo, la metà, un mezzo |
| 分数线（口头） | x durch 2, eins durch x | x over 2, one over x | x sur 2 | x fratto 2 |
| 带分数 | zweieinhalb, anderthalb, 2 ½, «2 1/2» | two and a half, 2 ½ | deux et demi, 2 ½ | due e mezzo, 2 ½ |
| 百分比 | 15 Prozent, 15 % | 15 percent / per cent | 15 pour cent | 15 per cento, il 15 % |
| 「…的」（乘） | ¾ von 120, 15 % von 80 | ¾ of 120 | ¾ de 120 | ¾ di 120 |
| 乘 | mal, ·, × | times, ×, · | fois, ×, · | per, ×, · |
| 除 | durch, geteilt durch, :, ÷ | divided by, ÷, / | divisé par, :, ÷ | diviso, diviso per, :, ÷ |
| 求导 | ableiten, die Ableitung von, leite … ab | derivative of, differentiate | dériver, la dérivée de | derivare, la derivata di |

与瑞士和 STOA 相关的几点：

- **乘号、除号与小数。** 后端种子题里 `·`、`×`、`÷` 都有，小数用逗号：`2 · 3,14 · 5 = 31,4 cm`、`35 ÷ 5 = 7`（`scripts/seed_practice.py`）。所以转换器要同时认 `·`、`×`、`*`，认 `:`、`÷`，还要认小数逗号。`:` 原样排成冒号，`·` 排成 `\cdot`，这样排出来和孩子课本上的样子一致。按二手资料的转述，ISO 80000-2 把 `:` 留给比，不建议用 ÷ 表示除（[Wikipedia: Division sign][wiki-div]，没有读到标准原文）。这对排版没有影响，两个符号排出来都对。
- **`:` 也是比号。** 课程里有「Menge im Verhältnis aufteilen」（`curriculum_translations.py`），「3 : 2」可能是比。两种情况排出来一样，预览不用区分；只有在要计算的场合才会出问题。
- **「von / of / de / di」只在分数或百分比后面表示乘。** 原型只在这种位置把它改成 `·`，其他位置的「de」「di」不动。如果把这几个词一律当乘号，「racine de 16」「radice di 81」就会被改坏。
- **求导不在现在的课程里。** 真实课程是 ZAP 六年级，课程清单里有分数、百分比、方程、几何（π、cm²、勾股定理）、比例、单位、小数，没有导数（`curriculum_translations.py`）。工单例子里的「e hoch x ableiten」可以支持，但优先级应排在分数、百分比、单位之后。单位（`cm²`、`L/min`）反倒是现在课程里天天出现的。
- **现成词表都不对路。** Speech Rule Engine（Apache-2.0）有 de、fr、it、en 的语言包，但方向是公式转成语音。它的词散在规则文件和代码里（数词在各语言的 `numbers.json`，意大利语那份还有序数词），没有现成的「说法 → 结构」表可以直接拿来用（[仓库][sre]）。MathLive 的快捷词只有英文。MathBridge 的约 2300 万条语料是英语（[MathBridge][mathbridge]）；更早的 HAMEX 只有法语，而且主要是手写加语音（MathBridge 正文的引述）。Speech-to-LaTeX 只有英语和俄语（[S2L][s2l]）。四种语言的儿童词表只能自己建，再找孩子核。

## 三、歧义

| 写法 | 各家怎么读 | 建议 |
|---|---|---|
| `1/2x` | math.js：`[number]/[number][symbol]` 先做除法，所以是 ½·x（[语法文档][mathjs-syntax]，实测 `\frac{1}{2}x`）。asciimath2tex、MathLive：`\frac{1}{2}x`（实测）。UnicodeMath：分母取连续的字母和数字，是 `\frac{1}{2x}`（[UTN #28][utn28] §2.1）。卡西欧新款计算器：隐式乘法优先于 ÷，`6 ÷ 2π` 会自动加括号成 `6 ÷ (2π)`；这是搜索摘要的说法，原页打开时返回 503，没有读到原文（[Casio][casio]） | 工具之间本来就不一致，孩子也一样。并排给出 ½x 和 1/(2x) 两种，让孩子选（#491 第一部分第 4 节已经这样建议）。原型默认显示 ½x，同时标出歧义 |
| `x2` | 几个库都没有当成指数：asciimath2tex 排成 `x 2`，MathLive 排成 `x2`，math.js 把它当成一个叫 `x2` 的变量（实测） | 默认 x²，另给 x₂ 和 x·2。手机上打不出上标，孩子写 x2 多半想的是平方，但这一点要实测 |
| `2 1/2` | asciimath2tex、MathLive：`2\frac{1}{2}`，排出来像带分数（实测）；math.js 报错 | 默认按带分数显示，并标出歧义（也可能是 2·½）。「zweieinhalb」这种整词是确定的，不标 |
| 根号、指数管到哪里 | 「Wurzel aus x plus 1」：√x + 1 还是 √(x+1)？「x hoch n plus 1」同理。Speech-to-LaTeX 论文把口头数学的错误率高归因于这种歧义，举的例子正是「one over x plus two」可以读成 1/x + 2 或 1/(x+2)（[S2L][s2l] §1） | 默认只管紧跟的一个量。原型对根号会标出歧义，**对指数和「durch」不标**，这是缺口（见第五节） |
| 同一个词两种意思 | 「Quadrat」可以是平方，也可以是正方形；意大利语「e」是「和」，也可以是 e；「per」在意大利语里是乘，在英语里是「每」；「sei」；英语冠词「a」和变量 a | 「Quadrat」只在前面紧跟一个量时才当平方。剩下的情况认不出就放弃，不硬猜 |
| 大小写 | 原型先把整句转成小写，`A` 和 `a` 就分不开了 | 正式实现要保留变量的大小写 |

通用做法是：**能确定的直接排，有歧义的并排给 2–3 个选项，认不出的保持原文。** 默认项只决定先显示哪一种，不替孩子做决定。排版阶段不改孩子的计算，不帮他配平，也不纠错（#491 第一部分第 4 节）。

## 四、交给 AI 转换

**没有做现场测量。** 后端现状和公开数据如下。

- **后端现状。** 模型是 `bedrock_model_id = "eu.anthropic.claude-sonnet-4-6"`（stoa-backend `src/stoa/config.py`）。每个直接调 InvokeModel 的地方都要登记在 `inventory_ai_invocation_classes()` 里，并选定费用记在学生额度（`USER_ALLOWANCE`）还是只记平台成本（`PROVIDER_COST_ONLY`）；现在登记了 5 处（`src/stoa/services/ai_service.py`）。转公式要新开一个端点，并决定这笔费用算在谁头上。API Gateway HTTP API 的集成超时上限是 30 秒（后端 `docs/plans/audit-fix-plan-20260924/issues/07-runtime-budget-research.md`）；转一句话用不了那么久，这个上限不是问题。
- **延迟（公开测量，不是 STOA 实测）。** Artificial Analysis 给 Claude Sonnet 4.6 在 Amazon Bedrock 上的测量是：首 token 约 1.1 秒，输出约 79 token/秒；测试负载是每次 1 万输入 token，取过去 72 小时的中位数（[Artificial Analysis][aa]）。转一句话的提示词远比这短，回答大约 20–60 token。粗估模型本身要 1.3–2 秒，再加 Lambda 和网络。点按钮之后等一下可以接受，边打边认不行。同一页把 Sonnet 4.6 标成已弃用，推荐 Sonnet 5，这一点后端可能需要知道。
- **准确率（公开数据，都不是本场景）。**
  - MathBridge：把英语口头数学文字转成 LaTeX。GPT-3.5 不加提示时 CER 0.43；加转换说明后 CER 0.19，sacreBLEU 52.3。微调过的 T5-large 只有 46.8（[MathBridge][mathbridge] 表 3）。
  - MathSpeech：英语大学讲座的语音识别结果转 LaTeX。GPT-4o 的 CER 0.390；作者微调的 1.2 亿参数小模型 0.298（[MathSpeech][mathspeech]）。
  - Speech-to-LaTeX：英语和俄语。没有测 GPT-4o 或 Claude 这类商用模型。Qwen2.5-7B 用 25 个示例时，方程 CER 47%；微调后约 25–27%（[S2L][s2l] 表 4、表 10、表 11）。
  - 这些都是字符错误率。论文自己也指出，等价的写法（`\frac` 和 `/`）会被算成错（[MathBridge][mathbridge] §6；[S2L][s2l] §4.3）。它们都是英语或俄语，都是大学或成人的数学，**不能拿来推算德、法、意孩子的短句**。我没有找到用 Claude 做这类转换的公开评测。
- **「规则先认、AI 兜底」有没有现成的评测？** 没有找到。已发表的系统要么纯靠规则（TalkMaths；UnicodeMath 规范里提到的「语音转 UnicodeMath」），要么纯靠模型（MathBridge、MathSpeech、S2L）。
- **如果以后要加 AI 兜底**，建议这样约束。只在规则放弃、并且孩子点了「用 AI 认一下」时才调用。输出限定成 JSON：`{ latex, alternatives[], unsure }`。系统提示写明「只排版，不计算，不纠错」。前端先用 KaTeX（`throwOnError`）验一遍再显示；结果仍然是要孩子确认的预览，不能直接替换原文。附录 A 的 47 句加上真实输入里规则放弃的句子，可以直接拿来当它的评测集。

## 五、小样本试验

样本集和逐句结果见附录 A，原型代码见附录 B。判定方法：输出与期望的 LaTeX 比较前，先去掉空白、`\left`、`\right`，以及只包一个字符的花括号；期望 LaTeX 有多种可接受写法时，命中任何一种都算对；输出还必须能被 KaTeX 0.18.3 用 `throwOnError` 渲染出来。期望 LaTeX 本身也全部用 KaTeX 验过。

| 组 | 句数 | 原型 | asciimath2tex | asciimath-parser | math.js | MathLive |
|---|---|---|---|---|---|---|
| 开发样本（四语口头加歧义） | 32 | **32 对**；歧义标出 4/4，误标 0 | 3 | 3 | 2 | 3 |
| 留出样本（写完再写原型，未用于调规则） | 15 | **14 对，0 错**，1 句放弃（本该放弃）；1 处歧义标记（√25 − 3） | 0 | 0 | 0 | 0 |
| 计算器写法 | 13 | **13 对**；歧义标出 3/3 | 10 | 10 | 7（4 句报错） | 9 |

怎么读这几个数：

- **开发样本的 32/32 说明不了准确率。** 规则是照着这 32 句写的，调的过程中修过两处错误：「dritte Wurzel」的内部记号带了数字，「to the power of」里的 the 被当冠词删掉了。能说明问题的是留出样本：0 句错，1 句放弃。
- **放弃比给错强。** 第三方库在口头句上几乎都是「错」，不是「放弃」：它们照样输出一串斜体字母，调用方没法知道它没认出来。
- **原型的盲区**（另跑了 25 句探针，附录 A 末尾）。下面几句原型照样输出了公式，没有标出歧义：
  - 「x hoch n plus 1」排成 `x^{n}+1`，「2 hoch x plus 1」同理（指数管到哪里没标）；
  - 「eins durch x plus 2」排成 `1:x+2`（分数线管到哪里没标，而且排成了除号）；
  - 「sin x hoch 2」排成 `\sin x^{2}`（也可能是 sin²x）；
  - 「a e b」排成 `aeb`（意大利语的「和」）。

  「3 hoch 2 hoch 2」会解析失败，「50 % von 80 sind 40」「das Verhältnis 3 : 2」因为有不认识的词而放弃。正式实现至少要给指数和「durch」补上范围歧义的标记。

## 附录 A：样本集与逐句结果

期望 LaTeX 列中，`|` 分隔几种都算对的写法，第一种是默认显示的那种。「歧义」表示好的转换器必须标出来。最后一列是原型的实际输出。

**开发样本（32 句）**

| # | 语言 | 孩子写的 | 期望 LaTeX | 歧义 | 原型输出 |
|---|---|---|---|---|---|
| 1 | de | x hoch 2 + 3x - y hoch 3 | `x^{2}+3x-y^{3}` | | ✓ |
| 2 | de | e hoch x ableiten | `\frac{d}{dx}\left(e^{x}\right)` | | ✓ |
| 3 | de | drei Viertel von 120 | `\frac{3}{4}\cdot 120` | | ✓ |
| 4 | de | 3/4 von 120 | `\frac{3}{4}\cdot 120` | | ✓ |
| 5 | de | Wurzel aus 16 | `\sqrt{16}` | | ✓ |
| 6 | de | x Quadrat plus 5 | `x^{2}+5` | | ✓ |
| 7 | de | 12 : 4 · 3 | `12:4\cdot 3` | | ✓ |
| 8 | de | zweieinhalb mal 4 | `2\frac{1}{2}\cdot 4` | | ✓ |
| 9 | de | 15 Prozent von 80 | `15\%\cdot 80` | | ✓ |
| 10 | de | dritte Wurzel aus 27 | `\sqrt[3]{27}` | | ✓ |
| 11 | de | die Hälfte von 30 | `\frac{1}{2}\cdot 30` | | ✓ |
| 12 | en | x squared plus 3x minus 4 | `x^{2}+3x-4` | | ✓ |
| 13 | en | square root of 49 | `\sqrt{49}` | | ✓ |
| 14 | en | 2 to the power of 10 | `2^{10}` | | ✓ |
| 15 | en | three quarters of 120 | `\frac{3}{4}\cdot 120` | | ✓ |
| 16 | en | derivative of x cubed | `\frac{d}{dx}\left(x^{3}\right)` | | ✓ |
| 17 | fr | x au carré | `x^{2}` | | ✓ |
| 18 | fr | la racine de 16 | `\sqrt{16}` | | ✓ |
| 19 | fr | trois quarts de 120 | `\frac{3}{4}\cdot 120` | | ✓ |
| 20 | fr | 20 pour cent de 50 | `20\%\cdot 50` | | ✓ |
| 21 | fr | 7 divisé par 2 | `7:2` \| `\frac{7}{2}` | | ✓ `7:2` |
| 22 | it | un mezzo più un terzo | `\frac{1}{2}+\frac{1}{3}` | | ✓ |
| 23 | it | x alla seconda più 1 | `x^{2}+1` | | ✓ |
| 24 | it | radice quadrata di 81 | `\sqrt{81}` | | ✓ |
| 25 | it | 3 per 4 | `3\cdot 4` | | ✓ |
| 26 | it | la derivata di x al quadrato | `\frac{d}{dx}\left(x^{2}\right)` | | ✓ |
| 27 | it | il 10 per cento di 200 | `10\%\cdot 200` | | ✓ |
| 28 | — | x^2+3x-4 | `x^{2}+3x-4` | | ✓ |
| 29 | — | 1/2x | `\frac{1}{2}x` \| `\frac{1}{2x}` | 是 | ✓ 已标出 |
| 30 | — | x2 | `x^{2}` \| `x_{2}` \| `x\cdot 2` | 是 | ✓ 已标出 |
| 31 | — | 2 1/2 | `2\frac{1}{2}` \| `2\cdot\frac{1}{2}` | 是 | ✓ 已标出 |
| 32 | de | Wurzel aus x plus 1 | `\sqrt{x}+1` \| `\sqrt{x+1}` | 是 | ✓ 已标出 |

**留出样本（15 句，原型写成前就定好了）**

| # | 语言 | 孩子写的 | 期望 LaTeX | 原型输出 |
|---|---|---|---|---|
| h1 | de | a hoch 3 mal b | `a^{3}\cdot b` | ✓ |
| h2 | de | Wurzel von 36 | `\sqrt{36}` | ✓ |
| h3 | de | zwei Drittel von 90 | `\frac{2}{3}\cdot 90` | ✓ |
| h4 | en | five sixths minus one third | `\frac{5}{6}-\frac{1}{3}` | ✓ |
| h5 | en | y to the power of 4 plus y | `y^{4}+y` | ✓ |
| h6 | fr | la moitié de 24 | `\frac{1}{2}\cdot 24` | ✓ |
| h7 | fr | x puissance 3 fois 2 | `x^{3}\cdot 2` | ✓ |
| h8 | it | tre quarti di 60 | `\frac{3}{4}\cdot 60` | ✓ |
| h9 | it | radice di 25 meno 3 | `\sqrt{25}-3` | ✓（另标出根号范围歧义） |
| h10 | de | 25% von 360 | `25\%\cdot 360` | ✓ |
| h11 | de | 2x hoch 2 + 1 | `2x^{2}+1` | ✓ |
| h12 | de | wie viel ist 3/5 von 45 | `\frac{3}{5}\cdot 45` | 放弃（不认识「wie」） |
| h13 | de | (x+1) durch 2 | `\frac{x+1}{2}` \| `(x+1):2` | ✓ `(x+1):2` |
| h14 | fr | dérivée de x au carré plus 3x | `\frac{d}{dx}\left(x^{2}+3x\right)` | ✓ |
| h15 | it | derivata di e alla x | `\frac{d}{dx}\left(e^{x}\right)` | ✓ |

**计算器写法（13 句）与第三方库的实测输出**

| 输入 | 期望 | asciimath2tex | math.js `toTex` | MathLive |
|---|---|---|---|---|
| `x^2+3x-y^3` | `x^{2}+3x-y^{3}` | ✓ | ✓ | ✓ |
| `3/4*120` | `\frac{3}{4}\cdot 120` | ✓ | ✓ | ✓ |
| `sqrt(16)` | `\sqrt{16}` | ✓ | ✓ | ✓ |
| `12:4*3` | `12:4\cdot 3` | ✓ | ✓ | ✓ |
| `12:4·3` | 同上 | ✗ `·` 原样 | 报错 | ✗ `·` 原样 |
| `15%*80` | `15\%\cdot 80` | ✓ | ✗ `\frac{15}{100}\cdot80` | ✗ `15%*80`（`%` 在 LaTeX 里是注释） |
| `e^x` | `e^{x}` | ✓ | ✓ | ✓ |
| `(x+1)/2` | `\frac{x+1}{2}` | ✓ | ✓ | ✓ |
| `x²+√16` | `x^{2}+\sqrt{16}` | ✗ 原样 | 报错 | ✗ 原样 |
| `1/2x` | 歧义 | `\frac{1}{2} x`，未标 | `\frac{1}{2}~ x`，未标 | `\frac{1}{2}x`，未标 |
| `x2` | 歧义 | ✗ `x 2` | ✗ 变量 `x2` | ✗ `x2` |
| `2 1/2` | 歧义 | `2 \frac{1}{2}`，未标 | 报错 | `2\frac{1}{2}`，未标 |
| `3,5*2` | `3{,}5\cdot 2` | ✓ `3 , 5 \cdot 2` | 报错 | ✓ |

口头句上的典型输出（开发样本），例如「Wurzel aus 16」：asciimath2tex 输出 `W u r z e l a u s 16`，math.js 输出 `Wurzel~ aus~\left(16\right)`，MathLive 原样输出。

**探针（原型盲区，25 句）**：x hoch n plus 1 → `x^{n}+1`（未标）· 2 hoch x plus 1 → `2^{x}+1`（未标）· e hoch 2x → `e^{2x}` · eins durch x plus 2 → `1:x+2`（未标）· a durch b mal c → `a:b\cdot c` · ein Drittel von x hoch 2 → `\frac{1}{3}\cdot x^{2}` · Fläche vom Quadrat → 放弃 · 3 Quadrat → `3^{2}` · x im Quadrat plus y im Quadrat → `x^{2}+y^{2}` · das Verhältnis 3 : 2 → 放弃 · drei durch vier → `3:4` · 1,5 mal 4 → `1{,}5\cdot 4` · x mal x → `x\cdot x` · zwei x plus drei → `2x+3` · wurzel aus (x plus 1) → `\sqrt{x+1}` · a e b → `aeb`（错）· deux tiers → `\frac{2}{3}` · x elevato alla 3 → `x^{3}` · seconda → 放弃 · f(x) = x hoch 2 → `f(x)=x^{2}` · sin x hoch 2 → `\sin x^{2}`（未标）· 3 hoch 2 hoch 2 → 解析失败 · 50 % von 80 sind 40 → 放弃 · x = 3 : 4 → `x=3:4` · a / b / c → `\frac{\frac{a}{b}}{c}`

## 附录 B：规则转换器原型

一次性原型，只用来回答这张工单，不是产品代码。纯 ESM，没有依赖，用 Node 24 运行：`import { convert } from './t2f.mjs'; convert('drei Viertel von 120')`。上面的测试是另一个小脚本跑的，它对每个库调用 `convert` 或库自己的转换函数，按第五节的规则比较结果并用 KaTeX 验证，脚本本身不重要，这里就不贴了。

```js
// Throwaway prototype for #493: child phrase (de/en/fr/it or calculator style) -> LaTeX.
// Step 1 rewrites words into a calculator-style string, step 2 parses that string.
// Returns { latex, ambiguous, flags } or { latex: null, error } when it does not
// understand every word (that is the signal to fall back to AI or to the student).

const W = (alts) => new RegExp(`(?<![\\p{L}\\d])(?:${alts})(?![\\p{L}\\d])`, 'gu')

const NUMBER_WORDS = {
  1: 'eins|ein|eine|einen|one|un|une|uno|una', 2: 'zwei|two|deux|due', 3: 'drei|three|trois|tre',
  4: 'vier|four|quatre|quattro', 5: 'fünf|five|cinq|cinque', 6: 'sechs|six|sei',
  7: 'sieben|seven|sept|sette', 8: 'acht|eight|huit|otto', 9: 'neun|nine|neuf|nove', 10: 'zehn|ten|dix|dieci',
}
const DENOMINATORS = {
  2: 'halbe|halbes|halben|halb|half|halves|demie|demis|demi|mezzo|mezzi',
  3: 'drittel|thirds|third|tiers|terzo|terzi',
  4: 'viertel|quarters|quarter|fourths|fourth|quarts|quart|quarto|quarti',
  5: 'fünftel|fifths|fifth|cinquièmes|cinquième|quinto|quinti',
  6: 'sechstel|sixths|sixth|sixièmes|sixième|sesto|sesti',
  7: 'siebtel|sevenths|seventh|septièmes|septième|settimo|settimi',
  8: 'achtel|eighths|eighth|huitièmes|huitième|ottavo|ottavi',
  9: 'neuntel|ninths|ninth|neuvièmes|neuvième|nono|noni',
  10: 'zehntel|tenths|tenth|dixièmes|dixième|decimo|decimi',
}
const ORDINALS = { 2: 'zweiten|zweite|second|seconde|seconda|secondo', 3: 'dritten|dritte|third|troisième|terza|terzo', 4: 'vierten|vierte|fourth|quatrième|quarta|quarto' }
const ATOM_BEFORE = '(?<=[\\p{L}\\d)])\\s*'
const AFTER = '(?![\\p{L}\\d])'

export function rewrite(input) {
  let s = ` ${input.normalize('NFC').toLowerCase()} `
  s = s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, ' sqrt ').replace(/[·×⋅*]/g, ' * ').replace(/÷/g, ' : ').replace(/−/g, '-')
  // German compounds: zweieinhalb = 2½, anderthalb = 1½ (§ glues a mixed number we are sure of)
  for (const [n, alts] of Object.entries(NUMBER_WORDS)) s = s.replace(W(`(?:${alts})einhalb`), ` ${n}§1/2 `)
  s = s.replace(W('anderthalb'), ' 1§1/2 ')
  s = s.replace(W("der|die|das|dem|den|the|le|la|les|il|lo|l'"), ' ')
  s = s.replace(W('prozent|percent|per cent|pour cent|pourcent|per cento|percento'), ' % ')
  s = s.trim()
  const derivPrefix = /^(?:ableitung|derivative|dérivée|derivata)\s+(?:von|of|de|du|di|del|della|dello)\s+(.+)$/u
  const derivVerb = /^(?:ableiten|differentiate|dériver|derivare)\s+(.+)$/u
  const derivSuffix = /^(.+?)\s+(?:ableiten|differenzieren|dériver|derivare|differentiate)$/u
  const derivLeite = /^leite\s+(.+)\s+ab$/u
  for (const re of [derivPrefix, derivVerb, derivSuffix, derivLeite]) if (re.test(s)) { s = s.replace(re, 'deriv ( $1 )'); break }
  s = ` ${s} `
  s = s.replace(W("(?:dritte|kubik)\\s*wurzel(?:\\s+(?:aus|von))?|cube root of|racine cubique(?:\\s+(?:de|d'))?|radice cubica(?:\\s+di)?"), ' cbrt ')
  s = s.replace(W("(?:quadrat)?wurzel(?:\\s+(?:aus|von))?|square root of|root of|racine carrée(?:\\s+(?:de|d'))?|racine(?:\\s+(?:de|d'))?|radice quadrata(?:\\s+di)?|radice(?:\\s+di)?"), ' sqrt ')
  s = s.replace(new RegExp(`${ATOM_BEFORE}(?:zum |im )?(?:quadrat|squared|au carré|al quadrato)${AFTER}`, 'gu'), '^2')
  s = s.replace(new RegExp(`${ATOM_BEFORE}(?:cubed|au cube|al cubo)${AFTER}`, 'gu'), '^3')
  s = s.replace(W('hoch|to\\s+(?:the\\s+)?power(?:\\s+of)?|puissance|exposant|elevato alla|elevato a|alla'), ' ^ ')
  for (const [n, alts] of Object.entries(ORDINALS)) s = s.replace(new RegExp(`\\^\\s*(?:${alts})${AFTER}`, 'gu'), `^${n}`)
  const numAlt = Object.values(NUMBER_WORDS).join('|') + '|a|an'
  for (const [d, alts] of Object.entries(DENOMINATORS)) {
    s = s.replace(new RegExp(`(?<![\\p{L}\\d])(${numAlt}|\\d+)\\s+(?:${alts})${AFTER}`, 'gu'), (_, n) => ` ${/\d/.test(n) ? n : wordToNumber(n)}/${d} `)
  }
  s = s.replace(W('hälfte|half|moitié|metà'), ' 1/2 ')
  s = s.replace(new RegExp(`(%|\\d+\\s*/\\s*\\d+)\\s*(?:von|of|de|du|des|di|del|della|dello)${AFTER}`, 'gu'), '$1 * ')
  for (const [n, alts] of Object.entries(NUMBER_WORDS)) s = s.replace(W(alts), ` ${n} `)
  s = s.replace(W('plus|più'), ' + ').replace(W('minus|moins|meno|weniger'), ' - ')
  s = s.replace(W('multipliziert mit|multiplied by|multiplié par|moltiplicato per|mal|times|fois|per'), ' * ')
  s = s.replace(W('geteilt durch|dividiert durch|durch|divided by|divisé par|diviso per|diviso'), ' : ')
  s = s.replace(W('over|sur|fratto'), ' / ')
  s = s.replace(W('ist gleich|gleich|equals|is equal to|est égal à|égale|égal|uguale a|fa'), ' = ')
  return s.replace(/\s+/g, ' ').trim()
}

function wordToNumber(w) {
  if (w === 'a' || w === 'an') return 1
  for (const [n, alts] of Object.entries(NUMBER_WORDS)) if (alts.split('|').includes(w)) return Number(n)
  return NaN
}

const FUNCS = new Set(['sin', 'cos', 'tan', 'ln', 'log'])
const SPECIAL = new Set(['sqrt', 'cbrt', 'deriv'])

function tokenize(s) {
  const tokens = []
  let i = 0, sp = true, mixed = false
  while (i < s.length) {
    const c = s[i]
    if (c === ' ') { sp = true; i++; continue }
    if (c === '§') { mixed = true; sp = true; i++; continue }
    let m
    if ((m = /^\d+(?:[.,]\d+)?/.exec(s.slice(i)))) tokens.push({ t: 'num', v: m[0], sp, mixed })
    else if ((m = /^\p{L}+/u.exec(s.slice(i)))) {
      const w = m[0]
      if (SPECIAL.has(w)) tokens.push({ t: w, v: w, sp })
      else if (FUNCS.has(w)) tokens.push({ t: 'fn', v: w, sp })
      else if (w === 'pi') tokens.push({ t: 'var', v: '\\pi ', sp })
      else if (w.length === 1) tokens.push({ t: 'var', v: w, sp })
      else throw new Error(`unknown word "${w}"`)
    } else if ('+-*:/^%()=<>'.includes(c)) { m = [c]; tokens.push({ t: 'op', v: c, sp }) }
    else throw new Error(`unknown character "${c}"`)
    i += m[0].length; sp = false; mixed = false
  }
  return tokens
}

export function convert(text) {
  let rewritten
  try {
    rewritten = rewrite(text)
    const tokens = tokenize(rewritten)
    const { latex, flags } = parse(tokens)
    return { latex, ambiguous: flags.length > 0, flags, rewritten }
  } catch (error) {
    return { latex: null, error: error.message, rewritten }
  }
}

function parse(tokens) {
  let i = 0
  const flags = []
  const peek = () => tokens[i]
  const next = () => tokens[i++]
  const isOp = (t, ops) => t?.t === 'op' && ops.includes(t.v)
  const expect = (v) => { const t = next(); if (!isOp(t, v)) throw new Error(`expected ${v}`) }
  const startsAtom = (t) => t && (['num', 'var', 'fn', 'sqrt', 'cbrt', 'deriv'].includes(t.t) || isOp(t, '('))
  const inner = (n) => (n.paren ? n.inner : n.tex)

  function expr() {
    let tex = sum()
    while (isOp(peek(), '=<>')) tex += next().v + sum()
    return tex
  }
  function sum() {
    let tex = isOp(peek(), '+-') ? next().v : ''
    tex += term()
    while (isOp(peek(), '+-')) tex += next().v + term()
    return tex
  }
  function term() {
    let left = frac()
    let tex = left.tex
    for (;;) {
      const t = peek()
      if (isOp(t, '*:')) { next(); const r = frac(); tex += (t.v === '*' ? '\\cdot ' : ':') + r.tex; left = r; continue }
      if (!startsAtom(t)) return tex
      const r = frac()
      if (left.kind === 'int' && r.kind === 'numfrac') {
        if (!r.mixed) flags.push({ kind: 'mixed-number', note: `${left.tex} ${r.tex}: mixed number or product?` })
        tex += r.tex
      } else tex += (/^\d/.test(r.tex) ? '\\cdot ' : '') + r.tex
      left = r
    }
  }
  function frac() {
    let a = power()
    while (isOp(peek(), '/')) {
      next()
      const b = power()
      const t = peek()
      if (b.kind === 'int' && t?.t === 'var' && !t.sp) flags.push({ kind: 'denominator', alt: `\\frac{${inner(a)}}{${b.tex}${t.v}}` })
      a = { tex: `\\frac{${inner(a)}}{${inner(b)}}`, kind: a.kind === 'int' && b.kind === 'int' ? 'numfrac' : 'frac', mixed: a.mixed }
    }
    return a
  }
  function power() {
    let base = atom()
    if (isOp(peek(), '^')) {
      next()
      const neg = isOp(peek(), '-') ? next().v : ''
      const e = atom()
      let tex = inner(e)
      while (peek() && !peek().sp && ['var', 'num'].includes(peek().t)) tex += next().v // e hoch 2x -> e^{2x}
      base = { tex: `${base.tex}^{${neg}${tex}}`, kind: 'pow' }
    } else if (base.kind === 'var' && peek()?.t === 'num' && !peek().sp) {
      const n = next().v
      flags.push({ kind: 'letter-digit', alts: [`${base.tex}_{${n}}`, `${base.tex}\\cdot ${n}`] })
      base = { tex: `${base.tex}^{${n}}`, kind: 'pow' }
    }
    if (isOp(peek(), '%')) { next(); base = { tex: `${base.tex}\\%`, kind: 'pct' } }
    return base
  }
  function atom() {
    const t = next()
    if (!t) throw new Error('unexpected end')
    if (t.t === 'num') return { tex: t.v.replace(',', '{,}'), kind: /[.,]/.test(t.v) ? 'dec' : 'int', mixed: t.mixed }
    if (t.t === 'var') return { tex: t.v, kind: 'var' }
    if (isOp(t, '(')) { const e = expr(); expect(')'); return { tex: `(${e})`, inner: e, paren: true, kind: 'paren' } }
    if (t.t === 'sqrt' || t.t === 'cbrt') {
      const a = atom()
      if (!a.paren && isOp(peek(), '+-')) flags.push({ kind: 'root-scope', note: 'does the root cover what follows?' })
      return { tex: t.t === 'sqrt' ? `\\sqrt{${inner(a)}}` : `\\sqrt[3]{${inner(a)}}`, kind: 'root' }
    }
    if (t.t === 'deriv') { expect('('); const e = expr(); expect(')'); return { tex: `\\frac{d}{dx}\\left(${e}\\right)`, kind: 'deriv' } }
    if (t.t === 'fn') { const a = power(); return { tex: `\\${t.v} ${a.tex}`, kind: 'fn' } }
    throw new Error(`unexpected "${t.v}"`)
  }

  const latex = expr()
  if (i < tokens.length) throw new Error(`left over "${tokens[i].v}"`)
  return { latex, flags }
}
```

## 来源

一手资料（2026-10-23 读取）：

- `am`：AsciiMath 语法页，<https://asciimath.org/>
- `am-repo`：asciimath/asciimathml 仓库（MIT），<https://github.com/asciimath/asciimathml>
- `mathjs-syntax`：math.js 表达式语法（隐式乘法、`%`、`:`、`'`），<https://mathjs.org/docs/expressions/syntax.html>
- `ml-parse`：MathLive `parseMathString` 源码，<https://github.com/arnog/mathlive/blob/master/src/formats/parse-math-string.ts>
- `ml-shortcuts`：MathLive 默认内联快捷词源码，<https://github.com/arnog/mathlive/blob/master/src/editor/shortcuts-definitions.ts>
- `ml-shortcut-doc`：MathLive 快捷词指南，<https://mathlive.io/mathfield/guides/shortcuts/>
- `utn28`：Murray Sargent, *UnicodeMath, A Nearly Plain-Text Encoding of Mathematics*, v3.1, Unicode Technical Note #28, §2.1、§4.8，<https://www.unicode.org/notes/tn28/UTN28-PlainTextMath-v3.1.pdf>
- `umml`：doersino/UnicodeMathML（MIT），<https://github.com/doersino/UnicodeMathML>
- `sre`：Speech Rule Engine（Apache-2.0，`mathmaps/de|fr|it|en`），<https://github.com/Speech-Rule-Engine/speech-rule-engine>
- `mathbridge`：Jung et al., *MathBridge: A Large Corpus Dataset for Translating Spoken Mathematical Expressions into LaTeX Formulas for Improved Readability*, arXiv:2408.07081v3，表 3、§5–6，<https://arxiv.org/abs/2408.07081>
- `mathspeech`：Hyeon et al., *MathSpeech: Leveraging Small LMs for Accurate Conversion in Mathematical Speech-to-Formula*, arXiv:2412.15655（AAAI 2025），<https://arxiv.org/abs/2412.15655>
- `s2l`：*Speech-to-LaTeX: New Models and Datasets for Converting Spoken Equations and Sentences*, arXiv:2508.03542v1，§1、§3.4、§4.3、表 4/10/11，<https://arxiv.org/html/2508.03542v1>
- `greek2mathtex`：*Greek2MathTex: A Greek Speech-to-Text Framework for LaTeX Equations Generation*, arXiv:2412.12167，<https://arxiv.org/abs/2412.12167>
- `talkmaths`：TalkMaths 命令表，<https://talkmaths.sourceforge.net/about.php.html>
- npm registry 元数据（版本、许可、发布时间）：asciimath2tex、asciimath-parser、mathjs、mathlive、@cortex-js/compute-engine、nerdamer、algebrite，`npm view <包名>`，2026-10-23。

测量与二手资料（已注明可信度）：

- `aa`：Artificial Analysis，Claude Sonnet 4.6 各服务商的速度与延迟（第三方测量，10k 输入 token 负载，过去 72 小时中位数），<https://artificialanalysis.ai/models/claude-sonnet-4-6/providers>
- `casio`：Casio 计算器手册「Calculation Priority Sequence」「Basic input rules」（fx-570CW/991CW、fx-82AU PLUS II）。原页打开时返回 503，本文只引用了搜索摘要，**未核实**：<https://support.casio.com/global/en/calc/manual/fx-570CW_991CW_en/technical_information/calculation_priority_sequence.html>
- `wiki-div`：Wikipedia「Division sign」对 ISO 80000-2 的转述（二手，**未读标准原文**），<https://en.wikipedia.org/wiki/Division_sign>

仓内与后端（stoa-backend 为 `main` 的浅克隆，2026-10-23）：

- 前端 `src/components/ui/MathRenderer.tsx`、`src/features/ask/AskMessage.tsx`
- 后端 `src/stoa/config.py`（`bedrock_model_id`）、`src/stoa/services/ai_service.py`（`inventory_ai_invocation_classes`）、`src/stoa/services/curriculum_translations.py`（ZAP 课程知识点）、`scripts/seed_practice.py`（种子题的写法）、`docs/plans/audit-fix-plan-20260924/issues/07-runtime-budget-research.md`
- 背景：#491《辅助公式输入面板：交互设计与开源工具选型（历史恢复）》

[am]: https://asciimath.org/
[am-repo]: https://github.com/asciimath/asciimathml
[mathjs-syntax]: https://mathjs.org/docs/expressions/syntax.html
[ml-parse]: https://github.com/arnog/mathlive/blob/master/src/formats/parse-math-string.ts
[ml-shortcuts]: https://github.com/arnog/mathlive/blob/master/src/editor/shortcuts-definitions.ts
[ml-shortcut-doc]: https://mathlive.io/mathfield/guides/shortcuts/
[utn28]: https://www.unicode.org/notes/tn28/UTN28-PlainTextMath-v3.1.pdf
[umml]: https://github.com/doersino/UnicodeMathML
[sre]: https://github.com/Speech-Rule-Engine/speech-rule-engine
[mathbridge]: https://arxiv.org/abs/2408.07081
[mathspeech]: https://arxiv.org/abs/2412.15655
[s2l]: https://arxiv.org/html/2508.03542v1
[greek2mathtex]: https://arxiv.org/abs/2412.12167
[talkmaths]: https://talkmaths.sourceforge.net/about.php.html
[aa]: https://artificialanalysis.ai/models/claude-sonnet-4-6/providers
[casio]: https://support.casio.com/global/en/calc/manual/fx-570CW_991CW_en/technical_information/calculation_priority_sequence.html
[wiki-div]: https://en.wikipedia.org/wiki/Division_sign
