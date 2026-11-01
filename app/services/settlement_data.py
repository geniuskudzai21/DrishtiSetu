from fastapi import Request

SETTLEMENT_SELECT = """
    SELECT
        s.id,
        s.name,
        s.district,
        ST_X(s.location::geometry) AS lng,
        ST_Y(s.location::geometry) AS lat,
        s.population AS pop,
        s.vulnerability_index AS vuln,
        s.risk_score AS risk,
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object('k', hf.label, 'v', hf.risk_score) ORDER BY hf.id)
            FROM hazard_factors AS hf
            WHERE hf.settlement_id = s.id AND hf.factor_key <> 'vulnerability'
        ), '[]'::jsonb) AS factors,
        COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'name', cs.name,
                'score', cs.suitability_score,
                'hand', cs.hand_m,
                'area', cs.area_m2,
                'road', cs.road_distance_km,
                'lng', ST_X(cs.location::geometry),
                'lat', ST_Y(cs.location::geometry),
                'capacity', cs.capacity
            ) ORDER BY cs.suitability_score DESC, cs.id)
            FROM candidate_sites AS cs
            WHERE cs.settlement_id = s.id
        ), '[]'::jsonb) AS sites
    FROM settlements AS s
"""


def fetch_settlement(request: Request, settlement_id: int) -> dict | None:
    with request.app.state.db_pool.connection() as connection:
        return connection.execute(
            SETTLEMENT_SELECT + " WHERE s.id = %s",
            (settlement_id,),
        ).fetchone()
