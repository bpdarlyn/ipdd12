from sqlalchemy import Column, String, Date
from sqlalchemy.orm import relationship
from models.base import BaseModel

class Person(BaseModel):
    __tablename__ = "persons"

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    birth_date = Column(Date, nullable=False)
    phone = Column(String(20), nullable=False)
    home_address = Column(String(500), nullable=False)
    google_maps_link = Column(String(1000), nullable=True)

    # Relationships
    led_reports = relationship("Report", back_populates="leader", cascade="all, delete-orphan")
    recurring_meetings = relationship("RecurringMeeting", back_populates="leader", cascade="all, delete-orphan")