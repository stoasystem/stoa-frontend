# 别家怎么推断「已会」：ALEKS、可汗学院、Duolingo

调研工单：stoa-frontend#471（地图 #469 的子票）。日期：2026-10-22。

只用一手资料：ALEKS 团队与知识空间理论（KST）作者的论文、McGraw Hill 的 ALEKS 官方帮助、可汗学院帮助中心（含官方人员发的更新帖）、Duolingo 官方博客。
英文引文都短于 15 个词，其余是转述；每条结论后面都给了来源链接，来源清单在文末。
术语沿用本仓 `CONTEXT.md`：点亮、进行中、可开始、锁定、前置。

## 结论

三家都会从少量作答推出一大片「已会」，而且都**不把推断结果当成定论**。
ALEKS 推得最狠：初始测评只出 29 道自适应题，就要给 300 到 600 个知识点逐个定性。它靠两样东西兜底。一是定期的 Knowledge Check，可以把推错的知识点撤回去重学。二是界面上分两种颜色：「测评确认的」和「练习学会、还没复核的」各占一种。
可汗学院把推断限制在混合测验里。一次只升一级，最高的 Mastered 必须先到 Proficient、再在测验里答对才拿得到。做难题时，前置技能也会跟着升降（官方叫 Mastery Movement）；但开学的 Readiness Check 明确**不改**掌握度，只用来派练习。
Duolingo 的分级测试和「跳到这里」直接把前面的内容记成已完成，官方说法是分级**不能撤销**。官方资料里没有看到它把「跳过的」和「学完的」分开显示。它另设了更难的 Legendary 一级，用来区分「真会」。

对 STOA 的含义：「推定掌握」应该是一种**可撤回、单独记来源、界面上看得出来**的状态，不能直接等于点亮。原因是 `CONTEXT.md` 里点亮「一经点亮不再熄灭」，而三家成熟产品的推断都要能撤回。

### 值得抄的做法

1. **推定和练过分开存、分开画。** ALEKS 的饼图用深色画测评确认的知识点，用浅色画练习学会、还没复核的。进度条把「最近一次测评确认的」和「之后练出来的」分成两段（[家长指南][aleks-parents]）。可汗学院的 Readiness Check 不碰掌握度，只派练习（[KA-readiness-effect][ka-readiness-effect]）。STOA 可以在后端给知识点存一个来源（练过 / 推定），星图上画法不同。
2. **推定可撤回，而且要安排复核的机会。** ALEKS 的 Knowledge Check 会定期触发。答错题，或者答错一道**相关**的题，都可能让知识点从已掌握退回「剩余」，重新进学习路径（[ALEKS FAQ][aleks-faq]）。可汗学院的 Mastery Challenge 每 12 小时可以开一次，用 6 道题复查 3 个技能，能升也能降（[KA-mastery-challenge][ka-mc]）。被撤回的知识点重学时，ALEKS 只要 3 分；第一次学要 5 分（[Cosyn 等][aleks-practical] §1.3）。
3. **只沿可靠的方向强推。** ALEKS 答对后更新得猛，因为开放式作答很难蒙对；答错后更新得轻，因为可能是粗心。经验参数大约是答对 35、答错 5、「我不会」50（[Cosyn 等][aleks-practical] §1.3 脚注 3）。「点亮 → 推前置」属于答对这个方向，可信度高。反过来，「没点亮 → 推后继也不会」应该只做弱推断，或者干脆不做。
4. **推定的级别要封顶，一次只升一步。** 可汗学院的混合测验一次只升一级，Mastered 要求先到 Proficient（[KA-levels][ka-levels]）。Readiness 练习最多只能把技能练到 Proficient（[KA-readiness-effect][ka-readiness-effect]）。对 STOA：推定掌握足够让后继知识点变成可开始，但不应该算成点亮。
5. **下一步只从「外缘」里挑，并且让学生自己选。** ALEKS 的学习模式列出外缘里的**全部**知识点，学生自己选（[Cosyn 等][aleks-practical] §1.3）。官方数据中，学生学会外缘知识点的中位成功率是 0.93（[Doignon & Falmagne 2015][df2015] §12.3）。STOA 的「可开始」在前置都是「与」关系时，就等于外缘，推荐标记从这里面挑就对了。

### 坑

