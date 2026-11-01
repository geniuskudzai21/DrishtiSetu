import json
import logging

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/hazard-zones", tags=["hazards"])
logger = logging.getLogger(__name__)


@router.get("")
def get_hazard_zones(request: Request) -> dict:
    try:
        with request.app.state.db_pool.connection() as connection:
            rows = connection.execute(
                """
                SELECT id, name, properties, ST_AsGeoJSON(geom) AS geometry
                FROM hazard_zones
                ORDER BY id
                """
            ).fetchall()
        features = [
            {
                "type": "Feature",
                "id": row["id"],
                "properties": {"name": row["name"], **row["properties"]},
                "geometry": json.loads(row["geometry"]),
            }
            for row in rows
        ]
        return {"type": "FeatureCollection", "features": features}
    except Exception as exc:
        logger.exception("Could not retrieve hazard zones")
        raise HTTPException(status_code=503, detail="Hazard zone data is temporarily unavailable") from exc
