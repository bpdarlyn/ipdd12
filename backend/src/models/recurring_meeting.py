from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from models.base import BaseModel
from models.report import ReportType
import enum

class Periodicity(str, enum.Enum):
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    DAILY = "DAILY"

class RecurringMeeting(BaseModel):
    __tablename__ = "recurring_meetings"

    meeting_datetime = Column(DateTime, nullable=False)
    leader_person_id = Column(Integer, ForeignKey("persons.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(Enum(ReportType, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    location = Column(String(500), nullable=False)
    description = Column(String(1000), nullable=True)
    google_maps_link = Column(String(1000), nullable=True)
    periodicity = Column(Enum(Periodicity, values_callable=lambda obj: [e.value for e in obj]), nullable=False)

    # Relationships
    leader = relationship("Person", back_populates="recurring_meetings")
    reports = relationship("Report", back_populates="recurring_meeting", cascade="all, delete-orphan")