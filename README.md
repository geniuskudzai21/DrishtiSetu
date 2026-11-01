# DrishtiSetu

FastAPI service and static frontend for flood-relocation decision support. Targets Python 3.11 and Neon Postgres with PostGIS.

## Configuration

Set these environment variables before starting the API:

```text
DATABASE_URL=postgresql://...
GROQ_API_KEY=...
ADMIN_TOKEN=...
```

`GROQ_API_KEY` is optional; chat uses a local templated answer when it is absent. `ADMIN_TOKEN` must be set to enable officer decisions.

## Database setup

Run `db/schema.sql` in the Neon SQL editor first, followed by `db/seed.sql`. To calculate risk overlays, vulnerability, candidate-site suitability, and capacities from the seeded factor/site values, run:

```powershell
python scripts/compute_scores.py
```

The sample factor scores are illustrative and should be replaced with validated GIS-derived inputs for operational use.

## Run locally

With Python 3.11 installed:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/`. API documentation is at `/docs`; database status is at `/health`.

## API

- `GET /api/settlements` and `GET /api/settlements/{id}`
- `GET /api/hazard-zones` (GeoJSON FeatureCollection)
- `POST /api/chat` with `{"settlementId": 1, "message": "..."}`
- `POST /api/decisions` with `{"settlementId": 1, "action": "Approved"}` and `Authorization: Bearer <ADMIN_TOKEN>`
- `GET /api/audit`

Chat is limited to 10 requests per minute per client IP. Decision creation writes the decision and matching audit entry in one transaction. SQL parameters are bound through psycopg; all API errors return non-stack-trace responses.
