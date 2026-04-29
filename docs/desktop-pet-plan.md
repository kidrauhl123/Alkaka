# Alkaka 开发计划与日志

> 这个文档不是正式 PRD，是单人开发（有老师指导）的轻量备忘录。
> 记录想做什么、先做什么、暂时不做什么、当前进度到哪里。

---

## 一、项目愿景

把 Alkaka 从一个传统桌面工作台，逐步改造成 **AI-first 聊天软件 + 桌面桌宠营地入口**：用户可以和单个 AI 伙伴单聊，也可以把多个 AI 伙伴拉进项目组；桌宠是这群 AI 伙伴在桌面上的化身、提醒器和营地入口。

最终形态由四个层次组成：

```
┌──────────────────────────────────────────────────┐
│  AI-first Chat App（主窗口，真正的工作空间）      │
│  ─ 单聊 / 项目组 / 对话卡片 / 可折叠工作台        │
├──────────────────────────────────────────────────┤
│  桌宠营地（桌面化身，常驻入口）                   │
│  ─ 快速对话 + 提醒 + 回到项目组 + 伙伴氛围        │
├──────────────────────────────────────────────────┤
│  多端入口（同一套对话体验）                       │
│  ─ Telegram / Discord / Feishu / 微信 / DingTalk │
│  ─ 未来 Alkaka 手机 APP 也通过此层跟桌面端通信    │
├──────────────────────────────────────────────────┤
│  Agent 内核（先稳定 OpenClaw，保留协议边界）      │
│  ─ OpenClaw：短期唯一 runtime                    │
│  ─ Skills/MCP：团队共享能力池，AI 自动选择        │
│  ─ Hermes：后续保留接入可能                      │
└──────────────────────────────────────────────────┘
```

### 关键定位决策

- **AI-first 聊天软件是主窗口方向**：主窗口不是任务后台，而是单聊、项目组、对话卡片和可折叠工作台。
- **桌宠是桌面化身 / 营地入口**：桌宠不取代聊天软件，而是常驻陪伴、提醒、快速对话和回到项目组。
- **全展开 UI 可以重，但必须可折叠**：用户发来的三栏概念图适合作为项目组全展开工作台；默认态应能折叠成轻聊天界面。
- **AI 伙伴优先于 Agent 技术概念**：普通用户看到的是伙伴、职责、性格、权限；system prompt / skill ids 退到高级设置。
- **Skills/MCP 是团队共享能力池**：普通用户不手动勾选 skill，由 AI 自动选择；skill 选择只作为高级权限边界。
- **Agent 内核先收敛到 OpenClaw**——OpenClaw 已经深度集成，短期不再新增 Hermes 第二引擎，优先把现有 runtime、IM 网关、桌宠入口打磨稳定。
- **移动 APP 是远期目标**——通过 IM 网关 + 自建轻量 push channel 实现桌面/手机互通。

---

## 二、总体架构

### 进程模型（保持不变）

| 进程 | 职责 |
|------|------|
| Main | 窗口生命周期、SQLite、Agent engine routing、IM gateway、IPC |
| Preload | `contextBridge` 暴露 `window.electron` |
| Renderer (主) | 主窗口完整 UI |
| Renderer (桌宠) | 桌宠浮窗 UI |

### 即将引入的新模块

| 模块 | 说明 | 状态 |
|------|------|------|
| `agentEngineProtocol` | 抽象当前 OpenClaw runtime 边界，避免继续硬耦合 | 进行中 |
| `hermesRuntimeAdapter` | Hermes 适配器 | 暂缓 |
| `petToolKit` | 桌宠工具集（划词翻译、截图、OCR） | 下一阶段 |
| `simpleAuth` | 最简本地账号 + 可选云同步 | 计划 |
| `alkaka-marketplace` | 静态 skill / MCP 市场（独立 GitHub repo） | 计划 |
| 移动端 push relay | 桌面/手机互通的轻量后端 | 远期 |

---

## 三、当前真实进度

### 文档维护规则

- 每个可验收 checkpoint 必须同步更新本文件的“当前真实进度”和阶段表，记录验证命令、截图/日志证据、commit SHA 与下一步。
- 只要涉及产品方向、阶段优先级或验收口径变化，也必须在本文件落地，避免进度只停留在对话里。

### 当前 checkpoint（2026-04-29 23:40 CST）

