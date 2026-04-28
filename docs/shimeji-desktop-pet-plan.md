# Shimeji Desktop Pet Implementation Plan

> **For Hermes:** Use `shimeji-desktop-pet`, `test-driven-development`, and `subagent-driven-development` when implementing this plan task-by-task.

**Goal:** Turn Alkaka's pet window from a static mascot/status widget into a true Shimeji-style desktop companion: sprite/pose frames + behavior state machine + desktop/window spatial interaction + user customization.

**Architecture:** Keep pet work isolated from OpenClaw/Cowork runtime. Build a pure, deterministic Shimeji core first, then connect it to the React pet renderer and later to Electron screen/window APIs. Treat visuals as frame assets/pose rigs, not as one polished logo or single SVG.

**Tech Stack:** Electron, React, TypeScript, Vite, Vitest, CSS/SVG initially, later PNG sprite sheets / atlas metadata.

---

## 1. What “Real Shimeji” Means

A real Shimeji is not a cute static mascot. It is a small desktop character that behaves as if it lives on the screen.

Core formula:

```text
small transparent sprite/pose frames
+ explicit action/frame plan
+ autonomous behavior scheduler
+ spatial world simulation
+ desktop/window edge interaction
+ drag/fall/climb/hang/playful reactions
```

### Essential behaviors

| Behavior | Meaning | Visual implication |
|---|---|---|
| idle / blink | stand, breathe, occasionally blink | small loop, not full-body sliding |
| walk | move on ground with alternating foot frames | at least 4 frames or distinct steps |
| sit / think | pause, squat/sit, maybe look upward | distinct body pose |
| sleep | curl/lie down | distinct curled pose |
| drag | lifted by mouse | dangling / grabbed pose, not just moved image |
| fall | gravity after release or off edge | tumble / falling pose |
| climb | move up side edge/window edge | arms reaching / pulling frames |
| hang | dangle from top/edge | vertical hanging pose |
| react | permission/error/done feedback | emotion/face variants layered over action |

### Important visual truth

A single front-facing SVG with CSS transform can prove architecture, but it will still feel like a sticker. True Shimeji requires either:

1. **Sprite-sheet path** — best authenticity: each action has actual image frames.
2. **Rigged SVG path** — acceptable intermediate: head/body/arms/legs/tail are separate parts and each pose changes body geometry, not just whole-character transform.

The current implementation is an architecture scaffold, not the final visual result.

---

## 2. Reference Research Summary

### Repositories / reference families checked

GitHub repository search surfaced these relevant references:

| Reference | Notes |
|---|---|
| `pixelomer/Shijima-Qt` | Shimeji desktop pet runner; useful for cross-platform runner concepts. |
| `gil/shimeji-ee` | Shimeji-ee fork, focused on compatibility; useful as canonical Shimeji-ee lineage reference. |
| `DalekCraft2/Shimeji-Desktop` | Java/JDK port preserving backward compatibility; useful for legacy behavior model. |
| `jabbany/ShimejiHTML5` | Web/page mascot port; relevant because Alkaka renderer is web-based. |
| `TigerHix/shimeji-ee`, `TigerHix/shimeji-universal` | Shimeji-ee variants; useful for config/action lineage. |
| `CharlesWiiFlowers/MikuPet` | Modern virtual desktop pet reference; useful for desktop-pet UX. |

### Reference takeaways

1. Shimeji implementations are built around **actions**, not app statuses.
2. Character packs normally imply an **asset manifest**: actions map to frame sequences and durations.
3. Desktop behavior is spatial: ground, gravity, side edges, top edge, window edge, drag/release.
4. Visual frames are not optional for authenticity. Behavior without real frames becomes a sliding sticker.
5. A web/Electron implementation should separate:
   - behavior core
   - asset/frame manifest
   - renderer
   - Electron desktop adapter

---

## 3. Current State in `ermei/phase3-pet-frontend`

Existing commits on the isolated branch:

```text
306384b feat: scaffold pet status bubble UI
56955f5 feat: add customizable shimeji pet character
ad88e5c feat: refine shimeji pet character art
2fd0b92 feat: add shimeji sprite behavior renderer
93bfe0f feat: add shimeji world behavior demo
9470236 feat: add shimeji autonomous behavior scheduler
```

### Already implemented

| Area | Status |
|---|---|
| Pet status presentation | Done: `petStatus.ts`, `PetBubble`, `PetStatusBadge` |
| Appearance customization | Done: species/name/colors/accessory query parsing |
| Action/frame model | Done: `ShimejiAction`, `ShimejiPose`, `ShimejiFramePlan` |
| Frame advancement | Done: `advanceShimejiFrame` |
| Renderer scaffold | Done: `ShimejiSprite` with `data-shimeji-action` / `data-shimeji-pose` |
| World physics scaffold | Done: walk, edge bounce, fall, climb, hang, drag |
| Autonomous scheduler | Done: idle/walk/sit/sleep/climb/fall/hang switching |
| Preview mode | Done: `petDemo=shimeji`, `petBehavior=auto` |

