# Планы? / FEST MVP

Frozen MVP core (Expo + Fastify + PostgreSQL) with beta hardening cleanup.

## Repo layout

- `fest-app/` — frontend (Expo React Native web/mobile)
- `backend/` — Fastify + PostgreSQL API
- `contracts/` — OpenAPI + DB schema + acceptance docs
- `docs/` — runbook and current status

## Quick start (PowerShell)

```powershell
# backend
cd E:\FEST\V1\backend
$env:npm_config_cache="E:\npm-cache"; npm install --legacy-peer-deps
E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\db\migrate.ts
E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\db\seed.ts
$env:PORT="3001"; E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\index.ts

# frontend
cd E:\FEST\V1\fest-app
$env:npm_config_cache="E:\npm-cache"; npm install --legacy-peer-deps
npx expo start --web
```

## Quality gate

- Main frontend: `cd E:\FEST\V1\fest-app; npx tsc --noEmit`
- Backend: `cd E:\FEST\V1\backend; npx tsc --noEmit`
- Optional animation sandbox: `cd E:\FEST\V1\fest-app; npx tsc --noEmit -p tsconfig.fest-animations.json`

## Mobile local API setup

For physical phone testing, set API base to your machine LAN IP in the same terminal before Expo start:

```powershell
cd E:\FEST\V1\fest-app
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.0.28:3001/api"
npx expo start --go --tunnel
```

Web local still defaults to `http://localhost:3001/api` when `EXPO_PUBLIC_API_BASE_URL` is not set.

## Beta smoke (backend)

- `cd E:\FEST\V1\backend; E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\tests\e2e-smoke.ts`
- `cd E:\FEST\V1\backend; E:\FEST\V1\backend\node_modules\.bin\tsx.cmd E:\FEST\V1\backend\src\tests\rt2-smoke.ts`

`src/fest-animations/**` is intentionally excluded from the main frontend TypeScript gate.

## Current status

See `docs/CURRENT_STATUS.md` and `docs/RUNBOOK.md`.
