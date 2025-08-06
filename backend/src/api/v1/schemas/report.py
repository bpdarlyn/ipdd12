from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from models.report import Currency, ParticipantType
from api.v1.schemas.recurring_meeting import RecurringMeetingResponse

class ParticipantBase(BaseModel):
    participant_name: str
    participant_type: ParticipantType

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantResponse(ParticipantBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: int
    file_name: str
    file_key: str
    file_size: int
    content_type: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    registration_date: datetime
    meeting_datetime: datetime
    recurring_meeting_id: int
    leader_person_id: int
    leader_phone: str
    collaborator: Optional[str] = None
    location: str
    collection_amount: Decimal
    currency: Currency
    attendees_count: int
    google_maps_link: Optional[str] = None

class ReportCreate(ReportBase):
    participants: List[ParticipantCreate] = []

class ReportUpdate(BaseModel):
    registration_date: Optional[datetime] = None
    meeting_datetime: Optional[datetime] = None
    recurring_meeting_id: Optional[int] = None
    leader_person_id: Optional[int] = None
    leader_phone: Optional[str] = None
    collaborator: Optional[str] = None
    location: Optional[str] = None
    collection_amount: Optional[Decimal] = None
    currency: Optional[Currency] = None
    attendees_count: Optional[int] = None
    google_maps_link: Optional[str] = None
    participants: Optional[List[ParticipantCreate]] = None

class ReportResponse(ReportBase):
    id: int
    created_at: datetime
    updated_at: datetime
    participants: List[ParticipantResponse] = []
    attachments: List[AttachmentResponse] = []
    recurring_meeting: Optional[RecurringMeetingResponse] = None
    
    class Config:
        from_attributes = True