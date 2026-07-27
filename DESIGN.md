---
version: alpha
name: Glasshouse
description: The visual identity of the AI Cho-Scientist research portal — a daylit glasshouse laboratory.
colors:
  canvas: "#EFF5F1"
  surface: "#FFFFFF"
  surface-muted: "#ECF3EF"
  ink: "#10201B"
  ink-soft: "#45544E"
  ink-faint: "#626F68"
  rule: "#E3EBE6"
  rule-strong: "#C9D6CF"
  green: "#0EA472"
  green-deep: "#0A7350"
  green-light: "#0D8560"
  water: "#0A7F74"
  green-wash: "#DFF5EC"
  green-mist: "#EEFAF4"
  lamp-idle: "#99A49E"
  lamp-active: "#2F9068"
  lamp-running: "#4A7D9E"
  lamp-attention: "#B07F31"
  lamp-fault: "#B0574C"
typography:
  display:
    fontFamily: Noto Sans KR
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.03em
  h1:
    fontFamily: Noto Sans KR
    fontSize: 42px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: -0.025em
  h2:
    fontFamily: Noto Sans KR
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  h3:
    fontFamily: Noto Sans KR
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.45
  lede:
    fontFamily: Noto Sans KR
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
  body:
    fontFamily: Noto Sans KR
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.62
  reading:
    fontFamily: Noto Sans KR
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.76
  stat:
    fontFamily: Noto Sans KR
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.02em
  label:
    fontFamily: Noto Sans KR
    fontSize: 11px
    fontWeight: 700
    letterSpacing: 0.06em
rounded:
  xs: 6px
  sm: 9px
  md: 13px
  lg: 18px
  pill: 999px
spacing:
  xs: 6px
  sm: 10px
  md: 18px
  lg: 26px
  xl: 42px
  xxl: 72px
elevation:
  flat: "0 1px 2px rgba(11,40,30,.05)"
  raised: "0 5px 14px -5px rgba(11,40,30,.12), 0 12px 30px -14px rgba(11,40,30,.14)"
  floating: "0 20px 50px -18px rgba(11,40,30,.26)"
  accent: "0 12px 30px -12px rgba(14,164,114,.45)"
gradients:
  action: "linear-gradient(135deg, #0D8560, #0A7350 55%, #0A7F74)"
  brand: "linear-gradient(145deg, #119A70, #0A6D4C)"
  daylight: "radial-gradient(120% 92% at -4% -18%, rgba(16,179,163,.20), transparent 55%), radial-gradient(90% 80% at 104% -8%, rgba(14,164,114,.16), transparent 52%)"
motion:
  feedback: 120ms
  content: 180ms
  easing: "cubic-bezier(0.2, 0, 0, 1)"
components:
  button-primary:
    backgroundColor: "{gradients.action}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 18px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  composer:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  row-hover:
    backgroundColor: "{colors.green-mist}"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    height: 36px
  filter-chip-active:
    backgroundColor: "{colors.green-deep}"
    textColor: "{colors.surface}"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 14px
---

## Overview

**A daylit glasshouse laboratory.**

The reference is a modern research glasshouse: a white-framed building full of
northern light, white staging benches, living green, and air. Everything in it
is clean and cultivated, but nothing is sterile — light falls softly across the
surfaces and the green is alive rather than institutional.

This is a working scientific instrument that a researcher opens every morning,
and it should feel like a good place to start a day of thinking. Not a
government form, not a lecture handout, not a dark-mode terminal. The register
is **bright, calm, and generous** — white benches on a tinted-glass canvas, wide
margins, and one living green that carries every action.

The product turns literature into structured evidence, so the interface has two
jobs: give the researcher one obvious place to ask a new question, and keep the
existing collection legible at a glance. The home screen is built around exactly
those two things.

> This file is the normative design source for the portal. `DESIGN_SYSTEM.md`
> describes the earlier, austere visual language and is retained only for
> history; it is **not** binding.

## Colors

A white-and-glass base with one living green, plus a cooler water-green that
appears only inside gradients.

