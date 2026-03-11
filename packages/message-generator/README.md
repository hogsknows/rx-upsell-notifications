# @uns/message-generator

The UNS microservice. Called by the RX host app on each successful user login. Fetches message definitions, evaluates eligibility rules against the user's context, resolves KPI placeholders, and returns an ordered list of messages to display.

**Port:** `3002`

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/messages?userId={guid}` | Get eligible messages for a user (called on login) |
| `POST` | `/api/events/dismiss` | Record a message dismissal |
| `POST` | `/api/events/upgrade-request` | Record an upgrade request click |
| `POST` | `/api/events/disable` | Permanently opt a user out of notifications |
| `POST` | `/api/events/reset` | Reset delivery state — `{ userId }` for one user, omit for all |

## How `GET /api/messages` works

1. Fetches the user's context from the host API (`GET /api/user-context/:userId`)
2. Fetches all active message definitions from the message editor API
3. Filters messages through the evaluation pipeline:
   - Feature flags must be enabled (instance + tenant)
   - User must not be on trial
   - User must not have opted out
   - User must not have already seen the message
   - User's license tier must be in the message's upgrade path
   - All trigger conditions must pass against the scope's KPI values
   - All `{{placeholder}}` keys referenced in title/body must be present in the scope's KPI values
4. Resolves `{{placeholder}}` tokens in title and body with actual KPI values
5. Returns messages sorted by `displayOrder`
6. Marks returned messages as seen (so they are not returned on the next login)

## Dormant messages and KPI requests

If a message's required KPI is absent from the user's scope, the message is **dormant** — it is skipped for this login. The evaluator simultaneously writes a `requested` record back to the host KPI cache (`PUT /api/kpis`) for each missing KPI.

The host's background process can then poll `GET /api/kpis?entryType=requested` to discover which KPIs need computing, compute them, and push values back via `PUT /api/kpis` with `entryType: "value"`. On the next login, dormant messages are unblocked.

## Scope-keyed KPIs

`UserContext.kpis` is a two-level map:

```
kpis["last_week|my_organization"]["unTranscribedMinutes"] = 180
     └─ scope key ──────────────┘ └─ KPI name ──────────┘
```

This allows messages with the same KPI name but different date ranges or user groups to coexist without collision.

## Delivery state

Per-user delivery state (seen message IDs, opt-out flag) is persisted to `data/delivery-state.json`. This file is excluded from version control.

## Development

```bash
HOST_API_URL=http://127.0.0.1:3003 npm run dev   # tsx watch on port 3002
npm run build                                      # compile TypeScript to dist/
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3002` | Port to listen on |
| `HOST_API_URL` | `http://127.0.0.1:3003` | Base URL of the host simulator API |
| `MESSAGE_EDITOR_API_URL` | `http://127.0.0.1:3001` | Base URL of the message editor API |
