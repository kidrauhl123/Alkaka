# AI-first Chat UI 重构计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 把 Alkaka 主窗口从“桌宠辅助面板 / 任务后台”重构为 AI-first 聊天软件：用户可以和单个 AI 伙伴单聊，也可以把多个 AI 伙伴拉进项目组；桌宠作为桌面化身和“营地入口”负责陪伴、提醒和快速唤起。

**Architecture:** 保留 Electron + React + OpenClaw/Cowork 的现有运行链路，先重塑 renderer 信息架构和文案，再逐步把 Agent/Skill 产品模型从“提示词 + 手动 skill 勾选”改成“AI 伙伴 + 自动 skill routing + 权限边界”。全展开 UI 采用三栏布局：左侧聊天软件导航，中间对话流，右侧可折叠工作台。

**Tech Stack:** Electron main/preload IPC、React renderer、Redux cowork state、SQLite cowork/agent tables、OpenClaw runtime、Vitest。

---

## 设计原则

1. **聊天软件优先**：主窗口默认像 AI 伙伴聊天软件，不再像任务后台。
2. **桌宠是化身 / 营地入口**：桌宠常驻桌面，负责陪伴、提醒、快速对话；复杂协作回到聊天工作台。
3. **全展开不等于默认重**：用户需要时展开项目组工作台；轻量场景只保留会话列表 + 聊天流。
4. **Agent 叫 AI 伙伴**：普通用户看到的是伙伴、角色、擅长什么；高级设置再暴露模型、prompt、工具权限。
5. **Skill 退到后台**：skill 是能力包，不是普通用户要手动勾选的插件；由 Agent 自动判断使用，受权限策略约束。
6. **卡片化执行过程**：复杂工作在对话里以目标卡、拆解卡、日志卡、交付物卡呈现，避免纯文本刷屏。
7. **保持桌宠体验不回退**：真实像素命中、单击不弹、双击 quick input、展开不挪位必须保留。

## 目标信息架构

```text
Alkaka Chat
├─ 左侧：聊天导航
│  ├─ 新建对话
│  ├─ 搜索
│  ├─ 对话
│  ├─ AI 伙伴
│  ├─ 项目组
│  └─ 设置
├─ 中间：对话流
│  ├─ 单聊：你 ↔ AI 伙伴
│  ├─ 项目组：你 + 多个 AI 伙伴
│  ├─ 置顶目标
│  ├─ 执行卡片
│  └─ 输入框：@伙伴 / 文件 / 指令 / 更多
├─ 右侧：可折叠工作台
│  ├─ 伙伴状态
│  ├─ 当前目标
│  ├─ 交付物
│  ├─ 文件 / 知识库
│  └─ 执行日志
└─ 桌宠：桌面营地入口
   ├─ 快速对话
   ├─ 进展提醒
   ├─ 回到项目组
   └─ 后续：多个宠物聚一起的营地感
```

## Task 1: 建立聊天软件导航文案与轻量信息架构

