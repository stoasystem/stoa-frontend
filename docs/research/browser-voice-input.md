# 浏览器语音输入：可行性调研（#494）

> 所属地图：#492「孩子怎样不用会写公式也能快捷地提问」。调研日期 2026-10-23。
> 语音在这里的用途是让孩子**说出「卡在哪里」**，不是口述公式。
> 只采信一手资料（MDN / browser-compat-data、caniuse 数据文件、W3C 草案、浏览器源码与厂商文档、
> 法规原文、EDPB 指南、AWS 文档与价目 API）。每条结论后标注来源编号，见文末。
> 标「推断」的是作者根据一手资料推出来、但资料本身没写明的结论。

## 一句话结论

浏览器自带的 `SpeechRecognition` 只在 Chromium 系（Chrome / Edge / Android Chrome）和
Safari（macOS、iOS，需开启 Siri）上能用，Firefox 正式版不支持；默认情况下音频会离开设备，
分别送到 Google、Microsoft Azure 或 Apple 的服务器，STOA 无法与这些厂商签数据处理协议。
真正「音频不出设备」的路径只有：Chrome 桌面版 139+ 的 `processLocally = true`
（语言包只有 de-DE / fr-FR / it-IT / en-US 等，没有 -CH）、Safari 在支持本地识别的语言上
（WebKit 源码会强制本地识别），以及 Edge 仍处于 Canary/Dev 实验阶段的本地模型。
**第一步建议：不写任何语音代码，在提问框旁边加一句四语提示，教孩子用系统自带听写
（Windows `Win + H`、Mac 麦克风键/听写快捷键、iOS/Android 键盘上的麦克风）。**
这样 STOA 收到的只是文字，跟孩子自己打字一样，不新增音频处理。

## 1. Web Speech API（SpeechRecognition）各浏览器支持

规范状态：W3C Speech API Community Group 的 *Draft Community Group Report*（最新版 2026-10-21），
不是 W3C 正式标准 [S3]。MDN 标注为 *Limited availability*，「不是 Baseline」[S1]。

| 浏览器 | 是否可用 | 接口名 | 音频去向（默认） | 本地识别 | 来源 |
| --- | --- | --- | --- | --- | --- |
| Chrome 桌面 | 可用（33 起带前缀，139 起无前缀） | `SpeechRecognition` / `webkitSpeechRecognition` | Google 服务器 `www.google.com/speech-api/full-duplex/v1` | 139 起 `processLocally`、`available()`、`install()` | [S2][S5][S6] |
| Edge 桌面（Windows / macOS） | 可用；caniuse 数据仍标「n」并注「API 存在但事件不触发」，与微软文档相矛盾，需实测 | 同 Chromium | Azure Cognitive Services（「voice data leaves the machine」） | 仅 Canary/Dev 150.0.4076+，需手动开 flag | [S2][S4][S8][S9] |
| Safari macOS | 可用（14.1 起） | 仅 `webkitSpeechRecognition` | Apple（与 Siri 同一引擎）；见下方本地识别说明 | 不支持 `processLocally` 属性，但 WebKit 内部在该语言支持本地识别时强制本地 | [S2][S4][S10][S11] |
| iOS / iPadOS Safari | 可用（14.5 起）；**Siri 必须开启**；SafariViewController 与「添加到主屏幕」的 Web App 中不可用 | 仅 `webkitSpeechRecognition` | 同上 | 同上 | [S2][S4][S10] |
| iOS 上的 Chrome / Edge / Firefox | 瑞士不在欧盟，iOS 浏览器必须使用 WebKit（App Store 准则 2.5.6，替代引擎只限欧盟、日本） | — | 推断：与 Safari 相同 | — | [S21] |
| Android Chrome | 可用 | 同 Chromium | 调用 Android 系统 `SpeechRecognizer`，优先绑定 Google 应用（`com.google.android.googlequicksearchbox`） | `processLocally` 不支持 | [S2][S7] |
| Samsung Internet | BCD 记为跟随 Chrome Android；caniuse 标部分支持 | — | 未核实 | — | [S2][S4] |
| Firefox（桌面 / Android） | **正式版不可用**，只在 Nightly 打开 pref 后可用 | — | Mozilla 代理 → Google Cloud Speech-to-Text（wiki 最后更新 2022） | 不在计划内 | [S2][S4][S12] |
| Opera | caniuse：API 存在但事件不触发 | — | 未核实 | — | [S4] |

