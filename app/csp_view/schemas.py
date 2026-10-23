from pydantic import BaseModel
from typing import Optional


class CSPResponse(BaseModel):
    bank: Optional[str] = None
    csp_code: Optional[str] = None
    csp_name: Optional[str] = None

    state: Optional[str] = None
    territory: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None

    village_id: Optional[int] = None
    village_name: Optional[str] = None

    vatika_id: Optional[int] = None
    physical_vatika_id: Optional[int] = None
    vatika: Optional[str] = None

    block_code: Optional[int] = None
    block_name: Optional[str] = None

    bhk_block_code: Optional[int] = None
    status: Optional[str] = None
    branch: Optional[str] = None

    csp_lat: Optional[float] = None
    csp_long: Optional[float] = None