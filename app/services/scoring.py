from collections.abc import Mapping, Sequence

from sklearn.preprocessing import MinMaxScaler

HAZARD_WEIGHTS = {
    "river_distance": 0.30,
    "hand": 0.25,
    "past_floods": 0.30,
    "land_cover": 0.15,
}
SITE_WEIGHTS = {"hand": 0.45, "area": 0.35, "road": 0.20}


def weighted_hazard_risk(factors: Sequence[Mapping]) -> float:
    weighted_total = 0.0
    available_weight = 0.0
    for factor in factors:
        key = str(factor["factor_key"])
        if key not in HAZARD_WEIGHTS:
            continue
        weight = HAZARD_WEIGHTS[key]
        score = max(0.0, min(100.0, float(factor["risk_score"])))
        weighted_total += score * weight
        available_weight += weight
    return round(weighted_total / available_weight, 2) if available_weight else 0.0


def vulnerability_index(factors: Sequence[Mapping]) -> float:
    values = [
        max(0.0, min(100.0, float(item["risk_score"])))
        for item in factors
        if item["factor_key"] == "vulnerability"
    ]
    return round(sum(values) / len(values), 2) if values else 0.0


def site_suitability(sites: Sequence[Mapping]) -> list[dict]:
    if not sites:
        return []
    raw = [
        [float(site["hand_m"]), float(site["area_m2"]), -float(site["road_distance_km"])]
        for site in sites
    ]
    normalized = MinMaxScaler(feature_range=(0, 100)).fit_transform(raw)
    results = []
    for site, values in zip(sites, normalized, strict=True):
        score = sum(float(value) * SITE_WEIGHTS[key] for value, key in zip(values, SITE_WEIGHTS, strict=True))
        per_person = max(1.0, float(site["m2_per_person"]))
        capacity = int(max(0.0, float(site["area_m2"]) * 0.60) // per_person)
        results.append({"id": site["id"], "score": round(score, 2), "capacity": capacity})
    return results