几个容易踩的坑：

- **Chrome 的云端识别把音频发给 Google。** Chromium 源码里的网络流量注解写明
  「Audio is sent to Google's servers」，目的地类型 `GOOGLE_OWNED_SERVICE` [S5]。MDN 也写
  「Your audio is sent to a web service for recognition processing, so it won't work offline」[S1]。
- **Edge 的云端识别走 Azure。** 微软企业策略文档 `SpeechRecognitionEnabled`：「The Microsoft Edge
  implementation of the Web Speech API uses Azure Cognitive Services, so voice data leaves the machine.」
  学校的管理员可以用这条策略把语音识别整个关掉 [S8]——在学校电脑上要预期它可能不可用。
- **Safari 依赖 Siri 开关。** 家长或学校用「屏幕使用时间」/MDM 关掉 Siri 后，API 直接报错 [S10][S4]。
- 规范要求浏览器在开始录音前获得「explicit, informed user consent」并显示明显的录音指示 [S3]；
  实际表现是麦克风权限弹窗（Chrome 注解写明按站点授权）[S5]。

### 1.1 语言代码 de-CH / fr-CH / it-CH / en

`lang` 接受任意 BCP 47 标签，不设置时取页面 `<html lang>`，再退回浏览器语言 [S1][S3]。
**规范不保证某个标签一定被支持**，各家支持的列表不同：

| 引擎 | de-CH | fr-CH | it-CH | en | 来源 |
| --- | --- | --- | --- | --- | --- |
| Apple 听写（Safari 用的同一引擎） | 有「German (Switzerland)」，含本地识别 | 有「French (Switzerland)」，含本地识别 | 有「Italian (Switzerland)」，含本地识别 | 15 种英语变体，无 en-CH | [S13][S14] |
| Chrome 本地识别（SODA 语言包） | 无，只有 de-DE | 无，只有 fr-FR | 无，只有 it-IT | en-US | [S6] |
| Edge 本地模型（实验） | 无，只有 de-DE | **无法语** | 无，只有 it-IT | en-US | [S9] |
| Chrome 云端（Google） | 未公开文档 | 未公开文档 | 未公开文档 | 未公开文档 | — |
| Edge 云端（Azure） | 未公开文档 | 未公开文档 | 未公开文档 | 未公开文档 | — |

推断：前端应当按「先 de-CH，失败或 `available()` 返回 `unavailable` 时退回 de-DE」的顺序尝试，
法语、意大利语同理；英语用 en-GB 或 en-US。是否会自动回退没有文档，必须实测。

**瑞士德语方言是另一个问题。** 孩子日常说的是 Schweizerdeutsch，不是标准德语。Apple 的
「German (Switzerland)」、AWS 的「German, Swiss (de-CH)」[S16] 都没有说明是指瑞士标准德语还是方言；
没有找到任何一手的方言识别准确率数据。这是最大的不确定项，只能靠实测。

### 1.2 本地识别（音频不出设备）

- **Chrome 139+（桌面）**：设 `recognition.processLocally = true`，先用
  `SpeechRecognition.available({ langs, processLocally: true })` 查询，结果为 `downloadable`
  时调用 `install()` 下载语言包 [S1][S3][S6-blog]。Chrome 官方说法：「websites can ensure that audio
  and transcribed speech are not sent to a third-party service for processing」[S6-blog]。
  `available()` 受 `on-device-speech-recognition` 权限策略控制 [S3]。Android 版不支持 [S2]。
  Chromium 源码显示 Web Speech 复用 SODA（Live Caption 的语言包）[S6]。
- **Edge**：本地模型只在 Canary/Dev 150.0.4076+，需在 `edge://flags` 打开
  「Speech Recognition with on-device model」；微软写明「The speech input into the model never
  leaves the device, and isn't collected to train AI models」[S9]。正式版用户用不上。
- **Safari**：没有 `processLocally` 属性 [S2]，但 WebKit 源码里，只要 `SFSpeechRecognizer`
  对该语言 `supportsOnDeviceRecognition`，就调用 `setRequiresOnDeviceRecognition:YES` [S11]。
  结合 Apple 功能页，de-CH / fr-CH / it-CH 都列在「On-Device」听写里 [S13][S14]。
  推断：在较新的 Apple 设备上 Safari 的识别多半在本地完成；但网页无法查询或强制这一点，
  且 WebKit main 分支的源码不等于每个已发布的 Safari 版本，需实测（例如断网测试）。

