# Upsell Notification System (UNS) — RX Host App Feature

## Overview

This document provides context and guidance for implementing the **Upsell Notification System (UNS)** within the RX host application. The UNS displays targeted license upgrade notifications to users post-login, driving adoption of Advanced and Ultimate IQ license tiers.

---

## Architecture Responsibilities

### RX Host App is responsible for:
- **Rendering the notification UI** — display messages returned by the Message Generator
- **Triggering `GetMessages(userId: GUID)`** on successful user login
- **Handling user actions** (Dismiss, Request Upgrade, Disable Notifications)
- **Exposing an API** to the UNS/Message Generator for tenant and user data lookups (KPIs, license info, usage patterns)

### Message Generator (UNS microservice) is responsible for:
- Message creation, management, and delivery logic
- Deciding which messages to show and when
- Tracking success metrics (clicks, dismissals, upgrades, opt-outs)
- Providing simulation/preview tooling for marketing teams

> **Note:** The Message Generator is intentionally decoupled from the RX app. RX calls it and renders what it returns — it does not own message logic.

---

## Login Flow

```
User Login (success)
  └─► Host App calls MessageGenerator.GetMessages(userId: GUID)
        ├─ No messages returned → continue to app as normal
        └─ Messages returned → display notification modal
              ├─ Multiple messages → user scrolls through them
              └─ Last message → show action buttons (Dismiss / Request Upgrade / Disable)
```

---

## Start Conditions (all must be true to show notifications)

| Condition | Details |
|---|---|
| Feature flag enabled at **Instance** level | Master switch |
| Feature flag enabled at **Tenant** level | Set during provisioning |
| No active trial | During trial, all licenses behave as Ultimate IQ — no upsell needed |

---

## User Actions

| Action | Behaviour |
|---|---|
| **Dismiss** | Close the current notification |
| **Request Upgrade** | Send upgrade request to Site Admin (includes message content). If user *is* Site Admin, show direct Store link |
| **Disable Notifications** | Permanently opt this user out of upsell notifications |

---

## API Contract (RX → UNS)

RX must expose an API that the Message Generator can query. Endpoints should support:

- **Tenant/user license info** — current tier (Essential / Advanced / Ultimate IQ), number of users per tier
- **Usage metrics** — e.g. un-transcribed minutes, call volumes, feature adoption rates
- **KPI calculations** — computed insight values based on user/tenant data (specific KPIs to be defined per message definition)

> A full API specification document is required. This is a separate scoping deliverable.

---

## UI Requirements

- UI design owned by the **UI team** (refer to Appendix D: UI Wireframes)
- Notification modal must:
  - Support single and multi-message scroll flow
  - Surface action buttons only on the **last** message
  - Be concise and scannable
  - Display quantitative context (real KPI values from user data)

---

## Feature Flag

The message system has a **two-level feature flag**:

- `InstanceFeatureFlag` — enables/disables UNS for the entire instance
- `TenantFeatureFlag` — enables/disables UNS per organisation (set at provisioning)

Both must be `true` for notifications to appear.

---

## Message Quality Standards

All messages delivered to users must:
- Be relevant to the user's actual usage patterns
- Be concise and scannable
- Clearly state a tangible business benefit
- Include quantitative context (e.g. actual KPI values, un-transcribed minutes)

---

## Success Metrics (tracked by UNS, not RX)

| Metric | How Tracked |
|---|---|
| Upgrade Request Rate | Count of "Request Upgrade" clicks |
| License Conversion Rate | Actual license upgrades during campaign |
| Dismiss Rate | Count of "Dismiss" actions per org/user |
| Opt-out Rate | Count of "Disable" actions — high rate signals messaging issues |
| Tier Distribution Change | Shift from Essential-heavy → Advanced/Ultimate IQ over time |

---

## Open Questions / Decisions

| Question | Status |
|---|---|
| Individual vs Organisation focus in messages | Resolved — message definition handles this |
| Do unlicensed users count toward trigger threshold? | TBD — likely a per-message-definition control |
| Opt-out: permanent or temporary (sleep)? | Once all defined messages are exhausted, system stops. Reseller/Tenant manager can reset message state for all users (useful for testing) |

---

## Appendices

| Appendix | Contents |
|---|---|
| A | License Feature Comparison Matrix |
| B | Sample Marketing Messages by License Tier |
| C | AI-Driven Messaging Model Evaluation |
| D | UI Wireframes and Design Specifications |

---

## Out of Scope for RX Host App

- Message authoring and management tooling
- Simulation/preview of notification flows (owned by UNS/Message Generator)
- Success metric tracking and analytics
- Marketing message content

---

## Key Principles

1. **RX is the delivery surface, not the decision maker** — never build message logic into RX.
2. **Message Generator is a microservice** — design the integration so it can evolve independently.
3. **API first** — the tenant/user data API must be scoped and agreed before UNS message definitions are authored.
4. **Feature flags at both levels** — always check instance then tenant before rendering anything.