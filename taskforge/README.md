# Taskforge — Team Task Manager

Full-stack team task management: JWT auth, MongoDB, REST APIs, role-based access (Admin / Member), Kanban boards, and a per-project analytics dashboard.

## Features

- **Auth**: Signup (name, email, password), login, JWT stored in an **httpOnly** cookie.
- **Projects**: Create projects (creator is Admin), invite members by email, remove members (Admin).
- **Tasks**: Title, description, due date, priority, status (To do / In progress / Done), assignee must be a project member. **Only Admins** create or delete tasks or reassign them. **Members** see and update **only tasks assigned to them**.
- **Dashboard**: Total tasks, counts by status, tasks per assignee, overdue list (UTC midnight), scoped to the selected project (Members see metrics for their assignments only).
- **UI**: Next.js App Router, Tailwind, shadcn-style components, Framer Motion, TanStack Query, Recharts.

## Local setup

1. **Node.js** 20+ recommended.

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set:

   - `MONGODB_URI` — MongoDB Atlas URI with database name `taskforge` in the path.
   - `JWT_SECRET` — long random string (do not commit real values).

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000), sign up, create a project, add another user by email (they must register first), create tasks as Admin, and open the Dashboard.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Development server       |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | ESLint                   |

## Deploy on Railway

Your GitHub repo might be the **parent folder** (where `taskforge/` is a subfolder next to the assignment PDF). Railpack only looks at the repo root, so it will **not** see `package.json` unless you fix that.

### Option A — Root directory (no Docker)

1. In Railway: open your **service** → **Settings** → **Root directory** → set **`taskforge`** (save / redeploy).
2. Railway will build from inside `taskforge/` and detect Next.js automatically.
3. Set **Variables**: `MONGODB_URI`, `JWT_SECRET` (same as local; never commit them).

### Option B — Dockerfile at repo root (already in parent repo)

If the repo root contains `Dockerfile` + `taskforge/`, Railway builds with **Docker** and does not need a root-directory setting. The parent repo for this workspace includes that `Dockerfile`.

### Common for both

1. Push to GitHub (no `.env*` in the app folder committed).
2. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub** → pick the repo.
3. **Variables** on the service:
   - `MONGODB_URI` — Atlas connection string (include `/taskforge` in the path if you use that DB).
   - `JWT_SECRET` — e.g. `openssl rand -base64 32`.
4. **MongoDB Atlas** → **Network Access**: allow Railway (often `0.0.0.0/0` for a short window during the assessment).
5. Open the public URL and test signup → projects → tasks → dashboard.

## Submission checklist (assessment)

- Live app URL (Railway or similar).
- GitHub repository (no secrets committed).
- This README covers setup and deploy.
- Record a **2–5 minute** demo: signup/login, project + members, Admin vs Member in two browsers, tasks/Kanban, dashboard, brief code mention (auth + RBAC + aggregation).

## Security notes

- Never commit `MONGODB_URI` or `JWT_SECRET`. `.gitignore` excludes `.env*`.
- If a database password was shared in a public channel, **rotate** the Atlas user password and update Railway variables.
- Prefer a dedicated database user with access only to the `taskforge` database.

## Tech stack

Next.js 15, React 19, MongoDB (Mongoose), bcrypt, jsonwebtoken, Zod, TanStack Query, Recharts, Framer Motion.
