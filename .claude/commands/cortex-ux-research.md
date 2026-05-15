# /cortex-ux-research — UX Research & User Insight
# skill: cortex-ux-research | domain: discovery | version: 1.0 | added: 2026-04-27
# Diagnose user friction, validate features, and surface behavioural evidence before building.

---

## TRIGGER

Use when:
- Deciding whether to build a feature (validate demand first)
- Diagnosing why users drop off, churn, or don't activate
- Writing user interview questions or usability test scripts
- Prioritising a backlog based on user pain (not assumptions)
- Translating vague user feedback into actionable product decisions

---

## EXECUTION

### STEP 1 — Research Framing

Before any research activity, define:
```
Research question:    [the specific thing you need to know — one sentence]
Decision it informs:  [what will you build/change/cut based on the answer]
Evidence type needed: [behavioural / attitudinal / quantitative / qualitative]
Confidence required:  [low / medium / high — determines sample size]
Deadline:             [when the decision must be made]
```

Never do research without a decision it feeds. Research without a decision is just curiosity.

---

### STEP 2 — JTBD (Jobs to be Done) Mapping

For any product or feature, map the job:
```
Functional job:    [what the user is trying to accomplish]
Emotional job:     [how they want to feel while doing it]
Social job:        [how they want to be perceived by others]

Trigger situation: [what prompts them to look for a solution]
Current solution:  [what they use today — even if it's a spreadsheet or nothing]
Switching cost:    [what makes them stick with the current solution]

Job statement:     "When [situation], I want to [motivation], so I can [outcome]."
```

Understanding the current solution is more important than understanding the desired solution.

---

### STEP 3 — User Interview Design

Output a structured interview guide:
```
OBJECTIVE: [what you will learn from this interview]
DURATION:  [30–45 min recommended]
RECRUITS:  [who — be specific: not "users", but "users who churned in first 14 days"]

OPENING (5 min — build rapport, no leading)
  - Tell me about your role / what you do day-to-day
  - Walk me through a recent time you [relevant context]

DISCOVERY (15 min — past behaviour, not hypotheticals)
  - How do you currently handle [problem]?
  - When did you last do this? Walk me through exactly what happened.
  - What's frustrating about how you do it today?
  - What have you tried before?

SOLUTION PROBE (10 min — reactions, not opinions)
  [Show existing product / prototype / description]
  - What's your first reaction?
  - What would you expect to happen if you clicked [X]?
  - Where did you get confused?
  - What would make you trust this?

CLOSING (5 min)
  - If this existed exactly as you'd want it, what would be different?
  - Who else do you know who has this problem?
```

Rules: ask about past behaviour, not future intentions. "Would you use this?" is invalid data.

---

### STEP 4 — Funnel Drop-Off Diagnosis

For a known drop-off point, systematically diagnose:
```
Drop-off location:    [specific step / screen / moment]
Drop-off rate:        [X% of users who reach here don't proceed]

Possible causes (rank by likelihood):
  □ Motivation gap    — user doesn't understand the value of proceeding
  □ Friction gap      — the action required is too hard or confusing
  □ Trust gap         — user doesn't trust the product at this moment
  □ Expectation gap   — the screen doesn't match what they expected
  □ Timing gap        — user isn't ready at this point in the flow

Evidence to collect:
  □ Session recordings (Hotjar / FullStory) — what do users do before leaving?
  □ Rage clicks — where are users clicking that doesn't do anything?
  □ Form field drop-off — which field causes abandonment?
  □ User interviews — ask churned users why they stopped

Minimum evidence before changing UI: 3 user sessions + 1 interview confirming the same cause.
```

---

### STEP 5 — Usability Test Script

For testing a specific flow:
```
TASK: [written in user language, no hints about the solution]
  Example: "You want to order lunch. Go ahead."
  Not: "Click the Order button to place an order."

SUCCESS CRITERIA:
  □ Task completed without assistance
  □ User expressed no confusion at [specific step]
  □ Time-on-task < [X seconds]

OBSERVATION NOTES FORMAT:
  Step:           [what the user did]
  Hesitation:     [where they paused or seemed unsure]
  Words used:     [exact language — this goes into copy]
  Error:          [what went wrong, if anything]
  Emotion signal: [frustration / delight / confusion]

MINIMUM SAMPLE: 5 users to find 80% of usability issues (Nielsen's law)
```

---

### STEP 6 — Insight Synthesis

After collecting evidence, synthesise into actionable findings:
```
INSIGHT #[N]
Observation:    [what users did or said — factual]
Pattern:        [how many users showed this — "3 of 5 users..."]
Root cause:     [why this happens — your interpretation]
Impact:         [HIGH / MEDIUM / LOW — what breaks if this isn't fixed]
Recommendation: [specific, testable change — not "improve UX"]
Evidence:       [link to session / quote / data point]
```

Output insights in impact order. Never mix observation with interpretation.

---

### OUTPUT FORMAT

Deliver:
1. Research framing (question + decision + evidence type)
2. JTBD map for the target user/feature
3. Interview guide (if research is planned)
4. Drop-off diagnosis (if a funnel problem exists)
5. Usability test script (if a flow is being tested)
6. Synthesised insights in priority order
7. Top 3 product changes recommended based on evidence

Flag: any insight based on fewer than 3 data points as LOW CONFIDENCE.
Flag: any recommendation that requires a major rebuild as HIGH RISK — suggest smaller test first.