# @uns/shared

Shared TypeScript types, constants, and utilities used by all packages in the UNS monorepo.

## Contents

### Types

| Export | Description |
|---|---|
| `KpiPlaceholderKey` | Union of all valid KPI placeholder names (e.g. `"unTranscribedMinutes"`) |
| `KPI_PLACEHOLDERS` | `as const` array of all KPI names — source of truth for valid placeholder keys |
| `KpiCacheEntry` | A row in the KPI cache table — discriminated by `entryType: "value" \| "requested"` |
| `KpiCacheEntryInput` | `KpiCacheEntry` without `id` — used when upserting |
| `KpiEntryType` | `"value" \| "requested"` |
| `USER_SCOPED_GROUPS` | Groups whose KPI cache entries require a `userId`: `my_recording_network`, `my_direct_reports` |
| `UserScopedGroup` | Type derived from `USER_SCOPED_GROUPS` |
| `TriggerCondition` | A single `{ kpi, operator, threshold }` rule on a message definition |
| `TriggerOperator` | `"gt" \| "gte" \| "lt" \| "lte" \| "eq"` |
| `TRIGGER_OPERATORS` | Display-friendly `{ value, label }` list for the message editor UI |
| `MessageDefinition` | Full message schema (title, body, scope, triggerConditions, upgradePath, status, displayOrder) |
| `UserGroup` | `"my_recording_network" \| "my_organization" \| "my_direct_reports"` |
| `USER_GROUPS` | `as const` array of valid user groups |
| `DateRange` | `"last_week" \| "current_week" \| "last_fortnight" \| "last_month" \| "current_month"` |
| `DATE_RANGES` | `as const` array of valid date range labels |
| `LicenseTier` | `"Essential" \| "Advanced" \| "Ultimate IQ"` |

### Utilities

#### `resolveDateRange(range, now?)`

Resolves a relative `DateRange` label to actual `{ periodStart, periodEnd }` ISO date strings.

```typescript
import { resolveDateRange } from "@uns/shared";

resolveDateRange("last_week");
// { periodStart: "2026-03-02", periodEnd: "2026-03-08" }
```

Week boundaries follow the ISO convention (Monday–Sunday). All dates are computed in UTC.

| Range | Result |
|---|---|
| `last_week` | Monday–Sunday of the previous calendar week |
| `current_week` | Monday of the current week through today |
| `last_fortnight` | 14 days ending on the Sunday before the current week |
| `last_month` | 1st–last day of the previous calendar month |
| `current_month` | 1st of the current month through today |

## Build

```bash
npm run build       # compile to dist/
npm run typecheck   # type-check without emitting
```

This package uses TypeScript project references (`composite: true`) so downstream packages can reference it directly.
