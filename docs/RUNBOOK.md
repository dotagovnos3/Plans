# FEST MVP — Runbook

## Prerequisites

- Node.js 20+
- PostgreSQL 17 running on localhost:5432
- `psql` on PATH (or at `C:\Program Files\PostgreSQL\17\bin\`)
- Windows (commands below are PowerShell)

## First-time setup

```powershell
# 1. Create the database
& "C:\Program Files\PostgreSQL\17\bin\psql" -U postgres -c "CREATE DATABASE plans"

# 2. Install backend deps
cd E:\FEST\V1\backend
$env:npm_config_cache="E:\npm-cache"; npm install --legacy-peer-deps

# 3. Run migration
E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\db\migrate.ts

# 4. Seed demo data
E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\db\seed.ts

# 5. Install frontend deps
cd E:\FEST\V1\fest-app
$env:npm_config_cache="E:\npm-cache"; npm install --legacy-peer-deps
```

## Running

### Backend (terminal 1)

```powershell
cd E:\FEST\V1\backend
E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\index.ts
# → http://localhost:3001
```

### Frontend web (terminal 2)

```powershell
cd E:\FEST\V1\fest-app
npx expo start --web
# → http://localhost:8081
```

## Environment variables

File: `E:\FEST\V1\backend\.env`

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/plans` | PostgreSQL connection string |
| `JWT_SECRET` | `dev-secret-change-in-prod` | JWT signing key |
| `OTP_CODE` | `1111` | Mock OTP code for all auth |
| `PORT` | `3001` | Backend port (must be 3001 — frontend hardcodes this) |

## Demo flow

1. **Auth**: Open http://localhost:8081 → enter phone `+79990000000` → tap "Получить код" → enter code `1111` → tap "Войти"
2. **Home feed**: See 6 seeded events with social proof from friends
3. **Search**: Type "джаз" or filter by category/date
4. **Event details**: Tap any event card → see details, venue link, interest/save buttons
5. **Create plan**: Tap "Планы?" button on event or "+" tab → fill form → select friends → create
6. **Plan details**: View plan → propose place/time → vote → finalize
7. **Chat**: Switch to "Чат" tab in plan details → send messages
8. **Invitations**: Go to "Мои планы" → "Приглашения" tab → accept/decline
9. **Groups**: "Мои планы" → "Группы" tab → view group → create plan with group
10. **Profile**: View friends list, saved events, edit name
11. **Notifications**: Bell icon → see plan invite + proposal notifications

## Demo accounts

| Phone | Name | Username | Notes |
|-------|------|----------|-------|
| `+79990000000` | Я | me | Primary demo user (has 5 friends) |
| `+79991111111` | Маша | masha | Friend |
| `+79992222222` | Дима | dima | Friend |
| `+79993333333` | Лена | lena | Friend |
| `+79994444444` | Артём | artem | Friend |
| `+79995555555` | Катя | katya | Friend |

All accounts use OTP code `1111`.

## Known limitations

- **No real SMS** — OTP is always `1111`, no SMS is sent
- **No real user registration** — seed creates 6 users; new phones get auto-registered via OTP
- **No event creation** — events are seed-only, no user-facing form
- **No push notifications** — only in-app notifications + WS real-time
- **No map** — locations are text + coordinates only
- **No email auth** — phone-only
- **No group chat** — chat is plan-level only
- **Max 15 participants per plan**
- **Web-only tested** — mobile builds not verified for this release
- **fest-animations** — has type errors, not part of the main app

## Release checklist

- [ ] `npx tsc --noEmit` passes (0 errors in app code)
- [ ] `npx tsc --noEmit` passes in backend
- [ ] `npx expo export --platform web` succeeds
- [ ] Backend starts on port 3001
- [ ] `/api/health` returns `{ status: "ok" }`
- [ ] Seed runs without error
- [ ] Auth flow works with `+79990000000` / `1111`
- [ ] Home feed loads with 6 events
- [ ] Search returns results
- [ ] Plan creation succeeds
- [ ] Invitation accept/decline works
