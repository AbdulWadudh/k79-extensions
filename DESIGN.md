---
name: Infisical Console
description: A focused secrets ledger for Infisical in Chrome's side panel.
colors:
  ink: "#17231d"
  bone-canvas: "#f2efe6"
  paper-surface: "#faf8f1"
  paper-raised: "#fffdf7"
  bottle-green: "#184b37"
  sage-soft: "#dfe8df"
  vermilion: "#a63e28"
  rail-forest: "#18352a"
  muted-sage: "#4f5e55"
  hairline: "#d8d3c5"
  env-dev: "#2f6b4f"
  env-staging: "#8d641d"
  env-prod: "#a63e28"
typography:
  headline:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "Schibsted Grotesk Variable, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  mono:
    fontFamily: "Geist Mono Variable, Cascadia Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
rounded:
  xs: "3px"
  sm: "5px"
  md: "8px"
  lg: "12px"
spacing:
  base: "4px"
  tight: "8px"
  field: "12px"
  section: "20px"
  page: "16px"
components:
  button-primary:
    backgroundColor: "{colors.bottle-green}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  button-danger:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "36px"
  badge:
    backgroundColor: "{colors.sage-soft}"
    textColor: "{colors.bottle-green}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
    height: "20px"
---

# Design System: Infisical Console

## Overview

**Creative North Star: "The Secure Ledger"**

Infisical Console is a working record of sensitive entries, not a second dashboard. It borrows the calm of a well-kept ledger: warm paper, ink, hairline rules, tabular numbers, and a dark spine that keeps the environment visible without competing with the task.

The interface is intentionally quiet. The user should always know the project, environment, and path before touching a value. Colour is a signal, not decoration: bottle green marks the current scope and primary action, vermilion marks destructive risk, and environment colours are labels with text beside them.

**Key Characteristics:**

- Bone paper and deep forest ink; one green accent and one vermilion risk colour.
- Hairline rules and tonal layers instead of shadows and cards.
- An index-and-leaf layout: environment rail, secret index, and inspector.
- Monospace only for keys, values, paths, counts, and timestamps.
- Masked values, explicit reveal, deliberate deletion.

## Colors

The palette is restrained and warm: a paper-neutral ground, a dark green working accent, and a single vermilion alert.

### Primary

