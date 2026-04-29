# Alkaka

Alkaka 是一个面向未来个人工作流的桌面 AI 助理项目。当前形态是：**AI 桌宠常驻桌面作为主入口，OpenClaw 作为短期 Agent runtime，主窗口作为轻量对话、历史、设置和技能/MCP 管理面板**。

> 原上游 README 见 [`README.upstream.md`](./README.upstream.md)。详细历史日志见 [`docs/desktop-pet-plan.md`](./docs/desktop-pet-plan.md)。

## 产品远景

Alkaka 的长期形态不是单个聊天机器人，而是一个常驻桌面的 **AI 助理团队**：

- 多个 AI 助理可以分别对话、分别处理事情。
- Skills / MCP / 工具能力在整个团队内共享。
- 每个助理可以有不同头像、性格和 SOUL。
- Memory 默认服务于用户和团队；如果某段记忆更像用户与某个助理之间的专属关系，则更适合进入该助理的私有 SOUL / persona memory。
- 每个对话都应能显示当前处理模式和操作权限，例如快速回答 / 深度处理、只读 / 需确认 / 自动执行。
- Alkaka 不只接入 Feishu、微信等 IM，也会有独立手机 APP；手机端对话体验与 PC 端保持一致，通知头像使用对应 AI 助理的自定义头像。
- 远期探索“搭子一起养桌宠”等多人陪伴 / 协作体验。

## 当前状态

**最新 checkpoint：2026-04-29 14:24 CST — 桌宠真实交互稳定化**

已完成到：

- 桌宠从“任务入口”纠偏为 **AI 桌宠 / 对话入口**。
- 主窗口从重型工作台收敛为更轻的 **对话中心**。
- OpenClaw 是短期唯一 Agent 内核；Hermes 后续保留接入可能，但不影响当前桌宠优先路线。
- 主题系统收敛为 `light` / `dark` 两套。
- 桌宠默认窗口收紧为 `140×164`，quick input 展开窗口为 `360×420`。
- 桌宠命中区域是 **真实可见像素 alpha mask**：只有实际可见像素响应；透明区 / 空白区穿透。
- 单击桌宠不弹对话；双击真实像素才打开快速对话框。
- 单击按下不会触发位置跳动；待机状态停止自动 sprite 帧切换，避免“一卡一卡、一变一变”。
- 双击展开 quick input 后，蛋锚在窗口右下角 `right: 0; bottom: 0`，避免弹框时桌宠视觉位置偏移。
- 右键菜单包含：`对话`、`进入主窗口`、`隐藏桌宠`、`退出 Alkaka`。

最近验证：

```bash
npx vitest run \
  src/main/petContextMenu.test.ts \
  src/renderer/components/pet/petInteraction.test.ts \
  src/main/petWindow.test.ts \
  src/renderer/components/pet/petState.test.ts \
  src/renderer/components/pet/petTaskJump.test.ts \
  src/renderer/components/pet/petQuickTask.test.ts \
  --reporter=verbose

npm run compile:electron -- --pretty false
npm run build
git diff --check
```

结果：`6` 个测试文件 / `17` 个测试通过；Electron compile、production build、diff-check 通过。真实 `electron:dev:openclaw` smoke 中 OpenClaw `/health` 返回 `200 {"ok":true,"status":"live"}`，Vite 返回 `200`。

## 产品形态

```text
AI 桌宠（主入口）
  ├─ 常驻桌面
  ├─ 真实像素命中 / 透明区穿透
  ├─ 双击快速对话
  ├─ 右键：对话 / 进入主窗口 / 隐藏 / 退出
  └─ 后续：气泡、划词、截图、提醒

主窗口（辅助面板）
  ├─ 对话与历史
  ├─ 设置
  ├─ Skills / MCP
  ├─ 我的 Agent
  └─ 定时任务

多端入口
  ├─ IM：Feishu / 微信 / Telegram / Discord 等
  └─ 手机 APP：远期独立入口，与 PC 端对话体验保持一致
```

## 路线图

| 方向 | 状态 | 说明 |
|---|---:|---|
| 桌宠基础体验 | ✅ 当前重点 | 真实像素命中、双击对话、右键入口、稳定待机、quick input 不挪位 |
| 主窗口轻量化 | ✅ 当前重点 | 对话中心、历史、设置、Skills/MCP、我的 Agent、定时任务 |
| 视觉体系 | ✅ 当前重点 | 深浅双色主题、低饱和纸面式视觉、去 AI SaaS 模板感 |
| 桌宠工具集 | 下一步 | 气泡、划词翻译 / 提问、截图问答、OCR、提醒 |
| 多 Agent 团队 | 规划中 | 多助理、共享 skills、分层 memory、独立 SOUL / persona |
| 多端互通 | 规划中 | IM 网关 + 独立手机 APP + 头像通知 |
| 多人陪伴 | 远期 | 搭子一起养桌宠、协作空间、共享部分助理能力 |

## 关键决策

- **桌宠优先**：桌宠是默认入口；主窗口只在需要历史、设置、复杂输入和管理能力时打开。
- **当前先稳 OpenClaw**：OpenClaw 是短期唯一 runtime；Hermes 作为后续可能接入方向保留。
- **保留 IM 网关**：公开协议 IM 是多端互通基础，但未来也需要独立手机 APP。
- **弱化“任务”心智**：对用户呈现为对话、处理、继续上次、历史记录；技术上仍可映射到 Cowork / OpenClaw session。
- **主题只保留深浅两套**：删除多皮肤入口，旧主题 id 兼容映射到深 / 浅主题。
- **桌宠命中必须真实**：不用矩形、椭圆或几何近似作为最终方案；以当前 sprite frame 的 alpha 像素判断。

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
| 主题系统 | `src/renderer/theme/themes/`、`src/renderer/theme/css/themes.css`、`src/renderer/services/theme.ts` |

## 下一步

1. 用户验收当前桌宠交互与主窗口视觉。
2. 做独立 code review，修必要问题。
3. 进入桌宠气泡、划词、截图等工具集。
4. 开始为多 Agent 团队设计数据模型：共享 skills、共享 / 私有 memory、Agent SOUL。

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
