# Backend TaskFlow — Récap

> Doc vivante : à mettre à jour à chaque nouvelle route, couche, modèle ou correction.
> Dernière mise à jour : **2026-11-26**

---

## 1. En bref

API REST de gestion de tâches collaboratives.
**Stack :** Node 20 · **TypeScript 6 (strict)** · Express 5 · Sequelize · PostgreSQL (SQLite en test) · JWT · bcrypt · express-validator · Helmet · Swagger · Jest/Supertest · Docker · GitHub Actions.

---

## 2. Lancer le projet

```bash
npm ci                    # installe exactement le lock (pas npm install, voir §7)
cp .env.example .env      # remplir DB_PASSWORD et JWT_SECRET (obligatoires)
npm run migrate           # applique les migrations en attente (aussi fait auto au démarrage)
npm run dev               # dev avec rechargement auto (tsx exécute le TypeScript directement)
npm run typecheck         # vérifie les types de src/ et tests/ (tsc, rien n'est généré)
npm test                  # tests (SQLite en mémoire, ts-jest vérifie aussi les types)
npm run test:coverage     # tests + couverture
npm run build             # compile src/ en JavaScript dans dist/
npm start                 # lance la version compilée (dist/server.js)
docker compose up -d      # API + PostgreSQL 16 en conteneurs
```

- API : `http://localhost:3000`
- Swagger : `http://localhost:3000/api-docs`
- Health check : `http://localhost:3000/health`

### TypeScript

- Tout le code (`src/`) et les tests (`tests/`) sont en TypeScript **strict**.
- `tsconfig.json` : config de l'éditeur, de ts-jest et de `npm run typecheck` (src + tests, n'émet rien).
- `tsconfig.build.json` : build de prod, `src/` → `dist/` (les tests ne sont pas compilés).
- En dev, `tsx` exécute les `.ts` sans étape de build. En prod, Node exécute le JavaScript compilé de `dist/`.
- `src/types/express.d.ts` ajoute `req.user` au type `Request` d'Express. Dans un controller, utiliser `currentUserId(req)` (`authMiddleware`) qui renvoie un `number` ou lance un 401.
- Les modèles Sequelize sont des classes typées (`InferAttributes` / `CreationOptional`). Les valeurs autorisées (`TASK_STATUSES`, `TASK_PRIORITIES`, `COLLABORATOR_ROLES`…) sont définies une seule fois dans les modèles, et les validators les réutilisent.

### Migrations (schéma de la BDD)

Le schéma n'est **plus** créé par `sequelize.sync()` : il est versionné dans `src/db/migrations/` (Umzug, format compatible sequelize-cli, suivi dans la table `SequelizeMeta`). `src/server.ts` applique les migrations en attente au démarrage, donc `docker compose up` met la base à jour tout seul.

```bash
npm run migrate:status    # migrations appliquées / en attente
npm run migrate           # appliquer
npm run migrate:undo      # annuler la dernière
npm run migrate:undo:all  # tout annuler (vide la base !)
```

- **Changer le schéma** = créer un nouveau fichier `src/db/migrations/AAAAMMJJ-NN-description.ts` qui exporte `up` et `down`, puis mettre le modèle à jour. Ne jamais modifier une migration déjà appliquée. Une migration utilise `DataTypes` directement et n'importe jamais les modèles (elle doit rester figée).
- Les migrations sont enregistrées sous le nom `xxx.js` dans `SequelizeMeta`, même quand `tsx` exécute le `.ts` en dev. C'est ce que contiennent les bases créées avant TypeScript, et ce que `dist/` exécute.
- Dans l'image Docker (pas de `tsx`) : `node dist/db/migrator.js status` (ou `up`, `down`, `down:all`).
- `20261110-01-initial-schema` : schéma de base. Sur une base créée avant les migrations (ton volume Docker), elle ne fait rien et se marque comme appliquée.

---

## 3. Les couches

```
Requête → Route → Middlewares → Controller → Service → Repository → Model → BDD
```

