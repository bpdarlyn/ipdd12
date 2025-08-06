from sqlalchemy.orm import relationship
from models.base import Base, BaseModel
from models.person import Person
from models.report import Report, ReportParticipant, ReportAttachment, ReportType, Currency, ParticipantType
from models.recurring_meeting import RecurringMeeting, Periodicity

# Add back_populates relationship
Person.led_reports = relationship("Report", back_populates="leader")
Person.recurring_meetings = relationship("RecurringMeeting", back_populates="leader")

__all__ = [
    "Base",
    "BaseModel", 
    "Person",
    "Report",
    "ReportParticipant", 
    "ReportAttachment",
    "ReportType",
    "Currency",
    "ParticipantType",
    "RecurringMeeting",
    "Periodicity"
]