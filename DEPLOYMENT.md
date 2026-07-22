# Deployment — Gibeon Empire Phase 1

Four deployables share one backend + database. Deploy the API + Postgres +
Redis first, then point the three frontends at the API URL.

## 1. Infrastructure

- **PostgreSQL 16** and **Redis 7** (managed, e.g. Railway plugins).
- Set the API env (`apps/api/.env.example` is the template):
  - `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`
  - `JWT_SECRET` (strong random), `JWT_EXPIRES_IN_SECONDS`
  - `CORS_ORIGINS` = the three frontend origins
  - `PAYSTACK_SECRET`, `FLUTTERWAVE_SECRET_HASH` (live keys)

## 2. Backend API

```bash
docker build -f apps/api/Dockerfile -t gibeon-api .   # context = repo root
docker run -p 4000:4000 --env-file apps/api/.env gibeon-api
```

The container runs `drizzle-kit migrate` on start, then serves on `/api`.
On Railway: point the service at `apps/api/Dockerfile`, attach Postgres +
Redis, set the env vars.

## 3. Frontends (storefront, admin, pos)

Each is a standard Next.js app. Deploy to Vercel or Railway with root set to
the app directory and one env var:

```
NEXT_PUBLIC_API_URL=https://api.gibeonempire.com/api
```

| App | Dir | Notes |
|-----|-----|-------|
| Storefront | `apps/storefront` | Public site — enable ISR/CDN. |
| Admin | `apps/admin` | Restrict access (staff only). |
| POS | `apps/pos` | Installable PWA; serve over HTTPS so the service worker + IndexedDB work. |

## 4. Post-deploy

```bash
npm run db:seed --workspace=api   # first deploy only: default location, provider, staff
```

Schedule `scripts/backup-db.sh` (daily) with `DATABASE_URL` set; restore with
`scripts/restore-db.sh`.

## 5. TLS

Terminate TLS at the platform/load balancer for all four hosts. The POS PWA
and secure cookies/tokens require HTTPS in production.