- **Bottle Green** (#184b37): primary actions, selected state, focus support, and the environment rail. It is the only saturated colour used at rest.
- **Sage Soft** (#dfe8df): selected rows, badges, and quiet accent fills.

### Secondary

- **Vermilion Seal** (#a63e28): destructive actions and deletion confirmation only. It never decorates.

### Neutral

- **Ink** (#17231d): primary text and headings.
- **Bone Canvas** (#f2efe6): the application ground.
- **Paper Surface** (#faf8f1) / **Raised Paper** (#fffdf7): toolbars, panels, inputs, and overlays.
- **Muted Sage** (#4f5e55): secondary copy, labels, and metadata. It is tuned for AA contrast on paper.
- **Hairline** (#d8d3c5): one-pixel rules, dividers, and input borders.
- **Rail Forest** (#18352a): the environment spine and onboarding cover.

### Named Rules

**The One Risk Colour Rule.** Vermilion appears only on destructive actions, deletion, and destructive error states. It is never used for decoration or emphasis.

**The Paper Ground Rule.** Large surfaces stay paper-toned. Depth comes from hairlines and one tonal step, not from a gradient.

## Typography

**Display Font:** Schibsted Grotesk Variable (with Segoe UI, sans-serif)
**Body Font:** Schibsted Grotesk Variable (with Segoe UI, sans-serif)
**Label/Mono Font:** Geist Mono Variable (with Cascadia Mono, monospace)

**Character:** A compact, slightly editorial grotesk carries the working surface; Geist Mono makes keys, values, and counts feel like entries in a record. The pairing is precise without reading as a terminal.

### Hierarchy

- **Headline** (600, 22px, 1.2, -0.03em): onboarding and empty-state titles only.
- **Title** (600, 15px, 1.3, -0.02em): panel headings and section titles.
- **Body** (400, 12px, 1.55): descriptions, comments, and helper copy; keep prose under 46ch in the side panel.
- **Label** (600, 11px, 0.12em, uppercase): field labels and compact metadata headings.
- **Mono** (400, 12px, 1.5): secret keys, values, paths, counts, versions, and timestamps. Use tabular numerals for counts.

### Named Rules

**The Data Is Monospace Rule.** Monospace is reserved for data and measurement. Never set prose, labels, or buttons in it.

## Layout

The signature structure is **index and leaf**.

- **Narrow (320–479px) and popup:** one column. Brand, project, and actions occupy a 52px top bar; environment, path, and count sit in a second row; search in a third. Selecting a secret pushes a full-height inspector; editing pushes a full-height editor. The 380×520 toolbar popup is the default compact console; the optional side-panel control lives in the path row.
- **Medium (480–639px):** the environment picker returns to the top bar. The list remains single-column; inspector and editor still push.
- **Wide (640px+):** a 56px dark environment rail joins the left edge. At 700px+ the list and a 340px inspector/editor share the body. The rail is quick environment switching, not a second navigation system.
- **Density:** 44–48px secret rows, 36px controls, 1px separators, 12–16px panel padding. No horizontal page scroll at supported widths.
- **Page frame:** the side panel or popup is the viewport. Do not add a centered page shell, hero, or card grid around the workspace.
- **Dashboard access:** the path row has a globe control that opens the exact Infisical project overview, not the dashboard home.

## Elevation & Depth

The system is flat at rest. Depth is conveyed with one tonal step (`canvas` → `surface` → `raised`) and one-pixel hairlines. The only shadow is the overlay shadow for dialogs and transient status, because those must escape the page plane.

### Shadow Vocabulary

- **Overlay** (`0 18px 60px rgb(8 18 13 / 0.18)` light, `0 18px 60px rgb(0 0 0 / 0.45)` dark): dialogs and toast feedback only.

### Named Rules

**The Hairline Rule.** If a border can explain the relationship, do not add a shadow.

## Shapes

Corners are small and deliberate: 3px for badges and keys, 5px for buttons and inputs, 8px for dialogs and compact panels, 12px only for large overlays. Borders are one pixel. Pills are reserved for the switch thumb and environment dots; never for buttons or cards.

The environment rail uses full-height rectangular tabs, not rounded pills. Secret rows are flush ledger entries separated by hairlines, not floating cards.

## Components

### Buttons

- **Shape:** 5px radius, 36px standard height, 32px compact height.
- **Primary:** bottle green ground, paper text; used for connect, save, create, and open.
- **Hover / Focus:** darken/brighten the ground; 2px focus ring in bottle green or vermilion, offset from the control. Active state nudges down 1px.
- **Secondary:** raised paper ground with a hairline border; used for retry and cancel.
- **Danger:** vermilion ground with paper text; used for delete confirmation only.
- **Ghost/Quiet:** transparent ground, muted text; used for back, clear, and low-risk actions.

### Inputs and Fields

- **Style:** 36px height, 5px radius, raised paper ground, one-pixel hairline. Monospace only for keys, values, paths, and instance URLs.
- **Focus:** bottle-green border plus a soft 2px ring. Error: vermilion border and a text error directly below the control.
- **Labels:** 11px uppercase tracking, with helper text in muted sage. Do not use placeholder text as the label.

### Inspector Value Card

- **Header:** the actual secret key in monospace, not a generic “Value” label.
- **Body:** masked or revealed value only; no helper prose inside the card. It sizes to its content with a max height and internal scroll for long values.
- **Footer:** icon-only reveal, copy, edit, and delete controls aligned to the bottom right.
- **Inline edit:** choosing edit turns the card header key into a textbox and the value body into a textarea; Cancel/Save replace the footer actions. No separate edit page.
- **Header bar:** navigation, shared/version badges, and close only; no global action footer.

### Folder Rows

- **Structure:** folder icon in the warm warning tone, folder name in monospace, full path in muted metadata, and a chevron that nudges right on hover.
- **Behavior:** clicking enters the folder; the path bar’s up control returns. Folder rows sit above secret rows and are not draggable or selectable.

### Secret Rows

- **Structure:** key + version badge on the first line; fixed-width mask, path, and relative age on the second.
- **Selected:** sage-soft fill with a one-pixel bottle-green left rule. Do not use a thick accent bar or glow.
- **Actions:** reveal, copy, and details appear on hover/focus at 480px+, always visible below 480px. Reveal is inline and toggles the value in the row. Row click copies; the dedicated details icon opens the inspector.
- **Empty:** teach the next action; no lock-and-key illustration.

### Environment Rail

- **Shape:** 56px wide, full-height dark spine with rectangular tabs.
- **Content:** environment colour dot, four-character slug, current tab with a quiet tonal fill.
- **State:** current environment gets text and fill, not colour alone. Disabled while a scope change is in flight.

### Badges

- **Style:** 3px radius, 10px mono uppercase, 2px/6px padding.
- **Tones:** sage for shared/accent, neutral for version, vermilion for danger, amber for manual scope. Always include text.

## Do's and Don'ts

### Do:

- **Do** show project, environment, and path before any read, write, or delete.
- **Do** keep values masked at a fixed width so length is not leaked until an inline reveal.
- **Do** keep row reveal inline, row click for copy, and a dedicated details icon for the inspector.
- **Do** use hairlines and tonal steps for structure.
- **Do** keep the primary accent to actions, selection, and scope state.
- **Do** use Hugeicons at one stroke weight and label every icon-only control.
- **Do** keep motion between 150–220ms and disable it under reduced-motion.

### Don't:

- **Don't** use neon-on-black, glassmorphism, gradient text, or glow.
- **Don't** use border-left/right accents thicker than 1px on rows or cards.
- **Don't** use display fonts in labels, buttons, or data.
- **Don't** put the main editor in a centered modal.
- **Don't** use a card grid for the secret index.
- **Don't** use colour alone to identify an environment or state.
- **Don't** show or log a secret value without an explicit reveal/copy action.
