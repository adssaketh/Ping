# Design tokens (source of truth for the native rewrite)

Every value comes from the old web app. `file:line` refers to the `main` branch at commit 9679f78. CSS px = dp (1:1) in
the WebView; screenshots are consistent with a 3x density phone (title `text-sm` 14 px measures 14 dp). Kotlin: `theme/`,
`ui/components/`.

## 1. Colour slots (`src/index.css:14-36`, Kotlin `PingSlots.Baseline`)

| Slot | Baseline | Role |
|---|---|---|
| `--c-primary` | #0B57D0 | filled accent (dark: `primary-light`) |
| `--c-primary-hover` | #0842A0 | |
| `--c-primary-container` | #D3E3FD | tonal pill / selected |
| `--c-primary-light` | #A8C7FA | accent in dark |
| `--c-primary-deep` | #004A77 | tonal pill in dark |
| `--c-on-primary-deep` | #041E49 | text on pill (dark: on filled light accent) |
| `--c-on-surface` / `-dk` | #1F1F1F / #E2E2E2 | text |
| `--c-outline` / `-dk` | #747775 / #8E918F | secondary text, icons |
| `--c-variant` / `-dk` | #444746 / #C4C7C5 | inactive icons/labels |
| `--c-line` | #E0E2EC | borders (dark uses `d4`) |
| `--c-surface` | #F8FAFD | app background (dark `d0`) |
| `--c-surface-hi` | #EDF2FA | bars, search pill (dark `d2`) |
| `--c-d0..d5` | #111318 #1A1D23 #1E2228 #252A32 #2D3139 #353A44 | dark surface ladder |

Resolved pairs (`PingColors`): screen = surface|d0; bar = surface-hi|d2; card = white|d2; cardLine = line|d4;
accent = primary|primary-light; pill = primary-container|primary-deep.
**Material You:** `buildSlots` (`src/theme/dynamicColor.ts:69-103`) ported literally to `DynamicColor.buildSlots`; palettes read with
the same resource lookup as `PingSmsPlugin.java:486-518` (`system_<palette>_<tone>`). Proven identical by golden tests.
Dark-surface mixes use sRGB with `Math.round`.

Avatar colours (`src/utils/smsUtils.ts:124-147`): see `AvatarColors.palettes`; hash `smsUtils.ts:149-156` ported with 64-bit arithmetic that reproduces JS int32 `<<`.

## 2. Motion

| Token | Value | Source |
|---|---|---|
| spring standard | stiffness 420, damping 36, mass 0.9 | `src/motion.ts:6` |
| spring bouncy | 520 / 26 / 0.85 | `motion.ts:7` |
| spring soft | 300 / 34 / 1 | `motion.ts:8` |
| fadeFast | 180 ms, cubic-bezier(0.2,0,0,1) | `motion.ts:10-11` |
| emphasized | (0.2, 0, 0, 1) | `index.css:39` |
| emphasized-decelerate | (0.05, 0.7, 0.1, 1) | `index.css:40` |
| emphasized-accelerate | (0.3, 0, 0.8, 0.15) | `index.css:41` |
| spring-like | (0.34, 1.4, 0.64, 1) | `index.css:42` |
| controls | colour/opacity/transform 220 ms emphasized | `index.css:100-102` |
| press | scale 0.96, 90 ms | `index.css:104-108` |
| row press | scale 0.985, 130 ms (bg 200 ms) | `index.css:180-182` |
| row enter | 380 ms decelerate, from y +16, opacity 0 | `index.css:186-198` |
| bubble enter | 260 ms decelerate, y +12, scale .96 | `index.css:201-213` |
| flash | 1.6 s, primary-container 85 % at 20-70 % | `index.css:216-229` |
| skeleton | sweep 1.3 s emphasized, base outline 16 %, light white 55 % (dark 12 %) | `index.css:232-252` |
| top progress | 1.15 s, bar 1/3 wide, -100 % -> 300 % | `index.css:253-263` |
| chat slide | 320 ms emphasized (inbox shifts -32 dp) | `App.tsx:73,252-254` |
| top bar | row/pill/blur-strip 460 ms emphasized; input fade 180 ms linear; logo fade 300 ms ease, move 560 ms (0.34,1.3,0.64,1), +40 ms delay when collapsing | `index.css:300-341` |
| bar collapse thresholds | act when scroll moved > 10; expand if top < 24 or delta < -6; collapse if delta > 6 and top > 64 | `ConversationList.tsx:258-266` |

