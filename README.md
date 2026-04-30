# Alkaka

Alkaka 是一个 **AI-first 聊天软件**：你可以和单个 AI 伙伴对话，也可以把多个 AI 伙伴拉进项目组，让它们一起完成复杂目标。桌宠是 Alkaka 在桌面上的化身和营地入口——平时常驻、陪伴、提醒，需要时把你带回完整聊天工作台。

> 原上游 README 见 [`README.upstream.md`](./README.upstream.md)。详细历史日志见 [`docs/desktop-pet-plan.md`](./docs/desktop-pet-plan.md)。AI 聊天软件重构计划见 [`docs/ai-first-chat-ui-plan.md`](./docs/ai-first-chat-ui-plan.md)。

## 产品远景

Alkaka 的长期形态不是单个聊天机器人，也不是传统任务后台，而是一个只给你和 AI 伙伴使用的聊天软件：

- **单聊**：和某个 AI 伙伴长期对话，形成专属关系、偏好和记忆。
- **项目组**：把多个 AI 伙伴拉到一个群里，围绕某个目标协作。
- **桌宠营地**：桌宠不是孤立挂件，而是这群 AI 伙伴在桌面上的活体入口；也可以理解为一个热闹的营地。
- **自动能力选择**：Skills / MCP / 工具能力作为团队共享能力池，由 AI 自动选择；普通用户不需要手动勾选 skill。
- **分层记忆**：用户 / 团队记忆默认共享；更像某个伙伴和用户之间关系的内容，进入该伙伴私有 SOUL / persona memory。
- **处理模式与权限**：每个对话应能显示当前处理强度和操作边界，例如快速回答 / 深度处理、只读 / 需确认 / 自动执行。
- **多端互通**：桌面端、独立手机 APP、Feishu / 微信 / Telegram / Discord 等 IM 入口共享同一套对话体验。

## 当前状态

**最新 checkpoint：2026-04-30 — Alkaka Chat 真实空白首页与 Cowork/OpenClaw 创建链路**

已完成到：

- 桌宠从“任务入口”纠偏为 **AI 桌宠 / 快速对话入口**，本轮继续保留当前桌宠形象和真实交互逻辑。
- 主窗口首页不再沿用旧 Cowork 便签/任务面板外观，已按参考图改成 **Alkaka Chat** 三栏聊天界面；当本地没有真实 Cowork session 时保持真实空白状态，不预置假的伙伴、智能体、项目组或聊天内容。
- 首页 composer 继续走现有 `handleStartSession()` → Cowork/OpenClaw 链路；左栏“最近对话”只消费真实 Redux Cowork session summaries、未读状态和当前 session id，真实会话行可直接打开对应 Cowork session，没有真实会话时显示空列表和新建入口。
- 主窗口的 Alkaka Chat shell 现在同时承载首页和已打开的真实 Cowork session：打开真实会话后，中间聊天流优先渲染 `currentSession.messages`（user / assistant / system / tool_use / tool_result），composer 继续调用 `handleContinueSession()` 进入真实 OpenClaw continuation；真实会话已打开但还没有消息时显示真实空态，不再退回 AI 日报示例卡片。
- 右侧工作台的核心状态接真实 `sessions`、`currentSessionId` 与 `OpenClawEngineStatus`：展示活跃/完成/异常 session 数、当前会话状态、OpenClaw phase 和最新会话标题；顶部成员计数也来自真实 session 总数。
- 左栏包含品牌、渐变“新建对话”、搜索、聊天/项目空间等导航和最近真实会话；中间无真实 session 时显示空白新建提示，有真实 session 时显示会话预览、真实消息卡片、工具调用/结果卡片和 composer；右栏是真实 Cowork/OpenClaw 链路状态、最近真实会话和真实能力入口。
- OpenClaw 是短期唯一 Agent runtime；Hermes 后续保留接入可能，但不影响当前 OpenClaw 稳定路线。
- 桌宠真实交互已稳定：真实可见像素命中、透明区穿透、单击不弹、不跳位、双击打开 quick input、展开后桌宠不挪位。

最近验证过的工程状态：

```bash
npx vitest run \
  src/renderer/components/chat/AlkakaProjectChatHome.test.ts \
  src/renderer/components/chat/chatWorkspaceLayout.test.ts \
  src/renderer/components/cowork/mainWindowLiteNav.test.ts \
  src/renderer/services/i18n.chatUi.test.ts \
  src/renderer/components/pet/petInteraction.test.ts \
  src/main/petContextMenu.test.ts \
  src/main/petWindow.test.ts

npm run compile:electron -- --pretty false
npm run build
git diff --check
```

结果：`5` 个本轮相关测试文件 / `40` 个测试通过；Electron compile、production build、diff-check 通过。`AlkakaProjectChatHome.test.ts` 额外覆盖真实 `currentSession.messages` 时间线映射、真实右侧工作台 stats、OpenClaw 非运行 phase 状态、真实空白首页、真实空会话空态、超长真实 OpenClaw 输出截断/消息列表上限、以及 running 会话的真实停止/置顶/重命名/删除入口；`petStatus.test.ts` 覆盖桌宠从真实 Cowork running/error/recent session 推导状态。

