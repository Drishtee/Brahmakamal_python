from pydantic import BaseModel, Field
from typing import List


# =====================================================
# STATE
# =====================================================

class StateResponse(BaseModel):
    state_code: int
    state_name: str


# =====================================================
# DISTRICT
# =====================================================

class DistrictResponse(BaseModel):
    district_code: int
    district_name: str


# =====================================================
# BLOCK
# =====================================================

class BlockResponse(BaseModel):
    block_code: int
    block_name: str


# =====================================================
# OFFICE
# =====================================================

class OfficeResponse(BaseModel):
    office_id: int
    office_name: str


# =====================================================
# VILLAGE
# =====================================================

class VillageResponse(BaseModel):
    village_code: int
    village_name: str
    hh: int


# =====================================================
# CREATE ROUTE
# =====================================================

class CreateRouteRequest(BaseModel):

    company: str

    state_code: int

    district_code: int

    block_code: int

    office_id: int

    route_name: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    village_ids: List[int]


# =====================================================
# CREATE ROUTE RESPONSE
# =====================================================

class CreateRouteResponse(BaseModel):

    success: bool

    message: str