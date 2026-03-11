# UNS Release 1 — Scope & Implementation Notes

## Overview

The first release of the Upsell Notification System focuses on driving upgrades to **Ultimate IQ**, with CIQ Pilot as the primary value proposition.

The core message is:

> *"You have insights of interest in your call data — but to understand them deeply, you need CIQ Pilot. Upgrade to Ultimate IQ."*

The system must work with **Native KPIs** (available without AI) from the outset, while being designed to unlock **AI KPIs** as transcription and analysis capacity becomes available.

---

## Objective

Convert Essential-tier users to **Ultimate IQ** by surfacing the value of CIQ Pilot — specifically:

- Conversational IQ analysis (sentiment, topics, escalation, abuse detection)
- Deeper insights from transcribed recordings
- KPIs that are only possible once recordings are transcribed and analysed

> **Note:** AI KPIs (sentiment, word cloud, escalation counts, etc.) require transcription and analysis to have already occurred. Native KPIs can be computed directly from the database without any AI processing.

---

## KPI Classification

### Native KPIs — Available Now

These are calculable by a database query, no AI required. They can power upsell messages immediately.

| # | KPI | Description |
|---|-----|-------------|
| 1 | **Average Talk Time** | Mean call duration over a given period (this week, last week, this month, etc.) |
| 2 | **Untranscribed Minutes** | Total minutes of recordings not yet transcribed — this week, last week, this month |
| 3 | **Untranscribed %** | Untranscribed minutes as a percentage of total recorded minutes (e.g. "60% of recordings have no transcript") |
| 4 | **Short Call Count** | Count of recordings below half the average talk time (e.g. avg = 240s → count calls < 120s), this week vs last week |
| 5 | **Hidden Insight Minutes** | Minutes of recordings with no AI analysis — week-on-week trend showing whether the volume is growing or shrinking |

---

### AI KPIs — Require Transcription & Analysis

These KPIs are only available once recordings have been transcribed and processed by the AI pipeline.

| # | KPI | Description |
|---|-----|-------------|
| 1 | **Abusive Call Count** | Number of calls flagged as abusive |
| 2 | **Negative Sentiment Call Count** | Number of calls with below-threshold sentiment |
| 3 | **Top 4 Word Cloud Terms** | Most frequent significant words across calls in the period |
| 4 | **Escalated Call Count** | Number of calls that were escalated |
| 5 | **Average Sentiment Score** | Mean sentiment score across all analysed calls in the period |

---

## Change Request — Dormant Message Behaviour

### The Problem

Some messages depend on KPIs that may not yet have a value (e.g. AI KPIs for untranscribed recordings). Rather than preventing these messages from existing in the system, they should be **dormant** until their required KPI becomes available.

### Proposed Behaviour

- A message can exist in the system with status `active`
- When the Message Generator evaluates a message, it requests the required KPI value from the Host API
- **If the KPI value is absent / the request fails** → the message is treated as dormant and is **not shown**
- **If the KPI value exists** → evaluation proceeds normally (trigger conditions are checked, message may be shown)

### Why This Matters

1. **Native KPI messages can go live immediately** — no dependency on AI processing
2. **AI KPI messages become active automatically** once the underlying data is processed — no manual re-activation needed

---

## KPI Cache Table Design

### Overview

The host instance maintains a **KPI cache table** that stores pre-computed KPI values indexed by the exact criteria used to look them up:

| Field | Description |
|---|---|
| `tenantId` | The organisation the value belongs to |
| `kpiName` | The KPI identifier (e.g. `unTranscribedMinutes`) |
| `userGroup` | Reporting scope — Release 1 uses `my_organization` only |
| `periodStart` | Actual calendar start date (ISO, e.g. `2026-03-02`) |
| `periodEnd` | Actual calendar end date (ISO, e.g. `2026-03-08`) |
| `entryType` | `"value"` (computed) or `"requested"` (pending computation) |
| `value` | The computed value — present only when `entryType` is `"value"` |
| `computedAt` | When the value was last calculated |
| `requestedAt` | When the request was first recorded |

### Why Actual Dates, Not Relative Labels

Message definitions use relative date ranges like `last_week` or `current_month`. These must be resolved to actual calendar dates at query time (based on the current date when the user logs in). The cache stores **actual dates** so that:

- Cache lookups are deterministic and unambiguous
- A value computed for "last week ending 2026-03-08" remains valid until next week
- Multiple callers resolving `last_week` on the same day hit the same cache entry

### Self-Populating KPI Requests

When the Message Generator evaluates a message and finds a required KPI absent, it **writes a `"requested"` record back to the host API**. This creates a self-populating queue of needed KPIs without any separate configuration step:

```
Login → GetMessages(userId)
  └─► Message Generator evaluates candidate messages
        ├─ KPI value found → evaluate trigger, show if conditions met
        └─ KPI value absent → message stays dormant
                              + write "requested" record to host KPI cache
                                (only if no record already exists for this scope)

Background process (host)
  └─► GET /api/kpis?entryType=requested
        └─► For each entry: compute the KPI, then PUT /api/kpis with entryType="value"
              └─► Next login: message is no longer dormant
```

The host background process only needs to poll `GET /api/kpis?entryType=requested` to know exactly which KPIs are needed, for which tenants, and for which date ranges. No separate configuration or KPI manifest is required.

### Entry Lifecycle

```
absent → "requested" → "value"
```

- **Absent**: KPI has never been needed for this scope — no record exists
- **Requested**: Message generator has flagged it as needed; background process has not yet computed it
- **Value**: Computed value is available; messages can evaluate and potentially show
- When a background process supplies a value for a `"requested"` entry, the `entryType` is promoted to `"value"` and `requestedAt` is preserved for audit

### Resolves Open Questions

| Open Question | Resolution |
|---|---|
| **a) How do we know which AI KPIs are needed?** | The Message Generator writes `"requested"` records automatically when it finds a KPI absent. The host polls these to build its compute queue. |
| **b) How do we store/cache KPI values efficiently?** | The cache table stores computed values keyed by actual date range + scope. No recomputation on every login — only when the background process runs or data changes. |
| **c) Scope of source recordings** | KPI entries are scoped to the tenant and period. On-demand transcriptions (from 1.4.1) are a product decision — the cache table design is neutral; the harvest process decides what to include. |

---

## KPI Scope — Release 1

The initial focus is **organisation-level KPIs** (`my_organization` user group). These are sufficient for generating targeted upsell messages at the tenant level.

User-level KPIs (enabling per-user or per-manager targeting) are **out of scope for Release 1** but should be considered in the data model to avoid rework. The `userGroup` field in the cache entry is already designed to support them.

---

## Summary — What Works at Launch vs. What is Blocked

| Capability | Status |
|---|---|
| Messages based on Native KPIs | ✅ Available at launch |
| Messages based on AI KPIs | ⏸ Dormant until background process computes values |
| Dormant message support (absent KPI = message not shown) | ✅ Implemented |
| Self-populating KPI request queue | ✅ Message Generator writes `"requested"` records automatically |
| KPI cache table (actual date ranges, value + requested entries) | ✅ Designed |
| Background process to compute AI KPIs | ❓ Separate workstream — host polls `?entryType=requested` |
| Organisation-level KPI targeting | ✅ In scope |
| User/manager-level KPI targeting | 🔜 Future release |
| On-demand transcription exclusion logic | ❓ Product decision — does not affect cache table design |
