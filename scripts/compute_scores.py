import logging
import os

import geopandas as gpd
import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row
from shapely.geometry import Point

from app.services.scoring import site_suitability, vulnerability_index, weighted_hazard_risk

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    with psycopg.connect(database_url, row_factory=dict_row) as connection:
        settlements = connection.execute(
            """
            SELECT id, name, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
            FROM settlements
            ORDER BY id
            """
        ).fetchall()
        if not settlements:
            logger.info("No settlements to score")
            return

        spatial_frame = gpd.GeoDataFrame(
            settlements,
            geometry=[Point(row["lng"], row["lat"]) for row in settlements],
            crs="EPSG:4326",
        )
        if spatial_frame.geometry.is_empty.any() or not spatial_frame.geometry.is_valid.all():
            raise ValueError("Settlement point geometries must be valid")

        factors = connection.execute(
            "SELECT settlement_id, factor_key, risk_score FROM hazard_factors ORDER BY id"
        ).fetchall()
        sites = connection.execute(
            """
            SELECT id, settlement_id, hand_m, area_m2, road_distance_km, m2_per_person,
                   ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat
            FROM candidate_sites
            ORDER BY id
            """
        ).fetchall()

        factors_by_settlement: dict[int, list[dict]] = {}
        for factor in factors:
            factors_by_settlement.setdefault(factor["settlement_id"], []).append(factor)

        site_frame = gpd.GeoDataFrame(
            sites,
            geometry=[Point(row["lng"], row["lat"]) for row in sites],
            crs="EPSG:4326",
        ) if sites else gpd.GeoDataFrame(
            {"id": [], "settlement_id": [], "hand_m": [], "area_m2": [],
             "road_distance_km": [], "m2_per_person": [], "lng": [], "lat": []},
            geometry=[],
            crs="EPSG:4326",
        )
        if not site_frame.empty and (
            site_frame.geometry.is_empty.any() or not site_frame.geometry.is_valid.all()
        ):
            raise ValueError("Candidate site point geometries must be valid")

        risk_updates = []
        for settlement in settlements:
            records = factors_by_settlement.get(settlement["id"], [])
            risk_updates.append((
                weighted_hazard_risk(records),
                vulnerability_index(records),
                settlement["id"],
            ))
        suitability = site_suitability(sites)

        with connection.transaction():
            with connection.cursor() as cursor:
                cursor.executemany(
                    """
                    UPDATE settlements
                    SET risk_score = %s, vulnerability_index = %s, updated_at = now()
                    WHERE id = %s
                    """,
                    risk_updates,
                )
                cursor.executemany(
                    """
                    UPDATE candidate_sites
                    SET suitability_score = %s, capacity = %s
                    WHERE id = %s
                    """,
                    [(row["score"], row["capacity"], row["id"]) for row in suitability],
                )

    logger.info(
        "Updated weighted risk and vulnerability for %s settlements and suitability/capacity for %s sites",
        len(risk_updates),
        len(suitability),
    )


if __name__ == "__main__":
    main()
