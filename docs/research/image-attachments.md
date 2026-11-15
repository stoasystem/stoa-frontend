# 附图卡在哪（#495）

调研工单 #495，属于 wayfinder 地图 #492。问题是：孩子想附一张图提问（作业照片、截图），现在卡在哪，要补什么。

- 后端引用的版本：`stoasystem/stoa-backend` main 分支 `a63125a`（2026-10-23）。下文后端链接都固定在这个提交上，记作 `BK`。
- 基础设施引用的版本：`stoasystem/stoa-infra` main 分支 `6fd51a2`（2026-10-01），记作 `INF`。
- 前端引用的版本：本仓 `main` 分支 `8c18fb70`。

`BK` = https://github.com/stoasystem/stoa-backend/blob/a63125adf1448ebad9ffebd04db7ace58b6758ad
`INF` = https://github.com/stoasystem/stoa-infra/blob/6fd51a26fd610f117231bbae139fb2ad17b7f6ce

## 结论

**卡住的有两处，第一处在前端，不在后端配置。**

1. **前端把上传协议读错了。** `POST /files/{id}/complete` 返回 `{"status":"validated","attachment":null}` 是后端**故意的**：
   上传完成后只得到一个「已校验的临时上传」，真正的附件行要等**发消息时**才生成。发消息的 `attachmentIds`
   每一项可以是 `{uploadId}`（刚传完的）或 `{attachmentId}`（已保存的）。前端 `uploadFile` 却把
   `attachment: null` 当成失败抛错，`chatStreamApi` 也只会发 `{attachmentId}`，于是每次都卡死在这一步。
   后端没有缺 S3 桶、没有缺扫描、没有缺环境变量。
2. **就算附上了，模型也看不到图。** Ask 路径把附件交给文本抽取：PDF、Word 等抽成文字放进 prompt；
   JPEG / PNG 直接判为「没有可抽取的文字」，**静默跳过**。Bedrock 调用的消息里只有文字，没有 image 块。
   所以只修第 1 点、打开回形针，孩子会以为 Murmi 看了照片，其实没有。

`GET /files/attachments` 的 503 不在 Ask 的路径上（前端从不调用这个列表），最可能的原因是它全表扫描、
扫到 1 万条就放弃（见 2.3），修不修与附图无关。

**最小修法（让附图真正可用）：**

- 前端（本仓）：`uploadFile` 把 `status: "validated"` 当成功，留下 `uploadId`；发消息时对刚传的文件发
  `{uploadId}`。打开 `ATTACHMENTS_WORK`。上传前在浏览器里把图片缩到长边约 1568 px、重新编码成 JPEG
  （顺带去掉 EXIF 定位，也绕开后面说的 6 MB 与 4096 px 两道坎）。
- 后端（stoa-backend）：生成回答时，对图片附件读出已校验的不可变字节，按需缩小，作为 Anthropic Messages
  的 `image` 块（base64）放进学生这一轮，和文字一起发给 Bedrock。模型 `eu.anthropic.claude-sonnet-4-6`
  本身能读图。不加新路由，route-authorization-inventory 不变。

**二维码传图**需要一张新的后端「传图码」：电脑端已登录时申请，一次性、几分钟有效、只能往这个孩子的提问草稿里
放图；手机端**不登录**，凭码上传。手机不登录是 ADR 0003 逼出来的：孩子在家长手机上登录，会把家长手机浏览器的
登录整条换掉。

## 1. 前端现在做了什么

### 已经写好、测好的部分

- **选文件与托盘**：`src/features/ask/AskPanel.tsx` 第 433–445 行有隐藏的 `<input type="file" multiple accept=…>`
  和 `AttachmentTray`；第 450 行回形针按钮受 `ATTACHMENTS_WORK` 控制，现在是 `false`（第 24–40 行的注释写着
  2026-10-11 的实测）。
- **上传**：`src/features/uploads/useAttachmentUploads.ts` 选中即上传，每个文件一行，状态
  `uploading / ready / failed`；发送时只带 `ready` 的 id；失败的留在托盘里说原因。最多 8 个。
