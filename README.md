# West Sabahiya Health Center (Netlify + Neon + GitHub)

This project is a small React site (Vite) that reads/writes a flexible table from a Neon Postgres database through Netlify Functions.

**Title:** West Sabahiya Health Center  
**Subtitle:** Dr. Abdullah Almusallam

## Features

### Public (no login)
- Table view with:
  - Category dropdown filter
  - Search bar (searches across all columns)
  - Grouping so **Route** entries are grouped (Category → Route), avoiding interleaving like:
    - Tablet, Syrup, Tablet, Syrup…

### Admin (password protected)
Default admin password is **5123**.
- Open via **Admin Panel** button (top right)
- Import CSV (replaces dataset) / Export CSV
- Add / remove columns
- Choose **after which column** a new column should be inserted
- Drag & drop to reorder columns (left → right order in table)
- Add/delete rows
- Edit cells directly
- Save to Neon DB

> Note: Dynamic columns are stored as JSON in Postgres so the admin can add/remove/reorder columns without risky ALTER TABLE operations.

---

## 1) Local setup

### Install
```bash
npm install
```

### Run locally (recommended)
Use Netlify CLI so functions work:
```bash
npm run netlify:dev
```

This starts:
- Vite dev server
- Netlify Functions locally

### Required environment variables
Create a `.env` file **locally** (do not commit) OR set them in Netlify UI:

- `NETLIFY_DATABASE_URL` (from Netlify Neon integration)
- `JWT_SECRET` (any long random string)
- `ADMIN_PASSWORD` (optional; defaults to 5123)

Example `.env`:
```bash
NETLIFY_DATABASE_URL=postgresql://...
JWT_SECRET=some-long-random-string
ADMIN_PASSWORD=5123
```

---

## 2) Netlify + Neon setup

1. Push this repo to GitHub.
2. In Netlify:
   - **New site from Git**
   - pick your GitHub repo
3. Add a Neon database through Netlify’s **Database / Neon** integration:
   - Netlify will set `NETLIFY_DATABASE_URL` automatically.
4. In Netlify **Site settings → Environment variables**, add:
   - `JWT_SECRET` (required)
   - `ADMIN_PASSWORD` (optional)

Deploy. The first request will auto-create these tables:
- `table_meta`
- `table_rows`

---

## 3) CSV format

Header row = column names. Example:

```csv
Category,Generic Name,Dose,Route,Indications,Contraindications
Analgesic,Paracetamol,500 mg,Tablet,Pain/Fever,Liver disease
```

Importing CSV will replace the current dataset (columns + rows).

---

## Project structure

- `src/` React UI
- `netlify/functions/` serverless endpoints
  - `data` (public read)
  - `admin-auth` (password → token)
  - `admin-update` (token required, save all data)

---

## Notes / Security

The password is checked server-side in `admin-auth` (Netlify Function).  
Set `JWT_SECRET` in Netlify for token signing.

If you want stricter security, you can:
- change `ADMIN_PASSWORD`
- add rate limiting or IP allow-lists (advanced)
