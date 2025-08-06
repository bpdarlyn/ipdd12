from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from models.recurring_meeting import Periodicity
from models.report import ReportType
from api.v1.schemas.person import PersonResponse

class RecurringMeetingBase(BaseModel):
    meeting_datetime: datetime
    leader_person_id: int
    report_type: ReportType
    location: str
    description: Optional[str] = None
    periodicity: Periodicity
    google_maps_link: Optional[str] = None

class RecurringMeetingCreate(RecurringMeetingBase):
    pass

class RecurringMeetingUpdate(BaseModel):
    meeting_datetime: Optional[datetime] = None
    leader_person_id: Optional[int] = None
    report_type: Optional[ReportType] = None
    location: Optional[str] = None
    description: Optional[str] = None
    periodicity: Optional[Periodicity] = None
    google_maps_link: Optional[str] = None

class RecurringMeetingResponse(RecurringMeetingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    leader: Optional[PersonResponse] = None
    
    class Config:
        from_attributes = True