### Current limitations

1. Visuals are still mostly one SVG character with pose classes.
2. Poses are not true per-frame character art.
3. Electron production mode is not yet driven by real screen/work-area bounds.
4. No sprite-sheet loader or asset manifest yet.
5. No debug/inspector UI for action/frame/world state.
6. No persistence of customization settings.
7. No integration with real OpenClaw/Cowork task lifecycle yet; intentionally avoided to prevent conflict with Sabrina.

---

## 4. Target Architecture

```text
src/renderer/types/pet.ts
  PetStatus
  PetAppearance
  ShimejiAction / Pose / Frame

src/renderer/utils/shimejiBehavior.ts
  frame plan
  action -> frame loop
  app status -> suggested action

src/renderer/utils/shimejiWorld.ts
  deterministic spatial state
  tick: walk/fall/climb/hang/drag

src/renderer/utils/shimejiScheduler.ts
  autonomous behavior selection
  idle/walk/sit/sleep/climb/fall/hang

src/renderer/utils/shimejiAssets.ts      [planned]
  load/validate asset manifest
  action -> sprite frame metadata

src/renderer/components/pet/ShimejiSprite.tsx
  action/frame controller
  renders selected frame/pose

src/renderer/components/pet/ShimejiFrameRenderer.tsx [planned]
  renders PNG sprite frame or SVG rig frame

src/renderer/components/pet/PetDebugPanel.tsx [planned]
  action selector, frame index, world coords, hitboxes

src/main/petWindowController.ts / existing pet window main files [planned after coordination]
  screen bounds
  always-on-top transparent window
  real Electron move/resize/window-edge APIs
```

Key rule: **Behavior core must remain pure TypeScript and unit-tested. Electron APIs belong only at the adapter boundary.**

---

## 5. Roadmap

### Phase S0 — Research and planning baseline

**Status:** This document.

Deliverables:
- Shimeji reference summary.
- Architecture separation.
- Explicit gap list.
- Phased roadmap.

Acceptance:
- A developer can explain why current scaffold is not final Shimeji.
- A developer knows what to build next without guessing.

---

### Phase S1 — Formal sprite asset manifest

**Goal:** Stop hardcoding pose semantics inside CSS/SVG only. Define a character pack format.

Files:
- Create: `src/renderer/utils/shimejiAssets.ts`
- Create: `src/renderer/utils/shimejiAssets.test.ts`
- Modify: `src/renderer/types/pet.ts`

Manifest shape:

```ts
interface ShimejiAssetFrame {
  id: string;
  action: ShimejiAction;
  pose: ShimejiPose;
  durationMs: number;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
}

interface ShimejiCharacterPack {
  id: string;
  displayName: string;
  frameSize: number;
  spriteSheetUrl: string;
  frames: ShimejiAssetFrame[];
}
```

TDD acceptance:
- rejects packs missing required actions
- rejects frames with invalid duration/size
- groups frames by action in stable order
- computes CSS `background-position` from frame coordinates

---

### Phase S2 — Debug/preview panel

**Goal:** Make behavior observable and tunable.

Files:
- Create: `src/renderer/components/pet/PetDebugPanel.tsx`
- Create tests if component testing infra exists; otherwise keep core logic tested and visually verify.
- Modify: `PetView.tsx`
- Modify: `index.css`

Debug URL params:

```text
petDebug=1
petAction=walk|idle|sit|fall|drag|climb|hang|sleep
petBehavior=auto|manual
petShowBounds=1
```

Acceptance:
- developer can force any action
- developer can pause/resume frame loop
- developer can see action, pose, frame index, x/y, vx/vy, direction
- visual hitbox/bounds can be toggled

---

### Phase S3 — Replace SVG-transform poses with true frame renderer

**Goal:** Move from sticker-like CSS transforms to real frame rendering.

Two implementation options:

#### Option A: Sprite sheet renderer

Preferred for authenticity.

Files:
- Create: `src/renderer/components/pet/ShimejiFrameRenderer.tsx`
- Create: `src/renderer/assets/pets/default-cat/manifest.ts`
- Add sprite sheet image under assets when actual art exists.

Renderer uses:

```css
background-image: url(...);
background-position: -x -y;
width: frameSize;
height: frameSize;
```

#### Option B: Rigged SVG renderer

Temporary if sprite art is not ready.

Requirements:
- split head/body/arms/legs/tail into independently transformed groups
- pose-specific transforms for limbs/body/head
- no whole-character-only transform for special poses

Acceptance:
- walk frames visibly change legs/arms/body, not only slide
- drag pose has lifted/dangling body
- fall pose rotates/tumbles separately from movement
- climb/hang poses are vertical and edge-anchored

---

### Phase S4 — Real Electron desktop adapter

**Goal:** Use real screen/work-area bounds instead of web preview viewport only.

Files to inspect before touching:
- `src/main/*pet*`
- `src/main/window*`
- `src/main/preload*`
- existing pet preload APIs