- 当前分支：`main`（未提交工作区；本 checkpoint 待提交后记录 SHA）。
- 最新功能范围：**默认伙伴头像接入与主窗口高级感优化 checkpoint**。
- 已完成到：在参考图风格 `AlkakaProjectChatHome` 基础上，把已生成的 6 个默认伙伴头像复制到 `src/renderer/assets/partners/`，并在聊天首页、最近对话、任务分配、伙伴状态和团队概览里替换渐变字母占位头像。默认头像包括小课代表、情报姬、CodeMan、设计喵、数据君、审核官，图片已压到 512px 级别，避免把原始 1024px 资源直接塞进包体。
- 文案收敛：左侧导航与搜索从“智能体”改为“伙伴”，右侧状态卡从“AI 团队运行状态”改为“伙伴团队运行状态”，继续统一产品语义。
- 桌宠形象、真实像素命中、透明区穿透、单击/双击行为和窗口位置逻辑未改动。
- 验证命令：
  - `npx vitest run src/renderer/components/chat/AlkakaProjectChatHome.test.ts src/renderer/components/chat/chatWorkspaceLayout.test.ts src/renderer/components/cowork/mainWindowLiteNav.test.ts src/renderer/services/i18n.chatUi.test.ts src/renderer/components/pet/petInteraction.test.ts src/main/petContextMenu.test.ts src/main/petWindow.test.ts`：7 files / 26 tests passed。
  - `npm run compile:electron -- --pretty false`：通过。
  - `npm run build`：通过。
  - `git diff --check`：通过。
- 下一优先级：继续做“大气感”精修：减少右栏信息噪音、放大中间聊天留白、统一伙伴头像裁切/阴影，并生成 Boss / 管管 / 大监 等更完整默认伙伴组。

### 上一 checkpoint（2026-04-29 19:53 CST）

- 当前分支：`main`（未提交工作区；本 checkpoint 待提交后记录 SHA）。
- 最新功能范围：**AI-first Chat UI Task 1-2 起步 checkpoint**。
- 已完成到：主窗口首页从“便签式桌宠辅助面板”进一步推进为 **Alkaka 对话营地**：首屏文案明确单聊 / AI 伙伴 / 项目组；默认仍保持轻量，不改变桌宠形象和真实像素交互。新增 `components/chat` 壳层和 `resolveChatWorkspaceLayout` 纯函数，为三栏项目组全展开工作台打基础：普通单聊默认折叠右侧 workbench，项目组或深度处理可展开右侧伙伴状态 / 目标 / 交付物区域。侧边导航文案第一步改向聊天软件语义：对话记录、AI 伙伴、项目组。
- 验证命令：
  - `npx vitest run src/renderer/components/cowork/mainWindowLiteNav.test.ts src/renderer/services/i18n.chatUi.test.ts src/renderer/components/chat/chatWorkspaceLayout.test.ts src/renderer/components/pet/petInteraction.test.ts src/main/petContextMenu.test.ts src/main/petWindow.test.ts`：6 files / 17 tests passed。
  - `npm run compile:electron -- --pretty false`：通过。
  - `npm run build`：通过。
  - `git diff --check`：通过。
  - `npm run electron:dev:openclaw`：真实运行链路已启动；`http://127.0.0.1:18789/health` 返回 `200 {"ok":true,"status":"live"}`，Vite `http://127.0.0.1:5175/` 返回 `200`。
- 下一优先级：继续 Task 3-4，把 Agent 设置逐步改成 AI 伙伴 / 能力边界模型；同时补一个真正的项目组占位视图，避免“项目组”导航长期复用旧定时任务页面。

### ✅ 已完成

- **2026-04-27** 项目改名 LobsterAI → Alkaka，源码 NetEase/Youdao 字面引用全清
- **2026-04-27** 桌宠 v1：透明置顶浮窗、可拖动、双击开主窗、右键菜单；安全加固（IPC 源校验、导航拦截、生产环境禁 DevTools、托盘恢复）
- **2026-04-28** **Phase 1 全部完成**——清理 NetEase/Youdao 残留
  - 1.1 移除 NIM/POPO/NetEaseBee IM 集成（删 6315 行 / 改 111 文件）
  - 1.2 文档/隐私/EULA URL → `github.com/kidrauhl123/Alkaka`
  - 1.3 logo / appId / productName / `alkaka://` 协议全部为 Alkaka
  - 1.4 Skill / MCP 市场 → `raw.githubusercontent.com/kidrauhl123/Alkaka`
  - 1.5 自动更新 → `api.github.com/repos/kidrauhl123/Alkaka/releases/latest`
  - 1.6 alkaka-server / URS 登录系统全部删除（authSlice / LoginButton / token relay 全清）
  - 1.7 死代码清理：`openclawTokenProxy.ts`、`YouDaoZhiYunIcon.tsx` 及对应 export / 测试 mock
  - 验证：TS 编译 / build / 634 测试全过
