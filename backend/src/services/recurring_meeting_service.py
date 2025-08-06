from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from models.recurring_meeting import RecurringMeeting
from api.v1.schemas.recurring_meeting import RecurringMeetingCreate, RecurringMeetingUpdate

class RecurringMeetingService:
    def __init__(self, db: Session):
        self.db = db

    def create_recurring_meeting(self, recurring_meeting_data: RecurringMeetingCreate) -> RecurringMeeting:
        recurring_meeting = RecurringMeeting(
            meeting_datetime=recurring_meeting_data.meeting_datetime,
            leader_person_id=recurring_meeting_data.leader_person_id,
            report_type=recurring_meeting_data.report_type,
            location=recurring_meeting_data.location,
            description=recurring_meeting_data.description,
            periodicity=recurring_meeting_data.periodicity,
            google_maps_link=recurring_meeting_data.google_maps_link
        )
        
        self.db.add(recurring_meeting)
        self.db.commit()
        self.db.refresh(recurring_meeting)
        
        # Load the leader relationship
        return self.db.query(RecurringMeeting).options(
            joinedload(RecurringMeeting.leader)
        ).filter(RecurringMeeting.id == recurring_meeting.id).first()

    def get_recurring_meeting(self, recurring_meeting_id: int) -> Optional[RecurringMeeting]:
        return self.db.query(RecurringMeeting).options(
            joinedload(RecurringMeeting.leader)
        ).filter(RecurringMeeting.id == recurring_meeting_id).first()

    def get_recurring_meetings(self, skip: int = 0, limit: int = 100) -> List[RecurringMeeting]:
        return self.db.query(RecurringMeeting).options(
            joinedload(RecurringMeeting.leader)
        ).offset(skip).limit(limit).all()

    def get_recurring_meetings_by_leader(self, leader_person_id: int) -> List[RecurringMeeting]:
        return self.db.query(RecurringMeeting).options(
            joinedload(RecurringMeeting.leader)
        ).filter(RecurringMeeting.leader_person_id == leader_person_id).all()

    def update_recurring_meeting(
        self, 
        recurring_meeting_id: int, 
        recurring_meeting_data: RecurringMeetingUpdate
    ) -> Optional[RecurringMeeting]:
        recurring_meeting = self.get_recurring_meeting(recurring_meeting_id)
        if not recurring_meeting:
            return None
        
        update_data = recurring_meeting_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(recurring_meeting, field):
                setattr(recurring_meeting, field, value)
        
        self.db.commit()
        self.db.refresh(recurring_meeting)
        
        # Return the updated recurring meeting with leader loaded
        return self.db.query(RecurringMeeting).options(
            joinedload(RecurringMeeting.leader)
        ).filter(RecurringMeeting.id == recurring_meeting_id).first()

    def delete_recurring_meeting(self, recurring_meeting_id: int) -> bool:
        recurring_meeting = self.get_recurring_meeting(recurring_meeting_id)
        if not recurring_meeting:
            return False
        
        self.db.delete(recurring_meeting)
        self.db.commit()
        return True