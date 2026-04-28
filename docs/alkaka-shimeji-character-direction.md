# Alkaka Shimeji Character Direction v1

> Scope: 二妹只负责桌宠形象、动作帧、sprite asset pipeline。九妹负责功能入口、前端交互、Electron pet window、quick input。本文和配套资产不修改 `PetView.tsx` / `petWindow.ts` / `petPreload.ts`。

## 1. Design Goal

Alkaka 桌宠要从“应用 logo / mascot”变成 true Shimeji-style desktop companion：

- 小尺寸透明 sprite，适合悬浮在桌面上。
- 动作帧比单张精修更重要。
- 每个动作要有可读的身体姿态变化，而不是整张图平移/旋转。
- 角色需要有稳定的身份特征，方便未来用户自定义颜色/饰品/物种。

## 2. Character Concept

**Name:** Alkaka Shimeji / 小咔

**Species:** soft fox-cat desktop spirit

**Visual Keywords:**

- cream body / warm outline / orange inner ears / blue core gem
- big head, tiny body, clear silhouette
- rounded paws and curled tail
- small “assistant core” gem on chest, representing Alkaka task/agent identity
- reads well at 64–128px

## 3. Shape Language

### Body Proportion

- Frame: 128×128 transparent.
- Head/body blob occupies roughly 58×78 px.
- Anchor point: `(64, 116)`, near floor contact shadow.
- Head-to-body feeling: about 70% head, 30% limbs/tail.

### Silhouette Rules

- Ears must remain visible in most upright poses.
- Tail should create asymmetry so walking direction is readable.
- Chest gem should remain visible in idle/walk/sit, but may rotate/disappear in fall/hang.
- Drag/hang/fall can break upright silhouette; these are required for Shimeji authenticity.

## 4. Palette

| Token | Color | Use |
| --- | --- | --- |
| body | `#ffefd6` | main fur/body |
| body-highlight | `#fff8e8` | belly/highlight |
| outline | `#58392a` | warm brown outline |
| accent | `#f97316` | nose / warm Alkaka accent |
| accent-soft | `#ffc679` | inner ears / tail highlight |
| core | `#60a5fa` | chest gem / agent-core identity |
| eye | `#27251f` | eyes |
| cheek | `#ffa5ae` @ 55% | cheeks |

## 5. Required Action Frames

The v1 concept pack contains 13 frames:

| id | action | pose | duration | Notes |
| --- | --- | --- | ---: | --- |
| idle-stand-soft | idle | stand-soft | 420ms | baseline standing pose |
| idle-stand-blink | idle | stand-blink | 180ms | blink frame, avoids static idle |
| walk-left-step | walk | walk-left-step | 120ms | body leans left, opposite paws swing |
| walk-mid-step | walk | walk-mid-step | 120ms | center passing frame |
| walk-right-step | walk | walk-right-step | 120ms | body leans right, opposite paws swing |
| walk-turn-step | walk | walk-turn-step | 120ms | transition/turn frame |
| sit-thinking | sit | sit-thinking | 360ms | squat body, paws open |
| fall-tumble | fall | fall-tumble | 120ms | rotated body, scattered limbs |
| drag-lifted | drag | drag-lifted | 180ms | lifted upward, no floor shadow |
| climb-reach | climb | climb-reach | 140ms | body on side, arms reaching |
| climb-pull | climb | climb-pull | 140ms | pull-up phase |
| hang-dangle | hang | hang-dangle | 320ms | inverted/dangling pose |
| sleep-curl | sleep | sleep-curl | 520ms | curled/squashed body, closed eyes |

## 6. Deliverables Created

```text
public/pets/alkaka-shimeji/alkaka-shimeji-atlas.svg
public/pets/alkaka-shimeji/alkaka-shimeji-contact-sheet.svg
public/pets/alkaka-shimeji/alkaka-shimeji-concept-v1.json
```

### Atlas

`alkaka-shimeji-atlas.svg` is a transparent 13-frame horizontal atlas:

```text
1664 × 128 = 13 frames × 128px
```

This is still concept art, not final polished production PNG. It exists to give 九妹 a concrete manifest-backed visual pack that can be wired into her frontend work later.

### Contact Sheet

`alkaka-shimeji-contact-sheet.svg` is for human review. It shows the same frames in a 4-column grid with action labels.

### Manifest

`alkaka-shimeji-concept-v1.json` follows the current `ShimejiCharacterPack` schema:

- `frameSize: 128`
- `spriteSheetUrl: /pets/alkaka-shimeji/alkaka-shimeji-atlas.svg`
- `anchorX: 64`
- `anchorY: 116`
- all required Shimeji actions included

## 7. Integration Boundary for 九妹

九妹 can integrate this later without taking 二妹's UI code by using the asset pack only:

```text
GET /pets/alkaka-shimeji/alkaka-shimeji-concept-v1.json
GET /pets/alkaka-shimeji/alkaka-shimeji-atlas.svg
```

Recommended product integration should happen in 九妹's functional/frontend branch, not in 二妹's branch, because 九妹 owns:

- `PetView.tsx`
- quick input behavior
- pet window sizing / expansion
- Electron bridge

## 8. Next Visual Tasks

1. Replace concept SVG drawing with hand-polished PNG or vector frames.
2. Add expression variants for:
   - happy idle
   - confused thinking
   - focused working
   - error dizzy/fall
3. Add accessory overlays:
   - ribbon
   - bell
   - star
4. Produce color-customizable variants or layered assets.
5. Add export script for PNG atlas once image tooling is available.

## 9. Definition of Done for Final Art

- Every action has visually distinct body posture.
- Walking does not look like sliding.
- Drag/fall/climb/hang are non-upright and readable.
- Character remains recognizable across all frames.
- Contact sheet is reviewed visually before integration.
- Manifest validates against `validateShimejiCharacterPack`.
- No changes required in function/frontend entry files owned by 九妹.