- **2026-04-28** Agent Engine 选型复盘：短期不接 Hermes，先收敛到 OpenClaw；保留 Router/Protocol 边界但不做第二 runtime
- **2026-04-28** 产出本规划文档：Phase 1-4 详细计划 + ADR-001~004
- **2026-04-28** **Phase 2.1 完成到 checkpoint**——AgentEngine 常量中心、CoworkEngineRouter 多 runtime map、OpenClaw fallback、路由测试与构建验证已落地
- **2026-04-28** 路线调整：Phase 2.2 Hermes 接入暂缓，下一步转向 OpenClaw 稳定性与桌宠工具集
- **2026-04-28** **Phase 2.2 OpenClaw runtime 启动链路 checkpoint**——`electron:dev:openclaw` 已实测跑通，OpenClaw gateway health 返回 live；修复 clean host 上 pnpm/sha256sum 构建阻塞，并收敛启动日志中的 secret 泄露风险
- **2026-04-28** **Phase 2.2 OpenClaw 启动降噪补丁**——默认配置显式禁用 OpenClaw bundled `acpx` 插件，避免无 API/model 配置时触发 Codex ACP runtime probe；补齐退出路径 window state IPC 防护
- **2026-04-28** **本机用户验收 smoke**——用户在电脑旁实测 `npm run electron:dev:openclaw` 打开的真实 Electron 产品窗口可正常看到/操作，OpenClaw gateway health 为 live；下一步转入 Cowork / IM / 桌宠入口端到端链路验证
- **2026-04-28** **Cowork/OpenClaw shutdown smoke**——修复 Electron 退出时 channel polling in-flight `sessions.list` 因 gateway 已断开而误报 `pollChannelSessions: error during polling: gateway not connected` 的噪音；新增回归测试，验证 `openclawRuntimeAdapter.test.ts` 21/21 通过、`npm run compile:electron` 通过、`npm run electron:dev:openclaw` 真实窗口可显示且 gateway `/health` 为 live，退出日志不再出现该 ChannelSync 错误
- **2026-04-28** **产品方向 pivot：桌宠优先**——确认 OpenClaw / IM → 桌面 UI 映射已有基础实现，下一阶段不再把“主窗口工作台”作为核心形态继续加重，而是重构为“桌宠主入口 + 轻量对话/历史/设置面板”：桌宠承载日常输入、状态、快捷工具，主窗口退为历史、设置、复杂对话详情
- **2026-04-28** **Phase 3A.1 桌宠默认主入口 checkpoint**——启动顺序改为优先创建桌宠窗口；主窗口改为按需显示，同时保留隐藏 renderer bootstrap 承载现有自动更新/网络恢复监听，避免 pet-only 启动跳过旧启动副作用；托盘菜单改为可懒创建主窗口，并等待主窗口加载完成后再发送“新建对话/设置”IPC；新增 `trayManager.test.ts` 覆盖托盘首次打开主窗口时的 IPC 等待逻辑
- **2026-04-28** **Phase 3A.2 桌宠快速输入 checkpoint**——桌宠支持点击展开轻量输入面板，面板通过 `petPreload` 暴露的最小 IPC 调用 `pet:quickTask:start`，主进程校验 sender 必须来自桌宠窗口后再创建 OpenClaw/Cowork 任务；展开时桌宠窗口从 `220×260` 临时扩展到 `360×420`，收起后恢复尺寸；新增 `petQuickTask.test.ts` 覆盖空输入、标题生成和 prompt 截断，真实 Electron/OpenClaw smoke 验证 gateway `/health` live 且快速输入面板可见
- **2026-04-28** **Phase 3A.3 桌宠状态机 checkpoint**——新增 main/renderer 双侧桌宠状态模型与测试，主进程把 quick task 创建、Cowork/OpenClaw `message` / `permissionRequest` / `complete` / `error` 生命周期裁剪为 `idle / ready / sending / working / needs-approval / error / done` 快照并通过最小 pet preload API 推送给桌宠；桌宠 UI 增加状态小圆点、状态文案和不同阶段光晕，错误展示使用泛化用户可见文案避免在常驻桌宠里暴露详细错误。
- **2026-04-28** **Phase 3A.3b Shimeji v6 默认形象合入 checkpoint**——按“功能核心以主分支为准、美术/定格动画以二妹成果为准”的取舍，保留主分支 quick input、状态机、pet preload IPC 与 OpenClaw/Cowork 链路，将旧 `logo.png` 桌宠替换为二妹 v6 小蛋人 `ShimejiSprite` / atlas / manifest / 皮肤模板工具；完整 world behavior 暂不默认启用，只先接入默认形象和状态驱动动作。
- **2026-04-28** **Phase 3A.5 桌宠 ↔ 主窗口对话跳转 checkpoint**——桌宠状态保留可打开的 `sessionId`，展开 quick input 后“查看对话”会通过 `pet:openCoworkSession` 安全 IPC 打开/聚焦主窗口并跳转到对应 Cowork session 详情；主窗口显示“从桌宠快速对话跳转而来”提示，避免用户从桌宠跳转后丢上下文。
- **2026-04-28** **Phase 3A.4 主窗口轻量化导航 checkpoint**——主窗口首页改为桌宠主入口模式下的轻量辅助面板，默认折叠左侧重导航，优先提供任务历史、设置、复杂 Cowork、Skills/MCP 入口；完整输入区默认收起，只在明确需要复杂 Cowork 或有 draft/快捷事件时展开。
- **2026-04-29** **Phase 3A.6 桌宠“继续上次”最近记录恢复 checkpoint**——桌宠 ready 状态会基于 Cowork 按更新时间排序的最近记录带上最新可打开 `sessionId/title`，quick input 按钮从泛化“查看详情”改成“继续上次”，复用现有安全 IPC 跳转主窗口详情，降低用户从桌宠回到上一条处理记录的断点成本。
- **2026-04-29** **Phase 3A.7 AI 桌宠 / 对话中心语义纠偏 checkpoint**——产品定位从“任务桌宠”纠偏为“AI 桌宠”：桌宠默认窗口收紧到 `168×196` 贴近透明形象，移除底部常驻状态文案，右键菜单首项改为“对话”；主窗口默认尺寸降为 `960×640`，首页文案改为“和 Alkaka 对话”，顶部/侧边不再提供“搜索任务”主入口，搜索移动到历史记录旁边的放大镜按钮，同时保留定时任务、Skills/MCP、我的 Agent。
- **2026-04-29** **Phase 3A.8 深浅双色主题与对话空间视觉降噪 checkpoint**——删除多皮肤主题 registry 和设置页皮肤墙，仅保留 `classic-light` / `classic-dark` 两套低饱和深浅主题；旧主题 id 兼容回落到深浅主题。主窗口首页去掉大面积渐变/发光/玻璃拟态，改为更安静的纸面/便签式对话空间。
- **2026-04-29** **AI-first Chat UI Task 1-2 起步 checkpoint**——主窗口首页改为“Alkaka 对话营地”，首屏文案和导航第一步转向单聊 / AI 伙伴 / 项目组；新增 `src/renderer/components/chat/ChatWorkspaceShell.tsx` 与 `chatWorkspaceLayout.ts`，为三栏项目组全展开工作台提供可折叠右侧 workbench 壳层，同时保留普通单聊默认轻量和当前桌宠形象/交互。
- **2026-04-29** **参考图风格 Alkaka Chat 主窗口重构 checkpoint**——根据用户提供的参考图重做无会话主窗口，不再停留在旧 Cowork 面板：新增 `AlkakaProjectChatHome` 三栏项目组群聊界面，包含左侧 Alkaka Chat 导航 / 最近对话、中间 AI 日报项目组群聊与富任务卡、右侧团队状态 / 资源用量 / 伙伴状态 / 快捷操作；保留桌宠形象和 Cowork/OpenClaw session 数据流。

