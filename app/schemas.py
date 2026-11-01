from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class FactorOut(BaseModel):
    k: str
    v: float


class SiteOut(BaseModel):
    name: str
    score: float
    hand: float
    area: float
    road: float
    lng: float
    lat: float
    capacity: int


class SettlementOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    district: str
    lng: float
    lat: float
    pop: int
    vuln: float
    risk: float
    factors: list[FactorOut] = Field(default_factory=list)
    sites: list[SiteOut] = Field(default_factory=list)


class ChatRequest(BaseModel):
    settlement_id: int = Field(alias="settlementId", gt=0)
    message: str = Field(min_length=1, max_length=4000)

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)


class ChatResponse(BaseModel):
    answer: str


class DecisionRequest(BaseModel):
    settlement_id: int = Field(alias="settlementId", gt=0)
    action: Literal["Approved", "Rejected"]

    model_config = ConfigDict(populate_by_name=True)


class DecisionResponse(BaseModel):
    id: int
    settlement_id: int = Field(serialization_alias="settlementId")
    action: Literal["Approved", "Rejected"]
    who: str
    time: str


class AuditEntry(BaseModel):
    settlement_id: int = Field(serialization_alias="settlementId")
    action: str
    who: str
    time: str