**Objective:** 把主窗口第一层语义从“任务 / Cowork / 后台”改成“对话 / AI 伙伴 / 项目组”。

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/components/cowork/CoworkView.tsx`
- Modify: `src/renderer/components/cowork/CoworkSessionList.tsx`
- Modify: `src/renderer/components/cowork/mainWindowLiteNav.ts`
- Test: `src/renderer/components/cowork/mainWindowLiteNav.test.ts`

**Steps:**
1. 在测试里锁定新导航语义：`对话`、`AI 伙伴`、`项目组`、`设置`。
2. 删除或降级默认可见的“任务中心 / 项目空间 / 复杂 Cowork”表述。
3. 搜索仍保留，但作为聊天软件搜索，不再叫“搜索任务”。
4. 运行：

```bash
npx vitest run src/renderer/components/cowork/mainWindowLiteNav.test.ts
```

## Task 2: 设计项目组全展开工作台壳层

**Objective:** 为用户发来的概念图建立可折叠三栏结构，但默认保持轻量。

**Files:**
- Create: `src/renderer/components/chat/ChatWorkspaceShell.tsx`
- Create: `src/renderer/components/chat/chatWorkspaceLayout.ts`
- Create: `src/renderer/components/chat/chatWorkspaceLayout.test.ts`
- Modify: `src/renderer/components/cowork/CoworkView.tsx`

**Steps:**
1. 先写纯函数测试：普通单聊默认不展开右侧；项目组 / 深度处理可展开右侧。
2. 新建 `ChatWorkspaceShell`，提供 slots：leftNav、conversation、workbench。
3. 右侧 workbench 支持 collapsed / expanded。
4. 先接入静态结构，不改变 Cowork 数据流。
5. 运行：

```bash
npx vitest run src/renderer/components/chat/chatWorkspaceLayout.test.ts
```

## Task 3: 把 Agent UI 重命名为 AI 伙伴

**Objective:** 普通用户界面不再把 Agent 呈现成技术配置，而是 AI 伙伴。

**Files:**
- Modify: `src/renderer/services/agent.ts`
- Modify: `src/renderer/types/agent.ts`
- Modify: Agent 相关 React 组件（通过 `search_files("Agent|智能体|我的 Agent")` 定位）
- Test: 现有 agent/service tests，如不存在则新增轻量文案/mapper test。

**Steps:**
1. 保留底层数据库字段 `agents` / `skill_ids`，避免迁移风险。
2. UI 层把 `Agent` 展示为 `AI 伙伴`。
3. 高级配置入口保留 system prompt / model / skill 限制，但默认折叠。
4. 文案从“选择可用 skill”改成“能力边界 / 权限限制”。
5. 运行相关 targeted tests 和 TypeScript compile。

## Task 4: Skill 选择降级为高级权限边界

**Objective:** 不再让普通用户手动给 Agent 勾选 skill；skill 作为共享能力池，AI 自动选择。

**Files:**
- Modify: `src/renderer/services/agent.ts`
- Modify: Agent 设置组件
- Modify: `src/main/libs/openclawAgentModels.ts`
- Test: Agent model / skill ids 相关测试

**Steps:**
1. 保留 `skillIds` 数据结构，短期作为兼容和高级限制。
2. 默认 UI 不展示 skill 勾选列表。
3. 高级设置里说明：这是“最多允许使用的能力边界”，不是普通使用前必须选择的插件。
4. README 和 UI 文案保持一致：skill = 能力包；Agent = 组织能力完成目标的 AI 伙伴。

## Task 5: 聊天流执行卡片化

**Objective:** 为项目组里的复杂工作建立卡片表达：目标、拆解、执行、日志、交付物。

**Files:**
- Create: `src/renderer/components/chat/cards/GoalCard.tsx`
- Create: `src/renderer/components/chat/cards/AgentAssignmentCard.tsx`
- Create: `src/renderer/components/chat/cards/ExecutionLogCard.tsx`
- Create: `src/renderer/components/chat/cards/DeliverableCard.tsx`
- Modify: `src/renderer/components/cowork/CoworkSessionDetail.tsx`

**Steps:**
1. 先只做 renderer 展示组件，不改 OpenClaw 协议。
2. 通过 message metadata 判断卡片类型；没有 metadata 时仍显示普通 markdown。
3. 思考过程 / 日志默认折叠。
4. 增加 Story-like demo 或测试，确认卡片不会破坏普通消息。

## Task 6: 桌宠联动“营地”概念

**Objective:** 保持当前桌宠交互稳定，同时把桌宠解释为 AI 伙伴聊天软件的桌面化身和营地入口。

**Files:**
- Modify: `src/renderer/components/pet/PetView.tsx`
- Modify: `src/main/petContextMenu.ts`
- Modify: `src/renderer/components/pet/petTaskJump.ts`
- Test: `src/renderer/components/pet/petInteraction.test.ts`
- Test: `src/main/petContextMenu.test.ts`

**Steps:**
1. 右键菜单保留 `对话`、`进入主窗口`，后续可改成 `进入营地` 但不要急于替换所有文案。
2. 桌宠提醒文案指向“回到对话 / 回到项目组”，避免“任务后台”。
3. 不改变真实像素命中和 quick input 尺寸/锚点。
4. 运行桌宠 targeted tests。

## Task 7: 端到端验证与文档更新

### Checkpoint 2026-04-30: 首页最近对话与主对话区接入真实 Cowork sessions

- `AlkakaProjectChatHome` 新增 `buildRecentConversationItems()`，把真实 `CoworkSessionSummary[]` 映射到左栏最近对话，保留 pinned、未读、当前会话高亮和相对更新时间。
- `AlkakaProjectChatHome` 新增 `buildProjectGroupPreview()`，把同一组真实 sessions 映射为中间主聊天区的项目组/会话预览：标题、`OpenClaw 会话预览`、创建时间、状态 pill、置顶对话和最近更新时间都来自真实 session summary；没有真实 sessions 时才回退 AI 日报项目组示例。
- `CoworkView` 无当前 session 的首页会把 Redux 中的 `sessions`、`unreadSessionIds`、`currentSessionId` 传入 `AlkakaProjectChatHome`；真实会话行点击后调用 `coworkService.loadSession(sessionId)` 打开对应 Cowork session，首页 composer 仍沿用 `handleStartSession(message)`，继续进入真实 Cowork/OpenClaw session。
- Verified: `npx vitest run src/renderer/components/chat/AlkakaProjectChatHome.test.ts`、桌宠 4 个回归测试、`npm run compile:electron -- --pretty false`、`npm run build`、`git diff --check` passed。

**Objective:** 确认聊天软件方向的 UI 重构没有破坏 Electron/OpenClaw runtime 和桌宠基础交互。

**Files:**
- Modify: `README.md`
- Modify: `docs/desktop-pet-plan.md`
- Update: this plan with checkpoint result

**Verification:**

```bash
npx vitest run \
  src/renderer/components/cowork/mainWindowLiteNav.test.ts \
  src/renderer/components/pet/petInteraction.test.ts \
  src/main/petContextMenu.test.ts \
  src/main/petWindow.test.ts