Planned adapter responsibilities:
- get current display work area
- keep transparent always-on-top pet window sized to frame/hitbox
- move window according to world state
- detect screen edges
- support drag/release -> fall
- avoid interfering with OpenClaw/Cowork windows

Acceptance:
- pet walks on actual desktop bottom edge
- releasing drag in mid-air falls to ground
- side edge can trigger climb
- top edge can trigger hang
- no OpenClaw runtime/gateway changes in this phase

---

### Phase S5 — Customization and persistence

**Goal:** Turn query parameters into product settings.

Files likely involved:
- renderer settings UI
- local storage or app config bridge
- pet launch path

Settings:
- species / pack
- name
- body/accent/eye colors if rigged renderer
- accessory
- behavior intensity: calm / normal / chaotic
- enable/disable autonomous behavior

Acceptance:
- settings survive app restart
- pet window reads settings on launch
- defaults still work without config

---

### Phase S6 — Agent/Cowork integration

**Goal:** Map real Alkaka/OpenClaw lifecycle to Shimeji behavior.

Only do after Sabrina's OpenClaw/Cowork work is stable or after coordination.

Mapping draft:

| App event | Shimeji response |
|---|---|
| idle/no task | idle, sit, sleep random |
| user opens quick input | attention / listening |
| task running | walk / think / work loop |
| permission needed | hang / attention / urgent bubble |
| error | fall / dizzy / red bubble |
| done | jump / wave / happy |
| long task | periodic check-in animation |

Acceptance:
- no direct coupling from pet UI to OpenClaw internals
- use a narrow status/event channel
- keep fallback behavior if agent engine is offline

---

## 6. Implementation Discipline

For each code phase:

1. Write failing Vitest first.
2. Run specific test and confirm RED.
3. Implement minimal code.
4. Run specific test and confirm GREEN.
5. Run full pet-related tests.
6. Run lint, typecheck, build.
7. Browser verify with `petDemo=shimeji`.
8. Commit on `ermei/phase3-pet-frontend`.
9. Never write to `/Users/zuiyou/github/Alkaka` while Sabrina may be working there.

Standard verification command:

```bash
npx vitest run src/renderer/utils/shimeji*.test.ts src/renderer/utils/pet*.test.ts
npx eslint src/renderer/main.tsx src/renderer/components/pet/*.tsx src/renderer/utils/shimeji*.ts src/renderer/utils/pet*.ts
npx tsc --noEmit
npm run build
```

Browser preview:

```text
http://127.0.0.1:5185/?window=pet&petDemo=shimeji&petBehavior=auto&petDebug=1
```

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Looks like sliding sticker | Prioritize real frames / rigged limbs before more status UI |
| Overcouples to OpenClaw | Keep event/status adapter narrow; delay integration |
| Hard to debug behavior | Build debug panel before more physics complexity |
| Conflicts with Sabrina | Continue isolated worktree; do not touch main repo |
| Sprite art becomes blocker | Support manifest with placeholder frames first; replace art later |
| Pet window becomes annoying | Add calm/normal/chaotic behavior intensity and disable auto mode |

---

## 8. Immediate Next Tasks

### Task 1: Add sprite asset manifest model

**Objective:** Define and validate character pack metadata.

**Files:**
- Create: `src/renderer/utils/shimejiAssets.test.ts`
- Create: `src/renderer/utils/shimejiAssets.ts`
- Modify: `src/renderer/types/pet.ts`

**Verification:**

```bash
npx vitest run src/renderer/utils/shimejiAssets.test.ts
```

### Task 2: Add debug panel

**Objective:** Make current behavior observable in the browser preview.

**Files:**
- Create: `src/renderer/components/pet/PetDebugPanel.tsx`
- Modify: `src/renderer/components/pet/PetView.tsx`
- Modify: `src/renderer/main.tsx`
- Modify: `src/renderer/index.css`

**Verification:**

```text
http://127.0.0.1:5185/?window=pet&petDemo=shimeji&petBehavior=auto&petDebug=1
```

### Task 3: Replace whole-SVG pose transforms for one action

**Objective:** Prove one action can have true pose differences.

Start with `walk`:
- left foot forward
- neutral step
- right foot forward
- turn step

Acceptance:
- screenshot/vision confirms visible body/limb differences
- DOM sampling confirms frame cycling

---

## 9. Definition of Done for “Actually Shimeji Enough”

Minimum bar before claiming it is a real Shimeji-like desktop pet:

- [ ] Has explicit action/frame/pose model.
- [ ] Has autonomous scheduler.
- [ ] Has spatial world state with walking/falling/dragging/climbing/hanging.
- [ ] Has real frame renderer or sufficiently rigged per-limb poses.
- [ ] Has at least 4 visually distinct walking frames.
- [ ] Has distinct drag/fall/climb/hang/sleep poses.
- [ ] Runs in actual Electron pet window using screen bounds.
- [ ] Supports user customization without query-string hacks.
- [ ] Passes tests/lint/typecheck/build.
- [ ] Does not depend on OpenClaw being online.

Current state satisfies the first three bullets only partially and does **not** yet satisfy the visual authenticity bar.