- **Canvas** {colors.canvas} is the ground — white passed through green glass.
  Never pure white, never grey, never cream.
- **Surface** {colors.surface} is the staging bench. All content sits on white
  panels laid over the canvas. **Surface-muted** {colors.surface-muted} is a
  recessed area *inside* a panel, such as the composer's prompt well.
- **Ink** {colors.ink} is green-black and carries all primary type.
  **Ink-soft** {colors.ink-soft} is prose; **ink-faint** {colors.ink-faint} is
  metadata and captions.
- **Rule** {colors.rule} divides rows and sections. **Rule-strong**
  {colors.rule-strong} outlines something the user types into.
- **Green** {colors.green} is the single accent identity. **Green-light**
  {colors.green-light} and **water** {colors.water} exist *only* as the endpoints
  of {gradients.action} and {gradients.brand} — never as flat fills in their own
  right. **Green-wash** {colors.green-wash} tints the active navigation item;
  **green-mist** {colors.green-mist} is row hover.
- **Focus** uses {colors.green} at low opacity as a 3px outline. The focus ring
  is part of the accent family, never a browser-default blue.
- **Contrast is a constraint on the palette, not an afterthought.** Any surface
  that carries white text must clear 4.5:1 on its own — including *every stop of
  a gradient*, since a gradient has no single background colour for a checker to
  measure. {colors.green} is bright enough that white on it fails at 3.2:1, so
  white-on-green surfaces use {colors.green-deep}. {colors.ink-faint} is tuned to
  clear 4.5:1 against {colors.canvas} at 12px; lightening either one breaks it.
- **Lamps** — {colors.lamp-active}, {colors.lamp-running},
  {colors.lamp-attention}, {colors.lamp-fault}, {colors.lamp-idle} — are
  deliberately desaturated and appear **only** as a 7px dot beside a text label.
  Status is never a filled badge and never coloured text.

## Typography

One family, Noto Sans KR, bundled locally at **400/500/600/700 only**, with
`font-synthesis: none`. Because synthesis is off, any weight outside those four
snaps to the nearest loaded face — a `font-weight: 650` renders as 700, not as
something between. Never write an intermediate weight; the hierarchy must be
built from the four real ones. Korean and Latin share the family, so a bilingual
page holds one texture.

The character comes from the **scale**, not from mixing faces. Display
{typography.display} is genuinely large and tightly tracked, and it sits against
{typography.body} with very little in between — that jump is what makes the page
feel composed rather than uniformly grey.

- **Display** appears once per page, on the page title, and may scale with the
  viewport.
- **Stat** {typography.stat} is for the standing counts in the overview panel,
  always with `tabular-nums`.
- **Label** {typography.label} is the uppercase eyebrow above a section or panel.
- **Reading** {typography.reading} sets report and knowledge prose, capped near
  74 characters.
- Negative tracking belongs to Display, H1, and H2 only. Never track body text.
- Korean keeps `word-break: keep-all`, `overflow-wrap: break-word`, and
  `line-break: strict`; headings balance their wrap.

## Layout

A fixed 232px navigation drawer, and a wide working surface beside it.

- **The home hero is asymmetric and this is the signature composition.** The
  research-question composer takes the wide left column as the single subject of
  the page; a narrow right column holds the standing counts. One place to ask,
  one place to see what exists.
- Records — runs, sources, ideas, reports — are full-bleed rows inside a single
  bordered panel, never a mosaic of separate tiles.
- Rows are generous: roughly {spacing.lg} of vertical padding. Density is not a
  goal here; a researcher scanning six items should not feel they are reading a
  spreadsheet.
- Workspace pages cap at 1320px, reading pages at 980px, with {spacing.xl}+ of
  outer padding on desktop.
- Sections are separated by space and a hairline, not by nested boxes.

## Elevation & Depth

Light in a glasshouse is diffuse, so shadows are **soft, wide, and low-contrast**
— never a hard drop shadow.

