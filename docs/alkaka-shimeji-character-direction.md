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

**Species:** hornless hooded desktop companion template

**Visual Keywords:**

- restrained warm-gray body / dark warm outline / subtle blue core gem
- no top horns and no top ear-like protrusions
- smooth hood-like head silhouette with only low side panels if a lateral accent is needed
- compact desktop companion, not a baby mascot
- intelligent, slightly aloof, quietly capable expression
- readable tail/paws and action silhouettes, but avoid oversized eyes, heavy blush, candy colors, infant proportions, or horn/ear shapes on top of the head
- small “assistant core” gem on chest, representing Alkaka task/agent identity
- reads well at 64–128px
- template-ready parts so users can generate many custom Shimeji appearances

## 3. Shape Language

### Body Proportion

- Frame: 128×128 transparent.
- Head/body blob occupies roughly 58×78 px.
- Anchor point: `(64, 116)`, near floor contact shadow.
- Head-to-body feeling: about 70% head, 30% limbs/tail.

### Silhouette Rules

- The top of the egg body must stay open/smooth: remove the two triangular horn/ear shapes, but do not replace them with a filled hood, helmet, cap, or separate head mass.
- Keep the original restrained egg silhouette as the baseline.
- Tail/back accent should create asymmetry so walking direction is readable.
- Chest gem should remain visible in idle/walk/sit, but may rotate/disappear in fall/hang.
- Drag/hang/fall can break upright silhouette; these are required for Shimeji authenticity.
- Custom species variants must preserve frame anchors and action readability instead of randomly changing the whole body.

## 4. Palette

| Token | Color | Use |
| --- | --- | --- |
| body | `#e8dcc8` | restrained warm-gray fur/body |
| body-highlight | `#f3eadb` | subtle belly/highlight |
| outline | `#4a3428` | dark warm outline |
| accent | `#9a5a33` | nose / muted warm accent |
| accent-soft | `#b77b54` | inner ears / tail tone |
| core | `#3b82f6` | subtle chest gem / agent-core identity |
| eye | `#1f242b` | smaller calmer eyes |
| cheek | avoid by default | no heavy blush; keep expression mature |

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
public/pets/alkaka-shimeji/alkaka-shimeji-atlas-v2.svg
public/pets/alkaka-shimeji/alkaka-shimeji-contact-sheet-v2.svg
public/pets/alkaka-shimeji/alkaka-shimeji-concept-v2.json
public/pets/alkaka-shimeji/alkaka-shimeji-atlas-v3.svg
public/pets/alkaka-shimeji/alkaka-shimeji-contact-sheet-v3.svg
public/pets/alkaka-shimeji/alkaka-shimeji-concept-v3.json
public/pets/alkaka-shimeji/alkaka-shimeji-atlas-v4.svg
public/pets/alkaka-shimeji/alkaka-shimeji-contact-sheet-v4.svg
public/pets/alkaka-shimeji/alkaka-shimeji-concept-v4.json
docs/shimeji-template-customization-plan.md
```

### Atlas

`alkaka-shimeji-atlas.svg` is a transparent 13-frame horizontal atlas:

```text
1664 × 128 = 13 frames × 128px
```

This is still concept art, not final polished production PNG. It exists to give 九妹 a concrete manifest-backed visual pack that can be wired into her frontend work later.

`v2` is the preferred direction after user feedback: less babyish / less overtly moe, with muted colors, smaller calmer eyes, no cheek blush, and a more competent desktop-companion personality.

`v3` explored a smooth hooded head, but that was rejected because it changed the original egg-like character too much.

`v4` is now the preferred silhouette correction: it keeps the original restrained egg-shaped v2 body and removes only the two disliked top horn/ear triangles. Do not fill the top into a hood/helmet/head cap. This version still records `templateTokens` so it can seed future user-customizable Shimeji templates.

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