npm run compile:electron -- --pretty false
npm run build
git diff --check
npm run electron:dev:openclaw
curl -fsS http://127.0.0.1:18789/health
```

Expected health response:

```json
{"ok":true,"status":"live"}
```

## Implementation checkpoints

### 2026-04-29 23:40 CST — 默认伙伴头像接入与主窗口高级感优化 checkpoint

- 在 `AlkakaProjectChatHome` 中接入 6 个生成式默认伙伴头像资产：小课代表、情报姬、CodeMan、设计喵、数据君、审核官。
- 新增资源目录 `src/renderer/assets/partners/`，将原始生成图压到 512px 级别后纳入 renderer 静态资源，避免继续使用渐变字母/emoji 作为主要伙伴头像。
- 首页各处头像统一走 `defaultPartnerAvatarAssets` / `getPartnerAvatar`：最近对话、群聊 header、消息流、任务拆解、右侧活跃伙伴和伙伴状态。
- 产品文案继续收敛为“伙伴”：搜索框从“搜索对话、智能体或消息”改为“搜索对话、伙伴或消息”，导航从“智能体”改为“伙伴”，右栏从“AI 团队运行状态”改为“伙伴团队运行状态”。
- 桌宠形象与真实像素交互未改动。
- 验证：`npx vitest run src/renderer/components/chat/AlkakaProjectChatHome.test.ts src/renderer/components/chat/chatWorkspaceLayout.test.ts src/renderer/components/cowork/mainWindowLiteNav.test.ts src/renderer/services/i18n.chatUi.test.ts src/renderer/components/pet/petInteraction.test.ts src/main/petContextMenu.test.ts src/main/petWindow.test.ts` 通过（7 files / 26 tests）；`npm run compile:electron -- --pretty false`、`npm run build`、`git diff --check` 均通过。

### 2026-04-29 20:39 CST — 参考图风格 Alkaka Chat 主窗口重构 checkpoint

- 用户明确反馈 Task 1-2 仍像旧 Cowork 界面；本 checkpoint 不再只换文案/壳层，而是按参考图新增 `src/renderer/components/chat/AlkakaProjectChatHome.tsx`，把无会话主窗口替换为完整三栏 Alkaka Chat 项目组界面。
- 左栏：Alkaka Chat 渐变 logo、新建对话、搜索框、对话/智能体/任务中心/项目空间等导航、最近对话和 Boss profile。
- 中间：`AI日报项目组` 群聊 header、置顶“生成今日 AI 行业日报”任务、Boss / 小课代表 / 项目管理 / 情报姬 / CodeMan 消息流、课代表总结卡、任务拆解卡、思考过程折叠卡、代码执行进度卡和底部 composer。
- 右栏：AI 团队运行状态、资源使用情况、伙伴状态、快捷操作卡片，使用浅色白 / 淡薰衣草背景、蓝紫渐变、圆角卡片、柔和阴影和状态 pill。
- 接入点：`CoworkView` 在没有 current session 时直接显示参考图风格 home；点击发送按钮仍走现有 `handleStartSession`，不重写 Cowork/OpenClaw 数据流。
- 桌宠形象与真实像素交互未改动。
- 验证：`npx vitest run src/renderer/components/chat/AlkakaProjectChatHome.test.ts src/renderer/components/chat/chatWorkspaceLayout.test.ts src/renderer/components/cowork/mainWindowLiteNav.test.ts src/renderer/services/i18n.chatUi.test.ts src/renderer/components/pet/petInteraction.test.ts src/main/petContextMenu.test.ts src/main/petWindow.test.ts` 通过（7 files / 25 tests）；`npm run compile:electron -- --pretty false`、`npm run build`、`git diff --check` 均通过；真实 `electron:dev:openclaw` health 为 `{"ok":true,"status":"live"}`，Vite 返回 `HTTP/1.1 200 OK`。

### 2026-04-29 19:53 CST — Task 1-2 起步 checkpoint

- Task 1：主窗口首页文案改为“Alkaka 对话营地”，首屏明确单聊 / AI 伙伴 / 项目组；侧边导航文案新增测试覆盖（对话记录、AI 伙伴、项目组、搜索对话）。
- Task 2：新增 `src/renderer/components/chat/chatWorkspaceLayout.ts` / `ChatWorkspaceShell.tsx`；普通单聊默认折叠右侧 workbench，项目组或深度处理展开右侧工作台。当前先在 Cowork home 接入静态壳层，不改 Cowork/OpenClaw 数据流。
- 桌宠形象与真实像素交互未改动。
- 验证：`npx vitest run src/renderer/components/cowork/mainWindowLiteNav.test.ts src/renderer/services/i18n.chatUi.test.ts src/renderer/components/chat/chatWorkspaceLayout.test.ts src/renderer/components/pet/petInteraction.test.ts src/main/petContextMenu.test.ts src/main/petWindow.test.ts`、`npm run compile:electron -- --pretty false`、`npm run build`、`git diff --check` 均通过；真实 `electron:dev:openclaw` health 为 `{"ok":true,"status":"live"}`。

## Non-goals for the first pass

- 不实现完整甘特图。
- 不实现真实多人社交。
- 不改底层数据库表名。
- 不一次性重写 OpenClaw runtime。
- 不把所有 skill routing 自动化一次做完。
- 不回退当前桌宠真实像素交互。

## Open questions

1. “项目组”是否要允许真人成员，还是第一阶段只允许用户 + AI 伙伴？
2. “进入主窗口”后续是否改成“进入营地”或“打开 Alkaka Chat”？
3. 默认 AI 伙伴数量是 1 个主宠 + 若干专业伙伴，还是一开始就展示伙伴列表？
4. 右侧工作台默认折叠到什么程度最合适？
5. Agent 私有 SOUL / shared memory 的 UI 放在哪里？