---

## 四、阶段计划

按"低风险先行 → 解耦核心依赖 → 重塑架构 → 桌宠化"四阶段推进。

### Phase 1：清理 NetEase/Youdao 残留 ✅ 已完成

| # | 任务 | 状态 |
|---|------|------|
| 1.1 | 移除 NIM/POPO/NetEaseBee IM 集成 | ✅ |
| 1.2 | 替换文档/Portal/隐私政策/用户协议 URL | ✅ |
| 1.3 | 核查并替换 logo / 品牌资产 / appId | ✅ |
| 1.4 | Skill 市场 + MCP 市场切换为 GitHub raw 静态方案 | ✅ |
| 1.5 | 自动更新切到 GitHub Releases | ✅ |
| 1.6 | 移除 alkaka-server / URS 登录系统 | ✅ |
| 1.7 | 死代码清理（openclawTokenProxy / YouDaoZhiYunIcon） | ✅ |

> **关于"最简本地登录"**：原计划要保留一个最简登录概念给多端互通用。实测发现 `authSlice` / `LoginButton` 已被全部删除、`WelcomeDialog` 已不再要求登录。当前应用是**完全无登录**状态。是否要在 Phase 4（多端互通）启动时再加回最简本地 profile，留待后续决策。

#### 1.4 详细方案：Skill / MCP 市场静态化

新建独立 GitHub 仓库 `<your-org>/alkaka-marketplace`：

```
alkaka-marketplace/
├── marketplace.json       # 总索引，客户端拉这个
├── skills/
│   ├── docx/
│   │   ├── manifest.json  # 名称、版本、作者、tags、下载 URL
│   │   └── README.md
│   └── ...
└── mcp-servers/
    └── ...
```

客户端通过 `https://raw.githubusercontent.com/<org>/alkaka-marketplace/main/marketplace.json` 拉取索引，搜索/筛选都在客户端做。

**先做静态版的好处**：零运维、社区可 PR 投稿、跟版本一起追溯。半年后看活跃度再决定要不要升级到带后端的方案。

