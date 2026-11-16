# 语音提问由后端用 Bedrock 上的 Voxtral 转写

2026-11-16，用户决定：系统听写的效果太差，改用 AI 模型转写，取代 [ADR 0005：语音提问只靠系统自带听写](0005-voice-questions-use-system-dictation.md)。提问框里的麦克风不再只是说明怎么用系统听写，而是由 STOA 自己录音：点一下开始，再点一下结束，整段录音上传到后端；后端在内存里交给 Amazon Bedrock 上的 Mistral Voxtral Small（`mistral.voxtral-small-24b-2507`，爱尔兰 eu-west-1 单区调用）转成文字，只返回文字；文字填进提问框，学生改过再自己发送，**不自动发出**。录音不落盘、不写日志、转完即丢。

这推翻了 ADR 0005 的前提「录音完全不经过 STOA」。新增的义务由本 ADR 承担：录音只用于当次转写；处理方仍只有 AWS，处理地点在 ADR-010（stoa-docs）允许的欧盟区域之内；家长同意和隐私说明要在上线前补上（见下文 Consequences）。

## 实测（2026-11-16）

用 Amazon Polly 合成的德语、法语、意大利语数学提问各一段，经 Bedrock Converse API 的 `audio` 内容块发送，提示词要求「原样转写、不翻译」：

- **Voxtral Small 24B**：三段都对，每段约 1 秒。德语「x hoch zwei plus drei x gleich null」写成了「x² + 3x = 0」。
- **Voxtral Mini 3B**：不转写，直接回答问题（意大利语那段还答成了西班牙语）。不能用。
- 提示词不写「不翻译」时，Small 把法语翻成了英语。

合成语音是清晰的标准语。孩子的声音、瑞士德语方言、背景噪音都没有测过。

## Considered Options

- **保留系统听写**（ADR 0005）：效果太差，用户否决。
- **浏览器自带的 `SpeechRecognition`**：录音送到 Google、微软或 Apple，STOA 无法与它们签处理协议；Firefox 不支持。理由同 ADR 0005，仍然否决。
- **浏览器本机跑 Whisper**（WebGPU / WASM）：录音不出设备，不新增义务；但首次要下载约 80–250 MB 模型，旧设备慢。用户选了后端转写，否决。
- **AWS Transcribe**（苏黎世有端点）：只有 de-CH，没有 fr-CH / it-CH；只出原文，不会把口述的式子写成数学符号。否决。
- **Bedrock 上的 Amazon Nova 2 Sonic**（欧盟只在斯德哥尔摩）：为语音对话设计，只有双向流式接口，会用语音回话；当转写用很别扭。否决。
- **Bedrock 上的 Nova 2 Omni**：还在预览，要单独申请，没有欧盟路由说明。暂不考虑。
- **OpenAI 的 gpt-4o-transcribe，开欧洲数据驻留**（欧洲经济区和瑞士）：效果可能最好，但要新增一家处理方（处理协议、零留存审批、只能新建项目），并修订 ADR-010。否决；Voxtral 不够用时再评估。
- **Azure OpenAI**：瑞士北区只有旧版 Whisper，2026-12-15 退役；gpt-4o-transcribe 只在法国中部、瑞典中部，且预计 2027 年 2 月退役。同样新增处理方。否决。

## Consequences

- **苏黎世没有能听音频的 Bedrock 模型**，转写在爱尔兰处理。ADR-010 的欧盟区域列表里有爱尔兰，但它只写了 Claude 推理配置和 Rekognition 两项；要在 stoa-docs 里补一条「Voxtral 单区调用 eu-west-1，只发送录音」。AI services opt-out 和 Bedrock 不留存的前提同样适用。
- **家长同意**：孩子的录音是个人数据（nDSG；欧盟用户适用 GDPR 第 8 条，16 岁以下要家长同意）。2026-11-16 用户决定：家长端为每个孩子提供开关「允许语音提问」，**默认关闭**；只有已关联的家长能打开，后端记录谁在何时打开或关闭，作为同意的凭据，家长可以随时关闭。开关没打开（包括没有关联家长的学生）时，后端拒绝转写，麦克风退回 ADR 0005 的系统听写说明。
- **隐私说明**改写：从「语音由你设备的系统处理，STOA 只收到文字」改为写明录音会传到 STOA、在爱尔兰由 AWS 转写、转完即删、不用于训练。
- 实施：stoasystem/stoa-backend#469（后端转写接口）、#697（提问框麦克风）。
- **术语**：CONTEXT 里的「系统听写」降为退路，新增「语音提问」。
- 后端要把转写做成可替换的一层，以后换模型或换处理方只改这一层。
- Voxtral 在部分区域被报告过拒收音频（aws-samples/sample-per-model-bedrock#519，伦敦 eu-west-2）；上线后的监控要能发现「模型不支持音频」这类错误。
- 上线前要用真人录音（孩子、瑞士德语、有噪音）再测一次；方言不行时，再评估 OpenAI 欧洲驻留。
