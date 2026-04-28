# Shimeji Template Customization Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make Alkaka desktop pets work like Shimeji character packs: one reusable template can generate many user-customized character appearances without rewriting behavior or UI code.

**Architecture:** Separate the pet into three layers: behavior actions, frame template geometry, and user appearance tokens. The renderer consumes a generated `ShimejiCharacterPack`; users customize token values such as body color, accent color, eye color, accessory, species/silhouette, and name. Each tokenized template can be exported into an atlas + manifest, so 九妹 only needs to load packs rather than hard-code new characters.

**Tech Stack:** TypeScript manifest model, JSON template schema, SVG concept atlas generation first, optional PNG/pixel-art export later.

---

## Design Direction

The current preferred Alkaka direction is v4:

- keep the original restrained egg-like body silhouette;
- remove only the two top horn/ear triangles;
- do not fill the top into a hood, helmet, cap, or separate head shape;
- restrained warm-gray palette;
- smaller calmer eyes;
- no cheek blush;
- still Shimeji-readable through action frames rather than mascot cuteness.

The goal is not one fixed character. The goal is a **template family** that can generate many packs:

```text
Behavior pack  -> idle/walk/sit/fall/drag/climb/hang/sleep
Frame template -> 13+ pose drawings with named replaceable parts
User tokens    -> colors/species/name/accessory/personality
Generated pack -> atlas.svg/png + manifest.json
```

## Core Idea: Tokenized Frame Template

A template is not just a color palette. It is a reusable pose rig where every frame has stable named parts.

Example part layers:

```text
shadow
body
head
side_panels
face
eyes
arms
legs
tail_or_back_shape
core_gem
accessory
```

Each frame keeps the same action/pose semantics, but the visible parts read from tokens:

```json
{
  "bodyColor": "#e4dacb",
  "outlineColor": "#3f312a",
  "accentColor": "#8f684e",
  "eyeColor": "#2b2522",
  "coreColor": "#62a6c6",
  "species": "hooded-companion",
  "accessory": "none"
}
```

## Proposed Schema

Create a template file separate from generated packs:

```text
public/pets/templates/alkaka-hornless-template-v1.json
```

```ts
export interface ShimejiTemplateTokenDefinition {
  id: string;
  label: string;
  type: 'color' | 'enum' | 'string';
  defaultValue: string;
  allowedValues?: string[];
}

export interface ShimejiTemplateLayer {
  id: string;
  role: 'body' | 'outline' | 'accent' | 'eyes' | 'core' | 'accessory';
  tokenBindings: Record<string, string>;
  visibleWhen?: Record<string, string>;
}

export interface ShimejiTemplateFrame {
  id: string;
  action: ShimejiAction;
  pose: ShimejiPose;
  durationMs: number;
  anchorX: number;
  anchorY: number;
  layers: ShimejiTemplateLayer[];
}

export interface ShimejiCharacterTemplate {
  id: string;
  displayName: string;
  frameSize: number;
  requiredActions: ShimejiAction[];
  tokens: ShimejiTemplateTokenDefinition[];
  frames: ShimejiTemplateFrame[];
}
```

For the first implementation, layers can point to SVG symbols or generated SVG path groups. Later, the same schema can drive PNG/pixel-art export.

## User Customization Model

A user-created appearance should be tiny and shareable:

```json
{
  "templateId": "alkaka-hornless-template-v1",
  "name": "Kaka Night",
  "tokens": {
    "bodyColor": "#d8d1c7",
    "outlineColor": "#302824",
    "accentColor": "#6f625a",
    "eyeColor": "#201c1a",
    "coreColor": "#72b8d6",
    "species": "hooded-companion",
    "accessory": "small-scarf"
  }
}
```

Then a generator resolves it into:

```text
public/pets/generated/<slug>/atlas.svg
public/pets/generated/<slug>/contact-sheet.svg
public/pets/generated/<slug>/manifest.json
```

The manifest remains compatible with `ShimejiCharacterPack`, so the pet runtime does not care whether the pack came from hand-drawn art or a generated template.

## Species Strategy

Avoid letting `species` randomly rewrite the whole pose set. That causes inconsistent animation. Instead, define species as a controlled silhouette preset:

