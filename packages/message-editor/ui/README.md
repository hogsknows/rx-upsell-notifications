# @uns/message-editor-ui

React single-page application for authoring and managing UNS message definitions. Used by marketing and product teams to create, preview, and manage upsell notification content.

**Port:** `5173`
**Requires:** `@uns/message-editor-api` running on port 3001

## Features

- List all message definitions with status badges (active / draft / archived)
- Create and edit messages with a form covering title, body, scope, trigger conditions, and display order
- KPI placeholder picker — browse and insert valid `{{placeholder}}` keys into title and body
- Live body preview with placeholder tokens highlighted
- Filter messages by status or upgrade path

## Pages

| Route | Description |
|---|---|
| `/messages` | Message list |
| `/messages/new` | Create a new message |
| `/messages/:id` | Edit an existing message |

## Development

```bash
npm run dev       # vite dev server on port 5173
npm run build     # tsc + vite production build to dist/
npm run typecheck # type-check without emitting
```

## Dependencies

- React 18 + React Router v6
- `@uns/shared` — KPI placeholder and trigger operator constants
- Vite + TypeScript
