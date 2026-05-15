╔══════════════════════════════════════════════════════════════════════╗
║  CORTEX  /cortex-test-gen  |  v1.0  |  TIER: 1  |  BUDGET: LEAN   ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ DOMAIN        ║ qa                                                   ║
║ AUTHORITY     ║ BUILDER                                              ║
║ CAN           ║ - Generate test cases from feature spec or endpoint  ║
║               ║ - Apply test pyramid: unit · integration · E2E      ║
║               ║ - Cover happy + sad + boundary paths                 ║
║               ║ - Apply risk-calibrated coverage targets             ║
║               ║ - Output ready-to-implement test skeletons           ║
║ CANNOT        ║ - Run tests or read test output                      ║
║               ║ - Determine if tests pass (→ cert-verify)            ║
║               ║ - Replace domain knowledge about business rules      ║
║ REQUIRES      ║ - adapters/qa/vocabulary.md loaded                   ║
║               ║ - adapters/qa/patterns.md loaded                     ║
║               ║ - Feature spec OR endpoint description               ║
║ PAIRED WITH   ║ /cert-verify · /cert-review · /cortex-qa-start       ║
╚═══════════════╩══════════════════════════════════════════════════════╝

/cortex-test-gen v1.0 — Generate test cases from a spec, feature, or endpoint.

---

## INPUT PARSING

Parse from user message:
- `<target>` — what to test: endpoint name, service method, feature description, or paste a spec
- `<type>` — optional: unit | integration | e2e | all (default: all)
- `<risk>` — optional: A | B | C | D (default: infer from CLAUDE.md app_type)
- `--skeleton` — if provided, output runnable test file skeleton (not just cases)

---

## STEP 1 — Load QA Context

Read:
1. `adapters/qa/vocabulary.md` — shared language, test pyramid, coverage targets
2. `adapters/qa/patterns.md` — test patterns by category
3. `adapters/qa/rules.md` — 8 QA laws

Check `knowledge/instincts.json` for `"domain": "qa"` or stack-relevant entries.
If found → note patterns. Do not re-invent known solutions.

Read CLAUDE.md → identify: stack, app_type, risk_category.
Risk category → coverage target (S1 from blueprint-qa-strategy.md).

---

## STEP 2 — Analyse the Target

Parse the provided target (spec, endpoint, or feature description):

```
ANALYSIS
─────────────────────────────────────────
Target:       [what is being tested]
Type:         [service method | API endpoint | component | feature flow]
Risk:         [A/B/C/D] → Coverage target: [X]%
Dependencies: [what external dependencies exist: DB, queue, HTTP client]
Business rules identified:
  1. [rule extracted from spec]
  2. [rule extracted from spec]
  ...
```

If no spec is provided → ask:
```
To generate accurate tests I need:
1. What does this [endpoint/method] do? (describe the behaviour)
2. What are the inputs and expected outputs?
3. Are there any business rules I should know? (stock limits, auth requirements, etc.)
```

---

## STEP 3 — Generate Test Cases by Layer

### UNIT TESTS

For each business rule and code path:

```
UNIT TESTS — [target name]
─────────────────────────────────────────
HAPPY PATHS
  [ ] [method] with valid input returns [expected output]
  [ ] [method] with [variant] input returns [expected variant output]

SAD PATHS (required for every happy path)
  [ ] [method] with null input throws [exception type]
  [ ] [method] with invalid [field] throws [exception type] with message [...]
  [ ] [method] when [dependency] returns error throws [exception type]

BOUNDARY TESTS
  [ ] [method] with minimum valid value [X] returns [expected]
  [ ] [method] with maximum valid value [X] returns [expected]
  [ ] [method] with value just below minimum throws [exception]

MOCK STRATEGY
  Mock: [list dependencies to mock and how]
  Never mock: [list what should be real]
```

### INTEGRATION TESTS

For each module boundary:

```
INTEGRATION TESTS — [target name]
─────────────────────────────────────────
DB INTERACTION
  [ ] [method] with valid input: verify return value AND DB state
  [ ] [method] with conflicting unique constraint: verify 409 response
  [ ] [method] transaction rollback on partial failure: verify no partial state

API ENDPOINT (if applicable)
  [ ] [METHOD] /[path] with valid auth + valid body → [status] + [response shape]
  [ ] [METHOD] /[path] with no auth → 401
  [ ] [METHOD] /[path] with wrong role → 403
  [ ] [METHOD] /[path] with invalid body → 400 with validation errors

FIXTURES NEEDED
  [list minimum DB records needed for each test + cleanup]
```

### E2E TESTS (P1 paths only)

Only if the target is a P1 user journey:

```
E2E TESTS — [journey name]
─────────────────────────────────────────
JOURNEY: [describe the full user flow]

STEPS
  [ ] Setup: [seed minimum required state via API]
  [ ] Step 1: [user action]
  [ ] Step 2: [user action]
  [ ] ...
  [ ] Assert: [final UI state] + [API state] + [DB state]
  [ ] Teardown: [clean up seeded data]

SAD PATH JOURNEY
  [ ] [same journey but with failure injected at step N]
  [ ] Assert: [error state displayed] + [no partial data left in DB]
```

---

## STEP 4 — Coverage Analysis

```
COVERAGE ANALYSIS
─────────────────────────────────────────
Risk category:   [A/B/C/D]
Target:          [X]% line coverage
Tests generated: [N unit] + [N integration] + [N E2E]
Paths covered:   [list the main paths]
Paths NOT covered (intentional):
  [list any excluded paths and why]

Estimated coverage after tests: [X]%
Gap to target: [none | N% remaining — these paths still need tests]
```

---

## STEP 5 — Skeleton Output (if --skeleton)

Generate a runnable test file skeleton with `describe` and `it` blocks:

```typescript
// [filename].spec.ts — generated by /cortex-test-gen
// Target: [target name]
// Generated: [date]

describe('[ClassName or endpoint]', () => {

  // Setup
  let [service/subject]: [Type];
  let [mock]: jest.MockedObject<[Type]>;

  beforeEach(async () => {
    // [setup code]
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('[method name]', () => {

    it('[happy path description]', async () => {
      // arrange
      // act
      // assert
    });

    it('[sad path 1 description]', async () => {
      // arrange
      // act + assert (expect to throw)
    });

    it('[sad path 2 description]', async () => {
      // arrange
      // act + assert
    });

  });

});
```

Fill in only what can be inferred from the spec. Leave `// arrange` / `// act` / `// assert` comments for the developer to complete with real values.

---

## COMPLETION BLOCK

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL:      cortex-test-gen
TARGET:     [name]
STATUS:     COMPLETE
UNIT:       [N] test cases
INTEGRATION:[N] test cases
E2E:        [N] test cases (P1 paths only)
COVERAGE:   ~[X]% estimated
NEXT:       implement tests → cert-verify → cortex-qa-report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
