# /cortex-analytics — Data Analytics & KPI Strategy
# skill: cortex-analytics | domain: analytics | version: 1.0 | added: 2026-04-27
# Given a product or feature → define metrics, build KPI framework, surface actionable insights.

---

## TRIGGER

Use when:
- Deciding which metrics to track for a product, feature, or launch
- Diagnosing why growth, retention, or revenue is stalling
- Designing a dashboard or reporting structure
- Running cohort, funnel, or churn analysis
- Setting up A/B test success criteria
- Calculating CAC, LTV, or unit economics

---

## EXECUTION

### STEP 1 — Context Intake

Collect before analysing:
```
1. Product type: (SaaS / e-commerce / marketplace / QSR / B2B / B2C)
2. Stage: (pre-launch / early / growth / scaling)
3. Current problem: (not enough users / users churn / revenue flat / can't measure)
4. What data exists: (DB queries / GA4 / Mixpanel / nothing yet)
5. Decision to make: (what will you do differently based on this analysis?)
```

Do not produce metrics without knowing what decision they will inform.

---

### STEP 2 — North Star + KPI Tree

Define the hierarchy:
```
NORTH STAR METRIC
  └─ The single number that best represents product value delivery
  └─ Must be: user-behaviour-based (not vanity), causally linked to revenue

LEVEL 1 — Growth metrics    (acquisition + activation)
LEVEL 2 — Retention metrics (engagement + churn)
LEVEL 3 — Revenue metrics   (monetisation + unit economics)
LEVEL 4 — Health metrics    (ops + quality signals)
```

Output format per metric:
```
Metric name:        [name]
Formula:            [how to calculate]
Target:             [what good looks like]
Data source:        [which table / event / API]
Review cadence:     [daily / weekly / monthly]
Owner:              [who acts on it]
```

---

### STEP 3 — Funnel Analysis

Map the full user journey with drop-off points:
```
STAGE               METRIC              BASELINE    TARGET
──────────────────────────────────────────────────────────
Awareness           Visitors / Reach    ?           ?
Acquisition         Sign-ups / Installs ?           ?
Activation          [key action]        ?           ?
Retention           D7 / D30 return     ?           ?
Revenue             Conversion to paid  ?           ?
Referral            Organic share rate  ?           ?
```

For each stage with >30% drop-off: flag as PRIORITY LEAK.

---

### STEP 4 — Cohort & Retention Analysis

Define cohort structure:
```
Cohort by:          [signup week / first purchase / onboarding completion]
Measure:            [return rate / repeat purchase / feature usage]
Healthy benchmark:  [industry standard for this product type]
Current gap:        [observed vs benchmark]
Root cause hypotheses:
  H1: [most likely cause]
  H2: [second candidate]
  H3: [third candidate]
Next step:          [which hypothesis to test first and how]
```

---

### STEP 5 — Unit Economics (for revenue products)

```
CAC  = Total acquisition spend ÷ New customers acquired
LTV  = ARPU × Average customer lifespan (months)
      [or] Average order value × Purchase frequency × Retention period
Payback period = CAC ÷ Monthly gross margin per customer

LTV:CAC interpretation:
  < 1:    Losing money on every customer — stop paid acquisition
  1–2:    Barely viable — optimise before scaling
  2–3:    Healthy — grow carefully
  > 3:    Scale aggressively

Gross margin = (Revenue − COGS) ÷ Revenue
```

Flag: if gross margin < 40% for SaaS or < 20% for e-commerce — pricing problem, not marketing problem.

---

### STEP 6 — A/B Test Design (if applicable)

```
Hypothesis:         [changing X will improve Y by Z%]
Control:            [current state]
Variant:            [proposed change]
Primary metric:     [single success metric]
Guardrail metrics:  [what must not get worse]
Minimum sample:     [calculated via power analysis: target 80% power, p=0.05]
Duration:           [minimum days to avoid novelty effect — usually ≥ 2 weeks]
Decision rule:      [p < 0.05 AND practical significance threshold met]
```

Never end a test early because it looks good. Run the full duration.

---

### STEP 7 — Dashboard / Reporting Structure

Output a reporting cadence:
```
DAILY    → [metric 1, metric 2]     — who reviews, what triggers action
WEEKLY   → [metric 3, metric 4]     — team review, decision checkpoint
MONTHLY  → [full KPI tree review]   — founder review, strategic adjustment
```

Recommended stack by budget:
- Free: GA4 + Looker Studio
- Low: PostHog (self-hosted) + Metabase
- Mid: Mixpanel + Metabase
- Full: Amplitude + dbt + data warehouse

---

### OUTPUT FORMAT

Deliver:
1. North Star metric + rationale (2 sentences)
2. KPI tree (Level 1–4, structured table)
3. Funnel map with PRIORITY LEAK flags
4. Cohort analysis structure + retention benchmark
5. Unit economics calculation (if revenue product)
6. A/B test design (if a test is being considered)
7. Dashboard/reporting cadence
8. Top 3 actions to take this week based on the analysis

Flag clearly: any metric that cannot be measured with current data infrastructure.