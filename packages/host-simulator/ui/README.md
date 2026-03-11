# @uns/host-simulator-ui

React application that simulates the RX host app login flow. Allows developers and testers to log in as different personas and observe the upsell notification modal as it would appear to a real user.

**Port:** `5174`
**Requires:** `@uns/host-simulator-api` on port 3003 and `@uns/message-generator` on port 3002

## Screens

| Screen | Description |
|---|---|
| **Login** | Select a persona and click Login to trigger `GET /api/messages` |
| **Loading** | Shown while the message generator evaluates eligibility |
| **Notification modal** | Displays returned messages with scroll-through navigation and action buttons |
| **App** | Simulated post-login app view — shows why no messages were returned if applicable |

## Login flow

1. Select a persona from the list (each has a different licence tier, tenant, and feature flag state)
2. Click **Login** — the UI calls `GET /api/messages?userId={id}` on the message generator
3. If messages are returned, the notification modal appears on top of the app view
4. If no messages are returned, the app view shows the reason (opted out, all seen, flags disabled, etc.)

## Actions

| Button | Behaviour |
|---|---|
| **Dismiss** | Closes the modal; message already marked as seen |
| **Request Upgrade** | Records an upgrade-request event; closes the modal |
| **Disable Notifications** | Calls `POST /api/events/disable`; user will never see notifications again |
| **Reset & Login** | Calls `POST /api/events/reset` for the current user, then re-runs the login flow — useful for re-testing |
| **Logout** | Returns to the login screen |

## Development

```bash
npm run dev       # vite dev server on port 5174
npm run build     # tsc + vite production build to dist/
npm run typecheck # type-check without emitting
```

## Dependencies

- React 18
- Vite + TypeScript
