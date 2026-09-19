<a name="top"></a>

# Matrix — Project Management System

<p align="left">
  Matrix is a full-stack productivity platform for developers juggling multiple projects at once. It connects your high-level mission to day-to-day tasks through a clear hierarchy (<strong>Mission → Objectives → Plans → Tasks</strong>), syncs your GitHub repos, lets you evaluate ideas before committing to them, stores passwords securely, and gives you metrics, task streaks, and a daily focus view so nothing gets lost.
</p>

<p align="left">
  <strong>Define your mission. Break it into objectives. Plan. Execute the tasks for each plan. Track every project, capture every idea, and store your credentials securely — all from a self-hosted dashboard.</strong>
</p>

<p align="center">
  <a href="#demo">Demo</a> •
  <a href="#the-problem">The Problem</a> •
  <a href="#features">Features</a> •
  <a href="#running-locally">Local</a> •
  <a href="#deployment-on-cubepath">Deployment</a> •
  <a href="#tech-stack">Stack</a> •
  <a href="#project-origin">Origin</a> •
  <a href="#license">License</a>
</p>

---

<p align="center">
  <img src="public/light-overview.png" alt="Overview — main dashboard with mission, stats, activity and side panel" width="100%" />
</p>

<p align="center">
  <img src="public/dark-tasks.png" alt="Task Board — Kanban board with priorities, deadlines and metrics" width="100%" />
</p>

<p align="center">
  <img src="public/dark-projects.png" alt="Projects — view of projects synced with GitHub" width="100%" />
</p>

---

## Demo

