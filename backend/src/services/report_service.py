from sqlalchemy.orm import Session
from typing import List, Optional
from models.report import Report, ReportParticipant
from api.v1.schemas.report import ReportCreate, ReportUpdate

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def create_report(self, report_data: ReportCreate) -> Report:
        # Create the main report
        report = Report(
            registration_date=report_data.registration_date,
            meeting_datetime=report_data.meeting_datetime,
            leader_person_id=report_data.leader_person_id,
            leader_phone=report_data.leader_phone,
            collaborator=report_data.collaborator,
            location=report_data.location,
            collection_amount=report_data.collection_amount,
            currency=report_data.currency,
            report_type=report_data.report_type,
            attendees_count=report_data.attendees_count,
            google_maps_link=report_data.google_maps_link
        )
        
        self.db.add(report)
        self.db.flush()  # Get the ID without committing
        
        # Create participants
        for participant_data in report_data.participants:
            participant = ReportParticipant(
                report_id=report.id,
                participant_name=participant_data.participant_name,
                participant_type=participant_data.participant_type
            )
            self.db.add(participant)
        
        self.db.commit()
        self.db.refresh(report)
        return report

    def get_report(self, report_id: int) -> Optional[Report]:
        return self.db.query(Report).filter(Report.id == report_id).first()

    def get_reports(self, skip: int = 0, limit: int = 100) -> List[Report]:
        return self.db.query(Report).offset(skip).limit(limit).all()

    def update_report(self, report_id: int, report_data: ReportUpdate) -> Optional[Report]:
        report = self.get_report(report_id)
        if not report:
            return None
        
        # Update main report fields
        update_data = report_data.dict(exclude_unset=True, exclude={'participants'})
        for field, value in update_data.items():
            if hasattr(report, field):
                setattr(report, field, value)
        
        # Update participants if provided
        if report_data.participants is not None:
            # Delete existing participants
            self.db.query(ReportParticipant).filter(
                ReportParticipant.report_id == report_id
            ).delete()
            
            # Add new participants
            for participant_data in report_data.participants:
                participant = ReportParticipant(
                    report_id=report.id,
                    participant_name=participant_data.participant_name,
                    participant_type=participant_data.participant_type
                )
                self.db.add(participant)
        
        self.db.commit()
        self.db.refresh(report)
        return report

    def delete_report(self, report_id: int) -> bool:
        report = self.get_report(report_id)
        if not report:
            return False
        
        self.db.delete(report)
        self.db.commit()
        return True