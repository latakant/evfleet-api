╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-ppt  |  v1.0  |  TIER: 2  |  BUDGET: STANDARD    ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ DOMAIN        ║ common                                               ║
║ AUTHORITY     ║ BUILDER                                              ║
║ CAN           ║ - Generate branded .pptx from a project brief       ║
║               ║ - Produce investor, founder, or team decks          ║
║               ║ - Auto-install pptxgenjs on first run               ║
║               ║ - Support slide templates: cover, flow, scorecard,  ║
║               ║   architecture, market, closing                     ║
║ CANNOT        ║ - Embed external images (uses shapes + text only)   ║
║               ║ - Open/display the file (write only)                ║
║ REQUIRES      ║ - Node.js in PATH                                   ║
║               ║ - Project brief or existing STATUS.md               ║
║ OUTPUT        ║ .pptx file at [project-root]/[name].pptx            ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-ppt — Generate a branded PowerPoint deck from any project context.

---

## USAGE

```
/cortex-ppt [audience] [scope]
```

| Argument     | Values                                          | Default         |
|--------------|-------------------------------------------------|-----------------|
| `audience`   | investor · founder · team · customer · handoff  | investor        |
| `scope`      | full · summary · technical · journey            | full            |

Examples:
```
/cortex-ppt investor full
/cortex-ppt team technical
/cortex-ppt customer journey
```

---

## STEP 1 — Parse Arguments

```
AUDIENCE = [investor | founder | team | customer | handoff]
SCOPE    = [full | summary | technical | journey]
```

Map audience → slide set:

| Audience   | Slides included                                                     |
|------------|---------------------------------------------------------------------|
| investor   | Cover · Problem · Solution · Journeys · Architecture · Scorecard · Market · Deploy · Closing |
| founder    | Cover · Solution · Journeys · Scorecard · Deploy · Roadmap · Closing |
| team       | Architecture · Journeys · Scorecard · Security · Deploy             |
| customer   | Cover · Product overview · How it works · Key features · Support    |
| handoff    | Architecture · Scorecard · Deploy checklist · Open items            |

---

## STEP 2 — Load Project Context

Read the following in order (stop at first found):

1. `ai/STATUS.md` → score, phase, open gaps
2. `ai/NEXT_SESSION.md` → pending tasks, open items
3. `CLAUDE.md` → stack, topology, business rules
4. `package.json` → project name, version

Extract:
```
PROJECT_NAME   = [from package.json "name" or CLAUDE.md]
SCORE          = [from STATUS.md]
STACK          = [from CLAUDE.md]
MODULES        = [from CLAUDE.md topology section]
OPEN_ITEMS     = [from STATUS.md or NEXT_SESSION.md]
PHASE          = [from STATUS.md]
```

---

## STEP 3 — Ensure pptxgenjs Available

Check if pptxgenjs is available globally or in a temp workspace:

```bash
# Check global
node -e "require('pptxgenjs')" 2>/dev/null && echo "ok"
```

If not found:
```bash
mkdir -p /tmp/cortex-ppt-workspace
cd /tmp/cortex-ppt-workspace
npm init -y --quiet 2>/dev/null
npm install pptxgenjs --quiet 2>&1 | tail -2
```

Working dir for subsequent steps: `/tmp/cortex-ppt-workspace` (or wherever pptxgenjs installed).

On Windows, resolve temp path:
```bash
# Use node to get the platform temp dir
node -e "console.log(require('os').tmpdir())"
```
Use that path instead of `/tmp` on Windows.

---

## STEP 4 — Generate Build Script

Write a Node.js build script (`build-deck.js`) into the working directory.

**Brand palette — default (customize per project if brand colors found in CLAUDE.md or tailwind.config):**
```javascript
const C = {
  black:   '0D0D0D',
  white:   'FFFFFF',
  accent:  'FF6B35',   // orange — override if project has brand color
  accent2: '1A1A2E',   // deep navy
  gray:    'F4F4F4',
  midgray: '888888',
  green:   '22C55E',
  blue:    '3B82F6',
};
```

**Detect project brand color** from CLAUDE.md or tailwind.config.js:
- If found: use as `accent`
- If not found: use default orange `FF6B35`