## 2. 未成年人语音的隐私要求

### 2.1 瑞士 nDSG（STOA 主要适用的法律）

- **声音不自动算「特别敏感」。** nDSG 第 5 条 c 项第 4 目只把「biometrische Daten, die eine
  natürliche Person eindeutig identifizieren」列为 besonders schützenswerte Personendaten [S17]。
  只把语音转成文字、不做声纹识别，推断不落入这一类；录音本身仍是普通个人数据。
- **同意。** nDSG 没有规定儿童同意年龄。一般原则：需要同意时，同意须在充分告知后、针对特定处理、
  自愿作出；处理特别敏感数据时必须「ausdrücklich」[S17 第 6 条第 6–7 款]。能否由孩子自己同意，
  看民法上的判断能力：ZGB 第 16 条按个人能力而非年龄判断，第 19c 条规定有判断能力的未成年人
  可以自行行使人格权利 [S18]。也就是说，瑞士法律下没有「13 岁」或「16 岁」这样的硬线，
  6–9 年级（约 11–15 岁）要按情况判断；**稳妥做法是让家长同意**，STOA 现有的家长账户正好可用。
- **告知义务。** 第 19 条要求告知处理目的、接收方，以及数据出境的国家和保障措施 [S17]。
  如果 STOA 的页面触发浏览器把音频送到 Google / Microsoft / Apple，隐私说明里至少要写清楚这一点。
- **风险评估。** 第 22 条：可能有高风险时须事先做 Datenschutz-Folgenabschätzung，「namentlich」
  在大规模处理特别敏感数据时 [S17]。只做转写、不留录音，推断不到这个门槛，但涉及儿童，建议写一份简短的评估记录。

### 2.2 GDPR（只有 STOA 面向欧盟境内用户时才直接适用，第 3 条第 2 款）

- **生物识别的定义** 要求「specific technical processing … which allow or confirm the unique
  identification」[S19 第 4 条第 14 项]；第 9 条禁止的是「biometric data for the purpose of uniquely
  identifying a natural person」[S19]。Recital 51 说照片只有经过特定技术处理用于唯一识别时才算 [S19]。
- **EDPB 指南 02/2021（语音助手）**：一方面说「voice data is inherently biometric personal data」，
  但同时写明只有用于唯一识别时才要第 9 条的例外，并在脚注 31 说 Recital 51 的道理「同样适用于声音」；
  「use of voice data for user identification implies the processing of biometric data」[S20 §31、§81、fn 31]。
  推断：只转写、不做说话人识别，不触发第 9 条；但录音和转写仍是个人数据。
- **儿童同意**：以同意为法律基础、直接向儿童提供信息社会服务时，16 岁以下须由监护人同意或授权，
  成员国可下调（最低 13 岁）[S19 第 8 条第 1 款]。EDPB 明确把「voice, transcripts」都算进需要家长许可的儿童数据 [S20 §93]。
  Recital 38：儿童数据需要特别保护 [S19]。

### 2.3 「音频完全不经过 STOA 服务器」能不能免掉义务？

只能免掉**一部分**：

1. **系统听写（Windows / macOS / iOS / Android 键盘）**：STOA 页面只看到键盘打出的文字。
   是否送云端、给谁，是用户与操作系统厂商之间的关系，STOA 没有选择处理方式。推断：STOA 对音频
   不是控制者，对文字的义务与孩子自己打字完全相同。**这是唯一真正不新增义务的方案。**
2. **网页调用 Web Speech API（云端模式）**：音频虽然不经过 STOA，但是 STOA 的代码决定了
   「此时录音、送去识别」。欧盟法院 Fashion ID 案（C-40/17）认定：网站嵌入的代码让访问者的浏览器
   把个人数据传给第三方时，网站经营者可以就「收集和传输」这一段被视为控制者 [S22]。
   推断：网页按钮触发 Chrome / Edge 把孩子的录音发给 Google / Azure，STOA 很可能要对这一段负责，
   而 STOA 和这两家没有任何合同（无法签 DPA、无法指定地域、无法要求不留存）。nDSG 下是否同样认定，
   没有找到瑞士判例，需要法律意见。
