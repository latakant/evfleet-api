╔══════════════════════════════════════════════════════════════════════╗
║  CERT  /cortex-eval  |  v8.0  |  TIER: 4  |  BUDGET: MODERATE     ║
╠═══════════════╦══════════════════════════════════════════════════════╣
║ LAYER SCOPE   ║ L1 · L3 · L8 · L9                                   ║
║ AUTHORITY     ║ ANALYST                                              ║
║ CAN           ║ - Create eval definitions in .claude/evals/         ║
║               ║ - Run eval suites against code                      ║
║               ║ - Write grader scripts                              ║
║               ║ - Append results to ai/lifecycle/LAYER_LOG.md       ║
║ CANNOT        ║ - Modify source code based on eval results alone    ║
║               ║ - Auto-promote evals to CI without PA review        ║
║ REQUIRES      ║ - MASTER.md loaded                             ║
║ ESCALATES     ║ - pass^k < 80% on CRITICAL path → HARD HALT        ║
║ OUTPUTS       ║ - Eval report · pass@k · pass^k · grader verdict    ║
║               ║ - Completion block (COMPLETE or HARD HALT)          ║
╚═══════════════╩══════════════════════════════════════════════════════╝

Eval-Driven Development (EDD) for AI features and critical code paths.
Define evals BEFORE coding — they are the spec made executable.
Use when building AI-powered features, critical algorithms, or any code
where "it looks right" is not sufficient.

$ARGUMENTS

Parse from $ARGUMENTS:
- `define <feature>`  — create eval definition before coding
- `run <eval-name>`   — run existing eval suite
- `report`            — show all eval results for current feature
- `promote <eval-name>` — move eval to CI pipeline (PA required)

---

## THE EDD PHILOSOPHY

> Evals are to AI features what unit tests are to functions.
> The difference: unit tests verify deterministic outputs.
> Evals verify probabilistic outputs — they measure how OFTEN you're right.

**Without evals:** "I tested it manually, looks good."
**With evals:** "pass@3 = 97%, pass^3 = 81% — acceptable for this risk level."

CORTEX applies EDD to:
- AI-powered features (LLM calls, embeddings, classification)
- Complex business algorithms (pricing, routing, ranking)
- Data transformations with many edge cases
- Regression prevention on fixed bugs

---

## EVAL TYPES

### Type 1 — Capability Evals
Verify new functionality works across representative inputs.
Run when: building a new feature.

```
eval/
  name:       product-search-ranking
  type:       capability
  inputs:     20 sample queries (edge cases + happy path)
  expected:   relevant products ranked first
  grader:     model (Claude evaluates relevance)
  threshold:  pass@3 ≥ 85%
```

### Type 2 — Regression Evals
Ensure existing functionality doesn't break after changes.
Run when: modifying code that has previously worked.

```
eval/
  name:       order-total-calculation
  type:       regression
  inputs:     50 historical orders with known totals
  expected:   exact totals (deterministic)
  grader:     code (exact match)
  threshold:  pass^1 = 100% (must always be correct)
```

---

## MODEL ROUTING DECISION TABLE

Choose the right model for each eval task to minimize cost without sacrificing quality.

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Classification, extraction, simple transforms | **Haiku** | Low reasoning, high volume — use for graders, batch evaluations |
| Code generation, multi-step reasoning, analysis | **Sonnet** | Default for most AI feature work |
| Architecture decisions, novel problems, high-stakes | **Opus** | Reserve for genuinely hard reasoning — slow and expensive |

**Cost tracking (non-negotiable):** Every pipeline stage records model used + token count.
Log to `ai/lifecycle/EVAL_LOG.md` — required for any AI feature.

**Retry logic (narrow — do not expand):**
```
Retry on:     rate limits (429), transient network (503)
NEVER retry:  model refusals, validation failures, logical errors
Max retries:  3 with exponential backoff (1s, 2s, 4s)
```

---

## pass@k vs pass^k — Critical Distinction

| Metric | Definition | When to use |
|--------|-----------|-------------|
| `pass@k` | At least ONE of k runs passes | Creative tasks — one good answer is enough |
| `pass^k` | ALL k runs must pass | Financial logic, security, critical paths — every run must be correct |

**Examples:**
- Product description generation → `pass@3 ≥ 85%` (one good one is fine)
- Order total calculation → `pass^3 = 100%` (must be correct every time)
- OTP verification → `pass^5 = 100%` (zero tolerance for wrong answers)
- Search ranking → `pass@5 ≥ 80%` (majority correct is acceptable)

**Rule:** Any code path involving money, auth, or irreversible actions requires `pass^k`, not `pass@k`.

---

## GRADER TYPES

### Code Grader (deterministic — use for math, transforms, exact outputs)
```typescript
// .claude/evals/order-total/grader.ts
export function grade(output: string, expected: string): boolean {
  const parsed = parseFloat(output)
  const target = parseFloat(expected)
  return Math.abs(parsed - target) < 0.01  // ±1 paise tolerance
}
```

### Model Grader (probabilistic — use for quality, relevance, language)
```
GRADER PROMPT:
You are evaluating search result quality.

Query: {query}
Results returned: {output}
Expected: Results should include {expected} and be ranked by relevance.

Evaluate:
1. Is the expected item present? (YES/NO)
2. Is it ranked in the top 3? (YES/NO)
3. Are results generally relevant? (YES/NO)

Verdict: PASS if all YES, FAIL otherwise.
```

