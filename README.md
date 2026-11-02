# DrishtiSetu

FastAPI flood-relocation decision-support app with a static map interface, Neon/PostGIS database, and document-grounded chat. The included settlement scores are illustrative; this is not a live flood-monitoring or emergency-alert system.

## Deployment layout

- **API:** Render Docker Web Service, configured by `render.yaml`.
- **Frontend:** Vercel static site; `/api/*` requests are proxied to Render.
- **Database:** Neon PostgreSQL with PostGIS.
- **Chat:** OpenRouter with local BM25 retrieval from `docs/knowledge/`.

## Before deploying

1. Rotate credentials shared outside your local `.env`: create a new Neon database password and OpenRouter key, then set a long random `ADMIN_TOKEN`. Never commit `.env` or put secrets in source/config files.
2. In Neon, run `db/schema.sql`. Run `db/seed.sql` once only if you want the illustrative demo settlements and sites; these are not live hazard observations.
3. Confirm your Neon connection string includes `sslmode=require` and connects successfully.
4. Push this repository to a Git provider supported by Render and Vercel.

## Deploy API on Render

1. In Render, choose **New → Blueprint** and connect this repository. Render reads `render.yaml` and creates the Docker web service.
2. When prompted, provide `DATABASE_URL`, `OPENROUTER_API_KEY`, and `ADMIN_TOKEN` using the newly rotated values. Do not put secret values in `render.yaml`.
3. Wait for the first deployment, then check `https://<render-service>.onrender.com/health`. A healthy response is `{"status":"ok"}`.
4. Copy the Render service's public base URL, e.g. `https://drishtisetu-api.onrender.com`.

The Docker image honors Render's `PORT` and includes `docs/knowledge/` for RAG. Render's free service sleeps after inactivity; its first request after sleeping may take about a minute. Free instances are for demos, not emergency or production use.

## Deploy frontend on Vercel

1. Import the same repository into Vercel. Use the repository root as the project root, choose the **Other** framework preset, and leave the build command empty. This is a static HTML/JavaScript site.
2. In `vercel.json`, replace `https://REPLACE_WITH_RENDER_SERVICE.onrender.com` with the Render base URL from the previous section, then commit and push that change. `.vercelignore` ensures only the static page, JavaScript, and Vercel routing config are deployed to Vercel.
3. Deploy (or redeploy) Vercel. The rewrite sends `/api/*`, `/health`, `/docs`, and `/openapi.json` requests to Render; static files continue to be served by Vercel.
4. Open the Vercel URL and test the settlements, map, and assistant. To save officer decisions, enter the same `ADMIN_TOKEN` configured on Render in the Officer access token field.

The browser never receives `DATABASE_URL` or `OPENROUTER_API_KEY`. The officer token is submitted only with decision requests; do not hardcode it in frontend files or Vercel configuration.

## Local development

Run from the repository root in PowerShell:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `DATABASE_URL`, `OPENROUTER_API_KEY`, and a strong `ADMIN_TOKEN` in `.env`, then start the app:

```powershell
python -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/`. API docs: `/docs`; health check: `/health`.

The optional GIS scoring script uses heavier packages isolated in `requirements-scoring.txt`:

```powershell
python -m pip install -r requirements-scoring.txt
python scripts/compute_scores.py
```

## RAG knowledge documents

Add trusted `.pdf`, `.md`, or `.txt` documents under `docs/knowledge/`. Chat retrieves up to three keyword-relevant passages and cites the filename and PDF page. Restart the service after changing documents. Scanned PDFs require OCR. The included NDMA flood guideline is from 2008; it is background guidance, not a live warning or confirmation of current Punjab procedures. See [docs/knowledge/README.md](docs/knowledge/README.md) for provenance.

## API routes

- `GET /api/settlements` and `GET /api/settlements/{id}`
- `GET /api/hazard-zones`
- `POST /api/chat` with `{"settlementId":1,"message":"..."}`
- `POST /api/decisions` with `{"settlementId":1,"action":"Approved"}` and `Authorization: Bearer <ADMIN_TOKEN>`
- `GET /api/audit`

Chat is limited to 10 requests per minute per client IP. Decision creation and its audit entry are stored in one database transaction.