**Slide templates to use (pptxgenjs):**

### COVER slide
- Full dark background (`accent2`)
- Project name: large (64–72pt), bold, white
- Tagline: accent color, 22pt
- Top/bottom orange strips
- Right-side stats box (4 key metrics from STATUS.md)

### PROBLEM slide
- Light gray bg
- 2×2 grid of problem cards (white cards, border, title + description)
- Pulled from CLAUDE.md business rules or brief

### SOLUTION slide
- Dark bg
- 3-column layout (Storefront / Checkout / Fulfilment — or equivalent for non-ecom)
- Each column: colored header + feature list boxes

### JOURNEY slides (1 per persona: Customer + Admin)
- Light bg
- 6-step horizontal flow with arrow connectors
- Step boxes + detail boxes below
- Key design decisions callout at bottom

### ARCHITECTURE slide
- Light bg
- Client → API → DB/Redis stack (left side)
- External services grid (right side)
- Stack chips at bottom

### SCORECARD slide
- Light bg
- Table: Module | API | Web | Admin | Notes
- Rows from CLAUDE.md modules or manual input
- Green ✅ / gray — status per column

### MARKET slide
- Dark bg
- 4 stat boxes (market size, growth, key metric, readiness)
- "Why Now" bullet list (left)
- Go-to-Market phases (right, darkCard style)

### DEPLOY slide
- Light bg
- 5 status boxes (API / Web / Admin / Tests / Deploy)
- "To Launch" checklist (left)
- Post-launch roadmap (right, 4 phases)

### CLOSING slide
- Dark bg with accent strips
- Project name large
- Tagline: "Built. Tested. Governed. Ready."
- Key metrics bullet list (left)
- "What we need" checklist (right, dark card with accent border)

---

## STEP 5 — Run Build Script

```bash
cd [working-dir]
node build-deck.js
```

Output path: `[project-root]/[project-name]-[audience].pptx`
Example: `C:/luv/exena/exena-investor.pptx`

---

## STEP 6 — Verify Output

```bash
# File exists and is non-zero
ls -lh [output-path]
```

If file size < 50KB → likely empty/error → show build script stderr and retry.

---

## CUSTOMISATION HOOKS

These values can be overridden via inline arguments after the audience/scope:

```
/cortex-ppt investor full --name="My App" --accent=2563EB --tagline="The smartest X platform"
```

| Flag        | Effect                                      |
|-------------|---------------------------------------------|
| `--name`    | Override project name on cover              |
| `--accent`  | Override accent color (hex, no #)           |
| `--tagline` | Override cover tagline                      |
| `--out`     | Override output file path                   |
| `--slides`  | Comma-separated list of slide keys to include (cover,problem,solution,journey,arch,scorecard,market,deploy,closing) |

---

## SLIDE KEY REFERENCE

| Key          | Slide                          |
|--------------|-------------------------------|
| `cover`      | Title + key stats             |
| `problem`    | 2×2 problem cards             |
| `solution`   | 3-column solution overview    |
| `journey`    | Customer + Admin journey flows |
| `arch`       | Technical architecture        |
| `scorecard`  | Module build status table     |
| `market`     | Market size + GTM             |
| `security`   | Security & reliability cards  |
| `deploy`     | Deploy status + roadmap       |
| `closing`    | CTA + what we need            |

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:    cortex-ppt
OUTPUT:   [absolute path to .pptx file]
SLIDES:   [N] slides
SIZE:     [X] KB
AUDIENCE: [investor | founder | team | ...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open in PowerPoint or Google Slides (File → Import).
To regenerate: /cortex-ppt [audience]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## MUST-VERIFY (before declaring /cortex-ppt complete)

```
☐ STEP 1  — Arguments parsed: AUDIENCE + SCOPE confirmed
☐ STEP 2  — Context loaded: PROJECT_NAME + STACK extracted from at least one source
☐ STEP 3  — pptxgenjs available: "ok" OR "installed in [path]"
☐ STEP 4  — Build script written: build-deck.js created at [path]
☐ STEP 5  — Build ran: node exited 0, output path shown
☐ STEP 6  — File verified: size > 50KB shown
☐ Completion block rendered with exact output path
```
