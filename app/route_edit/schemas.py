from typing import List

from pydantic import BaseModel, Field


class StateResponse(BaseModel):
    state_code: int
    state_name: str


class DistrictResponse(BaseModel):
    district_code: int
    district_name: str


class BlockResponse(BaseModel):
    block_code: int
    block_name: str


class RouteResponse(BaseModel):
    route_id: int
    route_name: str


class VillageResponse(BaseModel):
    village_code: int
    village_name: str
    hh: int


class RouteVillagesResponse(BaseModel):
    existing_villages: List[VillageResponse]
    available_villages: List[VillageResponse]


class EditRouteRequest(BaseModel):
    added_village_ids: List[int] = Field(default_factory=list)
    removed_village_ids: List[int] = Field(default_factory=list)


class EditRouteResponse(BaseModel):
    success: bool
    message: str