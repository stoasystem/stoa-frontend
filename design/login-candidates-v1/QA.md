# 设计候选验证

2026-09-18，本地独立原型。没有执行真实登录、注册或后端请求。

- `node --check design/login-candidates/concept.js`：通过。
- `npm run lint`：通过，零警告。
- 浏览器布局检查：5 个方向 × 1120 / 768 / 390 / 320px × DE / EN / FR / IT，共 80 组，文档无横向溢出；表单容器宽度均 >= 240px。
- 桌面总览及方案 03 桌面 / 手机视觉检查完成。真实 Logo 与现有学习照片可见；窄屏移除氛围插图，保留登录表单。
- 总览到方案 03、手机切换、独立方案打开正常。
- 方案 01 键盘 Enter 切换密码：type=text、aria-pressed=true；Enter 提交虚构凭据后：按钮 disabled=true、live region 显示等待文案。模拟完成定时器只更新本地 UI，无 fetch/XHR。
- 原生字段约束、标签关联、focus-visible、aria-live、密码切换 aria-pressed 已检查；未宣称完整 WCAG 审计。
- 共享 CSS / 原生语言切换，无第三方字体或动画依赖；reduced-motion 规则存在。

## 工具与证据限制

第一次异步矩阵检查被开发服务器热刷新中断，重新运行同步布局检查后 80 组通过。语言切换会重新创建 img，立即读取 complete 会产生未加载报告，因此没有把同步图片检查当成真实图片缺失。图片通过已保存的实际渲染截图确认；后续单独等待跨 iframe decode 的自动化调用卡住，不计入通过项目。

自动化坐标点击在调整视口后出现偏移；通过 focus + Enter 验证密码显示和提交等待。原型不是端到端认证测试，也未覆盖正式邮箱验证、后端错误与重定向。

正式应用本地启动缺少有效发布配置；线上页面另行只读检查成功。未运行应用 build / API 守卫 / 全套测试，因为本次仅新增独立设计产物，未触及应用源码、接口或构建入口。

总览全页截图遭遇浏览器截图比例异常及空白帧，未作为交付截图；失败截图保留在 /tmp/stoa-login-overview-capture-failed.png。请使用 index.html 的五案总览。可用视觉截图为 current-desktop.png、03-desktop.png、03-mobile.png 和 01-mobile.png。
