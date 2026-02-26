# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

West Sabahiya Health Center — a full-stack medical reference app (React + Vite frontend, Netlify Functions backend, Neon Postgres database). Admins manage a dynamic medication table with flexible columns stored as JSONB.

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

- Git repo auto-deploys to **Netlify** from GitHub
- Database: **Neon Postgres** (project name: **purple-band**) via Netlify's Neon integration
- MCP servers available: Netlify MCP, Neon DB MCP

## Environment Variables

Requires a `.env` file (not committed) with:
- `NETLIFY_DATABASE_URL` — Neon Postgres connection string
- `JWT_SECRET` — secret for signing JWTs (required)
- `ADMIN_PASSWORD` — admin login password (optional, defaults to "5123")

## Architecture

**Frontend (src/):**
- `main.jsx` → mounts `App` to `#root`
- `App.jsx` — top-level state manager (columns, rows, auth token, filters). All state lives here via useState/useEffect, no external state library.
- `components/DataTable.jsx` — renders grouped table (Category → Route → sorted by Generic Name), supports inline editing in admin mode
- `components/AdminPanel.jsx` — modal for column management (add/remove/drag-reorder via @dnd-kit), CSV import/export (PapaParse), row operations, save/reload
- `utils/api.js` — three API functions: `apiGetData()`, `apiAdminAuth(password)`, `apiAdminUpdate({token, columns, rows})`
- `utils/columns.js` — fuzzy column name matching (exact then contains, case-insensitive)
- `utils/grouping.js` — filters rows by category/search, groups by Category → Route
- `utils/csv.js` — CSV export (blob download) and import (with validation)
- `styles.css` — all styles, CSS variables for theming (primary green `#16a34a`)

**Backend (netlify/functions/):**
- `data.mjs` — GET, public read of columns + rows; auto-creates schema on first request
- `admin-auth.mjs` — POST, password → JWT (7-day expiry, role=admin)
- `admin-update.mjs` — POST, requires Bearer token; validates columns, replaces all rows in DB
- `_db.mjs` — shared DB utilities, `ensureSchema()` creates `table_meta` (JSONB columns) and `table_rows` (JSONB data per row with UUID ids)
- `_auth.mjs` — JWT sign/verify helpers

**Key design decisions:**
- Dynamic columns stored as JSONB in `table_meta` — no ALTER TABLE needed when admins add/remove columns
- CSV import replaces the entire dataset (columns + rows)
- Admin update deletes all rows then re-inserts (simple transactional approach)
- Client-generated UUIDs for row IDs, preserved through save cycles

## API Endpoints

All under `/.netlify/functions/`:
- `GET /data` — public, returns `{columns, rows}`
- `POST /admin-auth` — body: `{password}`, returns `{token}`
- `POST /admin-update` — header: `Authorization: Bearer <token>`, body: `{columns, rows}`
