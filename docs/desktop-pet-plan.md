# Alkaka 开发计划与日志

> 这个文档不是正式 PRD，是单人开发（有老师指导）的轻量备忘录。
> 记录想做什么、先做什么、暂时不做什么、当前进度到哪里。

---

## 一、项目愿景

把 Alkaka 从一个"完整桌面工作台"，逐步改造成**以桌宠为主形态、以 AI Agent 为内核、支持多端互通的个人助理**。

最终形态由四个层次组成：

```
┌──────────────────────────────────────────────────┐
│  桌宠（主入口，常驻桌面）                         │
│  ─ 浮窗 + 状态展示 + 划词/截图/快速对话           │
├──────────────────────────────────────────────────┤
│  主窗口（设置 + 任务记录 + 复杂 Cowork）          │
├──────────────────────────────────────────────────┤
│  IM 网关（多端互通的核心）                        │
│  ─ Telegram / Discord / Feishu / 微信 / DingTalk │
│  ─ 未来 Alkaka 手机 APP 也通过此层跟桌面端通信    │
├──────────────────────────────────────────────────┤
│  Agent 内核（可插拔双引擎）                      │
│  ─ OpenClaw：IM 多通道 + 工作流派                 │
│  ─ Hermes：自学习 + 持久记忆 + 陪伴派             │
└──────────────────────────────────────────────────┘
```

### 关键定位决策

- **桌宠是主形态**，但不取代主窗口；主窗口承担复杂操作。
- **IM 网关是核心而非冗余**——它是多端互通的基础设施。桌面、移动 APP、聊天软件都通过它跟 Agent 对话。
- **Agent 内核可插拔**——OpenClaw 已经集成，Hermes 后续作为第二引擎接入。让用户在"工作流"和"陪伴成长"两种性格之间选。
- **登录保留最简版**——纯本地账号 + 可选云端同步标识。不强制登录、不依赖任何第三方账号体系。
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
| `agentEngineProtocol` | 抽象 OpenClaw / Hermes 共用接口 | 计划 |
| `hermesRuntimeAdapter` | Hermes 适配器 | 计划 |
| `petToolKit` | 桌宠工具集（划词翻译、截图、OCR） | 计划 |
| `simpleAuth` | 最简本地账号 + 可选云同步 | 计划 |
| `alkaka-marketplace` | 静态 skill / MCP 市场（独立 GitHub repo） | 计划 |
| 移动端 push relay | 桌面/手机互通的轻量后端 | 远期 |

---

## 三、当前真实进度

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
- **2026-04-28** Agent Engine 选型调研：确认 OpenClaw + Hermes 双引擎方向（ADR-002）
- **2026-04-28** 产出本规划文档：Phase 1-4 详细计划 + ADR-001~004

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

### Phase 2：Agent Engine 协议化（预计 1-2 周）

目标：把 OpenClaw 从"硬编码内核"抽象成"可替换适配器"，为接入 Hermes 铺路。

| # | 任务 | 工作量 |
|---|------|--------|
| 2.1 | 把 `openclawRuntimeAdapter` 的接口提炼成 `AgentEngineProtocol` | 2 天 |
| 2.2 | 接入 Hermes 作为第二引擎（PoC：先跑通基本对话 + tool use） | 4-5 天 |
| 2.3 | 设置里加引擎切换 UI + 引擎能力差异说明 | 1 天 |
| 2.4 | 双引擎跑通 IM 网关（验证两个 engine 都能通过同一套 IM gateway 对外） | 2 天 |

**关键设计原则**：
- Agent Engine 接口要做窄，只暴露 `startSession / streamMessage / requestPermission / stopSession` 这种核心能力
- 引擎特定的高级特性（Hermes 的 self-improvement、OpenClaw 的 IM 网关插件）通过 capability 探测暴露
- 配置 schema 支持 per-engine 特性，不强行统一

---

### Phase 3：桌宠工具集（预计 2-3 周）

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
| 3.1 | 全局热键系统 + 选区文本捕获 | 2 天 |
| 3.2 | 划词翻译（直接调翻译 API） | 1 天 |
| 3.3 | 划词提问（接 Agent） | 2 天 |
| 3.4 | 桌宠气泡 UI（响应展示框，可定位、可消失、可转主窗口） | 3 天 |
| 3.5 | 截图问答（多模态） | 3 天 |
| 3.6 | OCR | 2 天 |
| 3.7 | 状态展示动画（思考中/工作中/等待权限/出错） | 3 天 |

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
- 完全重做主界面 UI
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

### ADR-002：双引擎架构（OpenClaw + Hermes）

**背景**：OpenClaw 已深度集成；Hermes 在持久记忆 / 自学习上更契合桌宠陪伴场景。

**决策**：抽象 `AgentEngineProtocol` 层，让两者作为可插拔后端共存，用户在设置里选。

**理由**：
1. OpenClaw 适合工作流类任务、IM 多通道
2. Hermes 适合陪伴成长类场景（桌宠灵魂）
3. 不同用户偏好不同；强行二选一会丢一半场景
4. 已有的 `coworkEngineRouter.ts` 已经在做引擎抽象，扩展成本可控

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

---

## 七、开发日志

> 后续每次做完一小步，加一行。

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
  · Phase 1-4 详细计划 + ADR-001~004（保留 IM 网关 / 双引擎 OpenClaw+Hermes / 登录最简化 / 静态市场）
  · 修正前轮文档中失实"已完成"标记，与实测代码状态对齐
```

---

## 八、可能要改的文件（速查）

> Phase 1 已完成，对应文件清单已落地，不在此重复。下面只列后续 Phase 还要碰的。

### Phase 2 - Agent Engine 协议化
- `src/main/libs/agentEngine/coworkEngineRouter.ts`
- `src/main/libs/agentEngine/types.ts`（新建 `AgentEngineProtocol`）
- `src/main/libs/agentEngine/openclawRuntimeAdapter.ts`（按协议改造）
- 新建 `src/main/libs/agentEngine/hermesRuntimeAdapter.ts`
- `src/main/libs/openclawConfigSync.ts`（重命名为通用 engine config sync）
- `src/renderer/types/cowork.ts`：增加 `agentEngine: 'openclaw' | 'hermes'`
- `src/renderer/components/Settings.tsx`：引擎切换 UI

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
4. Hermes 接入时 license 兼容性需要确认（MIT / Apache 应该都没问题，但用户输入数据怎么处理要写清楚）
5. 双引擎并行还是互斥？如果用户同时装了 OpenClaw + Hermes runtime，资源占用要评估