- **前置是「或」的时候，「点亮就推出全部前置」是错的。** KST 允许「掌握 b 需要 d，或者 a 和 c，或者 c 和 e」这种多条路径（[Doignon & Falmagne 2015][df2015] 例 16）。只有前置关系是偏序（全是「与」）时，「推出全部前置」才严格成立，这对应 Birkhoff 定理那一类最简单的结构（同上，定理 10）。STOA 现在的锁定是「与」（见 #470 的调研），所以能用。以后内容方如果引入替代路径，这条规则就得改。
- **刚学会的那一层最容易忘。** ALEKS 的数据显示：知识点越靠知识状态的「边缘」（inner layer 1），保持率掉得越快，几天后稳定在大约 0.6；越深的层越稳（[Cosyn 等][aleks-practical] §3.2）。以下是推论，ALEKS 没有专门测过：被推定的前置位于刚点亮那颗星的更深层，按这组数据反而相对稳；最该复核的是刚点亮的那颗星本身。
- **低估好修，高估难修，但低估也会伤人。** ALEKS 故意把拿不准的知识点算作不会，换来的代价是先学一段简单内容，再用快速通道补回来（[Cosyn 等][aleks-practical] §1.3）。Duolingo 的分级测试早年一错全错，结果放得太低。写那篇博客的工程师自述：分级后的课对他来说全都太简单，只好清空进度重测（[Duolingo 2018][duo-partial]）。
- **不可撤销会让学生卡住。** Duolingo 明说分级之后不能「撤销」重来（[Duolingo 101][duo-101]）。STOA 应该允许学生撤掉推定。
- **数字往下掉要提前解释。** ALEKS 的 FAQ 专门有一条「Knowledge Check 之后已掌握的数为什么变少了」（[ALEKS FAQ][aleks-faq]）。可汗学院也专门写了文档，解释为什么一次测验动的技能数比题目数还多（[KA-progress][ka-progress]）。2018 年它改课程挑战的计分时还提醒过：有些人的掌握度会下降（[KA 2018-09][ka-2018-09]）。

## ALEKS（知识空间理论）

### 掌握一个知识点时怎样推断前置

- KST 的基本对象是**知识状态**：某个学生可能恰好会的那一组知识点。全部可行状态组成知识结构。前置关系让可行状态远少于全部子集。ALEKS 的 College Placement 课程有 314 个知识点，可行状态约 10²³ 个，而全部子集约有 10⁹⁴ 个（[Cosyn 等][aleks-practical] §1.1）。理论最早见 [Doignon & Falmagne 1985][df1985]。
- 推断前置并不是一条单独的规则，而是**在状态上做概率更新**的自然结果。测评维护所有状态上的概率分布。每题挑「包含这个知识点的状态概率合计约 0.5」的知识点来问。答对时，所有包含它的状态概率都上升，这些状态必然也包含它的前置，前置的概率因此一起上升；答错时反过来（[Cosyn 等][aleks-practical] §1.3）。这个乘法更新与提问顺序无关，本质上是贝叶斯更新（[Doignon & Falmagne 2015][df2015] 规则 [U]）。
- 大部分「会」是推出来的，不是直接问出来的。初始测评最多 30 题，其中 1 题是不计分的抽查题，所以只有 29 道自适应题，却要给 300 到 600 个知识点定性（[Cosyn 等][aleks-practical] §1.2–1.3）。
- 结束时，每个知识点分为三类。概率高于约 80% 的算会，低于约 20% 的算不会，其余算**不确定**。不确定的**不放进**学生的知识状态，所以结果可能低估学生（同上 §1.3）。
- 粗心和蒙对是分开处理的。因为作答是开放式的，蒙对的概率可以当作很小，答对后更新得大；粗心不能忽略，答错后更新得轻。所以 ALEKS 加了「我不会」按钮，按下后做强的负向更新（同上 §1.3）。最终状态里**可能包含学生答错过的知识点**，这时把那次答错当作粗心（同上，脚注 1）。

### 推断错了怎样撤回

