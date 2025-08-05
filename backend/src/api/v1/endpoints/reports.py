from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from utils.database import get_db
from auth.dependencies import get_current_user
from api.v1.schemas.report import ReportCreate, ReportUpdate, ReportResponse
from services.report_service import ReportService
from services.s3_service import s3_service
from models.report import ReportAttachment
import json

router = APIRouter()

@router.post("/", response_model=ReportResponse)
async def create_report(
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    report_service = ReportService(db)
    report = report_service.create_report(report_data)
    return report

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    report_service = ReportService(db)
    report = report_service.get_report(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return report

@router.get("/", response_model=List[ReportResponse])
async def get_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    report_service = ReportService(db)
    reports = report_service.get_reports(skip=skip, limit=limit)
    return reports

@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: int,
    report_data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    report_service = ReportService(db)
    report = report_service.update_report(report_id, report_data)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return report

@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    report_service = ReportService(db)
    success = report_service.delete_report(report_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return {"message": "Report deleted successfully"}

@router.post("/{report_id}/attachments")
async def upload_attachment(
    report_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Verify report exists
    report_service = ReportService(db)
    report = report_service.get_report(report_id)
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Upload to S3
    file_key = await s3_service.upload_file(file, f"reports/{report_id}/")
    
    # Save attachment record
    attachment = ReportAttachment(
        report_id=report_id,
        file_name=file.filename,
        file_key=file_key,
        file_size=file.size,
        content_type=file.content_type
    )
    
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return {"message": "File uploaded successfully", "attachment_id": attachment.id}

@router.delete("/{report_id}/attachments/{attachment_id}")
async def delete_attachment(
    report_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Get attachment
    attachment = db.query(ReportAttachment).filter(
        ReportAttachment.id == attachment_id,
        ReportAttachment.report_id == report_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )
    
    # Delete from S3
    await s3_service.delete_file(attachment.file_key)
    
    # Delete from database
    db.delete(attachment)
    db.commit()
    
    return {"message": "Attachment deleted successfully"}

@router.get("/{report_id}/attachments/{attachment_id}/download")
async def download_attachment(
    report_id: int,
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Get attachment
    attachment = db.query(ReportAttachment).filter(
        ReportAttachment.id == attachment_id,
        ReportAttachment.report_id == report_id
    ).first()
    
    if not attachment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )
    
    # Generate presigned URL for download
    try:
        download_url = await s3_service.get_file_url(attachment.file_key, expiration=3600)
        return RedirectResponse(url=download_url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate download URL"
        )