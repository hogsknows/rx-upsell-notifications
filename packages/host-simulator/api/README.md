# @uns/host-simulator-api

Simulates the RX host application's API surface. Provides test personas, user context, and the KPI cache table used by the Message Generator to evaluate and resolve upsell messages.

**Port:** `3003`

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/personas` | List test personas for the login simulator |
| `GET` | `/api/user-context/:userId` | User context with scope-keyed KPI values |
| `GET` | `/api/kpis` | List KPI cache entries (supports `?tenantId=`, `?userId=`, `?entryType=`) |
| `PUT` | `/api/kpis` | Upsert a KPI cache entry (value or request) |
| `DELETE` | `/api/kpis/:id` | Remove a KPI cache entry |

## KPI cache

The KPI cache is the data store that bridges computed KPI values (produced by a background process) with the messages that depend on them.

### Cache entry natural key

```
(tenantId, userId?, kpiName, userGroup, periodStart, periodEnd)
```

`userId` is required for user-scoped groups (`my_recording_network`, `my_direct_reports`) and omitted for tenant-wide groups (`my_organization`).

### Entry types

| `entryType` | Meaning |
|---|---|
| `"value"` | A computed value exists — messages can evaluate against it |
| `"requested"` | No value yet — the message generator registered a need for this KPI |

Upserting a `"value"` over an existing `"requested"` entry promotes it and preserves `requestedAt` for audit.

### Background process workflow

```
1. GET /api/kpis?entryType=requested          ← discover what needs computing
2. Compute each KPI value
3. PUT /api/kpis  { entryType: "value", ... } ← supply the result
   └─ entry promoted: "requested" → "value"
   └─ dormant messages unblocked on next login
```

### Filtering

```
GET /api/kpis?tenantId=tenant-acme-001
GET /api/kpis?entryType=requested
GET /api/kpis?tenantId=tenant-acme-001&userId=user-alice-001&entryType=requested
```

## User context

`GET /api/user-context/:userId` returns the user's licence info and a scope-keyed KPI map:

```json
{
  "userId": "user-alice-001",
  "tenantId": "tenant-acme-001",
  "licenseTier": "Essential",
  "isOnTrial": false,
  "instanceFeatureFlag": true,
  "tenantFeatureFlag": true,
  "kpis": {
    "last_week|my_organization": {
      "unTranscribedMinutes": 180,
      "totalCallsThisMonth": 120
    }
  }
}
```

Only scopes with at least one `"value"` entry in the cache are included. Absent scopes cause messages targeting that scope to be dormant.

## Seed data

`data/kpis.json` is committed with native KPI values for the test tenants. AI KPIs (`countAbusiveCalls`, `wordCloudWord1–4`) are intentionally absent to demonstrate dormant message behaviour.

`data/personas.json` contains the set of test users available in the login simulator.

## Development

```bash
npm run dev    # tsx watch on port 3003
npm run build  # compile TypeScript to dist/
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3003` | Port to listen on |