- 学习模式里练够分数（通常 5 分，连对加分、答错扣分）的知识点，ALEKS 也只是把它**暂时**算作学会，加入状态（[Cosyn 等][aleks-practical] §1.2、§1.3）。
- 定期的 Progress Assessment（产品里叫 Knowledge Check）负责确认。它在最近经过的状态附近做局部搜索，可以往状态里**加**知识点，也可以**减**；测完后所有练习分数清零（同上 §1.3、§3.1）。触发条件是：学会 20 个知识点并且在学习模式待满 5 小时，或者在学习模式待满 10 小时，或者 60 天没测过（[ALEKS FAQ][aleks-faq]）。
- 撤回的粒度：学生选「我不会」，或者答错一道**相关**的题，知识点都可能从「已掌握 / 已学会」退回「剩余」，重新放进学习路径（[ALEKS FAQ][aleks-faq]）。
- 撤回后重学有快速通道，目标分是 3 而不是 5。初始测评里「不确定」的知识点也走这条快速通道（[Cosyn 等][aleks-practical] §1.3）。
- 推断准不准靠留出题来量。每次测评随机插一道「抽查题」，学生看不出区别，它也不参与计分，事后用来评估系统（同上 §2.1）。

### 外缘怎样决定可学的下一步

- 外缘（outer fringe）指不在状态里、但加进来后仍是可行状态的知识点，也就是「可以学了」；内缘（inner fringe）是状态里拿掉后仍可行的知识点，也就是能力的「高点」（[Doignon & Falmagne 2015][df2015] 定义 20）。在学习空间里，内缘加外缘就能唯一确定整个状态，这叫外缘定理（同上，定理 21）。
- 测评结束后，外缘就是学习模式的入口。界面列出外缘里的全部知识点，学生**自己挑一个**来练；学会后重新计算外缘（[Cosyn 等][aleks-practical] §1.2–1.3）。官方帮助的说法是，「可以学」的知识点会自动放进学习路径（[ALEKS FAQ][aleks-faq]）。
- 效果数据：学会外缘知识点的成功率，中位数 0.93，样本是 194 万次学习机会（[Doignon & Falmagne 2015][df2015] §12.3）。另一组数据是三门课的成功率 0.81 到 0.94。成功率低的知识点，原因之一可能是知识结构有缺陷，它本不该出现在外缘里（其他原因是讲解或题目本身有问题）（[Cosyn 等][aleks-practical] §3.1、表 4）。

### 界面上是否区分推断与真学

区分，而且方向和直觉相反。

- 「Mastered」是在 Knowledge Check 里被认定掌握的，包括测评**推断**出来、根本没直接问到的知识点。「Learned」是在学习路径里练成、但**还没经过** Knowledge Check 的（[ALEKS FAQ][aleks-faq]）。
- 饼图里深色是已掌握，浅色是已学会，无色是剩余。时间线上的「已学会」图标说明这个知识点会在下一次 Knowledge Check 里被检查。进度条深蓝表示最近一次测评确认的内容，浅蓝表示之后在学习模式里的进展（[家长指南][aleks-parents]）。
- 也就是说，ALEKS 信任的是「测评推断」，而把「练习练成」当成暂时的。这一点和 STOA 不同：STOA 的点亮来自完整学完的证据。

## 可汗学院

### 掌握等级

- 五级：Not started、Attempted、Familiar、Proficient、Mastered（[KA-levels][ka-levels]、[KA-course-unit][ka-course-unit]）。
- 单项练习：答对 70% 到 99% 是 Familiar，全对是 Proficient，所以练习最高只到 Proficient。混合技能测评（测验、单元测试、课程挑战）里，答对就升一级：Not started 或 Attempted 升到 Familiar，Familiar 升到 Proficient，Proficient 升到 Mastered。答错就降：Mastered 降到 Proficient，Proficient 降到 Familiar（[KA-levels][ka-levels]）。
- 课程和单元的掌握百分比只数 Proficient 加 Mastered 的技能（[KA-percentage][ka-percentage]，2026-08 更新）。

### 一次提升多个技能