- **协议**：`src/services/files/fileApi.ts` 第 45–83 行 `uploadFile`：`POST /files/intents` →
  按 `chunkBytes` 切片 `PUT /files/{id}/chunks/{n}` → `POST /files/{id}/complete`。
- **限额**：`src/services/files/uploadLimits.ts` 抄了后端的数：图片 10 MiB、文档 50 MiB、切片 5 MiB、最多 10 片、
  每条消息最多 8 个附件；`accept` 由扩展名列表生成（`.jpg,.jpeg,.png,.pdf,.docx,…`，第 45–47 行）。
- **错误**：`src/services/files/attachmentProblems.ts` 把后端稳定错误码映射成孩子能看懂的几类。
- **消息气泡**：`src/features/ask/AskMessage.tsx` 第 143–161 行只显示文件名和图标，**没有缩略图**。

### 卡死的那一行

- `fileApi.ts` 第 68–71 行：`completed.attachment` 为空就 `throw new Error('Upload finished with status … and no attachment.')`。
- `src/services/chat/chatStreamApi.ts` 第 33–46 行：注释写着「`/files/.../complete` gives their ids」，
  所以 `wireBody` 只把 id 包成 `{attachmentId}`。这条假设与后端不符（见 2.1）。
- 组件测试 `tests/component/askAttachments.test.tsx` 第 114–125 行 mock 的是整个 `uploadFile`，返回一个带 `id` 的
  已上传文件，所以测试一直是绿的，没有碰到真实的 `complete` 形状。

### 没有的部分

- 拍照入口（`capture`）、图片压缩/缩放、缩略图、圈选、二维码传图，都没有。
- `src/features/uploads/utils/uploadHandoff.ts` 只剩一个退出时清理的 sessionStorage 键，跟手机传图无关。

## 2. 后端：上传为什么「完成了却没有附件」

### 2.1 `complete` 返回 `attachment: null` 是设计如此

- 路由：`BK/src/stoa/routers/files.py` 第 226–282 行，`/files/intents`、`/files/{upload_id}/chunks/{part_number}`、
  `/files/{upload_id}/complete`，都要求已登录（`get_actor`）。
- `BK/src/stoa/services/attachment_service.py` 第 1193–1210 行 `complete_upload`：docstring 写「validation/promotion
  follows this transition」；已经 `validated` 的上传再调一次，直接返回 `{"uploadId": …, "status": "validated",
  "attachment": None}`。第一次完成走 `_validate_and_promote_completed`，最后同样返回 `attachment: None`（第 1806 行）。
- 后端测试把这一点钉住了：`BK/tests/test_files.py` 第 73–78 行断言 `{"uploadId": "upload-1", "status": "validated", "attachment": None}`。
- 引用的形状：`BK/src/stoa/models/attachment.py` 第 103–119 行 `AttachmentReference`，docstring：
  「Reference either a validated transient upload or an active saved attachment」，`uploadId` 与 `attachmentId`
  恰好给一个。OpenAPI（`BK/docs/api/openapi.json`）里同名 schema 一致。
- 发消息时生成附件：`BK/src/stoa/routers/conversations.py` 第 813–831 行 `SendMessageRequest.attachmentIds:
  list[AttachmentReference]`（最多 8）；第 2766–2784 行对 `{uploadId}` 用命令 id 推出确定性的 `attachment_id`，
  在消息事务里写附件行、消耗这次上传。
- 上传意图 30 分钟过期（`BK/src/stoa/config.py` 第 15 行 `UPLOAD_INTENT_TTL_SECONDS = 1800`），过期后引用会得到
  `upload_expired`，前端已映射为 `expired`。

