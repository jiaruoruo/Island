# 小岛（Twoo 同类 App · 原创 MVP）

> 一只住进"你们之间"的 AI 小章鱼：**2 人 + 1 AI** 的私密三人群聊。
> 基于公开产品形态自研，**不包含任何第三方私有代码或素材**，完全原创实现。

面向情侣 / 闺蜜 / 亲密搭子：两人在同一个小岛里共养一只 AI 小章鱼，它会接梗、破冰、记纪念日/心愿/约定/喜好，提供关系评测、互动游戏、约会攻略，还能换装、布置小窝。

---

## 目录结构

```
make-twoo/
├── README.md                       # 项目说明（本文件）
├── Twoo调研分析.md                  # 市场 / 竞品 / 合规调研报告
├── Twoo_MVP_PRD与架构设计.md         # PRD 与技术架构设计
├── docker-compose.yml               # Postgres + pgvector 一键启动
├── .env.example                     # 环境变量模板（复制为 .env 使用）
├── .gitignore
├── docs/
│   └── 联调与上线指引.md             # 本地联调、部署、上线前检查清单
│
├── server/                          # 后端（Express + TypeScript）
│   ├── src/
│   │   ├── index.ts                 # 入口：装配路由 / WS / 中间件，启动 HTTP 服务
│   │   ├── config.ts                # 环境变量与开关（STORE / MOCK_AI / MOCK_PAY / LLM…）
│   │   ├── types.ts                 # 全局类型（User / Couple / Memory / Friend / FriendRequest…）
│   │   ├── ai/                      # AI 编排层
│   │   │   ├── client.ts            # OpenAI 兼容客户端（Mock 回退）
│   │   │   ├── embed.ts             # 文本向量化（pgvector / Mock）
│   │   │   ├── memory.ts            # 记忆抽取与 RAG 召回、周期摘要压缩
│   │   │   └── prompts.ts           # 系统提示词与「小章鱼」人格设定
│   │   ├── compliance/              # 合规层
│   │   │   ├── identity.ts          # 年龄核验与未成年人模式
│   │   │   └── moderate.ts          # 文本审核（预留接口位）
│   │   ├── middleware/
│   │   │   └── auth.ts              # Bearer Token 鉴权中间件
│   │   ├── routes/                  # 业务路由（统一以 /api 为前缀）
│   │   │   ├── auth.ts              # 登录：微信登录 / 手机号验证码登录
│   │   │   ├── couple.ts            # 小岛：建岛 / 列表 / 8 位邀请码加入
│   │   │   ├── chat.ts              # 群聊消息：历史 / 发送(触发AI) / 记忆写入
│   │   │   ├── memory.ts            # 共享记忆：列表 / 新增 / 语义检索 / 删除(双人确认)
│   │   │   ├── quiz.ts              # 关系评测：出题 / 答题 / 报告
│   │   │   ├── game.ts              # 互动游戏：话题盲盒 / 真心话
│   │   │   ├── planner.ts           # 约会攻略生成
│   │   │   ├── subscription.ts      # 会员 / 订阅（Mock 支付）
│   │   │   ├── user.ts              # 用户：我的信息 / 搜索（小岛号 / 手机号）
│   │   │   ├── friend.ts            # 好友：申请 / 通过 / 拒绝 / 列表
│   │   │   └── helpers.ts           # 路由通用工具（错误与分页）
│   │   ├── services/
│   │   │   ├── chatService.ts       # 群聊业务编排（含 WS 广播）
│   │   │   └── payment.ts           # 微信支付骨架（接口位）
│   │   ├── store/                   # 数据访问层（可切换实现）
│   │   │   ├── index.ts             # 按 STORE 选择 MemoryStore / PrismaStore
│   │   │   ├── types.ts             # Store 接口定义
│   │   │   ├── memoryStore.ts       # 内存实现（零依赖，Mock 模式默认）
│   │   │   └── prismaStore.ts       # PostgreSQL + pgvector 实现
│   │   ├── ws/
│   │   │   └── chatHub.ts           # WebSocket 三人群聊中心（广播 + 断线重连）
│   │   └── db/
│   │       └── prisma.ts            # Prisma 客户端单例
│   ├── prisma/
│   │   ├── schema.prisma            # 数据模型（User / Couple / Memory / Friend / FriendRequest…）
│   │   └── seed.ts                  # 种子数据（演示用户 A / B）
│   ├── test/
│   │   └── core.test.ts             # 核心逻辑单元测试
│   ├── scripts/
│   │   └── smoke-all.js             # 全功能冒烟测试脚本
│   ├── openapi.yaml                 # API 文档（OpenAPI 3）
│   ├── package.json / package-lock.json
│   └── tsconfig.json
│
└── miniprogram/                     # 微信小程序前端（原生 WXML / WXSS / JS）
    ├── app.js / app.json / app.wxss  # 全局逻辑 / 页面与窗口配置 / 全局样式
    ├── project.config.json           # 开发者工具项目配置
    ├── sitemap.json
    ├── utils/
    │   ├── request.js                # 封装 wx.request（自动带 Token、401 跳登录）
    │   └── ws.js                     # WebSocket 连接与重连
    ├── components/                   # 自定义组件（每组件 4 件套 .js/.json/.wxml/.wxss）
    │   ├── octopus/                  # 小章鱼形象（canvas 绘制，可换色）
    │   ├── bubble/                   # 消息气泡
    │   └── tabbar/                   # 底部导航栏（小岛 / 消息 / 任务 / 我的）
    └── pages/                        # 页面（每页 4 件套 .js/.json/.wxml/.wxss）
        ├── welcome/                  # 登录：微信 / 手机号验证码、隐私协议、年龄确认
        ├── island/                   # 我的小岛：列表、建岛、加入、顶部栏 + 底部导航
        ├── chat/                     # 三人群聊：消息流、AI 回复、实时推送
        ├── memory/                   # 共享记忆：时间线、检索、删除（双人确认）
        ├── quiz/                     # 关系评测：答题与报告
        ├── game/                     # 互动游戏：话题盲盒 / 真心话
        ├── closet/                   # 换装：小章鱼皮肤（本地存储）
        ├── home/                     # 小窝：桌面摆件（本地存储）
        ├── task/                     # 共同任务：待办清单（本地存储）
        ├── friend/                   # 添加好友：搜索 / 申请 / 通过 / 二维码 / 扫一扫
        └── profile/                  # 我的：会员、设置、退出登录
```