3. **Web Speech API 本地模式（Chrome `processLocally`，Safari 本地识别）**：音频不离开设备，
   第三方传输问题基本消失；STOA 只拿到文字。剩下的义务是：说明麦克风用途、文字的处理同打字。
   但覆盖面窄（只有 Chrome 桌面 139+ 及较新的 Apple 设备），而且 Safari 无法从网页确认是否本地。
4. **AWS Transcribe**：音频必然经过 STOA 控制的 AWS 账户，STOA 是控制者，AWS 是处理者，
   义务最完整（告知、家长同意、留存期限、出境）。见第 4 节。

## 3. 替代方案：提示孩子用系统自带听写

| 系统 | 怎么调出 | 音频去向 | 瑞士语言 | 来源 |
| --- | --- | --- | --- | --- |
| Windows 11 | 光标放在输入框，按 **`Win + H`**；触屏键盘上点麦克风 | 「online speech recognition, which is powered by Azure Speech services」，**需联网** | 列表里只有 de-DE、fr-FR、fr-CA、it-IT，**没有 -CH** | [S15] |
| macOS | 系统设置 › 键盘 › 听写 打开；按**麦克风键**、或设定的听写快捷键、或菜单「编辑 › 开始听写」 | 设置里会显示是否「processed on your device and not sent to Siri servers」；否则送 Apple | de-CH、fr-CH、it-CH 均支持且有本地识别 | [S23][S13][S24] |
| iOS / iPadOS | 键盘上的**麦克风**按钮 | 同上：显示本地处理时不出设备，否则送 Apple，默认不存录音（除非打开「改进 Siri 与听写」） | de-CH、fr-CH、it-CH 均支持且有本地识别 | [S14][S24] |
| Android（Gboard） | 点输入框，点键盘顶部的**麦克风**，出现「Speak now」后说话 | 帮助页未说明 | 帮助页只说「Talk-to-text doesn't work with all languages」 | [S25] |

优点：零代码、所有浏览器（包括 Firefox）都能用、孩子在别的地方也学得会；STOA 不新增音频处理。
缺点：Windows 上没有瑞士变体且必须联网；学校设备可能被管理员关掉；STOA 只能「提示」，无法检测孩子是否用了。

## 4. 云端转写：AWS Transcribe

- **地域**：苏黎世 `eu-central-2` 同时提供批量（`transcribe.eu-central-2.amazonaws.com`）和流式
  （`transcribestreaming.eu-central-2.amazonaws.com`）端点 [S26]。
- **语言**：表中有 **de-CH（German, Swiss）**，批量与流式都支持；de-DE、fr-FR、it-IT、en-GB、en-US 均支持；
  **没有 fr-CH、it-CH** [S16]。de-CH 是标准德语还是方言，文档没说 [S16]。
- **价格**（AWS Price List API，eu-central-2，版本 2026-09-11，生效 2026-06-01）[S27]：
  - 批量：USD 0.0001 / 秒 ≈ **USD 0.006 / 分钟**
  - 流式：USD 0.0001667 / 秒 ≈ **USD 0.010 / 分钟**
  - 按秒计费、无最低时长；免费额度每月 60 分钟、12 个月 [S28]。
  - 粗算：一次「我卡在哪」约 15 秒，流式约 USD 0.0025；1 万次约 USD 25。费用不是障碍。
- **数据用途**：「AWS AI services may use and store customer content for service improvement … we might
  store such content in an AWS Region outside of the AWS Region where you are using the service」，
  需要通过 AWS Organizations 的 AI services opt-out policy 退出 [S29]。**如果采用，必须先配置 opt-out**，
  否则孩子的录音可能被存到苏黎世以外。
- 结论：技术上可行、便宜、能留在苏黎世，但它让 STOA 成为录音的控制者（第 2.3 节第 4 条），
  还要写后端流式代理。对「说出卡在哪」这个场景，投入与风险都不划算，不建议作为第一步。

## 5. 数学说法的转写质量：公开数据

- **没有找到**任何一手资料给出浏览器 Web Speech API、Apple 听写、Windows 语音输入或 AWS Transcribe
  对数学口语（「x hoch zwei」「x au carré」）的准确率；厂商也不公布这类数字。
