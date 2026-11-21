# Recall — Personal Flashcards App (Claude Code Context)

Anki-like spaced-repetition app. It is a study tool AND a portfolio project. Its goals are for the owner (Victor) to learn Go, system-design practices (cache, observability, messaging) and a team-style Git workflow.
Repo: `github.com/Victormrf/personal-flashcards-app` (monorepo: `api/` + `web/`).

Victor is learning: explain *why* when making architectural choices, keep changes small and reviewable, and prefer the existing patterns over new abstractions.

## Stack
- **Backend (`api/`)**: Go, Chi router, PostgreSQL, sqlc (SQL → typed Go; NOT an ORM), golang-migrate, Redis (cache-aside), Prometheus + Grafana, Resend (email).
- **Frontend (`web/`)**: Next.js (App Router), TypeScript, Tailwind CSS, React Query (`@tanstack/react-query`), Axios, lucide-react.
- **Infra (local)**: `docker-compose.yml` with postgres, redis, prometheus, grafana.
- **Deploy plan (free tier)**: Vercel (web), Render (Go API, `render.yaml`), Neon (Postgres), Upstash (Redis), Grafana Cloud (or skip Prometheus/Grafana in prod).

## Running locally (Windows / PowerShell)
```powershell
docker compose up -d                       # postgres (host port 5434), redis, prometheus, grafana
# migrations (DATABASE_URL comes from api/.env)
cd api
migrate -path migrations -database "$env:DATABASE_URL" up
go run cmd/api/main.go                     # API on :8080  (base: /api/v1)
cd ../web
npm run dev                                # web on :3000
```
- Postgres for this project is on host port **5434** (5433 is taken by the marketplace project's Postgres, 5432 by a local Windows Postgres). Keep docker-compose and `api/.env` in sync.
- If `password authentication failed`: another Postgres owns the port. Check `docker ps`, stop the conflicting container, then `docker compose down --remove-orphans && docker compose up -d --force-recreate`.
- After editing any `db/query/*.sql` or a migration → run `sqlc generate`. Never hand-edit generated files in `api/db/`.
- Manual API testing: `api/api.http` (REST Client). Login first to populate `@authToken`.

## Backend architecture (`api/`)
Request flow: `handler → service → repository (interface) → postgres impl → sqlc db → PostgreSQL`.

```
cmd/api/main.go            composition root: wiring, routes, scheduler, /metrics, CORS/Prometheus middleware
config/config.go
internal/domain/           pure entities (Card, Deck, DeckSource, ReviewLog, User, StudySession) — no DB types
internal/repository/       interfaces only (cards, decks, reviews, users, sessions)
internal/repository/postgres/   implementations + toDomainX mapping functions
internal/service/          business logic (sm2, cards, decks, reviews, auth, sessions, summary)
internal/handler/          HTTP only + response.go helpers
internal/middleware/       auth (JWT), cors, prometheus
internal/cache/redis.go
internal/metrics/metrics.go
internal/email/resend.go
internal/scheduler/scheduler.go
internal/apperror/errors.go     custom AppError types
db/query/*.sql             sqlc queries
migrations/                golang-migrate files
```

Rules:
- **Domain is pure.** No `sql.Null*`, no sqlc types, no HTTP concerns in `internal/domain`.
- **Only the repository maps** sqlc models ↔ domain (`toDomainX`). Services and handlers never import `db` or `postgres`. When a domain struct changes, update the mapping functions.
- **Services depend on repository interfaces**, never on concrete implementations. Dependency injection is manual via constructors (`NewXxx`), wired only in `main.go`.
- Not found → return `nil, nil` from the repository (services translate to `AppError`). Return pointers for optional entities.
- Aggregates: `StudySession` exposes `DeckIDs` in the domain but is persisted across `study_sessions` + `session_decks`; the repository assembles/splits it.
- `Deck.Sources` is JSONB (`[]DeckSource{Label, URL}`; `URL` is `omitempty`). Marshal/unmarshal in the repository. JSON tag stays `sources`.
- **SM-2** (`service/sm2.go`, `ReviewCard`) is a pure function. UI ratings map to **1 / 3 / 4 / 5** — never change these values.
- **Cache (Redis, cache-aside)**: key `due_cards:{userID}`, TTL 5 min, invalidated on review (updating the cached list in place is the smarter, optional optimisation). Invalidation lives in the **service** layer, not the handler. Redis Streams are documented but not implemented.
- **Prometheus**: counters/histograms with RED method. Normalise UUID path segments to `:id` to avoid label cardinality explosions.
- **Weekly summary scheduler**: goroutine + `time.After`, sends via Resend, SQL window-function streak, opt-in via env vars, `/debug/summary` in development only. No per-review notifications (decided).
- Errors: use `apperror` types; handlers map them to HTTP status codes.

### Routes
Public: `POST /auth/register`, `POST /auth/login`, `GET /metrics`.
Protected (JWT):
- `GET /study` (`?deck_id=`), `POST /cards/{id}/review`, `DELETE /cards/{id}`
- `GET/POST /decks`, `GET/DELETE /decks/{id}`, `GET /decks/{id}/cards`, `POST /decks/{id}/cards`, `POST /decks/{id}/cards/batch` (import, max 500, via `unnest`), `PUT /decks/{id}/sources`, `GET /categories`
- `GET/POST /sessions`, `GET/DELETE /sessions/{id}`, `PATCH /sessions/{id}/name`, `PUT /sessions/{id}/decks`, `GET /sessions/{id}/study`

### Migrations
Never edit an applied migration — create a new one.
- 000001 init · 000002 users.password_hash · 000003 decks.category · 000004 decks.sources (JSONB) · 000005 study_sessions + session_decks

## Frontend architecture (`web/src/`)
Three layers: **page → hooks → services**.
```
app/                       pages (JSX + local UI state only)
  page.tsx                 dashboard (category filter, sessions pills)
  login/ decks/new/ decks/[deckId]/ study/[deckId]/ import/
  sessions/new/ sessions/[sessionId]/ sessions/[sessionId]/study/
hooks/useDeck.ts, useSession.ts      React Query hooks (queries, mutations, invalidation)
services/deckService.ts, sessionService.ts   axios calls only
lib/api.ts                 the ONLY axios instance (JWT interceptor, 401 → /login)
lib/categoryColor.ts       deterministic category colour (djb2 hash → HSL)
lib/parseAnkiFile.ts       Anki export import
types/index.ts             User, Deck, DeckSource, Card, ReviewLog, StudySession
```
Rules:
- Pages contain JSX and `useState` for client state only. Server state lives in React Query hooks; no `useEffect` fetching.
- Hooks own `useQuery`/`useMutation` and cache invalidation. Query keys are centralised (`deckKeys`, `sessionKeys`) — reuse them, don't inline new strings.
- Services own the axios calls. Never call `api.post` from components, never create a second axios instance, never set Authorization headers manually.
- Don't touch `localStorage` outside `lib/api.ts` (token).
- Use `<a>` (not Next `Link`) for external links (`Link` has no `rel` prop → TS error).
- Always handle loading, empty and error states.
- When editing an existing page, **preserve the existing logic and JSX structure**; add only what's needed (Victor had unclosed-`div` problems when whole returns were rewritten).

### Style conventions
- Tailwind only, every colour has a `dark:` variant. Primary action `bg-indigo-600 hover:bg-indigo-500`.
- Rounded-full buttons, `rounded-2xl/3xl` cards, `transition-all` on interactive elements, `disabled:opacity-50`, loading text via `isPending`.
- Study screen is the most important: keyboard shortcuts **1–4** map to ratings **1/3/4/5**, Space flips the card, the card flip uses CSS 3D transforms — don't break them. It also shows the deck's sources.
- Mobile-first (375px works without horizontal scroll).

## Product decisions already made
- Decks have an optional **category** (deterministic colour per category) and editable **sources** (label + optional URL), also settable on creation/import.
- **Import** from Anki exports via the batch endpoint (max 500 cards per request).
- **Persistent study sessions**: a named set of decks; due cards merged by `due_at`; editable page at `sessions/[sessionId]`.
- Dashboard "Study" for a single deck must only show that deck's due cards (`?deck_id=`).

## Roadmap
1. Public decks with a "clone to my collection" feature.
2. Stats page (reviews, retention, streak).
3. README with architecture diagram + Grafana screenshot, deployment (Vercel/Render/Neon/Upstash/Grafana Cloud), tag `v1.0.0`.
- Open item: the dashboard infinite-loading issue (no `/decks` request in Network tab → check the token in localStorage / 401 handling) was diagnosed but never confirmed fixed.
- `web/src/app/page.tsx` and `decks/[deckId]/page.tsx` earlier versions still contain inline `useQuery`/`api.*` calls and mock deck stats (`getDeckStats`) — migrate to hooks/services and real data when touched.

## Git workflow (team-style, even though solo)
- `main` is protected: all changes go through a PR on a branch, then squash/merge, then delete the branch and `git switch main && git pull`.
- Branch prefixes: `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/`.
- Commits follow **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`). Use `wip:` for intermediate commits on a feature branch; tidy with interactive rebase if needed.
- Small tweaks on an open feature go in that same branch.
- **Always run `git branch` / `git status` before committing** — Victor has twice committed on `main` by accident.
- Don't commit `.env` files or secrets.

## Working agreement for the agent
- Preserve the layer boundaries above; make minimal, focused changes.
- Ask before adding a dependency, changing an API contract, or editing an applied migration.
- Run `go build ./...` / `go test ./...` in `api/` and `npm run build` (or `npx tsc --noEmit`) in `web/` after changes.
- Testing style: interface-driven tests with fakes for repositories; SM-2 tested as a pure function.
- Documentation lives in Victor's Obsidian vault under `1 - ZETTELKASTEN/Projects/Flashcard/` (Architecture, System Design incl. Caching / Prometheus + Grafana / Weekly Summary Scheduler, Git, Frontend) plus `Go/`, `Frontend/NextJS/`, `DevOps/` and `Patterns/` (Repository, Dependency Injection, Pure Function, Interface-Driven Testing, Middleware Chain). When a significant design decision is made, suggest a note to add there.