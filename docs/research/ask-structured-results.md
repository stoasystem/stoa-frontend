# Ask 后端能不能返回结构化结果（#472）

调研工单 #472，属于 wayfinder 地图 #469。问题是：学生在星图底部的 Ask 输入框里打「我想继续练导数」，
系统能不能认出目标知识点（unit），再把星图飞过去。这份文档回答后端 Ask 接口现在除了回答文字还能给什么，
缺什么，最小要改哪里。

- 后端引用的版本：`stoasystem/stoa-backend` main 分支 `77e01da`（2026-10-22）。下文的后端链接都固定在这个提交上。
- 前端引用的版本：本仓 `main` 分支 `706bb875`。

## 结论

**现在不能。** Ask 的回答到了线上只有一段 Markdown 文字，不带任何能指向 unit 的结构化字段。

- 模型其实被要求输出 JSON，里面有 `knowledge_points`、`similar_exercises`、`suggest_teacher` 几个结构化字段，
  但对话路由只取 `steps` / `answer` / `hints` 三项，拼成一段字符串存下来，其余字段在这里直接丢掉。
- `knowledge_points` 就算留下来也不够用：它是模型自由写的标签文字，不是 unit id。模型在 Ask 里看不到课程目录，
  所以没法说出 id。
- 后端没有工具调用（function calling），也没有意图分类。调用 Bedrock 时请求体里只有 `system` 和 `messages`，没有 `tools`。
- 后端**拿得到**整片星图：`knowledge_map_service.knowledge_map()` 就是星图接口背后的那个读模型，里面有每颗星的
  unitId、名称（按语言翻译）、学习状态、前置边。只是 Ask 生成回答时没有调用它，只带了薄弱话题标签，还有
  练习旁边提问时那一个 unit 的事实。

**最小改动**：在现有的 JSON 输出约定里加一个可空字段 `target_unit_id`。提交消息时把这个学科的 unit 清单
（id、名称、学习状态）作为围栏数据放进学生那一轮，后端只接受清单里有的 id，存到助手消息上，再通过
`ChatMessage.targetUnit` 返回（SSE 的 `message_done` 也带上）。不加新路由，所以 route-authorization-inventory
不变；OpenAPI 快照要重新生成。细节见最后一节。

## 1. 前端现在怎么调用 Ask

### 请求

- 星图上的 Ask 面板只走流式接口：`POST /conversations/{id}/messages/stream`，由
  `src/services/chat/chatStreamApi.ts` 的 `streamConversationMessage`（第 48–159 行）直接用 `fetch` 发出，
  带 `Accept-Language`，答案按当前语言写。
- 请求体 `StreamMessagePayload`（同文件第 10–24 行）：`content`、`idempotencyKey`（必填）、`attachmentIds`、
  `practiceContext`、`quote`。
- 结构化字段只有两个，都是**学生发给后端**的，不是后端返回的：
  - `practiceContext`：`{challengeId, lessonId, unitId}`，只放 id，正好三个键（`src/types/chat.ts` 第 22–32 行）。
    只有在练习旁边提问时才带（`src/features/ask/AskPanel.tsx` 第 185–188 行）。
  - `quote`：`{text, source: {kind: 'challenge'|'message', id}}`，最多 500 字（`src/types/chat.ts` 第 34–46 行，
    `src/features/ask/practiceContext.ts`）。
- 新对话先走 `POST /conversations`（`src/services/chat/chatApi.ts` 第 24–27 行），带 `subject`、`grade`，
  可以带 `initialMessage` 和 `practiceContext`。

### 响应

- 非流式 `SendMessageResponse = {studentMessage, assistantMessage}`；`ChatMessage` 上只有 `id`、`role`、`content`、
  `createdAt`、`status`、`attachments`、`quote`（`src/types/chat.ts` 第 48–58、84–87 行）。没有任何指向 unit 的字段。
