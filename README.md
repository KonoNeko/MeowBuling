# 喵卜灵 MeowBuling

> 一个把塔罗牌、AI 解读和自我反思放在一起的轻量 Web 应用。
> 先选主题与问题，再选牌阵、抽牌，最后获得清晰的牌面分析与可执行建议。

[在线体验](https://www.meowbuling.com/) · [GitHub](https://github.com/KonoNeko/MeowBuling)

## 产品定位

喵卜灵不是“替你预测命运”的黑盒，而是一个以塔罗为媒介的自我探索工具：

- 用具体问题开始，而不是从泛泛的运势测试开始。
- 用牌阵组织问题，用正位/逆位和位置含义提供分析框架。
- 用 GPT 将牌面信息整理成结论、依据、风险和行动建议。
- 用历史记录与灵魂笔记，帮助用户回看自己的选择与变化。

> 塔罗结果仅供娱乐和自我反思，不替代医疗、法律、投资或其他专业意见。

## User Flow

```text
首页
  ↓
选择主题
  ↓
选择问题（可使用预设问题，也可自定义）
  ↓
选择牌阵（支持主题推荐与分类筛选）
  ↓
抽牌
  ↓
AI 生成本次解读
  ↓
结果页：结论 → 牌阵 → 逐张牌解读 → 分析 → 行动建议
  ↓
围绕本次牌面继续追问 / 写下灵魂笔记
```

## 核心功能

### 1. 主题与问题

支持感情、事业、决策、自我、未来趋势、日常、财富、人际、家庭和灵性等主题。每个主题提供常见问题与相关牌阵，用户也可以直接输入自己的问题。

### 2. 抽牌与牌阵

- 内置 78 张塔罗牌，支持正位与逆位。
- 支持单牌、三牌及多种专题牌阵。
- 牌阵库支持分类、子分类、位置说明和预览。
- 抽牌过程提供拖拽与移动端滚动交互。

### 3. AI 解读

AI 会结合以下信息生成结果：

- 用户问题与主题
- 牌阵及每个位置的含义
- 每张牌的名称、正逆位和牌意
- 卡牌之间的关系
- 当前时间与解读风格（犀利 / 温柔）

结果按“先结论、后依据、再行动”的顺序呈现，包含：

- 核心主题
- 可能走向与条件
- 逐张牌解读
- 关键矛盾、风险和转机
- 可执行行动建议
- 反思问题与个人笔记

### 4. 结果页 AI 对话

结果页的喵卜灵 AI 只围绕当前这次占卜回答，不重新开启无关占卜。推荐追问由当前牌面动态生成，并限制为短句，方便快速点击。

### 5. 牌库与历史

- 牌库支持预览图与高清图渐进加载，适合手机网络。
- 历史记录保存在浏览器本地。
- 每次占卜可添加个人反思，便于长期回看。

### 6. 本地知识库

可导入 `.txt` 和 `.md` 资料作为 AI 的补充参考。资料保存在本机数据目录，知识检索不会改变系统规则，也不会替代牌面与当前问题。

## 技术架构

```text
React + TypeScript + Vite
        │
        ├── 前端 UI
        │   ├── 首页 / 主题 / 问题 / 牌阵 / 抽牌 / 结果
        │   ├── 牌库 / 牌阵库 / 历史记录
        │   └── 结果页 AI 对话
        │
        ├── API 层
        │   ├── /api/interpret 生成塔罗解读
        │   ├── /api/agent 结果页 AI 对话
        │   └── /api/knowledge/* 知识库管理与检索
        │
        ├── AI 层
        │   ├── AI SDK ToolLoopAgent
        │   ├── OpenAI Responses API
        │   ├── Zod 输入 / 输出校验
        │   └── 牌意、牌阵和本地资料工具
        │
        └── 数据层
            ├── constants.ts：牌库、牌阵、主题
            ├── localStorage：历史与对话
            └── 本机 documents.json：导入资料
```

### 关键模块

| 模块 | 作用 |
| --- | --- |
| `App.tsx` | 页面状态、用户流程、抽牌与结果页 |
| `components.tsx` | 通用 UI、牌面展示、牌阵布局和导航 |
| `constants.ts` | 78 张牌、主题、牌阵及分类数据 |
| `question-presets.ts` | 主题与牌阵的默认问题 |
| `LocalAssistant.tsx` | 结果页 AI 对话、本地资料管理 |
| `server/agent.ts` | AI 解读、工具调用、上下文约束和输出校验 |
| `server/knowledge.ts` | 本地资料切分、索引和关键词检索 |
| `server/api.ts` | 本地 API 路由与请求校验 |
| `api/[...path].ts` | Vercel Serverless API 入口 |

## 本地运行

### 环境要求

- Node.js 24（推荐）
- OpenAI API Key

Node.js 25 在部分 Windows 环境下可能导致 Vite 构建异常；遇到构建退出码问题时，优先切换 Node.js 24。

### 安装与配置

```bash
git clone https://github.com/KonoNeko/MeowBuling.git
cd MeowBuling
npm install
```

在项目根目录创建 `.env.local`：

```dotenv
OPENAI_API_KEY=你的_API_Key
OPENAI_MODEL=gpt-5.5
```

`.env.local` 已被 Git 忽略，禁止提交到仓库。

### 启动开发环境

```bash
npm run dev
```

访问 `http://localhost:5173`。

也可以在 Windows 双击：

```text
启动喵卜灵.cmd
```

### 生产构建

```bash
npm run build
npm start
```

生产服务会同时提供构建后的静态页面和 `/api/*` 接口。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建前端生产文件 |
| `npm run preview` | 预览 Vite 构建结果 |
| `npm start` | 启动静态文件与 API 服务 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 运行服务端测试 |
| `npm run test:gemini` | 检查 Gemini 独立连通性 |

## 部署

项目支持 Vercel 部署：

1. 将 `OPENAI_API_KEY` 配置到 Vercel 的 Development、Preview 和 Production 环境。
2. 推送到 GitHub `main`，或执行：

```bash
npx vercel deploy --prod --yes
```

Vercel 使用 `api/[...path].ts` 处理 API。Serverless 文件系统不可作为持久数据库，因此线上临时数据目录使用 `/tmp/meowbuling`；重要数据应放在正式持久化服务中。

## 安全与隐私

- 不要把 API Key 写入源代码、README、截图或 Git 历史。
- `.env.local`、`.env*` 和 `.vercel` 已加入 `.gitignore`。
- 历史记录和对话默认保存在浏览器本地。
- 导入资料默认保存在本机数据目录。
- AI 输入包含当前问题、牌面和必要的对话上下文，请在导入资料前确认内容适合发送给所配置的模型服务。

## 开发与贡献

提交修改前建议运行：

```bash
npm run typecheck
npm test
```

贡献流程：

1. Fork 仓库并创建功能分支。
2. 保持修改聚焦，并补充必要测试。
3. 运行类型检查与测试。
4. 提交 Pull Request，说明用户体验或技术行为的变化。

## 许可证

仓库当前未包含独立的 `LICENSE` 文件。若要公开分发或二次开发，建议先补充明确的开源许可证。