#### 1.6 详细方案：最简本地登录

**目标**：保留登录概念但**不依赖任何第三方服务**。

设计：
- 启动时弹一个简单的"创建本地账号"流程（用户名 + 头像即可，密码可选）
- 账号信息存 SQLite，**不上传任何服务器**
- 留一个"云同步"开关（默认关），未来配合移动端时再做（Phase 4）
- LLM API Key 由用户自己填（OpenAI / Anthropic / DeepSeek 等）；移除 alkaka-server token relay

实质就是去掉强制登录 + 去掉 URS / OAuth 依赖，保留一个本地 profile 概念给后续多端识别用。

---

### Phase 2：Agent Engine 边界收敛（预计 2-4 天）

目标：不再短期接 Hermes；保留已完成的 Router/Protocol 边界，但把重心转为**稳定现有 OpenClaw runtime**，避免为了第二引擎过度抽象。

| # | 任务 | 状态 | 下一步 |
|---|------|------|--------|
| 2.1 | 把 `openclawRuntimeAdapter` 的接口提炼成 `AgentEngineProtocol` / Router 多 runtime map | ✅ checkpoint | 保留，不继续扩大抽象 |
| 2.2 | OpenClaw runtime 稳定性收敛：启动、配置同步、错误恢复、日志定位 | ✅ 本机验收通过 | `electron:dev:openclaw` 已跑通；已显式禁用默认 acpx probe；用户已实机确认窗口可操作 |
| 2.3 | 设置里保留 engine 字段但不开放第二引擎 UI | 计划 | UI 只展示 OpenClaw 状态/诊断 |
| 2.4 | OpenClaw / IM / 桌面 UI 既有链路回归验收 | 降级为回归项 | 不作为主开发线；只在桌宠重构过程中补必要 smoke，避免继续加重主窗口工作台 |

**关键设计原则**：
- Agent Engine 接口要做窄，只暴露 `startSession / streamMessage / requestPermission / stopSession` 这种核心能力
- 引擎特定的高级特性（Hermes 的 self-improvement、OpenClaw 的 IM 网关插件）通过 capability 探测暴露
- 配置 schema 支持 per-engine 特性，不强行统一

---

### Phase 3：桌宠主入口 + 轻量桌面端重构（预计 2-3 周）

新的产品方向：**桌宠是默认主入口，主窗口退为轻量辅助面板**。

目标不是继续把主窗口做成重型 Agent 工作台，而是让日常使用路径变成：

```
桌宠常驻桌面
  → 轻量输入/快捷动作/状态反馈
  → 必要时展开为小面板或跳转主窗口详情
  → 主窗口只承载历史、设置、复杂任务详情、技能/MCP 管理
```

#### Phase 3A：产品形态重构（优先）

| # | 任务 | 工作量 | 说明 |
|---|------|--------|------|
| 3A.1 | 桌宠默认启动与可见性策略 | ✅ checkpoint | 启动优先显示桌宠；主窗口按需显示，但暂保留隐藏 renderer bootstrap 承载旧启动副作用 |
| 3A.2 | 桌宠快速输入面板 | ✅ checkpoint | 点击桌宠展开轻量输入框，经安全 preload IPC 直接创建 OpenClaw/Cowork 任务；后续补全快捷键和继续现有任务 |
| 3A.3 | 桌宠状态机 | ✅ checkpoint | 建立 idle / ready / sending / working / needs-approval / error / done 状态源；quick task 与 Cowork/OpenClaw 生命周期会同步到桌宠状态反馈 |
| 3A.3b | Shimeji v6 默认形象与动画资源 | ✅ checkpoint | 合入二妹 v6 小蛋人、sprite atlas、manifest、皮肤模板和工具测试；主分支产品功能壳保持为准 |
| 3A.4 | 主窗口轻量化导航 | ✅ checkpoint | 主窗口首页收敛为对话中心入口，历史/设置/复杂 Cowork/Skills-MCP 轻量保留，完整输入区默认收起，减少启动压迫感 |
| 3A.5 | 桌宠 ↔ 主窗口对话跳转 | ✅ checkpoint | 桌宠对话可打开对应 Cowork session 详情；主窗口会标识该详情来自桌宠快速对话 |
| 3A.6 | 桌宠“继续上次”最近记录恢复 | ✅ checkpoint | ready 状态自动挂上按更新时间排序的最近 Cowork session；quick input 提供“继续上次”跳转入口 |
| 3A.7 | AI 桌宠 / 对话中心语义纠偏 | ✅ checkpoint | 去掉桌宠底部常驻状态文案与任务中心语义；右键首项“对话”；主窗口改为更小的对话中心，搜索降级到历史记录旁边 |
| 3A.8 | 深浅双色主题与视觉降噪 | ✅ checkpoint | 删除多皮肤主题体系，仅保留低饱和浅色/深色；主窗口首页去 AI 模板感，改为克制纸面式对话空间 |

