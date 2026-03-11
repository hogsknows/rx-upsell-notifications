# rx-upsell-notifications

TypeScript monorepo for the **Upsell Notification System (UNS)** — a microservice-based feature that displays targeted licence upgrade notifications to RX host app users post-login.

## Architecture

```
┌─────────────────────┐        ┌───────────────────────┐
│  Host Simulator UI  │        │  Message Editor UI    │
│  (React) :5174      │        │  (React) :5173        │
└────────┬────────────┘        └──────────┬────────────┘
         │ login / getMessages             │ CRUD
         ▼                                ▼
┌─────────────────────┐        ┌───────────────────────┐
│  Message Generator  │◄──────►│  Message Editor API   │
│  (Express) :3002    │        │  (Express) :3001      │
└────────┬────────────┘        └───────────────────────┘
         │ user-context / kpis
         ▼
┌─────────────────────┐
│  Host Simulator API │
│  (Express) :3003    │
└─────────────────────┘
```

| Package | Name | Port | Purpose |
|---|---|---|---|
| `packages/shared` | `@uns/shared` | — | Shared TypeScript types and utilities |
| `packages/message-editor/api` | `@uns/message-editor-api` | 3001 | Message definition CRUD API |
| `packages/message-editor/ui` | `@uns/message-editor-ui` | 5173 | Message authoring tool (React) |
| `packages/message-generator` | `@uns/message-generator` | 3002 | Evaluates and delivers messages per user |
| `packages/host-simulator/api` | `@uns/host-simulator-api` | 3003 | Simulates RX host API (personas, KPI cache) |
| `packages/host-simulator/ui` | `@uns/host-simulator-ui` | 5174 | Login simulator showing the notification modal |

## Prerequisites

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
npm run build
```

## Development

Each app has a `dev` script that runs with `tsx watch` (APIs) or `vite` (UIs). Start them individually or use a process manager.

```bash
# Build shared types first (required before running any app)
npm run build:shared

# Start each app in a separate terminal
npm run dev -w @uns/message-editor-api    # :3001
npm run dev -w @uns/message-editor-ui     # :5173
HOST_API_URL=http://127.0.0.1:3003 npm run dev -w @uns/message-generator   # :3002
npm run dev -w @uns/host-simulator-api    # :3003
npm run dev -w @uns/host-simulator-ui     # :5174
```

## Build

```bash
npm run build          # build all packages
npm run build:shared   # build shared only (prerequisite for others)
npm run typecheck      # type-check all packages
```

## Seed data

```bash
npm run seed   # seed message-editor-api with sample messages
```

## Key design concepts

- **Dormant messages** — if a required KPI is absent from the cache, the message is skipped. The evaluator automatically writes a `requested` record to the host KPI cache so a background process knows what to compute.
- **Scope-keyed KPIs** — `UserContext.kpis` is keyed by `"${dateRange}|${userGroup}"` (e.g. `"last_week|my_organization"`) so messages referencing the same KPI name but different date ranges don't collide.
- **KPI cache** — actual ISO start/end dates are stored (not relative labels), so cached values remain valid across multiple logins within the same period.
- **User-scoped groups** — KPIs for `my_recording_network` and `my_direct_reports` include a `userId` in the cache key to avoid cross-user collisions within the same tenant.