**结论：前端应该把 `validated` 当成功，发 `{uploadId}`。** 不用改后端，也不缺任何基础设施：
基础设施里图片桶开了版本控制与 CORS（`INF/stacks/storage_stack.py` 第 34–52 行），API Lambda 有表的读写与图片桶的读写
（`INF/stacks/api_stack.py` 第 131–132 行），`S3_IMAGES_BUCKET` 环境变量已注入（第 107 行）。2026-10-11 实测里
intent 与 chunk 都是 200、`complete` 能走到 `validated`，也说明 S3 分片上传、校验、晋升都通了。

### 2.2 发带附件的消息，后端 10-12 才修通

前端 10-11 实测之后，后端在 10-12、10-13 修了发附件消息这一段（都在 `attachment_repo.py`）：

- `e2dadc52`（10-12）：配额条件写成了 `used_bytes+:size<=:limit`，这在 DynamoDB 的条件表达式里是语法错误，
  「every attempt to attach a file to a message was rejected … so the production table has never held one attachment row」。
- `41404888`（10-13）：读带附件的会话时把 item 序列化了两次，第一条附件行写进去之后，读那个会话回 500。
- `5d9df868`、`1b0ce0f8`、`39d25750`：给 `upload_service_unavailable` 补日志，按事务形状和 DynamoDB 的错误说明记原因。

也就是说，即使前端当时发了 `{uploadId}`，10-12 之前也会被 503 拦下；现在这条路**按代码应该通了**，但前端从没
在生产上发过一次 `{uploadId}`，需要冒烟确认（见「没能核实的」）。

### 2.3 `GET /files/attachments` 的 503

- `attachment_service.list_owned_attachments`（第 1981–2021 行）→ `attachment_repo.list_saved_attachments`
  （`BK/src/stoa/db/repositories/attachment_repo.py` 第 2432–2477 行）→ `list_owner_attachment_items`（第 4079–4160 行）。
- 后者对**整张主表**做 `ConsistentRead` 的 Scan（docstring：GSI 不能强一致读，所以扫基表），每页 `Limit` 100、
  最多 100 页，即最多看 1 万条**任意**实体；扫不完就 `raise AttachmentRepositoryConflict("dependency_failure")`，
  被映射成 503 `upload_service_unavailable`。
- 主表是全站共用的单表（`BK/src/stoa/db/dynamodb.py` 第 48–50 行），生产上很可能早已超过 1 万条，于是这个列表
  恒为 503。这是推断：我没有生产表的条目数，也没看 CloudWatch。
- 前端没有任何地方调用这个列表（`fileApi.ts` 只有按 id 取和删）。附图不需要它；要做「我传过的图」时再修，
  方向是给附件行加 owner 维度的键（Query 而非 Scan），或者为保存的附件单独存一个按 owner 分区的索引行。

## 3. 后端：模型能不能读图

### 3.1 现在：图不进 prompt

- `BK/src/stoa/routers/conversations.py` 第 3238–3267 行：有附件时调用
  `attachment_service.extract_message_attachment_context`，得到一段文字 `attachment_context`，交给
  `ai_service.get_ai_answer`。
- `BK/src/stoa/services/attachment_service.py` 第 2523–2640 行：对每个附件读不可变版本、核对哈希、重新校验，
  然后 `parse_document_isolated` 抽文字；`no_extractable_text` 的直接 `continue`。
- `BK/src/stoa/services/document_extraction_service.py` 第 58–59 行：`image/jpeg`、`image/png` 一律
  `raise DocumentExtractionFailure("no_extractable_text")`。
- `BK/src/stoa/services/ai_service.py` 第 702–753 行 `_build_messages`：每条消息的 `content` 都是字符串；附件只以
  `<student_attachment_context>` 文字块拼进学生这一轮（第 736–739 行）。历史轮也只取文字。
- 旧的 `/questions` 路径另有 Rekognition `DetectText` OCR（`BK/src/stoa/services/ocr_service.py`，
  `INF/stacks/api_stack.py` 第 650 行授权），但 Ask 不走它；而且通用 OCR 读不了分数、根号、手写算式。

### 3.2 模型本身能读图

