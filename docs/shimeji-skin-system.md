# Alkaka Shimeji Skin System

## Purpose

The accepted v4 egg-no-top-horns pet is the **blank default avatar**, not the final art direction for every user. It is a neutral Shimeji base that official skins and user skins can build on.

The skin system should let Alkaka support:

- the built-in default egg avatar;
- official skins shipped by Alkaka;
- token-only user skins made in a simple editor;
- full creator skins that provide their own atlas and manifest later.

## Runtime Contract

The runtime renderer should keep consuming one object shape:

```ts
ShimejiCharacterPack
```

Skins are resolved before rendering:

```text
ShimejiCharacterTemplate + ShimejiSkinAppearance
  -> buildShimejiPackFromTemplate(...)
  -> ShimejiCharacterPack
  -> existing sprite renderer
```

This keeps 九妹's UI/runtime integration simple: the pet window does not need to know whether a pack came from a token-only user skin, an official skin, or a full custom atlas.

## Current Files

```text
public/pets/templates/alkaka-base-egg-template.json
public/pets/official/base-egg.appearance.json
public/pets/official/night-egg.appearance.json
public/pets/skins-index.json
src/renderer/utils/shimejiSkinTemplate.ts
src/renderer/utils/shimejiSkinTemplate.test.ts
```

## Base Template

`alkaka-base-egg-template` records the default v4 egg avatar as the stable base:

- frame size: 128×128;
- anchor: inherited from v4 frames, usually `(64, 116)`;
- required actions: `idle`, `walk`, `sit`, `fall`, `drag`, `climb`, `hang`, `sleep`;
- sprite sheet: `/pets/alkaka-shimeji/alkaka-shimeji-atlas-v4.svg`;
- guardrail: remove top horns only; do not replace them with hood/helmet/head fill.

## Token-Only Skin

A lightweight skin stores only user-facing choices:

```json
{
  "id": "night-egg",
  "displayName": "Night Egg",
  "templateId": "alkaka-base-egg-template",
  "tokens": {
    "bodyColor": "#2f2a35",
    "outlineColor": "#1e1a22",
    "coreColor": "#63d7ff",
    "accessory": "side-pin"
  }
}
```

The generator merges missing tokens from template defaults. Unknown token ids are ignored during resolution but rejected by validation when importing a user skin.

## Token Types

The initial schema supports three token types:

```text
color   -> bodyColor, outlineColor, accentColor, coreColor, eyeColor
enum    -> species, accessory, personality
string  -> future display-name / small text variants if needed
```

Recommended user editor controls:

- color picker for `color` tokens;
- dropdown for `enum` tokens;
- no arbitrary geometry editing in the first version.

## Official Skin Levels

### Level 0 — Token-only official skin

Official skin ships an appearance JSON only. It uses the base template atlas until an export pipeline recolors or layers the SVG/PNG.

Example:

```text
public/pets/official/night-egg.appearance.json
```

### Level 1 — Layered generated skin

Template + appearance generates a derived atlas/contact sheet/manifest. This can support color and accessory layers without hand-drawing every frame.

Planned output:

```text
public/pets/generated/night-egg/atlas.svg
public/pets/generated/night-egg/contact-sheet.svg
public/pets/generated/night-egg/manifest.json
```

### Level 2 — Full creator skin

Creator provides a full atlas and manifest. Validation still requires all required Shimeji actions and sane frame metadata.

Planned package shape:

```text
skin.zip
  manifest.json
  atlas.png | atlas.svg
  contact-sheet.png | contact-sheet.svg
```

## Import Validation Rules

A user/creator skin import should check:

- `templateId` exists;
- all token ids are known;
- enum token values are allowed;
- generated or provided pack passes `validateShimejiCharacterPack`;
- all required actions are present;
- frame size and anchor metadata are finite and positive;
- asset paths stay inside the skin directory;
- no remote URL loading unless explicitly allowed by product policy.

## Ownership Boundary

二妹 owns the visual/template/asset pipeline. 九妹 owns pet UI and product integration.

This work intentionally does **not** modify:

```text
src/renderer/components/pet/PetView.tsx
src/main/petWindow.ts
src/main/petPreload.ts
src/renderer/components/pet/petQuickTask.ts
src/renderer/index.css
```

## Next Implementation Steps

1. Add an asset export script that resolves template + appearance into generated atlas/contact-sheet/manifest.
2. Add a tiny official generated demo skin, probably `night-egg`.
3. Add user import validation for zip/local skin folders.
4. Hand off to 九妹: UI only needs to select a generated `ShimejiCharacterPack`.
