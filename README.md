# 喵卜灵 MeowBuling - 本地 AI 塔罗牌应用

> 当前版本使用 GPT，支持补充知识库、快速单抽与喵灵 Agent。
> 双击 `启动喵卜灵.cmd` 启动；模型准备、资料导入及数据位置见 [LOCAL_AI.md](./LOCAL_AI.md)。

<div align="center">
<img width="1200" height="475" alt="喵卜灵应用截图" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 📖 项目简介

喵卜灵是一款基于人工智能的塔罗牌占卜应用，结合了传统的塔罗牌智慧与现代 AI 技术，为用户提供个性化的塔罗牌解读体验。应用采用 React + TypeScript + Vite 构建，支持多种牌阵选择和智能解读。

## ✨ 主要功能

### 🃏 智能塔罗牌解读
- 支持多种经典塔罗牌阵型（单牌、三牌、凯尔特十字等）
- 使用 GPT-5.5 生成详细解读，知识库仅作补充参考
- 实时生成针对您问题的详细解读

### 🎯 主题选择
- 提供多种占卜主题：爱情、事业、健康、财富等
- 根据主题智能推荐适合的牌阵

### 📚 牌阵库
- 内置多种经典塔罗牌阵
- 支持标签筛选，快速找到心仪的牌阵
- 牌阵预览功能

### 🎴 卡牌展示
- 精美的卡牌视觉效果
- 支持卡牌详细信息查看
- 流畅的拖拽滚动体验

### 📝 解读历史
- 保存所有占卜记录
- 支持添加个人反思和笔记
- 历史记录管理

### 🌙 沉浸式体验
- 玻璃拟态设计风格
- 流畅的动画效果
- 响应式设计，支持移动端

## 🚀 快速开始

### 环境要求
- Node.js 24（已验证开发启动和包含本地牌图的生产构建）

塔罗牌图片随项目保存在 `public/images/tarot`，无需访问外部图片站点。
本机 Node.js 25.2.1 在构建复制图片时出现过异常退出；如遇同样问题，请使用 Node.js 24。

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/KonoNeko/MeowBuling.git
   cd MeowBuling
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 GPT**
   在 `.env.local` 中设置 `OPENAI_API_KEY`，可用 `OPENAI_MODEL` 调整模型。
   默认使用已验证可访问的 `gpt-5.5`，无需安装本地模型。

4. **启动应用**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 `http://localhost:5173`

## 📱 使用指南

### 开始占卜
1. 在首页选择您想要占卜的主题
2. 选择合适的牌阵类型
3. 输入您的问题或关注点
4. 点击"开始抽牌"进入抽牌流程
5. 等待 AI 生成个性化解读

### 查看历史
- 在历史页面查看所有过往占卜记录
- 点击记录查看详细解读
- 可以添加个人反思

## 🛠️ 技术栈

- **前端框架**: React 18
- **开发工具**: Vite
- **编程语言**: TypeScript
- **AI 服务**: GPT + AI SDK ToolLoopAgent
- **本地 RAG**: EmbeddingGemma 向量 + 中文 BM25 混合检索
- **样式**: CSS Modules + 玻璃拟态设计
- **运行**: 本地 Node.js 服务

## 📸 功能截图

### 首页 - 主题选择
![首页截图](./screenshots/home.png)
*选择您想要占卜的主题，开启塔罗之旅*

### 牌阵选择
![牌阵选择截图](./screenshots/spreads.png)
*浏览和选择不同的塔罗牌阵*

### 抽牌过程
![抽牌动画](./screenshots/drawing.gif)
*沉浸式的抽牌体验*

### AI 解读结果
![解读结果](./screenshots/reading.png)
*AI 生成的详细塔罗牌解读*

### 历史记录
![历史页面](./screenshots/history.png)
*查看和管理您的占卜历史*

## 🔧 构建和部署

### 本地构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

### 运行本地生产服务
构建后运行 `npm start`，提供静态页面与本地知识库 API。
需要保持本机应用服务运行并连接 GPT。仅部署静态页面无法提供完整功能。
验证命令：`npm run typecheck`、`npm test`。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢 GPT 提供模型能力
- 感谢 React 和 Vite 生态系统
- 感谢所有贡献者和用户

---

**注意**: 请确保遵守当地法律法规，仅将塔罗牌作为娱乐和自我反思工具使用。
