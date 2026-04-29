# Alkaka

Alkaka 是一个桌面 AI 助理项目。当前产品方向是：**AI 桌宠常驻桌面作为主入口，OpenClaw 作为 Agent runtime，主窗口作为轻量对话、历史、设置和技能/MCP 管理面板**。

# 我的想法：
 1. 多AI助理，每个都能单独对话和派发任务，skill在整个团队通用，个性soul可以各不相同，memory通用（记录memory的时候如果判断为这段记忆更像是用户和当前Agent特有的记忆，则写进当前Agent特有的soul更合适）
 2. 每个对话下方都可显示当前推理强度；权限大小
 3. 除了接受飞书、微信等IM，还有单独的手机APP
    1. 其对话界面与PC端基本一致
    2. 其通知显示图标，是AI助理的自定义头像
 4. 搭子一起养桌宠的后续功能

> 原上游 README 见 [`README.upstream.md`](./README.upstream.md)。更细的历史开发日志见 [`docs/desktop-pet-plan.md`](./docs/desktop-pet-plan.md)。

## 当前状态

**最新 checkpoint：2026-04-29 14:24 CST — Phase 3A.9 桌宠真实交互稳定化**

已完成到：

- 桌宠从“任务入口”纠偏为 **AI 桌宠 / 对话入口**。
- 主窗口从重型工作台收敛为更轻的 **对话中心**。
- OpenClaw是短期唯一 Agent 内核；Hermes后续有加入的计划。
- 主题系统两套：`light` / `dark`。
- 桌宠默认窗口收紧为 `140×164`，quick input 展开窗口为 `360×420`。
- 桌宠命中区域是 **真实可见像素 alpha mask**：只有实际可见像素响应；透明区/空白区穿透。
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

Agent runtime
  └─ OpenClaw（短期唯一 runtime）
```

## 阶段进度

| 阶段 | 状态 | 说明 |
|---|---:|---|
| Phase 1 品牌/依赖清理 | ✅ | LobsterAI/NetEase/Youdao 残留清理，登录系统和旧私有依赖移除 |
| Phase 2 OpenClaw 稳定性 | ✅ checkpoint | runtime host、Electron/OpenClaw 启动、配置同步、日志脱敏、shutdown 噪音处理 |
| Phase 3A 桌宠主入口 | ✅ checkpoint | 桌宠默认启动、quick input、状态机、Shimeji 形象、最近对话恢复、真实像素 hitbox |
| Phase 3A 主窗口轻量化 | ✅ checkpoint | 主窗口降级为对话/历史/设置面板，视觉改为低饱和纸面式，去 AI SaaS 模板感 |
| Phase 3B 桌宠工具集 | ⏭ 下一阶段 | 气泡、划词翻译/提问、截图问答、OCR、提醒 |
| Phase 4 人格与多端互通 | 远期 | 桌宠人格、移动端、跨设备 session 同步、可选云同步 |

## 关键决策

- **桌宠优先**：桌宠是默认入口；主窗口只在需要历史、设置、复杂输入和管理能力时打开。
- **短期只收敛 OpenClaw**：不在当前阶段接 Hermes，避免多 runtime 抽象拖慢桌宠体验交付。
- **保留 IM 网关**：Feishu / Telegram / Discord / WeChat / DingTalk / Email 等公开协议入口仍是多端互通基础。
- **弱化“任务”心智**：对用户呈现为对话、处理、继续上次、历史记录；技术上仍可映射到 Cowork/OpenClaw session。
- **主题只保留深浅两套**：删除多皮肤入口，旧主题 id 兼容映射到深/浅主题。
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

1. 用户先验收当前桌宠交互：真实像素命中、单击不跳、双击弹框不挪位、右键菜单入口。
2. 若体验认可：做独立 code review，修必要问题。
3. 更新 `docs/desktop-pet-plan.md` 的详细日志，提交并记录 SHA。
4. 进入 Phase 3B：桌宠气泡与划词/截图工具集。

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