> **Note:** This repository is the public reference version. The database layer uses **sql.js** (SQLite in WebAssembly, no native compilation) and the **Password Vault module is not included** in this version. Data lives in memory and resets on server restart — ideal for exploring the code. See [Running locally](#running-locally).

There's a live demo available at **[matrix.stackbp.es](https://matrix.stackbp.es)**

Click the `$ access --demo` button on the login page — it auto-fills the demo credentials with an animated cursor and logs you in. You can also enter `demo / demo1234` manually.

The demo account comes with preloaded data (missions, tasks, ideas). Use the **Restore** button in Settings to reset the demo data at any time.

[<sub>↑ Back to top</sub>](#top)

---

## The Problem

You've got ideas scattered across `.txt` files. Projects with no clear priorities. Tasks disconnected from any bigger objective. Credentials buried in some lost `.env` or `.txt` on your PC.

Questions that keep coming up:

- What's the actual plan right now?
- What task should I focus on today?
- What state are all my side projects in?
- Where did I save that API key?

**Matrix** brings all of this together in a self-hosted platform — your data, your server, your rules.

[<sub>↑ Back to top</sub>](#top)

---

## Features

### Mission Control

Structured top-down planning: **Mission → Objectives → Plans → Tasks**. Progress rolls up automatically at every level so you always know where you stand.

### Task Board

Kanban-style board with priorities (critical / high / medium / low), deadlines, and status tracking (Todo → In Progress → Done). Calendar-based date picker.

### Project Tracker

Syncs your GitHub repos. Each project shows:

- Language breakdown (TypeScript, Python, Rust, Go...)
- Latest commit, active branch
- Dependency count
- Test and CI/CD detection
- README / ROADMAP / TODO status

Projects can be linked to any level of the mission hierarchy (polymorphic links).

### Ideas Pipeline

Capture raw ideas, score them across several dimensions (alignment, impact, cost, risk), and move them through the flow: `draft → evaluating → approved → in_progress → done / discarded`.

### Daily Notes

Calendar-based daily notepad. Pick a day, write plain text, it's saved to the database. Days with notes are marked with a dot. Auto-saves with debounce + manual save button.

### Activity & Analytics

Every action is logged automatically. The side panel shows:

- Daily/weekly activity heatmap
- Completed task trends
- Ideas pipeline distribution
- Pomodoro timer + session tracking
- Streak counter

### Authentication and Password Recovery

Login and sign-up with email. Password recovery via email (Resend/SMTP). Without SMTP configured, the reset link shows up in the server logs (Dokploy panel) — handy for self-hosted instances without an email provider.

### System Status

Monitor your external services' status directly from the side panel. HTTP pings to backends (Render and similar) with sleeping-service detection, and TCP checks against external databases (MySQL/PostgreSQL). Sleeping services can be woken up with one click. Configuration encrypted with the vault key.

### Backup

Download your personal SQLite database directly from Settings — a single file with all your missions, tasks, ideas, projects, notes, and encrypted passwords.

### Security and Multi-user

Each user has their own isolated SQLite database — one user's data never mixes with another's. Security HTTP headers on every response (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy). `x-powered-by` disabled. `security.txt` and `robots.txt` served. Internal error details hidden in production. Graceful server shutdown with a fallback timeout. New user registration is controlled via environment variable.

### i18n — Full Bilingual System (EN/ES)

English and Spanish supported throughout the app — both the UI and the demo data. Switching language regenerates all demo data (missions, tasks, ideas, projects, passwords) in the selected language without reloading the page. The preference is persisted per user on the backend and restored automatically on login. Quick-switch button available on Overview, Settings, and the login page.

### Responsive

Fully functional on mobile and tablet without losing the desktop experience. The sidebar collapses into a slide-out overlay with a hamburger button. Kanban columns stack vertically on small screens. Each task card includes an inline status selector (mobile only) as an alternative to drag and drop. All modals and views adapt via Tailwind breakpoints — no extra dependencies.

[<sub>↑ Back to top</sub>](#top)

---

## Running locally

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:5173` and log in with `demo / demo1234`.

> Data lives in memory — it resets every time the server restarts. For persistence, the DB layer is swappable for libsql.

[<sub>↑ Back to top</sub>](#top)

---

## Deployment on CubePath

Matrix runs in production on a [CubePath](https://cubepath.dev) VPS with [Dokploy](https://dokploy.com) installed as the deployment manager. The flow is straightforward: the GitHub repository is connected to Dokploy, which listens for pushes to `main`. Every push triggers a multi-stage Docker build and automatic redeploy. Traefik (bundled with Dokploy) handles HTTPS with Let's Encrypt certificates. The whole app — backend, frontend, and database — runs in a single container inside the VPS, accessible at [matrix.stackbp.es](https://matrix.stackbp.es).

**Why CubePath + Dokploy?**

- **Everything in one place**: backend (Node.js + Express), database (SQLite persisted on a Docker volume), and frontend (React served as static files) all run in a single container inside the VPS, with no external services needed.
- **Automatic HTTPS**: Traefik (built into Dokploy) provisions and renews Let's Encrypt certificates with no manual configuration.
- **Continuous deployment**: every push to `main` on GitHub triggers a rebuild and automatic redeploy — no SSH keys, no deploy scripts, no manual intervention.
- **Web panel**: Dokploy offers a visual interface for managing environment variables, domains, logs, and rollbacks — all from the browser.
- **Simplicity**: from a `docker-compose.yml` and a few environment variables, the whole app is in production with HTTPS within minutes.

### Architecture

```
┌─── VPS (CubePath) ───────────────────────────────┐
│                                                   │
│  ┌── Traefik (Dokploy) ────────────────────────┐  │
│  │  Auto HTTPS (Let's Encrypt)                 │  │
│  │  Ports 80/443 → reverse proxy to app:3939   │  │
│  └──────────────┬──────────────────────────────┘  │
│                 │                                  │
│  ┌── Container: app ───────────────────────────┐  │
│  │  Node.js (Express + static frontend)        │  │
│  │  Port 3939 (internal)                       │  │
│  └────────────────┬───────────────────────────┘   │
│                   │ read/write                     │
│  ┌── Volume: matrix_data (/data) ────────────────┐ │
│  │  auth.db        ← users and sessions          │ │
│  │  users/*.db     ← one isolated DB per user     │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

[<sub>↑ Back to top</sub>](#top)

---

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ------------------------------------------------------------------ |
| Backend    | Node.js + Express 4 + Drizzle ORM                                 |
| Database   | SQLite via sql.js (in-memory) — swappable for libsql for persistence |
| Frontend   | React 18 + Vite + Tailwind CSS 3.4                                |
| State      | Zustand + React Query                                              |
| Auth       | scrypt password hashing + HMAC session tokens + httpOnly cookies  |
| Validation | Zod (backend) + client-side validation                            |
| Infra      | Docker multi-stage + Dokploy + Traefik (auto HTTPS)                |
| CI/CD      | GitHub Actions (typecheck) + Dokploy auto-deploy                  |
| Testing    | Vitest                                                             |

[<sub>↑ Back to top</sub>](#top)

---

## Project Origin

Matrix-CubePath is the web evolution of [Matrix](https://github.com/bpstack/matrix), originally built as an Electron desktop app (for personal use). The mission hierarchy and task management carried over, but the migration brought fundamental changes:

|                       | Matrix (Electron)                                              | Matrix-CubePath (Web)                                        |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| **Runtime**           | Desktop app (.exe / .dmg)                                        | Web app — accessible from any browser                          |
| **Users**             | Single user, no authentication                                   | Multi-user with sign-up, login, and rate limiting               |
| **Database**          | A single shared SQLite file                                      | Auth DB + isolated SQLite databases per user                    |
| **Project scanning**  | Local filesystem (directories, git info, file stats)             | GitHub API (repos, languages, commits, README detection)       |
| **Deployment**        | Packaged binary with auto-updates                                 | Docker container on any VPS or cloud provider                  |

[<sub>↑ Back to top</sub>](#top)

---

## License

[MIT](LICENSE) © 2026 [bpstack](https://stackbp.es)

You can use, modify, and distribute Matrix freely, even for commercial
purposes, as long as you keep the copyright notice and license.
The software is provided "as is", without warranties.

[<sub>↑ Back to top</sub>](#top)
