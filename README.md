# Inpromptu

A real-life GPS racing app. A host picks a distance (or drops start/end pins on a map) and invites friends; everyone's phone streams live position and speed to a shared map during the race, and a leaderboard fills in as each racer crosses the finish line. There's also an ambient "Map" mode for just seeing other opted-in Inpromptu users nearby, outside of any race.

Live at **https://inpromptu.lewix.ai** (API at `https://api.inpromptu.lewix.ai`).

## Features

- **Race creation** — random route of a chosen distance, or a custom route by dropping start/end pins
- **Live race tracking** — every participant's position, speed, and heading streamed to a shared map in real time
- **Server-authoritative countdown & finish detection** — the server broadcasts a single start timestamp (each client computes its own countdown locally, immune to clock drift), and crossing the finish geofence is computed server-side from real position updates — a forged "I finished" message from the client has no effect
- **Solo starts** — a host can start a race alone via a confirmation modal instead of being blocked at a 2-participant minimum
- **Live nearby map** — opt in to share your location and see other Inpromptu users near you on an ambient map, even outside of a race; tap a racer's marker for a profile modal (stats + garage)
- **Garage** — each user manages one or more cars (name, make/model/year, photo) and races with an active one
- **Leaderboard & history** — live-updating leaderboard while a race is in progress, plus a personal race history and stats page

## Architecture

Two independently deployed projects, sharing nothing but a same-registrable-domain relationship (both are subdomains of `lewix.ai`) — required so auth cookies are same-site rather than cross-site, which matters for Safari's Intelligent Tracking Prevention:

```
Inpromptu/
├── frontend/   Vite + React SPA → Cloudflare Pages (inpromptu.lewix.ai)
└── backend/    Single Cloudflare Worker → Workers (api.inpromptu.lewix.ai)
```

**Backend** is one Worker containing:
- A **Hono** REST API for auth, races, results, cars, uploads, users
- Two **Durable Objects** (via the Cloudflare Agents SDK):
  - `RaceRoomAgent` — one instance per active race, handles the live position stream, server-side countdown scheduling, and finish-line detection
  - `NearbyAgent` — a single global instance all opted-in users connect to, broadcasting ambient live position to every other connected opted-in user
- **Prisma** (`@prisma/adapter-pg`, edge-compatible driver adapter) talking to Postgres through **Hyperdrive**
- **R2** for car/avatar photo uploads

**Frontend** is a Vite + React 19 SPA using React Router, Leaflet/react-leaflet for maps, and Motion for animation.

### Why Durable Objects

Each race room (and the single ambient nearby-map room) needs strongly-consistent, low-latency shared state that many clients write to and read from concurrently — DOs give each room its own single-threaded, auto-persisted, WebSocket-broadcasting instance, addressed by race ID (`getAgentByName(env.RACE_ROOM, raceId)`) or a fixed name (`getAgentByName(env.NEARBY, "global")`).

### Auth model

httpOnly-cookie sessions, not JWT-in-localStorage, since this app broadcasts live location:
- Short-lived **access token** (JWT, `jose`, ~20 min) in an httpOnly cookie
- Rotating **refresh token** (opaque, hashed in DB) with reuse detection — a reused/already-revoked refresh token revokes the whole chain and forces re-login
- CORS is locked to the exact frontend origin (not `*`, since cookies require `credentials: true`), plus a CSRF Origin-check middleware
- WebSocket routes (`/api/races/:raceId/live`, `/api/nearby/live`) verify the JWT cookie server-side and override any client-supplied `userId` before forwarding to the Durable Object — the client is never trusted to say who it is
- Cloudflare's native Rate Limiting binding guards `/signup` and `/login` (not `/refresh`, since that fires automatically in the background and a 429 there would look like an unexpected logout even with a valid session)

### Realtime trust boundary

The client only ever sends raw `{lat, lng, speedKmh}` samples and a host-only "start" call. The server owns countdown timestamps, the live racer/nearby-user map, and finish-line detection — finishing a race is a side effect of the server evaluating distance-to-finish against an incoming position update, not a message type the client can send.

## Tech stack