- 一份测验、单元测试或课程挑战覆盖好几个技能，每个被考到的技能各自按上面的规则移动，做完后会列出哪些升了、哪些降了、哪些不变（[KA-course-unit][ka-course-unit]）。
- **前置联动（Mastery Movement）**：测验、单元测试和课程挑战里的技能，如果建立在前置技能之上，做完这些难题也会影响前置技能的等级。所以动的技能数可能多于题目数，升降都有可能（[KA-progress][ka-progress]）。官方资料没有写联动到哪些前置、一次动几级。
- **课程挑战（Course Challenge）**：从整门课里抽样出题。2018 年 9 月起它不再单独占 20% 掌握度，官方定位改成「加速」，适合前置知识多的学习者快速升级（[KA 2018-09][ka-2018-09]）。课程挑战开始后不能重来（[KA-retake][ka-retake]）。
- **单元测试**：2018 年 Beta 时期的说法是可以「一次升好几级」，所以鼓励会的人直接跳去考（[KA 2018-05][ka-2018-05]）。现行规则已经改成一次一级（[KA-levels][ka-levels]），这条只当历史看。
- **掌握挑战（Mastery Challenge）**：解锁条件是至少 3 个技能到 Familiar、1 个到 Proficient，并且距上次开始超过 12 小时。每次 6 题、复查 3 个技能，每个技能 2 题：两题都对升一级，两题都错降一级，一对一错不变。复查哪些技能，按距上次复习的时间和当前等级挑（[KA-mastery-challenge][ka-mc]）。目前只有数学课有。
- **降级**：从 2018 年起，练习也能降级，比如在 Mastered 时练习只答对 70% 到 99%，会降到 Proficient（[KA 2018-09][ka-2018-09]）。

### 入学小测：Readiness Check

- 自适应，约 36 题，只考低于当前年级的内容（[KA-readiness-teacher][ka-readiness-teacher]、[KA-readiness][ka-readiness]）。
- **不影响**掌握等级、宝石、连续天数，只用来找出需要补的前置，并自动生成 Readiness Mission（[KA-readiness-effect][ka-readiness-effect]、[KA-readiness-missions][ka-readiness-missions]）。
- 之后做的 Readiness 练习照常计入掌握度，但**最多到 Proficient**，Mastered 必须在别处证明（[KA-readiness-effect][ka-readiness-effect]）。
- 老师端的 Readiness 报告单独成页，不进活动报告和技能报告（[KA-readiness-results][ka-readiness-results]）。

### 界面上是否区分推断与真学

官方资料里没有看到单独的「推断」等级。前置联动用的仍是同一套五级。想知道哪些等级是测验带动的，只能看活动日志的「变化」一栏，或者做完后的升降小结（[KA-progress][ka-progress]、[KA-course-unit][ka-course-unit]）。
可汗学院的区分方式是**分级封顶**：推断和测验的证据一次只升一级，Mastered 只能在 Proficient 的基础上，再在混合测验里答对才拿得到。入学小测干脆不写进掌握度。

## Duolingo

### 分级测试

- 自适应：先假定学生是新手，答对几题就加难，每题后重新估计水平。最后综合题目难度和对错，**解锁它认为学生已经会的技能**（[Duolingo 2018][duo-partial]）。
- 结果映射到技能树的「深度」：取概率分布里最高的那一档作为放置位置（同上）。
- 2018 年以前的计分是一错全错，导致放得太低。2018 年做了按错误类型给部分分的实验，分值是手工定的，还没用用户数据校准（同上）。
- 现在开课时有两个选项：从零开始，或者做分级测试跳过一些单元。分级之后，那些单元记作「已完成」，可以回去复习，但**不能撤销**分级重新开始（[Duolingo 101][duo-101]，2024-12）。

### 跳级测验（Jump here / 旧版 test out）

- 学习路径（2022 年上线）：觉得太简单的话，可以到下一个能解锁的部分，点「跳到这里」；通过测验，这一部分就解锁（[Duolingo 学习路径（德文）][duo-path-de]）。
- 即使从零开始，也可以「一次一个单元」地往前跳（[Duolingo 101][duo-101]）。
- 旧版技能树迁到路径时：没做完的等级会把学生放到路径更前面，做完以后，已经完成过的课时会被自动跳过。旧的 Legendary 也会折算：一个单元里超过一半的等级来自已到 Legendary 的技能，整个单元就记作 Legendary（[Duolingo 学习路径][duo-path-en]）。
- 旧版技能的「test out」（花宝石或会员测试升级）只在第三方资料里找到，官方页面已经失效，见「没能确认的事」。

### 记录与界面是否区分

- 官方说法是，分级和跳级都把内容记作「已完成」或「已解锁」（[Duolingo 101][duo-101]、[Duolingo 学习路径（德文）][duo-path-de]）。完成的等级在路径上显示为金色，可以点开重做（[Duolingo 学习路径][duo-path-en]）。官方资料里**没有**看到「跳过的」和「学完的」画法不同。
- 它用另一个维度区分「真会」：Legendary 是每个单元末尾更难的挑战，到了才算 Legendary（同上）。

