# 第二轮验证 · 2026-09-18

本记录仅适用于第二轮五种新构图。第一轮记录留在 ../login-candidates-v1/QA.md。

- `node --check design/login-candidates/concept.js`：通过。
- `npm run lint`：通过，零警告。
- 5 案 × 1120 / 768 / 390 / 320px × DE / EN / FR / IT：80 组布局检查通过。检查文档横向溢出，以及输入框、提交按钮、注册文案、h1/h2 的边界和内部文本溢出。
- 第一轮本次检查发现 05 的英文 understanding 长词超出标题容器；扩大标题容器并调整字号后，最终重跑 80 组无失败。
- 五案分别保存并查看 1120×760 桌面、390×844 手机截图，确认独立构图和手机端视觉特征。文件：v2-01-desktop.png 至 v2-05-desktop.png，v2-01-mobile.png 至 v2-05-mobile.png；总览 v2-overview.png。
- 五案均验证：空表单无效；虚构输入后密码显示正常；submit 进入 disabled 等待；随后恢复 enabled 且状态为 “Preview complete. No data was sent.”。
- 浏览器错误列表为空。没有运行真实登录或其他后端请求。
- 图片使用现有仓库素材；没有新增依赖或外部字体下载。其他视觉使用 CSS 与文字；含 focus-visible、aria-live、aria-pressed 和 reduced-motion 规则。

边界：这是设计原型检查，不是完整可访问性审计或认证端到端测试。装饰性英文图注未随语言切换；正式落地需进行翻译审校并复用正式表单逻辑。未修改应用源码或构建入口，因此本轮未跑应用 build 和全套业务测试。
