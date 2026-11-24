---
name: PageTurner
description: A warm, tactile reading room for a personal book collection.
colors:
  paper: "#f5f2e9"
  ink: "#28291f"
  muted: "#68665b"
  line: "#dedbd0"
  action: "#303126"
  action-hover: "#4c4d39"
  action-text: "#fffaf0"
  field: "#fbf9f2"
  focus: "#75609b"
  fiction: "#65518c"
  science: "#416551"
  philosophy: "#957345"
  history: "#874852"
  art: "#4d7280"
  poetry: "#926282"
  technology: "#526579"
  nature: "#747a45"
typography:
  display:
    fontFamily: "Cormorant Garamond Variable, Georgia, serif"
    fontSize: "clamp(48px, 5.8vw, 80px)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Cormorant Garamond Variable, Georgia, serif"
    fontSize: "34px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "DM Sans Variable, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "DM Sans Variable, sans-serif"
    fontSize: "12px"
  book-prose:
    fontFamily: "Cormorant Garamond Variable, Georgia, serif"
    fontSize: "19px"
    lineHeight: 1.45
rounded:
  field: "5px"
  window: "12px"
  pill: "24px"
  chip: "20px"
spacing:
  compact: "8px"
  control: "12px"
  inset: "20px"
  section: "35px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-text}"
    rounded: "{rounded.field}"
    padding: "12px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.action-text}"
    rounded: "{rounded.chip}"
    padding: "5px 10px"
---

# Design System: PageTurner

## Overview

**Creative North Star: "The reading room"**

A warm paper window sits on a pale stone backdrop. A deep forest-green masthead and brass rules frame discovery and sign-in. Book objects carry the texture and color; generous serif headings and quiet controls make browsing feel like spending time with a physical collection. This describes the implemented interpretation of the supplied video, rather than a separately researched brand position.

**Key Characteristics:**
- Warm paper and dark olive ink.
- Cloth bindings, wooden shelves, and an open-book detail view.
- Literary serif display type paired with compact sans-serif controls.

## Colors

Primary actions use forest green. The reading-room masthead uses a pale gold add button. Warm paper, muted text, and pale dividing lines establish the neutral surface. Focus uses a muted violet outline.

The secondary palette belongs to books and topics: violet fiction, forest science, ochre philosophy, burgundy history, blue-green art, mauve poetry, slate technology, and olive nature. Binding tint varies deterministically by title; avoid interpreting binding color as reading status.

## Typography

Self-hosted Cormorant Garamond Variable supplies headings, book labels, italic asides, and book descriptions. Self-hosted DM Sans Variable supplies navigation, forms, metadata, and actions. Display, headline, body, and control roles are defined in the frontmatter; smaller shelf metadata remains subordinate to readable titles.

The mobile library heading scales between 37px and 54px. Form inputs and search increase to (16px) on mobile. The signed-in header contains only Settings and Sign out; the main library retains Add a book, and administrator navigation lives in account settings.

## Layout

The desktop window has a maximum width of (1240px), with outer padding of (48px 36px). A (78px) header leads into a library inset of (44px 36px). Shelves align book bottoms over a full-width wooden ledge. Controls wrap before content compresses; long shelf rows scroll horizontally.

At (1050px), outer padding contracts and cover grids drop from five columns to four. At (700px), paper becomes an edge-to-edge canvas, the atmospheric backdrop disappears, and search occupies a full toolbar row. Cover and topic grids use two columns. Authentication puts the form above a compact illustrated book panel on phones. Account columns stack; the open book becomes a vertical detail sheet. Beyond (1500px), the outer top margin increases to (64px).

## Elevation & Depth

Depth describes physical objects: an ambient shadow lifts the application window, small inset highlights model cloth bindings, a thin gradient and shadow give the shelf its edge, and inset page shadows suggest a book's gutter. Quiet form controls remain mostly flat. Exact reusable shadows and motion are recorded in the sidecar.

Spines lift and tilt on hover or keyboard focus. Covers lift on hover, and dialogs enter with a short perspective opening. The reduced-motion preference disables animations, transitions, and hover transforms.

## Shapes

The window uses soft corners; ordinary fields and buttons use modest corners. Search, view switches, and filter chips are pill shaped. Books use slightly asymmetric corners and tall rectangular silhouettes. Topic art stays rectangular. Preserve these distinctions when adding controls.

## Components

**Buttons:** dark olive primary actions, outlined secondary actions, and minimal text actions. Disabled buttons reduce opacity and retain a disabled cursor. Keyboard focus uses a visible (2px) violet outline offset by (4px).

**Inputs:** warm off-white fields with thin neutral borders. Search is a compact pill with a violet border and faint ring on focus within. Provide visible labels and maintain mobile input sizing.

**Navigation and chips:** Discover and Your library use quiet text navigation. Shelf, Covers, and Topics share a segmented control with a pale raised selected segment. Topic and reading-status filters use dark selected pills; retain accessible pressed states.

**Book objects:** spine height and width vary by title hash. Vertical serif labels, occasional paper labels, binding bands, and small ornaments form the signature. Shelf buttons expose full titles to assistive technology and show title/author tooltips. Cover cards use provider artwork when available and a designed cloth-cover fallback when absent.

**Open-book dialog:** a green binding surrounds unequal facing pages. The left page presents the cover; the right presents title, author, description, status, and reading actions. Native dialog behavior, dismiss controls, overflow, and keyboard interaction remain part of the component.

**Feedback:** inline success/error notices, collection loading spines, empty states, and a compact bottom toast keep asynchronous operations legible.

## Do's and Don'ts

### Do:
- Do keep book texture and physical depth concentrated in books, shelves, and the open-book dialog.
- Do preserve visible focus, readable mobile inputs, reduced motion, and real loading and error states.
- Do reuse the serif/sans role split and the established warm neutral surfaces.

### Don't:
- Don't represent decorative authentication books as a user's saved collection.
- Don't use binding color as a substitute for explicit reading-status labels.
- Don't make the desktop shelf composition force horizontal page overflow on mobile.