> 前端每个 `page` / `component` 均为 4 件套（`.js` 逻辑、`.json` 配置、`.wxml` 结构、`.wxss` 样式）。
> 后端 `STORE=memory` 时使用内存存储（默认、零依赖），`STORE=prisma` 时使用 PostgreSQL + pgvector。

---

## 一、快速开始（零依赖 · Mock 模式）

后端内置 **内存存储 + LLM Mock**，无需数据库、无需大模型密钥即可端到端跑通核心闭环。

### 1. 启动后端

```bash
cd server
npm install
npm run dev
```

默认监听 `http://localhost:3000`，健康检查：`GET /api/health`。

### 2. 打开小程序

1. 用**微信开发者工具**导入 `miniprogram/` 目录（AppID 可先用 `touristappid`，或替换为你的 AppID）。
2. 在开发者工具「详情 → 本地设置」勾选 **不校验合法域名**（本地 `localhost` 需要）。
3. 编译预览，即可体验：欢迎登岛 → 建岛 → 三人群聊 → 共享记忆 → 评测/游戏/换装/小窝/会员。

---

## 二、端到端验证（核心闭环）

启动后端后，可用 curl 快速验证：

```bash
# 1. 登录（A）
curl -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"code":"a","nickname":"A","adult":true}'
# → {"token":"<userIdA>","user":{...}}

# 2. 建岛（A）
curl -X POST localhost:3000/api/couples -H "Authorization: Bearer <userIdA>" \
  -H "Content-Type: application/json" -d '{"name":"我们的小岛","persona":"sweet"}'
# → {"couple":{"id":"<coupleId>",...},"inviteCode":"<8位数字邀请码>"}

# 3. 发消息触发 AI（A）
curl -X POST localhost:3000/api/chat/<coupleId>/messages \
  -H "Authorization: Bearer <userIdA>" -H "Content-Type: application/json" \
  -d '{"text":"下个月是我们的周年纪念日"}'
# → 返回 userMessage + octopusMessage + memoryWrites（自动抽取「纪念日」记忆）

# 4. 第二人登录并加入（B）
curl -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"code":"b","nickname":"B","adult":true}'   # → <userIdB>
curl -X POST localhost:3000/api/couples/<邀请码>/join \
  -H "Authorization: Bearer <userIdB>"

# 5. 查看共享记忆
curl localhost:3000/api/memory/<coupleId> -H "Authorization: Bearer <userIdA>"
```

