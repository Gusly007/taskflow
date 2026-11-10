# Backend TaskFlow — Récap

> Doc vivante : à mettre à jour à chaque nouvelle route, couche, modèle ou correction.
> Dernière mise à jour : **2026-11-10**

---

## 1. En bref

API REST de gestion de tâches collaboratives.
**Stack :** Node 20 · Express 5 · Sequelize · PostgreSQL (SQLite en test) · JWT · bcrypt · express-validator · Helmet · Swagger · Jest/Supertest · Docker · GitHub Actions.

---

## 2. Lancer le projet

```bash
npm install
cp .env.example .env      # remplir DB_PASSWORD et JWT_SECRET (obligatoires)
npm run migrate           # applique les migrations en attente (aussi fait auto au démarrage)
npm run dev               # dev avec rechargement auto
npm test                  # tests (SQLite en mémoire)
npm run test:coverage     # tests + couverture
docker compose up -d      # API + PostgreSQL 16 en conteneurs
```

- API : `http://localhost:3000`
- Swagger : `http://localhost:3000/api-docs`
- Health check : `http://localhost:3000/health`

### Migrations (schéma de la BDD)

Le schéma n'est **plus** créé par `sequelize.sync()` : il est versionné dans `src/db/migrations/` (Umzug, format compatible sequelize-cli, suivi dans la table `SequelizeMeta`). `src/server.js` applique les migrations en attente au démarrage, donc `docker compose up` met la base à jour tout seul.

```bash
npm run migrate:status    # migrations appliquées / en attente
npm run migrate           # appliquer
npm run migrate:undo      # annuler la dernière
npm run migrate:undo:all  # tout annuler (vide la base !)
```

- **Changer le schéma** = créer un nouveau fichier `src/db/migrations/AAAAMMJJ-NN-description.js` avec `up` et `down`, puis mettre le modèle à jour. Ne jamais modifier une migration déjà appliquée.
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
| Policies | `src/policies/` | **Contrôle d'accès centralisé** : `taskPolicy.assertTaskAccess(taskId, userId, rôle requis)` | Toute opération sur une tâche existante passe par là |
| Repositories | `src/repositories/` | Requêtes Sequelize | Seule couche qui touche à la BDD |
| Models | `src/models/` | Tables + relations (`models/index.js`) | — |
| Utils | `src/utils/` | `ApiError`, `ApiResponse`, `jwt`, `hash` | — |
| Config | `src/config/` | Connexion BDD, variables d'env | — |
| Migrations | `src/db/` | `migrator.js` (Umzug + CLI) et `migrations/` versionnées | Seule façon de modifier le schéma |

---

## 4. Modèle de données

```
users               id, name, email (unique), password (hashé)
tasks               id, title, description, status (todo | in-progress | done), priority (low | medium | high, défaut medium),
                    dueDate (date AAAA-MM-JJ, nullable, indexée), userId → users
task_collaborators  id, taskId → tasks, userId → users, role (viewer | editor), UNIQUE (taskId, userId)
```

- Un `User` possède plusieurs `Task` (suppression en cascade).
- Champs modifiables par le client : `title`, `description`, `status`, `priority`, `dueDate` (liste blanche `WRITABLE_FIELDS` dans `taskService`). Tout autre champ envoyé (`userId`, `id`…) est ignoré.
- `TaskCollaborator` relie `Task` ↔ `User` avec un rôle. Les FK et le `UNIQUE` sont ajoutés automatiquement par `belongsToMany` dans `models/index.js` (cascade à la suppression d'une tâche ou d'un user).

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
| POST | `/api/tasks` | Créer une tâche (`title` requis, `description`, `status`, `priority`, `dueDate` optionnels) | Connecté |
| GET | `/api/tasks` | Mes tâches + celles où je collabore | Connecté |
| GET | `/api/tasks/mine` | Seulement mes tâches | Connecté |
| GET | `/api/tasks/:id` | Détail d'une tâche | Propriétaire ou collaborateur |
| PUT | `/api/tasks/:id` | Modifier une tâche (`dueDate: null` retire l'échéance) | Propriétaire ou `editor` |
| DELETE | `/api/tasks/:id` | Supprimer une tâche → 204 sans corps | Propriétaire |

### Collaborateurs — JWT requis

| Méthode | Route | Ce qu'elle fait | Accès |
|---|---|---|---|
| GET | `/api/tasks/:id/collaborators` | Lister les collaborateurs | Propriétaire ou collaborateur |
| POST | `/api/tasks/:id/collaborators` | Ajouter (`userId`, `role` = `viewer` par défaut) · 404 si l'utilisateur n'existe pas | Propriétaire |
| PATCH | `/api/tasks/:id/collaborators/:userId` | Changer le rôle | Propriétaire |
| DELETE | `/api/tasks/:id/collaborators/:userId` | Retirer | Propriétaire |

**Rôles :** `viewer` = lecture seule · `editor` = lecture + modification. Seul le propriétaire peut supprimer la tâche ou gérer les collaborateurs.

**Contrôle d'accès (`src/policies/taskPolicy.js`) :** hiérarchie `owner` > `editor` > `viewer`.
- Tâche inexistante **ou** aucun droit dessus → **404** `Task not found` (un inconnu ne peut pas savoir si un id existe).
- Accès à la tâche mais rôle insuffisant (ex. `viewer` qui modifie) → **403**.
- Id non numérique dans l'URL → **400**.

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

Pour renvoyer une erreur depuis un service : `throw new ApiError(403, 'message')`.

---

## 7. Tests & CI

```
tests/
├── setup.js, helpers.js
├── unit/          taskPolicy (18), taskService (18), collaboratorService (17), errorMiddleware (5)
└── integration/   auth (9), task (37), collaborator (30), migrations (3)
```

**137 tests.** Les tests construisent la base SQLite avec les **vraies migrations** (pas `sync`).

La CI (`.github/workflows/ci.yml`) tourne à chaque push et PR, avec 3 jobs :
- **Run tests** : `npm ci` + `npm test`.
- **Migrations on PostgreSQL** : sur un vrai PostgreSQL 16, `migrate` → `migrate:undo:all` → `migrate`.
- **Docker build** : vérifie que l'image de prod se construit (lock file, Dockerfile).

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

---

## Mettre à jour ce fichier

- **Nouvelle route** → ajouter une ligne dans §5
- **Nouveau modèle / champ** → §4
- **Bug corrigé** → cocher dans §8
- **Chaque session de travail** → une ligne dans §9 + changer la date en haut