## 三家对照

| | 推断的证据从哪来 | 一次推多少 | 怎样撤回 | 界面上分不分 |
| --- | --- | --- | --- | --- |
| ALEKS | 自适应测评，在知识状态上做概率更新 | 一次测评定性几百个知识点 | 定期 Knowledge Check；答错相关题就退回剩余，重学走快速通道 | 分：深色是测评确认（含推断），浅色是练习学会、待复核 |
| 可汗学院 | 混合测验，外加前置联动 | 每个被考到的技能一次一级；前置也会动 | 测验、Mastery Challenge、练习都能降级 | 不另设推断等级，用分级封顶代替；入学小测不进掌握度 |
| Duolingo | 分级测试、跳到这里 | 一整段单元 | 分级**不能撤销** | 官方资料未见区分；另设 Legendary 表示「真会」 |

## 没能确认的事

- **可汗学院前置联动的细节**：联动到哪些前置、是否会跨单元、一次动几级，界面上是否标出「这一级是被带动的」，官方资料都没有写。
- **Duolingo 跳级后的样子**：跳过的单元在路径上是否和正常完成的一样显示为金色、是否计 XP，官方资料没有说。Duolingo 帮助中心已从 support.duolingo.com 迁到 duolingo.com/help，那是单页应用，抓不到正文。介绍皇冠机制的官方博客 `crown-levels-a-royal-redesign` 已经 404。旧版「test out」只能从第三方资料看到，这里没有采用。
- **ALEKS 的现行实现**：Cosyn 等人的论文是 2020 年投给 Journal of Mathematical Psychology 的预印本，自述不覆盖当前版本的全部细节。阈值（80% / 20%）、分数规则（5 分 / 3 分）、更新参数（35 / 5 / 50）都可能已经调过。中位成功率 0.93 出自 Cosyn 等 2013 年的书章，这里是通过 Doignon & Falmagne 2015 的转述读到的，原章没有逐字核对。
- 三家都没有公开推断错误率随时间的变化；ALEKS 只公开了测评整体的有效性指标。

## 来源

- [aleks-practical]: Cosyn, Uzun, Doble, Matayoshi，《A practical perspective on knowledge space theory: ALEKS and its data》，预印本，2020（McGraw Hill 托管 PDF）。<https://www.mheducation.com/content/dam/mhe/research/prek-12/essa-tier-4/aleks-practical-perspective-knowledge-space-theory.pdf>
- [df2015]: Doignon & Falmagne，《Knowledge Spaces and Learning Spaces》，arXiv:1511.06757，2015。<https://arxiv.org/abs/1511.06757>
- [df1985]: Doignon & Falmagne，《Spaces for the assessment of knowledge》，International Journal of Man-Machine Studies 23, 175–196，1985。<https://doi.org/10.1016/S0020-7373(85)80031-6>
- [aleks-faq]: ALEKS 学生 FAQ（McGraw Hill 支持中心），含「Mastered 与 Learned 的区别」「Knowledge Check 之后数量为什么下降」「为什么定期测」。<https://www.mheducation.com/support/aleks-support-center/knowledge/aleks-what-is-the-difference-between-mastered-and-learned-topics.html>，<https://www.mheducation.com/support/aleks-support-center/knowledge/aleks-what-is-the-timeline.html>
- [aleks-parents]: ALEKS《Parents' Guide: Student Reports》。<https://www.mheducation.com/unitas/school/explore/sites/aleks/student-parent-resources-guide-to-student-reports-english.pdf>
- [ka-levels]: 可汗学院《How do Khan Academy's Mastery levels work?》。<https://support.khanacademy.org/hc/en-us/articles/5548760867853>
- [ka-course-unit]: 可汗学院《What are Course and Unit Mastery?》（2026-08 编辑）。<https://support.khanacademy.org/hc/en-us/articles/115002552631>
- [ka-percentage]: 可汗学院《How is my mastery percentage calculated?》。<https://support.khanacademy.org/hc/en-us/articles/48411237993357>
- [ka-progress]: 可汗学院《How can I understand my progress in Khan Academy?》（Mastery Movement 一节）。<https://support.khanacademy.org/hc/en-us/articles/360032987591>
- [ka-mc]: 可汗学院《What are Mastery Challenges in course mastery?》。<https://support.khanacademy.org/hc/en-us/articles/360037127892>
- [ka-retake]: 可汗学院《Can a student restart an exercise, quiz or unit test?》。<https://support.khanacademy.org/hc/en-us/articles/35941807811213>
- [ka-2018-05]: 可汗学院官方更新帖《Update (May 2018): New Unit Mastery [beta testing]》。<https://support.khanacademy.org/hc/en-us/community/posts/115001845151>
- [ka-2018-09]: 可汗学院官方更新帖《Update: Mastery Mechanics Changes September 2018》。<https://support.khanacademy.org/hc/en-us/community/posts/360023249611>
- [ka-readiness]: 可汗学院《What is the Readiness Check?》。<https://support.khanacademy.org/hc/en-us/articles/47686822980365>
- [ka-readiness-teacher]: 可汗学院《Readiness Check overview for teachers》。<https://support.khanacademy.org/hc/en-us/articles/47687783468557>
- [ka-readiness-effect]: 可汗学院《Does the Readiness Check affect my students' mastery, streaks, or Gems?》。<https://support.khanacademy.org/hc/en-us/articles/47777700878605>
- [ka-readiness-missions]: 可汗学院《What are Readiness Missions and Readiness exercises?》。<https://support.khanacademy.org/hc/en-us/articles/47777820626573>
- [ka-readiness-results]: 可汗学院《How do I view my students' Readiness Check results?》。<https://support.khanacademy.org/hc/en-us/articles/47777677758861>
- [duo-partial]: Duolingo 博客《Partial credit: improvements to Duolingo's placement test》，2018-09-14。<https://blog.duolingo.com/partial-credit-improvements-to-duolingos-placement-test/>
- [duo-101]: Duolingo 博客《Duolingo 101: How to learn a language on Duolingo》，2024-12-02。<https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/>
- [duo-path-en]: Duolingo 博客《Introducing the new Duolingo learning path》，2022-05-06。<https://blog.duolingo.com/new-duolingo-home-screen-design/>
- [duo-path-de]: Duolingo 博客《Der neue Duolingo-Lernpfad ist da》，2022-08-31（「Hierhin springen」一段只在德文版里有）。<https://blog.duolingo.com/der-neue-duolingo-lernpfad-ist-da/>