| | |
|---|---|
| Backend runtime | Cloudflare Workers |
| Realtime | Cloudflare Agents SDK (Durable Objects) |
| Database | Postgres via Cloudflare Hyperdrive |
| ORM | Prisma (`@prisma/adapter-pg`) |
| API framework | Hono |
| Auth | `jose` (JWT) + `bcryptjs` (password hashing) |
| File storage | Cloudflare R2 |
| Frontend | React 19, Vite, React Router 7 |
| Styling | Tailwind CSS 4 |
| Maps | Leaflet / react-leaflet |
| Animation | Motion |
| Icons | Phosphor Icons |
| Hosting | Cloudflare Pages (frontend), Cloudflare Workers (backend) |

## Directory structure

```
backend/src/
├── index.ts                  # Hono root app, CORS/CSRF, WS route forwarding, exports both Agents
├── env.ts
├── db/client.ts               # getPrismaClient(env) via Hyperdrive + PrismaPg adapter
├── agents/
│   ├── RaceRoomAgent.ts        # per-race Durable Object
│   └── NearbyAgent.ts          # global ambient-presence Durable Object
├── routes/
│   ├── auth.ts, races.ts, results.ts, cars.ts, uploads.ts, users.ts
├── middleware/requireAuth.ts
└── lib/
    ├── jwt.ts, passwords.ts, cookies.ts, refreshTokens.ts
    ├── haversine.ts, randomRoute.ts, routing.ts
    ├── rateLimit.ts, r2Images.ts

frontend/src/
├── routes/                    # one file per page (Login, Signup, Dashboard, CreateRace,
│                               #   RaceLobby, LiveRace, RaceResults, RaceHistory, Map,
│                               #   Garage, CarForm, Profile, JoinRace)
├── components/
│   ├── map/                    # LeafletMap, RacerMarker, NearbyMarker, MeMarker
│   ├── race/                   # CountdownOverlay, SpeedHud, LeaderboardTable, RacerProfileModal
│   └── ui/                     # BottomSheet, StatCard, Avatar, GlassCard, BottomNav, Button
├── hooks/                      # useAuth, useGeolocation, useHeading, useRaceRoomAgent,
│                               #   useNearbyAgent, useWakeLock
└── lib/                        # api.ts, races.ts, users.ts, cars.ts, avatarColor.ts
```

## Local development

### Prerequisites

- Node.js, Docker (for local Postgres)
- A Cloudflare account with a Hyperdrive config, R2 bucket, and the two Durable Object classes migrated (see `backend/wrangler.jsonc`)

### Backend

```bash
cd backend
npm install

# start local Postgres (port 5437, matches wrangler.jsonc's localConnectionString)
docker compose up -d

# copy and fill in secrets
cp .dev.vars.example .dev.vars   # JWT_ACCESS_SECRET, REFRESH_TOKEN_HASH_SECRET, ORS_API_KEY

npm run db:migrate                # applies Prisma migrations to local Postgres
npm run dev                       # wrangler dev, http://localhost:8788
```

### Frontend

```bash
cd frontend
npm install
npm run dev                       # Vite, http://localhost:5201
```

`frontend/.env.development` already points `VITE_API_URL` at `http://localhost:8788/api`.

### Other useful commands

```bash
npm run db:studio     # backend: Prisma Studio against local Postgres
npm run cf-typegen    # backend: regenerate Env types from wrangler.jsonc bindings
npm run typecheck     # backend: tsc --noEmit
npm run lint          # frontend: oxlint
```

## Deployment

- **Frontend** — `npm run build` then `wrangler pages deploy dist`, served from the custom domain `inpromptu.lewix.ai`.
- **Backend** — `npm run deploy` (`wrangler deploy`), served from the custom domain `api.inpromptu.lewix.ai`. Requires `wrangler secret put` for `JWT_ACCESS_SECRET`, `REFRESH_TOKEN_HASH_SECRET`, and `ORS_API_KEY` in production (never committed — see `.dev.vars.example`).
- **Database** — production Postgres runs on a Tencent VPS, reached via Cloudflare Tunnel + Workers VPC + Hyperdrive. Migrations are applied with `prisma migrate deploy` against the same connection Hyperdrive proxies; Hyperdrive itself does not run migrations.
- Prisma migrations must be applied to both local and production databases independently after schema changes.
