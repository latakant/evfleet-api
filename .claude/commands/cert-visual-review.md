╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cert-visual-review  |  v1.0  |  TIER: 2  |  BUDGET: LEAN ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ DOMAIN        ║ qa                                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Audit component against visual quality checklist   ║
║               ║ - Check all component states (default·hover·active·  ║
║               ║   disabled·loading·error·empty·focus)               ║
║               ║ - Verify spacing, typography, and alignment          ║
║               ║ - Accessibility pre-handoff check (WCAG AA)          ║
║               ║ - Produce PASS / WATCH / BLOCK verdict               ║
║ CANNOT        ║ - Run visual regression tests or take screenshots    ║
║               ║ - Replace a real browser review                      ║
║               ║ - Determine if animations or transitions are correct  ║
║ REQUIRES      ║ - adapters/design/component-patterns.md              ║
║               ║ - adapters/design/copy-patterns.md                   ║
║               ║ - adapters/blueprints/blueprint-design-accessibility.md ║
║               ║ - Component spec OR screenshot path OR code file     ║
║ PAIRED WITH   ║ /design-component · /cert-review · /cortex-qa-start  ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cert-visual-review v1.0 — UI visual quality checklist. Run before marking any component Done.

---

## INPUT PARSING

Parse from user message:
- `<target>` — component name, screen name, or file path to review
- `--states` — if provided, focus only on state coverage checklist
- `--a11y` — if provided, focus only on accessibility checklist
- `--copy` — if provided, focus only on copy accuracy checklist
- (blank flags) — run all 4 checklists

---

## STEP 1 — Load Design Context

Read:
1. `adapters/design/component-patterns.md` — C1–C14 laws
2. `adapters/design/copy-patterns.md` — W1–W10 laws
3. `adapters/blueprints/blueprint-design-accessibility.md` — A1–A13 decisions

If a code file is provided as target → read it.
If a component name is provided → search for the component in the codebase.

Identify:
- Component type (button / input / card / modal / form / nav / table / empty-state / etc.)
- Interactive elements present
- Data inputs present
- Copy strings present

---

## STEP 2 — STATE COVERAGE CHECKLIST

For every interactive element in the component:

```
STATE COVERAGE — [component name]
─────────────────────────────────────────
Interactive elements found: [list]

For each element:
  [element]
    ✅ / ❌  default       — renders correctly with no interaction
    ✅ / ❌  hover         — visual feedback on hover (cursor pointer if clickable)
    ✅ / ❌  active/press  — visible press state for click/tap
    ✅ / ❌  focus         — visible focus indicator (ring, outline, or equivalent)
    ✅ / ❌  disabled      — greyed + cursor not-allowed + not keyboard-focusable
    ✅ / ❌  loading       — spinner or skeleton while awaiting response
    ✅ / ❌  error         — error state with visible error message
    ✅ / ❌  success       — confirmation state after successful action (if applicable)

For data containers (lists, tables, feeds):
    ✅ / ❌  populated     — renders with expected data
    ✅ / ❌  empty         — has empty state (not blank white space)
    ✅ / ❌  loading       — skeleton or spinner while data fetches
    ✅ / ❌  error         — error state if data fetch fails

STATE COVERAGE VERDICT: [PASS | WATCH | BLOCK]
  PASS  = all required states present
  WATCH = 1 non-critical state missing (e.g., success state on non-mutating action)
  BLOCK = any of: focus, error, loading, empty state missing
```

---

## STEP 3 — SPACING AND LAYOUT CHECKLIST

```
SPACING + LAYOUT — [component name]
─────────────────────────────────────────
Grid compliance:
  ✅ / ❌  All spacing values are multiples of 8px (4px allowed for tight contexts)
  ✅ / ❌  No magic pixel values (e.g., margin: 13px, padding: 7px)

Typography:
  ✅ / ❌  Uses tokens from design system scale (no custom font-size values)
  ✅ / ❌  Line height ≥ 1.5× for body text
  ✅ / ❌  Font weight limited to 2 options (regular + bold/semibold)
  ✅ / ❌  No more than 2 font families

Alignment:
  ✅ / ❌  Text and icons vertically aligned (no 1–2px off-centre icons)
  ✅ / ❌  Consistent left edge for text blocks
  ✅ / ❌  Content width constrained (no text spans full viewport on wide screens)

Responsive:
  ✅ / ❌  Renders without horizontal scroll at 320px wide
  ✅ / ❌  Tap targets ≥ 44×44px on mobile (buttons, links, icons)
  ✅ / ❌  Touch targets have adequate spacing between them (≥ 8px)

SPACING VERDICT: [PASS | WATCH | BLOCK]
  BLOCK = grid non-compliance + magic values, OR horizontal scroll at 320px
```

