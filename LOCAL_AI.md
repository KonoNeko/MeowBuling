# GPT 与补充知识库

解读、快速单抽和喵灵助手统一使用 GPT-5.5。已移除 Ollama 调用与启动依赖。

## 启动

Node.js 24，首次执行 npm install，然后双击「启动喵卜灵.cmd」。
在 .env.local 设置 OPENAI_API_KEY；密钥仅由服务器读取，不会打包给浏览器。
GPT 请求使用 HTTPS_PROXY，或 Windows 已开启的 HTTP 系统代理。

## 使用

主页输入问题可快速单抽，默认犀利喵评，可切换温柔指引，结果自动保存到历史。
每张牌结合位置、正逆位与问题展开解读；整组牌补充综合分析、走向及行动步骤。
喵灵助手支持连续追问、牌意查询与牌阵推荐。
知识库仅作补充参考，不限制 GPT 运用其知识独立分析。
支持导入 UTF-8 TXT / Markdown 和粘贴笔记，保存后即可关键词检索，无需向量模型。

## 数据

知识库保存在用户目录 .meowbuling/documents.json；对话与历史保存在浏览器。
提问、当前解读背景及相关资料片段会发给 GPT，其他资料不会整体上传。
旧 vectors.json 及已下载的 Ollama 模型不再使用，未自动删除用户磁盘文件。

## 验证

npm run typecheck、npm test、npm run build。
