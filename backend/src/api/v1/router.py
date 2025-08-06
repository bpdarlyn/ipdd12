from fastapi import APIRouter
from api.v1.endpoints import auth, persons, reports, recurring_meetings

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(persons.router, prefix="/persons", tags=["Persons"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(recurring_meetings.router, prefix="/recurring-meetings", tags=["Recurring Meetings"])