from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from utils.database import get_db
from auth.dependencies import get_current_user
from services.recurring_meeting_service import RecurringMeetingService
from api.v1.schemas.recurring_meeting import (
    RecurringMeetingResponse,
    RecurringMeetingCreate,
    RecurringMeetingUpdate
)

router = APIRouter()

@router.post("/", response_model=RecurringMeetingResponse, status_code=status.HTTP_201_CREATED)
def create_recurring_meeting(
    recurring_meeting: RecurringMeetingCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = RecurringMeetingService(db)
    return service.create_recurring_meeting(recurring_meeting)

@router.get("/", response_model=List[RecurringMeetingResponse])
def get_recurring_meetings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = RecurringMeetingService(db)
    return service.get_recurring_meetings(skip=skip, limit=limit)

@router.get("/{recurring_meeting_id}", response_model=RecurringMeetingResponse)
def get_recurring_meeting(
    recurring_meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = RecurringMeetingService(db)
    recurring_meeting = service.get_recurring_meeting(recurring_meeting_id)
    if not recurring_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring meeting not found"
        )
    return recurring_meeting

@router.get("/leader/{leader_person_id}", response_model=List[RecurringMeetingResponse])
def get_recurring_meetings_by_leader(
    leader_person_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = RecurringMeetingService(db)
    return service.get_recurring_meetings_by_leader(leader_person_id)

@router.put("/{recurring_meeting_id}", response_model=RecurringMeetingResponse)
def update_recurring_meeting(
    recurring_meeting_id: int,
    recurring_meeting_update: RecurringMeetingUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = RecurringMeetingService(db)
    updated_recurring_meeting = service.update_recurring_meeting(
        recurring_meeting_id, recurring_meeting_update
    )
    if not updated_recurring_meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring meeting not found"
        )
    return updated_recurring_meeting

@router.delete("/{recurring_meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_meeting(
    recurring_meeting_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = RecurringMeetingService(db)
    if not service.delete_recurring_meeting(recurring_meeting_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring meeting not found"
        )