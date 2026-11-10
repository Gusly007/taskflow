# TaskFlow API

REST API for collaborative task management. Users can create tasks, invite collaborators with granular roles (viewer/editor), and manage their work in isolation from other users.

Built as the backend foundation for a future multi-tenant SaaS platform where organizations and teams will manage projects with full data isolation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 5 |
| ORM | Sequelize 6 |
| Database (prod) | PostgreSQL |
| Database (test) | SQLite |
| Auth | JWT Bearer tokens |
| Password hashing | Bcrypt |
| Validation | express-validator |
| Security headers | Helmet |
| API docs | Swagger UI (`/api-docs`) |
| Tests | Jest + Supertest |
| Containers | Docker + Docker Compose (PostgreSQL 16) |
| CI | GitHub Actions |

---

## Architecture

```
src/
├── config/         # DB connection, env variables
├── db/             # Umzug migrator + versioned migrations
├── policies/       # Centralized access control (taskPolicy)
├── controllers/    # HTTP handlers — parse request, call service, send response
├── services/       # Business logic — rules, access control
├── repositories/   # Data access — Sequelize queries only
├── models/         # Sequelize model definitions
├── middlewares/    # Auth, validation, error handling
├── validators/     # express-validator rule chains
├── routes/         # Express routers
├── utils/          # ApiError, ApiResponse, jwt, hash helpers
└── docs/           # Swagger setup
```

Pattern: **Controller → Service → Repository**. Services can call multiple repositories; services never call other services.

A Next.js frontend lives in `frontend/taskflowfront/` (scaffold, work in progress).

Detailed living backend notes (French): [docs/BACKEND.md](docs/BACKEND.md).

---

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL running locally

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=postgres
DB_PASSWORD=           # required — app refuses to start without it
JWT_SECRET=            # required — must be a long random string
JWT_EXPIRES_IN=1d

# Optional
AUTH_RATE_LIMIT_MAX=10             # login: failed attempts per IP per window; register: attempts
AUTH_RATE_LIMIT_WINDOW_MINUTES=15
TRUST_PROXY=0                      # set to 1 behind a reverse proxy (Render, Fly, nginx...)
```

> `DB_PASSWORD` and `JWT_SECRET` are required. The app throws on startup if either is missing.

### Run

```bash
# Apply database migrations (also done automatically on startup)
npm run migrate

# Development (auto-restart on file change)
npm run dev

# Production
npm start
```

Swagger UI available at `http://localhost:3000/api-docs`

### Run with Docker

Starts the API and a PostgreSQL 16 database. `DB_PASSWORD` and `JWT_SECRET` are read from `.env`.

```bash
docker compose up -d --build
```

Health check: `http://localhost:3000/health`

---

## API Reference

### System

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check — returns `{ "status": "ok" }` |
| GET | `/api-docs` | Swagger UI |

### Authentication — `/api/auth`

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |

### Tasks — `/api/tasks` *(requires Bearer token)*

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/tasks` | auth | All tasks (owned + collaborated). Query: `status`, `priority` (comma-separated), `overdue`, `dueAfter`, `dueBefore`, `sort` (`dueDate`, `-priority`...), `page`, `limit`. Pagination in `meta` |
| GET | `/api/tasks/mine` | auth | Only tasks owned by the caller (same query params) |
| POST | `/api/tasks` | auth | Create a task (`title`, optional `description`, `status`, `priority` low/medium/high, `dueDate` YYYY-MM-DD) |
| GET | `/api/tasks/:id` | owner or collaborator | Get task details |
| PUT | `/api/tasks/:id` | owner or editor | Update a task (`dueDate: null` clears it; `userId`/`id` are ignored) |
| DELETE | `/api/tasks/:id` | owner only | Delete a task |

### Collaborators — `/api/tasks/:id/collaborators` *(requires Bearer token)*

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/tasks/:id/collaborators` | auth | List collaborators |
| POST | `/api/tasks/:id/collaborators` | owner only | Add a collaborator |
| PATCH | `/api/tasks/:id/collaborators/:userId` | owner only | Change collaborator role |
| DELETE | `/api/tasks/:id/collaborators/:userId` | owner only | Remove a collaborator |

**Roles**
- `viewer` — read-only access to the task
- `editor` — can read and update the task

---

## Data Model

```
users
  id, name, email, password, createdAt, updatedAt

tasks
  id, title, description, status (todo|in-progress|done)
  userId (FK → users.id)
  createdAt, updatedAt

task_collaborators
  id, taskId (FK → tasks.id), userId (FK → users.id)
  role (viewer|editor)
  createdAt, updatedAt
  UNIQUE (taskId, userId)
```

---

## Security

- JWT Bearer tokens — stateless authentication
- Bcrypt password hashing
- Rate limiting on login (failed attempts only) and register — 429 after 10 attempts per IP per 15 min
- Centralized access control (`src/policies/taskPolicy.js`) and a whitelist of writable task fields
- Helmet — 15 security headers (removes `X-Powered-By`, adds CSP, HSTS, etc.)
- Input validation on all write endpoints via express-validator
- Centralized error handling — consistent error format; stack traces only in development, generic message for 500 errors in production
- Environment secrets required at startup — no hardcoded fallbacks for sensitive values

---

## Tests

```bash
npm test               # run all tests
npm run test:coverage  # with coverage report
```

Tests run against an in-memory SQLite database (isolated from production), built with the real migrations. CI also runs every migration up, down and up again on PostgreSQL 16, and checks that the Docker image builds.

```
tests/
├── unit/           # in isolation (taskPolicy, taskService, collaboratorService, errorMiddleware)
└── integration/    # HTTP endpoints via Supertest (auth, tasks, task list filters, collaborators, rate limiting) + migrations
```

166 tests. CI runs them on every push and pull request (`.github/workflows/ci.yml`).

---

## Roadmap

The current version covers per-user task management with collaboration. Planned next:

- [ ] **Organizations / Teams** — multi-tenant isolation with `organizations` and `memberships` tables
- [ ] **Projects** — group tasks under projects within an organization
- [ ] **Role-based access at org level** — admin, member, guest
- [ ] **Activity log** — audit trail per task
- [ ] **Notifications** — notify collaborators on task updates