```text
hooded-companion  -> original egg body, top horn triangles removed, no hood fill
cat-like          -> optional low rounded side hints, not top horns
bot-orb           -> smooth egg body, no tail, core emphasized
fox-like          -> tail shape changes, body stays egg-like unless selected
```

Each species preset maps only a few layers:

```text
head side panels
tail/back shape
hands/feet shape
accessory slots
```

Actions and anchors stay the same.

## Accessory Strategy

Accessories should be separate overlay layers so they do not require redrawing every frame:

```text
none
small-scarf
side-pin
tiny-backpack
visor
```

Rules:

- accessories cannot cover the eyes/core in tiny size;
- accessories must have a defined anchor per pose group;
- accessories are optional layers in template frames;
- if an accessory lacks a pose-specific anchor, fallback to the action-level anchor.

## Implementation Plan

### Task 1: Add template schema types

**Objective:** Add pure TypeScript types for tokenized Shimeji templates without touching pet UI files.

**Files:**
- Modify: `src/renderer/types/pet.ts`
- Test: `src/renderer/utils/shimejiTemplate.test.ts`

**Steps:**
1. Write failing tests for required token defaults and required action coverage.
2. Add `ShimejiCharacterTemplate`, `ShimejiTemplateFrame`, and token types.
3. Add validator utilities in `src/renderer/utils/shimejiTemplate.ts`.
4. Run targeted tests.
5. Commit.

### Task 2: Add a hornless Alkaka template fixture

**Objective:** Store the v3 hornless design as a reusable template fixture.

**Files:**
- Create: `public/pets/templates/alkaka-hornless-template-v1.json`
- Test: `src/renderer/utils/shimejiTemplate.test.ts`

**Steps:**
1. Create the fixture with color/species/accessory tokens.
2. Ensure it covers all required Shimeji actions.
3. Validate JSON parse and required fields.
4. Commit.

### Task 3: Build template-to-pack generator

**Objective:** Convert a template + appearance tokens into a `ShimejiCharacterPack` manifest.

**Files:**
- Create: `src/renderer/utils/shimejiTemplateGenerator.ts`
- Test: `src/renderer/utils/shimejiTemplateGenerator.test.ts`

**Steps:**
1. Write tests for token fallback, token override, deterministic generated pack id, and frame preservation.
2. Implement generator with no DOM dependency.
3. Verify generated pack passes existing `validateShimejiCharacterPack`.
4. Commit.

### Task 4: Add SVG atlas export script

**Objective:** Generate atlas/contact-sheet/manifest assets from a template without touching runtime UI.

**Files:**
- Create: `scripts/generate-shimeji-pack.mjs`
- Create generated demo under `public/pets/generated/`

**Steps:**
1. Input: template JSON + appearance JSON.
2. Output: atlas.svg + contact-sheet.svg + manifest.json.
3. Validate output JSON and SVG parse.
4. Commit.

### Task 5: Handoff to 九妹

**Objective:** Give 九妹 a stable runtime contract.

**Files:**
- Modify: `docs/shimeji-template-customization-plan.md`

**Steps:**
1. Document that 九妹 only needs to load the generated `manifest.json` as `ShimejiCharacterPack`.
2. Keep PetView/petWindow/quickTask ownership with 九妹.
3. Commit.

## Important Boundary

二妹 should continue to work only in docs/assets/template utilities unless explicitly asked otherwise. Do not modify these 九妹-owned functional files from this workstream:

```text
src/renderer/components/pet/PetView.tsx
src/main/petWindow.ts
src/main/petPreload.ts
src/renderer/components/pet/petQuickTask.ts
src/renderer/index.css
```

## Immediate v3 Asset Deliverable

The current visual-only v4 deliverable fixes the silhouette correction narrowly: it keeps the v2 egg-shaped character and removes only the disliked top horn/ear triangles. It does **not** fill the head into a hood/helmet shape:

```text
public/pets/alkaka-shimeji/alkaka-shimeji-atlas-v4.svg
public/pets/alkaka-shimeji/alkaka-shimeji-contact-sheet-v4.svg
public/pets/alkaka-shimeji/alkaka-shimeji-concept-v4.json
```

The v4 manifest includes `templateTokens` so it can become the seed for the future template generator.
