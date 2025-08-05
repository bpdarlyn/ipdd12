from sqlalchemy.orm import relationship
from models.base import Base, BaseModel
from models.person import Person
from models.report import Report, ReportParticipant, ReportAttachment, ReportType, Currency, ParticipantType

# Add back_populates relationship
Person.led_reports = relationship("Report", back_populates="leader")

__all__ = [
    "Base",
    "BaseModel", 
    "Person",
    "Report",
    "ReportParticipant", 
    "ReportAttachment",
    "ReportType",
    "Currency",
    "ParticipantType"
]