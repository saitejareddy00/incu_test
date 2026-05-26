# Deployment Guide

Deploy the **backend API** and **frontend UI** as separate services. They communicate over HTTPS; the browser calls the API using `VITE_API_URL`.

---

## What was added

| File | Purpose |
|------|---------|
| [`backend/Dockerfile`](../backend/Dockerfile) | Production API image (migrate on start, then Node server) |
| [`frontend/Dockerfile`](../frontend/Dockerfile) | Build React app + serve with nginx |
| [`docker-compose.prod.yml`](../docker-compose.prod.yml) | Run Postgres + API + UI together locally |
| [`render.yaml`](../render.yaml) | One-click blueprint for [Render](https://render.com) |

---

## Environment variables

### Backend (`salary-mgmt-api`)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `postgres://user:pass@host:5432/app` |
| `PORT` | No (default `3000`) | Render sets this automatically |
| `CORS_ORIGIN` | Yes if UI is on another domain | `https://my-app.onrender.com` |
| `LOG_LEVEL` | No | `info` |
| `TEST_DATABASE_URL` | No (tests only) | — |

### Frontend (build time)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | Yes when UI ≠ API host | `https://my-api.onrender.com` |

Leave `VITE_API_URL` **empty** for local dev — Vite proxies `/api` to `localhost:3000`.

---

## Option 1 — Docker (any VPS / cloud)

### Backend only

```bash
cd backend
docker build -t salary-mgmt-api .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgres://USER:PASS@HOST:5432/DB" \
  -e CORS_ORIGIN="https://YOUR-FRONTEND-URL" \
  salary-mgmt-api
```

### Frontend only

```bash
cd frontend
docker build -t salary-mgmt-web \
  --build-arg VITE_API_URL=https://YOUR-API-URL .
docker run --rm -p 8080:80 salary-mgmt-web
```

### Full stack locally

```bash
docker compose -f docker-compose.prod.yml up --build
```

- UI: http://localhost:8080  
- API: http://localhost:3000/health  

---

## Option 2 — Render (recommended free tier)

[Render](https://render.com) free tier includes:

- **Web Service** (Docker) for the API — spins down after inactivity (~30s cold start)
- **Static Site** for the frontend
- **PostgreSQL** free for 90 days (then upgrade or migrate DB elsewhere)

### Steps

1. Push this repo to GitHub.
2. Render Dashboard → **New** → **Blueprint** → connect repo.
3. Render reads [`render.yaml`](../render.yaml) and creates three resources.
4. [`render.yaml`](../render.yaml) pre-fills these (no trailing slash):
   - **API** `CORS_ORIGIN` → `https://salary-mgmt-web.onrender.com`
   - **Web** `VITE_API_URL` → `https://salary-mgmt-api.onrender.com`
5. If your Dashboard URLs differ from the service `name`, update both vars to match **Settings → URL** on each service, then **Manual Deploy** the static site (clear build cache).

### What to enter if Render still prompts you

| Variable | Set to | Example |
|----------|--------|---------|
| `CORS_ORIGIN` | Frontend **public** URL (scheme + host, no path, no trailing `/`) | `https://salary-mgmt-web.onrender.com` |
| `VITE_API_URL` | API **public** URL (no trailing `/`) | `https://salary-mgmt-api.onrender.com` |

Find the real URLs after first deploy: **Dashboard → service →** top of the page or **Settings**.

### Manual (without Blueprint)

| Service | Type | Settings |
|---------|------|----------|
| Database | PostgreSQL | Copy **Internal/External URL** |
| API | Web → Docker | Root: `backend`, Dockerfile path default |
| UI | Static Site | Root: `frontend`, Build: `npm ci && npm run build`, Publish: `dist` |

---

## Option 3 — Split across providers

| Layer | Suggested free hosts |
|-------|----------------------|
| **PostgreSQL** | [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app) (credit), Render Postgres |
| **Backend** | [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io), [Koyeb](https://www.koyeb.com) |
| **Frontend** | [Netlify](https://www.netlify.com), [Vercel](https://vercel.com), [Cloudflare Pages](https://pages.cloudflare.com), Render Static |

Example: **Neon** (DB) + **Render** (API Docker) + **Netlify** (frontend).

**Netlify / Vercel frontend**

```bash
cd frontend
# Set in site environment variables:
#   VITE_API_URL=https://your-api.example.com
npm ci && npm run build
# Publish directory: dist
```

Add a `_redirects` or `netlify.toml` SPA fallback:

```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Free hosting comparison (2025–2026)

| Provider | Best for | Free tier notes |
|----------|----------|-----------------|
| **[Render](https://render.com)** | API + static + DB in one place | API sleeps when idle; 750 hrs/mo; Postgres free 90 days |
| **[Neon](https://neon.tech)** | Serverless Postgres | Generous free storage; no credit card on hobby |
| **[Supabase](https://supabase.com)** | Postgres + extras | 500 MB DB; good for side projects |
| **[Vercel](https://vercel.com)** | React static / SSR | Excellent for frontend; not for long-running Node API |
| **[Netlify](https://www.netlify.com)** | Static frontend | 100 GB bandwidth/mo |
| **[Cloudflare Pages](https://pages.cloudflare.com)** | Static frontend | Unlimited static requests; fast CDN |
| **[Railway](https://railway.app)** | API + Postgres | ~$5 trial credit/month; simple Docker deploy |
| **[Fly.io](https://fly.io)** | Docker API | Small VM allowance; more ops-heavy |
| **[Koyeb](https://www.koyeb.com)** | Docker API | Free nano instances |

**Practical recommendation for this project**

1. **Easiest:** Render Blueprint ([`render.yaml`](../render.yaml)) — all three pieces.  
2. **Best long-term free DB:** Neon + Render API + Netlify frontend.  
3. **Self-host / demo:** `docker compose -f docker-compose.prod.yml up --build`.

---

## Post-deploy checklist

- [ ] `GET https://YOUR-API/health` returns `{ "status": "ok", "database": "ok" }`
- [ ] `CORS_ORIGIN` on API matches the frontend URL exactly (scheme + host, no trailing slash)
- [ ] `VITE_API_URL` was set **before** the frontend build
- [ ] Run seed once if you need demo data:  
  `docker run --rm -e DATABASE_URL=... salary-mgmt-api node dist/seed/seed.js --truncate`  
  (or `npm run seed` locally against production DB — careful!)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blueprint: `no such plan free for service type web` on static site | Remove `plan` from the frontend service in `render.yaml`. Static sites are always free on Hobby and do not accept `plan`. Keep `plan: free` only on the **API** web service and **Postgres** database. |
| UI loads but API calls fail (CORS) | Set `CORS_ORIGIN` on API to the exact frontend origin |
| UI calls `localhost:3000` in production | Rebuild frontend with `VITE_API_URL` set |
| API 503 on `/health` | Check `DATABASE_URL` and that Postgres accepts connections |
| Render cold start | First request after idle may take 30–60s on free tier |
