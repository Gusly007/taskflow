# TaskFlow web

Next.js 16 front for the TaskFlow API. Next is used as a **backend for frontend**: the browser
never talks to the API and never sees the JWT.

```
browser ──cookie (httpOnly)──▶ Next.js server ──Authorization: Bearer──▶ TaskFlow API
```

## Run it

```bash
cp .env.example .env.local   # then set API_URL and SESSION_SECRET
npm ci
npm run dev                  # http://localhost:3001 (the API keeps 3000)
```

## Architecture

```
Page (reads) ───────┐
                    ├──▶ *.service.ts ──▶ lib/api-client.ts ──▶ TaskFlow API
Server Action ──────┘    (one per resource)  (token, envelope, errors)
(writes, = controller)
```

```
app/                      routing only: short pages that read the URL, call a service, compose components
  (auth)/                 public pages (sign in, sign up)
  (app)/                  pages that need a user (the layout checks the session)
    @modal/               routes shown as a dialog over the page: (.)tasks/new and (.)tasks/[id]
    tasks/new/, tasks/[id]/  the same form / task detail as a full page (direct link, refresh)
  session-expired/        Route Handler: drops the cookie when the API answers 401
features/                 everything about one domain lives together
  auth/                   auth.service.ts, auth.actions.ts, auth.schemas.ts, auth.types.ts, components/
  tasks/                  task.service.ts, task.actions.ts, task.types.ts, task.schemas.ts, task-labels.ts (status / priority labels), search-params.ts (URL -> typed params: views, filters, sort, page), task-views.ts (titles), task-list-page.ts / task-detail.ts (page loaders), task-dates.ts, components/
  projects/               project.service.ts (GET /projects for now), project.types.ts
  collaborators/          collaborator.types.ts (service to come)
  theme/                  light / dark / system switcher
components/
  ui/                     generic building blocks (Button, Input...), no business knowledge
  layout/                 sidebar, header, logo
lib/                      plumbing: api-client, session cookie, DAL (verifySession), cn, form-state
proxy.ts                  optimistic redirect when there is no session cookie
```

### Rules

1. **Only `*.service.ts` files call the API** (`apiFetch`). An ESLint rule fails the lint otherwise.
2. **A service knows nothing about React or Next**: typed data in, typed data out. No `FormData`,
   `redirect` or `revalidatePath`. Services are `server-only`: importing one from a client
   component fails the build, so the token can never reach the browser.
3. **Server Actions are the controllers**: parse the form, validate with zod, call the service,
   then `revalidatePath` / `redirect`. They return a `FormState` for `useActionState`.
4. **Pages** read `searchParams`, call a service, and compose components. No logic.
5. **Server Components by default**; `'use client'` only on the small leaves that need interactivity.
6. **The URL is the state**: view, filters, sort and page live in the query string. The API filters, sorts and
   paginates; components like `TaskFilters` only change the URL (filtering in the browser would only see one page).
7. **No business rules on the front**: who may edit or delete is decided by the API.
8. Imports: relative inside a feature (`./task.types`), `@/...` across folders.
   Files in kebab-case, roles as suffixes (`task.service.ts`, `auth.actions.ts`), named exports.

## Scripts

- `npm run dev`, `npm run build`, `npm start`
- `npm run lint`
- `npm run typecheck`: generates Next's route types, then runs `tsc`