---

## STEP 4 — ACCESSIBILITY CHECKLIST

```
ACCESSIBILITY — [component name]
─────────────────────────────────────────
Contrast:
  ✅ / ❌  Text contrast ≥ 4.5:1 on all backgrounds (WCAG AA)
  ✅ / ❌  UI component contrast ≥ 3:1 (borders, focus indicators, icons)
  ✅ / ❌  Placeholder text contrast ≥ 4.5:1 (most frameworks fail this)

Labels:
  ✅ / ❌  Every input has a visible <label> (not placeholder-only)
  ✅ / ❌  Icon buttons have aria-label or visually hidden text
  ✅ / ❌  Images have alt text (empty alt="" for decorative images)
  ✅ / ❌  Form errors are linked to their field (aria-describedby)

Keyboard:
  ✅ / ❌  All interactive elements reachable via Tab key
  ✅ / ❌  Logical tab order (top-left to bottom-right)
  ✅ / ❌  Modal/drawer traps focus (cannot Tab out of it while open)
  ✅ / ❌  Escape closes modal/dropdown/drawer
  ✅ / ❌  Custom interactive elements have correct role (button, listbox, etc.)

Structure:
  ✅ / ❌  Heading hierarchy is logical (h1 → h2 → h3, no skips)
  ✅ / ❌  Lists use <ul>/<ol> (not divs styled to look like lists)
  ✅ / ❌  Table has <th> with scope attribute

ACCESSIBILITY VERDICT: [PASS | WATCH | BLOCK]
  BLOCK = any contrast failure, missing label on input, broken keyboard nav
  WATCH = any aria improvement needed but not blocking
```

---

## STEP 5 — COPY CHECKLIST

```
COPY ACCURACY — [component name]
─────────────────────────────────────────
For each copy string in the component:

Headings / titles:
  ✅ / ❌  ≤ 12 words
  ✅ / ❌  Outcome-focused (not feature-focused)
  ✅ / ❌  No jargon or internal terminology visible to users

CTAs / buttons:
  ✅ / ❌  Verb + outcome pattern (e.g., "Place Order" not "Submit", "Save Changes" not "OK")
  ✅ / ❌  No vague labels ("Click here", "Go", "Do it")
  ✅ / ❌  Destructive actions are labelled for what they do ("Delete Account" not "Confirm")

Error messages:
  ✅ / ❌  Specific about what went wrong (not "Something went wrong")
  ✅ / ❌  Tells user what to do next
  ✅ / ❌  No technical error codes visible to end users (log them, don't display them)

Empty states:
  ✅ / ❌  Has a headline (not just blank space)
  ✅ / ❌  Has a call to action (what can the user do now?)
  ✅ / ❌  Not a generic "No data found" message

Loading states:
  ✅ / ❌  Has a label if skeleton takes > 3 seconds (e.g., "Loading your orders…")

COPY VERDICT: [PASS | WATCH | BLOCK]
  BLOCK = vague CTA + generic error message present together
  WATCH = any single copy issue
```

---

## STEP 6 — Overall Verdict

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL REVIEW — [component name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
States       [PASS | WATCH | BLOCK]
Spacing      [PASS | WATCH | BLOCK]
Accessibility[PASS | WATCH | BLOCK]
Copy         [PASS | WATCH | BLOCK]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERALL:     [PASS ✅ | WATCH ⚠️ | BLOCK 🚫]

PASS  = all 4 areas PASS or max 1 WATCH
WATCH = 2+ WATCH areas, or 1 BLOCK in non-critical area
BLOCK = any BLOCK in States or Accessibility

ISSUES TO FIX BEFORE DONE:
[list each BLOCK item with what to fix]

ISSUES TO FIX THIS SPRINT:
[list each WATCH item]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:      cert-visual-review
TARGET:     [name]
STATUS:     COMPLETE
VERDICT:    [PASS / WATCH / BLOCK]
BLOCKS:     [N] issues — must fix before Done
WATCHES:    [N] issues — fix this sprint
NEXT:       fix issues → re-run cert-visual-review → cert-review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