- 学术界的数据都是**英语（或俄语）、成人、把口述公式转成 LaTeX**，与本场景不同：
  - MathSpeech（AAAI 2025）：1,101 条 YouTube 数学课录音，现有 ASR 加纠错后字符错误率仍约 0.3 [S30]。
  - Speech-to-LaTeX（ICLR 2026）：英俄两语 6.6 万条标注音频，最好模型在公式上 CER 约 27–28% [S31]。
  - Intel 团队的儿童居家数学学习研究（BEA@ACL 2023）比较了 Google Cloud 与 Whisper，指出儿童语音的
    ASR 错误会传导到理解环节，摘要未给出 WER [S32]。
- 推断：口述公式的错误率很高（约三成字符出错），这正好支持本地图的设定——语音只用来说
  「卡在哪」这类日常语句，公式另想办法。德语 / 法语 / 意大利语儿童语音没有公开数据，需要自己测。

## 6. 建议

1. **第一步（零代码、零新增数据处理）**：在提问输入框旁加一句四语提示和一个「怎么用语音」的小说明，
   按设备显示对应方法（Windows `Win + H`；Mac 麦克风键；iPhone/iPad 和 Android 点键盘上的麦克风）。
   隐私说明里补一句「语音由你设备的系统处理，STOA 只收到文字」。
2. **第二步（如果要网页内麦克风按钮）**：只在 `processLocally` 可用（Chrome 桌面 139+）时显示按钮，
   先 `available()` 再 `install()`；Safari 是否本地无法从网页确认，先做断网实测再决定是否开放；
   **不要用云端模式**，除非法律意见确认 STOA 可以承担 Google / Azure 那一段传输的责任。
3. **不建议**：AWS Transcribe 或任何把录音送到 STOA 后端的方案，除非将来有更强的需求（例如方言识别实测证明系统听写不可用）。
4. 任何一步上线前，先用真实设备测 de-CH / fr-CH / it-CH，并找几位孩子说瑞士德语试一下。

## 未能核实的内容

- Chrome、Edge 云端识别具体支持哪些语言标签（是否接受 de-CH / fr-CH / it-CH），没有公开文档。
- Chrome 本地识别遇到 de-CH 是否自动回退 de-DE 的 SODA 语言包。
- 已发布的 Safari 版本是否与 WebKit main 源码一致地强制本地识别；iOS 上的 Chrome 是否暴露同一接口。
- Edge 正式版上 Web Speech 是否可用：微软文档与 caniuse 的「事件不触发」说法矛盾。
- Android 上 Google 应用的语音识别把音频发到哪里、是否本地；Gboard 的数据处理。
- Apple「German (Switzerland)」和 AWS「de-CH」对瑞士德语方言的识别效果。
- 瑞士法下，网页触发浏览器厂商云识别时 STOA 是否算控制者（Fashion ID 是欧盟判例，没有找到瑞士对应判例），
  以及 EDÖB 关于儿童同意的具体指引（没有找到 EDÖB 自己的页面）。
- 任何语言下数学口语转写准确率的厂商数据。

## 来源

