---
version: alpha
name: Specimen Catalogue
description: The visual identity of the AI Cho-Scientist research portal — a digital specimen catalogue for scientific literature.
colors:
  paper: "#F4F6F4"
  surface: "#FFFFFF"
  surface-sunk: "#EDF1EE"
  ink: "#14201C"
  ink-soft: "#47544F"
  ink-faint: "#6B7772"
  rule: "#E1E7E3"
  rule-strong: "#C4D0CA"
  archival: "#0B6B4F"
  archival-deep: "#07533D"
  archival-wash: "#E7F1EB"
  lamp-idle: "#9AA39E"
  lamp-active: "#2F8F66"
  lamp-running: "#4A76A8"
  lamp-attention: "#B3812F"
  lamp-fault: "#B0554A"
typography:
  display:
    fontFamily: Noto Sans KR
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: -0.02em
  h1:
    fontFamily: Noto Sans KR
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: -0.015em
  h2:
    fontFamily: Noto Sans KR
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.35
  h3:
    fontFamily: Noto Sans KR
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.45
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
  label:
    fontFamily: ui-monospace
    fontSize: 11px
    fontWeight: 600
    letterSpacing: 0.08em
  data:
    fontFamily: ui-monospace
    fontSize: 13px
    fontWeight: 500
    letterSpacing: 0
rounded:
  sm: 4px
  md: 7px
  lg: 10px
spacing:
  xs: 6px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
motion:
  feedback: 120ms
  content: 200ms
  easing: "cubic-bezier(0.2, 0, 0, 1)"
components:
  button-primary:
    backgroundColor: "{colors.archival}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.archival-deep}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 24px
  catalogue-row-hover:
    backgroundColor: "{colors.archival-wash}"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.md}"
    height: 34px
  filter-chip-active:
    backgroundColor: "{colors.archival}"
    textColor: "{colors.surface}"
  specimen-label:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px
  input-focus:
    backgroundColor: "{colors.surface}"
---

## Overview

**A research institute's specimen catalogue, rendered as software.**

Not a lecture handout, not a marketing site, not a generic dashboard. The
reference is the catalogue room of a working institute: every specimen is
mounted on its own sheet, captioned, assigned an accession number, and filed
with its provenance recorded on the label. The sheets are handsome because they
are precise, not because they are decorated. Someone reads them for eight hours
at a stretch and their eyes do not hurt.

This maps directly onto what the product actually is. A paper enters the system
and becomes a catalogued specimen: labelled, tiered by provenance (T0–T5),
cross-referenced to the figure and panel it came from. The interface is the
catalogue drawer and the reading table.

The register is *quiet confidence*. Generous margins, hairline rules, one ink
and one accent, data set in a monospace label voice. Nothing glows. Nothing is
trying to sell the user anything — they already work here.

> This file supersedes `DESIGN_SYSTEM.md`, which described the pre-refresh
> visual language. Where the two disagree, DESIGN.md is normative.

## Colors

One ink, one accent, one paper. Everything else is a rule weight.

- **Paper** {colors.paper} is the canvas — a cool, matte off-white with a faint
  green bias so it sits under the accent without vibrating. Never pure white,
  never cream.
- **Surface** {colors.surface} is the mounted sheet. Content sits on white
  sheets laid on the paper canvas; that one step of contrast is what separates
  a record from its background. No third surface tone stacked on top.
- **Ink** {colors.ink} carries all primary type. It is green-black, not pure
  black. **Ink-soft** {colors.ink-soft} is prose and descriptions;
  **ink-faint** {colors.ink-faint} is metadata and captions.
- **Rule** {colors.rule} is the hairline that divides catalogue rows and
  sections. **Rule-strong** {colors.rule-strong} is reserved for the edge of an
  input the user is meant to type into. Rules do the work that shadows do
  elsewhere.
- **Archival** {colors.archival} is the single accent — the green of archival
  folders and specimen tape. It marks exactly three things: the active
  navigation item, the primary action, and a live link. It is never used as a
  decorative fill, never as a gradient, never as a background wash behind a
  headline. **Archival-wash** {colors.archival-wash} is its only tint, used for
  row hover and the active nav item.
- **Lamps** are the status colors: {colors.lamp-active},
  {colors.lamp-running}, {colors.lamp-attention}, {colors.lamp-fault}, and
  {colors.lamp-idle}. They are desaturated on purpose. They appear only as a
  7px indicator dot beside a text label — never as a filled chip, never as
  coloured text, never as a badge background.

## Typography

One family, two voices.

**Noto Sans KR** {typography.body} sets everything a human reads as language:
headings, prose, descriptions, controls. It is bundled locally, 400/500/600
with restrained 700, synthetic bold disabled. Korean and Latin share it, so a
bilingual page holds one texture.

**A monospace label voice** {typography.label} sets everything that is a
*record* rather than a sentence: accession-style metadata, DOIs, dates, counts,
provenance tiers, figure and panel references, table numerals, section eyebrows.
This is the single most characteristic move in the system — it is the printed
label on the specimen sheet, and it is what makes a page of data read as a
catalogue rather than as a web app. All numerals in tables and stat panels use
`tabular-nums` so columns align.