### Human Grader (use for subjective quality, legal/financial correctness)
```
Flag for human review. Output to: ai/evals/pending-review.md
Include: input, output, why automated grading is insufficient.
Do not auto-pass or auto-fail — mark as PENDING.
```

---

## PASS@K vs PASS^K — CHOOSING THE RIGHT METRIC

```
pass@k = At least ONE of k attempts succeeds
         Use when: exploring capability, acceptable that some attempts fail
         Formula: 1 - (failure_rate)^k

pass^k = ALL k attempts succeed
         Use when: consistency required, every user must get correct output
         Formula: (success_rate)^k

Example for success_rate = 0.85:
  pass@1 = 0.85    pass^1 = 0.85
  pass@3 = 0.997   pass^3 = 0.614   ← big difference!
  pass@5 = 0.9999  pass^5 = 0.444
```

**Which to use:**

| Feature | Metric | Why |
|---------|--------|-----|
| Search ranking | pass@3 ≥ 85% | One good attempt acceptable |
| Payment calculation | pass^1 = 100% | Every attempt must be exact |
| Product description generation | pass@5 ≥ 90% | Creative — best-of-5 is fine |
| OTP validation | pass^1 = 100% | Must always work |
| AI recommendation | pass@3 ≥ 80% | Some variation acceptable |
| Invoice total | pass^1 = 100% | Financial — no tolerance |

---

## STEP 1 — DEFINE (before writing any code)

Create eval definition at `.claude/evals/<feature-name>/eval.json`:

```json
{
  "name": "product-search-ranking",
  "type": "capability",
  "feature": "search",
  "created": "2026-03-01",
  "grader": "model",
  "metric": "pass@3",
  "threshold": 85,
  "k": 3,
  "inputs": [
    {
      "id": "happy-path-01",
      "query": "blue cotton kurta size M",
      "expected": "product_id: prod_xyz (blue cotton kurta M) in top 3"
    },
    {
      "id": "typo-01",
      "query": "bule kurta",
      "expected": "result should still include blue kurta despite typo"
    },
    {
      "id": "empty-result",
      "query": "xqz gibberish product",
      "expected": "empty results or graceful no-match message"
    }
  ]
}
```

**Minimum inputs per eval:**
- 5 happy-path cases
- 3 edge cases (empty, typo, boundary)
- 2 known-failure cases (verify graceful handling)

---

## STEP 2 — RUN

```bash
# Run eval suite
node .claude/evals/run.js --eval=product-search-ranking --k=3

# Output format:
# Run 1/3: input[happy-path-01] → PASS
# Run 1/3: input[typo-01] → PASS
# Run 1/3: input[empty-result] → PASS
# ...
# pass@3: 9/10 inputs had ≥1 pass = 90% ✔ (threshold: 85%)
# pass^3: 7/10 inputs passed all 3 = 70%
```

---

## STEP 3 — EVALUATE REPORT

After running, output:

```
EVAL REPORT — product-search-ranking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Feature:   search
Metric:    pass@3
Threshold: 85%
Runs:      3 × 10 inputs = 30 total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pass@3:    90% ✔  (threshold 85%)
pass^3:    70%    (informational)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILED CASES:
  input[typo-02] — all 3 runs failed
  "bule kapda" → returned empty results
  Expected: blue clothing variants
  Fix: extend spell-correction dictionary

PASSED:  9/10 inputs ✔
FAILED:  1/10 input ✖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT:  PASS (above threshold)
          Note: fix typo-02 before prod
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## STEP 4 — REGRESSION GUARD

After any code change in a feature with evals, re-run before committing:

```bash
node .claude/evals/run.js --eval=product-search-ranking --mode=regression
```

If pass rate drops below threshold:
- **HARD HALT** — do not commit
- Identify which inputs regressed
- Fix root cause
- Re-run to confirm recovery

---

## EVAL STORAGE STRUCTURE

```
.claude/evals/
  product-search-ranking/
    eval.json           ← definition
    grader.ts           ← code grader (if applicable)
    grader-prompt.md    ← model grader prompt (if applicable)
    results/
      2026-03-01.json   ← run results (timestamped)
  order-total/
    eval.json
    grader.ts
    results/
      2026-03-01.json
```

---

## WHEN TO RUN EVALS

| Trigger | Action |
|---------|--------|
| Before building an AI feature | `/cortex-eval define <feature>` |
| After implementing the feature | `/cortex-eval run <feature>` |
| Before committing any AI change | `/cortex-eval run <feature> --mode=regression` |
| Weekly on CRITICAL path evals | Scheduled run, log to LAYER_LOG |
| After dependency upgrade | Run all evals to check for regression |

---

## COMPLETION

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-eval                    COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eval       {name}
Metric     {pass@k / pass^k}
Result     {X}% — {PASS ✔ / FAIL ✖}
Inputs     {n} tested · {n} passed · {n} failed
Logged     LAYER_LOG · {date}
Next       {fix failing cases | /cortex-commit if all pass}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If pass^k < 80% on CRITICAL path:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CORTEX  /cortex-eval                  HARD HALT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Policy     CRITICAL path eval below threshold
Metric     pass^{k} = {X}% < 80%
Failed     {list of failing inputs}
Fix first  Resolve failing cases → re-run → commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