- SSE 事件类型（`src/types/chat.ts` 第 110–140 行）：`message_start`、`message_delta`、`message_done`、`message_error`。
  解析器（`chatStreamApi.ts` 第 197–213 行）把 `event:` 行当 `type`，把 `data:` 的 JSON 摊开，**不认识的事件类型也会原样交给
  `onEvent`**。后端还发了一个前端类型里没有的 `student_message` 事件（见下文），目前没人用。
- 返回 202 时（消息存下了，答案由 worker 稍后写），前端去轮询 `GET /conversations/{id}/generation`
  （`chatStreamApi.ts` 第 215–244 行），之后重新拉 `GET /conversations/{id}` 拿答案。所以**任何新的结构化结果都必须存在
  消息上**，只在 SSE 里发一次的话，202 这条路上就丢了。

### 前端手里已经有整片星图

`GET /practice/knowledge-map` 的响应 `KnowledgeMapResponse`（`src/types/practice.ts` 第 450 行起）里有每颗星的
`unitId`、`name`、`state`，还有 `prerequisites`。所以后端只要返回一个 `unitId`，前端就能在已有数据里找到这颗星，
飞过去。

## 2. 后端 Ask 的请求、响应和流式形状

全部在 `src/stoa/routers/conversations.py`。

| 内容 | 位置 |
|---|---|
| `PracticeContextReference`（`extra="forbid"`，三个 id） | [src/stoa/routers/conversations.py#L758-L770](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L758-L770) |
| `MessageQuote` / `MessageQuoteSource` | [src/stoa/routers/conversations.py#L773-L786](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L773-L786) |
| `SendMessageRequest`（`extra="forbid"`） | [src/stoa/routers/conversations.py#L813-L829](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L813-L829) |
| `ChatMessage` 响应模型：`id, conversationId, role, content, createdAt, status, attachments, authorName, quote` | [src/stoa/routers/conversations.py#L1030-L1043](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L1030-L1043) |
| `SendMessageResponse` / `MessageAcceptedResponse`（202） | [src/stoa/routers/conversations.py#L1046-L1062](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L1046-L1062) |
| `GET /conversations/{id}`，从存储重建 `ChatMessage` | [src/stoa/routers/conversations.py#L1696-L1738](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L1696-L1738) |
| `POST /{id}/messages` | [src/stoa/routers/conversations.py#L1868-L1911](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L1868-L1911) |
| `POST /{id}/messages/stream` | [src/stoa/routers/conversations.py#L1914-L2003](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L1914-L2003) |

**流式是伪流式。** `stream_message` 先把整个回答生成完，再一次性切成每段 100 字的 `message_delta` 发出去（docstring 里写明
API Gateway 会缓冲整个响应）。事件顺序：`student_message`（整条学生消息）→ `message_start` → 若干 `message_delta` →
`message_done`（[src/stoa/routers/conversations.py#L1969-L1991](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L1969-L1991)）。回答在发出第一个事件之前就已经完整了，所以要在
`message_done` 里附上结构化结果，不需要改流的时序。

## 3. 模型输出了什么，路由留下了什么

- 模型：Amazon Bedrock 上的 Anthropic Claude，默认 `bedrock_model_id = "eu.anthropic.claude-sonnet-4-6"`、
  `bedrock_max_tokens = 2048`（[src/stoa/config.py#L347-L348](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/config.py#L347-L348)）。用 `boto3` 的 `bedrock-runtime`，
  `invoke_model` / `invoke_model_with_response_stream`，请求体格式是 Anthropic Messages（`anthropic_version: bedrock-2023-05-31`）。
- 请求体只有 `anthropic_version`、`max_tokens`、`temperature: 0.4`、`system`、`messages`，**没有 `tools`、`tool_choice`**
  （[src/stoa/services/ai_service.py#L858-L864](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/ai_service.py#L858-L864)）。整个 `src/stoa` 里搜不到 `tool_use`、`toolConfig`、`tool_choice`。
  `ai_teacher_tools_service.py` 名字里有 tools，但它是给老师用的草稿生成（摘要、练习题），跟 function calling 无关。
- 没有意图分类。每条消息都走同一个 `get_ai_answer`。

**输出约定是 JSON。** 系统提示要求模型只返回：

```
{"steps":[...],"answer":"...","hints":[...],"similar_exercises":[...],"knowledge_points":[...],"suggest_teacher":false}
```

（[src/stoa/services/ai_service.py#L52-L84](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/ai_service.py#L52-L84)，JSON 那行在第 81 行；解析和兜底见 `_parse_ai_response`，第 670–697 行。）

**路由把它压扁成文字。** `generate_for_command` 只校验并使用 `steps`、`answer`、`hints`，拼成
`"1. …\n2. …\n\n{answer}\n\n**Hint:** {hints[0]}"`，存进 `content`
（[src/stoa/routers/conversations.py#L3323-L3338](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L3323-L3338)）。`knowledge_points`、`similar_exercises`、`suggest_teacher`
在 Ask 里**全部被丢掉**，既不存储也不返回。存储的助手消息条目也只有 `content`（第 3456–3470 行）。

对比：作业题（`questions` 路由）那条流程**会**存 `knowledge_points`（[src/stoa/routers/questions.py#L1077](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/questions.py#L1077)），
后来的薄弱话题、家长报告都是从那里来的。也就是说，「从模型 JSON 里多取一个字段并存下来」这件事在仓里已经有先例。

## 4. Ask 生成回答时看得到学生的什么

模型每次能看到的（`get_ai_answer`，[src/stoa/services/ai_service.py#L771-L855](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/ai_service.py#L771-L855)；`_build_messages`，第 702–750 行）：

1. 系统提示：学科、年级、语言。
2. **薄弱话题标签**：`_memory_context_for_student` 调 `adaptive_learning_service.get_memory_summary`，取最多 8 个
   `weakTopics` 的标签，写成一句「Known weak topics for this student: …」拼在系统提示后面
   （[src/stoa/routers/conversations.py#L2032-L2063](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L2032-L2063)）。只有标签，没有 unit id。
3. **练习上下文**（只在练习旁边提问时有）：`practice_context_service.resolve` 按三个 id 查出这道题、这一课、这个 unit
   的标题、学习状态、推荐、待复习数、最近错题，作为带随机 nonce 的围栏 JSON 放进学生那一轮
   （[src/stoa/services/practice_context_service.py#L47-L100](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/practice_context_service.py#L47-L100)；[src/stoa/services/ai_service.py#L448-L460](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/ai_service.py#L448-L460)）。
   只覆盖**一个** unit。
4. 最近 6 轮对话、引用段落、附件文字。

这些上下文在消息提交时一次算好，存进命令的 `generation_context`，worker 生成时再读出来
（[src/stoa/routers/conversations.py#L2535-L2556](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L2535-L2556)）。代码注释写明这么做的原因：答案要基于学生提问那一刻的课程和学习状态。
新加的 unit 清单应该走同一条路。

**整片星图在后端是现成的，只是 Ask 没用。** `knowledge_map_service.knowledge_map(student_id, subject_id, locale)`
（[src/stoa/services/knowledge_map_service.py#L355-L402](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/knowledge_map_service.py#L355-L402)）就是 `GET /practice/knowledge-map` 背后的读模型：

- 每颗星：`unitId`、`name`（`curriculum_service._build_unit` 按语言翻译，[src/stoa/services/curriculum_service.py#L319-L332](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/curriculum_service.py#L319-L332)）、
  `nebulaId`、`state`（`lit / in_progress / ready / locked`）、`progress`、`reviewDue`、`recommendation`、`chapter.nextLesson`
  （`build_map`，第 108–248 行）。
- 前置边：`prerequisites` 来自每个 unit 行上的 `prerequisite_unit_ids`（第 466–484 行；数据由
  `scripts/seed_practice.py` 写入、`scripts/backfill_unit_prerequisites.py` 回填）。注意该模块开头的 docstring 第 8–9 行
  还写着「Prerequisites are `[]` until stoa-backend#56」，已经过时，代码里前置边是真的。
- 更轻的读法：`curriculum_service.list_catalog(locale=…)` 加 `knowledge_mastery_service.unit_states(...)`，
  `practice_context_service.resolve` 用的就是这两样。

所以「把『导数』对应到 unit」的数据前提是有的：后端能拿到这个学生这一科所有 unit 的 id、本地化名称和状态。

### 课程目录本身的现状（影响示例能不能成立）

种子课程（`scripts/seed_practice.py`）只有数学，约 20 个 unit，全是初中前段内容：分数、方程、几何、百分比、整数、量与单位、
数据、应用题（`TOPIC_BUILDERS`，第 959 行）。**没有导数，也没有三角函数。** 生产库里的目录可以通过课程运营接口增删，
具体有哪些我没有权限核实。不管怎样，`target_unit_id` 必须可空：学生说的东西不在星图上时，后端应返回 null，前端照常只显示回答文字。

另外，界面和回答语言是 de / en / fr / it，unit 名称也只译成这四种（`curriculum_translations`）。学生用中文写「导数」，
如果靠字符串匹配是对不上「Ableitung」的；交给模型从清单里挑就没有这个问题。

## 5. 加一个「目标 unit」结构化结果要动哪些地方

### 推荐方案：在现有 JSON 输出里加 `target_unit_id`（不加新路由、不加第二次模型调用）

后端（stoa-backend）：

1. **提交时把 unit 清单放进 generation_context。** 在 `_resolve_generation_context`
   （[src/stoa/routers/conversations.py#L2535-L2556](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L2535-L2556)）里加一项，例如 `unit_catalog`：这一科每个 unit 的
   `{unitId, name, state}`，可以加上前置 id，数据取自 `list_catalog` + `unit_states`，或直接取 `knowledge_map`。种子规模约 20 条，
   token 开销很小。`_generation_context_without_request`（第 2559–2581 行）给 `None`。`generate_for_command` 里对 context 的
   类型检查（第 3114–3122 行）要认这个新键。
2. **prompt。** `_build_messages` 里像 practice_context 一样，用 `_fenced` 加一个 `unit_catalog` 围栏块
   （[src/stoa/services/ai_service.py#L702-L750](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/ai_service.py#L702-L750)）。`SYSTEM_PROMPT` 的 JSON 约定（第 81 行）加 `"target_unit_id": null`，
   并写一条规则：只有学生明确想去练、想去看某个知识点时才填，而且只能填清单里的 id。`get_ai_answer` 增加一个参数，原样往下传。
3. **验证并保存。** `generate_for_command`（[src/stoa/routers/conversations.py#L3323-L3338](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L3323-L3338)）从 `ai_result` 读出
   `target_unit_id`，不在清单里的一律丢成 None（**不能信任模型输出**，这和 practiceContext 那里「只认 id、查不到就拒绝」是同一个原则）。
   结果写进 `assistant_item`（第 3456–3470 行），也写进 `record_provider_result` 的 JSON（第 3388–3400 行）；
   lease 过期后恢复时走 `_stored_provider_result`（第 2645 行起），也要把它读回来，否则恢复出来的答案会少这个字段。
4. **响应模型。** `ChatMessage` 加 `targetUnit: {unitId: str} | None = None`（第 1030–1043 行）。`get_conversation`
   从存储里读回这个字段（第 1712–1728 行）。`_message_result_json` 用的是 `model_dump`，字段加到模型上就会自动带上。
5. **SSE。** `message_done` 事件里加 `targetUnit`（第 1988–1991 行）；也可以另发一个 `message_target` 事件。前者对前端改动更小。
6. **契约产物。**
   - `docs/api/openapi.json`：`ChatMessage` 的 schema 变了，要跑 `scripts/generate_openapi_snapshot.py` 重新生成。
     前端的 `npm run test:e2e:dist` 会按 OpenAPI 校验 mock 后端。
   - `docs/security/route-authorization-inventory.json`：**不变**。清单里每条路由只记 method、path、authorization、identifiers，
     而 identifiers 只从路径、查询参数和请求体推导（[src/stoa/security/route_inventory.py#L205-L216](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/security/route_inventory.py#L205-L216)），
     响应里多一个字段不会影响它。前端的 `npm run check:api-contract` 只比对 method + path，也不受影响。
7. **测试。** 后端已有针对 prompt、practice context 和输出解析的测试，加用例覆盖三种情况：模型给了清单里的 id、
   给了清单外的 id（必须丢弃）、没给。

前端（本仓，后端合入之后再做）：

- `src/types/chat.ts`：`ChatMessage.targetUnit?: {unitId: string} | null`，`StreamMessageDoneEvent.targetUnit?`。
- `chatStreamApi.ts` 不用改，解析器本来就把 `data` 摊开交给 `onEvent`。
- 在 Ask 宿主或星图层：收到 `targetUnit` 就到已加载的 `KnowledgeMapResponse.stars` 里找这颗星，飞过去。
  找不到（不同学科、已下架）就什么都不做。交互规则（立即飞、先给按钮、先打开练习哪一种）是 #469 要定的事，不在这份调研里。

按 AGENTS.md 的顺序：先推后端，再推前端。

### 备选方案（更小或更重）

- **只用现有的 `knowledge_points`**：后端把它存下来并返回，前端或后端拿标签去和 unit 名称做模糊匹配。改动最少，但标签是模型自由写的，
  语言和措辞都不固定（「导数」对不上「Ableitung」）。而且目录里没有的知识点，它也照样会写出标签来。不推荐作为主路径。
- **纯前端匹配**：前端已经有整片星图的 `name`，可以对学生的原话做匹配，不改后端。问题同上，还要处理同义词和多语言；
  可以当作后端结果为空时的兜底。
- **独立的「找星」接口**（例如 `POST /practice/knowledge-map/locate {query}`）：职责清楚，不和讲题的回答混在一起，
  也可以不经过对话直接调用。但它是新路由：inventory 多一条、要配授权声明、要计入 AI 用量配额（Ask 的配额逻辑在
  `_ConversationAllowanceBedrockClient`，[src/stoa/routers/conversations.py#L605](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/routers/conversations.py#L605) 起），还要第二次模型调用。
  如果 #469 决定星图输入框和 Ask 对话分开（输入框只负责找星、不出讲解），这个方案更合适。
- **Bedrock 原生工具调用**（`tools` + `tool_choice`）：能强制输出符合 schema，但要改 `get_ai_answer`
  和 `_stream_ai_answer` 两条解析路径，以及按步骤推送进度的 `completed_steps`（[src/stoa/services/ai_service.py#L507-L528](https://github.com/stoasystem/stoa-backend/blob/77e01dafc48ad1b1a44e0d12567245134e1a6837/src/stoa/services/ai_service.py#L507-L528)）。
  而现有 JSON 约定加上后端的 id 白名单已经足够，单为这一个字段不值得。

## 没能确定的

- 生产库里实际有哪些 unit（有没有导数、三角函数）。我只看了种子脚本，没有生产数据访问权限。
- 一个学生能看到的 unit 清单是不是只限这一科。Ask 对话按学科创建（`subject` 是会话属性，模型只回答本学科问题），
  星图却是多学科的一片天空；学生在数学对话里说「我想练物理的力」时该怎么办，是产品问题，留给 #469。
- 加上 unit 清单以后，模型挑 id 的准确率有多高，没有评测数据。后端有离线评测的先例（stoa-backend#43），可以照那个做。