---

## 三、切换到 PostgreSQL + 真实大模型

### 1. 启动数据库

```bash
docker compose up -d
```

### 2. 配置环境

```bash
cp .env.example .env   # 然后编辑
```

修改 `.env`：

```ini
STORE=prisma
MOCK_AI=false
LLM_BASE_URL=https://api.openai.com/v1   # 或豆包/混元/通义/Kimi 的 OpenAI 兼容端点
LLM_API_KEY=你的密钥
LLM_MODEL=gpt-4o-mini
```

### 3. 迁移并启动

```bash
cd server
npm run prisma:generate
npm run db:migrate
npm run dev
```

---

## 四、合规说明（重要）

- 本产品定位"双人关系工具"，**不向未成年人提供 AI 亲密互动与付费服务**：欢迎页强制年龄确认，未成年人进入**未成年人模式**（`minorMode`）。
- 微信登录、真实实名核验、文本内容审核、微信支付均预留接口位，MVP 默认 Mock。
- 共享记忆需双方授权，删除共同记忆需双人确认；支持解散小岛并删除数据。

> 上线前请务必完成：真实实名年龄核验、文本审核接入、微信支付商户配置，并遵循《人工智能拟人化互动服务管理暂行办法》相关要求。

---

## 五、API 概览（均需 `Authorization: Bearer <userId>`）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 微信登录（Mock/微信 code2Session） |
| POST | `/api/auth/send-code` | 发送手机验证码（Mock 返回 devCode） |
| POST | `/api/auth/login-by-phone` | 手机号验证码登录 |
| POST | `/api/couples` | 建岛 |
| GET | `/api/couples` | 我的小岛列表 |
| POST | `/api/couples/:id/join` | 受邀加入 |
| GET/POST | `/api/chat/:coupleId/messages` | 历史 / 发消息(触发AI) |
| GET/POST | `/api/memory/:coupleId` | 记忆列表 / 新增 |
| POST | `/api/memory/:coupleId/search` | 语义检索 |
| DELETE | `/api/memory/:coupleId/:id` | 删除(双人确认) |
| POST/GET | `/api/quiz/:coupleId` ... | 评测 / 答题 / 报告 |
| POST | `/api/game/:coupleId/topic|truth` | 话题盲盒 / 真心话 |
| POST | `/api/planner/:coupleId/plan` | 约会攻略 |
| GET/POST | `/api/subscription/:coupleId` ... | 会员 / 订阅(Mock) |
| WS | `/ws?coupleId=&userId=` | 三人群聊实时推送 |

---

## 六、技术栈

- 前端：微信小程序原生（WXML/WXSS/JS）
- 后端：Node.js + Express + TypeScript
- 实时：`ws`（WebSocket 三人群播 + 断线重连）
- 存储：内存（Mock）/ PostgreSQL + pgvector（Prisma）
- AI：OpenAI 兼容客户端（Mock 回退）· 向量记忆召回 RAG · 周期摘要压缩

---

*本项目仅用于产品验证与学习，AI 生成内容仅供娱乐，请理性对待。*