[aleks-practical]: https://www.mheducation.com/content/dam/mhe/research/prek-12/essa-tier-4/aleks-practical-perspective-knowledge-space-theory.pdf
[df2015]: https://arxiv.org/abs/1511.06757
[df1985]: https://doi.org/10.1016/S0020-7373(85)80031-6
[aleks-faq]: https://www.mheducation.com/support/aleks-support-center/knowledge/aleks-what-is-the-difference-between-mastered-and-learned-topics.html
[aleks-parents]: https://www.mheducation.com/unitas/school/explore/sites/aleks/student-parent-resources-guide-to-student-reports-english.pdf
[ka-levels]: https://support.khanacademy.org/hc/en-us/articles/5548760867853
[ka-course-unit]: https://support.khanacademy.org/hc/en-us/articles/115002552631
[ka-percentage]: https://support.khanacademy.org/hc/en-us/articles/48411237993357
[ka-progress]: https://support.khanacademy.org/hc/en-us/articles/360032987591
[ka-mc]: https://support.khanacademy.org/hc/en-us/articles/360037127892
[ka-retake]: https://support.khanacademy.org/hc/en-us/articles/35941807811213
[ka-2018-05]: https://support.khanacademy.org/hc/en-us/community/posts/115001845151
[ka-2018-09]: https://support.khanacademy.org/hc/en-us/community/posts/360023249611
[ka-readiness]: https://support.khanacademy.org/hc/en-us/articles/47686822980365
[ka-readiness-teacher]: https://support.khanacademy.org/hc/en-us/articles/47687783468557
[ka-readiness-effect]: https://support.khanacademy.org/hc/en-us/articles/47777700878605
[ka-readiness-missions]: https://support.khanacademy.org/hc/en-us/articles/47777820626573
[ka-readiness-results]: https://support.khanacademy.org/hc/en-us/articles/47777677758861
[duo-partial]: https://blog.duolingo.com/partial-credit-improvements-to-duolingos-placement-test/
[duo-101]: https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/
[duo-path-en]: https://blog.duolingo.com/new-duolingo-home-screen-design/
[duo-path-de]: https://blog.duolingo.com/der-neue-duolingo-lernpfad-ist-da/