#### 3A.3 具体执行计划：桌宠状态机

目标：桌宠不仅能创建任务，还能在任务创建、Agent 思考/工作、等待用户确认、完成、失败时给出即时状态反馈。

1. **盘点现有 session / cowork 事件源**
   - 文件：`src/main/main.ts`、`src/main/libs/agentEngine/openclawRuntimeAdapter.ts`、`src/renderer/services/cowork.ts`、`src/renderer/components/cowork/*`
   - 输出：确认主进程已有哪类 session update / stream / permission / error 事件可复用。
2. **定义桌宠状态模型**
   - 新增或修改：`src/renderer/components/pet/petState.ts`
   - 状态先收敛为：`idle`、`ready`、`sending`、`working`、`needs-approval`、`error`、`done`。
   - TDD：覆盖事件到状态的 reducer，不先做复杂动画。
3. **主进程向桌宠窗口广播任务状态**
   - 修改：`src/main/main.ts`、`src/main/petPreload.ts`、`src/renderer/types/electron.d.ts`
   - 原则：继续保持 pet preload 最小暴露面，只给桌宠订阅经过裁剪的状态快照，不泄露完整 Cowork API。
4. **桌宠 UI 展示状态**
   - 修改：`src/renderer/components/pet/PetView.tsx`、`src/renderer/index.css`
   - 先做轻量版本：状态文案、小圆点/光晕、错误提示、完成提示；动画放到 3B.7。
5. **端到端验证**
   - 单测：pet reducer / preload 类型 / 关键 IPC sender guard。
   - 构建：`npm run compile:electron -- --pretty false`、`npm run build`。
   - 真实 smoke：`npm run electron:dev:openclaw`，从桌宠创建任务后确认状态能从发送中变为工作中/完成或错误，并截图记录。

#### Phase 3B：桌宠工具集

桌宠的"基本工具集"，按重要度排序：

| 工具 | 实现方式 | 是否走 Agent | 优先级 |
|------|----------|------------|--------|
| 划词翻译 | 全局热键 + 选区 + 翻译 API | ❌ 直接调 | P0 |
| 划词提问 | 选区 → 桌宠气泡 → chat | ✅ | P0 |
| 截图问答 | 系统截图 → 多模态模型 | ✅ | P1 |
| OCR | tesseract / 系统 API | ❌ 本地 | P1 |
| 快速记事 | 桌宠点开输入 → 本地 markdown | ❌ | P1 |
| 工作时长提醒 | 本地定时器 + 桌宠动画 | ❌ | P2 |
| 闲聊"主人在干嘛" | 检测前台 app + Agent 评论 | ✅ | P2 |
| 桌宠主动招呼 | 时机判断 + Agent 决策 | ✅ | P2 |

**重要 insight**：很多工具不需要 Agent 介入，直接做更快更稳。Agent 只在需要"理解 / 复杂任务"时才上场。

| # | 任务 | 工作量 |
|---|------|--------|
| 3B.1 | 全局热键系统 + 选区文本捕获 | 2 天 |
| 3B.2 | 划词翻译（直接调翻译 API） | 1 天 |
| 3B.3 | 划词提问（接 Agent） | 2 天 |
| 3B.4 | 桌宠气泡 UI（响应展示框，可定位、可消失、可转主窗口） | 3 天 |
| 3B.5 | 截图问答（多模态） | 3 天 |
| 3B.6 | OCR | 2 天 |
| 3B.7 | 状态展示动画（思考中/工作中/等待权限/出错） | 3 天 |

---

### Phase 4：桌宠人格 + 多端互通（持续）

| # | 任务 | 说明 |
|---|------|------|
| 4.1 | 桌宠人格（SOUL.md + Hermes 记忆） | 用户长期使用后桌宠"知道你" |
| 4.2 | 移动端 APP（iOS / Android） | 通过 IM 网关 + 推送 relay 跟桌面互通 |
| 4.3 | 跨设备 session 同步 | 在桌面问的问题手机能继续 |
| 4.4 | 云同步配置 / skills（可选） | 用户自带云盘 or 自建轻量后端 |

Phase 4 不在短期路径里，但 Phase 1-3 的设计要为它留口（特别是 IM 网关、最简登录、Agent engine 协议都要考虑 future-proof）。

---

## 五、暂时不做（避免项目做散）

- Live2D / 3D 桌宠 / 复杂物理动画
- 语音对话（识别 + 合成）
- 桌宠换装系统、角色市场、多角色
- 继续把主窗口做成越来越重的默认工作台
- 自研 Agent loop（已经有 OpenClaw / Hermes，不重复造）
- Skill 市场带后端的版本（先静态化）
- 强加密的云同步（Phase 4 再考虑）

---