| Couche | Dossier | Rôle | Règle |
|---|---|---|---|
| Routes | `src/routes/` | URL → middlewares → controller (+ annotations Swagger) | Pas de logique |
| Middlewares | `src/middlewares/` | `auth` (JWT → `req.user`), `validate` (→ 400), `error` (gestion globale) | — |
| Validators | `src/validators/` | Règles express-validator (`paramValidator` : ids d'URL entiers, sinon 400) | Un fichier par ressource |
| Controllers | `src/controllers/` | Lit `req`, appelle le service, renvoie la réponse | Pas de logique métier |
| Services | `src/services/` | Logique métier, lance des `ApiError` | Peut appeler plusieurs repositories et les policies, jamais un autre service |
| Policies | `src/policies/` | **Contrôle d'accès centralisé** : `taskPolicy.assertTaskAccess(taskId, userId, rôle requis)` et `projectPolicy.assertProjectAccess(projectId, userId, rôle requis)` | Toute opération sur une tâche ou un projet existant passe par là |
| Repositories | `src/repositories/` | Requêtes Sequelize | Seule couche qui touche à la BDD |
| Models | `src/models/` | Classes typées + relations (`models/index.ts`) + valeurs autorisées (statuts, priorités, rôles) | — |
| Utils | `src/utils/` | `ApiError`, `ApiResponse`, `jwt`, `hash` | — |
| Config | `src/config/` | Connexion BDD, variables d'env | — |
| Migrations | `src/db/` | `migrator.ts` (Umzug + CLI) et `migrations/` versionnées | Seule façon de modifier le schéma |
| Types | `src/types/` | Déclarations globales (`req.user` sur `Request`) | — |

---

## 4. Modèle de données

```
users               id, name, email (unique), password (hashé)
tasks               id, title, description, status (backlog | todo | in-progress | in-review | done, défaut todo), priority (low | medium | high, défaut medium),
                    dueDate (date AAAA-MM-JJ, nullable, indexée), userId → users,
                    projectId → projects (nullable, indexée, ON DELETE SET NULL)
task_collaborators  id, taskId → tasks, userId → users, role (viewer | editor), UNIQUE (taskId, userId)
projects            id, name, description, ownerId → users (cascade)
project_members     id, projectId → projects, userId → users, role (viewer | editor), UNIQUE (projectId, userId)
```

- Un `User` possède plusieurs `Task` (suppression en cascade).
- Champs modifiables par le client : `title`, `description`, `status`, `priority`, `dueDate` (liste blanche `WRITABLE_FIELDS` dans `taskService`). Tout autre champ envoyé (`userId`, `id`…) est ignoré.
- Un `Project` a un propriétaire (`ownerId`, jamais dans `project_members`) et des membres `ProjectMember` (viewer / editor). Supprimer un projet **garde ses tâches** : elles redeviennent des tâches perso (`projectId` → null).
- `projectId` n'est pas dans `WRITABLE_FIELDS` : il est traité à part dans `taskService` (rôle editor requis dans le projet cible, et seul le propriétaire de la tâche peut la déplacer).
- `TaskCollaborator` relie `Task` ↔ `User` avec un rôle. Les FK et le `UNIQUE` sont ajoutés automatiquement par `belongsToMany` dans `models/index.ts` (cascade à la suppression d'une tâche ou d'un user).

---

## 5. Routes

### Publiques

| Méthode | Route | Ce qu'elle fait |
|---|---|---|
| GET | `/health` | Renvoie `{ status: 'ok' }` |
| GET | `/api-docs` | Swagger UI |
| POST | `/api/auth/register` | Inscription → `data: { user, token }` (format `ApiResponse`) · 409 si email déjà pris |
| POST | `/api/auth/login` | Connexion → `data: { user, token }` (format `ApiResponse`) · 401 si identifiants invalides |

### Tâches — JWT requis (`Authorization: Bearer <token>`)

| Méthode | Route | Ce qu'elle fait | Accès |
|---|---|---|---|
| POST | `/api/tasks` | Créer une tâche (`title` requis, `description`, `status`, `priority`, `dueDate`, `projectId` optionnels) · `projectId` : rôle editor requis dans le projet (403 si viewer, 404 si pas membre) | Connecté |
| GET | `/api/tasks` | Mes tâches + celles où je collabore + **celles des projets dont je suis propriétaire ou membre** (filtres, tri, pagination : voir ci-dessous) | Connecté |
| GET | `/api/tasks/mine` | Seulement mes tâches (mêmes paramètres) | Connecté |
| GET | `/api/tasks/:id` | Détail d'une tâche | Propriétaire, collaborateur ou membre du projet |
| PUT | `/api/tasks/:id` | Modifier une tâche (`dueDate: null` retire l'échéance · changer `projectId` : propriétaire de la tâche uniquement) | Propriétaire ou `editor` |
| DELETE | `/api/tasks/:id` | Supprimer une tâche → 204 sans corps | Propriétaire |

### Collaborateurs — JWT requis

| Méthode | Route | Ce qu'elle fait | Accès |
|---|---|---|---|
| GET | `/api/tasks/:id/collaborators` | Lister les collaborateurs | Propriétaire ou collaborateur |
| POST | `/api/tasks/:id/collaborators` | Ajouter (`userId`, `role` = `viewer` par défaut) · 404 si l'utilisateur n'existe pas | Propriétaire |
| PATCH | `/api/tasks/:id/collaborators/:userId` | Changer le rôle | Propriétaire |
| DELETE | `/api/tasks/:id/collaborators/:userId` | Retirer | Propriétaire |

**Rôles :** `viewer` = lecture seule · `editor` = lecture + modification. Seul le propriétaire peut supprimer la tâche ou gérer les collaborateurs.

**Contrôle d'accès (`src/policies/taskPolicy.ts`) :** hiérarchie `owner` > `editor` > `viewer`.
- Tâche inexistante **ou** aucun droit dessus → **404** `Task not found` (un inconnu ne peut pas savoir si un id existe).
- Accès à la tâche mais rôle insuffisant (ex. `viewer` qui modifie) → **403**.
- Id non numérique dans l'URL → **400**.
- Le rôle sur une tâche est le **plus élevé** de : propriétaire, rôle collaborateur, rôle obtenu via le projet de la tâche (propriétaire ou editor du projet → `editor`, viewer du projet → `viewer`). Supprimer la tâche et gérer ses collaborateurs restent réservés au propriétaire de la tâche.

### Projets — JWT requis

| Méthode | Route | Ce qu'elle fait | Accès |
|---|---|---|---|
| POST | `/api/projects` | Créer un projet (`name` requis, `description`) → je deviens propriétaire | Connecté |
| GET | `/api/projects` | Projets dont je suis propriétaire ou membre, chacun avec mon `role` | Connecté |
| GET | `/api/projects/:id` | Détail + mon `role` | Membre |
| PUT | `/api/projects/:id` | Renommer / décrire | Propriétaire |
| DELETE | `/api/projects/:id` | Supprimer → 204 · les tâches sont gardées (`projectId` → null) | Propriétaire |
| GET | `/api/projects/:id/members` | Lister les membres | Membre |
| POST | `/api/projects/:id/members` | Ajouter (`userId`, `role` = `viewer` par défaut) · 409 si déjà membre · 400 si c'est le propriétaire · 404 si l'utilisateur n'existe pas | Propriétaire |
| PATCH | `/api/projects/:id/members/:userId` | Changer le rôle | Propriétaire |
| DELETE | `/api/projects/:id/members/:userId` | Retirer un membre, ou quitter le projet (mon propre `userId`) · le propriétaire ne peut pas quitter (400) | Propriétaire, ou le membre lui-même |

Mêmes règles que les tâches (`src/policies/projectPolicy.ts`) : projet inexistant ou pas membre → **404**, membre avec un rôle insuffisant → **403**.

---

### Lister les tâches : `GET /api/tasks` et `/api/tasks/mine`

| Paramètre | Exemple | Effet |
|---|---|---|
| `status` | `todo,in-progress` | Un ou plusieurs statuts (séparés par des virgules) |
| `priority` | `high` | Une ou plusieurs priorités |
| `overdue` | `true` | `true` = échéance passée et pas `done` · `false` = tout le reste |
| `dueAfter` / `dueBefore` | `2026-11-01` | Échéance comprise entre ces jours (inclus) |
| `projectId` | `3` | Seulement les tâches de ce projet (sur `/api/tasks` : 404 si je ne suis pas membre) |
| `sort` | `dueDate`, `-priority` | `createdAt`, `updatedAt`, `dueDate`, `priority`, `title`, `status` · `-` = décroissant · défaut `-createdAt` |
| `page` / `limit` | `2` / `50` | Pagination · défaut page 1, 20 par page, max 100 |

- Réponse : `data` = la page de tâches, `meta` = `{ page, limit, total, totalPages }`.
- Tri `priority` par importance (low < medium < high), pas par ordre alphabétique. Les tâches sans échéance sont **toujours en dernier** en tri `dueDate`. Résultat identique sur SQLite et PostgreSQL (vérifié).
- « En retard » est calculé avec la date du jour en **UTC**.
- Paramètre invalide (statut inconnu, `limit=500`, date mal formée…) → 400.

### Rate limiting (`src/middlewares/rateLimitMiddleware.ts`)

- `POST /api/auth/login` : **10 échecs** max par IP et par 15 min (les connexions réussies ne comptent pas), puis 429 pour toutes les tentatives de cette IP jusqu'à la fin de la fenêtre.
- `POST /api/auth/register` : 10 inscriptions max par IP et par 15 min.
- Réglable avec `AUTH_RATE_LIMIT_MAX` et `AUTH_RATE_LIMIT_WINDOW_MINUTES`. En-têtes `RateLimit` / `RateLimit-Policy` envoyés.
- Derrière un proxy (Render, Fly, nginx…), mettre `TRUST_PROXY=1`, sinon tous les utilisateurs partagent l'IP du proxy et se bloquent mutuellement.
- Compteurs en mémoire : suffisant pour une instance. Avec plusieurs instances, passer à un store Redis.

---

## 6. Format des réponses

Succès (`ApiResponse.success`) :
```json
{ "status": "success", "statusCode": 200, "message": "...", "data": { }, "date": "ISO" }
```

Erreur (`ApiResponse.error`, via `errorMiddleware`) :
```json
{ "status": "error", "statusCode": 404, "message": "Task not found", "date": "ISO" }
```

- **Toutes** les routes utilisent ce format, `register` et `login` compris. Le `statusCode` du corps est toujours égal au code HTTP (201 pour les créations).
- Exception : `DELETE /api/tasks/:id` répond **204 sans corps**.
- `NODE_ENV=development` : le corps d'erreur contient aussi `details.stack`.
- Hors développement, une erreur 500 renvoie toujours `Internal Server Error` (aucun message SQL ni chemin de fichier n'est exposé) et l'erreur est loguée côté serveur.

Listes paginées : en plus, `"meta": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }`.

Pour renvoyer une erreur depuis un service : `throw new ApiError(403, 'message')`.

---

## 7. Tests & CI

```
tests/
├── setup.ts, helpers.ts, fakes.ts (faux modèles typés pour les tests unitaires)
├── unit/          taskPolicy (26), taskService (25), collaboratorService (17), errorMiddleware (5)
└── integration/   auth (9), task (37), taskList (22), collaborator (30), project (38), migrations (4), rateLimit (3)
```

**225 tests.** Les tests construisent la base SQLite avec les **vraies migrations** (pas `sync`).

La CI (`.github/workflows/ci.yml`) tourne à chaque push et PR, avec 3 jobs :
- **Run tests** : `npm ci` + `npm test` (ts-jest vérifie les types : une erreur de type fait échouer les tests).
- **Migrations on PostgreSQL** : sur un vrai PostgreSQL 16, `npm run build` puis les migrations **compilées**, comme dans l'image Docker : `node dist/db/migrator.js up` → `down:all` → `up` → `status`. `npm ci --include=dev` car `NODE_ENV=production` sauterait les devDependencies (TypeScript).
- **Docker build** : vérifie que l'image de prod se construit (lock file, Dockerfile, compilation `tsc`).

Le Dockerfile a 3 étapes : `build` (compile le TypeScript), `deps` (dépendances de prod seulement), puis l'image finale qui ne contient que `dist/` et les dépendances de prod (ni sources TypeScript, ni compilateur, ni tests).

⚠️ Sous Windows, `npm install` peut retirer du `package-lock.json` des dépendances optionnelles d'autres OS, et `npm ci` échoue ensuite en CI et dans Docker. Pour installer un projet existant, utiliser `npm ci`.

---

## 8. À corriger / TODO

- [x] **Sécurité :** `GET /:id/collaborators` n'avait aucun contrôle d'accès (IDOR). Corrigé le 2026-11-10 via `taskPolicy` : propriétaire ou collaborateur uniquement, 404 sinon.
- [x] `register` / `login` passent maintenant par `ApiResponse` (corrigé le 2026-11-10).
- [x] `ApiResponse.error()` accepte `details` : stack renvoyée en dev uniquement, message générique pour les 500 hors dev (corrigé le 2026-11-10).
- [x] `DELETE /api/tasks/:id` répond 204 sans corps (corrigé le 2026-11-10).

---

## 9. Historique

| Date | Changement |
|---|---|
| 2026-03-12 | Création de l'API en couches · migration MongoDB → PostgreSQL/Sequelize · tests auth + tâches · Swagger |
| 2026-06-12 | Collaboration sur les tâches (viewer / editor) · correctif sécurité env · README |
| 2026-06-15 | Tests réorganisés en unit/integration · CI GitHub Actions · correction des `require` |
| 2026-06-23 | Dockerisation (Dockerfile + compose) · route `/health` · Swagger renommé "TaskFlow API" |
| 2026-10-28 | Ajout du scaffold frontend Next.js (`frontend/taskflowfront/`) · Jest 30.4.2 |
| 2026-11-10 | Contrôle d'accès centralisé (`src/policies/taskPolicy.js`) · faille `GET /:id/collaborators` corrigée · 404 au lieu de 403 sans aucun droit · validation des ids d'URL · 404 si on ajoute un utilisateur inexistant · 80 → 116 tests |
| 2026-11-10 | `register` / `login` au format `ApiResponse` · `statusCode` du corps aligné sur le code HTTP (201) · stack en dev uniquement, 500 génériques hors dev · `DELETE` 204 sans corps · 116 → 121 tests |
| 2026-11-10 | **Faille corrigée** : un `editor` pouvait devenir propriétaire via `PUT { userId }` (liste blanche des champs) · migrations Umzug à la place de `sync` · `priority` + `dueDate` sur les tâches · CI : migrations sur PostgreSQL + docker build · 121 → 137 tests |
| 2026-11-10 | Filtres (`status`, `priority`, `overdue`, `dueAfter`/`dueBefore`), tri et pagination (`meta`) sur `GET /tasks` et `/tasks/mine` · rate limiting login/register (429) · `TRUST_PROXY` · 137 → 166 tests |
| 2026-11-25 | **Projets** : tables `projects` + `project_members` (viewer / editor), `tasks.projectId` · routes `/api/projects` (CRUD + membres) · `GET /api/tasks` inclut les tâches des projets dont on est membre, filtre `?projectId=` · rôle sur une tâche = le plus élevé (propriétaire, collaborateur, projet) · `projectPolicy` · migration testée sur PostgreSQL 16 · 166 → 216 tests |
| 2026-11-25 | **Migration complète vers TypeScript strict** (src + tests) · modèles Sequelize typés · build `dist/` + Dockerfile multi-étapes · `tsx` en dev · `collaboratorRepositorie` renommé `collaboratorRepository` · code mort supprimé (`ownerTask`, `getTasksForCollaborator`…) · 166 tests |
| 2026-11-26 | **Statuts façon Jira** : `backlog` et `in-review` ajoutés (workflow backlog → todo → in-progress → in-review → done) · migration `ALTER TYPE … ADD VALUE … BEFORE`, `down` qui reclasse les tâches et recrée l'ENUM, testée sur PostgreSQL 16 · tri par statut dans l'ordre du workflow (même `CASE` que la priorité, identique sur SQLite et PostgreSQL) · 216 → 225 tests · CI : le job migrations lance `dist/` (il échouait depuis le passage à TypeScript : `tsx` absent avec `NODE_ENV=production`) |

---

## Mettre à jour ce fichier

- **Nouvelle route** → ajouter une ligne dans §5
- **Nouveau modèle / champ** → §4
- **Bug corrigé** → cocher dans §8
- **Chaque session de travail** → une ligne dans §9 + changer la date en haut
