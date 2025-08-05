from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class PersonBase(BaseModel):
    first_name: str
    last_name: str
    birth_date: date
    phone: str
    home_address: str
    google_maps_link: Optional[str] = None

class PersonCreate(PersonBase):
    pass

class PersonUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    home_address: Optional[str] = None
    google_maps_link: Optional[str] = None

class PersonResponse(PersonBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True