## 六、关键技术决策记录（ADR）

### ADR-001：保留 IM 网关

**背景**：清理 NetEase/Youdao 时一度考虑砍掉所有 IM 集成。

**决策**：保留 IM 网关，只移除依赖网易/有道私有协议的部分（NIM / POPO / NetEaseBee）。Telegram / Discord / Feishu / WeChat / DingTalk / Email 等基于公开协议的接入全部保留。

**理由**：
1. OpenClaw 和 Hermes 都自带 IM 网关，移除等于跟上游分叉
2. 移动 APP 计划通过 IM 网关跟桌面互通，IM 网关是基础设施
3. 用户希望桌宠/聊天软件/手机三端都能跟 Agent 对话

### ADR-002：短期收敛到 OpenClaw，暂缓 Hermes

**背景**：OpenClaw 已深度集成，当前真实风险不在“缺少第二引擎”，而在运行链路、配置同步、IM 网关、桌宠入口是否足够稳定。继续接 Hermes 会扩大复杂度，分散 Phase 2/3 的交付重心。

**决策**：短期只维护 OpenClaw 作为唯一可用 Agent engine。保留 `CoworkEngineRouter` / AgentEngine 常量等边界，但不继续开发 `hermesRuntimeAdapter`，不在 UI 暴露 Hermes。

**理由**：
1. OpenClaw 已经覆盖 Cowork、IM gateway、tool permission、scheduled task 等核心能力
2. 多引擎抽象已达到 checkpoint，足够防止继续硬耦合，不需要为了未来能力过度设计
3. 下一阶段更应该打磨桌宠产品体验和 OpenClaw 运行稳定性
4. Hermes 可以作为远期研究项，等 OpenClaw 体验稳定后再评估

### ADR-003：登录保留但最简化

**背景**：原 alkaka-server / URS 登录依赖网易内网，必须移除；但完全砍掉登录会让多端互通无据可依。

**决策**：保留"本地账号 + 可选云同步标识"概念，移除任何第三方账号依赖。

**理由**：
1. Phase 4 移动端互通需要一个 device-account 标识
2. 不强制登录，对个人用户毫无骚扰
3. 不依赖第三方账号体系，符合"独立"目标

### ADR-004：Skill / MCP 市场先静态化

**背景**：原本通过 `api-overmind.youdao.com` 提供，必须切换。

**决策**：起一个独立 GitHub repo `alkaka-marketplace`，客户端读 `marketplace.json`。先不做带后端的版本。

**理由**：
1. 零运维、社区可 PR、跟版本一起追溯
2. Claude Code 的 plugin marketplace 就是这么做的，证明可行
3. 半年后看社区活跃度再决定要不要升级

### ADR-005：桌宠作为默认主入口，主窗口轻量化

**背景**：当前 OpenClaw / IM / channel 映射到桌面 UI 的基础能力已经存在。继续围绕主窗口工作台加功能，会让产品显得重；用户更希望 Alkaka 是一个轻量、常驻、随手可用的个人助理。

**决策**：下一阶段从“主窗口优先”切换为“桌宠优先”。桌宠负责默认可见入口、快速输入、状态反馈、常用工具；主窗口退为任务历史、复杂任务详情、设置、技能/MCP 管理。

**理由**：
1. 桌宠更符合“个人助理常驻桌面”的产品心智
2. 主窗口已能承载复杂配置和历史，不需要继续作为默认首页加重
3. OpenClaw/IM 能力已经作为底层 runtime 存在，产品差异化应体现在轻量入口和桌面陪伴体验
4. 先做桌宠入口能更早形成可感知的产品特色，再逐步补工具集

---

## 七、开发日志

> 后续每次做完一小步，加一行。

2026-04-28　Phase 3A.5 桌宠 ↔ 主窗口任务跳转 checkpoint
  · `feat/integrate-shimeji-pet` 已合回 `main` 并 push；Shimeji v6 视觉正式进入主线
  · 新增 `petTaskJump` 行为测试：只有带真实 sessionId 的 done/error/needs-approval/working 状态可打开详情，`temp-*` 和 idle/ready/sending 不可打开
  · 桌宠展开面板新增“查看任务”入口；主进程新增 sender-guarded `pet:openCoworkSession`，主窗口收到 `app:openCoworkSession` 后加载对应 Cowork session 并标记来自桌宠
  · 验证：targeted vitest 15 files / 69 tests passed；compile:electron、build、diff-check 通过；真实 OpenClaw gateway `/health` 为 live