- 生产模型 `eu.anthropic.claude-sonnet-4-6`（`INF/stacks/api_stack.py` 第 34 行，`BK/src/stoa/config.py` 第 347 行），
  走 `invoke_model` / `invoke_model_with_response_stream`，`anthropic_version: bedrock-2023-05-31`。
- Bedrock 上的 Claude Messages 请求可以在 `content` 数组里放
  `{"type":"image","source":{"type":"base64","media_type":"image/jpeg","data":"…"}}`
  （[AWS：Anthropic Claude Messages API · Multimodal prompts](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html)）。
- 限制（[Anthropic：Vision](https://platform.claude.com/docs/en/build-with-claude/vision)）：
  - Bedrock 上只能用 base64 来源，不能用 URL 或 Files API。
  - 格式：JPEG、PNG、GIF、WebP。
  - 单张上限：**Bedrock 上 5 MB（base64 之后）**，即原始字节约 3.75 MB；尺寸上限 8000×8000 px；
    一次请求超过 20 张时每张不能超过 2000 px。
  - Sonnet 4.6 属于「Standard」分辨率档：长边超过 **1568 px** 或超过 1568 个视觉 token 会被缩小；
    token 数 = ⌈宽/28⌉ × ⌈高/28⌉，所以一张图最多约 1568 个输入 token。
- 费用：Sonnet 4.6 基础输入价 $3 / 百万 token；`eu.` 是区域推理配置，Claude 4.5 起区域端点加价 10%
  （[Anthropic：Pricing](https://platform.claude.com/docs/en/about-claude/pricing)），约 $3.30 / 百万 token。
  一张缩到 1568 px 以内的图约 1568 token，**约 0.5 美分**；以正式的 [Bedrock 价目表](https://aws.amazon.com/bedrock/pricing/) 为准。
  若把历史轮的图也每轮重发，费用按轮数累加。

### 3.3 要改的地方

- `ai_service._build_messages`：学生这一轮的 `content` 从字符串改成块数组（图在前、文字在后，Anthropic 文档建议
  image-then-text），合并相邻同角色消息的逻辑要跟着改（现在是字符串相加）。
- `extract_message_attachment_context` 或新函数：对 `image/*` 返回字节而不是跳过；用已有的 Pillow 按长边 1568 px
  缩放、转 JPEG，保证 base64 后小于 5 MB。
- 同步与流式两条调用都用 `_build_messages`；`bedrock:CountTokens` 的准入计数（`bedrock_token_count_service.py`）
  要把图算进去。
- 要定的规则：后续追问时模型还看不看得到上一轮的图（重发历史图 = 每轮付钱；不重发 = 追问「第二题呢」会失忆）。
  另：防注入的提示词要覆盖图片里的文字。

## 4. 上传链路上还有两道坎（前端缩图一并解决）

- **4096 px**：`BK/src/stoa/services/file_validation_service.py` 第 152–153 行，图片长边超过 `IMAGE_MAX_EDGE = 4096`
  就 `upload_invalid`。1200 万像素手机照片（4032×3024）刚好能过；更高像素的默认输出会被拒。
- **6 MB**：API 是 HTTP API → Lambda（`INF/stacks/api_stack.py` 第 679 行），Lambda 同步调用的请求体上限 6 MB
  （[AWS：Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)）。切片是 5 MiB
  （`attachment_service.py` 第 52 行），二进制体进 Lambda 事件时按 base64 编码，约 6.7 MB，超过上限。
  **按文档推算，一张超过约 4.5 MB 的照片第一片就会失败**；没有实测。
- 两者的共同解法：浏览器里先缩到长边约 1568 px（模型反正只看这么大）再传，一张作业照片通常只有几百 KB，
  一片就够。用 canvas 重新编码还会丢掉 EXIF（含 GPS），
  [HTML Media Capture 规范](https://w3c.github.io/html-media-capture/) 也提醒不要把位置泄露在照片元数据里。

## 5. 手机浏览器直接调摄像头

- `capture` 属性的支持（MDN browser-compat-data，`html.elements.input.capture`）：
  Chrome Android 25+、Firefox Android 79+、Safari iOS 10+、Samsung Internet、Android/iOS WebView 支持；
  **桌面 Chrome、Firefox、Safari 都不支持**（会被忽略，出现普通文件选择框）。MDN 标为「Limited availability」，不是 Baseline。
  （[MDN：capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture)）
- 取值：`user`（前置）、`environment`（后置）。规范说它只是偏好提示，浏览器做不到可以退回默认；
  不写 `capture` 时就是普通文件上传控件（[W3C HTML Media Capture](https://w3c.github.io/html-media-capture/)）。
- MDN 还说，有摄像头的系统在文件选择时本来就会给「选已有文件或新拍一张」的界面。所以：
  - 写 `capture="environment"`：手机直接开后置相机，但**拿不到相册里的截图**。
  - 不写 `capture`、`accept` 里只放图片：手机会让孩子在拍照和相册之间选（系统界面，各家不同）。
  - 现在的 `accept` 混着 PDF、Word 等扩展名，手机上是否还会给「拍照」选项要真机确认。
  建议拍照入口单独一个 `<input accept="image/*" capture="environment">`，「选图片」入口不带 `capture`。
- 后端只收 `jpg/jpeg/png`（`BK/src/stoa/services/file_validation_service.py` 的 `MIME_BY_EXTENSION`）。
  iPhone 相机默认存 HEIC；浏览器交给网页的是不是 JPEG，取决于 `accept` 与 iOS 版本，没核实。前端缩图重编码成 JPEG 可以一并兜住。

## 6. 电脑显示二维码、手机拍照传回电脑

### 6.1 为什么手机端不能要求登录

- ADR 0003（`docs/adr/0003-one-account-per-browser.md`）：一个浏览器只有一次登录；「在任何标签页登录，就换掉这一条」，
  其他标签页随之退出。CONTEXT.md「浏览器账号」同义。
- 很多六到九年级的孩子用的是家长的手机。手机浏览器里如果登着家长的 STOA 账号，孩子扫码后再登录自己的账号，
  会**把家长那一条浏览器登录换掉**，家长的标签页全部退出；反过来，若直接沿用手机上已有的登录，照片会进家长账号。
- 所以传图页**不读也不写浏览器登录**（不碰 localStorage 里那一条，也不加入它），只凭二维码里的一次性码行事。
  这不违反 ADR 0003：它不是一次登录，不产生标签页账号，不显示任何人的账号。

### 6.2 需要什么

后端（stoa-backend，新功能）：

1. **申请传图码**（已登录，电脑端的标签页账号）：返回一个 id 和一个高熵的一次性秘密（例如 32 字节随机数）。
   后端只存秘密的哈希，绑定：所属学生、用途（Ask 附图）、过期时间（几分钟）、最多几张、状态。
   已有先例：`/invitations/claim`、`/teacher-applications/activation/claim|consume` 都是 `public` 路由凭单次令牌行事
   （`BK/src/stoa/routers/auth.py` 第 1351 行附近，`teacher_applications.py` 第 157、175 行）。
2. **凭码上传**（`public` 路由，令牌放请求头，不放 URL 查询参数）：复用现有 intent → chunks → complete 流水线，
   归属记在申请人名下，状态变成「已收到 uploadId」。码用完或过期即失效；对同一码限速。
3. **电脑端查询**（已登录）：电脑轮询这个 id，拿到已校验的 `uploadId`，放进当前提问的托盘，跟本机选的文件一样
   发 `{uploadId}`。后端没有推送通道，轮询最简单。
4. 新路由进 route-authorization-inventory（前端 `npm run check:api-contract` 会比对），先推后端再推前端。

前端（本仓）：

- 电脑端：托盘里「用手机拍」→ 显示二维码（码在 URL 的 `#` 片段里，片段不会发给服务器，也不进 Referer）、倒计时、
  「已收到，看一眼再发」。收到的图先出现在托盘里，孩子确认后才随提问发出。
- 手机端：一个不经登录守卫的路由，只有一个拍照按钮（第 5 节的 `capture`）、缩图、上传进度、「已发到电脑」。
  不显示孩子的名字或任何账号信息。

风险与对策：码被别人看到（同学拍下屏幕）→ 对方只能往这个孩子的草稿里塞一张图，读不到任何东西，且电脑端发送前能看到、能删；
短时效 + 单次使用 + 限张数。Onfido 还可选让手机端输入电脑上显示的确认码，错一次就取消（可作为后续加固，不是必需）。

### 6.3 现成做法

- **Onfido（现 Entrust）Web SDK 的 cross-device flow**：电脑端可以显示二维码（默认）、复制链接或发短信，链接按会话唯一；
  选项 `_crossDeviceLinkMethods: ['qr_code','copy_link','sms']`；手机端拍完提示回到电脑完成，电脑端走 `onComplete` 回调；
  文档没有手机端登录这一步；有个 beta 的确认码屏
  （[Entrust Identity Web SDK](https://documentation.identity.entrust.com/sdk/web/)）。
- **Stripe Identity**：没有摄像头时可「switch to another device」，发短信链接或显示二维码（「Barcode Link」）用手机继续；
  理由是手机摄像头通常比网络摄像头拍得清楚
  （[Stripe 支持：Troubleshooting ID upload](https://support.stripe.com/questions/troubleshooting-id-upload-for-identity-verification)）。
  这和地图 #492 的前提（很多笔记本拍不了照）一样。

## 7. 修复清单（供拆单）

| 顺序 | 在哪 | 改什么 | 动到的文件 |
|---|---|---|---|
| 1 | 前端 | `validated` 当成功，保存 `uploadId`；发 `{uploadId}`；测试改成按真实 wire 形状 mock | `src/services/files/fileApi.ts`、`src/types/file.ts`、`src/features/uploads/useAttachmentUploads.ts`、`src/services/chat/chatStreamApi.ts`、`src/lib/pendingChatMessages.ts`、相关测试 |
| 2 | 前端 | 上传前缩图到长边 1568 px、转 JPEG | `src/features/uploads/` 新增工具函数 |
| 3 | 后端 | 图片作为 image 块进 Bedrock 请求；准入计数算图 | `ai_service.py`、`attachment_service.py`（或新模块）、`conversations.py`、`bedrock_token_count_service.py` |
| 4 | 前端 | 第 1–3 项上线并冒烟通过后，打开 `ATTACHMENTS_WORK`；气泡显示缩略图（`GET /files/attachments/{id}/content`） | `AskPanel.tsx`、`AskMessage.tsx` |
| 5 | 前端 | 手机上的拍照入口（`capture`） | `AskPanel.tsx` |
| 6 | 后端 + 前端 | 二维码传图码 | 新路由、新前端路由 |
| 可选 | 后端 | `GET /files/attachments` 改成按 owner 查询 | `attachment_repo.py` |

## 没能核实的

- **10-12 之后发 `{uploadId}` 的消息在生产上能不能成功**：按代码应该能，但前端从没发过，我也没有账号去试（不能代为登录）。
  第 1 项做完后用冒烟账号实测一次：传一张小 PNG、发 `{uploadId}`、读回会话看到附件。
- **`GET /files/attachments` 503 的确切原因**：「主表超过 1 万条导致扫描放弃」是推断，没看到表的条目数或 CloudWatch 日志
  （`5d9df868` 之后日志里应该能看到 `dependency_failure` 的来源）。
- **大于约 4.5 MB 的切片会不会被 Lambda 6 MB 上限拒绝**：按 AWS 文档推算，没实测。
- **手机端行为**：`accept` 混有文档扩展名时手机是否仍给拍照选项、iPhone 照片交给网页时是不是 JPEG，都要真机确认。
- **Bedrock 的确切单价**：按 Anthropic 价目页推算，以 AWS Bedrock 价目表为准。
- `stoa-infra` 的最后提交是 10-01，没核实它是否就是生产当前部署的版本。
