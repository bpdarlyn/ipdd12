from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from utils.database import get_db
from auth.dependencies import get_current_user
from api.v1.schemas.person import PersonCreate, PersonUpdate, PersonResponse
from services.person_service import PersonService

router = APIRouter()

@router.post("/", response_model=PersonResponse)
async def create_person(
    person_data: PersonCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    person_service = PersonService(db)
    person = person_service.create_person(person_data)
    return person

@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    person_service = PersonService(db)
    person = person_service.get_person(person_id)
    
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    return person

@router.get("/", response_model=List[PersonResponse])
async def get_persons(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    person_service = PersonService(db)
    persons = person_service.get_persons(skip=skip, limit=limit)
    return persons

@router.put("/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: int,
    person_data: PersonUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    person_service = PersonService(db)
    person = person_service.update_person(person_id, person_data)
    
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    return person

@router.delete("/{person_id}")
async def delete_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    person_service = PersonService(db)
    success = person_service.delete_person(person_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    return {"message": "Person deleted successfully"}