```text
2026-04-27　桌宠 v1 上线
  · 透明置顶浮窗、?window=pet 复用 Vite 入口、可拖动、双击开主窗、右键菜单
  · 安全加固：IPC 源校验、窗口导航拦截、生产环境禁 DevTools、托盘恢复入口

2026-04-28　Phase 1（清理 NetEase/Youdao 残留）全部完成
  · 1.1 移除 NIM/POPO/NetEaseBee IM 集成（删 6315 行 / 改 111 文件）
  · 1.2 ~ 1.6 核实其余清理已落地：文档/隐私 URL、Skill/MCP 市场、自动更新、appId、登录系统全部切到 GitHub 或已删
  · 1.7 清死代码：openclawTokenProxy.ts、YouDaoZhiYunIcon.tsx 及对应 export / 测试 mock
  · 启动 electron:dev 实测桌宠窗口正常运行
  · 验证：TS 编译 / build / 634 测试全过

2026-04-28　产出规划文档（本文件）
  · Phase 1-4 详细计划 + ADR-001~004（保留 IM 网关 / 短期收敛到 OpenClaw / 登录最简化 / 静态市场）
  · 修正前轮文档中失实"已完成"标记，与实测代码状态对齐

2026-04-28　Phase 2.1 Agent Engine Router checkpoint 完成
  · 接上 Claude 中断的多引擎 Router 改造：AgentEngine 常量中心、CoworkEngineRouter runtimes map、OpenClaw 默认/fallback
  · 暂不开放 Hermes 真实执行；Hermes 保留为 known engine，supported engines 仅包含 OpenClaw，避免用户选到未接线引擎
  · Review 后补安全修复：GitHub Releases 更新检查不附带 installation uuid/userId，未签名 asset 不自动下载执行
  · 验证：compile:electron / targeted vitest 24 tests / npm run build / git diff --check 全过
  · 已提交并 push 到 kidrauhl123/Alkaka main：52b1f2d

2026-04-28　Phase 2.2 OpenClaw runtime 启动链路 checkpoint
  · 修复 clean host 上 OpenClaw runtime build 的 pnpm/corepack 前置检查顺序；pnpm shim 不存在时先 corepack enable
  · 修复 macOS/Linux 兼容性：patch hash 计算支持 shasum fallback，避免只依赖 sha256sum
  · 收敛启动诊断日志中的 secret/token 输出：环境变量值、MCP bridge secret、gateway --token 全部改为 [REDACTED]
  · 实测：npm run openclaw:runtime:host 通过；npm run electron:dev:openclaw 启动后 OpenClaw gateway 约 12s ready，http://127.0.0.1:18790/health 返回 {"ok":true,"status":"live"}
  · 验证：compile:electron / targeted vitest 24 tests / npm run build / git diff --check 全过

2026-04-28　产品方向 pivot：桌宠优先
  · 确认 OpenClaw/IM 到桌面 UI 的映射已有基础实现，后续不再把它描述成待开发主线
  · 下一阶段改为桌宠主入口 + 主窗口轻量化：桌宠承载日常输入/状态/快捷工具，主窗口退为历史、设置、复杂对话详情
  · 更新 Phase 3 与 ADR-005，避免继续把主窗口做成重型默认工作台
```

---

## 八、可能要改的文件（速查）

> Phase 1 已完成，对应文件清单已落地，不在此重复。下面只列后续 Phase 还要碰的。

### Phase 2 - Agent Engine 边界收敛 / OpenClaw 稳定性
- `src/main/libs/agentEngine/coworkEngineRouter.ts`
- `src/main/libs/agentEngine/types.ts`（保留协议边界）
- `src/main/libs/agentEngine/openclawRuntimeAdapter.ts`（稳定 OpenClaw runtime 适配）
- `src/main/libs/openclawConfigSync.ts`（重点检查配置同步稳定性）
- `src/main/libs/openclawEngineManager.ts`（启动 / 状态 / 错误恢复）
- `src/renderer/components/Settings.tsx`：只展示 OpenClaw 状态/诊断，不开放 Hermes

### Phase 3 - 桌宠工具集
- 新建 `src/main/petToolKit/`（hotkey / selection / screenshot / OCR）
- 新建 `src/renderer/components/pet/PetBubble.tsx`（响应气泡）
- `src/renderer/pet/Pet.tsx`：状态机扩展
- 翻译 API 接入（建议优先 LLM 自身做，不用单独翻译服务）

---

## 九、还需要回答的问题

记下来，后续逐个解决：

1. `alkaka.dev` 域名要不要买？或者先用 GitHub Pages（`<org>.github.io/alkaka`）
2. 移动 APP 用 React Native / Flutter / 原生？Phase 4 再决定
3. 桌宠的"人格"内容由谁提供？默认人格 + 用户自定义（写 SOUL.md）？
4. Hermes 是否还要接入？当前答案：**短期不接**。等 OpenClaw 链路和桌宠体验稳定后，再作为远期研究项重新评估
5. OpenClaw runtime 的真实产品链路还有哪些阻塞？需要优先跑通 `electron:dev:openclaw`、本地 Cowork、IM 消息触发、错误恢复
