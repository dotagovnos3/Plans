# AGENTS.md

## Environment

- **Disk C has 0 bytes free.** All npm commands must redirect cache:
  ```
  $env:npm_config_cache="E:\npm-cache"; npm <command> --legacy-peer-deps
  ```
  Missing either the cache redirect or `--legacy-peer-deps` will fail.

- **Working directory** for all app commands: `e:\FEST\V1\fest-app`

## Commands

| Action | Command |
|--------|---------|
| Install | `$env:npm_config_cache="E:\npm-cache"; npm install --legacy-peer-deps` |
| Dev server (web) | `npx expo start --web` → http://localhost:8081 |
| Dev server (mobile) | `npx expo start` |
| Type check | `npx tsc --noEmit` |
| Smoke build | `npx expo export --platform web` |
| Lint | Not configured. Run `tsc --noEmit` instead. |

No test runner is set up. `npm test` does nothing.

## Architecture

Single-package Expo app. No monorepo, no backend, no native builds.

```
fest-app/
  App.tsx              ← Entry: auth gate → RootStack (MainTabs + Notifications)
  src/
    types/index.ts     ← All 15+ entity types + ACTIVITY_LABELS constant
    theme/index.ts     ← Soft Shell design tokens. Uses Platform-selective spacing (web tighter)
    mocks/index.ts     ← All mock data (users, venues, events, plans p1/p2/p3, groups, messages, notifications, invitations)
    navigation/types.ts ← HomeStackParamList, PlansStackParamList, RootStackParamList
    stores/            ← 6 Zustand stores (auth, events, plans, groups, notifications, invitations)
    screens/           ← 13 screens, all named *Screen.tsx
    components/
      ScreenContainer  ← maxWidth:600 + center on web, transparent on mobile. Wrap every screen.
      EmptyState       ← Shared empty list component
    utils/
      dates.ts         ← formatDateShort, formatDateFull, formatTimeAgo (null-safe)
      constants.ts     ← CATEGORY_CHIPS, CATEGORY_LABELS, DISTRICTS
```

### Navigation wiring

- **MainTabs** (bottom): HomeTab → HomeStack, SearchTab, CreateTab, PlansTab → PlansStack, ProfileTab
- **RootStack** wraps MainTabs + Notifications (modal-like overlay)
- **Cross-tab navigation** uses `(navigation as any).navigate('TabName', { screen: 'ScreenName', params })` because `CompositeNavigationProp` typing is brittle with Expo SDK 54. Do not attempt to type this tighter.

### Store cross-references

Zustand stores access each other via `OtherStore.getState()`. Used in:
- `invitationsStore` → `plansStore` (accept invitation adds participant)
- `invitationsStore` → `authStore` (gets current user)

### Plan lifecycle

`active → finalized → completed`. Can `cancel` from `active` or `finalized`. `completed` auto-transition at `confirmed_time + 4h` (not implemented, manual mock state only). "Повторить" on completed plans creates a new active plan with same participants.

## Product constraints

- **Canonical spec**: `docs/ProductPlan.md` — not a suggestion, this is the source of truth for all product rules
- **Russian UI only** — all user-facing strings must be in Russian
- **No features beyond MVP** — do not add group chat, map, calendar entity, email auth, venue admin, or event creation
- **Plan becomes `active` immediately on creation** — no draft/invited state at plan level
- **Max 15 participants per plan**
- **No standalone chat** — chat lives inside PlanDetails only
- **Pre-meet** = simple text fields only, no voting
- **9 notification types** including `group_invite`

## Web layout rules

- Every screen wrapped in `<ScreenContainer>` (maxWidth 600, centered on web)
- Theme `spacing` is already Platform-adapted (tighter on web). Use `theme.spacing.*` — don't hardcode.
- Image heights use `Platform.select({ web: smaller, default: larger })` + `aspectRatio` on web
- Tab bar also constrained to maxWidth 600 on web

## Known gotchas

- `Set<string>` in Zustand state (e.g. `interestedIds`, `savedIds`) is not serializable — fine for mock-only, will break with persistence
- `PlanParticipant.user` is `User | undefined` (not `User | null`) — type mismatch with authStore's `User | null`
- Mock data user `id: 'me'` is the logged-in user (mapped to `mockUsers[5]`)
- `CreatePlanForm` returns `planId` via `onDone` callback, not via navigation
- Expo SDK 54 has peer dep conflicts — always use `--legacy-peer-deps`
