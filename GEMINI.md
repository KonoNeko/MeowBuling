# Gemini API 诊断

软件的解读与 Agent 已统一使用 Gemini。以下为独立连通性测试。软件模型通过 AGENT_GEMINI_MODEL 设置，默认 gemini-3-flash-preview。

在项目根目录创建 `.env.local`（已被 Git 忽略），填写自己的 Key：

```dotenv
GEMINI_API_KEY=填写你的Key
GEMINI_MODEL=gemini-2.5-flash
```

Windows 执行 `npm run test:gemini`。脚本读取当前代理环境变量，或已开启的 Windows 系统 HTTP 代理，
并为 Node 显式启用代理。代理仅应用于测试进程；不会修改系统设置。
无需 Key 的网络检查：`npm run test:gemini -- --check-network`。

测试使用 Node 内置 fetch，不依赖 `@google/genai`。缺少 Key 会直接提示；HTTP 400/401/403、
模型 404、额度 429、网络超时会分别显示原因。网络可达不代表 Key 或模型可用。
如果模型返回 404，请将 GEMINI_MODEL 改为自己账号可用的模型。

参考：[Google Gemini API](https://ai.google.dev/api)。