- {elevation.flat} is the resting state for panels and chips.
- {elevation.raised} lifts the composer and primary panels off the canvas.
- {elevation.floating} belongs to genuinely floating objects: menus, popovers,
  the citation preview.
- {elevation.accent} is the green glow beneath the primary action, and it is the
  only coloured shadow in the system.

{gradients.daylight} washes the top of the home screen. It is ambient daylight,
not a hero banner: it must stay faint enough that no edge of it is visible.

## Shapes

Rounded and soft: {rounded.md} for controls and inputs, {rounded.lg} for panels
and cards, {rounded.pill} for filter toggles and the primary call-to-action.
Corners are a defining trait of this identity — do not flatten them.

The product mark is a custom node-triangle: three nodes joined into a triangle
with the apex enlarged, meaning several sources resolving into one conclusion.
It is drawn in white on a {gradients.brand} tile with a soft inner highlight.
It must never be replaced with a stock beaker, flask, atom, microscope, or
sparkle glyph.

## Components

- **Primary button** {components.button-primary} — {gradients.action} fill, 44px
  tall, {elevation.accent} glow. Lifts 1px on hover.
- **Composer** {components.composer} — the hero object. A white panel holding a
  recessed prompt well and a pill call-to-action aligned to its right edge. The
  whole panel is the link; hovering lifts it and brightens its border.
- **Overview panel** — a white panel of stacked counts, each a {typography.stat}
  numeral against a {typography.body} label, divided by hairlines.
- **Card / panel** {components.card} — white, {rounded.lg}, hairline border,
  {elevation.flat}.
- **Record row** — separated by a {colors.rule} hairline, hovering to
  {colors.green-mist}; the final row carries no divider.
- **Status lamp** — a 7px dot plus a label at 13px in {colors.ink-soft}.
- **Filter chip** {components.filter-chip} — pill with hairline border; the
  active chip fills with {colors.green}.
- **Input** {components.input} — white, {colors.rule-strong} border, focusing to
  a {colors.green} border with a 4px translucent green ring.

## Motion

Quick and light. Things lift toward the light; nothing bounces.

- Hover, press, toggle: {motion.feedback} at {motion.easing}.
- Panels, menus, page transitions: {motion.content}, same curve.
- Hover lift is at most 2px, and only on the composer and the primary button.
- Nothing spins, pulses, shimmers, or overshoots. Loading states do not animate
  decoratively.
- `prefers-reduced-motion` collapses every duration.

## Do's and Don'ts

- **Don't** put status in a coloured chip. A filled green "완료" badge is the
  fastest way to make this look like generic dashboard output. Status is a quiet
  lamp beside a word.
- **Don't** add decorative icons. Icons appear only where they *are* the
  control: navigation items, search, the row overflow menu. No icon beside a
  statistic, no icon inside a button that already states its verb, no icon as a
  section ornament, no emoji.
- **Don't** let a third hue in. Blue, purple, amber, and red exist solely as
  status lamps. Everything expressive is green.
- **Don't** use the gradient as decoration. It belongs to the brand mark, the
  primary action, and the ambient daylight wash — nowhere else. No gradient
  text, no gradient borders, no gradient cards.
- **Don't** harden the shadows. If a shadow reads as a distinct dark edge, it is
  wrong; widen the blur and lower the opacity.
- **Don't** compress the rows to fit more on screen.
- **Don't** introduce a dark mode, glassmorphism, or a serif display face.
- **Don't** put white text on {colors.green}. It is a border, ring, and lamp
  colour; when it must sit under white text it becomes {colors.green-deep}.
- **Don't** write an intermediate font weight. 645, 650, 660, and 680 are not
  loaded; they all resolve to 700 and quietly flatten the hierarchy you thought
  you were building.
- **Do** keep one display-size title per page and let space carry the rest of
  the hierarchy.
- **Do** use `tabular-nums` wherever numerals stack.
- **Do** keep the asymmetric hero. If a future page needs a hero, it should echo
  that composition rather than centre everything.
- **Do** let the canvas show. Wide outer margins and visible gaps between panels
  are the point, not wasted space.