**Spring conversion (corrects the master prompt):** Compose springs have mass 1, so
`dampingRatio = damping / (2*sqrt(stiffness*mass))` **and** `composeStiffness = stiffness / mass`.
standard: ratio 0.926, K 466.7; bouncy: 0.618, K 611.8; soft: 0.982, K 300. (`SpringConversion`, unit-tested.)

## 3. Shapes and shadows

Tailwind v4 (`node_modules/tailwindcss/theme.css`, version 4.3.x): radius xl 12, 2xl 16, 3xl 24, 4xl 32.
Shadows: xs `0 1 2 0 .05`; sm `0 1 3 0 .1, 0 1 2 -1 .1`; md `0 4 6 -1 .1, 0 2 4 -2 .1`; lg `0 10 15 -3 .1, 0 4 6 -4 .1`;
2xl `0 25 50 -12 .25`. `m3-elevation-1/2/3`: `index.css:154-165`. Kotlin `Shadows`, drawn with the real `dropShadow` API
(CSS blur B -> radius B/2: **unverified by eye**, see parity.md).

Key shapes: search pill full-round, 56 dp row (`TopSearchBar.tsx:120`), padding px 16, pt 10, pb 6; bottom bar
`rounded-[32px]`, `max-w-xl` 576, nav padding 12/4/12/6, inner padding 6, gap 4 (`BottomTabs.tsx:30,35-39`); icon box 56x32; icon 22;
badge min 18, text 10 bold, top -4 right 2 (`:53-72`); label 10.5; row `rounded-[28px] mx-2 px-4 py-3.5 gap-3.5`,
avatar 48 (`ConversationList.tsx:85-98`), latest card avatar 56 (`LatestMessageCard.tsx:59`); sheet panel `rounded-t-[32px]`,
`max-h-[88vh]`, `pb-3`, scrim black 45 % (`ConversationActionSheet.tsx:186-194`); profile menu `w-72 rounded-[28px] p-2` (`TopSearchBar.tsx:187`).

## 4. Glass bars (`index.css:344-357`, `InboxColumn.tsx`, `SMSContext.tsx:48-54,330-336`)

Defaults: bar style **solid**, glass opacity 62, blur strong, edge on, edge effect `fade`, edge blur `medium`, fade height `medium`.
Blur px: soft 10 / medium 18 / strong 28. Background `color-mix(surface-hi|d2, alpha%)`, `blur(px) saturate(1.5)`,
rim inset 1 px white 42 % (dark 16 %), drop shadow `0 6 20 black .07` (dark .35).
Edge effect blur strip px: light 6, medium 10, strong 16 (off 10); fade extra short 12 / medium 24 / tall 44; solid hides to 50 %/45 % of bar,
glass fades from the screen edge (`InboxColumn.tsx:72-82`). (Edge effect itself is Phase 3.)

## 5. Typography

Body stack: `'Google Sans', 'Google Sans Text', 'Roboto Flex', Roboto, system-ui, ...` (`index.css:85-86`), no font files bundled.
**Resolved on the user's phone (OnePlus 13R, ColorOS 17, Android 17):** none of the four named fonts is installed as a separate font, so the old app showed the system font **One Sans** (proprietary). Native: same stack via `DeviceFontFamilyName`, nothing bundled (`PingFonts`).
Tailwind sizes: xs 12/16, sm 14/20, base 16/24, lg 18/28, xl 20/28, 2xl 24/32;
custom `text-[10px]`, `text-[10.5px]`, `text-[11px]` (line-height inherits the 1.5 body default). Weights: medium 500, semibold 600, bold 700.
Kotlin uses `sp` (follows the phone's font scale); whether the WebView followed it is **unknown** (screenshots look like scale 1.0).

## 6. Colours that are NOT in index.css (Phase 3 must convert exactly)

Category chips use Tailwind v4 palette colours, which are OKLCH, not hex: teal-50/700 (dark teal-950/40, teal-300), pink-50/700, sky-50/700
(`ConversationList.tsx:120-137`). Phase 3 converts them from `theme.css` with a script.

## 7. Correction to the master prompt

D1 says the soft coloured glow under the bottom bar "changes with the tab; copy gradients from BottomTabs.tsx". **There is no such gradient in the code**
(`grep glow|radial-gradient|blob` finds only the onboarding blobs and the logo). In the screenshots the glow is the glass bar blurring (with saturate 1.5)
the avatars scrolling behind it (e.g. the orange avatar behind "All"). The native glass bar reproduces it by construction.
