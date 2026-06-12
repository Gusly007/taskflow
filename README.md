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

---

## Architecture

```
src/
├── config/         # DB connection, env variables
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
```

> `DB_PASSWORD` and `JWT_SECRET` are required. The app throws on startup if either is missing.

### Run

```bash
# Development (auto-restart on file change)
npm run dev

# Production
npm start
```

Swagger UI available at `http://localhost:3000/api-docs`

---

## API Reference

### Authentication — `/api/auth`

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT token |

### Tasks — `/api/tasks` *(requires Bearer token)*

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/tasks` | auth | All tasks (owned + collaborated) |
| GET | `/api/tasks/mine` | auth | Only tasks owned by the caller |
| POST | `/api/tasks` | auth | Create a task |
| GET | `/api/tasks/:id` | owner or collaborator | Get task details |
| PUT | `/api/tasks/:id` | owner or editor | Update a task |
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
- Helmet — 15 security headers (removes `X-Powered-By`, adds CSP, HSTS, etc.)
- Input validation on all write endpoints via express-validator
- Centralized error handling — stack traces only exposed in `development`
- Environment secrets required at startup — no hardcoded fallbacks for sensitive values

---

## Tests

```bash
npm test
```

Tests run against an in-memory SQLite database (isolated from production). Covers auth endpoints and task CRUD via HTTP (Jest + Supertest).

---

## Roadmap

The current version covers per-user task management with collaboration. Planned next:

- [ ] **Organizations / Teams** — multi-tenant isolation with `organizations` and `memberships` tables
- [ ] **Projects** — group tasks under projects within an organization
- [ ] **Role-based access at org level** — admin, member, guest
- [ ] **Activity log** — audit trail per task
- [ ] **Notifications** — notify collaborators on task updates
