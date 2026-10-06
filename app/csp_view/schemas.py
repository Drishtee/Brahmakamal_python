from pydantic import BaseModel


class CSPResponse(BaseModel):
    bank: str | None = None
    csp_code: str | None = None
    csp_name: str | None = None

    state: str | None = None
    territory: str | None = None
    district: str | None = None
    block: str | None = None

    village_id: int | None = None
    village_name: str | None = None

    vatika_id: int | None = None
    physical_vatika_id: int | None = None
    vatika: str | None = None

    block_code: int | None = None
    block_name: str | None = None

    bhk_block_code: int | None = None
    status: str | None = None
    branch: str | None = None

    csp_lat: float | None = None
    csp_long: float | None = None