- [S1] MDN, *SpeechRecognition*. https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- [S2] mdn/browser-compat-data, `api/SpeechRecognition.json`. https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json
- [S3] W3C Speech API CG, *Web Speech API*, Draft Community Group Report 2026-10-21. https://webaudio.github.io/web-speech-api/
- [S4] caniuse 数据文件 `speech-recognition.json`（注 1–4）. https://github.com/Fyrd/caniuse/blob/main/features-json/speech-recognition.json
- [S5] Chromium 源码 `content/browser/speech/network_speech_recognition_engine_impl.cc`（`kWebServiceBaseUrl` 与流量注解）. https://chromium.googlesource.com/chromium/src/+/main/content/browser/speech/network_speech_recognition_engine_impl.cc
- [S6] Chromium 源码 `components/soda/constants.h`（`kLanguageComponentConfigs`）与 `chrome/browser/speech/chrome_speech_recognition_manager_delegate.cc`（Web Speech 使用 SODA）. https://chromium.googlesource.com/chromium/src/+/main/components/soda/constants.h
- [S6-blog] Chrome for Developers, *New in Chrome 139*, 「On-device Web Speech API」. https://developer.chrome.com/blog/new-in-chrome-139
- [S7] Chromium 源码 `content/public/android/java/src/org/chromium/content/browser/SpeechRecognitionImpl.java`（`AGSA_PACKAGE_NAME`）. https://chromium.googlesource.com/chromium/src/+/main/content/public/android/java/src/org/chromium/content/browser/SpeechRecognitionImpl.java
- [S8] Microsoft Learn, Edge 策略 *SpeechRecognitionEnabled*. https://learn.microsoft.com/en-us/deployedge/microsoft-edge-browser-policies/speechrecognitionenabled
- [S9] Microsoft Learn, *Convert speech to text with the SpeechRecognition API*（Edge 本地模型）. https://learn.microsoft.com/en-us/microsoft-edge/web-platform/speech-recognition-api ；以及 Edge 博客 2026-06-02. https://blogs.windows.com/msedgedev/2026/06/02/expanding-on-device-ai-in-microsoft-edge-new-models-and-apis-for-the-web/
- [S10] WebKit 博客, *New WebKit Features in Safari 14.1*. https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/
- [S11] WebKit 源码 `Source/WebCore/Modules/speech/cocoa/WebSpeechRecognizerTask.mm`（第 101–102 行）. https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/speech/cocoa/WebSpeechRecognizerTask.mm
- [S12] Mozilla Wiki, *Web Speech API – Speech Recognition*（最后编辑 2022-01-04）. https://wiki.mozilla.org/Web_Speech_API_-_Speech_Recognition
- [S13] Apple, *macOS Feature Availability*（Dictation / On-Device Dictation）. https://www.apple.com/macos/feature-availability/
- [S14] Apple, *iOS Feature Availability*（Dictation / On-Device Dictation）. https://www.apple.com/ios/feature-availability/
- [S15] Microsoft Support, *Use voice typing to talk instead of type on your PC*. https://support.microsoft.com/en-us/windows/use-voice-typing-to-talk-instead-of-type-on-your-pc-fec94565-c4bd-329d-e59a-af033fa5689f
- [S16] AWS, *Amazon Transcribe – Supported languages*. https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html
- [S17] Bundesgesetz über den Datenschutz (DSG), SR 235.1，第 5、6、16、19、22 条. https://www.fedlex.admin.ch/eli/cc/2022/491/de
- [S18] Schweizerisches Zivilgesetzbuch, SR 210，第 16、19、19c 条. https://www.fedlex.admin.ch/eli/cc/24/233_245_233/de
- [S19] Regulation (EU) 2016/679 (GDPR)，第 3(2)、4(14)、8(1)、9(1) 条，Recital 38、51. https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679
- [S20] EDPB, *Guidelines 02/2021 on virtual voice assistants*, Version 2.0（2021-07-07）. https://www.edpb.europa.eu/system/files/2021-07/edpb_guidelines_202102_on_vva_v2.0_adopted_en.pdf
- [S21] Apple, *App Store Review Guidelines* 2.5.6. https://developer.apple.com/app-store/review/guidelines/
- [S22] CJEU, C-40/17 *Fashion ID*, 判决主文第 2 点. https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62017CJ0040
- [S23] Apple Support, *Mac User Guide – Use Dictation*. https://support.apple.com/guide/mac-help/use-dictation-mh40584/mac
- [S24] Apple, *Siri, Dictation & Privacy*. https://www.apple.com/legal/privacy/data/en/ask-siri-dictation/
- [S25] Gboard Help, *Type with your voice*. https://support.google.com/gboard/answer/2781851
- [S26] AWS General Reference, *Amazon Transcribe endpoints and quotas*. https://docs.aws.amazon.com/general/latest/gr/transcribe.html
- [S27] AWS Price List API, Transcribe `eu-central-2`. https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/transcribe/current/eu-central-2/index.json
- [S28] AWS, *Amazon Transcribe Pricing*. https://aws.amazon.com/transcribe/pricing/
- [S29] AWS Organizations, *AI services opt-out policies*. https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html
- [S30] Hyeon et al., *MathSpeech: Leveraging Small LMs for Accurate Conversion in Mathematical Speech-to-Formula*, arXiv 2412.15655. https://arxiv.org/abs/2412.15655
- [S31] *Speech-to-LaTeX: New Models and Datasets for Converting Spoken Equations and Sentences*, arXiv 2508.03542. https://arxiv.org/abs/2508.03542
- [S32] Okur et al., *Inspecting Spoken Language Understanding from Kids for Basic Math Learning at Home*, BEA@ACL 2023, arXiv 2306.00482. https://arxiv.org/abs/2306.00482