## 产品形态

```text
AI-first Chat App
  ├─ 单聊：你 ↔ 某个 AI 伙伴
  ├─ 项目组：你 + 多个 AI 伙伴围绕目标协作
  ├─ 对话卡片：目标、拆解、执行、日志、结果
  ├─ 可折叠工作台：伙伴状态 / 项目信息 / 文件 / 知识库 / 日志
  └─ 自动 skill routing：AI 判断该用什么能力

桌宠 / 营地入口
  ├─ 常驻桌面
  ├─ 真实像素命中 / 透明区穿透
  ├─ 双击快速对话
  ├─ 提醒、冒泡、回到项目组
  └─ 未来可呈现多个 AI 伙伴聚在一起的“营地”感

多端入口
  ├─ Desktop：主聊天工作台 + 桌宠
  ├─ Mobile：独立手机 APP
  └─ IM：Feishu / 微信 / Telegram / Discord 等
```

## 路线图

| 方向 | 状态 | 说明 |
|---|---:|---|
| AI-first 聊天软件信息架构 | 下一步 | 左侧会话 / AI 伙伴 / 项目组，中间聊天流，右侧可折叠工作台 |
| 单聊与项目组 | 下一步 | 支持和单个 AI 伙伴单聊，也支持多个伙伴组成项目组 |
| 卡片式执行过程 | 下一步 | 在聊天流里展示目标、拆解、工具调用、日志、交付物 |
| 可折叠全展开工作台 | 下一步 | 用户觉得重时折叠；复杂项目中展开伙伴状态、项目信息、快捷操作 |
| 桌宠营地联动 | 规划中 | 桌宠负责陪伴、提醒、快速唤起，也可承载“多个宠物聚一起”的营地感 |
| 自动 skill routing | 规划中 | skill 从普通用户界面退到后台，由 Agent 自动选择并受权限策略约束 |
| 多端互通 | 规划中 | IM 网关 + 独立手机 APP + AI 伙伴头像通知 |

## 关键决策

- **聊天软件优先**：主窗口不是任务后台，而是 AI 伙伴聊天软件。
- **桌宠是化身 / 营地入口**：桌宠不取代聊天软件，而是桌面上的陪伴、提醒和快速入口。
- **全展开 UI 可以重，但必须可折叠**：概念图适合作为项目组全展开工作台；默认态要能收敛成轻聊天界面。
- **Agent 不是提示词模板**：Agent 应该是角色、目标、SOUL、记忆边界、权限策略、工作流和自动 skill routing 的组合。
- **Skill 是能力包**：skill 回答“能做什么”；Agent 回答“谁来做、怎么做、做到什么标准、用多大权限做”。
- **当前先稳 OpenClaw**：OpenClaw 是短期唯一 runtime；Hermes 作为后续可能接入方向保留。
- **弱化传统任务心智**：对用户呈现为对话、项目组、正在处理、交付物、继续上次；技术上仍可映射到 Cowork / OpenClaw session。

## 代码速查

| 方向 | 主要文件 |
|---|---|
| 桌宠窗口 | `src/main/petWindow.ts` |
| 桌宠主视图 | `src/renderer/components/pet/PetView.tsx` |
| 桌宠真实像素命中 | `src/renderer/components/pet/petInteraction.ts` |
| Shimeji sprite | `src/renderer/components/pet/ShimejiSprite.tsx`、`src/renderer/utils/shimejiSpriteSheet.ts` |
| 桌宠右键菜单 | `src/main/petContextMenu.ts` |
| 桌宠 preload IPC | `src/main/petPreload.ts`、`src/renderer/types/electron.d.ts` |
| 主窗口对话中心 | `src/renderer/components/cowork/CoworkView.tsx`、`src/renderer/components/cowork/mainWindowLiteNav.ts` |
| Agent 数据 | `src/main/agentManager.ts`、`src/main/coworkStore.ts`、`src/renderer/services/agent.ts` |
| Skill 系统 | `src/main/skillManager.ts`、`SKILLs/` |
| 主题系统 | `src/renderer/theme/themes/`、`src/renderer/theme/css/themes.css`、`src/renderer/services/theme.ts` |

## 下一步

1. 按 [`docs/ai-first-chat-ui-plan.md`](./docs/ai-first-chat-ui-plan.md) 重构主窗口信息架构。
2. 把“我的 Agent”逐步改成“AI 伙伴”。
3. 把“任务中心 / 项目空间”收敛为聊天软件里的“项目组 / 正在处理 / 交付物”。
4. 把 skill 选择从普通用户界面退到高级权限边界，由 AI 自动判断使用能力。
5. 保持桌宠真实像素交互和 quick input 稳定，不回退已有体验。

## 常用验证命令

```bash
npm run compile:electron -- --pretty false
npm run build
git diff --check
npm run electron:dev:openclaw
```

OpenClaw 健康检查：

```bash
curl -fsS http://127.0.0.1:18789/health
```

预期：

```json
{"ok":true,"status":"live"}
```
