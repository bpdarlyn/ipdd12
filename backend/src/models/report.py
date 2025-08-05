from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Enum, Numeric, Text
from sqlalchemy.orm import relationship
from models.base import BaseModel
import enum

class ReportType(str, enum.Enum):
    CELULA = "celula"
    CULTO = "culto"

class Currency(str, enum.Enum):
    USD = "USD"
    BOB = "BOB"

class ParticipantType(str, enum.Enum):
    MEMBER = "M"
    VISITOR = "V" 
    PARTICIPANT = "P"

class Report(BaseModel):
    __tablename__ = "reports"

    registration_date = Column(DateTime, nullable=False)
    meeting_datetime = Column(DateTime, nullable=False)
    leader_person_id = Column(Integer, ForeignKey("persons.id"), nullable=False)
    leader_phone = Column(String(20), nullable=False)
    collaborator = Column(String(200), nullable=True)
    location = Column(String(500), nullable=False)
    collection_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(Enum(Currency), nullable=False)
    report_type = Column(Enum(ReportType), nullable=False)
    attendees_count = Column(Integer, nullable=False)
    google_maps_link = Column(String(1000), nullable=True)

    # Relationships
    leader = relationship("Person", back_populates="led_reports")
    participants = relationship("ReportParticipant", back_populates="report", cascade="all, delete-orphan")
    attachments = relationship("ReportAttachment", back_populates="report", cascade="all, delete-orphan")

class ReportParticipant(BaseModel):
    __tablename__ = "report_participants"

    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    participant_name = Column(String(200), nullable=False)
    participant_type = Column(Enum(ParticipantType), nullable=False)

    # Relationships
    report = relationship("Report", back_populates="participants")

class ReportAttachment(BaseModel):
    __tablename__ = "report_attachments"

    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_key = Column(String(500), nullable=False)  # S3 key
    file_size = Column(Integer, nullable=False)
    content_type = Column(String(100), nullable=False)

    # Relationships
    report = relationship("Report", back_populates="attachments")