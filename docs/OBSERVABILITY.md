# Observability

Minimal setup used during beta. All clients are **no-op when the corresponding env var is unset** — you can run locally without any observability config.

## Error tracking — Sentry

### Backend (`@sentry/node`)

| Env var | Required | Notes |
|---|---|---|
| `SENTRY_DSN` | optional | When set, 500s go to Sentry with `{ route, method }` extras. |

What's captured:
- Any error that falls through to the global error handler (HTTP 500 path) in `src/index.ts`.
- Startup errors (listen failure).

What's **not** captured:
- 4xx responses (they're expected user-facing errors).
- Rate-limit 429s.
- WebSocket disconnect noise.

### Frontend (`@sentry/react-native`)

| Env var | Required | Notes |
|---|---|---|
| `EXPO_PUBLIC_SENTRY_DSN` | optional | Works on iOS, Android, and Expo web. |

Wired in <ref_file file="fest-app/src/utils/sentry.ts" />. `initSentry()` is called once at the top of `App.tsx` before any other import that can throw. Use `captureError(e, context?)` from product code — never import `@sentry/react-native` directly.

## Product analytics — PostHog

Server-side only, via `posthog-node`. Distinct IDs are internal user UUIDs. All capture calls are fire-and-forget and wrapped in `try/catch` in <ref_file file="backend/src/observability/analytics.ts" /> — failures in the analytics pipeline must never affect request handling.

| Env var | Required | Default |
|---|---|---|
| `POSTHOG_KEY` | optional | — (disables analytics when unset) |
| `POSTHOG_HOST` | optional | `https://eu.i.posthog.com` |

### Tracked events

These are the core-loop events the gap analysis identified as necessary for beta diagnostics. Nothing outside this list is tracked — no "future-proof" schema.

| Event | Where | Properties |
|---|---|---|
| `app_open` | `GET /auth/me` (called on every cold start after token restore) | — |
| `auth_success` | `POST /auth/otp/verify` | `new_user: boolean` |
| `create_plan` | `POST /plans` | `plan_id`, `activity_type`, `has_confirmed_time`, `has_confirmed_place`, `participant_count`, `linked_event` |
| `invite_sent` | `POST /plans` (per invited participant), `POST /plans/:id/participants` | `plan_id`, `invitee_id`, `source` (`create_plan` \| `invite_participant`) |
| `invite_accepted` | `PATCH /invitations/:id` (status=accepted) | `invitation_id`, `type`, `target_id` |
| `invite_declined` | `PATCH /invitations/:id` (status=declined) | `invitation_id`, `type`, `target_id` |
| `proposal_created` | `POST /plans/:id/proposals` | `plan_id`, `proposal_id`, `type` |
| `vote_cast` | `POST /plans/:id/proposals/:proposalId/vote` | `plan_id`, `proposal_id`, `proposal_type` |
| `plan_finalized` | `POST /plans/:id/finalize` | `plan_id`, `place_proposal_id`, `time_proposal_id` |
| `plan_cancelled` | `POST /plans/:id/cancel` | `plan_id` |
| `plan_completed` | `POST /plans/:id/complete` | `plan_id` |

Vote removal (`DELETE …/vote`) is intentionally not tracked — `vote_cast` is enough to see conversion, and treating removal as its own event inflates counts.

## Setting it up

1. Create a Sentry project (React Native + Node) and a PostHog project.
2. Copy DSN into `backend/.env` (`SENTRY_DSN`) and `fest-app/.env` (`EXPO_PUBLIC_SENTRY_DSN`). For Expo, `EXPO_PUBLIC_*` vars are baked into the JS bundle at build time.
3. Copy PostHog API key into `backend/.env` (`POSTHOG_KEY`). Use `POSTHOG_HOST` if you are on US cloud instead of EU.
4. Restart the backend and rebuild the frontend.

## What is **not** covered (explicit non-goals for this PR)

- Client-side PostHog (`posthog-js` / `posthog-react-native`). Product events happen on the backend anyway; adding a second client adds SDK weight without much signal.
- Source map upload to Sentry. Needs the Expo config plugin + CI credentials — deferred.
- Session replay, performance traces (we sample at 10% of traces but don't rely on them yet).
- Business-facing dashboards — PostHog UI is the dashboard for now.
- PII scrubbing beyond defaults. Don't put phone numbers / tokens / raw request bodies in `captureError` context.
