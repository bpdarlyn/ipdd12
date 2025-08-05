from sqlalchemy.orm import Session
from typing import List, Optional
from models.person import Person
from api.v1.schemas.person import PersonCreate, PersonUpdate

class PersonService:
    def __init__(self, db: Session):
        self.db = db

    def create_person(self, person_data: PersonCreate) -> Person:
        person = Person(
            first_name=person_data.first_name,
            last_name=person_data.last_name,
            birth_date=person_data.birth_date,
            phone=person_data.phone,
            home_address=person_data.home_address,
            google_maps_link=person_data.google_maps_link
        )
        
        self.db.add(person)
        self.db.commit()
        self.db.refresh(person)
        return person

    def get_person(self, person_id: int) -> Optional[Person]:
        return self.db.query(Person).filter(Person.id == person_id).first()

    def get_persons(self, skip: int = 0, limit: int = 100) -> List[Person]:
        return self.db.query(Person).offset(skip).limit(limit).all()

    def update_person(self, person_id: int, person_data: PersonUpdate) -> Optional[Person]:
        person = self.get_person(person_id)
        if not person:
            return None
        
        update_data = person_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(person, field):
                setattr(person, field, value)
        
        self.db.commit()
        self.db.refresh(person)
        return person

    def delete_person(self, person_id: int) -> bool:
        person = self.get_person(person_id)
        if not person:
            return False
        
        self.db.delete(person)
        self.db.commit()
        return True