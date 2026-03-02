# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

West Sabahiya Health Center — a full-stack medical reference app (React + Vite frontend, Netlify Functions backend, Neon Postgres database). Admins manage a dynamic medication table with flexible columns stored as JSONB. Default admin password is `5123`.

## Commands

```bash
npm install              # Install dependencies
npm run netlify:dev      # Local dev (Vite + Netlify Functions) — use this for development
npm run dev              # Vite dev server only (no serverless functions)
npm run build            # Production build to dist/
npm run preview          # Preview production build
```

No test framework is configured.

## Deployment & Infrastructure

- Git repo auto-deploys to **Netlify** from GitHub (`netlify.toml` configures build)
- Database: **Neon Postgres** (project name: **purple-band**) via Netlify's Neon integration
- MCP servers available: Netlify MCP, Neon DB MCP

## Environment Variables

Requires a `.env` file (not committed) with:
- `NETLIFY_DATABASE_URL` — Neon Postgres connection string (auto-set by Netlify Neon integration)
- `JWT_SECRET` — secret for signing JWTs (required)
- `ADMIN_PASSWORD` — admin login password (optional, defaults to "5123")

## Architecture

### Frontend (src/)

**Styling:** Tailwind CSS v4 with the `@tailwindcss/vite` plugin (not PostCSS). Theme defined via `@theme inline` in `src/index.css` using oklch colors. Primary color is green (oklch 0.55 0.17 150). Custom animations (row-fade-in, expand-in, dialog transitions) are defined in `index.css`.

**UI components:** shadcn/ui-style primitives in `src/components/ui/` built on Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-select`, etc.) + `class-variance-authority` + `tailwind-merge`. The `cn()` utility lives in `src/lib/utils.js`. Icons from `lucide-react`.

**State:** All app state lives in `App.jsx` via `useState`/`useEffect` — no external state library. `App.jsx` owns columns, rows, auth token, filters, and passes everything down as props.

**Key components:**
- `App.jsx` — top-level state, layout, login dialog, category/search filters
- `components/DataTable.jsx` — grouped table rendering with expandable rows, copy/WhatsApp share
- `components/AdminPanel.jsx` — modal for column management (drag-reorder via @dnd-kit), CSV import/export (PapaParse), row operations

**Magic column names:** The app uses `findColumnName()` (fuzzy, case-insensitive matching) to detect semantic columns by name. These column names drive special behavior:
- **"Category"** — used for category filter dropdown and grouping (first level)
- **"Route"** — used for second-level grouping within categories
- **"Generic Name"** — used for sorting rows within route groups
- **"Indications"** + **"Contraindications"** — merged into a single "Info" button/dialog column (`__INFO__` virtual column in DataTable)

**Utilities:**
- `utils/api.js` — three fetch wrappers: `apiGetData()`, `apiAdminAuth(password)`, `apiAdminUpdate({token, columns, rows})`
- `utils/columns.js` — `findColumnName(columns, candidates)`: exact match → contains match (case-insensitive)
- `utils/grouping.js` — filters by category/search, groups by Category → Route, sorts by Generic Name
- `utils/csv.js` — CSV export (blob download) and import (PapaParse, with validation)

**Print support:** Elements with class `no-print` are hidden in print. Print styles in `index.css` force landscape, collapse borders, strip shadows.

### Backend (netlify/functions/)

- `data.mjs` — GET, public read of columns + rows; auto-creates schema on first request; auto-cleans invalid/unnamed columns
- `admin-auth.mjs` — POST, password → JWT (7-day expiry, role=admin)
- `admin-update.mjs` — POST, requires Bearer token; validates columns (no duplicates, no empty/unnamed), deletes all rows then re-inserts with only known columns
- `_db.mjs` — shared DB utilities, `ensureSchema()` creates `table_meta` (JSONB columns) + `table_rows` (JSONB data per row with text UUID ids). `DEFAULT_COLUMNS` defined here.
- `_auth.mjs` — JWT sign/verify helpers using `jsonwebtoken`

### Key Design Decisions

- Dynamic columns stored as JSONB in `table_meta` — no ALTER TABLE needed when admins add/remove columns
- CSV import replaces the entire dataset (columns + rows)
- Admin update deletes all rows then re-inserts (simple transactional approach); row data is cleaned to only include known columns
- Client-generated UUIDs (`crypto.randomUUID()`) for row IDs, preserved through save cycles
- Admin token stored in `localStorage` and persists across page reloads

## API Endpoints

All under `/.netlify/functions/`:
- `GET /data` — public, returns `{columns, rows}`
- `POST /admin-auth` — body: `{password}`, returns `{token}`
- `POST /admin-update` — header: `Authorization: Bearer <token>`, body: `{columns, rows}`
