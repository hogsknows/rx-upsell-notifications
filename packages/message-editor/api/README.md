# @uns/message-editor-api

REST API for creating, editing, and managing UNS message definitions. Message definitions are stored as JSON and consumed at runtime by the Message Generator.

**Port:** `3001`

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/messages` | List all messages — supports `?status=` and `?upgradePath=` filters |
| `GET` | `/api/messages/:id` | Get a single message by ID |
| `POST` | `/api/messages` | Create a new message |
| `PUT` | `/api/messages/:id` | Replace a message |
| `PATCH` | `/api/messages/:id` | Partial update of a message |
| `DELETE` | `/api/messages/:id` | Delete a message |

## Message definition schema

```typescript
{
  title: string;            // supports {{placeholder}} syntax
  body: string;             // supports {{placeholder}} syntax
  upgradePath: string;      // e.g. "Essential→Advanced"
  status: "active" | "draft" | "archived";
  displayOrder: number;     // lower = shown first
  scope: {
    dateRange: DateRange;   // e.g. "last_week"
    userGroup: UserGroup;   // e.g. "my_organization"
  };
  triggerConditions: Array<{
    kpi: KpiPlaceholderKey;
    operator: "gt" | "gte" | "lt" | "lte" | "eq";
    threshold: number;
  }>;
}
```

Valid `{{placeholder}}` keys are defined by `KPI_PLACEHOLDERS` in `@uns/shared`.

## Storage

Messages are persisted to `data/messages.json` using an atomic write pattern (write to `.tmp`, then rename). This file is excluded from version control — use the seed script to populate initial data.

## Development

```bash
npm run dev    # tsx watch on port 3001
npm run seed   # populate data/messages.json with sample messages
npm run build  # compile TypeScript to dist/
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port to listen on |