- **Display** {typography.display} is used once per page, on the page title.
- **H2** {typography.h2} opens a section; **H3** {typography.h3} titles a record.
- **Reading** {typography.reading} is for report and knowledge prose, capped at
  74 characters.
- Korean text keeps `word-break: keep-all`, `overflow-wrap: break-word`, and
  `line-break: strict`. Headings balance their wrap.

Negative letter-spacing is applied only to Display and H1, and only slightly. Do
not track body text.

## Layout

A fixed catalogue drawer on the left, a reading table on the right.

- The sidebar is a persistent 232px drawer. Content is capped at 1320px for
  workspace pages and 980px for reading pages, with generous outer padding
  ({spacing.xl} and up on desktop).
- The home screen is **asymmetric**: the research-question composer occupies the
  wide left column as the page's single subject, and a narrow right column holds
  the standing count of the collection. This is the catalogue's front desk — one
  place to file a new request, one summary of what is already filed.
- Records — runs, sources, ideas, reports — are always **full-bleed rows inside
  one bordered sheet**, never a grid of separate floating tiles. A catalogue is
  a stack of sheets, not a mosaic.
- Sections are separated by space and a single hairline, not by nested boxes.
- Reading pages centre a single measure with the outline docked beside it.

## Elevation & Depth

**The design is flat by default.** Depth is expressed by the hairline and by the
one step from paper to sheet. Shadows are not a styling device here; they mean
"this object is temporarily floating above the page."

Exactly two things may cast a shadow: an open menu or popover, and the citation
preview card. Everything else — cards, panels, tables, inputs, buttons — is
defined by its border.

There is no glow, no gradient, no glass, no blur, no layered ambient light.

## Shapes

Modest, consistent radii: {rounded.sm} for small marks and labels,
{rounded.md} for controls and inputs, {rounded.lg} for sheets and panels.
Nothing exceeds {rounded.lg}.

Fully-rounded pill shapes are used for exactly one component — the status filter
chips — because they are a row of discrete toggles and the shape communicates
that. Pills are not the house style; do not apply them to buttons, tags,
metadata, or counts.

The product mark is a custom node-triangle: three nodes joined into a triangle
with the apex enlarged — several sources resolving into one conclusion. It is
drawn flat in {colors.surface} on an {colors.archival} tile. It has no
gradient and no inner highlight.

## Components

- **Primary button** {components.button-primary} — flat archival green, 44px
  tall, {rounded.md}. On hover it darkens to {colors.archival-deep}. It does
  not lift, scale, or glow.
- **Sheet / card** {components.card} — white, {rounded.lg}, 1px {colors.rule}
  border, no shadow.
- **Catalogue row** — a record inside a sheet, separated from its neighbours by
  a {colors.rule} hairline, hovering to {colors.archival-wash}. The last row
  carries no divider.
- **Specimen label** {components.specimen-label} — the small monospace tag used
  for provenance tiers, figure references, assay notes, and counts. Sunk
  background, no border colour of its own.
- **Status lamp** — a 7px dot plus a text label in {typography.body} at 13px.
  The dot takes a lamp colour; the label stays {colors.ink-soft}.
- **Filter chip** {components.filter-chip} — pill, hairline border; active state
  fills with {colors.archival}.
- **Input** {components.input} — white, {colors.rule-strong} border,
  {rounded.md}. Focus draws a 3px {colors.archival} ring at low opacity and
  switches the border to {colors.archival}. Inputs never carry a shadow.

## Motion

Transitions are quick and mechanical — a drawer sliding, not a curtain falling.

- Interactive feedback (hover, press, filter toggle): {motion.feedback} at
  {motion.easing}.
- Content transitions (panel, menu, page): {motion.content}, same curve.
- Nothing animates longer than 250ms. Nothing bounces, overshoots, spins, or
  pulses. Loading states do not shimmer.
- `prefers-reduced-motion` collapses every duration.

## Do's and Don'ts

- **Don't** use gradients. Not on the logo, not on buttons, not as an ambient
  hero wash. A catalogue sheet is printed in flat ink.
- **Don't** add a radial glow, halo, or coloured atmosphere behind the hero.
- **Don't** put status in a coloured chip. Status is a lamp beside a word. A
  filled green "완료" badge is the single fastest way to make this page look
  like generic dashboard output.
- **Don't** add decorative icons. Icons appear only where they are the control
  itself: navigation items, search, the row overflow menu. No icon beside a
  statistic, no icon inside a button that already has a verb, no icon as a
  section ornament, no emoji.
- **Don't** stack shadows on cards to create hierarchy. Use the hairline and
  space.
- **Don't** let a second accent colour in. Teal, blue, purple — the palette has
  one accent, and its scarcity is what gives it authority.
- **Don't** round everything to a pill. Pills mean "toggle" here.
- **Do** set every record value — DOI, date, count, tier, figure reference — in
  the monospace label voice. This is the system's signature.
- **Do** align numerals with `tabular-nums` wherever they stack.
- **Do** let sheets breathe. A catalogue row with 22px of vertical padding reads
  as considered; the same row at 12px reads as a spreadsheet.
- **Do** keep one display-size title per page and let the rest of the hierarchy
  be carried by weight and space, not size.
- **Do** trust the hairline. If a boundary needs more than 1px to be legible,
  the spacing around it is wrong.
